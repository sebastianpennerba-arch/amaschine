import DataLayer from "./packages/data/index.js";
import { DemoData } from "./demoData.js";
import { LoadingStates, LoadingManager } from "./packages/core/loadingStates.js";
import { ImagePlaceholder, initLazyLoading } from "./packages/core/imagePlaceholder.js";
import { ButtonFeedback, initButtonFeedback } from "./packages/core/buttonFeedback.js";

/* ========================================
   SignalOne.cloud – Frontend Core
   APPLE-STYLE CLEAN VERSION - VOLLSTÄNDIG
======================================== */

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

  function () {
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
      showToast("Meta Ads (Demo) verbunden", "success");
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

  return { , connectWithPopup, disconnect };
})();

// In app.js - nach initApp()
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
  });
}

function updateModeButtons() {
  const demoBtn = document.getElementById('modeBtnDemo');
  const liveBtn = document.getElementById('modeBtnLive');
  const demoModeBadge = document.querySelector('.demo-mode-badge');
  
  if (AppState.settings.demoMode) {
    demoBtn?.classList.add('active');
    liveBtn?.classList.remove('active');
    if (demoModeBadge) demoModeBadge.style.display = 'block';
  } else {
    demoBtn?.classList.remove('active');
    liveBtn?.classList.add('active');
    if (demoModeBadge) demoModeBadge.style.display = 'none';
  }
}

