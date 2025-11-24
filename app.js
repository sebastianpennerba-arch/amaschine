// app.js – Orchestrator mit Demo-Mode (Option C)
// SignalOne.cloud Frontend Engine

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import {
    showToast,
    updateGreeting,
    initSidebarNavigation,
    initDateTime,
    checkMetaConnection,
    openModal,
    updateHealthStatus
} from "./uiCore.js";

import {
    fetchMetaUser,
    exchangeMetaCodeForToken,
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaAds
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

/* -------------------------------------------------------
    CONSTANTS
---------------------------------------------------------*/

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";
const SETTINGS_STORAGE_KEY = "signalone_settings_v1";
const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000; // 30min

/* -------------------------------------------------------
    DEMO DATA (Mode C)
---------------------------------------------------------*/

const DEMO_DATA = {
    selectedAccountId: "act_demo_001",
    meta: {
        user: {
            id: "demo-user-1",
            name: "Demo Brand GmbH"
        },
        adAccounts: [
            {
                id: "act_demo_001",
                name: "Demo Brand – Main Account",
                currency: "EUR"
            }
        ],
        campaigns: [
            {
                id: "cmp_demo_1",
                name: "PERF – Evergreen UGC",
                status: "ACTIVE",
                objective: "CONVERSIONS"
            },
            {
                id: "cmp_demo_2",
                name: "RET – Remarketing 30d",
                status: "ACTIVE",
                objective: "CONVERSIONS"
            },
            {
                id: "cmp_demo_3",
                name: "TOP – Prospecting Broad",
                status: "PAUSED",
                objective: "CONVERSIONS"
            }
        ],
        // Wir nutzen Ads als Creatives-Quelle
        ads: [
            {
                id: "ad_demo_1",
                name: "UGC Hook A",
                campaign_id: "cmp_demo_1",
                configured_status: "ACTIVE",
                effective_status: "ACTIVE",
                spend: 320.5,
                impressions: 18500,
                clicks: 720,
                website_purchase_roas: [{ value: 4.1 }],
                creative: {
                    object_story_spec: {
                        video_data: {
                            thumbnail_url:
                                "https://via.placeholder.com/320x180?text=Demo+Video+1"
                        }
                    }
                }
            },
            {
                id: "ad_demo_2",
                name: "UGC Hook B",
                campaign_id: "cmp_demo_1",
                configured_status: "ACTIVE",
                effective_status: "ACTIVE",
                spend: 210.2,
                impressions: 14200,
                clicks: 520,
                website_purchase_roas: [{ value: 3.7 }],
                creative: {
                    object_story_spec: {
                        link_data: {
                            image_hash: "demo_hash_1",
                            picture:
                                "https://via.placeholder.com/320x180?text=Demo+Image+1"
                        }
                    }
                }
            },
            {
                id: "ad_demo_3",
                name: "REM – DPA 30d",
                campaign_id: "cmp_demo_2",
                configured_status: "ACTIVE",
                effective_status: "ACTIVE",
                spend: 180.0,
                impressions: 9600,
                clicks: 410,
                website_purchase_roas: [{ value: 5.2 }]
            },
            {
                id: "ad_demo_4",
                name: "RET – Static Offer",
                campaign_id: "cmp_demo_2",
                configured_status: "ACTIVE",
                effective_status: "ACTIVE",
                spend: 95.3,
                impressions: 5400,
                clicks: 210,
                website_purchase_roas: [{ value: 3.3 }]
            },
            {
                id: "ad_demo_5",
                name: "TOP – Broad 1",
                campaign_id: "cmp_demo_3",
                configured_status: "PAUSED",
                effective_status: "PAUSED",
                spend: 140.0,
                impressions: 12000,
                clicks: 260,
                website_purchase_roas: [{ value: 1.4 }]
            },
            {
                id: "ad_demo_6",
                name: "TOP – Broad 2",
                campaign_id: "cmp_demo_3",
                configured_status: "PAUSED",
                effective_status: "PAUSED",
                spend: 60.0,
                impressions: 7000,
                clicks: 120,
                website_purchase_roas: [{ value: 1.1 }]
            }
        ],
        insightsByCampaign: {
            cmp_demo_1: {
                spend: 530.7,
                impressions: 32700,
                clicks: 1240,
                ctr: (1240 / 32700) * 100,
                roas: 3.9
            },
            cmp_demo_2: {
                spend: 275.3,
                impressions: 15000,
                clicks: 620,
                ctr: (620 / 15000) * 100,
                roas: 4.4
            },
            cmp_demo_3: {
                spend: 200.0,
                impressions: 19000,
                clicks: 380,
                ctr: (380 / 19000) * 100,
                roas: 1.25
            }
        }
    },
    dashboardMetrics: {
        spend: 530.7 + 275.3 + 200,
        impressions: 32700 + 15000 + 19000,
        clicks: 1240 + 620 + 380,
        ctr:
            ((1240 + 620 + 380) /
                (32700 + 15000 + 19000)) *
            100,
        cpm:
            ((530.7 + 275.3 + 200) /
                (32700 + 15000 + 19000)) *
            1000,
        roas:
            (3.9 * 530.7 + 4.4 * 275.3 + 1.25 * 200) /
            (530.7 + 275.3 + 200),
        scopeLabel: "Demo Account – Alle Kampagnen (3)",
        timeRangeLabel: "Letzte 30 Tage"
    }
};

/* -------------------------------------------------------
    SETTINGS & CACHE
---------------------------------------------------------*/

function ensureSettings() {
    if (!AppState.settings) {
        AppState.settings = {
            theme: "auto",
            preferredCurrency: "EUR",
            defaultTimeRange: "last_7d",
            creativeLayout: "grid",
            metaCacheTtlMinutes: 30,
            demoMode: false
        };
    } else {
        if (!AppState.settings.defaultTimeRange) {
            AppState.settings.defaultTimeRange = "last_7d";
        }
        if (typeof AppState.settings.metaCacheTtlMinutes !== "number") {
            AppState.settings.metaCacheTtlMinutes = 30;
        }
        if (typeof AppState.settings.demoMode !== "boolean") {
            AppState.settings.demoMode = false;
        }
    }
    return AppState.settings;
}

function loadSettingsFromStorage() {
    try {
        const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!raw) {
            ensureSettings();
            return;
        }
        const parsed = JSON.parse(raw);
        AppState.settings = {
            ...ensureSettings(),
            ...parsed
        };
    } catch (e) {
        console.warn("Settings load failed:", e);
        ensureSettings();
    }
}

