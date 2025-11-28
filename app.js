// app.js – FINAL VERSION

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
    fetchMetaAds,
    fetchMetaCampaignInsights
} from "./metaApi.js";

import { updateDashboardView } from "./dashboard.js";
import { updateCampaignsView } from "./campaigns.js";
import { updateCreativeLibraryView, renderCreativeLibrary } from "./creativeLibrary.js";
import { updateSenseiView } from "./sensei.js";
import { updateReportsView } from "./reports.js";
import { updateTestingLogView } from "./testingLog.js";
import { initSettings } from "./settings.js";

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000;

/* SETTINGS */
function ensureSettings() {
    if (!AppState.settings) {
        AppState.settings = {
            theme: "light",
            currency: "EUR",
            metaCacheTtlMinutes: 15,
            defaultTimeRange: "last_30d",
            creativeLayout: "grid",
            demoMode: true
        };
    }
    return AppState.settings;
}
function isDemoMode() { return !!ensureSettings().demoMode; }
function saveSettingsToStorage() {
    try { localStorage.setItem("signalone_settings_v1", JSON.stringify(AppState.settings)); }
    catch {}
}
function loadSettingsFromStorage() {
    try {
        const raw = localStorage.getItem("signalone_settings_v1");
        if (raw) AppState.settings = { ...AppState.settings, ...JSON.parse(raw) };
    } catch {}
}
function applyThemeFromSettings() {
    document.documentElement.dataset.theme = ensureSettings().theme === "dark" ? "dark" : "light";
}
function applyDashboardTimeRangeFromSettings() {
    const s = ensureSettings();
    const def = s.defaultTimeRange || "last_30d";
    const el = document.getElementById("dashboardTimeRange");
    if (el) el.value = def;
    AppState.timeRangePreset = def;
}

/* CACHE */
function ensureMetaCache() {
    if (!AppState.metaCache) {
        AppState.metaCache = {
            adAccounts: null,
            campaignsByAccount: {},
            adsByAccount: {}
        };
    }
    return AppState.metaCache;
}
function getCacheTtlMs() {
    const m = ensureSettings().metaCacheTtlMinutes;
    return m > 0 ? m * 60000 : DEFAULT_CACHE_TTL_MS;
}
function isCacheValid(e) {
    if (!e || !e.fetchedAt) return false;
    return Date.now() - e.fetchedAt < getCacheTtlMs();
}
function clearMetaCache() {
    AppState.metaCache = { adAccounts: null, campaignsByAccount: {}, adsByAccount: {} };
}

/* VIEW HANDLER */
function showView(id) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
    AppState.currentView = id;
    updateUI();
}

/* META CONNECT */
function handleMetaConnectClick() {
    const authUrl =
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        });

    const popup = window.open(
        authUrl,
        "MetaLogin",
        "width=600,height=800,left=200,top=100"
    );

    if (!popup) {
        showToast("Popup blockiert!", "error");
        return;
    }
    showToast("Meta Login geöffnet…", "info");
}

function persistMetaToken(t) {
    try {
        if (t) localStorage.setItem(META_TOKEN_STORAGE_KEY, t);
        else localStorage.removeItem(META_TOKEN_STORAGE_KEY);
    } catch {}
}

/* DISCONNECT */
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
    clearMetaCache();
    persistMetaToken(null);
    updateUI();
}

/* OAUTH REDIRECT — POPUP FIX DRIN! */
async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", "/");
    showToast("Token wird abgeholt…", "info");

    try {
        const token = await exchangeMetaCodeForToken(code, META_OAUTH_CONFIG.redirectUri);
        if (!token) {
            showToast("OAuth Fehler", "error");
            return;
        }

        AppState.meta.accessToken = token;
        AppState.metaConnected = true;
        persistMetaToken(token);
        clearMetaCache();

        try { AppState.meta.user = await fetchMetaUser(token); } catch {}

        await loadAdAccountsAndCampaigns();
        updateUI();
        showToast("Meta verbunden!", "success");

        /* 🔥 POPUP SCHLIESSEN – DAS FEHLTE!!! */
        if (window.opener) {
            window.opener.location.reload();
            window.close();
        }

    } catch (e) {
        showToast("Verbindung fehlgeschlagen", "error");
    }
}

/* LOAD TOKEN */
function loadMetaTokenFromStorage() {
    try {
        const t = localStorage.getItem(META_TOKEN_STORAGE_KEY);
        if (!t) return;

        AppState.meta.accessToken = t;
        AppState.metaConnected = true;
        clearMetaCache();

        fetchMetaUser(t)
            .then(u => { AppState.meta.user = u; return loadAdAccountsAndCampaigns(); })
            .then(() => updateUI())
            .catch(() => { AppState.metaConnected = false; AppState.meta.accessToken = null; });
    } catch {}
}

/* LOAD ACC + CAMPAIGNS */
async function loadAdAccountsAndCampaigns() {
    ensureMetaCache();
    const token = AppState.meta.accessToken;
    if (!token) { AppState.meta.adAccounts = []; return; }

    /* ACCOUNTS */
    if (isCacheValid(AppState.metaCache.adAccounts)) {
        AppState.meta.adAccounts = AppState.metaCache.adAccounts.data;
    } else {
        const data = await fetchMetaAdAccounts(token);
        AppState.meta.adAccounts = data;
        AppState.metaCache.adAccounts = { data, fetchedAt: Date.now() };
    }

    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId)
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;

    /* CAMPAIGNS */
    if (AppState.selectedAccountId) {
        const acc = AppState.selectedAccountId;
        const cache = AppState.metaCache.campaignsByAccount[acc];

        if (isCacheValid(cache)) {
            AppState.meta.campaigns = cache.data;
        } else {
            const data = await fetchMetaCampaigns(acc, token);
            AppState.meta.campaigns = data;
            AppState.metaCache.campaignsByAccount[acc] = { data, fetchedAt: Date.now() };
        }
    }

    updateAccountAndCampaignSelectors();
}

