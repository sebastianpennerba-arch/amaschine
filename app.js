import DataLayer from "./packages/data/index.js";
import { DemoData } from "./demoData.js";

/* ----------------------------------------------------------
   SignalOne.cloud – Frontend Core (FULL REWRITE)
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
      const authUrl =
        window.SIGNALONE_META_OAUTH_URL || "/meta/oauth/start";

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
    <span>${message}</span>
    <button style="
      margin-left:12px;
      border:none;
      background:transparent;
      cursor:pointer;
      font-size:0.8rem;
      color:#6b7280;
    ">&times;</button>
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
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;color:#e5e7eb;">
        <div style="
          width:42px;
          height:42px;
          border-radius:999px;
          border:3px solid rgba(148,163,184,0.6);
          border-top-color:#d4af37;
          animation: spinLoader 0.9s linear infinite;
        "></div>
        <div style="font-size:0.78rem;letter-spacing:0.18em;text-transform:uppercase;">
          SignalOne lädt...
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement("style");
    style.textContent = `
      @keyframes spinLoader {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
  return overlay;
}

function showGlobalLoader() {
  const overlay = ensureGlobalLoader();
  overlay.style.display = "flex";
}

function hideGlobalLoader() {
  const overlay = ensureGlobalLoader();
  overlay.style.display = "none";
}

/* ----------------------------------------------------------
   8) SYSTEM MODAL
----------------------------------------------------------*/
function openSystemModal(title, html) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = html || "";
  overlay.classList.remove("hidden");
}

function closeSystemModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}

/* ----------------------------------------------------------
   9) NOTIFICATIONS
----------------------------------------------------------*/
function pushNotification(type, message, meta = {}) {
  AppState.notifications.push({ type, message, meta, ts: Date.now() });
  const countEl = document.getElementById("notificationsBadge");
  if (countEl) {
    countEl.textContent = String(AppState.notifications.length);
    countEl.classList.remove("hidden");
  }
}

function clearNotifications() {
  AppState.notifications = [];
  const countEl = document.getElementById("notificationsBadge");
  if (countEl) {
    countEl.textContent = "";
    countEl.classList.add("hidden");
  }
}

/* ----------------------------------------------------------
   10) STATUS / TOPBAR UI
----------------------------------------------------------*/
function updateSystemHealthUI() {
  const row = document.getElementById("systemHealthText");
  if (row) {
    row.textContent = AppState.systemHealthy ? "System Health: OK" : "System Health: Problem";
  }
}

function updateMetaStatusUI() {
  const txt = document.getElementById("metaStatusText");
  const dot = document.getElementById("metaStatusDot");
  const btns = [];
  const topBtn = document.getElementById("metaConnectButton");
  if (topBtn) btns.push(topBtn);
  const sideBtn = document.getElementById("sidebarMetaConnectButton");
  if (sideBtn) btns.push(sideBtn);

  const connected = AppState.metaConnected;
  if (txt) {
    txt.textContent = connected ? "Meta Ads: Verbunden" : "Meta Ads: Getrennt";
  }
  if (dot) {
    dot.style.background = connected ? "#22c55e" : "#6b7280";
  }
  btns.forEach((btn) => {
    btn.textContent = connected ? "Meta trennen" : "Meta verbinden";
  });
}

function updateCampaignHealthUI() {
  const txt = document.getElementById("campaignHealthText");
  if (!txt) return;

  const brand = getEffectiveBrand();
  if (!brand) {
    txt.textContent = "Campaign Health: n/a";
    return;
  }

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  if (!campaigns.length) {
    txt.textContent = "Campaign Health: n/a";
    return;
  }

  // Simple Dummy-Logik
  const avgHealth =
    campaigns.reduce((sum, c) => sum + (c.healthScore || 60), 0) /
    campaigns.length;

  let label = "Campaign Health: n/a";
  if (avgHealth >= 80) label = "Campaign Health: strong";
  else if (avgHealth >= 60) label = "Campaign Health: ok";
  else label = "Campaign Health: weak";

  txt.textContent = label;
}

