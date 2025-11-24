// state.js – globaler AppState & Konfiguration

export const META_OAUTH_CONFIG = {
    appId: "732040642590155",
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,business_management"
};

export const META_BACKEND_CONFIG = {
    tokenEndpoint: "https://signalone-backend.onrender.com/api/meta/oauth/token",
    adAccountsEndpoint: "https://signalone-backend.onrender.com/api/meta/adaccounts",
    campaignsEndpoint: (accountId) =>
        `https://signalone-backend.onrender.com/api/meta/campaigns/${accountId}`,
    insightsEndpoint: (campaignId) =>
        `https://signalone-backend.onrender.com/api/meta/insights/${campaignId}`,
    adsEndpoint: (accountId) =>
        `https://signalone-backend.onrender.com/api/meta/ads/${accountId}`,
    meEndpoint: "https://signalone-backend.onrender.com/api/meta/me",
    // Neu: Kampagnen-Status-Update für Start/Stop
    campaignStatusEndpoint: (campaignId) =>
        `https://signalone-backend.onrender.com/api/meta/campaigns/${campaignId}/status`
};

// Optionale Demo-Kampagnen (werden aktuell primär in Dokus verwendet,
// der eigentliche Demo-Mode läuft über DEMO_DATA in app.js)
export const DEMO_CAMPAIGNS = [
    {
        id: "CAMP-001",
        name: "Scaling Q1 – Main Funnel",
        status: "active",
        objective: "CONVERSIONS",
        daily_budget: 50000,
        spend: 14500,
        roas: 3.9,
        ctr: 2.4
    },
    {
        id: "CAMP-002",
        name: "Creative Testing – Hooks Batch 3",
        status: "paused",
        objective: "TRAFFIC",
        daily_budget: 15000,
        spend: 2900,
        roas: 2.1,
        ctr: 1.8
    },
    {
        id: "CAMP-003",
        name: "Retargeting – Warm Traffic 30D",
        status: "active",
        objective: "CONVERSIONS",
        daily_budget: 20000,
        spend: 6200,
        roas: 4.3,
        ctr: 3.1
    }
];

export const AppState = {
    // Aktuelle View im SPA-System
    currentView: "dashboardView",

    // Meta-Verbindungsstatus (Live)
    metaConnected: false,

    // Alle Meta-bezogenen Daten (werden von metaApi.js gefüllt)
    meta: {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        insightsByCampaign: {}, // { [campaignId]: { spend, roas, ... } }
        user: null,
        ads: [],
        creatives: []
    },

    // Settings werden im Lauf von app.js (ensureSettings/loadSettingsFromStorage)
    // sauber initialisiert und sind hier nur als Platzhalter vorgesehen.
    // Struktur z.B.:
    // {
    //   theme: "light" | "dark" | "auto",
    //   demoMode: boolean,
    //   defaultTimeRange: "last_7d" | "last_30d" | ...
    //   metaCacheTtlMinutes: number
    // }
    settings: null,

    // Auswahl im Topbar-Dropdown
    selectedAccountId: null,
    selectedCampaignId: null,

    // Globaler Zeitraum für Dashboard & andere Views
    timeRangePreset: "last_30d", // today | last_7d | last_30d

    // Loader-Flags für verschiedene Views
    dashboardLoaded: false,
    campaignsLoaded: false,
    creativesLoaded: false,

    // Aggregierte Metriken fürs Dashboard (wird in dashboard.js berechnet)
    dashboardMetrics: null,

    // Einfacher, clientseitiger Testing-Log (P6 später über Backend persistiert)
    testingLog: []
};