/* SELECTORS */
function updateAccountAndCampaignSelectors() {
    const accSel = document.getElementById("brandSelect");
    const campSel = document.getElementById("campaignGroupSelect");
    if (!accSel || !campSel) return;

    accSel.innerHTML = AppState.meta.adAccounts.length
        ? AppState.meta.adAccounts.map(a =>
            `<option value="${a.id}" ${a.id === AppState.selectedAccountId ? "selected" : ""}>${a.name}</option>`
        ).join("")
        : `<option value="">Kein Werbekonto gefunden</option>`;

    const ops = [`<option value="">Alle Kampagnen</option>`];
    (AppState.meta.campaigns || []).forEach(c =>
        ops.push(`<option value="${c.id}" ${c.id === AppState.selectedCampaignId ? "selected" : ""}>${c.name}</option>`)
    );
    campSel.innerHTML = ops.join("");
}

/* ADS / CREATIVES */
async function loadCreativesForCurrentSelection() {
    ensureMetaCache();
    const token = AppState.meta.accessToken;
    const acc = AppState.selectedAccountId;
    if (!acc || !token) { AppState.meta.ads = []; return; }

    const cache = AppState.metaCache.adsByAccount[acc];
    if (isCacheValid(cache)) {
        AppState.meta.ads = cache.data;
        AppState.creativesLoaded = true;
        return;
    }

    const data = await fetchMetaAds(acc, token);
    AppState.meta.ads = data;
    AppState.creativesLoaded = true;
    AppState.metaCache.adsByAccount[acc] = { data, fetchedAt: Date.now() };
}
async function ensureCreativesLoadedAndRender() {
    if (!AppState.creativesLoaded) await loadCreativesForCurrentSelection();
    updateCreativeLibraryView(true);
}

/* UI UPDATE */
function applyDashboardNoDataState() {
    const k = document.getElementById("dashboardKpiContainer");
    if (k) k.innerHTML = "<p>Verbinde Meta, um Daten zu sehen.</p>";
}
function applyDemoDashboardState() {
    const k = document.getElementById("dashboardKpiContainer");
    if (k) k.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card"><div class="kpi-label">ROAS</div><div class="kpi-value">3,8x</div></div>
            <div class="kpi-card"><div class="kpi-label">Spend</div><div class="kpi-value">12.340 €</div></div>
            <div class="kpi-card"><div class="kpi-label">CTR</div><div class="kpi-value">1,4%</div></div>
            <div class="kpi-card"><div class="kpi-label">Conversions</div><div class="kpi-value">926</div></div>
        </div>
    `;
}

function updateUI() {
    const connected = checkMetaConnection();
    const demo = isDemoMode();

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView") {
        if (connected) updateDashboardView(true);
        else if (demo) applyDemoDashboardState();
        else applyDashboardNoDataState();
    }

    if (AppState.currentView === "campaignsView") updateCampaignsView(connected);
    if (AppState.currentView === "creativesView") {
        if (connected) ensureCreativesLoadedAndRender();
        else updateCreativeLibraryView(false);
    }
    if (AppState.currentView === "senseiView") updateSenseiView(connected);
    if (AppState.currentView === "reportsView") updateReportsView(connected);
    if (AppState.currentView === "testingLogView") updateTestingLogView(connected);

    updateHealthStatus();
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
    ensureSettings();
    loadSettingsFromStorage();
    applyThemeFromSettings();

    loadMetaTokenFromStorage();
    applyDashboardTimeRangeFromSettings();

    showView(AppState.currentView);
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();

    const btn = document.getElementById("connectMetaButton");
    if (btn) btn.addEventListener("click", handleMetaConnectClick);

    const d = document.getElementById("disconnectMetaButton");
    if (d) d.addEventListener("click", disconnectMeta);

    // NEW: Zeitbereich-Änderung beeinflusst das Dashboard
    const timeRange = document.getElementById("dashboardTimeRange");
    if (timeRange) {
        timeRange.addEventListener("change", (e) => {
            const value = e.target.value || "last_30d";
            AppState.timeRangePreset = value;
            const s = ensureSettings();
            s.defaultTimeRange = value;
            saveSettingsToStorage();
            AppState.dashboardLoaded = false;
            updateUI();
        });
    }

    await handleMetaOAuthRedirectIfPresent();

    const acc = document.getElementById("brandSelect");
    if (acc) acc.addEventListener("change", async e => {
        AppState.selectedAccountId = e.target.value || null;
        AppState.selectedCampaignId = null;
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        AppState.creativesLoaded = false;
        clearMetaCache();
        await loadAdAccountsAndCampaigns();
        updateUI();
    });

    const camp = document.getElementById("campaignGroupSelect");
    if (camp) camp.addEventListener("change", e => {
        AppState.selectedCampaignId = e.target.value || null;
        AppState.dashboardLoaded = false;
        AppState.creativesLoaded = false;
        updateUI();
    });
});
