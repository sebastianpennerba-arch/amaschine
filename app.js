// app.js – FINAL VERSION

import { AppState, META_OAUTH_CONFIG } from "./state.js";
import {
    showToast,
    updateGreeting,
    initSidebarNavigation,
    initDateTime,
    checkMetaConnection,
    openModal, // aktuell nicht verwendet, aber belassen
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
import { updateCreativeLibraryView } from "./creativeLibrary.js";
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
function isDemoMode() {
    return !!ensureSettings().demoMode;
}
function saveSettingsToStorage() {
    try {
        localStorage.setItem(
            "signalone_settings_v1",
            JSON.stringify(AppState.settings)
        );
    } catch {}
}
function loadSettingsFromStorage() {
    try {
        const raw = localStorage.getItem("signalone_settings_v1");
        if (raw) AppState.settings = { ...AppState.settings, ...JSON.parse(raw) };
    } catch {}
}
function applyThemeFromSettings() {
    document.documentElement.dataset.theme =
        ensureSettings().theme === "dark" ? "dark" : "light";
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
    AppState.metaCache = {
        adAccounts: null,
        campaignsByAccount: {},
        adsByAccount: {}
    };
}

/* VIEW HANDLER */
function showView(id) {
    document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
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

    window.location.href = authUrl;
}

async function handleMetaCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;

    try {
        const token = await exchangeMetaCodeForToken(code);
        if (!token) throw new Error("No token");

        AppState.meta.accessToken = token;
        AppState.metaConnected = true;
        localStorage.setItem(META_TOKEN_STORAGE_KEY, token);
        clearMetaCache();

        const user = await fetchMetaUser(token);
        AppState.meta.user = user;

        await loadAdAccountsAndCampaigns();
        updateUI();
        showToast("Meta verbunden!", "success");

        // POPUP CLOSE
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
            .then((u) => {
                AppState.meta.user = u;
                return loadAdAccountsAndCampaigns();
            })
            .then(() => updateUI())
            .catch(() => {
                AppState.metaConnected = false;
                AppState.meta.accessToken = null;
            });
    } catch {}
}

