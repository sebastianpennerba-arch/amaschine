// app.js – FINAL VERSION (SignalOne.cloud Frontend Orchestrator)
document.getElementById("debugConsole")?.remove();
window.debugLog = () => {};

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import {
    checkMetaConnection,
    updateMetaStatusIndicator,
    showDemoBadge,
    updateGreeting,
    initDateTime,
    initSidebarNavigation,
    updateHealthStatus,
    showToast,
    openModal,
    applyTheme,
    debugLog
} from "./uiCore.js";

import {
    exchangeMetaCodeForToken,
    fetchMetaUser,
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaAds
} from "./metaApi.js";

import { updateDashboardView } from "./dashboard.js";
import { updateCreativeLibraryView } from "./creativeLibrary.js";
import { updateCampaignsView } from "./campaigns.js";
import { updateSenseiView } from "./sensei.js";
import { updateReportsView } from "./reports.js";
import { updateTestingLogView } from "./testingLog.js";

/* ============================================================
   CONSTANTS & STORAGE
============================================================ */

const STORAGE_KEYS = {
    SETTINGS: "signalone_settings_v1",
    META_TOKEN: "signalone_meta_access_token"
};

/* ============================================================
   DEMO PRESETS (Vorschlag A: small_store)
============================================================ */

const DEMO_PRESETS = {
    small_store: {
        label: "Small Store (Meta Ads)",
        meta: {
            accessToken: null,
            adAccounts: [
                {
                    id: "act_1234567890",
                    name: "Demo Small Store",
                    currency: "EUR"
                }
            ],
            campaigns: [
                {
                    id: "cmp_demo_1",
                    name: "Prospecting – Broad – DE",
                    status: "ACTIVE",
                    objective: "PURCHASE",
                    account_id: "act_1234567890",
                    daily_budget: 80
                },
                {
                    id: "cmp_demo_2",
                    name: "Retargeting – 30 Tage",
                    status: "ACTIVE",
                    objective: "RETARGETING",
                    account_id: "act_1234567890",
                    daily_budget: 40
                },
                {
                    id: "cmp_demo_3",
                    name: "Testing – New Creatives",
                    status: "PAUSED",
                    objective: "TESTING",
                    account_id: "act_1234567890",
                    daily_budget: 20
                }
            ],
            ads: [
                {
                    id: "ad_demo_1",
                    ad_name: "UGC Hook – Testimonial",
                    campaign_id: "cmp_demo_1",
                    creative_type: "video",
                    thumbnail_url: null,
                    metrics: {
                        spend: 1200,
                        revenue: 5200,
                        impressions: 180000,
                        clicks: 5400,
                        ctr: 3,
                        roas: 4.3
                    }
                },
                {
                    id: "ad_demo_2",
                    ad_name: "Static Offer – 20% Rabatt",
                    campaign_id: "cmp_demo_2",
                    creative_type: "static",
                    thumbnail_url: null,
                    metrics: {
                        spend: 600,
                        revenue: 2100,
                        impressions: 90000,
                        clicks: 2200,
                        ctr: 2.4,
                        roas: 3.5
                    }
                },
                {
                    id: "ad_demo_3",
                    ad_name: "Carousel – Produktwelt",
                    campaign_id: "cmp_demo_1",
                    creative_type: "carousel",
                    thumbnail_url: null,
                    metrics: {
                        spend: 300,
                        revenue: 650,
                        impressions: 45000,
                        clicks: 900,
                        ctr: 2.0,
                        roas: 2.17
                    }
                }
            ],
            insightsByCampaign: {
                cmp_demo_1: {
                    spend: 1500,
                    revenue: 5850,
                    impressions: 225000,
                    clicks: 6300,
                    ctr: 2.8,
                    roas: 3.9
                },
                cmp_demo_2: {
                    spend: 700,
                    revenue: 2500,
                    impressions: 95000,
                    clicks: 2400,
                    ctr: 2.5,
                    roas: 3.57
                },
                cmp_demo_3: {
                    spend: 250,
                    revenue: 150,
                    impressions: 30000,
                    clicks: 450,
                    ctr: 1.5,
                    roas: 0.6
                }
            },
            user: {
                name: "Demo Advertiser",
                id: "user_demo_1"
            }
        }
    }
};

