import DataLayer from "./packages/data/index.js";
import { DemoData } from "./demoData.js";

/* ========================================
   SignalOne.cloud – Frontend Core
   PRODUCTION READY – Dezember 2025
======================================== */

/* ----------------------------------------
   1) META AUTH MOCK
---------------------------------------- */
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

  return { init, connectWithPopup, disconnect };
})();

/* ----------------------------------------
   2) APP STATE
---------------------------------------- */
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
  },
};

/* ----------------------------------------
   3) MODULE REGISTRY
---------------------------------------- */
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

/* ----------------------------------------
   4) NAVIGATION STRUCTURE
---------------------------------------- */
const navStructure = {
  main: [
    { key: "dashboard", label: "Dashboard", icon: "dashboard" },
    { key: "creativeLibrary", label: "Creatives", icon: "library" },
    { key: "sensei", label: "Sensei", icon: "sensei" },
    { key: "campaigns", label: "Campaigns", icon: "campaigns" },
    { key: "academy", label: "Academy", icon: "academy" },
  ],
  tools: [
    { key: "testingLog", label: "Testing Log", icon: "testing" },
    { key: "roast", label: "Roast", icon: "roast" },
    { key: "reports", label: "Reports", icon: "reports" },
    { key: "analytics", label: "Analytics", icon: "analytics" },
    { key: "creatorInsights", label: "Creators", icon: "creators" },
  ],
  settings: [
    { key: "team", label: "Team", icon: "team" },
    { key: "brands", label: "Brands", icon: "brands" },
    { key: "shopify", label: "Shopify", icon: "shopify" },
    { key: "settings", label: "Settings", icon: "settings" },
    { key: "onboarding", label: "Onboarding", icon: "onboarding" },
  ],
};

/* ----------------------------------------
   5) HELPERS
---------------------------------------- */
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
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return "–";
  return `${value.toFixed(decimals)} %`;
}

/* ----------------------------------------
   6) TOAST SYSTEM
---------------------------------------- */
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

/* ----------------------------------------
   7) GLOBAL LOADER
---------------------------------------- */
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