function reloadCurrentView() {
  const currentView = AppState.currentView || 'dashboard';
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
        <p>Um Live-Daten zu nutzen, musst du zuerst dein Meta Ads Konto verbinden.</p>
        <button class="btn-primary btn-connect-meta" onclick="window.SignalOne.connectMeta()">
          Mit Meta verbinden
        </button>
        <button class="btn-secondary" onclick="this.closest('.meta-connect-modal').remove()">
          Abbrechen
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

// In initApp() aufrufen:
// initDataModeToggle();


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

/* NAVIGATION STRUCTURE - NUR HAUPTMODULE */
const mainNavItems = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "creativeLibrary", label: "Creatives", icon: "library" },
  { key: "sensei", label: "Sensei", icon: "sensei" },
  { key: "campaigns", label: "Campaigns", icon: "campaigns" },
  { key: "academy", label: "Academy", icon: "academy" },
];

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
      z-index: 1000;
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
  if (type === "success") bg = "rgba(220,252,231,0.98)";
  if (type === "warning") bg = "rgba(254,243,199,0.98)";
  if (type === "error") bg = "rgba(254,226,226,0.98)";
  
  toast.style.cssText = `
    min-width: 280px;
    max-width: 400px;
    padding: 12px 16px;
    border-radius: 999px;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: ${bg};
    border: 1px solid rgba(148,163,184,0.6);
    box-shadow: 0 16px 40px rgba(15,23,42,0.4);
    backdrop-filter: blur(16px);
    color: #0f172a;
    font-weight: 500;
  `;
  
  toast.innerHTML = `
    <span>${message}</span>
    <button style="font-size:1.3rem;opacity:0.7;cursor:pointer;line-height:1;">×</button>
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
      <div style="text-align:center;color:#e5e7eb;">
        <div style="width:50px;height:50px;border:4px solid rgba(148,163,184,0.3);border-top-color:#3b82f6;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 14px;"></div>
        <p style="font-size:0.9rem;margin:0;letter-spacing:0.08em;">Lädt...</p>
      </div>
      <style>
        @keyframes spin { to { transform: rotate(360deg); } }
      </style>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function showGlobalLoader() {
  ensureGlobalLoader().style.display = "flex";
}

function hideGlobalLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

/* UI UPDATES */
function updateMetaUI() {
  const connected = AppState.metaConnected;
  const mode = AppState.meta.mode || "demo";
  
  // Topbar Button
  const topbarBtn = document.getElementById("topbarMetaButton");
  if (topbarBtn) {
    topbarBtn.textContent = connected ? `✓ VERBUNDEN (${mode.toUpperCase()})` : "META VERBINDEN";
    topbarBtn.classList.toggle("connected", connected);
  }
  
  // Sidebar Status
  const statusDot = document.getElementById("metaStatusDot");
  const statusLabel = document.getElementById("metaStatusLabel");
  if (statusDot) {
    statusDot.classList.toggle("connected", connected);
  }
  if (statusLabel) {
    statusLabel.textContent = connected ? `Meta: ${mode}` : "Meta: –";
  }
  
  updateTopbarGreeting();
}

function updateTopbarGreeting() {
  const greetEl = document.getElementById("topbarGreeting");
  if (!greetEl) return;
  
  const hour = new Date().getHours();
  let greeting = "GUTEN ABEND";
  if (hour < 12) greeting = "GUTEN MORGEN";
  else if (hour < 18) greeting = "GUTEN TAG";
  
  const user = AppState.meta.user?.name || "SignalOne Demo User";
  greetEl.textContent = `${greeting}, ${user}`.toUpperCase();
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  const now = new Date();
  
  if (dateEl) {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString('de-DE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    dateEl.textContent = `${day}, ${date}`;
  }
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
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

/* NAVIGATION */
function navigateTo(moduleKey) {
  if (!moduleKey || AppState.currentModule === moduleKey) return;
  
  AppState.currentModule = moduleKey;
  setActiveNavItem(moduleKey);
  const viewId = getViewIdForModule(moduleKey);
  setActiveView(viewId);
  loadModule(moduleKey);
  
  // Close tools dropdown if open
  const dropdown = document.getElementById("toolsDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function createNavButton(item) {
  const btn = document.createElement("button");
  btn.className = "sidebar-nav-button";
  btn.setAttribute("data-module", item.key);
  
  btn.innerHTML = `
    <span class="sidebar-btn-icon">
      <svg viewBox="0 0 24 24">
        <use href="#icon-${item.icon}"></use>
      </svg>
    </span>
    <span class="sidebar-nav-label">${item.label}</span>
  `;
  
  btn.addEventListener("click", () => navigateTo(item.key));
  return btn;
}

function renderNav() {
  const root = document.getElementById("sidebarNav");
  if (!root) return;
  
  root.innerHTML = "";
  
  mainNavItems.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.appendChild(createNavButton(item));
    root.appendChild(li);
  });
  
  setActiveNavItem(AppState.currentModule);
}

function setActiveNavItem(moduleKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button[data-module]");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-module") === moduleKey);
  });
}

/* VIEW HANDLING */
function setActiveView(viewId) {
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
    console.warn("[ModuleLoader] Unknown module:", moduleKey);
    return;
  }
  
  try {
    const mod = await loader();
    const initFn = mod.default?.init || mod.init;
    if (typeof initFn === "function") {
      await initFn({
        AppState,
        DemoData,
        DataLayer,
        useDemoMode,
        formatNumber,
        formatCurrency,
        formatPercent,
        showToast,
      });
    }
  } catch (err) {
    console.error("[ModuleLoader] Failed to load:", moduleKey, err);
    showToast(`Modul "${moduleKey}" konnte nicht geladen werden`, "error");
  }
}

/* TOOLS DROPDOWN */
function toggleToolsDropdown() {
  const dropdown = document.getElementById("toolsDropdown");
  if (!dropdown) return;
  dropdown.classList.toggle("hidden");
}

function wireToolsDropdown() {
  const toolsBtn = document.getElementById("topbarToolsButton");
  const dropdown = document.getElementById("toolsDropdown");
  
  if (toolsBtn) {
    toolsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleToolsDropdown();
    });
  }
  
  if (dropdown) {
    const items = dropdown.querySelectorAll(".tools-dropdown-item");
    items.forEach((item) => {
      item.addEventListener("click", () => {
        const moduleKey = item.getAttribute("data-module");
        navigateTo(moduleKey);
      });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && e.target !== toolsBtn) {
        dropdown.classList.add("hidden");
      }
    });
  }
}

/* META CONNECTION TOGGLE */
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuthMock.disconnect();
  } else {
    MetaAuthMock.connectWithPopup();
  }
}

/* BRAND & CAMPAIGN SELECTS */
function populateBrandSelect() {
  const select = document.getElementById("topbarBrandSelect");
  if (!select) return;
  
  const brands = DemoData?.brands || [{ id: "1", name: "Deine Brand" }];
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
  
  const campaigns = [{ id: "1", name: "SignalOne Demo User" }];
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
    });
  }
  
  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value;
    });
  }
}

// In app.js - Meta Connect Implementation

window.SignalOne.connectMeta = async function() {
  console.log('[Meta] Starting OAuth flow...');
  
  // Meta OAuth Parameters
  const CLIENT_ID = 'YOUR_META_APP_ID'; // TODO: Replace with real ID
  const REDIRECT_URI = window.location.origin + '/oauth/callback';
  const STATE = generateRandomState();
  
  // Save state to verify later
  sessionStorage.setItem('meta_oauth_state', STATE);
  
  // Meta OAuth URL
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${STATE}` +
    `&scope=ads_management,ads_read,business_management`;
  
  // Open OAuth in popup
  const popup = window.open(
    authUrl,
    'MetaConnect',
    'width=600,height=700,left=200,top=100'
  );
  
  // Listen for callback
  window.addEventListener('message', handleMetaCallback);
};

