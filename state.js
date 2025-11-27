// state.js – SignalOne.cloud – FINAL FIX

const META_APP_ID = "732040642590155";

export const META_OAUTH_CONFIG = {
  appId: META_APP_ID,
  redirectUri: "https://signalone-frontend.onrender.com/",
  scopes: "ads_read,ads_management,read_insights"
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

  // Settings mit Demo-Mode
  settings: {
    theme: "light",
    currency: "EUR",
    metaCacheTtlMinutes: 15,
    defaultTimeRange: "last_30d",
    creativeLayout: "grid",
    demoMode: true  // ⭐ DEMO-MODE AKTIVIERT
  },

  // Meta Cache
  metaCache: {
    adAccounts: null,
    campaignsByAccount: {},
    adsByAccount: {}
  },

  config: {
    meta: {
      appId: META_APP_ID,
    },
  },

  dashboardLoaded: false,
  campaignsLoaded: false,
  creativesLoaded: false
};
