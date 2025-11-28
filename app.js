import { AppState } from "./state.js";
import { ui, showToast, switchView, updateSidebarActiveItem, updateMetaStatusIndicator, showDemoBadge } from "./uiCore.js";
import { demoData } from "./demoData.js";
import { MetaApi } from "./metaApi.js";

/* ============================================================
   APP START
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    initializeNavigation();
    initializeSettingsButton();
    initializeDemoMode();
    initializeViewBoot();

    console.log("🚀 SignalOne App gestartet");
});


/* ============================================================
   1) DEMO MODE INITIALISIERUNG
============================================================ */

function initializeDemoMode() {
    const urlParams = new URLSearchParams(window.location.search);

    // Query-Flag lädt Demo Mode
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

/** Demo-Daten korrekt aus den Presets laden */
function loadDemoData() {
    // 1) Dein Haupt-Preset auswählen
    const preset = demoData.small_store;

    if (!preset) {
        console.error("❌ Demo Mode Fehler: small_store Preset nicht gefunden!");
        showToast("Demo-Daten konnten nicht geladen werden.", "error");
        return;
    }

    // 2) State befüllen
    AppState.meta.adAccounts = preset.adAccounts || [];
    AppState.meta.campaigns = preset.campaigns || [];
    AppState.meta.creatives = preset.creatives || [];
    AppState.meta.insightsByCampaign = preset.insightsByCampaign || {};
    AppState.meta.user = preset.user || null;

    // 3) Account auswählen
    AppState.selectedAccountId = preset.adAccounts[0]?.id || null;

    showToast("Demo-Daten erfolgreich geladen.", "info");
    console.log("Demo Daten geladen:", preset);
}


/* ============================================================
   2) SIDEBAR + NAVIGATION
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
    const el = document.getElementById("pageTitle");
    if (el) el.textContent = title;
}


/* ============================================================
   3) SETTINGS BUTTON
============================================================ */

function initializeSettingsButton() {
    const settingsBtn = document.getElementById("settingsButton");

    if (!settingsBtn) return;
    settingsBtn.addEventListener("click", () => {
        ui.openSettingsModal(AppState.settings);
    });
}


/* ============================================================
   4) VIEW BOOTSTRAPPING
============================================================ */

function initializeViewBoot() {
    bootView(AppState.currentView);
}

function bootView(view) {
    if (view === "dashboardView") {
        import("./dashboard.js").then(m => m.renderDashboard());
    }
    else if (view === "creativesView") {
        import("./creativeLibrary.js").then(m => m.renderCreativeLibrary());
    }
    else if (view === "campaignsView") {
        import("./campaigns.js").then(m => m.renderCampaigns());
    }
    else if (view === "senseiView") {
        import("./sensei.js").then(m => m.renderSensei());
    }
    else if (view === "reportsView") {
        import("./reports.js").then(m => m.renderReports());
    }
    else if (view === "testingLogView") {
        import("./testingLog.js").then(m => m.renderTestingLog());
    }
}


/* ============================================================
   5) META CONNECT (nur Live, Demo blockiert)
============================================================ */

export async function connectMeta() {
    if (AppState.settings.demoMode) {
        showToast("Demo Mode aktiv – Live Login deaktiviert.", "warning");
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
        console.error(err);
        showToast("Meta Verbindung fehlgeschlagen.", "error");
        updateMetaStatusIndicator("disconnected");
    }
}


/* ============================================================
   6) LIVE META DATEN (falls Meta verbunden)
============================================================ */

async function requireMetaConnection() {
    if (AppState.settings.demoMode) return true;

    if (!AppState.metaConnected) {
        showToast("Bitte zuerst Meta verbinden.", "warning");
        updateMetaStatusIndicator("disconnected");
        return false;
    }

    return true;
}

async function loadMetaData() {
    if (!(await requireMetaConnection())) return;

    const accounts = await MetaApi.fetchMetaAdAccounts();
    AppState.meta.adAccounts = accounts || [];

    if (accounts?.length > 0) {
        AppState.selectedAccountId = accounts[0].id;
    }

    const campaigns = await MetaApi.fetchMetaCampaigns(AppState.selectedAccountId);
    AppState.meta.campaigns = campaigns || [];

    const creatives = await MetaApi.fetchMetaAds(AppState.selectedAccountId);
    AppState.meta.creatives = creatives || [];

    showToast("Echte Meta-Daten geladen.", "success");
}


/* ============================================================
   EXPORT
============================================================ */
export const App = {
    bootView,
    loadDemoData,
    connectMeta
};
