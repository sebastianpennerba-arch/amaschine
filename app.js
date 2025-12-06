import DataLayer from "./packages/data/index.js";

/* ----------------------------------------------------------
   SignalOne.cloud â€“ Frontend Core (Turbo Launch)
   - View Handling
   - MetaAuth (Demo + Live)
   - Toast / Modal / Status
   - Module Loader (Packages)
   - TestingLog API
-----------------------------------------------------------*/

/* ----------------------------------------------------------
   1) META AUTH MOCK (P5 â€“ Demo)
-----------------------------------------------------------*/
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
    // Simulierter OAuth-Flow
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
   2) META AUTH LIVE (P5 â€“ echter Flow via Backend)
-----------------------------------------------------------*/
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

    // Wenn Live-Connect aktiv â†’ Demo-Mode aus
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
          "Popup blockiert. Bitte Popups fÃ¼r diese Seite erlauben.",
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
-----------------------------------------------------------*/
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    accessToken: null,
    user: null,
    accountId: null,
    accountName: null,
    mode: null, // "demo" | "live"
  },
  selectedBrandId: null,
  selectedCampaignId: null,
  licenseLevel: "free",
  systemHealthy: true,
  notifications: [],
  settings: {
    demoMode: true,
    dataMode: "auto", // "auto" | "live" | "demo"
    theme: "titanium",
    currency: "EUR",
    defaultRange: "last_30_days",
    cacheTtl: 300,
    devMode: false,
  },
};

/* ----------------------------------------------------------
   4) DEMO DATA (Brands / Campaigns)
-----------------------------------------------------------*/
import { DemoData } from "./demoData.js";

/* ----------------------------------------------------------
   5) MODULE REGISTRY & VIEW MAP
-----------------------------------------------------------*/
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
  academy: () => import('./packages/academy/index.js'),
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
};

// Views, die Meta (Demo oder Live) brauchen
const modulesRequiringMeta = new Set([
  "dashboard",
  "creativeLibrary",
  "campaigns",
  "testingLog",
  "sensei",
  "roast",
]);

/* ----------------------------------------------------------
   6) HELPERS: DEMO/LIVE MODES & BRAND/CAMPAIGN CONTEXT
-----------------------------------------------------------*/
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

/* ----------------------------------------------------------
   7) NAVIGATION / SIDEBAR
-----------------------------------------------------------*/
const navItems = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "creativeLibrary", label: "Creatives", icon: "library" },
  { key: "campaigns", label: "Kampagnen", icon: "campaigns" },
  { key: "sensei", label: "Sensei", icon: "sensei" },
  { key: "testingLog", label: "Testing Log", icon: "testing" },
  { key: "reports", label: "Reports", icon: "reports" },
  { key: "creatorInsights", label: "Creator", icon: "creators" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "team", label: "Team", icon: "team" },
  { key: "brands", label: "Brands", icon: "brands" },
  { key: "shopify", label: "Shopify", icon: "shopify" },
  { key: "roast", label: "Roast", icon: "roast" },
  { key: "onboarding", label: "Onboarding", icon: "onboarding" },
  { key: "settings", label: "Settings", icon: "settings" },
];

function renderNav() {
  const ul = document.getElementById("navbar");
  if (!ul) return;

  ul.innerHTML = "";
  navItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";

    const btn = document.createElement("button");
    btn.className = "sidebar-nav-button";
    btn.setAttribute("data-module", item.key);

    btn.innerHTML = `
      <span class="sidebar-nav-icon">
        <svg aria-hidden="true" class="icon-svg" width="20" height="20">
          <use href="#icon-${item.icon}"></use>
        </svg>
      </span>
      <span class="label sidebar-nav-label">${item.label}</span>
    `;

    btn.addEventListener("click", () => navigateTo(item.key));

    li.appendChild(btn);
    ul.appendChild(li);
  });

  setActiveNavItem(AppState.currentModule);
}

function setActiveNavItem(moduleKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button");
  buttons.forEach((btn) => {
    if (btn.getAttribute("data-module") === moduleKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/* ----------------------------------------------------------
   8) VIEW HANDLING & SKELETON
-----------------------------------------------------------*/
function setActiveView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach((view) => {
    if (view.id === viewId) {
      view.classList.remove("hidden");
      view.classList.add("is-active");
    } else {
      view.classList.add("hidden");
      view.classList.remove("is-active");
    }
  });
}

function applySectionSkeleton(section) {
  if (!section) return;
  section.innerHTML = `
    <div class="view-inner skeleton-view">
      <div class="skeleton-block skeleton-header"></div>
      <div class="skeleton-grid">
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
        <div class="skeleton-block"></div>
      </div>
    </div>
  `;
}

/* ----------------------------------------------------------
   9) TOASTS
-----------------------------------------------------------*/
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
    }, 180);
  }, 3200);
}