function updateTopbarGreeting() {
  const el = document.getElementById("topbarGreeting");
  if (!el) return;

  const now = new Date();
  const hour = now.getHours();
  let greeting = "Guten Tag";

  if (hour < 5) greeting = "Guten Abend";
  else if (hour < 11) greeting = "Guten Morgen";
  else if (hour < 18) greeting = "Guten Tag";
  else greeting = "Guten Abend";

  const name =
    AppState.meta.user?.name ||
    getEffectiveBrandOwnerName() ||
    "SignalOne Nutzer";

  el.textContent = `${greeting}, ${name}`;
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  const now = new Date();

  if (dateEl) {
    dateEl.textContent = now.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
}

function updateViewSubheaders() {
  const brand = getEffectiveBrand();
  const campaign = getEffectiveCampaign();

  document
    .querySelectorAll("[data-subheader-brand-name]")
    .forEach((el) => (el.textContent = brand?.name || "Marke auswählen"));

  document
    .querySelectorAll("[data-subheader-brand-owner]")
    .forEach((el) => (el.textContent = brand?.owner || "SignalOne Nutzer"));

  document
    .querySelectorAll("[data-subheader-campaign-name]")
    .forEach((el) => (el.textContent = campaign?.name || "Kampagne auswählen"));
}

/* ----------------------------------------------------------
   11) BRAND / CAMPAIGN SELECTS
----------------------------------------------------------*/
function populateBrandSelect() {
  const select = document.getElementById("brandSelect");
  if (!select) return;

  const brands = DemoData.brands || [];
  select.innerHTML = "";
  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    select.appendChild(opt);
  });

  const defaultBrand = getEffectiveBrand();
  if (defaultBrand) {
    select.value = defaultBrand.id;
    AppState.selectedBrandId = defaultBrand.id;
  }
}

function populateCampaignSelect() {
  const select = document.getElementById("campaignSelect");
  if (!select) return;

  const brand = getEffectiveBrand();
  if (!brand) {
    select.innerHTML = "";
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

  const effective = getEffectiveCampaign();
  if (effective) {
    select.value = effective.id;
    AppState.selectedCampaignId = effective.id;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignSelect");

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      AppState.selectedBrandId = brandSelect.value || null;
      AppState.selectedCampaignId = null;
      populateCampaignSelect();
      updateViewSubheaders();
      if (AppState.currentModule) {
        loadModule(AppState.currentModule);
      }
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      updateViewSubheaders();
      if (AppState.currentModule) {
        loadModule(AppState.currentModule);
      }
    });
  }
}

/* ----------------------------------------------------------
   12) NAVIGATION / SIDEBAR – Design A
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
    { key: "settings", label: "Einstellungen", icon: "settings" },
    { key: "onboarding", label: "Onboarding", icon: "onboarding" },
  ],
};

function navigateTo(moduleKey) {
  if (!moduleKey || AppState.currentModule === moduleKey) return;

  if (modulesRequiringMeta.has(moduleKey) && !AppState.metaConnected && !useDemoMode()) {
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
  const labelLi = document.createElement("li");
  labelLi.className = "sidebar-section-label";
  labelLi.textContent = labelText;
  labelLi.dataset.groupKey = groupKey;
  rootUl.appendChild(labelLi);

  const groupLi = document.createElement("li");
  groupLi.className = "sidebar-group";
  groupLi.dataset.groupKey = groupKey;

  const innerUl = document.createElement("ul");
  innerUl.className = "sidebar-group-list";

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item sidebar-nav-item-nested";
    li.appendChild(createNavButton(item, true));
    innerUl.appendChild(li);
  });

  groupLi.appendChild(innerUl);
  rootUl.appendChild(groupLi);

  const open = !!initiallyOpen;
  if (open) {
    groupLi.classList.add("open");
    labelLi.classList.add("open");
    const h = innerUl.getBoundingClientRect().height;
    groupLi.style.height = `${h}px`;
  } else {
    groupLi.classList.remove("open");
    labelLi.classList.remove("open");
    groupLi.style.height = "0px";
  }

  labelLi.addEventListener("click", () => {
    const isOpen = groupLi.classList.toggle("open");
    labelLi.classList.toggle("open", isOpen);
    if (isOpen) {
      const h = innerUl.getBoundingClientRect().height;
      groupLi.style.height = `${h}px`;
    } else {
      groupLi.style.height = "0px";
    }
  });
}

function renderNav() {
  const root =
    document.getElementById("sidebarNav") ||
    document.getElementById("navbar");
  if (!root) return;

  root.innerHTML = "";

  navStructure.main.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.appendChild(createNavButton(item, false));
    root.appendChild(li);
  });

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
   13) VIEW HANDLING & MODULE LOADER
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
   14) META CONNECT TOGGLE
----------------------------------------------------------*/
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuth.disconnect();
  } else {
    MetaAuth.connectWithPopup();
  }
}