/* ============================================================
   INIT
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
    safeInit();
});

function safeInit() {
    try {
        initApp();
    } catch (e) {
        console.error("Init error:", e);
        showToast("Fehler beim Initialisieren der Anwendung.", "error");
    }
}

function initApp() {
    debugLog("SignalOne App init…");

    loadSettingsFromStorage();
    applyTheme(AppState.settings.theme || "light");

    updateGreeting();
    initDateTime();

    initSidebarNavigation(handleViewSwitch);
    initTopbarControls();
    initMetaStripe();
    initSettingsButton();
    initNotificationButton();

    // Load Meta token from storage (falls vorhanden)
    loadMetaTokenFromStorage();

    // Datenquelle bestimmen
    if (AppState.settings.demoMode) {
        loadDemoPreset(AppState.settings.demoPreset || "small_store");
        renderAllViews(true);
        updateMetaStatusIndicator("connected-demo");
        updateDemoStripe(true);
        showDemoBadge(true, DEMO_PRESETS[AppState.settings.demoPreset || "small_store"].label);
    } else if (checkMetaConnection()) {
        // Echte Meta Verbindung vorhanden → Daten vom Backend laden
        bootstrapMetaData().then(
            () => {
                renderAllViews(hasData());
            },
            () => {
                renderAllViews(false);
            }
        );
    } else {
        // Weder Demo noch Live → No Data
        renderAllViews(false);
        updateMetaStatusIndicator("disconnected");
        updateDemoStripe(false);
    }

    updateHealthStatus();
}

/* ============================================================
   SETTINGS & STORAGE
============================================================ */

function loadSettingsFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
            AppState.settings = {
                ...AppState.settings,
                ...parsed
            };
        }
    } catch (e) {
        console.warn("Settings load error", e);
    }
}

function saveSettingsToStorage() {
    try {
        localStorage.setItem(
            STORAGE_KEYS.SETTINGS,
            JSON.stringify(AppState.settings)
        );
    } catch (e) {
        console.warn("Settings save error", e);
    }
}

function loadMetaTokenFromStorage() {
    try {
        const token = localStorage.getItem(STORAGE_KEYS.META_TOKEN);
        if (token) {
            AppState.meta.accessToken = token;
        }
    } catch (e) {
        console.warn("Meta token load error", e);
    }
}

function saveMetaToken(token) {
    AppState.meta.accessToken = token;
    try {
        localStorage.setItem(STORAGE_KEYS.META_TOKEN, token);
    } catch (e) {
        console.warn("Meta token save error", e);
    }
}

/* ============================================================
   META STRIPE / CONNECT
============================================================ */

function initMetaStripe() {
    const btn = document.getElementById("connectMetaButton");
    if (!btn) return;

    btn.addEventListener("click", () => {
        if (AppState.settings.demoMode) {
            openModal(`
                <div class="modal-title">Demo Mode aktiv</div>
                <p style="margin-bottom:1rem;">
                    Aktuell ist der Demo Mode aktiv. Um echte Meta-Daten zu laden,
                    musst du den Demo Mode deaktivieren und einen gültigen Meta OAuth Flow nutzen.
                </p>
                <button class="btn-primary" id="disableDemoModeBtn">
                    Demo Mode deaktivieren
                </button>
            `);

            document
                .getElementById("disableDemoModeBtn")
                ?.addEventListener("click", () => {
                    AppState.settings.demoMode = false;
                    AppState.settings.demoPreset = "small_store";
                    saveSettingsToStorage();
                    showToast("Demo Mode deaktiviert. Bitte erneut auf „Mit Meta verbinden“ klicken.", "success");
                    location.reload();
                });
        } else {
            startMetaOAuthFlow();
        }
    });
}

