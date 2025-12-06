// ============================================================
// Application State - Fixed Version
// Added: Constants, Better structure, Type documentation
// ============================================================

import ENV from './config.js';

// ============================================================
// CONSTANTS
// ============================================================

export const MODULES = {
  DASHBOARD: 'dashboard',
  CREATIVE_LIBRARY: 'creativeLibrary',
  CAMPAIGNS: 'campaigns',
  TESTING_LOG: 'testingLog',
  SENSEI: 'sensei',
  ONBOARDING: 'onboarding',
  TEAM: 'team',
  BRANDS: 'brands',
  REPORTS: 'reports',
  CREATOR_INSIGHTS: 'creatorInsights',
  ANALYTICS: 'analytics',
  ROAST: 'roast',
  SHOPIFY: 'shopify',
  SETTINGS: 'settings'
};

export const TIME_RANGES = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7D: 'last_7d',
  LAST_14D: 'last_14d',
  LAST_30D: 'last_30d'
};

export const THEMES = {
  LIGHT: 'light',
  TITANIUM: 'titanium',
  DARK: 'dark'
};

export const CURRENCIES = {
  EUR: 'EUR',
  USD: 'USD',
  GBP: 'GBP'
};

export const LICENSE_LEVELS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// ============================================================
// APP STATE
// ============================================================

/**
 * @typedef {Object} MetaState
 * @property {string|null} accessToken
 * @property {Array} adAccounts
 * @property {Array} campaigns
 * @property {Array} ads
 * @property {Array} creatives
 * @property {Object} insightsByCampaign
 * @property {Object|null} user
 */

/**
 * @typedef {Object} AppSettings
 * @property {string} theme
 * @property {string} currency
 * @property {number} metaCacheTtlMinutes
 * @property {string} defaultTimeRange
 * @property {string} creativeLayout
 * @property {boolean} demoMode
 */

export const AppState = {
  // Navigation
  currentModule: MODULES.DASHBOARD,
  
  // Meta Connection
  metaConnected: false,
  
  // Meta Data
  meta: {
    accessToken: null,
    adAccounts: [],
    campaigns: [],
    ads: [],
    creatives: [],
    insightsByCampaign: {},
    user: null
  },
  
  // Selection
  selectedAccountId: null,
  selectedCampaignId: 'ALL',
  selectedBrandId: null,
  
  // Time Range
  timeRangePreset: TIME_RANGES.LAST_30D,
  
  // License & Features
  licenseLevel: LICENSE_LEVELS.FREE,
  
  // System Status
  systemHealthy: true,
  
  // Notifications
  notifications: [],
  
  // Settings
  settings: {
    theme: THEMES.TITANIUM,
    currency: CURRENCIES.EUR,
    metaCacheTtlMinutes: ENV.CACHE_TTL_MINUTES,
    defaultTimeRange: TIME_RANGES.LAST_30D,
    creativeLayout: 'grid',
    demoMode: ENV.FEATURES.DEMO_MODE
  },
  
  // Data Layer Cache
  metaCache: {
    adAccounts: null,
    campaignsByAccount: {},
    adsByAccount: {}
  },
  
  // Module Load States
  dashboardLoaded: false,
  campaignsLoaded: false,
  creativesLoaded: false,
  
  // Testing Log
  testingLog: [],
  
  // Dashboard Metrics
  dashboardMetrics: null,
  
  // Config Reference
  config: {
    meta: {
      appId: ENV.META_APP_ID
    }
  }
};

// Freeze constants to prevent modifications
Object.freeze(MODULES);
Object.freeze(TIME_RANGES);
Object.freeze(THEMES);
Object.freeze(CURRENCIES);
Object.freeze(LICENSE_LEVELS);
