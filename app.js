// app.js – Orchestrator: Views, Meta Connect, Update Loop

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import { showToast, updateGreeting, initSidebarNavigation, initDateTime, checkMetaConnection } from "./uiCore.js";
import { fetchMetaUser, exchangeMetaCodeForToken } from "./metaApi.js";
import { updateDashboardView } from "./dashboard.js";
import { updateCampaignsView } from "./campaigns.js";
import { updateCreativeLibraryView, renderCreativeLibrary } from "./creativeLibrary.js";

// VIEW HANDLING

function showView(viewId) {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");
    AppState.currentView = viewId;
    updateUI();
}

// META CONNECT / DISCONNECT

function handleMetaConnectClick() {
    showToast("Verbinde mit Meta...", "info");
    const authUrl =
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        });
    window.location.href = authUrl;
}

function disconnectMeta() {
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
    updateGreeting();
    showToast("Verbindung zu Meta wurde getrennt.", "info");
    updateUI();
}

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Meta-Code empfangen – tausche Token aus...", "info");

    try {
        const data = await exchangeMetaCodeForToken(code, META_OAUTH_CONFIG.redirectUri);
        if (!data.success) {
            console.error("Token exchange error:", data);
            showToast("Fehler beim Verbinden mit Meta.", "error");
            return;
        }

        AppState.meta.accessToken = data.accessToken;
        AppState.metaConnected = true;
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        AppState.creativesLoaded = false;
        AppState.selectedAccountId = null;
        AppState.selectedCampaignId = null;
        AppState.dashboardMetrics = null;
        AppState.meta.insightsByCampaign = {};
        AppState.meta.ads = [];
        AppState.meta.creatives = [];

        await fetchMetaUser();
        updateGreeting();
        showToast("Mit Meta verbunden!", "success");
        updateUI();
    } catch (e) {
        console.error(e);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

// UI UPDATE

function updateUI() {
    const connected = checkMetaConnection();
    updateGreeting();

    if (AppState.currentView === "dashboardView") {
        updateDashboardView(connected);
    }

    if (AppState.currentView === "campaignsView") {
        updateCampaignsView(connected);
    }

    if (AppState.currentView === "creativesView") {
        updateCreativeLibraryView(connected);
    }
}

// INIT

document.addEventListener("DOMContentLoaded", () => {
    showView(AppState.currentView);
    initSidebarNavigation(showView);

    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    const disconnectBtn = document.getElementById("disconnectMetaButton");
    if (disconnectBtn) {
        disconnectBtn.addEventListener("click", (e) => {
            e.preventDefault();
            disconnectMeta();
        });
    }

    initDateTime();
    updateGreeting();
    handleMetaOAuthRedirectIfPresent();

    const searchInput = document.getElementById("campaignSearch");
    const statusFilter = document.getElementById("campaignStatusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (!AppState.metaConnected) return;
            AppState.campaignsLoaded = false;
            updateCampaignsView(true);
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            if (!AppState.metaConnected) return;
            AppState.campaignsLoaded = false;
            updateCampaignsView(true);
        });
    }

    const dashboardTimeRange = document.getElementById("dashboardTimeRange");
    if (dashboardTimeRange) {
        dashboardTimeRange.addEventListener("change", (e) => {
            AppState.timeRangePreset = e.target.value;
            AppState.dashboardLoaded = false;
            AppState.dashboardMetrics = null;
            AppState.meta.insightsByCampaign = {};
            updateDashboardView(AppState.metaConnected);
        });
    }

    const creativeSearch = document.getElementById("creativeSearch");
    const creativeSort = document.getElementById("creativeSort");
    const creativeType = document.getElementById("creativeType");

    if (creativeSearch) {
        creativeSearch.addEventListener("input", () => {
            if (!AppState.metaConnected || !AppState.creativesLoaded) return;
            renderCreativeLibrary();
        });
    }

    if (creativeSort) {
        creativeSort.addEventListener("change", () => {
            if (!AppState.metaConnected || !AppState.creativesLoaded) return;
            renderCreativeLibrary();
        });
    }

    if (creativeType) {
        creativeType.addEventListener("change", () => {
            if (!AppState.metaConnected || !AppState.creativesLoaded) return;
            renderCreativeLibrary();
        });
    }
});