function updateDemoStripe(isDemo) {
    const stripe = document.getElementById("metaConnectStripe");
    const text = document.getElementById("metaStripeText");
    const btn = document.getElementById("connectMetaButton");

    if (!stripe || !text || !btn) return;

    if (isDemo) {
        stripe.classList.add("demo-active");
        text.innerHTML = `<i class="fas fa-magic"></i> Demo Mode aktiv – Daten werden simuliert`;
        btn.textContent = "Mit echten Meta-Daten verbinden";
    } else if (checkMetaConnection()) {
        stripe.classList.remove("demo-active");
        stripe.classList.add("connected");
        text.innerHTML = `<i class="fas fa-check-circle"></i> Mit Meta Ads verbunden`;
        btn.textContent = "Meta neu verbinden";
    } else {
        stripe.classList.remove("demo-active");
        stripe.classList.remove("connected");
        text.innerHTML = `<i class="fas fa-plug"></i> Nicht mit Meta Ads verbunden`;
        btn.textContent = "Mit Meta verbinden";
    }
}

function startMetaOAuthFlow() {
    // Hinweis: Hier nur ein Platzhalter für deinen echten OAuth Flow.
    // Entweder redirect auf Backend-URL oder dev-mäßig ein Fake-Token setzen.

    showToast("Meta OAuth Flow ist noch als Mock implementiert.", "info");

    // Beispiel: Fake-Token setzen (nur Dev)
    const fakeToken = "dev_fake_meta_access_token";
    saveMetaToken(fakeToken);

    bootstrapMetaData().then(
        () => {
            renderAllViews(hasData());
            updateMetaStatusIndicator("connected");
            updateDemoStripe(false);
            showDemoBadge(false);
        },
        () => {
            showToast("Meta Daten konnten nicht geladen werden.", "error");
        }
    );
}

/* ============================================================
   META DATA BOOTSTRAP (Live Mode)
============================================================ */

async function bootstrapMetaData() {
    const token = AppState.meta.accessToken;
    if (!token) {
        throw new Error("No meta token");
    }

    debugLog("Bootstrapping Meta Daten…");

    const [user, adAccounts] = await Promise.all([
        fetchMetaUser(token),
        fetchMetaAdAccounts(token)
    ]);

    if (!adAccounts || !adAccounts.length) {
        throw new Error("Keine AdAccounts gefunden");
    }

    AppState.meta.user = user;
    AppState.meta.adAccounts = adAccounts;

    // Default Account
    AppState.selectedAccountId = adAccounts[0].id;

    // Kampagnen & Ads für den ersten Account laden
    const [campaigns, ads] = await Promise.all([
        fetchMetaCampaigns(AppState.selectedAccountId, token),
        fetchMetaAds(AppState.selectedAccountId, token)
    ]);

    AppState.meta.campaigns = campaigns || [];
    AppState.meta.ads = ads || [];

    initAccountSelect(); // füllt Select-Box mit echten Accounts

    debugLog("Meta Daten geladen:", "Accounts:", adAccounts.length, "Campaigns:", AppState.meta.campaigns.length);

    updateMetaStatusIndicator("connected");
    updateDemoStripe(false);
}

/* ============================================================
   DEMO MODE DATA
============================================================ */

function loadDemoPreset(presetKey) {
    const preset = DEMO_PRESETS[presetKey] || DEMO_PRESETS.small_store;
    const meta = preset.meta;

    AppState.meta.accessToken = null;
    AppState.meta.adAccounts = meta.adAccounts || [];
    AppState.meta.campaigns = meta.campaigns || [];
    AppState.meta.ads = meta.ads || [];
    AppState.meta.creatives = meta.ads || [];
    AppState.meta.insightsByCampaign = meta.insightsByCampaign || {};
    AppState.meta.user = meta.user || null;

    AppState.selectedAccountId = meta.adAccounts?.[0]?.id || null;

    initAccountSelect();
}

/* ============================================================
   TOPBAR CONTROLS
============================================================ */