function handleMetaCallback(event) {
  // Verify origin
  if (!event.origin.startsWith(window.location.origin)) return;
  
  const { type, data } = event.data;
  
  if (type === 'META_OAUTH_SUCCESS') {
    console.log('[Meta] OAuth successful:', data);
    
    // Save token
    AppState.meta = {
      accessToken: data.access_token,
      userId: data.user_id,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
    
    // Update UI
    showMetaConnectedBadge();
    
    // Switch to live mode
    AppState.settings.demoMode = false;
    updateModeButtons();
    
    // Reload current view
    reloadCurrentView();
    
    // Show success message
    showToast('✅ Meta Ads erfolgreich verbunden!', 'success');
  } else if (type === 'META_OAUTH_ERROR') {
    console.error('[Meta] OAuth error:', data);
    showToast('❌ Meta-Verbindung fehlgeschlagen', 'error');
  }
}

function showMetaConnectedBadge() {
  const badge = document.querySelector('.meta-status-badge');
  if (badge) {
    badge.textContent = '✅ Meta verbunden';
    badge.classList.add('connected');
  }
}

function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* BOOTSTRAP */
document.addEventListener("DOMContentLoaded", () => {
  // Init Meta Auth
  MetaAuthMock.init();
  
  // Render Navigation
  renderNav();
  
  // Populate Selects
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();
  
  // Wire Tools Dropdown
  wireToolsDropdown();
  
  // Set Initial View
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  
  // Wire Buttons
    document.getElementById("topbarMetaButton")?.addEventListener("click", async (e) => {
    await ButtonFeedback.withFeedback(e.target, async () => {
      if (AppState.metaConnected) {
        MetaAuthMock.disconnect();
      } else {
        await MetaAuthMock.connectWithPopup();
      }
    }, {
      loadingText: 'Verbinde...',
      successText: '✓ Verbunden',
      errorText: '✗ Verbindung fehlgeschlagen'
    });
  });
  document.getElementById("sidebarSettingsButton")?.addEventListener("click", () => navigateTo("settings"));
  document.getElementById("notificationsButton")?.addEventListener("click", () => {
    showToast("Keine neuen Benachrichtigungen", "info");
  });
  document.getElementById("profileButton")?.addEventListener("click", () => {
    showToast("Profil-Einstellungen", "info");
  });
  
  // Update UI
  updateMetaUI();
  updateTopbarDateTime();
  updateNotificationBadge();
  
  // DateTime Interval
  setInterval(updateTopbarDateTime, 60000);
  
  // Load Initial Module
  loadModule(AppState.currentModule);

  // Init Loading Systems
  initLazyLoading();
  initButtonFeedback();
  
  // Make globally available
  window.LoadingStates = LoadingStates;
  window.LoadingManager = LoadingManager;
  window.ImagePlaceholder = ImagePlaceholder;
  window.ButtonFeedback = ButtonFeedback;
  
  console.log("[SignalOne] ✓ Loading Systems initialized"); 
});

/* GLOBAL EXPORTS */
window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  MetaAuth: MetaAuthMock,
};
