## 📄 state.js (Komplett-Code – FIXED & CLEAN)

// state.js – SignalOne.cloud – FIXED 2025

const META_APP_ID = "732040642590155";

export const META_OAUTH_CONFIG = {
  appId: META_APP_ID,

  // Wichtig: Redirect zu deiner Domain, nicht Code-URL
  redirectUri: "https://signalone-frontend.onrender.com/auth-complete",

  // FIXED: Moderne Meta Ads Scopes 2025
  scopes: "ads_read,ads_management,business_management"
};

export const AppState = {
  currentView: "dashboardView",
  metaConnected: false,

  meta: {
    accessToken: null,
    adAccounts: [],
    campaigns: [],
    ads: [],
    creatives: [],
    insightsByCampaign: {},
    user: null,
  },

  selectedAccountId: null,
  selectedCampaignId: "ALL",

  timeRangePreset: "last_30d",

  dashboardMetrics: null,
  testingLog: [],
  notifications: [],

  // Settings (mit Demo-Mode)
  settings: {
    theme: "light",
    currency: "EUR",
    metaCacheTtlMinutes: 15,
    defaultTimeRange: "last_30d",
    creativeLayout: "grid",
    demoMode: false // Standard: Echtdaten
  },

  // Meta Cache
  metaCache: {
    adAccounts: null,
    campaignsByAccount: {},
    adsByAccount: {}
  },

  config: {
    meta: { appId: META_APP_ID }
  },

  dashboardLoaded: false,
  campaignsLoaded: false,
  creativesLoaded: false
};
