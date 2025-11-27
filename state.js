// state.js – SignalOne.cloud – FINAL

const META_APP_ID = "732040642590155";

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

  // NEU: Settings mit Demo-Mode
  settings: {
    theme: "light",
    currency: "EUR",
    metaCacheTtlMinutes: 15,
    defaultTimeRange: "last_30d",
    creativeLayout: "grid",
    demoMode: true  // ⭐ DEMO-MODE AKTIVIERT
  },

  config: {
    meta: {
      appId: META_APP_ID,
    },
  },
};
