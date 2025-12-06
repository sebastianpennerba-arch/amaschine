import DataLayer from "./packages/data/index.js";
import { DemoData } from "./demoData.js";

/* ========================================
   SignalOne.cloud – Frontend Core
   APPLE-STYLE CLEAN VERSION
======================================== */

/* META AUTH MOCK */
const MetaAuthMock = (() => {
  const STORAGE_KEY = "signalone_meta_mock_v1";
  let state = {
    connected: false,
    accessToken: null,
    user: null
  };

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed, connected: !!parsed.connected };
    } catch (err) {
      console.warn("[MetaAuthMock] Load failed:", err);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[MetaAuthMock] Save failed:", err);
    }
  }

  function syncToAppState() {
    AppState.metaConnected = state.connected;
    AppState.meta.accessToken = state.accessToken;
    AppState.meta.user = state.user;
    AppState.meta.mode = state.connected ? "demo" : null;
    updateMetaUI();
  }

  function init() {
    loadFromStorage();
    syncToAppState();
  }

  function connectWithPopup() {
    showGlobalLoader();
    setTimeout(() => {
      state.connected = true;
      state.accessToken = "demo_token_123";
      state.user = {
        id: "1234567890",
        name: "SignalOne Demo User"
      };
      saveToStorage();
      syncToAppState();
      hideGlobalLoader();
      showToast("✅ Meta Ads (Demo) verbunden", "success");
    }, 600);
  }

  function disconnect() {
    state.connected = false;
    state.accessToken = null;
    state.user = null;
    saveToStorage();
    syncToAppState();
    showToast("Meta-Verbindung getrennt", "info");
  }

  return {
    init,
    connectWithPopup,
    disconnect
  };
})();

/* DATA MODE TOGGLE */
function initDataModeToggle() {
  const demoBtn = document.getElementById('modeBtnDemo');
  const liveBtn = document.getElementById('modeBtnLive');

  if (!demoBtn || !liveBtn) return;

  // Initial State
  updateModeButtons();

  demoBtn.addEventListener('click', () => {
    AppState.settings.demoMode = true;
    updateModeButtons();
    reloadCurrentView();
    showToast("📊 Demo-Modus aktiviert", "info");
  });

  liveBtn.addEventListener('click', () => {
    AppState.settings.demoMode = false;

    // Check if Meta is connected
    if (!AppState.meta?.accessToken) {
      showMetaConnectModal();
      return;
    }

    updateModeButtons();
    reloadCurrentView();
    showToast("🔴 Live-Modus aktiviert", "success");
  });
}

function updateModeButtons() {
  const demoBtn = document.getElementById('modeBtnDemo');
  const liveBtn = document.getElementById('modeBtnLive');

  if (AppState.settings.demoMode) {
    demoBtn?.classList.add('active');
    liveBtn?.classList.remove('active');
  } else {
    demoBtn?.classList.remove('active');
    liveBtn?.classList.add('active');
  }
}

function reloadCurrentView() {
  const currentView = AppState.currentModule || 'dashboard';
  SignalOne.navigateTo(currentView);
}

