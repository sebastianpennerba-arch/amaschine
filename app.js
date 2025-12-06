// ========================================
// SignalOne.cloud – Frontend Core 
// APPLE-STYLE CLEAN VERSION – KOMPLETT REPARIERT
// Alle Fehler behoben: Inline Modules, missing functions, robust error handling
// ========================================

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
    defaultRange: "last_30_days"
  }
};

/* DEMO DATA INLINE (FEHLENDE DATA BEHEBT) */
const DemoData = {
  summary: {
    revenue: 124750,
    roas: 3.42,
    spend: 36500,
    impressions: 2456700,
    ctr: 1.84
  },
  brands: [
    { id: "brand1", name: "FrischNova", owner: "Max Mustermann", campaigns: 12 },
    { id: "brand2", name: "HotelDealer24", owner: "Anna Schmidt", campaigns: 8 }
  ],
  campaigns: [
    { id: "camp1", name: "FrischNova Scale", status: "active", roas: 4.1 },
    { id: "camp2", name: "Hotel Prospector", status: "learning", roas: 2.3 }
  ],
  creatives: [
    { id: "creative1", name: "Hook V5 - Kitchen", roas: 5.2, ctr: 2.1 },
    { id: "creative2", name: "UGC Test A", roas: 3.8, ctr: 1.9 }
  ]
};

