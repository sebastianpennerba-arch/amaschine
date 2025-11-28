// app.js – Backbone mit Package-Architektur (Dashboard, Campaigns, Creatives)

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
    fetchMetaAds
} from "./metaApi.js";

// 🔹 Packages
import DashboardPackage from "./packages/dashboard/index.js";
import CampaignsPackage from "./packages/campaigns/index.js";
import CreativesPackage from "./packages/creatives/index.js";

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
        const token = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );
        if (!token) {
            showToast("OAuth Fehler", "error");
            return;
        }

        AppState.meta.accessToken = token;
        AppState.metaConnected = true;
        persistMetaToken(token);
        clearMetaCache();

        try {
            AppState.meta.user = await fetchMetaUser(token);
        } catch {}

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

    AppState.campaignsLoaded = true;
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

/* ADS / CREATIVES – (aktuell nicht genutzt vom Package, aber safe) */
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

/* UI UPDATE */
function updateUI() {
    const connected = checkMetaConnection();
    const demo = isDemoMode();

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView") {
        DashboardPackage.render({ connected, demo });
    }

    if (AppState.currentView === "campaignsView") {
        CampaignsPackage.render({ connected });
    }

    if (AppState.currentView === "creativesView") {
        CreativesPackage.render({ connected });
    }

    if (AppState.currentView === "senseiView") updateSenseiView(connected);
    if (AppState.currentView === "reportsView") updateReportsView(connected);
    if (AppState.currentView === "testingLogView")
        updateTestingLogView(connected);

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
    const { overlay, bodyEl } = getModalElements();
    if (!overlay) return;
    overlay.classList.remove("visible");
    if (bodyEl) bodyEl.innerHTML = "";
}

/* SETTINGS MODAL */

function openSettingsModal() {
    const s = ensureSettings();

    const bodyHtml = `
        <div class="modal-section">
            <div class="modal-section-title">Darstellung</div>
            <div class="modal-row">
                <label for="settingsTheme">Theme</label>
                <select id="settingsTheme">
                    <option value="light" ${s.theme === "light" ? "selected" : ""}>Light</option>
                    <option value="dark" ${s.theme === "dark" ? "selected" : ""}>Dark</option>
                </select>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Performance & Daten</div>
            <div class="modal-row">
                <label for="settingsCacheTtl">Meta Cache TTL (Minuten)</label>
                <input type="number" id="settingsCacheTtl" min="1" max="120" value="${Number(
                    s.metaCacheTtlMinutes || 15
                )}">
            </div>
            <div class="modal-row">
                <label for="settingsDefaultRange">Standard-Zeitraum Dashboard</label>
                <select id="settingsDefaultRange">
                    <option value="today" ${
                        s.defaultTimeRange === "today" ? "selected" : ""
                    }>Heute</option>
                    <option value="yesterday" ${
                        s.defaultTimeRange === "yesterday" ? "selected" : ""
                    }>Gestern</option>
                    <option value="last_7d" ${
                        s.defaultTimeRange === "last_7d" ? "selected" : ""
                    }>Letzte 7 Tage</option>
                    <option value="last_30d" ${
                        s.defaultTimeRange === "last_30d" ? "selected" : ""
                    }>Letzte 30 Tage</option>
                    <option value="this_month" ${
                        s.defaultTimeRange === "this_month" ? "selected" : ""
                    }>Aktueller Monat</option>
                    <option value="last_month" ${
                        s.defaultTimeRange === "last_month" ? "selected" : ""
                    }>Letzter Monat</option>
                </select>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Demo Modus</div>
            <div class="modal-row">
                <label for="settingsDemoMode">Demo Mode aktivieren</label>
                <select id="settingsDemoMode">
                    <option value="true" ${s.demoMode ? "selected" : ""}>Ja</option>
                    <option value="false" ${!s.demoMode ? "selected" : ""}>Nein</option>
                </select>
            </div>
        </div>

        <button id="settingsSaveButton" class="primary-btn">
            Speichern
        </button>
    `;

    openSystemModal("Einstellungen", bodyHtml);

    const themeSelect = document.getElementById("settingsTheme");
    const ttlInput = document.getElementById("settingsCacheTtl");
    const rangeSelect = document.getElementById("settingsDefaultRange");
    const demoSelect = document.getElementById("settingsDemoMode");
    const saveBtn = document.getElementById("settingsSaveButton");

    if (saveBtn) {
        saveBtn.addEventListener("click", () => {
            const settings = ensureSettings();
            settings.theme = themeSelect?.value === "dark" ? "dark" : "light";

            const ttlVal = Number(ttlInput?.value || 15);
            settings.metaCacheTtlMinutes = isNaN(ttlVal) ? 15 : Math.max(1, ttlVal);

            settings.defaultTimeRange =
                rangeSelect?.value || settings.defaultTimeRange || "last_30d";

            settings.demoMode = demoSelect?.value === "true";

            saveSettingsToStorage();
            applyThemeFromSettings();
            applyDashboardTimeRangeFromSettings();

            showToast("Einstellungen gespeichert.", "success");
            closeSystemModal();
            updateUI();
        });
    }
}