function saveSettingsToStorage() {
    try {
        ensureSettings();
        localStorage.setItem(
            SETTINGS_STORAGE_KEY,
            JSON.stringify(AppState.settings)
        );
    } catch (e) {
        console.warn("Settings save failed:", e);
    }
}

// Cache für Meta-Listen (AdAccounts, Kampagnen, Ads)
function ensureMetaCache() {
    if (!AppState.metaCache) {
        AppState.metaCache = {
            adAccounts: null, // { data, fetchedAt }
            campaignsByAccount: {}, // { [accountId]: { data, fetchedAt } }
            adsByAccount: {} // { [accountId]: { data, fetchedAt } }
        };
    }
    return AppState.metaCache;
}

function getCacheTtlMs() {
    const settings = ensureSettings();
    const override = settings.metaCacheTtlMinutes;
    if (typeof override === "number" && override > 0) {
        return override * 60 * 1000;
    }
    return DEFAULT_CACHE_TTL_MS;
}

function isCacheValid(entry) {
    if (!entry || !entry.fetchedAt) return false;
    const ttl = getCacheTtlMs();
    const age = Date.now() - entry.fetchedAt;
    return age < ttl;
}

function clearMetaCache() {
    AppState.metaCache = {
        adAccounts: null,
        campaignsByAccount: {},
        adsByAccount: {}
    };
}

/* -------------------------------------------------------
    DEMO MODE HELPERS
---------------------------------------------------------*/

function isDemoMode() {
    const settings = ensureSettings();
    return !!settings.demoMode;
}

