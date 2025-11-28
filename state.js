/* ============================================================
   STATE.JS – FINAL VERSION (KOMPATIBEL MIT DEMO-PRESET-SYSTEM)
============================================================ */

export const META_APP_ID = "732040642590155";

export const META_OAUTH_CONFIG = {
    appId: META_APP_ID,
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,ads_management,business_management"
};

/* ============================================================
   GLOBALER APP-STATE
============================================================ */

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

    /* In neuer Architektur:
       NULL = alle Kampagnen */
    selectedAccountId: null,
    selectedCampaignId: null,

    /* Dashboard-Zeitraum */
    timeRangePreset: "last_30d",

    /* UI / DATA CACHES */
    dashboardMetrics: null,
    testingLog: [],
    notifications: [],

    /* ============================================================
       SETTINGS – EINZIGE WAHRHEIT FÜR DEMOMODE & PRESETS
    ============================================================ */
    settings: {
        theme: "light",
        currency: "EUR",
        metaCacheTtlMinutes: 15,
        defaultTimeRange: "last_30d",
        creativeLayout: "grid",

        /* Demo Mode (True/False) */
        demoMode: false,

        /* Demo-Preset (Vorschlag A) */
        demoPreset: null
    },

    /* Meta-Daten-CACHE */
    metaCache: {
        adAccounts: null,
        campaignsByAccount: {},
        adsByAccount: {}
    }
};