/* ----------------------------------------------------------
   15) TESTING LOG API (simplified)
----------------------------------------------------------*/
const TestingLogAPI = (() => {
  let entries = [];

  function log(eventType, payload = {}) {
    const entry = {
      ts: new Date().toISOString(),
      eventType,
      payload,
    };
    entries.push(entry);
    if (entries.length > 500) entries = entries.slice(-500);
    console.info("[TestingLog]", entry);
  }

  function getAll() {
    return [...entries];
  }

  function clear() {
    entries = [];
  }

  return {
    log,
    getAll,
    clear,
  };
})();

/* ----------------------------------------------------------
   16) DOMCONTENTLOADED – BOOTSTRAP
----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  MetaAuth.init().catch((err) =>
    console.error("[MetaAuth] Init Fehler:", err),
  );

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
  settingsBtn?.addEventListener("click", () => navigateTo("settings"));

  const modalCloseBtn = document.getElementById("modalCloseButton");
  const modalOverlay = document.getElementById("modalOverlay");
  modalCloseBtn?.addEventListener("click", closeSystemModal);
  modalOverlay?.addEventListener("click", (evt) => {
    if (evt.target === modalOverlay) closeSystemModal();
  });

  const profileBtn = document.getElementById("profileButton");
  profileBtn?.addEventListener("click", () => {
    openSystemModal(
      "Profil",
      `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>
       <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">(Simulierter Nutzer)</p>`,
    );
  });

  const notificationsBtn = document.getElementById("notificationsButton");
  notificationsBtn?.addEventListener("click", () => {
    if (!AppState.notifications.length) {
      openSystemModal(
        "Benachrichtigungen",
        "<p>Keine Fehler oder kritischen Warnungen vorhanden.</p>",
      );
    } else {
      const items = AppState.notifications
        .map(
          (n) =>
            `<li><strong>[${n.type.toUpperCase()}]</strong> ${n.message}</li>`,
        )
        .join("");
      openSystemModal(
        "Benachrichtigungen",
        `<p>Fehler & Warnungen:</p><ul>${items}</ul>`,
      );
    }
    clearNotifications();
  });

  const logoutBtn = document.getElementById("logoutButton");
  logoutBtn?.addEventListener("click", () => {
    MetaAuth.disconnect();
    showToast("Session zurückgesetzt.", "success");
  });

  updateTopbarDateTime();
  updateTopbarGreeting();
   
   // Update the greeting and clock exactly on minute changes to avoid drift
  let topbarRefreshTimeout = null;
  const scheduleTopbarRefresh = () => {
    const now = new Date();
    const msToNextMinute =
      (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    if (topbarRefreshTimeout) {
      clearTimeout(topbarRefreshTimeout);
    }

    topbarRefreshTimeout = setTimeout(() => {
      updateTopbarDateTime();
      updateTopbarGreeting();
      scheduleTopbarRefresh();
    }, Math.max(msToNextMinute, 1000));
  };

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      updateTopbarDateTime();
      updateTopbarGreeting();
      scheduleTopbarRefresh();
    }
  });

  scheduleTopbarRefresh();

  loadModule(AppState.currentModule);
});

/* ----------------------------------------------------------
   17) EXPOSED GLOBAL API
----------------------------------------------------------*/
window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
  TestingLog: TestingLogAPI,
  DataLayer,
  UI: {
    showGlobalLoader,
    hideGlobalLoader,
    useDemoMode,
  },
};
