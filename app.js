import { AppState } from "./state.js";
import { ui, showToast, switchView, updateSidebarActiveItem, updateMetaStatusIndicator, showDemoBadge } from "./uiCore.js";
import { demoData } from "./demoData.js";
import { MetaApi } from "./metaApi.js";

/* ============================================================
   APP INITIALISIERUNG
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initializeNavigation();
    initializeSettingsButton();
    initializeDemoMode();
    initializeViewBoot();

    console.log("🚀 SignalOne App gestartet");
});


/* ============================================================
   1) DEMO MODE BOOTSTRAP
============================================================ */

function initializeDemoMode() {
    const urlParams = new URLSearchParams(window.location.search);

    // URL-Flag überschreibt UI-Settings
    if (urlParams.get("demo") === "1") {
        AppState.settings.demoMode = true;
    }

    if (AppState.settings.demoMode) {
        console.log("🟣 Demo Mode aktiv — Demo Daten werden geladen");
        loadDemoData();
        showDemoBadge(true);
        updateMetaStatusIndicator("connected-demo");
    }
}


/* Demo-Daten in den globalen AppState laden */
function loadDemoData() {
    AppState.meta.adAccounts = demoData.adAccounts;
    AppState.meta.campaigns = demoData.campaigns;
    AppState.meta.ads = demoData.ads;
    AppState.meta.creatives = demoData.creatives;
    AppState.meta.insightsByCampaign = demoData.insights;
    AppState.meta.user = demoData.user;

    AppState.selectedAccountId = demoData.adAccounts[0]?.id || null;

    showToast("Demo-Daten erfolgreich geladen.", "info");
}


/* ============================================================
   2) NAVIGATION / VIEW HANDLING
============================================================ */

function initializeNavigation() {
    const navItems = document.querySelectorAll(".nav-item");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            const view = item.dataset.view;

            switchView(view);
            updateSidebarActiveItem(item);
            updatePageTitle(view);

            bootView(view);
        });
    });
}

function updatePageTitle(viewID) {
    const titles = {
        dashboardView: "Dashboard",
        creativesView: "Creative Library",
        campaignsView: "Campaigns",
        senseiView: "Sensei Strategy",
        reportsView: "Reports",
        testingLogView: "Testing Log"
    };

    const title = titles[viewID] || "SignalOne";
    document.getElementById("pageTitle").textContent = title;
}


/* ============================================================
   3) SETTINGS BUTTON (Topbar)
============================================================ */

function initializeSettingsButton() {
    const settingsBtn = document.getElementById("settingsButton");

    settingsBtn.addEventListener("click", () => {
        ui.openSettingsModal(AppState.settings);
    });
}


/* ============================================================
   4) VIEW-BOOTSTRAP LOGIK
============================================================ */

function initializeViewBoot() {
    // initialer View
    bootView(AppState.currentView);
}

/**
 * Bootet den passenden View (lädt Daten wenn nötig).
 */
function bootView(view) {
    if (view === "dashboardView") {
        import("./dashboard.js").then(module => module.renderDashboard());
    }

    if (view === "creativesView") {
        import("./creativeLibrary.js").then(module => module.renderCreativeLibrary());
    }

    if (view === "campaignsView") {
        import("./campaigns.js").then(module => module.renderCampaigns());
    }

    if (view === "senseiView") {
        import("./sensei.js").then(module => module.renderSensei());
    }

    if (view === "reportsView") {
        import("./reports.js").then(module => module.renderReports());
    }

    if (view === "testingLogView") {
        import("./testingLog.js").then(module => module.renderTestingLog());
    }
}


/* ============================================================
   5) META CONNECT / GATEKEEPER
============================================================ */

export async function connectMeta() {
    if (AppState.settings.demoMode) {
        showToast("Demo Mode aktiv – echter Meta Login deaktiviert.", "warning");
        return;
    }

    try {
        const token = await MetaApi.login();

        if (!token) {
            showToast("Meta Login fehlgeschlagen.", "error");
            return;
        }

        AppState.metaConnected = true;
        AppState.meta.accessToken = token;

        updateMetaStatusIndicator("connected");
        showToast("Meta erfolgreich verbunden!", "success");

        await loadMetaData();

    } catch (err) {
        showToast("Meta-Verbindung fehlgeschlagen.", "error");
        console.error(err);
    }
}


/** Gatekeeper für echte Live-Daten */
async function requireMetaConnection() {
    if (AppState.settings.demoMode) return true;

    if (!AppState.metaConnected) {
        showToast("Bitte zuerst Meta verbinden.", "warning");
        updateMetaStatusIndicator("disconnected");
        return false;
    }

    return true;
}


/* ============================================================
   6) LIVE-DATEN (falls Meta verbunden)
============================================================ */

async function loadMetaData() {
    if (!(await requireMetaConnection())) return;

    const accounts = await MetaApi.getAdAccounts();
    AppState.meta.adAccounts = accounts || [];

    const campaigns = await MetaApi.getCampaigns(AppState.selectedAccountId);
    AppState.meta.campaigns = campaigns || [];

    const creatives = await MetaApi.getCreatives(AppState.selectedAccountId);
    AppState.meta.creatives = creatives || [];

    showToast("Meta-Daten geladen.", "success");
}


/* ============================================================
   EXPORTS
============================================================ */
export const App = {
    bootView,
    loadDemoData,
    connectMeta
};
