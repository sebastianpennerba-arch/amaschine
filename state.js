// state.js – SignalOne.cloud – FINAL

const META_APP_ID = "732040642590155"; // deine Meta App ID

export const AppState = {
  currentView: "dashboardView",

  metaConnected: false,

  meta: {
    accessToken: null,
    adAccounts: [],
    campaigns: [],
    ads: [],
    creatives: [],
    insightsByCampaign: {}, // { [campaignId]: [insightsRows] }
    user: null,
  },

  selectedAccountId: null,
  selectedCampaignId: "ALL",

  timeRangePreset: "last_30d", // today | yesterday | last_30d etc.

  dashboardMetrics: null,

  testingLog: [],

  config: {
    meta: {
      appId: META_APP_ID,
    },
  },
};