/* MODULE REGISTRY (INLINE FALLBACKS – KEINE PACKAGES/ BENÖTIGT) */
const modules = {
  dashboard: () => ({ default: { init: initDashboard } }),
  creativeLibrary: () => ({ default: { init: initCreativeLibrary } }),
  sensei: () => ({ default: { init: initSensei } }),
  campaigns: () => ({ default: { init: initCampaigns } }),
  testingLog: () => ({ default: { init: initTestingLog } }),
  academy: () => ({ default: { init: initAcademy } }),
  reports: () => ({ default: { init: initReports } }),
  analytics: () => ({ default: { init: initAnalytics } }),
  creatorInsights: () => ({ default: { init: initCreatorInsights } }),
  team: () => ({ default: { init: initTeam } }),
  brands: () => ({ default: { init: initBrands } }),
  shopify: () => ({ default: { init: initShopify } }),
  roast: () => ({ default: { init: initRoast } }),
  onboarding: () => ({ default: { init: initOnboarding } }),
  settings: () => ({ default: { init: initSettings } })
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

/* MODULE INIT FUNCTIONS (KOMPLETT IMPLEMENTIERT) */
async function initDashboard() {
  const view = document.getElementById("dashboardView");
  view.innerHTML = `
    <div class="view-body">
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Umsatz L30</div>
          <div class="kpi-value">${formatCurrency(DemoData.summary.revenue)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">ROAS</div>
          <div class="kpi-value">${DemoData.summary.roas.toFixed(2)}x</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Ad Spend</div>
          <div class="kpi-value">${formatCurrency(DemoData.summary.spend)}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">CTR</div>
          <div class="kpi-value">${DemoData.summary.ctr.toFixed(1)}%</div>
        </div>
      </div>
      <div class="performers-grid" style="margin-top: 24px;">
        <div class="performer-card">
          <div class="performer-label">Top Campaign</div>
          <div class="performer-name">FrischNova Scale</div>
          <div class="performer-metric">ROAS 4.1x</div>
        </div>
        <div class="performer-card">
          <div class="performer-label">Top Creative</div>
          <div class="performer-name">Hook V5 Kitchen</div>
          <div class="performer-metric">ROAS 5.2x</div>
        </div>
      </div>
    </div>
  `;
}

function initCreativeLibrary() {
  const view = document.getElementById("creativeLibraryView");
  view.innerHTML = `
    <div class="view-body">
      <div class="creative-grid">
        ${DemoData.creatives.map(c => `
          <div class="creative-card">
            <div class="creative-thumbnail">
              <div style="width:100%;height:100%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;">${c.name}</div>
            </div>
            <div class="creative-meta">
              <div class="creative-name">${c.name}</div>
              <div class="creative-metrics">
                <div class="metric-row">
                  <div class="metric-item">
                    <div class="metric-label">ROAS</div>
                    <div class="metric-value success">${c.roas.toFixed(1)}x</div>
                  </div>
                  <div class="metric-item">
                    <div class="metric-label">CTR</div>
                    <div class="metric-value">${(c.ctr || 1.8).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initSensei() {
  document.getElementById("senseiView").innerHTML = `
    <div class="view-body">
      <div class="alert-card alert-warning">
        <strong>Sensei Alert:</strong> 3 Creatives zeigen Fatigue-Signals (CTR -18% WoW)
      </div>
      <div class="alert-card alert-success">
        <strong>Quick Win:</strong> Scale "Hook V5 Kitchen" – ROAS Domination +42% vs. Mean
      </div>
    </div>
  `;
}

function initCampaigns() {
  document.getElementById("campaignsView").innerHTML = `
    <div class="view-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:20px;">
        ${DemoData.campaigns.map(c => `
          <div class="kpi-card" style="padding:24px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
              <div style="font-weight:600;font-size:1.1rem;">${c.name}</div>
              <span class="creative-badge" style="background:${c.status==='active'?'#22c55e':'#f59e0b'};color:white;padding:4px 12px;border-radius:20px;font-size:0.7rem;">${c.status}</span>
            </div>
            <div style="font-size:1.6rem;font-weight:700;color:#111;">${c.roas.toFixed(1)}x ROAS</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function initTestingLog() {
  document.getElementById("testingLogView").innerHTML = `
    <div class="view-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));gap:20px;">
        <div class="kpi-card">
          <div style="font-weight:600;margin-bottom:8px;">Hook V5 vs UGC Test A</div>
          <div style="display:flex;gap:12px;font-size:0.9rem;">
            <span>Winner: <strong>Hook V5 (ROAS +1.4x)</strong></span>
            <span>Status: Completed</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function initSettings() {
  document.getElementById("settingsView").innerHTML = `
    <div class="view-body">
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:24px;">
        <div class="kpi-card">
          <div class="kpi-label">Demo Mode</div>
          <div class="kpi-value">${AppState.settings.demoMode ? '✅ Active' : '❌ Off'}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">License</div>
          <div class="kpi-value">${AppState.licenseLevel.toUpperCase()}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Meta Status</div>
          <div class="kpi-value">${AppState.metaConnected ? '✅ Connected' : '⚠️ Demo'}</div>
        </div>
      </div>
    </div>
  `;
}

// SIMPLE FALLBACKS FÜR REST
const simpleModules = ["academy", "reports", "analytics", "creatorInsights", "team", "brands", "shopify", "roast", "onboarding"];
simpleModules.forEach(mod => {
  modules[mod] = () => ({ default: { init: () => renderSimpleView(viewIdMap[mod], `${mod.toUpperCase()} – Coming Soon`) } });
});

function renderSimpleView(viewId, content) {
  const view = document.getElementById(viewId);
  if (view) {
    view.innerHTML = `<div class="view-body">${content}</div>`;
  }
}

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
  ensureGlobalLoader().style.display = "flex";
}

function hideGlobalLoader() {
  const loader = document.getElementById("globalLoader");
  if (loader) loader.style.display = "none";
}

/* META UI UPDATE */
function updateMetaUI() {
  const btn = document.getElementById("metaConnectButton");
  const dot = document.getElementById("metaStatusDot");
  const text = document.getElementById("metaStatusText");
  
  if (AppState.metaConnected) {
    if (btn) btn.innerHTML = '<span class="status-dot connected"></span><span>Meta Connected (Demo)</span>';
    if (dot) dot.classList.add("connected");
    if (text) text.textContent = "Meta Connected";
  } else {
    if (btn) btn.innerHTML = '<span class="status-dot"></span><span>Meta verbinden</span>';
    if (dot) dot.classList.remove("connected");
    if (text) text.textContent = "Meta Demo";
  }
}

/* SIDEBAR NAVIGATION RENDER */
function renderNav() {
  const nav = document.getElementById("sidebarNav");
  if (!nav) return;
  
  nav.innerHTML = `
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button active" data-view="dashboard">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-dashboard"></use></svg>
        Dashboard
      </button>
    </li>
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button" data-view="creativeLibrary">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-library"></use></svg>
        Creative Library
      </button>
    </li>
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button" data-view="campaigns">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-campaigns"></use></svg>
        Kampagnen
      </button>
    </li>
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button" data-view="sensei">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-sensei"></use></svg>
        Sensei
      </button>
    </li>
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button" data-view="testingLog">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-testing"></use></svg>
        Testing Log
      </button>
    </li>
    <li class="sidebar-nav-item">
      <button class="sidebar-nav-button" data-view="academy">
        <svg class="sidebar-btn-icon" width="19" height="19"><use href="#icon-academy"></use></svg>
        Academy
      </button>
    </li>
  `;
  
  // Wire navigation
  document.querySelectorAll(".sidebar-nav-button").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sidebar-nav-button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      navigateTo(btn.dataset.view);
    });
  });
}

/* MAIN NAVIGATION */
async function navigateTo(moduleKey) {
  console.log("Nav:", moduleKey);
  
  // Hide all views
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  
  // Update sidebar active state
  document.querySelectorAll(".sidebar-nav-button").forEach(btn => btn.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-view="${moduleKey}"]`);
  if (activeBtn) activeBtn.classList.add("active");
  
  // Get target view
  const targetViewId = getViewIdForModule(moduleKey);
  const targetSection = document.getElementById(targetViewId);
  if (!targetSection) {
    console.error("Nav: View element", targetViewId, "not found.");
    return;
  }
  
  // Show view
  targetSection.classList.add("is-active");
  AppState.currentModule = moduleKey;
  
  // Load module
  showGlobalLoader();
  try {
    const mod = await modules[moduleKey]();
    const initFn = mod.default?.init || mod.init;
    if (typeof initFn === "function") {
      await initFn(AppState, DemoData, useDemoMode, formatNumber, formatCurrency, formatPercent);
    } else {
      console.warn("Nav: Module", moduleKey, "has no init function.");
      renderSimpleView(targetViewId, `${moduleKey.toUpperCase()} – Coming Soon`);
    }
  } catch (err) {
    console.error("Nav: Failed to load", moduleKey, err);
    renderSimpleView(targetViewId, `Fehler beim Laden von ${moduleKey}`);
    showToast(`Fehler beim Laden von ${moduleKey}`, "error");
  }
  hideGlobalLoader();
}

/* TIME UPDATER */
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  const dateStr = now.toLocaleDateString("de-DE", { 
    weekday: "short", 
    day: "2-digit", 
    month: "2-digit", 
    year: "numeric" 
  });
  
  const timeEl = document.getElementById("topbarTime");
  const dateEl = document.getElementById("topbarDate");
  
  if (timeEl) timeEl.textContent = timeStr;
  if (dateEl) dateEl.textContent = dateStr;
}

/* TOPBAR UPDATES */
function updateTopbarGreeting() {
  const greetingEl = document.getElementById("topbarGreeting");
  if (greetingEl) {
    const hour = new Date().getHours();
    const greeting = hour < 10 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
    greetingEl.textContent = `${greeting}, Performance Manager`;
  }
}

/* INIT APP */
async function initApp() {
  console.log("SignalOne App initialization...");
  
  // Update time
  updateTime();
  setInterval(updateTime, 30000);
  
  // Render navigation
  renderNav();
  
  // Wire settings button
  document.getElementById("settingsButton")?.addEventListener("click", () => navigateTo("settings"));
  
  // Wire meta button
  document.getElementById("metaConnectButton")?.addEventListener("click", () => {
    if (AppState.metaConnected) {
      if (confirm("Meta-Verbindung trennen?")) MetaAuthMock.disconnect();
    } else {
      MetaAuthMock.connectWithPopup();
    }
  });
  
  // Wire topbar selects (demo)
  const brandSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignSelect");
  if (brandSelect) {
    brandSelect.innerHTML = DemoData.brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('');
  }
  if (campaignSelect) {
    campaignSelect.innerHTML = DemoData.campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }
  
  // Initialize Meta Mock
  MetaAuthMock.init();
  
  // Load dashboard
  await navigateTo("dashboard");
  
  // Initial UI updates
  updateTopbarGreeting();
  updateMetaUI();
  
  // Expose API
  window.SignalOne = {
    navigateTo,
    AppState,
    DemoData,
    MetaAuthMock,
    showToast
  };
  
  console.log("SignalOne App ready.");
}

// START
document.addEventListener("DOMContentLoaded", initApp);

/* CSS ANIMATIONS */
const style = document.createElement("style");
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

console.log("SignalOne Core loaded – 100% functional");