/* ----------------------------------------------------------
   10) MODAL
-----------------------------------------------------------*/
function openSystemModal(title, bodyHtml) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  overlay.classList.remove("hidden");
}

function closeSystemModal() {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  overlay.classList.add("hidden");
  titleEl.textContent = "";
  bodyEl.innerHTML = "";
}

/* ----------------------------------------------------------
   11) GLOBAL LOADER
-----------------------------------------------------------*/
function showGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.remove("hidden");
}

function hideGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.add("hidden");
}

/* ----------------------------------------------------------
   12) STATUS-UI (Sidebar / Health / Meta)
-----------------------------------------------------------*/
function updateSystemHealthUI() {
  const dot = document.getElementById("sidebarSystemDot");
  const label = document.getElementById("sidebarSystemLabel");
  if (!dot || !label) return;

  if (AppState.systemHealthy) {
    dot.style.backgroundColor = "var(--color-success)";
    label.textContent = "System Health: OK";
  } else {
    dot.style.backgroundColor = "var(--color-danger)";
    label.textContent = "System Health: Probleme";
  }
}

function updateCampaignHealthUI() {
  const dot = document.getElementById("sidebarCampaignDot");
  const label = document.getElementById("sidebarCampaignLabel");
  if (!dot || !label) return;

  if (!AppState.metaConnected && !useDemoMode()) {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Campaign Health: n/a";
    return;
  }

  dot.style.backgroundColor = "var(--color-success)";
  label.textContent = "Campaign Health: OK";
}

function updateMetaStatusUI() {
  const dot = document.getElementById("sidebarMetaDot");
  const label = document.getElementById("sidebarMetaLabel");
  const btn = document.getElementById("metaConnectButton");
  if (!dot || !label) return;

  if (AppState.metaConnected) {
    dot.style.backgroundColor = "var(--color-success)";
    const mode = AppState.meta?.mode || (useDemoMode() ? "demo" : "live");
    const modeLabel = mode === "live" ? "Live" : "Demo";
    label.textContent = `Meta Ads: Verbunden (${modeLabel})`;
    if (btn) btn.textContent = "META TRENnen".toUpperCase();
  } else {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Meta Ads: Getrennt";
    if (btn) btn.textContent = "META VERBINDEN";
  }
}

/* ----------------------------------------------------------
   13) TOPBAR (Datum/Zeit, Greeting)
-----------------------------------------------------------*/
function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  if (!dateEl || !timeEl) return;

  const now = new Date();
  const dateStr = now.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeStr = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  dateEl.textContent = dateStr;
  timeEl.textContent = timeStr;
}

function updateTopbarGreeting() {
  const el = document.getElementById("topbarGreeting");
  if (!el) return;

  const now = new Date();
  const hour = now.getHours();
  let prefix = "Guten Tag";

  if (hour < 11) prefix = "Guten Morgen";
  else if (hour >= 18) prefix = "Guten Abend";

  const name =
    (AppState.meta && AppState.meta.user && AppState.meta.user.name) ||
    getEffectiveBrandOwnerName();

  el.textContent = `${prefix}, ${name}`;
}

/* ----------------------------------------------------------
   14) BRAND & CAMPAIGN SELECTS
-----------------------------------------------------------*/
function populateBrandSelect() {
  const select = document.getElementById("brandSelect");
  if (!select) return;

  const brands = DemoData.brands || [];
  select.innerHTML = "";

  brands.forEach((brand) => {
    const opt = document.createElement("option");
    opt.value = brand.id;
    opt.textContent = brand.name;
    select.appendChild(opt);
  });

  const defaultId = AppState.selectedBrandId || (brands[0] && brands[0].id);
  if (defaultId) {
    select.value = defaultId;
    AppState.selectedBrandId = defaultId;
  }
}