/* ----------------------------------------
   8) UI UPDATES
---------------------------------------- */
function updateMetaUI() {
  const connected = AppState.metaConnected;
  const mode = AppState.meta.mode || "demo";
  
  // Topbar Button
  const topbarBtn = document.getElementById("topbarMetaButton");
  if (topbarBtn) {
    topbarBtn.textContent = connected ? `✓ VERBUNDEN (${mode.toUpperCase()})` : "META VERBINDEN";
    topbarBtn.classList.toggle("connected", connected);
  }
  
  // Sidebar Button
  const sidebarBtn = document.getElementById("sidebarMetaButton");
  if (sidebarBtn) {
    sidebarBtn.textContent = connected ? `✓ ${mode.toUpperCase()}` : "META VERBINDEN";
    sidebarBtn.classList.toggle("connected", connected);
  }
  
  // Status Dot
  const statusDot = document.getElementById("metaStatusDot");
  const statusLabel = document.getElementById("metaStatusLabel");
  if (statusDot) {
    statusDot.classList.toggle("connected", connected);
  }
  if (statusLabel) {
    statusLabel.textContent = connected ? `Meta: ${mode}` : "Meta: Nicht verbunden";
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
  
  const user = AppState.meta.user?.name || "Demo User";
  greetEl.textContent = `${greeting}, ${user}`.toUpperCase();
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  
  const now = new Date();
  
  if (dateEl) {
    const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    dateEl.textContent = `${day}, ${date}`;
  }
  
  if (timeEl) {
    timeEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
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

/* ----------------------------------------
   9) NAVIGATION
---------------------------------------- */
function navigateTo(moduleKey) {
  if (!moduleKey || AppState.currentModule === moduleKey) return;
  
  AppState.currentModule = moduleKey;
  setActiveNavItem(moduleKey);
  const viewId = getViewIdForModule(moduleKey);
  setActiveView(viewId);
  loadModule(moduleKey);
}

function createNavButton(item, nested = false) {
  const btn = document.createElement("button");
  btn.className = nested ? "sidebar-nav-button sidebar-nav-button-nested" : "sidebar-nav-button";
  btn.setAttribute("data-module", item.key);
  
  const hasIcon = !!item.icon;
  btn.innerHTML = `
    ${hasIcon ? `
      <span class="sidebar-btn-icon">
        <svg viewBox="0 0 24 24">
          <use href="#icon-${item.icon}"></use>
        </svg>
      </span>
    ` : ""}
    <span class="sidebar-nav-label">${item.label}</span>
  `;
  
  btn.addEventListener("click", () => navigateTo(item.key));
  return btn;
}

function renderCollapsibleGroup(rootUl, labelText, items, groupKey, initiallyOpen = false) {
  // Label
  const labelLi = document.createElement("li");
  labelLi.className = "sidebar-section-label";
  labelLi.textContent = labelText;
  labelLi.dataset.groupKey = groupKey;
  rootUl.appendChild(labelLi);
  
  // Group Container
  const groupLi = document.createElement("li");
  groupLi.className = "sidebar-group";
  groupLi.dataset.groupKey = groupKey;
  
  // Inner List
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
  
  // Set initial state
  setTimeout(() => {
    const fullHeight = innerUl.scrollHeight;
    
    if (initiallyOpen) {
      groupLi.classList.remove("collapsed");
      labelLi.classList.add("open");
      groupLi.style.height = `${fullHeight}px`;
    } else {
      groupLi.classList.add("collapsed");
      labelLi.classList.remove("open");
      groupLi.style.height = "0px";
    }
  }, 0);
  
  // Toggle handler
  labelLi.addEventListener("click", () => {
    const isOpen = !groupLi.classList.contains("collapsed");
    const fullHeight = innerUl.scrollHeight;
    
    if (isOpen) {
      // Close
      groupLi.style.height = `${fullHeight}px`;
      requestAnimationFrame(() => {
        groupLi.style.height = "0px";
        groupLi.classList.add("collapsed");
        labelLi.classList.remove("open");
      });
    } else {
      // Open
      groupLi.classList.remove("collapsed");
      labelLi.classList.add("open");
      groupLi.style.height = `${fullHeight}px`;
    }
  });
}

function renderNav() {
  const root = document.getElementById("sidebarNav");
  if (!root) return;
  
  root.innerHTML = "";
  
  // Main modules
  navStructure.main.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.appendChild(createNavButton(item, false));
    root.appendChild(li);
  });
  
  // Collapsible groups
  renderCollapsibleGroup(root, "TOOLS", navStructure.tools, "tools", false);
  renderCollapsibleGroup(root, "SETTINGS", navStructure.settings, "settings", false);
  
  setActiveNavItem(AppState.currentModule);
}

function setActiveNavItem(moduleKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button[data-module]");
  buttons.forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-module") === moduleKey);
  });
}

/* ----------------------------------------
   10) VIEW HANDLING
---------------------------------------- */
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

/* ----------------------------------------
   11) BRAND & CAMPAIGN SELECTS
---------------------------------------- */
function populateBrandSelect() {
  const select = document.getElementById("topbarBrandSelect");
  if (!select) return;
  
  const brands = DemoData?.brands || [{ id: "1", name: "ACME Fashion" }];
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
  
  const campaigns = [{ id: "1", name: "UGC Scale Test" }];
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

/* ----------------------------------------
   12) META CONNECTION TOGGLE
---------------------------------------- */
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuthMock.disconnect();
  } else {
    MetaAuthMock.connectWithPopup();
  }
}

/* ----------------------------------------
   13) BOOTSTRAP
---------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // Init Meta Auth
  MetaAuthMock.init();
  
  // Render Navigation
  renderNav();
  
  // Populate Selects
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();
  
  // Set Initial View
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  
  // Wire Buttons
  document.getElementById("topbarMetaButton")?.addEventListener("click", toggleMetaConnection);
  document.getElementById("sidebarMetaButton")?.addEventListener("click", toggleMetaConnection);
  
  document.getElementById("notificationsButton")?.addEventListener("click", () => {
    showToast("Keine neuen Benachrichtigungen", "info");
  });
  
  document.getElementById("settingsButton")?.addEventListener("click", () => {
    navigateTo("settings");
  });
  
  // Update UI
  updateMetaUI();
  updateTopbarDateTime();
  updateNotificationBadge();
  
  // DateTime Interval
  setInterval(updateTopbarDateTime, 60000);
  
  // Load Initial Module
  loadModule(AppState.currentModule);
  
  console.log("[SignalOne] ✓ App initialized");
});

/* ----------------------------------------
   14) GLOBAL EXPORTS
---------------------------------------- */
window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  MetaAuth: MetaAuthMock,
};