function applyDemoData() {
    // Basisstruktur für Meta sicherstellen
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

    // Hard overwrite mit Demo-Daten
    AppState.meta.user = DEMO_DATA.meta.user;
    AppState.meta.adAccounts = DEMO_DATA.meta.adAccounts;
    AppState.meta.campaigns = DEMO_DATA.meta.campaigns;
    AppState.meta.ads = DEMO_DATA.meta.ads;
    AppState.meta.creatives = DEMO_DATA.meta.ads;
    AppState.meta.insightsByCampaign =
        DEMO_DATA.meta.insightsByCampaign;

    AppState.selectedAccountId = DEMO_DATA.selectedAccountId;
    AppState.selectedCampaignId = null;

    AppState.dashboardMetrics = DEMO_DATA.dashboardMetrics;
    AppState.dashboardLoaded = true;
    AppState.campaignsLoaded = true;
    AppState.creativesLoaded = true;

    // Cache löschen, damit nichts Altes rumliegt
    clearMetaCache();

    // Wichtig: Live-Verbindung nicht als "connected" markieren,
    // damit klar bleibt: es sind Demo-Daten.
    AppState.metaConnected = false;
}

function clearDemoData() {
    // Demo-Daten aus Views entfernen, aber Live-Token NICHT löschen
    if (!AppState.meta) return;

    AppState.meta.campaigns = [];
    AppState.meta.ads = [];
    AppState.meta.creatives = [];
    AppState.meta.insightsByCampaign = {};

    AppState.dashboardLoaded = false;
    AppState.dashboardMetrics = null;
    AppState.campaignsLoaded = false;
    AppState.creativesLoaded = false;

    clearMetaCache();
}

/* -------------------------------------------------------
    META CONNECT & TOKEN
---------------------------------------------------------*/

function handleMetaConnectClick() {
    if (!META_OAUTH_CONFIG?.appId || !META_OAUTH_CONFIG?.redirectUri) {
        showToast("Meta-Konfiguration fehlt. Bitte Backend prüfen.", "error");
        return;
    }

    showToast("Meta Login wird geöffnet…", "info");

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

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    // URL aufräumen
    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Token wird abgeholt…", "info");

    try {
        const res = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );

        if (!res?.success || !res.accessToken) {
            showToast("Meta-Verbindung fehlgeschlagen", "error");
            return;
        }

        AppState.meta.accessToken = res.accessToken;
        AppState.metaConnected = true;

        persistMetaToken(res.accessToken);
        clearMetaCache();

        await fetchMetaUser();
        if (!isDemoMode()) {
            await loadAdAccountsAndCampaigns();
        }

        updateUI();
        showToast("Erfolgreich mit Meta verbunden!", "success");
    } catch (err) {
        console.error(err);
        showToast("Verbindungsfehler", "error");
    }
}

function loadMetaTokenFromStorage() {
    try {
        const stored = localStorage.getItem(META_TOKEN_STORAGE_KEY);
        if (!stored) return;

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

        AppState.meta.accessToken = stored;
        AppState.metaConnected = true;

        clearMetaCache();
    } catch (e) {
        console.warn("Token load failed:", e);
    }
}

function disconnectMeta() {
    // Demo-Mode unangetastet – hier geht es nur um Live-Verbindung
    AppState.metaConnected = false;

    if (!isDemoMode()) {
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
    } else {
        // im Demo-Modus nur Token killen
        if (AppState.meta) {
            AppState.meta.accessToken = null;
        }
    }

    persistMetaToken(null);
    clearMetaCache();
    showToast("Meta getrennt", "info");
    updateUI();
}