function initTopbarControls() {
    const accountSelect = document.getElementById("accountSelect");
    const globalRange = document.getElementById("timeRangeSelect");
    const dashboardRange = document.getElementById("dashboardTimeRange");

    if (accountSelect) {
        accountSelect.addEventListener("change", () => {
            AppState.selectedAccountId = accountSelect.value || null;

            if (!AppState.settings.demoMode && checkMetaConnection()) {
                // Live Mode: bei Account-Wechsel neu laden
                bootstrapMetaData()
                    .then(() => {
                        renderAllViews(hasData());
                    })
                    .catch((e) => {
                        console.error("Account switch error", e);
                        showToast("Fehler beim Laden der Kampagnen für diesen Account.", "error");
                    });
            } else {
                // Demo Mode: Filter wird einfach logisch angewendet
                renderAllViews(hasData());
            }
        });
    }

    const handleRangeChange = (value) => {
        AppState.timeRangePreset = value || "last_30d";
        if (dashboardRange && dashboardRange.value !== AppState.timeRangePreset) {
            dashboardRange.value = AppState.timeRangePreset;
        }
        if (globalRange && globalRange.value !== AppState.timeRangePreset) {
            globalRange.value = AppState.timeRangePreset;
        }
        // Dashboard & Sensei & Reports nutzen Zeitbereich
        updateDashboardView(hasData());
        updateSenseiView(hasData());
        updateReportsView(hasData());
    };

    if (globalRange) {
        globalRange.value = AppState.timeRangePreset || "last_30d";
        globalRange.addEventListener("change", () => {
            handleRangeChange(globalRange.value);
        });
    }

    if (dashboardRange) {
        dashboardRange.value = AppState.timeRangePreset || "last_30d";
        dashboardRange.addEventListener("change", () => {
            handleRangeChange(dashboardRange.value);
        });
    }
}

function initAccountSelect() {
    const select = document.getElementById("accountSelect");
    if (!select) return;

    const accounts = AppState.meta?.adAccounts || [];

    const current = AppState.selectedAccountId || "";
    select.innerHTML = "";

    if (!accounts.length) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = "Keine Accounts";
        select.appendChild(opt);
        return;
    }

    accounts.forEach((acc) => {
        const opt = document.createElement("option");
        opt.value = acc.id;
        opt.textContent = acc.name || acc.id;
        if (acc.id === current) opt.selected = true;
        select.appendChild(opt);
    });
}

/* ============================================================
   SETTINGS MODAL
============================================================ */

function initSettingsButton() {
    const btn = document.getElementById("openSettingsButton");
    if (!btn) return;

    btn.addEventListener("click", () => {
        openSettingsModal();
    });
}

function openSettingsModal() {
    const demoChecked = AppState.settings.demoMode ? "checked" : "";
    const themeIsDark = AppState.settings.theme === "dark";

    const preset = AppState.settings.demoPreset || "small_store";

    openModal(`
        <div class="modal-title">Settings</div>
        <div class="modal-form">
            <label class="switch-row">
                <span>Dark Mode</span>
                <label class="switch">
                    <input type="checkbox" id="settingsThemeToggle" ${
                        themeIsDark ? "checked" : ""
                    } />
                    <span class="slider round"></span>
                </label>
            </label>

            <label class="switch-row">
                <span>Demo Mode aktivieren</span>
                <label class="switch">
                    <input type="checkbox" id="settingsDemoToggle" ${demoChecked} />
                    <span class="slider round"></span>
                </label>
            </label>

            <div class="settings-section">
                <div class="settings-section-title">Demo Preset</div>
                <select id="settingsDemoPreset">
                    <option value="small_store" ${
                        preset === "small_store" ? "selected" : ""
                    }>Small Store (Meta Ads)</option>
                </select>
                <p class="settings-help">
                    Der Demo Mode lädt simulierte Meta Ads Daten,
                    damit du das Dashboard testen kannst, ohne dein echtes Konto zu verbinden.
                </p>
            </div>
        </div>

        <button class="btn-primary" id="settingsSaveBtn">Speichern</button>
    `);

    document
        .getElementById("settingsSaveBtn")
        ?.addEventListener("click", () => saveSettingsFromModal());
}

