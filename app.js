// app.js – Orchestrator: Views, Meta Connect, Update Loop

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import {
    showToast,
    updateGreeting,
    initSidebarNavigation,
    initDateTime,
    checkMetaConnection
} from "./uiCore.js";
import { fetchMetaUser, exchangeMetaCodeForToken } from "./metaApi.js";
import { updateDashboardView } from "./dashboard.js";
import { updateCampaignsView } from "./campaigns.js";
import {
    updateCreativeLibraryView,
    renderCreativeLibrary
} from "./creativeLibrary.js";

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";

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

function persistMetaToken(token) {
    try {
        if (token) {
            window.localStorage.setItem(META_TOKEN_STORAGE_KEY, token);
        } else {
            window.localStorage.removeItem(META_TOKEN_STORAGE_KEY);
        }
    } catch (e) {
        console.warn("LocalStorage not available for meta token:", e);
    }
}

function loadMetaTokenFromStorage() {
    try {
        const stored = window.localStorage.getItem(META_TOKEN_STORAGE_KEY);
        if (stored) {
            AppState.meta.accessToken = stored;
            AppState.metaConnected = true;
        }
    } catch (e) {
        console.warn("LocalStorage not available for meta token:", e);
    }
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
    persistMetaToken(null);
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
        const data = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );
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

        persistMetaToken(data.accessToken);

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

function updateAccountAndCampaignSelectors() {
    const accountSelect = document.getElementById("brandSelect");
    const campaignSelect = document.getElementById("campaignGroupSelect");
    if (!accountSelect || !campaignSelect) return;

    const accounts = AppState.meta.adAccounts || [];
    const campaigns = AppState.meta.campaigns || [];

    if (!accounts.length) {
        accountSelect.innerHTML =
            '<option value="">Kein Ad Account verbunden</option>';
    } else {
        accountSelect.innerHTML = accounts
            .map((acc) => {
                const selected = acc.id === AppState.selectedAccountId;
                const label = acc.name || acc.id;
                return `<option value="${acc.id}" ${
                    selected ? "selected" : ""
                }>${label}</option>`;
            })
            .join("");
    }

    const options = ['<option value="all">Alle Kampagnen</option>'];

    campaigns.forEach((c) => {
        const selected = c.id === AppState.selectedCampaignId;
        const label = c.name || c.id;
        options.push(
            `<option value="${c.id}" ${selected ? "selected" : ""}>${label}</option>`
        );
    });

    campaignSelect.innerHTML = options.join("");
}

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

    // Dropdowns oben rechts mit aktuellen AdAccounts/Kampagnen befüllen
    updateAccountAndCampaignSelectors();
}

// INIT

document.addEventListener("DOMContentLoaded", () => {
    // Fix #1: Token aus LocalStorage laden, damit Meta-Verbindung über Reloads bestehen bleibt
    loadMetaTokenFromStorage();

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

    // Wenn Token aus Storage kommt, User laden (Name) & UI updaten
    if (AppState.metaConnected && AppState.meta.accessToken) {
        fetchMetaUser()
            .then(() => {
                updateGreeting();
                updateUI();
            })
            .catch(() => {});
    }

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

    // Events für Account- und Kampagnen-Dropdowns (oben rechts)
    const accountSelect = document.getElementById("brandSelect");
    if (accountSelect) {
        accountSelect.addEventListener("change", (e) => {
            const newAccountId = e.target.value || null;
            AppState.selectedAccountId = newAccountId;
            AppState.selectedCampaignId = null;

            // Caches leeren, damit alles für das neue Konto neu geladen wird
            AppState.dashboardLoaded = false;
            AppState.campaignsLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;
            AppState.meta.campaigns = [];
            AppState.meta.ads = [];
            AppState.meta.creatives = [];
            AppState.meta.insightsByCampaign = {};

            updateUI();
        });
    }

    const campaignSelect = document.getElementById("campaignGroupSelect");
    if (campaignSelect) {
        campaignSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            AppState.selectedCampaignId =
                val && val !== "all" ? val : null;
            AppState.dashboardLoaded = false;
            AppState.dashboardMetrics = null;
            updateDashboardView(AppState.metaConnected);
        });
    }
});
