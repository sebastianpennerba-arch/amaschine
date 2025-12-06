/* ======================================== 
   SignalOne.cloud – Frontend Core
   STANDALONE VERSION (NO IMPORTS)
======================================== */

// HARD-CODED DEMO DATA (inline, kein Import nötig)
const DemoData = {
  brands: [
    { id: "acme", name: "ACME Fashion", spend30d: 116234, revenue30d: 557923, roas30d: 4.8, ctr30d: 3.2, cpm30d: 8.4, purchases30d: 4890 },
    { id: "tech", name: "TechGadgets Pro", spend30d: 98211, revenue30d: 432128, roas30d: 4.4, ctr30d: 2.9, cpm30d: 9.1, purchases30d: 3421 },
    { id: "beauty", name: "BeautyLux Cosmetics", spend30d: 67877, revenue30d: 257933, roas30d: 3.8, ctr30d: 2.6, cpm30d: 7.8, purchases30d: 2145 }
  ],
  creatives: [],
  campaigns: {}
};

const DataLayer = {}; // Dummy

/* META AUTH MOCK */
const MetaAuthMock = (() => {
  const STORAGE_KEY = "signalone_meta_mock_v1";
  let state = { connected: false, accessToken: null, user: null };

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
      state.user = { id: "1234567890", name: "SignalOne Demo User" };
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

  return { init, connectWithPopup, disconnect };
})();

/* APP STATE */
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: { accessToken: null, user: null, accountId: null, accountName: null, mode: null },
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
  },
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
  onboarding: () => import("./packages/onboarding/index.js"),
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
  onboarding: "onboardingView",
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
  return new Intl.NumberFormat("de-DE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
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
    el.style.cssText = `position:fixed;right:24px;bottom:24px;z-index:10000;display:flex;flex-direction:column;gap:10px;`;
    document.body.appendChild(el);
  }
  return el;
}

function showToast(message, type = "info", timeout = 3500) {
  const container = ensureToastContainer();
  const toast = document.createElement("div");
  let bg = "rgba(248,250,252,0.98)", borderColor = "rgba(148,163,184,0.6)";
  if (type === "success") { bg = "rgba(220,252,231,0.98)"; borderColor = "rgba(34,197,94,0.8)"; }
  if (type === "warning") { bg = "rgba(254,243,199,0.98)"; borderColor = "rgba(245,158,11,0.8)"; }
  if (type === "error") { bg = "rgba(254,226,226,0.98)"; borderColor = "rgba(239,68,68,0.8)"; }

  toast.style.cssText = `min-width:280px;max-width:400px;padding:12px 16px;border-radius:8px;font-size:0.85rem;display:flex;align-items:center;justify-content:space-between;gap:12px;background:${bg};border:1px solid ${borderColor};box-shadow:0 16px 40px rgba(15,23,42,0.4);backdrop-filter:blur(16px);color:#0f172a;font-weight:500;`;

  const span = document.createElement("span");
  span.textContent = message;
  const btn = document.createElement("button");
  btn.textContent = "×";
  btn.style.cssText = "background:none;border:none;cursor:pointer;font-size:1.2rem;color:inherit;padding:0;";
  btn.onclick = () => toast.remove();

  toast.appendChild(span);
  toast.appendChild(btn);
  container.appendChild(toast);

  if (timeout > 0) setTimeout(() => toast.remove(), timeout);
}

/* GLOBAL LOADER */
function ensureGlobalLoader() {
  let overlay = document.getElementById("globalLoader");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "globalLoader";
    overlay.style.cssText = `position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:999;background:radial-gradient(circle at 0% 0%,rgba(15,23,42,0.85),rgba(15,23,42,0.98));backdrop-filter:blur(8px);`;
    overlay.innerHTML = `<div style="text-align:center;"><div class="loader" style="width:48px;height:48px;border:4px solid rgba(255,255,255,0.2);border-top-color:#60a5fa;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px;"></div><p style="color:#e2e8f0;font-weight:500;font-size:0.9rem;">Lädt...</p></div>`;
    document.body.appendChild(overlay);
    if (!document.getElementById("loaderKeyframes")) {
      const style = document.createElement("style");
      style.id = "loaderKeyframes";
      style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }
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

/* META UI UPDATE */
function updateMetaUI() {
  const dot = document.getElementById("statusMetaDot");
  const text = document.getElementById("statusMetaText");
  const btn = document.getElementById("metaButton");

  if (AppState.metaConnected) {
    if (dot) { dot.classList.add("status-dot-green"); dot.classList.remove("status-dot-gray"); }
    if (text) text.textContent = "Meta Ads: Verbunden";
    if (btn) { btn.textContent = "Meta trennen"; btn.classList.add("btn-danger"); btn.classList.remove("btn-primary"); }
  } else {
    if (dot) { dot.classList.add("status-dot-gray"); dot.classList.remove("status-dot-green"); }
    if (text) text.textContent = "Meta Ads: Getrennt";
    if (btn) { btn.textContent = "Meta verbinden"; btn.classList.add("btn-primary"); btn.classList.remove("btn-danger"); }
  }
}

/* NAVIGATION */
async function navigateTo(moduleName) {
  console.log(`[navigateTo] Switching to: ${moduleName}`);
  showGlobalLoader();
  try {
    document.querySelectorAll(".sidebar-nav-button").forEach(b => b.classList.remove("active"));
    const activeBtn = document.querySelector(`.sidebar-nav-button[data-view="${moduleName}"]`);
    if (activeBtn) activeBtn.classList.add("active");

    document.querySelectorAll(".view-section").forEach(v => v.style.display = "none");
    const targetViewId = getViewIdForModule(moduleName);
    const targetView = document.getElementById(targetViewId);
    if (targetView) targetView.style.display = "block";

    AppState.currentModule = moduleName;

    if (modules[moduleName]) {
      try {
        const mod = await modules[moduleName]();
        if (mod && mod.init) {
          await mod.init({ AppState, DemoData, DataLayer, useDemoMode, formatNumber, formatCurrency, formatPercent, showToast });
        }
      } catch (modErr) {
        console.warn(`[navigateTo] Modul ${moduleName} konnte nicht geladen werden:`, modErr);
        // Fallback: Show basic content
        if (targetView) {
          targetView.innerHTML = `<div class="view-body"><h2>Modul: ${moduleName}</h2><p class="color-fg-muted">Dieses Modul lädt noch...</p></div>`;
        }
      }
    }
  } catch (err) {
    console.error(`[navigateTo] Fehler beim Laden von ${moduleName}:`, err);
    showToast(`Modul "${moduleName}" konnte nicht geladen werden.`, "error");
  } finally {
    hideGlobalLoader();
  }
}

/* INIT APP */
async function initApp() {
  console.log("[initApp] Starting...");
  MetaAuthMock.init();

  document.querySelectorAll(".sidebar-nav-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const view = btn.getAttribute("data-view");
      if (view) navigateTo(view);
    });
  });

  const metaBtn = document.getElementById("metaButton");
  if (metaBtn) {
    metaBtn.addEventListener("click", () => {
      if (AppState.metaConnected) MetaAuthMock.disconnect();
      else MetaAuthMock.connectWithPopup();
    });
  }

  console.log("[initApp] Navigating to dashboard...");
  await navigateTo("dashboard");
  console.log("[initApp] Complete.");
}

/* START */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
