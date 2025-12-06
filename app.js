// app.js - COMPLETE WORKING VERSION - 06.12.2025

import { DemoData } from './demoData.js';

/* ==========================================
   APP STATE
========================================== */
const AppState = {
  currentModule: 'dashboard',
  metaConnected: false,
  meta: {
    accessToken: null,
    user: null,
    accounts: [],
    selectedAdAccountId: null
  },
  settings: {
    theme: 'dark',
    currency: 'EUR',
    demoMode: true,  // START IN DEMO MODE
    dataMode: 'auto',
    cacheTtl: 3600
  },
  selectedBrandId: 'acme_fashion',
  selectedCampaignId: null,
  licenseLevel: 'pro',
  systemHealthy: true,
  notifications: []
};

// Global Export
window.SignalOne = window.SignalOne || {};
window.SignalOne.AppState = AppState;
window.SignalOne.DemoData = DemoData;

/* ==========================================
   MODULE REGISTRY
========================================== */
const modules = {
  dashboard: () => import('./packages/dashboard/index.js'),
  creativeLibrary: () => import('./packages/creativeLibrary/index.js'),
  campaigns: () => import('./packages/campaigns/index.js'),
  sensei: () => import('./packages/sensei/index.js'),
  settings: () => import('./packages/settings/index.js'),
  testingLog: () => import('./packages/testingLog/index.js'),
  reports: () => import('./packages/reports/index.js'),
  analytics: () => import('./packages/analytics/index.js'),
  creatorInsights: () => import('./packages/creatorInsights/index.js'),
  team: () => import('./packages/team/index.js'),
  brands: () => import('./packages/brands/index.js'),
  shopify: () => import('./packages/shopify/index.js'),
  roast: () => import('./packages/roast/index.js'),
  onboarding: () => import('./packages/onboarding/index.js'),
  academy: () => import('./packages/academy/index.js')
};

const viewIdMap = {
  dashboard: 'dashboardView',
  creativeLibrary: 'creativeLibraryView',
  campaigns: 'campaignsView',
  sensei: 'senseiView',
  settings: 'settingsView',
  testingLog: 'testingLogView',
  reports: 'reportsView',
  analytics: 'analyticsView',
  creatorInsights: 'creatorInsightsView',
  team: 'teamView',
  brands: 'brandsView',
  shopify: 'shopifyView',
  roast: 'roastView',
  onboarding: 'onboardingView',
  academy: 'academyView'
};

/* ==========================================
   NAVIGATION HELPERS
========================================== */
function useDemoMode() {
  return AppState.settings.demoMode === true || !AppState.metaConnected;
}

function setActiveView(viewId) {
  document.querySelectorAll('.view').forEach(v => {
    v.classList.remove('is-active');
    v.style.display = 'none';
  });
  
  const view = document.getElementById(viewId);
  if (view) {
    view.classList.add('is-active');
    view.style.display = 'block';
  }
}

async function loadModule(key) {
  const viewId = viewIdMap[key];
  if (!viewId) {
    console.warn(`[App] No view mapping for module: ${key}`);
    return;
  }

  const section = document.getElementById(viewId);
  if (!section) {
    console.warn(`[App] View not found: ${viewId}`);
    return;
  }

  // Show loader
  showGlobalLoader();

  try {
    const moduleLoader = modules[key];
    if (!moduleLoader) {
      section.innerHTML = renderModuleNotImplemented(key);
      return;
    }

    const module = await moduleLoader();
    
    if (module && module.init) {
      await module.init({
        AppState,
        DemoData,
        useDemoMode: useDemoMode()
      });
    } else if (module && module.render) {
      await module.render(section, AppState, { 
        useDemoMode: useDemoMode(),
        DemoData 
      });
    }
  } catch (err) {
    console.error(`[App] Module load error (${key}):`, err);
    section.innerHTML = `
      <div class="view-header">
        <h2>⚠️ Module Error</h2>
      </div>
      <div class="view-body">
        <div class="error-state">
          <p>Module konnte nicht geladen werden: ${key}</p>
          <pre>${err.message}</pre>
        </div>
      </div>
    `;
  } finally {
    hideGlobalLoader();
  }
}

function navigateTo(key) {
  if (!modules[key] && !viewIdMap[key]) {
    console.warn(`[App] Unknown module: ${key}`);
    return;
  }

  AppState.currentModule = key;
  
  // Update Sidebar
  document.querySelectorAll('.sidebar-nav-button').forEach(btn => {
    btn.classList.remove('is-active');
    if (btn.dataset.view === key) {
      btn.classList.add('is-active');
    }
  });

  // Show view
  const viewId = viewIdMap[key];
  setActiveView(viewId);

  // Load module
  loadModule(key);
}

