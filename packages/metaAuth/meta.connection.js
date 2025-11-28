// packages/metaAuth/meta.connection.js
// Hält den Meta-Connection-Zustand im AppState konsistent.

import { AppState } from "../../state.js";

/**
 * Setzt Token + metaConnected-Flag im globalen State.
 */
export function applyTokenToState(token) {
    if (!AppState.meta) {
        AppState.meta = {
            accessToken: null,
            adAccounts: [],
            campaigns: [],
            insightsByCampaign: {},
            user: null,
            ads: [],
            creatives: []
        };
    }
    AppState.meta.accessToken = token || null;
    AppState.metaConnected = !!token;
}

/**
 * Vollständiger Disconnect – setzt Meta-Teil des State auf Nullzustand zurück.
 */
export function hardDisconnectMeta() {
    AppState.metaConnected = false;
    AppState.meta = {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        insightsByCampaign: {},
        user: null,
        ads: [],
        creatives: []
    };
    AppState.selectedAccountId = null;
    AppState.selectedCampaignId = null;
    AppState.dashboardLoaded = false;
    AppState.campaignsLoaded = false;
    AppState.creativesLoaded = false;
    AppState.dashboardMetrics = null;
}