/* LOAD ACC + CAMPAIGNS */
async function loadAdAccountsAndCampaigns() {
    ensureMetaCache();
    const token = AppState.meta.accessToken;
    if (!token) {
        AppState.meta.adAccounts = [];
        return;
    }

    // ACCOUNTS
    if (isCacheValid(AppState.metaCache.adAccounts)) {
        AppState.meta.adAccounts = AppState.metaCache.adAccounts.data;
    } else {
        const data = await fetchMetaAdAccounts(token);
        AppState.meta.adAccounts = data;
        AppState.metaCache.adAccounts = { data, fetchedAt: Date.now() };
    }

    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId)
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;

    // CAMPAIGNS
    if (AppState.selectedAccountId) {
        const acc = AppState.selectedAccountId;
        const cache = AppState.metaCache.campaignsByAccount[acc];

        if (isCacheValid(cache)) {
            AppState.meta.campaigns = cache.data;
        } else {
            const data = await fetchMetaCampaigns(acc, token);
            AppState.meta.campaigns = data;
            AppState.metaCache.campaignsByAccount[acc] = {
                data,
                fetchedAt: Date.now()
            };
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
        ? AppState.meta.adAccounts
              .map(
                  (a) =>
                      `<option value="${a.id}" ${
                          a.id === AppState.selectedAccountId ? "selected" : ""
                      }>${a.name}</option>`
              )
              .join("")
        : `<option value="">Kein Werbekonto gefunden</option>`;

    const ops = [`<option value="">Alle Kampagnen</option>`];
    (AppState.meta.campaigns || []).forEach((c) =>
        ops.push(
            `<option value="${c.id}" ${
                c.id === AppState.selectedCampaignId ? "selected" : ""
            }>${c.name}</option>`
        )
    );
    campSel.innerHTML = ops.join("");
}

/* ADS / CREATIVES */
async function loadCreativesForCurrentSelection() {
    ensureMetaCache();
    const token = AppState.meta.accessToken;
    const acc = AppState.selectedAccountId;
    if (!acc || !token) {
        AppState.meta.ads = [];
        return;
    }

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

// Achtung: Die „alte“ Demo-Fläche bleibt als Fallback – aber
// der neue Demo-Dashboard-Flow läuft jetzt über dashboard.js.
function applyDemoDashboardState() {
    const k = document.getElementById("dashboardKpiContainer");
    if (k)
        k.innerHTML = `
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

    // DASHBOARD:
    // 👉 Demo wird jetzt wie eine „echte Connection“ behandelt.
    if (AppState.currentView === "dashboardView") {
        if (connected || demo) {
            // dashboard.js entscheidet intern, ob Demo- oder Live-Daten verwendet werden
            updateDashboardView(connected);
        } else {
            applyDashboardNoDataState();
        }
    }

    if (AppState.currentView === "campaignsView") updateCampaignsView(connected);

    if (AppState.currentView === "creativesView") {
        if (connected) {
            // Live: echte Meta-Daten
            ensureCreativesLoadedAndRender();
        } else {
            // Demo / kein Connect: creativeLibrary.js kümmert sich um Demo-Mode
            updateCreativeLibraryView(false);
        }
    }

    if (AppState.currentView === "senseiView") updateSenseiView(connected);
    if (AppState.currentView === "reportsView") updateReportsView(connected);
    if (AppState.currentView === "testingLogView") updateTestingLogView(connected);

    updateHealthStatus();
}

/* -------------------------------------------------
   APPLE-STYLE MODAL SYSTEM (für Settings/Profil/Notifications)
-------------------------------------------------- */

function getModalElements() {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    const closeBtn = document.getElementById("modalCloseButton");
    return { overlay, titleEl, bodyEl, closeBtn };
}

function openSystemModal(title, bodyHtml) {
    const { overlay, titleEl, bodyEl } = getModalElements();
    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = title || "";
    bodyEl.innerHTML = bodyHtml || "";
    overlay.classList.add("visible");
}

function closeSystemModal() {
    const { overlay } = getModalElements();
    if (!overlay) return;
    overlay.classList.remove("visible");
}

/* -------------------------------------------------
   SETTINGS / PROFILE / NOTIFICATIONS BUTTONS
-------------------------------------------------- */

function initTopBarButtons() {
    const profileBtn = document.getElementById("profileButton");
    const settingsBtn = document.getElementById("settingsButtonTop");
    const notifBtn = document.getElementById("notificationsButton");

    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            const user = AppState.meta?.user;
            const name = user?.name || "Unbekannter User";
            const id = user?.id || "–";

            const html = `
                <div class="profile-card">
                    <div class="profile-avatar">
                        <span>${name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div class="profile-info">
                        <h3>${name}</h3>
                        <p>User ID: ${id}</p>
                        <p>Rolle: Admin</p>
                    </div>
                </div>
            `;
            openSystemModal("Profil", html);
        });
    }

    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            const html = initSettings(ensureSettings, saveSettingsToStorage, applyThemeFromSettings, applyDashboardTimeRangeFromSettings);
            openSystemModal("Settings", html);
        });
    }

    if (notifBtn) {
        notifBtn.addEventListener("click", () => {
            const html = `
                <div class="notification-list">
                    <div class="notification-item">
                        <div class="notification-title">Demo-Mode aktiv</div>
                        <div class="notification-message">
                            Alle Daten, die du aktuell siehst, basieren auf einem voll simulierten Account.
                        </div>
                        <div class="notification-meta">Gerade eben • System</div>
                    </div>
                    <div class="notification-item">
                        <div class="notification-title">Sensei aktiviert</div>
                        <div class="notification-message">
                            Sensei analysiert dein Konto in Echtzeit, sobald du Meta verbindest.
                        </div>
                        <div class="notification-meta">Heute • AI Layer</div>
                    </div>
                </div>
            `;
            openSystemModal("Benachrichtigungen", html);
        });
    }

    const { closeBtn } = getModalElements();
    if (closeBtn) closeBtn.addEventListener("click", closeSystemModal);
    const overlay = document.getElementById("modalOverlay");
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeSystemModal();
        });
    }
}

/* INIT */
function init() {
    if (!window.AppState) window.AppState = AppState;

    ensureSettings();
    loadSettingsFromStorage();
    applyThemeFromSettings();
    applyDashboardTimeRangeFromSettings();

    initSidebarNavigation(showView);
    initDateTime();

    const connectBtn = document.getElementById("connectMetaButton");
    if (connectBtn) connectBtn.addEventListener("click", handleMetaConnectClick);

    document
        .getElementById("dashboardTimeRange")
        ?.addEventListener("change", () => updateUI());

    // Settings Button (Sidebar)
    const sidebarSettingsBtn = document.getElementById("openSettingsButton");
    if (sidebarSettingsBtn) {
        sidebarSettingsBtn.addEventListener("click", () => {
            const html = initSettings(ensureSettings, saveSettingsToStorage, applyThemeFromSettings, applyDashboardTimeRangeFromSettings);
            openSystemModal("Settings", html);
        });
    }

    initTopBarButtons();
    loadMetaTokenFromStorage();
    updateUI();
}

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("code")) {
        handleMetaCallback();
    } else {
        init();
    }
});