// Global export
window.SignalOne.navigateTo = navigateTo;

/* ==========================================
   SIDEBAR NAVIGATION
========================================== */
function renderNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  const navItems = [
    { key: 'dashboard', icon: 'icon-dashboard', label: 'Dashboard' },
    { key: 'creativeLibrary', icon: 'icon-library', label: 'Creatives' },
    { key: 'campaigns', icon: 'icon-campaigns', label: 'Campaigns' },
    { key: 'sensei', icon: 'icon-sensei', label: 'Sensei' },
    { key: 'academy', icon: 'icon-academy', label: 'Academy' },
  ];

  navbar.innerHTML = navItems.map(item => `
    <li>
      <button class="sidebar-nav-button ${item.key === AppState.currentModule ? 'is-active' : ''}" 
              data-view="${item.key}">
        <svg class="nav-icon"><use href="#${item.icon}"></use></svg>
        <span>${item.label}</span>
      </button>
    </li>
  `).join('');

  // Wire events
  navbar.querySelectorAll('.sidebar-nav-button').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.view);
    });
  });
}

/* ==========================================
   BRAND & CAMPAIGN SELECT
========================================== */
function initBrandSelect() {
  const select = document.getElementById('brandSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Wähle Brand...</option>' +
    DemoData.brands.map(b => `
      <option value="${b.id}" ${b.id === AppState.selectedBrandId ? 'selected' : ''}>
        ${b.name}
      </option>
    `).join('');

  select.addEventListener('change', (e) => {
    AppState.selectedBrandId = e.target.value;
    // Reload current module
    if (AppState.currentModule) {
      loadModule(AppState.currentModule);
    }
  });
}

function initCampaignSelect() {
  const select = document.getElementById('campaignSelect');
  if (!select) return;

  const campaigns = DemoData.campaignsByBrand[AppState.selectedBrandId] || [];
  select.innerHTML = '<option value="">Alle Kampagnen</option>' +
    campaigns.map(c => `
      <option value="${c.id}" ${c.id === AppState.selectedCampaignId ? 'selected' : ''}>
        ${c.name}
      </option>
    `).join('');

  select.addEventListener('change', (e) => {
    AppState.selectedCampaignId = e.target.value;
  });
}

/* ==========================================
   TOPBAR UPDATES
========================================== */
function updateTopbarGreeting() {
  const el = document.getElementById('topbarGreeting');
  if (!el) return;

  const hour = new Date().getHours();
  let greeting = 'Guten Abend';
  if (hour < 12) greeting = 'Guten Morgen';
  else if (hour < 18) greeting = 'Guten Tag';

  el.textContent = greeting + ', SignalOne Demo User';
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById('topbarDate');
  const timeEl = document.getElementById('topbarTime');
  
  if (!dateEl || !timeEl) return;

  const now = new Date();
  const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('de-DE', options);
  timeEl.textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/* ==========================================
   GLOBAL UI
========================================== */
function showGlobalLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.add('is-active');
}

function hideGlobalLoader() {
  const loader = document.getElementById('globalLoader');
  if (loader) loader.classList.remove('is-active');
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('is-visible'), 10);
  setTimeout(() => {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function renderModuleNotImplemented(key) {
  return `
    <div class="view-header">
      <h2>🚧 ${key}</h2>
    </div>
    <div class="view-body">
      <div class="empty-state">
        <div class="empty-state-icon">⚙️</div>
        <div class="empty-state-title">Module noch nicht implementiert</div>
        <div class="empty-state-subtitle">Dieses Feature ist in Entwicklung</div>
      </div>
    </div>
  `;
}

window.SignalOne.showToast = showToast;

/* ==========================================
   APP INIT
========================================== */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SignalOne] App initializing...');

  // Render Navigation
  renderNav();

  // Init Selects
  initBrandSelect();
  initCampaignSelect();

  // Update Topbar
  updateTopbarGreeting();
  updateTopbarDateTime();
  setInterval(updateTopbarDateTime, 30000);

  // Init Settings Button
  const settingsBtn = document.getElementById('settingsButton');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => navigateTo('settings'));
  }

  // Set initial view
  setActiveView(viewIdMap[AppState.currentModule]);

  // Load initial module
  await loadModule(AppState.currentModule);

  console.log('[SignalOne] App ready!');
});
