// ============================================================
// SignalOne.cloud Frontend Core - FIXED VERSION
// 
// Fixed:
// - XSS Prevention (sanitizeHtml statt innerHTML)
// - Secure Storage (encrypted localStorage)
// - Better Error Handling
// - Constants statt Magic Strings
// - Improved State Management
// - Loading States
// - Code Organization
// ============================================================

import ENV from './config.js';
import SecureStorage from './utils/storage.js';
import { escapeHtml, sanitizeHtml, createSafeElement } from './utils/sanitize.js';
import { AppState, MODULES, TIME_RANGES, THEMES } from './state.js';
import DataLayer from './packages/data/index.js';
import { clearMetaCache } from './metaApi.js';

// ============================================================
// META AUTH MOCK (Demo Mode)
// ============================================================

const MetaAuthMock = (() => {
  const STORAGE_KEY = ENV.STORAGE_KEYS.META_AUTH;
  
  let state = {
    connected: false,
    accessToken: null,
    user: null
  };
  
  function loadFromStorage() {
    try {
      const saved = SecureStorage.get(STORAGE_KEY);
      if (saved) {
        state = { ...state, ...saved, connected: !!saved.connected };
      }
    } catch (err) {
      console.warn('MetaAuthMock: Could not load state', err);
    }
  }
  
  function saveToStorage() {
    try {
      SecureStorage.set(STORAGE_KEY, state);
    } catch (err) {
      console.warn('MetaAuthMock: Could not save state', err);
    }
  }
  
  function syncToAppState() {
    AppState.metaConnected = state.connected;
    AppState.meta.accessToken = state.accessToken;
    AppState.meta.user = state.user;
    
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
    // Demo simulation
    setTimeout(() => {
      state.connected = true;
      state.accessToken = 'demo-access-token-' + Date.now();
      state.user = {
        id: '1234567890',
        name: 'SignalOne Demo User',
        email: 'demo@signalone.cloud'
      };
      
      saveToStorage();
      syncToAppState();
      
      showToast('Meta Ads Demo successfully connected.', 'success');
    }, 600);
  }
  
  function disconnect() {
    state.connected = false;
    state.accessToken = null;
    state.user = null;
    
    saveToStorage();
    syncToAppState();
    clearMetaCache(); // Clear API cache on disconnect
    
    showToast('Meta connection disconnected (Demo).', 'info');
  }
  
  return {
    init,
    connectWithPopup,
    disconnect
  };
})();

// ============================================================
// DEMO DATA (Brands & Campaigns)
// ============================================================

const DemoData = {
  brands: [
    {
      id: 'acme-fashion',
      name: 'ACME Fashion',
      ownerName: 'ACME Fashion GmbH',
      vertical: 'D2C Fashion & Apparel',
      spend30d: 58442,
      roas30d: 5.9,
      campaignHealth: 'good'
    },
    {
      id: 'tech-gadgets-pro',
      name: 'TechGadgets Pro',
      ownerName: 'TechGadgets Pro GmbH',
      vertical: 'Consumer Electronics',
      spend30d: 43211,
      roas30d: 4.4,
      campaignHealth: 'good'
    },
    {
      id: 'beauty-lux-cosmetics',
      name: 'BeautyLux Cosmetics',
      ownerName: 'BeautyLux GmbH',
      vertical: 'Cosmetics & Beauty',
      spend30d: 29877,
      roas30d: 3.8,
      campaignHealth: 'warning'
    },
    {
      id: 'fitlife-supplements',
      name: 'FitLife Supplements',
      ownerName: 'FitLife Labs',
      vertical: 'Fitness & Nutrition',
      spend30d: 32101,
      roas30d: 4.1,
      campaignHealth: 'warning'
    },
    {
      id: 'homezen-living',
      name: 'HomeZen Living',
      ownerName: 'HomeZen Living GmbH',
      vertical: 'Home & Living & Deko',
      spend30d: 19883,
      roas30d: 3.6,
      campaignHealth: 'critical'
    }
  ],
  
  campaignsByBrand: {
    'acme-fashion': [
      { id: 'acme-ugc-scale', name: 'UGC Scale Test', status: 'ACTIVE' },
      { id: 'acme-brand-static', name: 'Brand Awareness Static', status: 'PAUSED' },
      { id: 'acme-hook-battle', name: 'Hook Battle Q4', status: 'TESTING' }
    ],
    'tech-gadgets-pro': [
      { id: 'tech-launch', name: 'Launch Funnel EU', status: 'ACTIVE' },
      { id: 'tech-retarg', name: 'Retargeting Core', status: 'ACTIVE' }
    ],
    'beauty-lux-cosmetics': [
      { id: 'beauty-creators', name: 'Creator Evergreen', status: 'ACTIVE' },
      { id: 'beauty-ba', name: 'Brand Awareness Beauty', status: 'PAUSED' }
    ],
    'fitlife-supplements': [
      { id: 'fit-scale', name: 'Scale Stack Q4', status: 'ACTIVE' }
    ],
    'homezen-living': [
      { id: 'home-test', name: 'Creative Testing', status: 'TESTING' }
    ]
  }
};

