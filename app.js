// app.js – Premium Orchestrator (Final Version, mit aktiven Dropdowns)
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
import { initSettings } from "./settings.js";

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";

/* -------------------------------------------------------
    VIEW HANDLING
---------------------------------------------------------*/

function showView(viewId) {
    document.querySelectorAll(".view").forEach((v) =>
        v.classList.add("hidden")
    );

    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");

    AppState.currentView = viewId;
    updateUI();
}

/* -------------------------------------------------------
    META CONNECT
---------------------------------------------------------*/

function handleMetaConnectClick() {
    showToast("Verbinde mit Meta…", "info");

    const url =
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        });

    window.location.href = url;
}

function persistMetaToken(token) {
    try {
        if (token) localStorage.setItem(META_TOKEN_STORAGE_KEY, token);
        else localStorage.removeItem(META_TOKEN_STORAGE_KEY);
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
        console.warn(e);
    }
}

/* -------------------------------------------------------
    DISCONNECT
---------------------------------------------------------*/

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
    showToast("Meta getrennt", "info");
    updateUI();
}

/* -------------------------------------------------------
    OAuth Redirect
---------------------------------------------------------*/

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Token wird abgeholt…", "info");

    try {
        const res = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );

        if (!res.success) {
            showToast("Meta-Verbindung fehlgeschlagen", "error");
            return;
        }

        AppState.meta.accessToken = res.accessToken;
        AppState.metaConnected = true;

        persistMetaToken(res.accessToken);

        await fetchMetaUser();
        await loadAdAccountsAndCampaigns();

        updateUI();
        showToast("Erfolgreich mit Meta verbunden!", "success");
    } catch (err) {
        console.error(err);
        showToast("Verbindungsfehler", "error");
    }
}

/* -------------------------------------------------------
    ACCOUNT & CAMPAIGNS (LIVE DROPDOWNS)
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    const accRes = await fetchMetaAdAccounts();
    if (accRes?.success) {
        AppState.meta.adAccounts = accRes.data?.data || [];
    }

    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId) {
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;
    }

    if (AppState.selectedAccountId) {
        const campRes = await fetchMetaCampaigns(AppState.selectedAccountId);
        if (campRes?.success) {
            AppState.meta.campaigns = campRes.data?.data || [];
        }
    }

    updateAccountAndCampaignSelectors();
}

function updateAccountAndCampaignSelectors() {
    const accSel = document.getElementById("brandSelect");
    const campSel = document.getElementById("campaignGroupSelect");

    if (!accSel || !campSel) return;

    // Accounts
    accSel.innerHTML = AppState.meta.adAccounts.length
        ? AppState.meta.adAccounts
              .map(
                  (acc) => `
            <option value="${acc.id}" ${
                      acc.id === AppState.selectedAccountId ? "selected" : ""
                  }>
                ${acc.name || acc.id}
            </option>`
              )
              .join("")
        : '<option value="">Kein Werbekonto gefunden</option>';

    // Campaigns
    const options = [
        `<option value="">Alle Kampagnen</option>`
    ];

    (AppState.meta.campaigns || []).forEach((c) => {
        options.push(
            `<option value="${c.id}" ${
                c.id === AppState.selectedCampaignId ? "selected" : ""
            }>${c.name}</option>`
        );
    });

    campSel.innerHTML = options.join("");
}

/* -------------------------------------------------------
    UI UPDATE
---------------------------------------------------------*/

function updateUI() {
    const connected = checkMetaConnection();

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView") {
        updateDashboardView(connected);
    }

    if (AppState.currentView === "campaignsView") {
        updateCampaignsView(connected);
    }

    if (AppState.currentView === "creativesView") {
        updateCreativeLibraryView(connected);
    }

    if (AppState.currentView === "senseiView") {
        updateSenseiView(connected);
    }

    if (AppState.currentView === "reportsView") {
        updateReportsView(connected);
    }

    if (AppState.currentView === "testingLogView") {
        updateTestingLogView(connected);
    }
}

/* -------------------------------------------------------
    INIT
---------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
    loadMetaTokenFromStorage();

    showView(AppState.currentView);
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();

    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    const discBtn = document.getElementById("disconnectMetaButton");
    if (discBtn)
        discBtn.addEventListener("click", (e) => {
            e.preventDefault();
            disconnectMeta();
        });

    await handleMetaOAuthRedirectIfPresent();

    if (AppState.metaConnected && AppState.meta.accessToken) {
        await fetchMetaUser();
        await loadAdAccountsAndCampaigns();
        updateUI();
    }

    /* ---------------------------------------------------
        SEARCH / FILTER EVENTS – CAMPAIGNS
    ----------------------------------------------------*/

    const searchInput = document.getElementById("campaignSearch");
    if (searchInput)
        searchInput.addEventListener("input", () =>
            updateCampaignsView(true)
        );

    const statusFilter = document.getElementById("campaignStatusFilter");
    if (statusFilter)
        statusFilter.addEventListener("change", () =>
            updateCampaignsView(true)
        );

    /* ---------------------------------------------------
        DASHBOARD TIME RANGE
    ----------------------------------------------------*/

    const dashboardTimeRange = document.getElementById("dashboardTimeRange");
    if (dashboardTimeRange)
        dashboardTimeRange.addEventListener("change", (e) => {
            AppState.timeRangePreset = e.target.value;
            AppState.dashboardLoaded = false;
            AppState.meta.insightsByCampaign = {};
            updateDashboardView(AppState.metaConnected);
        });

    /* ---------------------------------------------------
        CREATIVE LIBRARY FILTERS
    ----------------------------------------------------*/

    const creativeSearch = document.getElementById("creativeSearch");
    const creativeSort = document.getElementById("creativeSort");
    const creativeType = document.getElementById("creativeType");

    [creativeSearch, creativeSort, creativeType].forEach((el) => {
        if (!el) return;
        el.addEventListener("input", () => {
            if (AppState.creativesLoaded) renderCreativeLibrary();
        });
        el.addEventListener("change", () => {
            if (AppState.creativesLoaded) renderCreativeLibrary();
        });
    });

    /* ---------------------------------------------------
        AKTIVE DROPDOWNS: ACCOUNT & KAMPAGNE
        -> beeinflussen Dashboard, Library, Campaigns, Sensei
    ----------------------------------------------------*/

    const accountSelect = document.getElementById("brandSelect");
    if (accountSelect) {
        accountSelect.addEventListener("change", async (e) => {
            const newAccountId = e.target.value || null;
            AppState.selectedAccountId = newAccountId;
            AppState.selectedCampaignId = null;

            // Caches & Daten zurücksetzen, damit alles frisch geladen wird
            AppState.dashboardLoaded = false;
            AppState.campaignsLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;
            AppState.meta.insightsByCampaign = {};
            AppState.meta.campaigns = [];
            AppState.meta.creatives = [];
            AppState.meta.ads = [];

            if (newAccountId) {
                const campRes = await fetchMetaCampaigns(newAccountId);
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
            const newCampaignId = e.target.value || null;
            AppState.selectedCampaignId = newCampaignId;

            // Views neu berechnen, da sich Fokus geändert hat
            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            updateUI();
        });
    }
});
