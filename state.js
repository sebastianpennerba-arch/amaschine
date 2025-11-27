export const META_APP_ID = "732040642590155";

export const META_OAUTH_CONFIG = {
    appId: META_APP_ID,
    redirectUri: "https://signalone-frontend.onrender.com/",
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
        user: null
    },

    selectedAccountId: null,
    selectedCampaignId: "ALL",

    timeRangePreset: "last_30d",

    dashboardMetrics: null,
    testingLog: [],
    notifications: [],

    settings: {
        theme: "light",
        currency: "EUR",
        metaCacheTtlMinutes: 15,
        defaultTimeRange: "last_30d",
        creativeLayout: "grid",
        demoMode: true
    },

    metaCache: {
        adAccounts: null,
        campaignsByAccount: {},
        adsByAccount: {}
    },

    config: {
        meta: {
            appId: META_APP_ID
        }
    },

    dashboardLoaded: false,
    campaignsLoaded: false,
    creativesLoaded: false
};