/* -------------------------------------------------------
    META LISTS (AdAccounts, Kampagnen, Ads)
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    if (isDemoMode()) {
        // Im Demo-Modus keine Live-Calls
        return;
    }

    if (!AppState.meta?.accessToken) return;

    ensureMetaCache();

    // AdAccounts
    if (
        !AppState.metaCache.adAccounts ||
        !isCacheValid(AppState.metaCache.adAccounts)
    ) {
        try {
            const accRes = await fetchMetaAdAccounts();
            if (accRes?.success) {
                const data = accRes.data?.data || [];
                AppState.meta.adAccounts = data;
                AppState.metaCache.adAccounts = {
                    data,
                    fetchedAt: Date.now()
                };
            } else {
                AppState.meta.adAccounts = [];
            }
        } catch (e) {
            console.error("AdAccounts Error:", e);
            AppState.meta.adAccounts = [];
        }
    } else {
        AppState.meta.adAccounts =
            AppState.metaCache.adAccounts.data || [];
    }

    // Kampagnen für gewähltes Konto
    if (AppState.selectedAccountId) {
        const accId = AppState.selectedAccountId;
        const cached =
            AppState.metaCache.campaignsByAccount[accId];
        if (cached && isCacheValid(cached)) {
            AppState.meta.campaigns = cached.data;
        } else {
            try {
                const campRes = await fetchMetaCampaigns(accId);
                if (campRes?.success) {
                    const data = campRes.data?.data || [];
                    AppState.meta.campaigns = data;
                    AppState.metaCache.campaignsByAccount[accId] = {
                        data,
                        fetchedAt: Date.now()
                    };
                } else {
                    AppState.meta.campaigns = [];
                }
            } catch (e) {
                console.error("Campaigns Error:", e);
                AppState.meta.campaigns = [];
            }
        }
    }

    AppState.campaignsLoaded = true;
}

async function loadCreativesForCurrentSelection() {
    if (isDemoMode()) {
        // Demo-Daten kommen aus applyDemoData
        return;
    }

    if (!AppState.selectedAccountId) {
        AppState.meta.ads = [];
        AppState.creativesLoaded = false;
        return;
    }

    ensureMetaCache();
    const accId = AppState.selectedAccountId;
    const cached = AppState.metaCache.adsByAccount[accId];

    if (cached && isCacheValid(cached)) {
        AppState.meta.ads = cached.data;
        AppState.creativesLoaded = true;
        return;
    }

    try {
        const res = await fetchMetaAds(accId);
        if (res?.success) {
            const arr = res.data?.data || res.data || [];
            const data = Array.isArray(arr) ? arr : [];
            AppState.meta.ads = data;
            AppState.creativesLoaded = true;

            AppState.metaCache.adsByAccount[accId] = {
                data,
                fetchedAt: Date.now()
            };
        } else {
            AppState.meta.ads = [];
            AppState.creativesLoaded = false;
            AppState.metaCache.adsByAccount[accId] = {
                data: [],
                fetchedAt: Date.now()
            };
            showToast("Creatives konnten nicht geladen werden.", "error");
        }
    } catch (err) {
        console.error(err);
        AppState.meta.ads = [];
        AppState.creativesLoaded = false;
        AppState.metaCache.adsByAccount[accId] = {
            data: [],
            fetchedAt: Date.now()
        };
        showToast("Fehler beim Laden der Creatives.", "error");
    }
}

async function ensureCreativesLoadedAndRender() {
    if (!AppState.creativesLoaded) {
        await loadCreativesForCurrentSelection();
    }
    // Hier: immer "connected" für die Library, da DemoMode und Live beide
    // echte Creatives im State haben
    updateCreativeLibraryView(true);
}

/* -------------------------------------------------------
    VIEW HANDLING
---------------------------------------------------------*/

function showView(viewId) {
    document
        .querySelectorAll(".view")
        .forEach((v) => v.classList.add("hidden"));

    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");

    AppState.currentView = viewId;
    updateUI();
}

/* -------------------------------------------------------
    ACCOUNT / CAMPAIGN DROPDOWNS
---------------------------------------------------------*/