function showMetaConnectModal() {
  const modal = document.createElement('div');
  modal.className = 'meta-connect-modal';
  modal.innerHTML = `
    <div class="modal-overlay" onclick="this.closest('.meta-connect-modal').remove()"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3>🔴 Meta Ads verbinden</h3>
        <button class="modal-close" onclick="this.closest('.meta-connect-modal').remove()">×</button>
      </div>
      <div class="modal-body">
        <p style="margin-bottom:16px;color:var(--color-text-muted);line-height:1.6;">
          Um Live-Daten zu nutzen, musst du zuerst dein Meta Ads Konto verbinden.
        </p>
        <button class="btn-primary" onclick="window.SignalOne.MetaAuthMock.connectWithPopup(); this.closest('.meta-connect-modal').remove();" style="margin-bottom:12px;">
          🔗 Mit Meta verbinden
        </button>
        <button class="btn-secondary" onclick="this.closest('.meta-connect-modal').remove()">
          Abbrechen
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

/* APP STATE */
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    accessToken: null,
    user: null,
    accountId: null,
    accountName: null,
    mode: null
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
    defaultRange: "last_30_days"
  }
};

/* MODULE REGISTRY */
const modules = {
  dashboard: () => import("./packages/dashboard/index.js"),
  creativeLibrary: () => import("./packages/creativeLibrary/index.js"),
  sensei: () => import("./packages/sensei/index.js"),
  campaigns: () => import("./packages/campaigns/index.js"),
  academy: () => import("./packages/academy/index.js"),
  testingLog: () => import("./packages/testingLog/index.js"),
  roast: () => import("./packages/roast/index.js"),
  reports: () => import("./packages/reports/index.js"),
  analytics: () => import("./packages/analytics/index.js"),
  creatorInsights: () => import("./packages/creatorInsights/index.js"),
  team: () => import("./packages/team/index.js"),
  brands: () => import("./packages/brands/index.js"),
  shopify: () => import("./packages/shopify/index.js"),
  settings: () => import("./packages/settings/index.js"),
  onboarding: () => import("./packages/onboarding/index.js")
};

const viewIdMap = {
  dashboard: "dashboardView",
  creativeLibrary: "creativeLibraryView",
  sensei: "senseiView",
  campaigns: "campaignsView",
  academy: "academyView",
  testingLog: "testingLogView",
  roast: "roastView",
  reports: "reportsView",
  analytics: "analyticsView",
  creatorInsights: "creatorInsightsView",
  team: "teamView",
  brands: "brandsView",
  shopify: "shopifyView",
  settings: "settingsView",
  onboarding: "onboardingView"
};

/* HELPERS */
function useDemoMode() {
  return AppState.settings.demoMode || !AppState.metaConnected;
}

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function formatNumber(value) {
  if (value == null || isNaN(value)) return "–";
  return new Intl.NumberFormat("de-DE").format(value);
}

function formatCurrency(value, currency = "EUR") {
  if (value == null || isNaN(value)) return "–";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return "–";
  return `${value.toFixed(decimals)} %`;
}

/* TOAST SYSTEM */
function ensureToastContainer() {
  let el = document.getElementById("toastContainer");
  if (!el) {
    el = document.createElement("div");
    el.id = "toastContainer";
    el.style.cssText = `
      position: fixed;
      right: 24px;
      bottom: 24px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info", timeout = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");

  let bg = "rgba(248,250,252,0.98)";
  let borderColor = "rgba(148,163,184,0.6)";
  
  if (type === "success") {
    bg = "rgba(220,252,231,0.98)";
    borderColor = "rgba(34,197,94,0.8)";
  }
  if (type === "warning") {
    bg = "rgba(254,243,199,0.98)";
    borderColor = "rgba(245,158,11,0.8)";
  }
  if (type === "error") {
    bg = "rgba(254,226,226,0.98)";
    borderColor = "rgba(239,68,68,0.8)";
  }

  toast.style.cssText = `
    min-width: 280px;
    max-width: 400px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: ${bg};
    border: 1px solid ${borderColor};
    box-shadow: 0 16px 40px rgba(15,23,42,0.4);
    backdrop-filter: blur(16px);
    color: #0f172a;
    font-weight: 500;
  `;

  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:inherit;padding:0;">×</button>
  `;

  toast.querySelector("button").onclick = () => toast.remove();
  container.appendChild(toast);

  if (timeout > 0) {
    setTimeout(() => toast.remove(), timeout);
  }
}

/* GLOBAL LOADER */
function ensureGlobalLoader() {
  let overlay = document.getElementById("globalLoader");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "globalLoader";
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 999;
      background: radial-gradient(circle at 0% 0%, rgba(15,23,42,0.85), rgba(15,23,42,0.98));
      backdrop-filter: blur(8px);
    `;
    overlay.innerHTML = `
      <div style="text-align:center;color:#f9fafb;">
        <div style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.2);border-top-color:#fff;border-radius:50%;margin:0 auto 16px;animation:spin 0.8s linear infinite;"></div>
        <div style="font-size:0.9rem;letter-spacing:0.05em;">Lädt...</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showGlobalLoader() {
  const loader = ensureGlobalLoader();
  loader.style.display = "flex";
}

function hideGlobalLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

/* META UI UPDATE */
function updateMetaUI() {
  const btn = document.getElementById("metaButton");
  const dot = document.getElementById("statusMetaDot");
  const text = document.getElementById("statusMetaText");

  if (AppState.metaConnected) {
    if (btn) {
      btn.textContent = "✓ VERBUNDEN (DEMO)";
      btn.classList.add("connected");
    }
    if (dot) dot.classList.add("connected");
    if (text) text.textContent = "Meta: connected";
  } else {
    if (btn) {
      btn.textContent = "✦ NICHT VERBUNDEN";
      btn.classList.remove("connected");
    }
    if (dot) dot.classList.remove("connected");
    if (text) text.textContent = "Meta: demo";
  }
}

/* NAVIGATION */
async function navigateTo(moduleKey) {
  console.log(`[Nav] → ${moduleKey}`);

  if (!modules[moduleKey]) {
    console.error(`[Nav] Module "${moduleKey}" not found.`);
    return;
  }

  // Hide all views
  document.querySelectorAll(".view").forEach(v => {
    v.classList.remove("is-active");
  });

  // Update sidebar active state
  document.querySelectorAll(".sidebar-nav-button").forEach(btn => {
    btn.classList.remove("active");
    if (btn.dataset.view === moduleKey) {
      btn.classList.add("active");
    }
  });

  // Get target view
  const targetViewId = getViewIdForModule(moduleKey);
  const targetSection = document.getElementById(targetViewId);

  if (!targetSection) {
    console.error(`[Nav] View element #${targetViewId} not found.`);
    return;
  }

  // Show view
  targetSection.classList.add("is-active");
  AppState.currentModule = moduleKey;

  // Load module
  try {
    showGlobalLoader();
    const mod = await modules[moduleKey]();
    const initFn = mod.default?.init || mod.init;

    if (typeof initFn === "function") {
      await initFn({
        AppState,
        DemoData,
        DataLayer,
        useDemoMode,
        formatNumber,
        formatCurrency,
        formatPercent
      });
    } else {
      console.warn(`[Nav] Module "${moduleKey}" has no init function.`);
    }

    hideGlobalLoader();
  } catch (err) {
    console.error(`[Nav] Failed to load "${moduleKey}":`, err);
    hideGlobalLoader();
    showToast(`Fehler beim Laden von ${moduleKey}`, "error");
  }
}

