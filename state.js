export const META_APP_ID = "732040642590155";

export const META_OAUTH_CONFIG = {
    appId: META_APP_ID,
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,ads_management,business_management"
};

export const AppState = {
    currentView: "dashboardView",
    metaConnected: false,

    // 🔥 DEMO MODE FLAGS (neu & systemisch korrekt)
    demoMode: false,          // Aktiv / Nicht aktiv
    demoPresetId: null,       // "small_store" | "scaling_store" | "agency"

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

        // ⚠️ lässt du drin als User-Einstellung,
        // aber technisch steuert NICHT dieses Flag den Demo-Modus.
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

// 🔥 OPTIONALE HELFER-FUNKTIONEN (für app.js)
// Falls du es nutzen möchtest:

export function setDemoMode(enabled, presetId = null) {
    AppState.demoMode = enabled;
    AppState.demoPresetId = presetId;

    // Persistieren im LocalStorage (damit Demo nach Reload aktiv bleibt)
    if (enabled) {
        window.localStorage.setItem("signalone_demo", "1");
        if (presetId) window.localStorage.setItem("signalone_demo_preset", presetId);
    } else {
        window.localStorage.removeItem("signalone_demo");
        window.localStorage.removeItem("signalone_demo_preset");
    }
}