// Expose DemoData globally for other modules
window.SignalOneDemo = window.SignalOneDemo || {};
window.SignalOneDemo.DemoData = DemoData;
window.SignalOneDemo.brands = DemoData.brands;

console.log('📊 DemoData loaded:', DemoData.brands.length, 'Brands');

// ============================================================
// HELPER: Check if Demo Mode should be used
// ============================================================

function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

// ============================================================
// MODULE REGISTRY
// ============================================================

const moduleLoaders = {
  [MODULES.DASHBOARD]: () => import('./packages/dashboard/index.js'),
  [MODULES.CREATIVE_LIBRARY]: () => import('./packages/creativeLibrary/index.js'),
  [MODULES.CAMPAIGNS]: () => import('./packages/campaigns/index.js'),
  [MODULES.TESTING_LOG]: () => import('./packages/testingLog/index.js'),
  [MODULES.SENSEI]: () => import('./packages/sensei/index.js'),
  [MODULES.ONBOARDING]: () => import('./packages/onboarding/index.js'),
  [MODULES.TEAM]: () => import('./packages/team/index.js'),
  [MODULES.BRANDS]: () => import('./packages/brands/index.js'),
  [MODULES.REPORTS]: () => import('./packages/reports/index.js'),
  [MODULES.CREATOR_INSIGHTS]: () => import('./packages/creatorInsights/index.js'),
  [MODULES.ANALYTICS]: () => import('./packages/analytics/index.js'),
  [MODULES.ROAST]: () => import('./packages/roast/index.js'),
  [MODULES.SHOPIFY]: () => import('./packages/shopify/index.js'),
  [MODULES.SETTINGS]: () => import('./packages/settings/index.js')
};

const moduleLabels = {
  [MODULES.DASHBOARD]: 'Dashboard',
  [MODULES.CREATIVE_LIBRARY]: 'Creative Library',
  [MODULES.CAMPAIGNS]: 'Kampagnen',
  [MODULES.SENSEI]: 'Sensei',
  [MODULES.TESTING_LOG]: 'Testing Log',
  [MODULES.REPORTS]: 'Reports',
  [MODULES.CREATOR_INSIGHTS]: 'Creator Insights',
  [MODULES.ANALYTICS]: 'Analytics',
  [MODULES.TEAM]: 'Team',
  [MODULES.BRANDS]: 'Brands',
  [MODULES.SHOPIFY]: 'Shopify',
  [MODULES.ROAST]: 'Roast',
  [MODULES.ONBOARDING]: 'Onboarding',
  [MODULES.SETTINGS]: 'Settings'
};

