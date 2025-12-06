import DataLayer from "./packages/data/index.js";

/* ----------------------------------------------------------
   SignalOne.cloud – Frontend Core
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
   4) DEMO DATA
----------------------------------------------------------*/
import { DemoData } from "./demoData.js";

/* ----------------------------------------------------------
   5) MODULE REGISTRY & VIEW MAP
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
   6) HELPERS
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

/* ----------------------------------------------------------
   7) NAVIGATION / SIDEBAR – Design A (FIXED + COLLAPSIBLE)
----------------------------------------------------------*/

// 5 Hauptmodule + Tools + Einstellungen (Labels)
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

function createNavButton(item, nested = false) {
  const btn = document.createElement("button");
  btn.className = "sidebar-nav-button" + (nested ? " sidebar-nav-button-nested" : "");
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

function renderNav() {
  const ul = document.getElementById("sidebarNav") || document.getElementById("navbar");
  if (!ul) return;
  ul.innerHTML = "";

  // Hauptmodule
  navStructure.main.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.appendChild(createNavButton(item, false));
    ul.appendChild(li);
  });

  // TOOLS COLLAPSIBLE GROUP
  renderCollapsibleGroup("TOOLS", navStructure.tools, "tools", false);

  // E INSTELLUNGEN COLLAPSIBLE GROUP
  renderCollapsibleGroup("EINSTELLUNGEN", navStructure.settings, "settings", false);

  setActiveNavItem(AppState.currentModule);
}

function renderCollapsibleGroup(labelText, items, groupKey, initiallyOpen) {
  const labelLi = document.createElement("li");
  labelLi.className = "sidebar-section-label";
  labelLi.textContent = labelText;
  labelLi.dataset.groupKey = groupKey;
  ul.appendChild(labelLi);

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
  ul.appendChild(groupLi);

  // initial state
  if (!initiallyOpen) {
    groupLi.classList.add("collapsed");
    groupLi.style.height = "0px";
  } else {
    groupLi.style.height = innerUl.scrollHeight + "px";
    labelLi.classList.add("open");
  }

  labelLi.addEventListener("click", () => {
    const collapsed = groupLi.classList.toggle("collapsed");
    if (collapsed) {
      groupLi.style.height = "0px";
      labelLi.classList.remove("open");
    } else {
      groupLi.style.height = innerUl.scrollHeight + "px";
      labelLi.classList.add("open");
    }
  });
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
   8) VIEW HANDLING, MODULE LOADER etc. — bleibt unverändert
   (Dein Original-Code)
----------------------------------------------------------*/

// ... (restlicher Code bleibt unverändert, wie in deinem Original)

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
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  loadModule(AppState.currentModule);
});

/* ----------------------------------------------------------
   20) EXPOSED GLOBAL API
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