function saveSettingsFromModal() {
    const themeToggle = document.getElementById("settingsThemeToggle");
    const demoToggle = document.getElementById("settingsDemoToggle");
    const presetSelect = document.getElementById("settingsDemoPreset");

    const newTheme = themeToggle?.checked ? "dark" : "light";
    const newDemo = demoToggle?.checked || false;
    const newPreset = presetSelect?.value || "small_store";

    const wasDemo = AppState.settings.demoMode;

    AppState.settings.theme = newTheme;
    AppState.settings.demoMode = newDemo;
    AppState.settings.demoPreset = newPreset;

    applyTheme(newTheme);
    saveSettingsToStorage();

    // Datenquelle entsprechend umstellen
    if (newDemo) {
        loadDemoPreset(newPreset);
        updateMetaStatusIndicator("connected-demo");
        updateDemoStripe(true);
        showDemoBadge(true, DEMO_PRESETS[newPreset].label);
        renderAllViews(hasData());
    } else {
        showDemoBadge(false);
        updateDemoStripe(false);

        if (wasDemo) {
            // Wechsel von Demo → Live, aber vielleicht kein Token vorhanden
            if (checkMetaConnection()) {
                bootstrapMetaData()
                    .then(() => {
                        renderAllViews(hasData());
                    })
                    .catch((e) => {
                        console.error("Meta bootstrap error after demo off", e);
                        renderAllViews(false);
                    });
            } else {
                // Keine echte Verbindung: Views bleiben leer, bis User Meta verbindet
                AppState.meta.campaigns = [];
                AppState.meta.ads = [];
                AppState.meta.creatives = [];
                AppState.meta.insightsByCampaign = {};
                renderAllViews(false);
            }
        }
    }

    showToast("Settings gespeichert.", "success");
}

/* ============================================================
   NOTIFICATIONS MOCK
============================================================ */

function initNotificationButton() {
    const btn = document.getElementById("notificationsButton");
    if (!btn) return;

    btn.addEventListener("click", () => {
        openModal(`
            <div class="modal-title">Benachrichtigungen</div>
            <p>Das Notification-System ist noch im Aufbau.</p>
        `);
    });
}

/* ============================================================
   VIEW HANDLING
============================================================ */

function handleViewSwitch(viewId) {
    const views = document.querySelectorAll(".view");
    views.forEach((v) => v.classList.add("hidden"));

    const active = document.getElementById(viewId);
    if (active) {
        active.classList.remove("hidden");
    }

    AppState.currentView = viewId;

    // Beim Wechsel aktuelle View refreshen
    const dataConnected = hasData();

    switch (viewId) {
        case "dashboardView":
            updateDashboardView(dataConnected);
            break;
        case "creativesView":
            updateCreativeLibraryView(dataConnected);
            break;
        case "campaignsView":
            updateCampaignsView(dataConnected);
            break;
        case "senseiView":
            updateSenseiView(dataConnected);
            break;
        case "reportsView":
            updateReportsView(dataConnected);
            break;
        case "testingLogView":
            updateTestingLogView(dataConnected);
            break;
        default:
            break;
    }
}

function renderAllViews(dataConnected) {
    // Sicherstellen, dass Sidebar-Active korrekt ist
    const firstView = AppState.currentView || "dashboardView";
    handleViewSwitch(firstView);

    // Badge- & Statuslogik:
    const demo = AppState.settings.demoMode;
    if (demo) {
        updateMetaStatusIndicator("connected-demo");
        updateDemoStripe(true);
    } else if (checkMetaConnection()) {
        updateMetaStatusIndicator("connected");
        updateDemoStripe(false);
    } else {
        updateMetaStatusIndicator("disconnected");
        updateDemoStripe(false);
    }
}

function hasData() {
    const meta = AppState.meta || {};
    if (AppState.settings.demoMode) {
        return (meta.campaigns && meta.campaigns.length > 0) || false;
    }

    return (
        !!meta.accessToken &&
        Array.isArray(meta.campaigns) &&
        meta.campaigns.length > 0
    );
}

/* ============================================================
   EXPORTS (optional, falls andere Module etwas brauchen)
============================================================ */

export function isDemoMode() {
    return !!AppState.settings.demoMode;
}