const viewIdMap = {
  [MODULES.DASHBOARD]: 'dashboardView',
  [MODULES.CREATIVE_LIBRARY]: 'creativeLibraryView',
  [MODULES.CAMPAIGNS]: 'campaignsView',
  [MODULES.SENSEI]: 'senseiView',
  [MODULES.TESTING_LOG]: 'testingLogView',
  [MODULES.REPORTS]: 'reportsView',
  [MODULES.CREATOR_INSIGHTS]: 'creatorInsightsView',
  [MODULES.ANALYTICS]: 'analyticsView',
  [MODULES.TEAM]: 'teamView',
  [MODULES.BRANDS]: 'brandsView',
  [MODULES.SHOPIFY]: 'shopifyView',
  [MODULES.ROAST]: 'roastView',
  [MODULES.ONBOARDING]: 'onboardingView',
  [MODULES.SETTINGS]: 'settingsView'
};

const modulesRequiringMeta = [
  MODULES.DASHBOARD,
  MODULES.CREATIVE_LIBRARY,
  MODULES.CAMPAIGNS,
  MODULES.TESTING_LOG,
  MODULES.SENSEI,
  MODULES.CREATOR_INSIGHTS,
  MODULES.ANALYTICS,
  MODULES.REPORTS
];

const moduleIconIds = {
  [MODULES.DASHBOARD]: '#icon-dashboard',
  [MODULES.CREATIVE_LIBRARY]: '#icon-library',
  [MODULES.CAMPAIGNS]: '#icon-campaigns',
  [MODULES.TESTING_LOG]: '#icon-testing',
  [MODULES.SENSEI]: '#icon-sensei',
  [MODULES.REPORTS]: '#icon-reports',
  [MODULES.CREATOR_INSIGHTS]: '#icon-creators',
  [MODULES.ANALYTICS]: '#icon-analytics',
  [MODULES.TEAM]: '#icon-team',
  [MODULES.BRANDS]: '#icon-brands',
  [MODULES.SHOPIFY]: '#icon-shopify',
  [MODULES.ROAST]: '#icon-roast',
  [MODULES.ONBOARDING]: '#icon-onboarding',
  [MODULES.SETTINGS]: '#icon-settings'
};

// ============================================================
// VIEW HELPERS
// ============================================================

function getViewIdForModule(key) {
  return viewIdMap[key] || 'dashboardView';
}

function getLabelForModule(key) {
  return moduleLabels[key] || key;
}

function createSvgIconFromSymbol(symbolId, className) {
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', `${className} icon-svg`);
  
  const use = document.createElementNS(svgNS, 'use');
  use.setAttributeNS('http://www.w3.org/1999/xlink', 'href', symbolId);
  
  svg.appendChild(use);
  return svg;
}

function setActiveView(viewId) {
  const views = document.querySelectorAll('.view');
  
  views.forEach(v => {
    if (v.id === viewId) {
      v.classList.remove('hidden');
    } else {
      v.classList.add('hidden');
    }
  });
}

// ============================================================
// BRAND & CAMPAIGN CONTEXT
// ============================================================

function getActiveBrand() {
  if (!AppState.selectedBrandId) return null;
  return DemoData.brands.find(b => b.id === AppState.selectedBrandId) || null;
}

function getEffectiveBrandOwnerName() {
  const brand = getActiveBrand();
  if (brand?.ownerName) return brand.ownerName;
  return AppState.meta?.user?.name || 'SignalOne User';
}

function getActiveBrandContext() {
  const brand = getActiveBrand();
  if (!brand) return null;
  
  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const count = campaigns.length;
  const campaignText = count === 1 
    ? '1 Kampagne sichtbar' 
    : `${count} Kampagnen sichtbar`;
  
  return {
    name: brand.ownerName || brand.name || 'Unbekanntes Werbekonto',
    vertical: brand.vertical || 'n/a',
    campaignText
  };
}

// ============================================================
// TOPBAR - TIME & GREETING
// ============================================================

function updateTopbarDateTime() {
  const dateEl = document.getElementById('topbarDate');
  const timeEl = document.getElementById('topbarTime');
  const now = new Date();
  
  if (dateEl) {
    dateEl.textContent = `Datum: ${now.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })}`;
  }
  
  if (timeEl) {
    timeEl.textContent = `Zeit: ${now.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })}`;
  }
}

