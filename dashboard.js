// app.js – Premium Orchestrator (Option B)
// SignalOne.cloud – Frontend Engine

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import {
    showToast,
    updateGreeting,
    initSidebarNavigation,
    initDateTime,
    checkMetaConnection
} from "./uiCore.js";

import {
    fetchMetaUser,
    exchangeMetaCodeForToken,
    fetchMetaAdAccounts,
    fetchMetaCampaigns
} from "./metaApi.js";

import { updateDashboardView } from "./dashboard.js";
import { updateCampaignsView } from "./campaigns.js";
import {
    updateCreativeLibraryView,
    renderCreativeLibrary
} from "./creativeLibrary.js";
import { updateSenseiView } from "./sensei.js";
import { updateReportsView } from "./reports.js";
import { updateTestingLogView } from "./testingLog.js";

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";

/* -------------------------------------------------------
   VIEW HANDLING
---------------------------------------------------------*/

function showView(viewId) {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");
    AppState.currentView = viewId;
    updateUI();
}

/* -------------------------------------------------------
   META CONNECT / DISCONNECT
---------------------------------------------------------*/

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
        if (token)
            localStorage.setItem(META_TOKEN_STORAGE_KEY, token);
        else
            localStorage.removeItem(META_TOKEN_STORAGE_KEY);
    } catch (e) {
        console.warn("LocalStorage not available:", e);
    }
}

function loadMetaTokenFromStorage() {
    try {
        const stored = localStorage.getItem(META_TOKEN_STORAGE_KEY);
        if (stored) {
            AppState.meta.accessToken = stored;
            AppState.metaConnected = true;
        }
    } catch (e) {
        console.warn("LocalStorage not available:", e);
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

    showToast("Verbindung zu Meta getrennt", "info");
    updateGreeting();
    updateUI();
}

/* -------------------------------------------------------
   META OAuth Redirect Handling
---------------------------------------------------------*/

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Token wird von Meta abgeholt…", "info");

    try {
        const res = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );

        if (!res.success) {
            showToast("Meta-Verbindung fehlgeschlagen", "error");
            console.error(res);
            return;
        }

        AppState.meta.accessToken = res.accessToken;
        AppState.metaConnected = true;

        persistMetaToken(res.accessToken);

        // Reset
        AppState.selectedAccountId = null;
        AppState.selectedCampaignId = null;
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        AppState.creativesLoaded = false;
        AppState.meta.insightsByCampaign = {};
        AppState.meta.ads = [];
        AppState.meta.creatives = [];

        await fetchMetaUser();
        updateGreeting();

        showToast("Erfolgreich mit Meta verbunden!", "success");

        // IMPORTANT:
        await loadAdAccountsAndCampaigns();

        updateUI();

    } catch (err) {
        console.error(err);
        showToast("Fehler beim Verbinden mit Meta", "error");
    }
}

/* -------------------------------------------------------
   DROPDOWN HANDLING (Brand + Campaign) — PREMIUM VERSION
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    // Load ad accounts
    const adAccRes = await fetchMetaAdAccounts();
    if (adAccRes?.success) {
        AppState.meta.adAccounts = adAccRes.data?.data || [];
    }

    // Auto-select first account
    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId) {
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;
    }

    // Load campaigns
    if (AppState.selectedAccountId) {
        const campRes = await fetchMetaCampaigns(AppState.selectedAccountId);
        if (campRes?.success) {
            AppState.meta.campaigns = campRes.data?.data || [];
        }
    }

    updateAccountAndCampaignSelectors();
}

function updateAccountAndCampaignSelectors() {
    const accountSelect = document.getElementById("brandSelect");
    const campaignSelect = document.getElementById("campaignGroupSelect");
    if (!accountSelect || !campaignSelect) return;

    const accounts = AppState.meta.adAccounts || [];
    const campaigns = AppState.meta.campaigns || [];

    // Accounts
    accountSelect.innerHTML = accounts.length
        ? accounts.map((acc) =>
            `<option value="${acc.id}"
                ${acc.id === AppState.selectedAccountId ? "selected" : ""}>
                ${acc.name || acc.id}
             </option>`
          ).join("")
        : '<option value="">Kein Werbekonto</option>';

    // Campaigns
    const options = ['<option value="">Alle Kampagnen</option>'];

    campaigns.forEach((c) => {
        options.push(
            `<option value="${c.id}" 
                ${c.id === AppState.selectedCampaignId ? "selected" : ""}>
                ${c.name || c.id}
            </option>`
        );
    });

    campaignSelect.innerHTML = options.join("");
}

/* -------------------------------------------------------
   UI UPDATE
---------------------------------------------------------*/

function updateUI() {
    const connected = checkMetaConnection();

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView")
        updateDashboardView(connected);

    if (AppState.currentView === "campaignsView")
        updateCampaignsView(connected);

    if (AppState.currentView === "creativesView")
        updateCreativeLibraryView(connected);

    if (AppState.currentView === "senseiView")
        updateSenseiView(connected);

    if (AppState.currentView === "reportsView")
        updateReportsView(connected);

    if (AppState.currentView === "testingLogView")
        updateTestingLogView(connected);
}

/* -------------------------------------------------------
   INIT
---------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
    loadMetaTokenFromStorage();

    showView(AppState.currentView);
    initSidebarNavigation(showView);

    // META Connect Buttons
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    const discBtn = document.getElementById("disconnectMetaButton");
    if (discBtn)
        discBtn.addEventListener("click", (e) => {
            e.preventDefault();
            disconnectMeta();
        });

    initDateTime();
    updateGreeting();

    // OAuth Handling
    await handleMetaOAuthRedirectIfPresent();

    // If still connected (token from storage)
    if (AppState.metaConnected && AppState.meta.accessToken) {
        await fetchMetaUser();
        await loadAdAccountsAndCampaigns();
        updateUI();
    }

    /* -----------------------------
       SEARCH / FILTER EVENTS
    ------------------------------*/

    const searchInput = document.getElementById("campaignSearch");
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (!AppState.metaConnected) return;
            AppState.campaignsLoaded = false;
            updateCampaignsView(true);
        });
    }

    const statusFilter = document.getElementById("campaignStatusFilter");
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

    // CREATIVE LIBRARY FILTER EVENTS
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

    /* -----------------------------
       TOPBAR DROPDOWN EVENTS
    ------------------------------*/

    const accountSelect = document.getElementById("brandSelect");
    if (accountSelect) {
        accountSelect.addEventListener("change", async (e) => {
            const newId = e.target.value || null;
            AppState.selectedAccountId = newId;
            AppState.selectedCampaignId = null;

            AppState.dashboardLoaded = false;
            AppState.campaignsLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            if (newId) {
                const campRes = await fetchMetaCampaigns(newId);
                if (campRes?.success) {
                    AppState.meta.campaigns = campRes.data?.data || [];
                }
            }

            updateAccountAndCampaignSelectors();
            updateUI();
        });
    }

    const campaignSelect = document.getElementById("campaignGroupSelect");
    if (campaignSelect) {
        campaignSelect.addEventListener("change", (e) => {
            const val = e.target.value;
            AppState.selectedCampaignId = val || null;

            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            updateUI();
        });
    }
});
