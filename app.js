// app.js – Orchestrator für SignalOne
// DEMO MODE + LIVE MODE vollständig integriert
// (100% kompatibel zur aktuellen Architektur)

import {
    AppState,
    setDemoMode
} from "./state.js";

import {
    DEMO_DATA_PRESETS
} from "./demoData.js";

import {
    updateSidebarActiveItem,
    showToast,
    updateMetaStatusBadge
} from "./uiCore.js";

import {
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaAds,
    fetchMetaUser,
    exchangeMetaCodeForToken
} from "./metaApi.js";

// Feature Views
import { updateDashboardView } from "./dashboard.js";
import { updateCreativeLibraryView } from "./creativeLibrary.js";
import { updateCampaignsView } from "./campaigns.js";
import { updateSenseiView } from "./sensei.js";
import { updateReportsView } from "./reports.js";
import { updateTestingLogView } from "./testingLog.js";


// =========================================================
// INIT APP
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    initApp();
});

function initApp() {
    // -----------------------------
    // A) CHECK FOR DEMO MODE
    // -----------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const demoParam = urlParams.get("demo");
    const presetParam = urlParams.get("preset");

    const persistedDemo = window.localStorage.getItem("signalone_demo") === "1";
    const persistedPreset = window.localStorage.getItem("signalone_demo_preset");

    if (demoParam === "1" || persistedDemo) {
        const presetId = presetParam || persistedPreset || "scaling_store";
        enableDemoMode(presetId);
    } else {
        // Start regulären Meta Connect Flow
        initMetaOAuthFlow();
    }

    // Navigation setzen
    initNavigation();

    // Grund-UI
    updateUI();
}



// =========================================================
// DEMO MODE
// =========================================================
function enableDemoMode(presetId) {
    if (!DEMO_DATA_PRESETS[presetId]) {
        console.warn("[DEMO] Unbekanntes Preset → fallback: scaling_store");
        presetId = "scaling_store";
    }

    // State setzen
    setDemoMode(true, presetId);

    // Demo Badge sichtbar machen
    const badge = document.querySelector("[data-role='demo-badge']");
    if (badge) {
        badge.style.display = "inline-flex";
        badge.textContent = `Demo: ${DEMO_DATA_PRESETS[presetId].label}`;
    }

    // Demo laden
    loadDemoPreset(presetId);

    showToast("success", `Demo Mode aktiviert (${DEMO_DATA_PRESETS[presetId].label})`);
}

function disableDemoMode() {
    setDemoMode(false, null);
    window.location.href = window.location.pathname; // Reload ohne Demo
}


// =========================================================
// DEMO PRESET LOADER
// =========================================================
function loadDemoPreset(presetId) {
    const preset = DEMO_DATA_PRESETS[presetId];
    if (!preset) return;

    AppState.metaConnected = true;

    AppState.meta.user = preset.user;
    AppState.meta.adAccounts = preset.adAccounts;
    AppState.meta.campaigns = preset.campaigns;
    AppState.meta.creatives = preset.creatives;
    AppState.meta.insightsByCampaign = preset.insightsByCampaign;

    // Defaults auswählen
    if (preset.adAccounts.length > 0) {
        AppState.selectedAccountId = preset.adAccounts[0].id;
    }

    if (preset.campaigns.length > 0) {
        AppState.selectedCampaignId = preset.campaigns[0].id;
    }

    // UI Refresh
    updateUI();
    updateAllViews();
}

function updateAllViews() {
    updateDashboardView();
    updateCreativeLibraryView();
    updateCampaignsView();
    updateSenseiView();
    updateReportsView();
    updateTestingLogView();
}



// =========================================================
// LIVE MODE → META CONNECT FLOW
// =========================================================
async function initMetaOAuthFlow() {
    // 1. Prüfen: Ist ein OAuth Code in der URL?
    await handleMetaOAuthRedirectIfPresent();

    // 2. Wenn Meta verbunden → Daten laden
    if (AppState.metaConnected && AppState.meta.accessToken) {
        await loadLiveMetaInitialData();
    }

    // 3. UI aktualisieren
    updateUI();
}

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (!code) return;

    try {
        const token = await exchangeMetaCodeForToken(code);
        AppState.meta.accessToken = token;
        AppState.metaConnected = true;

        // URL aufräumen
        url.searchParams.delete("code");
        window.history.replaceState({}, "", url.toString());

        showToast("success", "Meta erfolgreich verbunden!");
    } catch (err) {
        console.error("[Meta OAuth] Fehler beim Token-Austausch:", err);
        showToast("error", "Meta OAuth Fehler");
    }
}