function updateTopbarGreeting() {
  const el = document.getElementById('topbarGreeting');
  if (!el) return;
  
  const hour = new Date().getHours();
  let base = 'Hello';
  
  if (hour < 11) {
    base = 'Guten Morgen';
  } else if (hour < 18) {
    base = 'Guten Tag';
  } else {
    base = 'Guten Abend';
  }
  
  const brand = getActiveBrand();
  const name = brand?.ownerName || brand?.name || 'Operator';
  const mode = useDemoMode() ? '(Demo-Modus)' : '(Live-Daten)';
  
  // Safe text setting (no XSS risk)
  el.textContent = `${base}, ${name} ${mode}`;
}

// ============================================================
// VIEW SUBHEADER
// ============================================================

function updateViewSubheaders() {
  const views = document.querySelectorAll('.view');
  if (!views.length) return;
  
  const ctx = getActiveBrandContext();
  if (!ctx) return;
  
  views.forEach(section => {
    if (!section) return;
    
    let header = section.querySelector('.view-subheader');
    
    if (!header) {
      header = document.createElement('div');
      header.className = 'view-subheader';
      section.insertBefore(header, section.firstChild);
    }
    
    // Use safe DOM manipulation instead of innerHTML
    header.innerHTML = ''; // Clear first
    
    // Line 1
    const line1 = document.createElement('div');
    line1.className = 'subheader-line-1';
    
    const iconSlot = document.createElement('span');
    iconSlot.className = 'subheader-icon-slot';
    
    const brandName = createSafeElement('span', ctx.name, 'subheader-brand-name');
    const role = createSafeElement('span', 'Aktives Werbekonto', 'subheader-role');
    
    line1.appendChild(iconSlot);
    line1.appendChild(brandName);
    line1.appendChild(role);
    
    // Line 2
    const line2 = document.createElement('div');
    line2.className = 'subheader-line-2';
    
    const campaigns = createSafeElement('span', ctx.campaignText, 'subheader-campaigns');
    const divider = createSafeElement('span', '•', 'subheader-divider');
    const industry = createSafeElement('span', `Industry: ${ctx.vertical}`, 'subheader-industry');
    
    line2.appendChild(campaigns);
    line2.appendChild(divider);
    line2.appendChild(industry);
    
    header.appendChild(line1);
    header.appendChild(line2);
    
    // Add icon
    const slot = header.querySelector('.subheader-icon-slot');
    if (slot) {
      const icon = createSvgIconFromSymbol('#icon-workspace', 'subheader-icon');
      slot.replaceWith(icon);
    }
  });
}

// ============================================================
// SIDEBAR - NAVIGATION & STATUS
// ============================================================