/* PROFILE MODAL */

function openProfileModal() {
    const user = AppState.meta?.user;
    const isConnected = AppState.metaConnected;

    const name = user?.name || "Unbekannt";
    const id = user?.id || "n/a";
    const email = user?.email || "nicht verfügbar";

    const bodyHtml = `
        <div class="modal-section">
            <div class="modal-section-title">Meta Profil</div>
            <div class="modal-row">
                <label>Name</label>
                <span>${name}</span>
            </div>
            <div class="modal-row">
                <label>User ID</label>
                <span>${id}</span>
            </div>
            <div class="modal-row">
                <label>E-Mail</label>
                <span>${email}</span>
            </div>
            <div class="modal-row">
                <label>Status</label>
                <span>${isConnected ? "Verbunden ✅" : "Getrennt ❌"}</span>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Verbindung</div>
            <p style="font-size:13px; color:var(--text-secondary); line-height:1.5;">
                Du kannst die Meta-Verbindung hier trennen. Beim nächsten Login wird ein neuer Token geholt.
            </p>
            <button id="disconnectMetaFromProfile" class="primary-btn">
                Meta Verbindung trennen
            </button>
        </div>
    `;

    openSystemModal("Profil", bodyHtml);

    const btn = document.getElementById("disconnectMetaFromProfile");
    if (btn) {
        btn.addEventListener("click", () => {
            disconnectMeta();
            showToast("Meta Verbindung getrennt.", "info");
            closeSystemModal();
        });
    }
}

/* NOTIFICATIONS MODAL */

function openNotificationsModal() {
    const list = AppState.notifications || [];

    let bodyHtml = "";

    if (!list.length) {
        bodyHtml = `
            <div class="modal-section">
                <div class="modal-section-title">Benachrichtigungen</div>
                <p class="notification-empty">
                    Keine neuen Benachrichtigungen.
                </p>
            </div>
        `;
    } else {
        const items = list
            .map(
                (n) => `
            <div class="notification-item">
                <div class="notification-title">${n.title || "Notification"}</div>
                <div class="notification-message">
                    ${n.message || ""}
                </div>
                <div class="notification-meta">
                    ${n.timestamp || ""}
                </div>
            </div>
        `
            )
            .join("");

        bodyHtml = `
            <div class="modal-section">
                <div class="modal-section-title">Benachrichtigungen</div>
                <div class="notification-list">
                    ${items}
                </div>
            </div>
        `;
    }

    openSystemModal("Benachrichtigungen", bodyHtml);

    const badge = document.getElementById("notificationsBadge");
    if (badge) {
        badge.classList.add("hidden");
        badge.textContent = "0";
    }
}

/* INIT */
document.addEventListener("DOMContentLoaded", async () => {
    ensureSettings();
    loadSettingsFromStorage();
    applyThemeFromSettings();

    loadMetaTokenFromStorage();
    applyDashboardTimeRangeFromSettings();

    // Packages initialisieren
    DashboardPackage.init();
    CampaignsPackage.init();
    CreativesPackage.init();

    showView(AppState.currentView);
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();

    const btn = document.getElementById("connectMetaButton");
    if (btn) btn.addEventListener("click", handleMetaConnectClick);

    const d = document.getElementById("disconnectMetaButton");
    if (d) d.addEventListener("click", disconnectMeta);

    // Zeitbereich Dashboard
    const timeRange = document.getElementById("dashboardTimeRange");
    if (timeRange) {
        timeRange.addEventListener("change", (e) => {
            const value = e.target.value || "last_30d";
            AppState.timeRangePreset = value;
            const s = ensureSettings();
            s.defaultTimeRange = value;
            saveSettingsToStorage();
            AppState.dashboardLoaded = false;
            DashboardPackage.update({
                connected: checkMetaConnection(),
                demo: isDemoMode()
            });
        });
    }

    await handleMetaOAuthRedirectIfPresent();

    const acc = document.getElementById("brandSelect");
    if (acc)
        acc.addEventListener("change", async (e) => {
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
    if (camp)
        camp.addEventListener("change", (e) => {
            AppState.selectedCampaignId = e.target.value || null;
            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            updateUI();
        });

    const settingsBtn = document.getElementById("openSettingsButton");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            openSettingsModal();
        });
    }

    const profileBtn = document.getElementById("profileButton");
    if (profileBtn) {
        profileBtn.addEventListener("click", () => {
            openProfileModal();
        });
    }

    const notificationsBtn = document.getElementById("notificationsButton");
    if (notificationsBtn) {
        notificationsBtn.addEventListener("click", () => {
            openNotificationsModal();
        });
    }

    const { overlay, closeBtn } = getModalElements();
    if (closeBtn) closeBtn.addEventListener("click", closeSystemModal);
    if (overlay) {
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeSystemModal();
        });
    }
});