function updateAccountAndCampaignSelectors() {
    const accSel = document.getElementById("brandSelect");
    const campSel = document.getElementById("campaignGroupSelect");

    if (accSel) {
        let options = ['<option value="">Alle Konten</option>'];
        (AppState.meta.adAccounts || []).forEach((acc) => {
            options.push(
                `<option value="${acc.id}" ${
                    acc.id === AppState.selectedAccountId ? "selected" : ""
                }>${acc.name}</option>`
            );
        });
        accSel.innerHTML = options.join("");
    }

    if (campSel) {
        let options = ['<option value="">Alle Kampagnen</option>'];
        (AppState.meta.campaigns || []).forEach((c) => {
            options.push(
                `<option value="${c.id}" ${
                    c.id === AppState.selectedCampaignId ? "selected" : ""
                }>${c.name}</option>`
            );
        });
        campSel.innerHTML = options.join("");
    }
}

/* -------------------------------------------------------
    DASHBOARD NO-DATA STATE
---------------------------------------------------------*/

function applyDashboardNoDataState() {
    const kpiContainer = document.getElementById("dashboardKpiContainer");
    const chartContainer = document.getElementById(
        "dashboardChartContainer"
    );
    const heroContainer = document.getElementById(
        "dashboardHeroCreativesContainer"
    );

    if (kpiContainer) {
        kpiContainer.innerHTML =
            "<p style='color:var(--text-secondary);font-size:13px;'>Verbinde Meta oder aktiviere den Demo-Modus, um Performance-KPIs zu sehen.</p>";
    }
    if (chartContainer) {
        chartContainer.innerHTML =
            "<div class='chart-placeholder'>Keine Daten – Meta nicht verbunden.</div>";
    }
    if (heroContainer) {
        heroContainer.innerHTML = "";
    }
}

/* -------------------------------------------------------
    SETTINGS UI (inkl. Demo-Mode)
---------------------------------------------------------*/