function updateSidebarActiveIcon(activeKey) {
  const buttons = document.querySelectorAll('.sidebar-nav-button');
  
  buttons.forEach(btn => {
    const module = btn.dataset.module;
    if (module === activeKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function renderNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;
  
  navbar.innerHTML = '';
  
  const license = AppState.licenseLevel;
  const restrictedForFree = [
    MODULES.REPORTS,
    MODULES.TEAM,
    MODULES.BRANDS,
    MODULES.CREATOR_INSIGHTS,
    MODULES.ANALYTICS,
    MODULES.SHOPIFY
  ];
  
  Object.keys(moduleLoaders).forEach(key => {
    // Settings button is rendered separately
    if (key === MODULES.SETTINGS) return;
    
    // Free license restrictions
    if (license === 'free' && restrictedForFree.includes(key)) {
      return;
    }
    
    const li = document.createElement('li');
    li.className = 'sidebar-nav-item';
    
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sidebar-nav-button';
    btn.dataset.module = key;
    
    const symbolId = moduleIconIds[key];
    if (symbolId) {
      const iconSvg = createSvgIconFromSymbol(symbolId, 'icon-svg');
      btn.appendChild(iconSvg);
    }
    
    const labelSpan = createSafeElement('span', getLabelForModule(key), 'label');
    btn.appendChild(labelSpan);
    
    btn.addEventListener('click', () => navigateTo(key));
    
    li.appendChild(btn);
    navbar.appendChild(li);
  });
  
  updateSidebarActiveIcon(AppState.currentModule);
}

// ============================================================
// STATUS DOTS (Meta, System, Campaign Health)
// ============================================================

function updateMetaStatusUI() {
  const dot = document.getElementById('sidebarMetaDot');
  const label = document.getElementById('sidebarMetaLabel');
  
  if (!dot || !label) return;
  
  if (AppState.metaConnected) {
    dot.style.backgroundColor = 'var(--color-success)';
    label.textContent = 'Meta Ads Verbunden (Demo)';
  } else {
    dot.style.backgroundColor = 'var(--color-text-soft)';
    label.textContent = 'Meta Ads Getrennt';
  }
}

function updateSystemHealthUI() {
  const dot = document.getElementById('sidebarSystemDot');
  const label = document.getElementById('sidebarSystemLabel');
  
  if (!dot || !label) return;
  
  if (AppState.systemHealthy) {
    dot.style.backgroundColor = 'var(--color-success)';
    label.textContent = 'System Health OK';
  } else {
    dot.style.backgroundColor = 'var(--color-warning)';
    label.textContent = 'System Health: Check Logs';
  }
}

function updateCampaignHealthUI() {
  const dot = document.getElementById('sidebarCampaignDot');
  const label = document.getElementById('sidebarCampaignLabel');
  
  if (!dot || !label) return;
  
  const brand = getActiveBrand();
  
  if (!brand) {
    dot.style.backgroundColor = 'var(--color-text-soft)';
    label.textContent = 'Campaign Health: n/a';
    return;
  }
  
  switch (brand.campaignHealth) {
    case 'good':
      dot.style.backgroundColor = 'var(--color-success)';
      label.textContent = 'Campaign Health: Stark';
      break;
    case 'warning':
      dot.style.backgroundColor = 'var(--color-warning)';
      label.textContent = 'Campaign Health: Beobachten';
      break;
    case 'critical':
      dot.style.backgroundColor = 'var(--color-danger)';
      label.textContent = 'Campaign Health: Kritisch';
      break;
    default:
      dot.style.backgroundColor = 'var(--color-text-soft)';
      label.textContent = 'Campaign Health: n/a';
  }
}

// ============================================================
// LOADING STATES
// ============================================================

function showGlobalLoader() {
  document.getElementById('globalLoader')?.classList.remove('hidden');
}

function hideGlobalLoader() {
  document.getElementById('globalLoader')?.classList.add('hidden');
}

function applySectionSkeleton(section) {
  if (!section) return;
  
  section.innerHTML = `
    <div class="skeleton-block" style="height: 20px; width: 40%; margin-bottom: 16px;"></div>
    <div class="skeleton-block" style="height: 120px; margin-bottom: 14px;"></div>
    <div class="skeleton-block" style="height: 200px;"></div>
  `;
}

function fadeIn(el) {
  if (!el) return;
  
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.18s ease';
  
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });
}

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  
  if (!container) {
    alert(message);
    return;
  }
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message; // Safe - uses textContent
  
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.classList.add('visible');
  });
  
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// ============================================================
// MODAL
// ============================================================

function openSystemModal(title, bodyHtml) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const bodyEl = document.getElementById('modalBody');
  
  if (!overlay || !titleEl || !bodyEl) return;
  
  titleEl.textContent = title; // Safe
  bodyEl.innerHTML = sanitizeHtml(bodyHtml); // Sanitized!
  
  overlay.classList.add('open');
}

function closeSystemModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  
  overlay.classList.remove('open');
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function pushNotification(type, message, meta = {}) {
  AppState.notifications.push({
    type,
    message,
    meta,
    ts: Date.now()
  });
}

function clearNotifications() {
  AppState.notifications = [];
}

// ============================================================
// META CONNECTION TOGGLE
// ============================================================

function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuthMock.disconnect();
  } else {
    MetaAuthMock.connectWithPopup();
  }
}

// ============================================================
// BRAND & CAMPAIGN SELECT
// ============================================================