/* INIT APP */
async function initApp() {
  console.log("[SignalOne] App initialization...");

  // Update time
  function updateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit"
    });
    const timeEl = document.getElementById("topbarTime");
    if (timeEl) timeEl.textContent = timeStr;
  }
  updateTime();
  setInterval(updateTime, 30000);

  // Wire sidebar nav
  document.querySelectorAll(".sidebar-nav-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      if (view) navigateTo(view);
    });
  });

  // Wire settings button
  document.querySelector(".sidebar-settings-button")?.addEventListener("click", () => {
    navigateTo("settings");
  });

  // Wire meta button
  document.getElementById("metaButton")?.addEventListener("click", () => {
    if (AppState.metaConnected) {
      if (confirm("Meta-Verbindung trennen?")) {
        MetaAuthMock.disconnect();
      }
    } else {
      MetaAuthMock.connectWithPopup();
    }
  });

  // Wire tools dropdown
  const toolsBtn = document.getElementById("toolsButton");
  const toolsDropdown = document.getElementById("toolsDropdown");

  toolsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    toolsDropdown?.classList.toggle("hidden");
  });

  document.addEventListener("click", () => {
    toolsDropdown?.classList.add("hidden");
  });

  document.querySelectorAll(".tools-dropdown-item").forEach(item => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (view) navigateTo(view);
      toolsDropdown?.classList.add("hidden");
    });
  });

  // Initialize Meta Mock & Toggle
  MetaAuthMock.init();
  initDataModeToggle();

  // Load dashboard
  await navigateTo("dashboard");

  // Expose API
  window.SignalOne = {
    navigateTo,
    AppState,
    DemoData,
    DataLayer,
    MetaAuthMock,
    showToast
  };

  console.log("[SignalOne] App ready.");
}

// Start app
document.addEventListener("DOMContentLoaded", initApp);
