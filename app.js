import DataLayer from "./packages/data/index.js";
import { DemoData } from "./demoData.js";

/* ----------------------------------------------------------
   SignalOne.cloud – Frontend Core
   - MetaAuth (Mock + Live)
   - AppState
   - Navigation (Sidebar A – Hauptmodule + Tools + Einstellungen)
   - View Handling & Module Loader
   - Status / Toast / Modal / Loader
----------------------------------------------------------*/

/* ----------------------------------------------------------
   1) META AUTH MOCK (P5 – Demo)
----------------------------------------------------------*/
const MetaAuthMock = (() => {
  const STORAGE_KEY = "signalone_meta_mock_v1";
  let state = {
    connected: false,
    accessToken: null,
    user: null,
  };

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        connected: !!parsed.connected,
      };
    } catch (err) {
      console.warn("[MetaAuthMock] Konnte State nicht laden:", err);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[MetaAuthMock] Konnte State nicht speichern:", err);
    }
  }

  function syncToAppState() {
    AppState.metaConnected = state.connected;
    AppState.meta.accessToken = state.accessToken;
    AppState.meta.user = state.user;
    AppState.meta.mode = state.connected ? "demo" : null;
    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    updateViewSubheaders();
  }

  function init() {
    loadFromStorage();
    syncToAppState();
  }

  function connectWithPopup() {
    showGlobalLoader();
    setTimeout(() => {
      state.connected = true;
      state.accessToken = "demo_access_token_123";
      state.user = {
        id: "1234567890",
        name: "SignalOne Demo User",
      };
      saveToStorage();
      syncToAppState();
      hideGlobalLoader();
      showToast("Meta Ads (Demo) erfolgreich verbunden.", "success");
    }, 600);
  }

  function disconnect() {
    state.connected = false;
    state.accessToken = null;
    state.user = null;
    saveToStorage();
    syncToAppState();
    showToast("Meta-Verbindung getrennt (Demo).", "info");
  }

  return {
    init,
    connectWithPopup,
    disconnect,
  };
})();