function populateBrandSelect() {
  const select = document.getElementById('brandSelect');
  if (!select) return;
  
  select.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Werbekonto auswählen';
  select.appendChild(defaultOption);
  
  DemoData.brands.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.vertical})`;
    select.appendChild(opt);
  });
  
  // Auto-select first if none selected
  if (!AppState.selectedBrandId && DemoData.brands[0]) {
    AppState.selectedBrandId = DemoData.brands[0].id;
    select.value = DemoData.brands[0].id;
  } else {
    select.value = AppState.selectedBrandId;
  }
  
  updateViewSubheaders();
}

function populateCampaignSelect() {
  const select = document.getElementById('campaignSelect');
  if (!select) return;
  
  select.innerHTML = '';
  
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Kampagne auswählen';
  select.appendChild(defaultOption);
  
  const brandId = AppState.selectedBrandId;
  if (!brandId) return;
  
  const campaigns = DemoData.campaignsByBrand[brandId] || [];
  
  campaigns.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = `${c.name} [${c.status}]`;
    select.appendChild(opt);
  });
  
  // Auto-select first if none selected
  if (!AppState.selectedCampaignId && campaigns[0]) {
    AppState.selectedCampaignId = campaigns[0].id;
    select.value = campaigns[0].id;
  } else {
    select.value = AppState.selectedCampaignId;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = document.getElementById('brandSelect');
  const campaignSelect = document.getElementById('campaignSelect');
  
  if (brandSelect) {
    brandSelect.addEventListener('change', () => {
      AppState.selectedBrandId = brandSelect.value || null;
      AppState.selectedCampaignId = null;
      
      populateCampaignSelect();
      updateViewSubheaders();
      updateCampaignHealthUI();
      
      loadModule(AppState.currentModule);
    });
  }
  
  if (campaignSelect) {
    campaignSelect.addEventListener('change', () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      updateViewSubheaders();
      loadModule(AppState.currentModule);
    });
  }
}

// ============================================================
// MODULE LOADING & NAVIGATION
// ============================================================

async function loadModule(key) {
  const loader = moduleLoaders[key];
  const viewId = getViewIdForModule(key);
  const section = document.getElementById(viewId);
  
  if (!loader || !section) {
    console.warn('SignalOne: Module not found', key, viewId);
    return;
  }
  
  // Check if module requires Meta connection
  if (modulesRequiringMeta.includes(key) && !AppState.metaConnected && !useDemoMode()) {
    section.innerHTML = '';
    
    const msg = createSafeElement('p', 'Dieses Modul benötigt eine Meta-Verbindung oder den Demo-Modus.');
    section.appendChild(msg);
    
    showToast('Bitte Meta verbinden oder Demo-Modus aktivieren.', 'warning');
    updateCampaignHealthUI();
    return;
  }
  
  showGlobalLoader();
  applySectionSkeleton(section);
  
  try {
    const module = await loader();
    
    if (module?.render) {
      // Clear and render
      section.innerHTML = '';
      
      // Module returns HTML string - sanitize it!
      const rendered = module.render(section, AppState, useDemoMode);
      
      if (typeof rendered === 'string') {
        section.innerHTML = sanitizeHtml(rendered);
      }
      
      fadeIn(section);
    } else {
      section.innerHTML = '';
      const msg = createSafeElement('p', `Das Modul "${getLabelForModule(key)}" ist noch nicht implementiert.`);
      section.appendChild(msg);
    }
    
    AppState.systemHealthy = true;
    
  } catch (err) {
    console.error('SignalOne: Module Load Error', key, err);
    
    section.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.cssText = 'display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; color:#64748b; text-align:center;';
    
    const icon = document.createElement('div');
    icon.style.cssText = 'font-size:3rem; margin-bottom:10px;';
    icon.textContent = '⚠️';
    
    const heading = createSafeElement('h3', 'Modul noch nicht verfügbar');
    heading.style.cssText = 'margin:0; font-size:1.2rem; color:#475569;';
    
    const text = createSafeElement('p', `Das Modul "${getLabelForModule(key)}" existiert in dieser Demo-Umgebung noch nicht als Datei.`);
    text.style.cssText = 'margin-top:8px;';
    
    container.appendChild(icon);
    container.appendChild(heading);
    container.appendChild(text);
    
    section.appendChild(container);
    
    AppState.systemHealthy = true;
    
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
    updateViewSubheaders();
  }
}

async function navigateTo(key) {
  if (!moduleLoaders[key]) return;
  
  AppState.currentModule = key;
  
  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  
  renderNav();
  updateSidebarActiveIcon(key);
  updateTopbarGreeting();
  updateViewSubheaders();
  
  await loadModule(key);
}

// ============================================================
// TESTING LOG GLOBAL API
// ============================================================

const TESTING_LOG_STORAGE_KEY = ENV.STORAGE_KEYS.TESTING_LOG;

function loadStoredTestingEntries() {
  try {
    const entries = SecureStorage.get(TESTING_LOG_STORAGE_KEY, []);
    return Array.isArray(entries) ? entries : [];
  } catch {
    return [];
  }
}

function saveTestingEntries(entries) {
  try {
    SecureStorage.set(TESTING_LOG_STORAGE_KEY, entries);
  } catch {
    // Ignore
  }
}

function createDefaultTestingEntries() {
  const now = Date.now();
  
  function baseMetrics(roas, spend, ctr, cpm, cpa, purchases) {
    return { roas, spend, ctr, cpm, cpa, purchases };
  }
  
  return [
    {
      id: 'demo-test-1',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      creativeA: {
        name: 'UGC "Mein Freund hasst es"',
        metrics: baseMetrics(3.6, 5400, 0.032, 8.9, 21, 94)
      },
      creativeB: {
        name: 'Static -30% Offer',
        metrics: baseMetrics(1.5, 1200, 0.018, 9.1, 42, 23)
      },
      decision: { winner: 'A', reason: 'A liefert deutlich höheren ROAS + bessere CTR bei relevantem Spend.' }
    },
    {
      id: 'demo-test-2',
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      creativeA: {
        name: 'Hook "Ich habe DAS ausprobiert"',
        metrics: baseMetrics(4.3, 2100, 0.048, 7.2, 18, 87)
      },
      creativeB: {
        name: 'Creator Review 60s',
        metrics: baseMetrics(3.9, 1900, 0.041, 7.8, 20, 71)
      },
      decision: { winner: 'A', reason: 'A gewinnt knapp auf ROAS + CTR. Winner in Testing übernehmen.' }
    },
    {
      id: 'demo-test-3',
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      creativeA: {
        name: 'Offer Stacking "3 für 2"',
        metrics: baseMetrics(2.8, 3100, 0.029, 9.5, 28, 62)
      },
      creativeB: {
        name: 'Evergreen UGC Routine',
        metrics: baseMetrics(4.9, 4200, 0.045, 8.1, 17, 133)
      },
      decision: { winner: 'B', reason: 'B outperformt A deutlich. Scaling: Budget von A zu B verschieben.' }
    }
  ];
}

function createTestingLogAPI() {
  let entries = loadStoredTestingEntries();
  
  if (!entries.length) {
    entries = createDefaultTestingEntries();
    saveTestingEntries(entries);
  }
  
  function add(entry) {
    const id = entry.id || `test-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    
    const normalized = {
      id,
      createdAt: entry.createdAt || new Date().toISOString(),
      creativeA: {
        name: entry.creativeA?.name || 'Creative A',
        metrics: entry.creativeA?.metrics || {}
      },
      creativeB: {
        name: entry.creativeB?.name || 'Creative B',
        metrics: entry.creativeB?.metrics || {}
      },
      decision: entry.decision || { winner: 'A', reason: 'n/a' }
    };
    
    entries = [normalized, ...entries];
    saveTestingEntries(entries);
  }
  
  function clear() {
    entries = [];
    saveTestingEntries(entries);
  }
  
  function seedDemo() {
    entries = createDefaultTestingEntries();
    saveTestingEntries(entries);
    showToast('Demo-Testing-Log zurückgesetzt.', 'info');
  }
  
  function openTestSlot(creativeA, candidates) {
    const name = creativeA?.name || 'Creative A';
    const open = window.SignalOne?.openSystemModal || openSystemModal;
    
    const list = candidates && candidates.length 
      ? `<ul>${candidates.map(c => `<li>${c.name} (Creative ROAS: ${c.metrics?.roas ?? 'x'})</li>`).join('')}</ul>`
      : '<p>Keine weiteren Creatives übergeben.</p>';
    
    open(
      'Testing Slot (Demo)',
      `<p>In der finalen Version öffnest du hier direkt einen neuen A/B-Test-Slot.</p>
       <p><strong>Target:</strong> ${name}</p>
       <div style="margin-top:12px;">
         <strong>Kandidaten:</strong><br>
         ${list}
       </div>
       <p style="margin-top:12px; font-size:0.85rem; color:#64748b;">
         Aktuell ist dies ein Demo-Overlay. Die Tabelle im Testing Log ist aber bereits an die TestingLog-API angebunden.
       </p>`
    );
  }
  
  return {
    get: () => entries,
    add,
    clear,
    seedDemo,
    openTestSlot
  };
}

