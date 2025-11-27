// app.js – Orchestrator mit Meta-Caching & Creative-Loader
// SignalOne.cloud – Frontend Engine

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

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";

// Default Cache-TTL (kann später über Settings angepasst werden)
const DEFAULT_CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minuten

/* -------------------------------------------------------
    Hilfsfunktionen: Cache
---------------------------------------------------------*/

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
    // optional: aus Settings lesen, falls du es später konfigurierbar machst
    const override = AppState.settings?.metaCacheTtlMinutes;
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
    META CONNECT (aktuell klassisch per Redirect)
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

    // TODO: Später auf Popup-Flow umstellen – aktuell klassischer Redirect:
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

    clearMetaCache();

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

        if (!res?.success || !res.accessToken) {
            showToast("Meta-Verbindung fehlgeschlagen", "error");
            return;
        }

        AppState.meta.accessToken = res.accessToken;
        AppState.metaConnected = true;

        persistMetaToken(res.accessToken);
        clearMetaCache();

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
    TOKEN LOAD (Auto-Reconnect + erster Cache-Aufbau)
---------------------------------------------------------*/

function loadMetaTokenFromStorage() {
    try {
        const stored = localStorage.getItem(META_TOKEN_STORAGE_KEY);
        if (!stored) return;

        AppState.meta.accessToken = stored;
        AppState.metaConnected = true;

        showToast("Meta-Token aus Speicher geladen", "info");
        clearMetaCache();

        fetchMetaUser()
            .then(() => loadAdAccountsAndCampaigns())
            .then(() => {
                updateUI();
            })
            .catch((err) => {
                console.error(err);
                showToast(
                    "Fehler beim Wiederherstellen der Meta-Verbindung",
                    "error"
                );
            });
    } catch (e) {
        console.warn("LocalStorage read failed:", e);
    }
}

/* -------------------------------------------------------
    ACCOUNT & CAMPAIGNS (mit Cache)
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    ensureMetaCache();

    // 1) AdAccounts – erst Cache prüfen
    if (isCacheValid(AppState.metaCache.adAccounts)) {
        AppState.meta.adAccounts = AppState.metaCache.adAccounts.data;
    } else {
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
            AppState.metaCache.adAccounts = null;
        }
    }

    // 2) Default Account setzen
    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId) {
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;
    }

    // 3) Kampagnen für ausgewählten Account – Cache prüfen
    if (AppState.selectedAccountId) {
        const accId = AppState.selectedAccountId;
        const cacheEntry =
            AppState.metaCache.campaignsByAccount[accId] || null;

        if (isCacheValid(cacheEntry)) {
            AppState.meta.campaigns = cacheEntry.data;
        } else {
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
                AppState.metaCache.campaignsByAccount[accId] = {
                    data: [],
                    fetchedAt: Date.now()
                };
            }
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
    const options = [`<option value="">Alle Kampagnen</option>`];

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
    CREATIVES LADEN (mit Cache)
---------------------------------------------------------*/

async function loadCreativesForCurrentSelection() {
    ensureMetaCache();

    if (!AppState.selectedAccountId) {
        AppState.meta.ads = [];
        AppState.creativesLoaded = false;
        return;
    }

    const accId = AppState.selectedAccountId;
    const cacheEntry = AppState.metaCache.adsByAccount[accId] || null;

    if (isCacheValid(cacheEntry)) {
        AppState.meta.ads = cacheEntry.data;
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
    updateCreativeLibraryView(true);
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

    const profileBtn = document.getElementById("profileButton");
    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            const html = `
                <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
                    <p>
                        Hier werden später deine Profil-, Team- und Account-Daten aus der SignalOne-Datenbank geladen.
                    </p>
                    <p style="color:var(--text-secondary);">
                        Geplant:
                    </p>
                    <ul style="margin-left:18px; color:var(--text-secondary); font-size:13px;">
                        <li>Verknüpfte Werbekonten & Rollen (Owner / Admin / Viewer)</li>
                        <li>Benachrichtigungs-Einstellungen & E-Mail-Reports</li>
                        <li>Fehler- & Aktivitätslog für dieses Profil</li>
                    </ul>
                    <p style="font-size:12px; color:var(--text-secondary);">
                        Aktuelle Version: <strong>S1-0.9-b</strong>
                    </p>
                </div>
            `;
            openModal("Profil & Account (Preview)", html);
        });
    }

    const notificationsBtn = document.getElementById("notificationsButton");
    if (notificationsBtn) {
        notificationsBtn.addEventListener("click", () => {
            const html = `
                <div style="display:flex; flex-direction:column; gap:10px; font-size:13px;">
                    <p>
                        Hier werden später System- und Produkt-Benachrichtigungen angezeigt:
                    </p>
                    <ul style="margin-left:18px; color:var(--text-secondary); font-size:13px;">
                        <li>Meta-Verbindungsstatus & API-Fehler</li>
                        <li>Neue Reports & Exporte bereit</li>
                        <li>Sensei-Warnungen & Chancen</li>
                        <li>Testing-Log Updates</li>
                    </ul>
                    <p style="font-size:12px; color:var(--text-secondary);">
                        In der finalen Version werden diese Einträge aus der Datenbank (error_logs & notifications) geladen.
                    </p>
                </div>
            `;
            openModal("Benachrichtigungen (Preview)", html);
        });
    }

    await handleMetaOAuthRedirectIfPresent();

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
    ----------------------------------------------------*/

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

            // Cache für diesen Account (Kampagnen & Ads) leeren,
            // Accounts-Cache kann bleiben
            ensureMetaCache();
            if (newAccountId) {
                delete AppState.metaCache.campaignsByAccount[newAccountId];
                delete AppState.metaCache.adsByAccount[newAccountId];

                const campRes = await fetchMetaCampaigns(newAccountId);
                if (campRes?.success) {
                    const data = campRes.data?.data || [];
                    AppState.meta.campaigns = data;
                    AppState.metaCache.campaignsByAccount[newAccountId] = {
                        data,
                        fetchedAt: Date.now()
                    };
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

            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            updateUI();
        });
    }
});