function openSettingsModal() {
    const settings = ensureSettings();

    const html = `
        <form id="settingsForm" class="settings-form">
            <div class="settings-group">
                <div class="settings-group-title">Allgemein</div>
                <div class="settings-row">
                    <label for="settingsCurrency">Währung</label>
                    <div class="settings-control">
                        <select id="settingsCurrency">
                            <option value="EUR" ${
                                settings.preferredCurrency === "EUR"
                                    ? "selected"
                                    : ""
                            }>EUR</option>
                            <option value="USD" ${
                                settings.preferredCurrency === "USD"
                                    ? "selected"
                                    : ""
                            }>USD</option>
                        </select>
                    </div>
                </div>
                <div class="settings-row">
                    <label for="settingsTimeRange">Standard-Zeitraum</label>
                    <div class="settings-control">
                        <select id="settingsTimeRange">
                            <option value="today" ${
                                settings.defaultTimeRange === "today"
                                    ? "selected"
                                    : ""
                            }>Heute</option>
                            <option value="yesterday" ${
                                settings.defaultTimeRange === "yesterday"
                                    ? "selected"
                                    : ""
                            }>Gestern</option>
                            <option value="last_7d" ${
                                settings.defaultTimeRange === "last_7d"
                                    ? "selected"
                                    : ""
                            }>Letzte 7 Tage</option>
                            <option value="last_30d" ${
                                settings.defaultTimeRange === "last_30d"
                                    ? "selected"
                                    : ""
                            }>Letzte 30 Tage</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Datenquelle</div>
                <div class="settings-row">
                    <label for="settingsDemoMode">Demo-Modus (Mock-Daten)</label>
                    <div class="settings-control">
                        <input type="checkbox" id="settingsDemoMode" ${
                            settings.demoMode ? "checked" : ""
                        } />
                    </div>
                </div>
                <p style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
                    Im Demo-Modus verwendet SignalOne vordefinierte Performance-Daten.
                    Es werden <strong>keine Live-API-Calls</strong> zu Meta ausgeführt.
                </p>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Darstellung</div>
                <div class="settings-row">
                    <label for="settingsTheme">Theme</label>
                    <div class="settings-control">
                        <select id="settingsTheme">
                            <option value="auto" ${
                                settings.theme === "auto" ? "selected" : ""
                            }>System</option>
                            <option value="light" ${
                                settings.theme === "light" ? "selected" : ""
                            }>Hell</option>
                            <option value="dark" ${
                                settings.theme === "dark" ? "selected" : ""
                            }>Dunkel</option>
                        </select>
                    </div>
                </div>
                <div class="settings-row">
                    <label for="settingsCreativeLayout">Creative-Layout</label>
                    <div class="settings-control">
                        <select id="settingsCreativeLayout">
                            <option value="grid" ${
                                settings.creativeLayout === "grid"
                                    ? "selected"
                                    : ""
                            }>Grid</option>
                            <option value="list" ${
                                settings.creativeLayout === "list"
                                    ? "selected"
                                    : ""
                            }>Liste</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Performance & Cache</div>
                <div class="settings-row">
                    <label for="settingsMetaCacheTtl">Meta-Cache (Minuten)</label>
                    <div class="settings-control">
                        <input
                            type="number"
                            id="settingsMetaCacheTtl"
                            min="1"
                            max="240"
                            value="${settings.metaCacheTtlMinutes || 30}"
                        />
                    </div>
                </div>
            </div>

            <div class="settings-actions">
                <button type="button" class="btn-secondary" id="settingsCancelBtn">
                    Abbrechen
                </button>
                <button type="submit" class="btn-primary">
                    Speichern
                </button>
            </div>
        </form>
    `;

    openModal("Einstellungen", html);

    const form = document.getElementById("settingsForm");
    const cancelBtn = document.getElementById("settingsCancelBtn");

    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            const modal = document.querySelector(".modal-overlay");
            if (modal) modal.remove();
        });
    }

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const s = ensureSettings();

            const currency = document.getElementById("settingsCurrency");
            const timeRange = document.getElementById("settingsTimeRange");
            const theme = document.getElementById("settingsTheme");
            const layout = document.getElementById("settingsCreativeLayout");
            const cacheTtl = document.getElementById(
                "settingsMetaCacheTtl"
            );
            const demoCheckbox = document.getElementById(
                "settingsDemoMode"
            );

            s.preferredCurrency =
                currency?.value || s.preferredCurrency;
            s.defaultTimeRange =
                timeRange?.value || s.defaultTimeRange;
            s.theme = theme?.value || s.theme;
            s.creativeLayout = layout?.value || s.creativeLayout;

            const ttlVal = Number(cacheTtl?.value || 30);
            if (!Number.isNaN(ttlVal) && ttlVal > 0) {
                s.metaCacheTtlMinutes = ttlVal;
            }

            const newDemoMode = !!demoCheckbox?.checked;
            const oldDemoMode = !!s.demoMode;

            s.demoMode = newDemoMode;

            saveSettingsToStorage();

            // Demo-Mode Umschalten
            if (newDemoMode && !oldDemoMode) {
                applyDemoData();
            } else if (!newDemoMode && oldDemoMode) {
                clearDemoData();
            }

            // Modal schließen
            const modal = document.querySelector(".modal-overlay");
            if (modal) modal.remove();

            showToast("Einstellungen gespeichert", "success");
            updateUI();
        });
    }
}

/* -------------------------------------------------------
    PROFILE & SYSTEM BUTTONS (Preview-Content)
---------------------------------------------------------*/

function initSystemButtons() {
    const profileBtn = document.getElementById("profileButton");
    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
                    <p><strong>Profil & Account (Preview)</strong></p>
                    <p style="color:var(--text-secondary);">
                        Hier werden später deine Profil-, Team- und Account-Daten aus der SignalOne-Datenbank geladen.
                    </p>
                    <ul style="margin-left:18px;margin-top:6px;">
                        <li>Verknüpfte Werbekonten & Rollen</li>
                        <li>Benachrichtigungs-Einstellungen & E-Mail-Reports</li>
                        <li>Fehler- & Aktivitätslog für dieses Profil</li>
                    </ul>
                    <p style="font-size:11px;color:var(--text-secondary);margin-top:6px;">
                        Aktuelle Version: <strong>S1-0.9-demo</strong>
                    </p>
                </div>
            `;
            openModal("Profil & Account", html);
        });
    }

    const notificationsBtn = document.getElementById(
        "notificationsButton"
    );
    if (notificationsBtn) {
        notificationsBtn.addEventListener("click", () => {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
                    <p><strong>Benachrichtigungen (Preview)</strong></p>
                    <p style="color:var(--text-secondary);">
                        Hier folgt später das echte Notification-Center mit System- und Kampagnen-Alerts.
                    </p>
                    <ul style="margin-left:18px;margin-top:6px;">
                        <li>Meta-Verbindungsfehler & Token-Expiry</li>
                        <li>Kampagnen-Performance Alerts (ROAS, Spend, CTR)</li>
                        <li>Sensei-Empfehlungen & Prüfungen</li>
                    </ul>
                </div>
            `;
            openModal("Benachrichtigungen", html);
        });
    }

    const settingsBtn = document.getElementById("openSettingsButton");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            openSettingsModal();
        });
    }
}