const TestingLogAPI = createTestingLogAPI();

// ============================================================
// BOOTSTRAP - App Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 SignalOne Bootstrap starting...');
  
  // Initialize Meta Auth Mock
  MetaAuthMock.init();
  
  // Render navigation
  renderNav();
  
  // Populate selects
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();
  
  // Set initial view
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  
  // Wire Meta Connect Button
  document.getElementById('metaConnectButton')?.addEventListener('click', toggleMetaConnection);
  
  // Update UI
  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();
  updateViewSubheaders();
  
  // Wire Settings Button
  const settingsBtn = document.getElementById('settingsButton');
  settingsBtn?.addEventListener('click', () => navigateTo(MODULES.SETTINGS));
  
  // Wire Modal
  const modalCloseBtn = document.getElementById('modalCloseButton');
  const modalOverlay = document.getElementById('modalOverlay');
  
  modalCloseBtn?.addEventListener('click', closeSystemModal);
  modalOverlay?.addEventListener('click', (evt) => {
    if (evt.target === modalOverlay) {
      closeSystemModal();
    }
  });
  
  // Wire Profile Button
  const profileBtn = document.getElementById('profileButton');
  profileBtn?.addEventListener('click', () => {
    openSystemModal(
      'Profil',
      `<p>Aktuell angemeldet als <strong>${escapeHtml(getEffectiveBrandOwnerName())}</strong>.</p>
       <p style="margin-top:6px; font-size:0.85rem; color:#6b7280;">Simulierter Nutzer</p>`
    );
  });
  
  // Wire Notifications Button
  const notificationsBtn = document.getElementById('notificationsButton');
  notificationsBtn?.addEventListener('click', () => {
    if (!AppState.notifications.length) {
      openSystemModal('Benachrichtigungen', '<p>Keine Fehler oder kritischen Warnungen vorhanden.</p>');
    } else {
      const items = AppState.notifications
        .map(n => `<li><strong>${escapeHtml(n.type.toUpperCase())}</strong>: ${escapeHtml(n.message)}</li>`)
        .join('');
      
      openSystemModal('Benachrichtigungen', `<p>Fehler & Warnungen</p><ul>${items}</ul>`);
      clearNotifications();
    }
  });
  
  // Wire Logout Button
  const logoutBtn = document.getElementById('logoutButton');
  logoutBtn?.addEventListener('click', () => {
    MetaAuthMock.disconnect();
    showToast('Session zurückgesetzt.', 'success');
  });
  
  // Update time display
  updateTopbarDateTime();
  updateTopbarGreeting();
  
  // Update time every minute
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);
  
  // Load initial module
  loadModule(AppState.currentModule);
  
  console.log('✅ SignalOne Bootstrap complete!');
});

// ============================================================
// EXPOSED GLOBAL API
// ============================================================

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
    fadeIn
  },
  useDemoMode,
  ENV,
  version: ENV.APP_VERSION
};