/* ----------------------------------------------------------
   2) META AUTH LIVE (P5 – echter Flow via Backend)
----------------------------------------------------------*/
const MetaAuth = (() => {
  const STORAGE_KEY_LIVE = "signalone_meta_live_v1";
  const META_API_BASE = "/api/meta";

  let liveState = {
    connected: false,
    accessToken: null,
    user: null,
    accountId: null,
    accountName: null,
    mode: "live",
  };

  function loadLiveFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LIVE);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      liveState = {
        ...liveState,
        ...parsed,
        connected: !!parsed.connected,
      };
    } catch (err) {
      console.warn("[MetaAuth] Konnte Live-State nicht laden:", err);
    }
  }

  function saveLiveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY_LIVE, JSON.stringify(liveState));
    } catch (err) {
      console.warn("[MetaAuth] Konnte Live-State nicht speichern:", err);
    }
  }

  function syncLiveToAppState() {
    AppState.metaConnected = liveState.connected;
    AppState.meta.accessToken = liveState.accessToken;
    AppState.meta.user = liveState.user;
    AppState.meta.accountId = liveState.accountId;
    AppState.meta.accountName = liveState.accountName;
    AppState.meta.mode = liveState.connected ? "live" : null;

    if (liveState.connected) {
      AppState.settings.demoMode = false;
      AppState.settings.dataMode = "live";
      if (DataLayer && typeof DataLayer.setMode === "function") {
        DataLayer.setMode("auto");
      }
    }

    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    updateViewSubheaders();
  }

  async function postMeta(path, body) {
    const res = await fetch(`${META_API_BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `[MetaAuth] POST ${path} failed: ${res.status} ${res.statusText} ${text}`,
      );
    }
    return res.json();
  }

  async function connectWithDevTokenIfAvailable() {
    const devToken = window.SIGNALONE_META_DEV_TOKEN;
    if (!devToken) return false;

    const [me, accounts] = await Promise.all([
      postMeta("/me", { accessToken: devToken }),
      postMeta("/adaccounts", { accessToken: devToken }),
    ]);

    const rawAccounts = (accounts && accounts.data && accounts.data.data) || [];
    const primary = rawAccounts[0] || null;

    liveState.connected = true;
    liveState.accessToken = devToken;
    liveState.user = me?.data || me || null;
    liveState.accountId = primary?.id || null;
    liveState.accountName = primary?.name || null;
    liveState.mode = "live";

    saveLiveToStorage();
    syncLiveToAppState();
    showToast("Meta Ads (Live-Dev) erfolgreich verbunden.", "success");
    return true;
  }

  function openOAuthPopupAndGetCode() {
    return new Promise((resolve) => {
      const authUrl = window.SIGNALONE_META_OAUTH_URL || "/meta/oauth/start";
      const width = 520;
      const height = 720;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;

      const popup = window.open(
        authUrl,
        "MetaOAuth",
        `width=${width},height=${height},left=${left},top=${top}`,
      );

      if (!popup) {
        showToast(
          "Popup blockiert. Bitte Popups für diese Seite erlauben.",
          "warning",
        );
        resolve(null);
        return;
      }

      let finished = false;
      const timer = setInterval(() => {
        if (popup.closed && !finished) {
          finished = true;
          clearInterval(timer);
          window.removeEventListener("message", onMessage);
          resolve(null);
        }
      }, 500);

      function onMessage(event) {
        const data = event.data || {};
        if (data.source !== "signalone-meta-oauth") return;

        finished = true;
        clearInterval(timer);
        window.removeEventListener("message", onMessage);

        try {
          popup.close();
        } catch {
          // ignore
        }

        if (data.error) {
          console.warn("[MetaAuth] OAuth Error:", data.error);
          resolve(null);
        } else {
          resolve({ code: data.code });
        }
      }

      window.addEventListener("message", onMessage);
    });
  }

  async function connectLive() {
    showGlobalLoader();
    try {
      const usedDev = await connectWithDevTokenIfAvailable();
      if (usedDev) return;

      const result = await openOAuthPopupAndGetCode();
      if (!result || !result.code) {
        showToast("Meta-Verbindung abgebrochen.", "warning");
        return;
      }

      const tokenPayload = await postMeta("/oauth/token", { code: result.code });
      const accessToken =
        tokenPayload.accessToken ||
        tokenPayload.token ||
        tokenPayload.access_token;

      if (!accessToken) {
        throw new Error("Kein Access Token aus /oauth/token erhalten.");
      }

      const [me, accounts] = await Promise.all([
        postMeta("/me", { accessToken }),
        postMeta("/adaccounts", { accessToken }),
      ]);

      const rawAccounts = (accounts && accounts.data && accounts.data.data) || [];
      const primary = rawAccounts[0] || null;

      liveState.connected = true;
      liveState.accessToken = accessToken;
      liveState.user = me?.data || me || null;
      liveState.accountId = primary?.id || null;
      liveState.accountName = primary?.name || null;
      liveState.mode = "live";

      saveLiveToStorage();
      syncLiveToAppState();
      showToast("Meta Ads (Live) erfolgreich verbunden.", "success");
    } catch (err) {
      console.error("[MetaAuth] Live Connect failed:", err);
      pushNotification("error", "Meta Live Connect fehlgeschlagen.", {
        error: String(err && err.message ? err.message : err),
      });
      showToast(
        "Meta Live Connect fehlgeschlagen. Details in den Benachrichtigungen.",
        "error",
      );
    } finally {
      hideGlobalLoader();
    }
  }

  function disconnectLive() {
    liveState.connected = false;
    liveState.accessToken = null;
    liveState.user = null;
    liveState.accountId = null;
    liveState.accountName = null;
    liveState.mode = "live";

    saveLiveToStorage();

    AppState.metaConnected = false;
    AppState.meta.accessToken = null;
    AppState.meta.user = null;
    AppState.meta.accountId = null;
    AppState.meta.accountName = null;
    AppState.meta.mode = null;
    AppState.settings.demoMode = true;
    AppState.settings.dataMode = "auto";

    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    updateViewSubheaders();
    showToast("Meta Live-Verbindung getrennt.", "info");
  }

  async function init() {
    loadLiveFromStorage();

    if (liveState.connected && liveState.accessToken) {
      syncLiveToAppState();
      return;
    }

    MetaAuthMock.init();
    AppState.meta.mode = AppState.metaConnected ? "demo" : null;
    updateMetaStatusUI();
  }

  async function connectWithPopup() {
    if (useDemoMode()) {
      MetaAuthMock.connectWithPopup();
      AppState.meta.mode = "demo";
      return;
    }

    await connectLive();
  }

  function disconnect() {
    if (AppState.meta.mode === "live") {
      disconnectLive();
    } else {
      MetaAuthMock.disconnect();
      AppState.meta.mode = null;
    }
  }

  return {
    init,
    connectWithPopup,
    disconnect,
  };
})();

/* ----------------------------------------------------------
   3) APP STATE
----------------------------------------------------------*/
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    accessToken: null,
    user: null,
    accountId: null,
    accountName: null,
    mode: null,
  },
  selectedBrandId: null,
  selectedCampaignId: null,
  licenseLevel: "free",
  systemHealthy: true,
  notifications: [],
  settings: {
    demoMode: true,
    dataMode: "auto",
    theme: "titanium",
    currency: "EUR",
    defaultRange: "last_30_days",
    cacheTtl: 300,
    devMode: false,
  },
};

/* ----------------------------------------------------------
   4) MODULE REGISTRY & VIEW MAP
----------------------------------------------------------*/
const modules = {
  dashboard: () => import("./packages/dashboard/index.js"),
  creativeLibrary: () => import("./packages/creativeLibrary/index.js"),
  campaigns: () => import("./packages/campaigns/index.js"),
  testingLog: () => import("./packages/testingLog/index.js"),
  sensei: () => import("./packages/sensei/index.js"),
  onboarding: () => import("./packages/onboarding/index.js"),
  team: () => import("./packages/team/index.js"),
  brands: () => import("./packages/brands/index.js"),
  shopify: () => import("./packages/shopify/index.js"),
  reports: () => import("./packages/reports/index.js"),
  creatorInsights: () => import("./packages/creatorInsights/index.js"),
  analytics: () => import("./packages/analytics/index.js"),
  roast: () => import("./packages/roast/index.js"),
  settings: () => import("./packages/settings/index.js"),
  academy: () => import("./packages/academy/index.js"),
};

const viewIdMap = {
  dashboard: "dashboardView",
  creativeLibrary: "creativeLibraryView",
  campaigns: "campaignsView",
  testingLog: "testingLogView",
  sensei: "senseiView",
  reports: "reportsView",
  creatorInsights: "creatorInsightsView",
  analytics: "analyticsView",
  team: "teamView",
  brands: "brandsView",
  shopify: "shopifyView",
  roast: "roastView",
  onboarding: "onboardingView",
  settings: "settingsView",
  academy: "academyView",
};

const modulesRequiringMeta = new Set([
  "dashboard",
  "creativeLibrary",
  "campaigns",
  "testingLog",
  "sensei",
  "roast",
]);

/* ----------------------------------------------------------
   5) HELPERS / FORMATTER
----------------------------------------------------------*/
function useDemoMode() {
  const settings = AppState.settings || {};
  if (settings.demoMode === true) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function getEffectiveBrand() {
  const brands = DemoData.brands || [];
  const id = AppState.selectedBrandId || (brands[0] && brands[0].id);
  return brands.find((b) => b.id === id) || brands[0] || null;
}

function getEffectiveCampaign() {
  const brand = getEffectiveBrand();
  if (!brand) return null;

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const id =
    AppState.selectedCampaignId || (campaigns[0] && campaigns[0].id) || null;
  return campaigns.find((c) => c.id === id) || campaigns[0] || null;
}

function getEffectiveBrandOwnerName() {
  const brand = getEffectiveBrand();
  return brand?.owner || "SignalOne Nutzer";
}

function formatNumber(value) {
  if (value == null || isNaN(value)) return "–";
  return new Intl.NumberFormat("de-DE").format(value);
}

function formatCurrency(value, currency = AppState.settings.currency || "EUR") {
  if (value == null || isNaN(value)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return "–";
  return `${value.toFixed(decimals)} %`;
}

/* ----------------------------------------------------------
   6) TOASTS
----------------------------------------------------------*/
function ensureToastContainer() {
  let el = document.getElementById("toastContainer");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastContainer";
    el.style.position = "fixed";
    el.style.right = "24px";
    el.style.bottom = "24px";
    el.style.zIndex = "1000";
    el.style.display = "flex";
    el.style.flexDirection = "column";
    el.style.gap = "8px";
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info", timeout = 3800) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  toast.className = "sx-toast";
  toast.style.minWidth = "260px";
  toast.style.maxWidth = "360px";
  toast.style.padding = "10px 14px";
  toast.style.borderRadius = "999px";
  toast.style.fontSize = "0.82rem";
  toast.style.display = "flex";
  toast.style.alignItems = "center";
  toast.style.justifyContent = "space-between";
  toast.style.boxShadow =
    "0 16px 40px rgba(15,23,42,0.45),0 0 0 0.5px rgba(255,255,255,0.9) inset";
  toast.style.backdropFilter = "blur(18px)";
  toast.style.border = "1px solid rgba(148,163,184,0.7)";
  toast.style.color = "#0f172a";

  let bg = "rgba(248,250,252,0.96)";
  if (type === "success") bg = "rgba(220,252,231,0.98)";
  if (type === "warning") bg = "rgba(254,243,199,0.98)";
  if (type === "error") bg = "rgba(254,226,226,0.98)";
  toast.style.background = bg;

  toast.innerHTML = `
    ${message}
    <button onclick="this.parentElement.remove()" style="margin-left:8px;font-size:1.2rem;opacity:0.7;cursor:pointer;">×</button>
  `;

  toast.querySelector("button").addEventListener("click", () => {
    container.removeChild(toast);
  });

  container.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, timeout);
  }
}

/* ----------------------------------------------------------
   7) GLOBAL LOADER
----------------------------------------------------------*/
function ensureGlobalLoader() {
  let overlay = document.getElementById("globalLoader");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "globalLoader";
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.display = "none";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "999";
    overlay.style.background =
      "radial-gradient(circle at 0% 0%, rgba(15,23,42,0.85), rgba(15,23,42,0.98))";
    overlay.innerHTML = `
      <div style="text-align:center;color:#e5e7eb;">
        <div style="width:50px;height:50px;border:4px solid rgba(148,163,184,0.4);border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px;"></div>
        <p style="font-size:0.9rem;margin:0;">Lädt...</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showGlobalLoader() {
  const overlay = ensureGlobalLoader();
  overlay.style.display = "flex";
}

function hideGlobalLoader() {
  const overlay = document.getElementById("globalLoader");
  if (overlay) overlay.style.display = "none";
}

/* ----------------------------------------------------------
   8) MODAL
----------------------------------------------------------*/
function openSystemModal(title, bodyHtml) {
  let modal = document.getElementById("systemModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "systemModal";
    modal.style.position = "fixed";
    modal.style.inset = "0";
    modal.style.zIndex = "998";
    modal.style.display = "none";
    modal.style.alignItems = "center";
    modal.style.justifyContent = "center";
    modal.style.background = "rgba(15,23,42,0.75)";
    modal.innerHTML = `
      <div id="systemModalContent" style="
        background:#ffffff;
        border-radius:18px;
        max-width:500px;
        width:90%;
        padding:24px;
        box-shadow:0 32px 90px rgba(15,23,42,0.5);
      ">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h3 id="systemModalTitle" style="margin:0;font-size:1.1rem;font-weight:650;color:#0f172a;"></h3>
          <button id="systemModalClose" style="font-size:1.6rem;opacity:0.7;cursor:pointer;">×</button>
        </div>
        <div id="systemModalBody" style="color:#4b5563;font-size:0.9rem;"></div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeSystemModal();
    });
    document
      .getElementById("systemModalClose")
      .addEventListener("click", closeSystemModal);
  }

  document.getElementById("systemModalTitle").textContent = title;
  document.getElementById("systemModalBody").innerHTML = bodyHtml;
  modal.style.display = "flex";
}

function closeSystemModal() {
  const modal = document.getElementById("systemModal");
  if (modal) modal.style.display = "none";
}

/* ----------------------------------------------------------
   9) STATUS UI UPDATES
----------------------------------------------------------*/
function updateMetaStatusUI() {
  const btn = document.getElementById("metaConnectButton");
  const sidebarBtn = document.getElementById("sidebarMetaConnectButton");

  const connected = AppState.metaConnected;
  const mode = AppState.meta.mode || "none";
  const user = AppState.meta.user || {};

  if (btn) {
    btn.textContent = connected
      ? `✓ Verbunden (${mode === "live" ? "Live" : "Demo"})`
      : "Meta verbinden";
    btn.style.background = connected
      ? "radial-gradient(circle, rgba(34,197,94,0.96), rgba(22,163,74,0.95))"
      : "radial-gradient(circle, rgba(248,113,113,0.98), rgba(220,38,38,0.98))";
  }

  if (sidebarBtn) {
    sidebarBtn.textContent = connected
      ? `✓ ${mode === "live" ? "Live" : "Demo"}`
      : "Meta verbinden";
    sidebarBtn.style.background = connected
      ? "radial-gradient(circle, rgba(34,197,94,0.85), rgba(22,163,74,0.92))"
      : "radial-gradient(circle, rgba(15,23,42,0.98), rgba(30,64,175,0.9))";
  }
}

function ensureSidebarStatusRows() {
  const footer = document.querySelector(".sidebar-footer");
  if (!footer) return;

  let container = footer.querySelector(".sidebar-status-rows");
  if (!container) {
    container = document.createElement("div");
    container.className = "sidebar-status-rows";
    footer.prepend(container);
  }

  container.innerHTML = `
    <div class="sidebar-status-row">
      <span class="status-dot" id="sidebarMetaDot"></span>
      <span id="sidebarMetaStatus">Meta: –</span>
    </div>
    <div class="sidebar-status-row">
      <span class="status-dot" id="sidebarSystemDot"></span>
      <span>System: ok</span>
    </div>
    <div class="sidebar-status-row">
      <span class="status-dot" id="sidebarCampaignDot"></span>
      <span id="sidebarCampaignStatus">Kampagnen: –</span>
    </div>
  `;

  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();
}

function updateSystemHealthUI() {
  const dot = document.getElementById("sidebarSystemDot");
  if (dot) {
    dot.style.background = AppState.systemHealthy ? "#22c55e" : "#ef4444";
  }
}

function updateCampaignHealthUI() {
  const dot = document.getElementById("sidebarCampaignDot");
  const label = document.getElementById("sidebarCampaignStatus");

  if (!AppState.metaConnected && !useDemoMode()) {
    if (dot) dot.style.background = "#6b7280";
    if (label) label.textContent = "Kampagnen: –";
    return;
  }

  if (dot) dot.style.background = "#22c55e";
  if (label) label.textContent = "Kampagnen: ok";
}

function updateTopbarGreeting() {
  const greet = document.getElementById("topbarGreeting");
  if (!greet) return;

  const owner = getEffectiveBrandOwnerName();
  const mode = AppState.meta.mode || "demo";
  const demo = mode === "demo" || useDemoMode();

  greet.textContent = demo
    ? `Guten Abend, ${owner} (Demo)`
    : `Guten Abend, ${owner}`;
}

function ensureTopbarButtons() {
  const right = document.querySelector(".topbar-right");
  if (!right) return;

  if (!document.getElementById("notificationsButton")) {
    const btn = document.createElement("button");
    btn.id = "notificationsButton";
    btn.className = "icon-button";
    btn.title = "Benachrichtigungen";
    btn.innerHTML = `
      <span style="font-size:1.1rem;">🔔</span>
      <span id="notificationsBadge" class="hidden">0</span>
    `;
    right.appendChild(btn);
  }

  if (!document.getElementById("settingsButton")) {
    const btn = document.createElement("button");
    btn.id = "settingsButton";
    btn.className = "icon-button";
    btn.title = "Einstellungen";
    btn.innerHTML = `<span style="font-size:1.1rem;">⚙️</span>`;
    right.appendChild(btn);
  }

  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById("notificationsBadge");
  if (!badge) return;

  const count = AppState.notifications.length;
  if (count > 0) {
    badge.textContent = count;
    badge.classList.remove("hidden");
  } else {
    badge.classList.add("hidden");
  }
}

function pushNotification(level, message, details = {}) {
  AppState.notifications.push({
    level,
    message,
    details,
    ts: new Date(),
  });
  updateNotificationBadge();
}

function updateViewSubheaders() {
  // Placeholder for future subheader updates
}

/* ----------------------------------------------------------
   10) BRAND & CAMPAIGN SELECTS
----------------------------------------------------------*/
function populateBrandSelect() {
  const select = document.getElementById("topbarBrandSelect");
  if (!select) return;

  const brands = DemoData.brands || [];
  select.innerHTML = "";

  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    select.appendChild(opt);
  });

  if (AppState.selectedBrandId) {
    select.value = AppState.selectedBrandId;
  } else if (brands[0]) {
    AppState.selectedBrandId = brands[0].id;
    select.value = brands[0].id;
  }
}

function populateCampaignSelect() {
  const select = document.getElementById("topbarCampaignSelect");
  if (!select) return;

  const brand = getEffectiveBrand();
  if (!brand) {
    select.innerHTML = "<option>Keine Brand ausgewählt</option>";
    return;
  }

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  select.innerHTML = "";

  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });

  if (AppState.selectedCampaignId) {
    select.value = AppState.selectedCampaignId;
  } else if (campaigns[0]) {
    AppState.selectedCampaignId = campaigns[0].id;
    select.value = campaigns[0].id;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = document.getElementById("topbarBrandSelect");
  const campaignSelect = document.getElementById("topbarCampaignSelect");

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      AppState.selectedBrandId = brandSelect.value;
      AppState.selectedCampaignId = null;
      populateCampaignSelect();
      updateTopbarGreeting();
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value;
    });
  }
}

/* ----------------------------------------------------------
   11) NAVIGATION – SIDEBAR RENDERING
----------------------------------------------------------*/
const navStructure = {
  main: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "creativeLibrary", label: "Creatives", icon: "library" },
    { key: "sensei", label: "Sensei", icon: "sensei" },
    { key: "campaigns", label: "Kampagnen", icon: "campaigns" },
    { key: "academy", label: "Academy", icon: "academy" },
  ],
  tools: [
    { key: "testingLog", label: "Testing Log", icon: "testing" },
    { key: "roast", label: "Roast", icon: "roast" },
    { key: "reports", label: "Reports", icon: "reports" },
    { key: "analytics", label: "Analytics", icon: "analytics" },
    { key: "creatorInsights", label: "Creator Insights", icon: "creators" },
  ],
  settings: [
    { key: "team", label: "Team", icon: "team" },
    { key: "brands", label: "Brands", icon: "brands" },
    { key: "shopify", label: "Shopify", icon: "shopify" },
    { key: "settings", label: "System", icon: "settings" },
    { key: "onboarding", label: "Onboarding", icon: "onboarding" },
  ],
};

function navigateTo(moduleKey) {
  if (!moduleKey || AppState.currentModule === moduleKey) return;

  if (
    modulesRequiringMeta.has(moduleKey) &&
    !AppState.metaConnected &&
    !useDemoMode()
  ) {
    showToast("Bitte Meta verbinden oder Demo-Modus nutzen.", "warning");
    return;
  }

  AppState.currentModule = moduleKey;
  setActiveNavItem(moduleKey);
  const viewId = getViewIdForModule(moduleKey);
  setActiveView(viewId);
  loadModule(moduleKey);
}

function createNavButton(item, nested = false) {
  const btn = document.createElement("button");
  btn.className =
    "sidebar-nav-button" + (nested ? " sidebar-nav-button-nested" : "");
  btn.setAttribute("data-module", item.key);
  btn.setAttribute("data-icon", item.icon || "");

  const hasIcon = !!item.icon;
  btn.innerHTML = `
    ${
      hasIcon
        ? `<span class="sidebar-btn-icon">
             <svg viewBox="0 0 24 24" aria-hidden="true">
               <use href="#icon-${item.icon}"></use>
             </svg>
           </span>`
        : ""
    }
    <span class="sidebar-nav-label">${item.label}</span>
  `;

  btn.addEventListener("click", () => navigateTo(item.key));
  return btn;
}

function renderCollapsibleGroup(rootUl, labelText, items, groupKey, initiallyOpen) {
  // LABEL
  const labelLi = document.createElement("li");
  labelLi.className = "sidebar-section-label";
  labelLi.textContent = labelText;
  labelLi.dataset.groupKey = groupKey;
  rootUl.appendChild(labelLi);

  // GROUP CONTAINER
  const groupLi = document.createElement("li");
  groupLi.className = "sidebar-group";
  groupLi.dataset.groupKey = groupKey;

  // INNER LIST
  const innerUl = document.createElement("ul");
  innerUl.className = "sidebar-group-list";
  innerUl.style.margin = "0";
  innerUl.style.padding = "0";
  innerUl.style.listStyle = "none";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item sidebar-nav-item-nested";
    li.appendChild(createNavButton(item, true));
    innerUl.appendChild(li);
  });

  groupLi.appendChild(innerUl);
  rootUl.appendChild(groupLi);

  // SET INITIAL STATE
  const open = !!initiallyOpen;
  
  // Warte bis DOM bereit ist, dann setze die Höhe
  setTimeout(() => {
    const fullHeight = innerUl.scrollHeight;
    
    if (open) {
      groupLi.classList.add("open");
      groupLi.classList.remove("collapsed");
      labelLi.classList.add("open");
      groupLi.style.height = `${fullHeight}px`;
    } else {
      groupLi.classList.add("collapsed");
      groupLi.classList.remove("open");
      labelLi.classList.remove("open");
      groupLi.style.height = "0px";
    }
  }, 0);

  // TOGGLE EVENT
  labelLi.addEventListener("click", () => {
    const isCurrentlyOpen = groupLi.classList.contains("open");
    const fullHeight = innerUl.scrollHeight;
    
    if (isCurrentlyOpen) {
      // CLOSE
      groupLi.style.height = `${fullHeight}px`; // Set explicit height first
      requestAnimationFrame(() => {
        groupLi.style.height = "0px";
        groupLi.classList.remove("open");
        groupLi.classList.add("collapsed");
        labelLi.classList.remove("open");
      });
    } else {
      // OPEN
      groupLi.classList.remove("collapsed");
      groupLi.classList.add("open");
      labelLi.classList.add("open");
      groupLi.style.height = `${fullHeight}px`;
    }
  });
}

function renderNav() {
  const root =
    document.getElementById("sidebarNav") ||
    document.getElementById("navbar");
  if (!root) return;

  root.innerHTML = "";

  // MAIN MODULES
  navStructure.main.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.appendChild(createNavButton(item, false));
    root.appendChild(li);
  });

  // COLLAPSIBLE GROUPS
  renderCollapsibleGroup(root, "TOOLS", navStructure.tools, "tools", false);
  renderCollapsibleGroup(
    root,
    "EINSTELLUNGEN",
    navStructure.settings,
    "settings",
    false,
  );

  setActiveNavItem(AppState.currentModule);
}

function setActiveNavItem(moduleKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button[data-module]");
  buttons.forEach((btn) => {
    if (btn.getAttribute("data-module") === moduleKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/* ----------------------------------------------------------
   12) VIEW HANDLING & MODULE LOADER
----------------------------------------------------------*/
function setActiveView(viewIdOrModuleKey) {
  const viewId = viewIdMap[viewIdOrModuleKey] || viewIdOrModuleKey;
  const allViews = document.querySelectorAll(".view");
  allViews.forEach((v) => v.classList.remove("is-active"));

  const target = document.getElementById(viewId);
  if (target) {
    target.classList.add("is-active");
  }
}

async function loadModule(moduleKey) {
  const loader = modules[moduleKey];
  if (!loader) {
    console.warn("[ModuleLoader] Unbekanntes Modul:", moduleKey);
    return;
  }

  try {
    const mod = await loader();
    const initFn = mod.default?.init || mod.init;
    if (typeof initFn === "function") {
      const brand = getEffectiveBrand();
      const campaign = getEffectiveCampaign();

      await initFn({
        AppState,
        DemoData,
        DataLayer,
        brand,
        campaign,
        useDemoMode,
        formatNumber,
        formatCurrency,
        formatPercent,
      });
    }
  } catch (err) {
    console.error("[ModuleLoader] Fehler beim Laden:", moduleKey, err);
    pushNotification("error", `Modul ${moduleKey} konnte nicht geladen werden.`, {
      error: String(err && err.message ? err.message : err),
    });
    showToast(
      `Modul "${moduleKey}" konnte nicht geladen werden. Details in den Benachrichtigungen.`,
      "error",
    );
  }
}

/* ----------------------------------------------------------
   13) META CONNECT TOGGLE
----------------------------------------------------------*/
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuth.disconnect();
  } else {
    MetaAuth.connectWithPopup();
  }
}

/* ----------------------------------------------------------
   14) TESTING LOG API (simplified)
----------------------------------------------------------*/
const TestingLogAPI = (() => {
  let entries = [];

  function log(eventType, payload = {}) {
    const entry = {
      ts: new Date(),
      type: eventType,
      ...payload,
    };
    entries.push(entry);
    console.log("[TestingLog]", entry);
  }

  function getAll() {
    return entries;
  }

  return {
    log,
    getAll,
  };
})();

/* ----------------------------------------------------------
   15) DOMCONTENTLOADED – BOOTSTRAP
----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  MetaAuth.init().catch((err) =>
    console.error("[MetaAuth] Init Fehler:", err),
  );

  ensureTopbarButtons();
  ensureSidebarStatusRows();

  renderNav();

  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);

  document
    .getElementById("metaConnectButton")
    ?.addEventListener("click", () => {
      toggleMetaConnection();
    });

  document
    .getElementById("sidebarMetaConnectButton")
    ?.addEventListener("click", () => {
      toggleMetaConnection();
    });

  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();
  updateViewSubheaders();

  const settingsBtn = document.getElementById("settingsButton");
  settingsBtn?.addEventListener("click", () => {
    openSystemModal(
      "System Einstellungen",
      `
<p>Aktuell angemeldet als</p>
<p><strong>${getEffectiveBrandOwnerName()}</strong>.</p>
<p>(Simulierter Nutzer)</p>
      `,
    );
  });

  const notificationsBtn = document.getElementById("notificationsButton");
  notificationsBtn?.addEventListener("click", () => {
    if (!AppState.notifications.length) {
      openSystemModal(
        "Benachrichtigungen",
        `
<p>Keine Fehler oder kritischen Warnungen vorhanden.</p>
        `,
      );
    } else {
      const items = AppState.notifications
        .map(
          (n) => `
<div style="margin-bottom:12px;padding:10px;border-left:3px solid ${
            n.level === "error" ? "#ef4444" : "#f59e0b"
          };background:rgba(243,244,246,0.5);">
  <strong>${n.level.toUpperCase()}</strong>: ${n.message}
</div>
          `,
        )
        .join("");
      openSystemModal("Fehler & Warnungen", items);
    }
  });

  console.log("[SignalOne] App initialisiert.");
});

/* ----------------------------------------------------------
   EXPORTS
----------------------------------------------------------*/
window.SignalOneApp = {
  AppState,
  navigateTo,
  TestingLogAPI,
  showToast,
  openSystemModal,
  closeSystemModal,
};