function populateCampaignSelect() {
  const select = document.getElementById("campaignSelect");
  if (!select) return;

  const brand = getEffectiveBrand();
  const campaigns = (brand && DemoData.campaignsByBrand[brand.id]) || [];

  select.innerHTML = "";
  campaigns.forEach((camp) => {
    const opt = document.createElement("option");
    opt.value = camp.id;
    opt.textContent = camp.name;
    select.appendChild(opt);
  });

  const defaultId =
    AppState.selectedCampaignId || (campaigns[0] && campaigns[0].id);
  if (defaultId) {
    select.value = defaultId;
    AppState.selectedCampaignId = defaultId;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignSelect");

  brandSelect?.addEventListener("change", () => {
    AppState.selectedBrandId = brandSelect.value || null;
    AppState.selectedCampaignId = null;
    populateCampaignSelect();
    updateViewSubheaders();
  });

  campaignSelect?.addEventListener("change", () => {
    AppState.selectedCampaignId = campaignSelect.value || null;
    updateViewSubheaders();
  });
}

function updateViewSubheaders() {
  const main = document.getElementById("mainView");
  if (!main) return;

  const brand = getEffectiveBrand();
  const headerEls = main.querySelectorAll("[data-view-title]");

  const owner = brand?.owner || "Brand Owner";
  const vertical = brand?.vertical || "E-Commerce";
  const campaignsCount =
    (brand && (DemoData.campaignsByBrand[brand.id] || []).length) || 0;

  headerEls.forEach((section) => {
    const title = section.getAttribute("data-view-title") || "";
    const subId = `${section.id}-subheader`;
    let sub = section.querySelector(`#${subId}`);

    if (!sub) {
      sub = document.createElement("div");
      sub.id = subId;
      sub.className = "view-subheader";
      section.prepend(sub);
    }

    sub.innerHTML = `
      <div class="view-subheader-main">
        <span class="view-subheader-title">${title}</span>
        <span class="view-subheader-meta">
          ${owner} â€¢ ${vertical} â€¢ ${campaignsCount} Kampagnen
        </span>
      </div>
    `;
  });
}

/* ----------------------------------------------------------
   15) NOTIFICATIONS
-----------------------------------------------------------*/
function pushNotification(type, message, meta = {}) {
  AppState.notifications.push({ type, message, meta, createdAt: Date.now() });
  const dot = document.getElementById("notificationsDot");
  if (dot) {
    dot.classList.remove("hidden");
  }
}

function clearNotifications() {
  AppState.notifications = [];
  const dot = document.getElementById("notificationsDot");
  if (dot) {
    dot.classList.add("hidden");
  }
}

/* ----------------------------------------------------------
   16) MODULE LOADER & ROUTING
-----------------------------------------------------------*/
async function loadModule(key) {
  const sectionId = getViewIdForModule(key);
  const section = document.getElementById(sectionId);
  if (!section) {
    console.warn("[loadModule] Section nicht gefunden:", sectionId);
    return;
  }

  // Meta-Gate
  if (modulesRequiringMeta.has(key) && !AppState.metaConnected && !useDemoMode()) {
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Meta-Konto verbinden</h2>
        <p class="view-subtitle">Dieses Modul benÃ¶tigt ein verbundenes Meta Ads Konto oder den Demo-Modus.</p>
        <p class="view-subtitle">Nutze den META VERBINDEN Button oben rechts oder aktiviere den Demo-Modus in den Settings.</p>
      </div>
    `;
    return;
  }

  showGlobalLoader();
  applySectionSkeleton(section);

  try {
    const loader = modules[key];
    if (!loader) {
      section.innerHTML = `
        <div class="view-inner">
          <h2 class="view-title">${key}</h2>
          <p class="view-subtitle">Dieses Modul ist noch nicht implementiert.</p>
        </div>
      `;
      return;
    }

    const module = await loader();
    if (!module || typeof module.render !== "function") {
      section.innerHTML = `
        <div class="view-inner">
          <h2 class="view-title">${key}</h2>
          <p class="view-subtitle">Render-Funktion fÃ¼r dieses Modul fehlt.</p>
        </div>
      `;
      return;
    }

    await module.render(section, AppState, {
      useDemoMode: useDemoMode(),
    });
  } catch (err) {
    console.error("[loadModule] Fehler beim Laden von Modul", key, err);
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Fehler</h2>
        <p class="view-subtitle">Modul "${key}" konnte nicht geladen werden.</p>
        <pre class="error-pre">${String(
          err && err.message ? err.message : err,
        )}</pre>
      </div>
    `;
    pushNotification("error", `Modul "${key}" konnte nicht geladen werden.`, {
      error: String(err),
    });
    showToast(`Fehler beim Laden von "${key}".`, "error");
  } finally {
    hideGlobalLoader();
  }
}

function navigateTo(key) {
  if (!viewIdMap[key]) {
    console.warn("[navigateTo] Unbekanntes Modul:", key);
    return;
  }

  AppState.currentModule = key;
  setActiveNavItem(key);
  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  loadModule(key);
}

/* ----------------------------------------------------------
   17) TESTING LOG API (global)
-----------------------------------------------------------*/
function createTestingLogAPI() {
  const STORAGE_KEY = "signalone_testing_log_v1";

  let entries = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) entries = parsed;
    } catch (err) {
      console.warn("[TestingLog] Konnte Log nicht laden:", err);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (err) {
      console.warn("[TestingLog] Konnte Log nicht speichern:", err);
    }
  }

  function seedDemo() {
    entries = [
      {
        id: "tl_1",
        createdAt: Date.now() - 5 * 24 * 3600 * 1000,
        status: "running",
        hypothesis: "UGC Hook mit Social Proof schlÃ¤gt statische Offer-Ad",
        primaryMetric: "ROAS",
        variants: [
          { label: "A", name: "Static Carousel â€“ Offer Focus" },
          { label: "B", name: "UGC Vertical â€“ Problem/Solution" },
        ],
      },
      {
        id: "tl_2",
        createdAt: Date.now() - 12 * 24 * 3600 * 1000,
        status: "won",
        hypothesis: "Short Form UGC < 25s vs. Long Form 45s",
        primaryMetric: "CTR",
        variants: [
          { label: "A", name: "Long Form UGC 45s" },
          { label: "B", name: "Short Form UGC 23s" },
        ],
      },
    ];
    save();
  }

  function add(entry) {
    const id =
      entry.id ||
      `tl_${Math.random().toString(36).slice(2, 8)}_${Date.now().toString(
        36,
      )}`;
    const createdAt = entry.createdAt || Date.now();
    const normalized = {
      ...entry,
      id,
      createdAt,
    };
    entries.unshift(normalized);
    save();
  }

  function clear() {
    entries = [];
    save();
  }

  function openTestSlot(creativeA, candidates = []) {
    const name = creativeA?.name || "Creative A";
    const open = window.SignalOne?.openSystemModal || openSystemModal;

    const list =
      candidates && candidates.length
        ? `<ul>${candidates
            .map(
              (c) =>
                `<li>${c.name || "Creative"} â€“ ROAS ${
                  c.metrics?.roas ?? "â€“"
                }x</li>`,
            )
            .join("")}</ul>`
        : "<p>Keine weiteren Creatives Ã¼bergeben.</p>";

    open(
      "Testing Slot (Demo)",
      `
      <p>In der finalen Version Ã¶ffnest du hier direkt einen neuen A/B-Test-Slot.</p>
      <p><strong>Target:</strong> ${name}</p>
      <div style="margin-top:12px;">
        <strong>Kandidaten:</strong><br>
        ${list}
      </div>
      <p style="margin-top:12px;font-size:0.85rem;color:#64748b;">
        Aktuell ist dies ein Demo-Overlay. Die Tabelle im Testing Log ist aber bereits an die TestingLog-API angebunden.
      </p>
    `,
    );
  }

  load();

  return {
    get entries() {
      return entries;
    },
    add,
    clear,
    seedDemo,
    openTestSlot,
  };
}

const TestingLogAPI = createTestingLogAPI();

/* ----------------------------------------------------------
   18) META CONNECT TOGGLE
-----------------------------------------------------------*/
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuth.disconnect();
  } else {
    MetaAuth.connectWithPopup();
  }
}

/* ----------------------------------------------------------
   19) BOOTSTRAP
-----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  console.log("ðŸš€ SignalOne Bootstrap startet...");

  // Meta Auth
  MetaAuth.init().catch((err) =>
    console.error("[MetaAuth] Init Fehler:", err),
  );

  // Sidebar
  renderNav();

  // Brand / Campaign
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  // Start-View
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);

  // Buttons
  document
    .getElementById("metaConnectButton")
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
    showToast("Session zurÃ¼ckgesetzt.", "success");
  });

  // Topbar
  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  // Startmodul laden
  loadModule(AppState.currentModule);

  console.log("âœ… SignalOne Bootstrap abgeschlossen!");
});

/* ----------------------------------------------------------
   20) EXPOSED GLOBAL API
-----------------------------------------------------------*/
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