/* -------------------------------------------------------
    UI UPDATE
---------------------------------------------------------*/

function updateUI() {
    const demoMode = isDemoMode();
    const liveConnected = checkMetaConnection();
    const connected = demoMode ? true : liveConnected;

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView") {
        if (connected) {
            updateDashboardView(true);
        } else {
            applyDashboardNoDataState();
        }
    }

    if (AppState.currentView === "campaignsView") {
        updateCampaignsView(connected);
    }

    if (AppState.currentView === "creativesView") {
        if (connected) {
            ensureCreativesLoadedAndRender();
        } else {
            updateCreativeLibraryView(false);
        }
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

    updateHealthStatus();
}

/* -------------------------------------------------------
    INIT
---------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
    // Settings & Theme
    loadSettingsFromStorage();
    ensureSettings();

    // ggf. Default-Zeitraum auf Dashboard-Select anwenden
    const settings = ensureSettings();
    if (settings.defaultTimeRange) {
        AppState.timeRangePreset = settings.defaultTimeRange;
        const sel = document.getElementById("dashboardTimeRange");
        if (sel) {
            sel.value = settings.defaultTimeRange;
        }
    }

    // Meta-Token aus Storage laden (Live-Verbindung)
    loadMetaTokenFromStorage();

    // DemoMode ggf. initial aktivieren (Daten in State pushen)
    if (isDemoMode()) {
        applyDemoData();
    }

    // Grund-Init
    showView(AppState.currentView || "dashboardView");
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();
    initSystemButtons();

    // Meta Buttons
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn)
        metaBtn.addEventListener("click", (e) => {
            e.preventDefault();
            handleMetaConnectClick();
        });

    const discBtn = document.getElementById("disconnectMetaButton");
    if (discBtn)
        discBtn.addEventListener("click", (e) => {
            e.preventDefault();
            disconnectMeta();
        });

    // Dashboard TimeRange
    const dashboardTimeRange =
        document.getElementById("dashboardTimeRange");
    if (dashboardTimeRange) {
        dashboardTimeRange.addEventListener("change", (e) => {
            AppState.timeRangePreset = e.target.value;
            AppState.dashboardLoaded = false;
            AppState.meta.insightsByCampaign = {};

            const s = ensureSettings();
            s.defaultTimeRange = e.target.value;
            saveSettingsToStorage();

            updateDashboardView(checkMetaConnection() || isDemoMode());
        });
    }

    // Campaign Search/Filter
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

    // Creative Library Filter
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

    // Account / Campaign Dropdowns
    const accountSelect = document.getElementById("brandSelect");
    if (accountSelect) {
        accountSelect.addEventListener("change", async (e) => {
            const newAccountId = e.target.value || null;
            AppState.selectedAccountId = newAccountId;
            AppState.selectedCampaignId = null;

            AppState.dashboardLoaded = false;
            AppState.campaignsLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;
            AppState.meta.insightsByCampaign = {};
            AppState.meta.campaigns = [];
            AppState.meta.creatives = [];
            AppState.meta.ads = [];

            clearMetaCache();

            if (newAccountId && !isDemoMode()) {
                await loadAdAccountsAndCampaigns();
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

            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            updateUI();
        });
    }

    // OAuth Redirect ggf. abholen (nur Live-Mode)
    await handleMetaOAuthRedirectIfPresent();
});