async function loadLiveMetaInitialData() {
    try {
        // User
        AppState.meta.user = await fetchMetaUser();

        // Accounts
        const accounts = await fetchMetaAdAccounts();
        AppState.meta.adAccounts = accounts;

        if (accounts.length > 0) {
            AppState.selectedAccountId = accounts[0].id;
        }

        // Campaigns
        if (AppState.selectedAccountId) {
            const campaigns = await fetchMetaCampaigns(AppState.selectedAccountId);
            AppState.meta.campaigns = campaigns;

            if (campaigns.length > 0) {
                AppState.selectedCampaignId = campaigns[0].id;
            }

            // Ads (inkl. Creatives)
            const ads = await fetchMetaAds(AppState.selectedAccountId);
            AppState.meta.creatives = ads; // je nach Metasystem evtl. ads → creatives map
        }

        showToast("success", "Live Meta Daten geladen");

        updateAllViews();
    } catch (err) {
        console.error("[Meta Load] Fehler beim Laden:", err);
        showToast("error", "Fehler beim Laden der Meta-Daten");
    }
}



// =========================================================
// GENERISCHE HELFER: LOADERS (Demo oder Live)
// =========================================================
export async function loadAdAccounts() {
    if (AppState.demoMode) {
        return AppState.meta.adAccounts;
    }
    const accounts = await fetchMetaAdAccounts();
    AppState.meta.adAccounts = accounts;
    return accounts;
}

export async function loadCampaignsForAccount(accountId) {
    if (AppState.demoMode) {
        return AppState.meta.campaigns.filter(c => c.accountId === accountId);
    }
    const campaigns = await fetchMetaCampaigns(accountId);
    AppState.meta.campaigns = campaigns;
    return campaigns;
}

export async function loadAdsForAccount(accountId) {
    if (AppState.demoMode) {
        return AppState.meta.creatives;
    }
    const ads = await fetchMetaAds(accountId);
    AppState.meta.creatives = ads;
    return ads;
}



// =========================================================
// NAVIGATION (VIEW SWITCHING)
// =========================================================
function initNavigation() {
    // FIX: index.html nutzt data-view, nicht data-nav
    const navItems = document.querySelectorAll("[data-view]");

    navItems.forEach(item => {
        item.addEventListener("click", (event) => {
            event.preventDefault();
            const view = item.getAttribute("data-view");

            AppState.currentView = view;
            updateSidebarActiveItem(view);
            showView(view);
        });
    });
}

function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    const target = document.getElementById(viewId);
    if (target) target.classList.remove("hidden");

    updateUI();
    updateView(viewId);
}

function updateView(viewId) {
    switch (viewId) {
        case "dashboardView":
            updateDashboardView();
            break;
        case "creativesView":
            updateCreativeLibraryView();
            break;
        case "campaignsView":
            updateCampaignsView();
            break;
        case "senseiView":
            updateSenseiView();
            break;
        case "reportsView":
            updateReportsView();
            break;
        case "testingLogView":
            updateTestingLogView();
            break;
    }
}



// =========================================================
// UI UPDATE
// =========================================================
function updateUI() {
    updateMetaStatusBadge({
        connected: AppState.metaConnected,
        demoMode: AppState.demoMode
    });

    updateSidebarActiveItem(AppState.currentView);

    // Demo Badge togglen
    const badge = document.querySelector("[data-role='demo-badge']");
    if (badge) {
        if (AppState.demoMode) {
            badge.style.display = "inline-flex";

            // falls Label im Preset vorhanden → anzeigen, sonst ID
            const preset = AppState.demoPresetId && DEMO_DATA_PRESETS[AppState.demoPresetId];
            const label = preset?.label || AppState.demoPresetId || "Demo Mode";
            badge.textContent = `Demo: ${label}`;
        } else {
            badge.style.display = "none";
        }
    }
}
