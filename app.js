// app.js – Orchestrator mit Meta-Caching, Creative-Loader,
// Dashboard-CleanState, Settings & Notifications
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
    Hilfsfunktionen: Settings & Notifications
---------------------------------------------------------*/

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
    const settings = ensureSettings();
    return !!settings.demoMode;
}

function ensureNotifications() {
    if (!Array.isArray(AppState.notifications)) {
        AppState.notifications = [];
    }
    return AppState.notifications;
}

function saveSettingsToStorage() {
    try {
        const settings = ensureSettings();
        localStorage.setItem(
            "signalone_settings_v1",
            JSON.stringify(settings)
        );
    } catch (e) {
        console.warn("Settings speichern fehlgeschlagen:", e);
    }
}

function loadSettingsFromStorage() {
    ensureSettings();
    try {
        const raw = localStorage.getItem("signalone_settings_v1");
        if (!raw) return;
        const parsed = JSON.parse(raw);
        AppState.settings = {
            ...AppState.settings,
            ...parsed
        };
    } catch (e) {
        console.warn("Settings laden fehlgeschlagen:", e);
    }
}

function applyThemeFromSettings() {
    const settings = ensureSettings();
    const root = document.documentElement;
    root.dataset.theme = settings.theme === "dark" ? "dark" : "light";
}

function applyDashboardTimeRangeFromSettings() {
    const settings = ensureSettings();
    const timeRange = settings.defaultTimeRange || "last_30d";
    const select = document.getElementById("dashboardTimeRange");
    if (select) {
        select.value = timeRange;
    }
    AppState.timeRangePreset = timeRange;
}

function updateNotificationsBadge() {
    const badge = document.getElementById("notificationsBadge");
    const list = ensureNotifications();
    if (!badge) return;
    const count = list.length;
    if (count <= 0) {
        badge.classList.add("hidden");
        badge.textContent = "0";
    } else {
        badge.classList.remove("hidden");
        badge.textContent = String(count > 99 ? "99+" : count);
    }
}

function addNotification(type, title, message) {
    const list = ensureNotifications();
    const entry = {
        id: Date.now(),
        type: type || "info",
        title: title || "",
        message: message || "",
        timestamp: new Date().toISOString()
    };
    list.unshift(entry);
    // Max 50 Einträge halten
    if (list.length > 50) {
        list.length = 50;
    }
    updateNotificationsBadge();
}

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
    META CONNECT – Popup OAuth
---------------------------------------------------------*/

function handleMetaConnectClick() {
    if (!META_OAUTH_CONFIG?.appId || !META_OAUTH_CONFIG?.redirectUri) {
        showToast("Meta-Konfiguration fehlt.", "error");
        addNotification(
            "error",
            "Meta-Konfiguration",
            "Meta-Konfiguration fehlt. Bitte Backend prüfen."
        );
        return;
    }

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
        showToast("Popup blockiert – bitte Popups erlauben!", "error");
        addNotification(
            "error",
            "Popup blockiert",
            "Bitte Popups für diese Seite erlauben, um Meta zu verbinden."
        );
        return;
    }

    showToast("Meta Login geöffnet…", "info");
    addNotification(
        "info",
        "Meta Login",
        "Meta Login Popup wurde geöffnet."
    );
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
    addNotification(
        "info",
        "Meta getrennt",
        "Die Verbindung zu Meta wurde getrennt."
    );
    updateUI();
}

/* -------------------------------------------------------
    OAuth Redirect – holt Access Token über Backend
---------------------------------------------------------*/

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    // Query-Parameter aus URL entfernen
    window.history.replaceState({}, "", "/");
    showToast("Token wird abgeholt…", "info");

    try {
        // metaApi.js liefert den Access Token direkt (String)
        const accessToken = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );

        if (!accessToken) {
            showToast("Meta-Verbindung fehlgeschlagen", "error");
            addNotification(
                "error",
                "Meta OAuth",
                "Meta-Verbindung fehlgeschlagen – kein Token erhalten."
            );
            return;
        }

        AppState.meta.accessToken = accessToken;
        AppState.metaConnected = true;

        persistMetaToken(accessToken);
        clearMetaCache();

        // User + Accounts mit Token laden
        try {
            const user = await fetchMetaUser(accessToken);
            AppState.meta.user = user || {};
        } catch (e) {
            console.warn("Meta-User konnte nicht geladen werden:", e);
        }

        await loadAdAccountsAndCampaigns();

        updateUI();
        showToast("Erfolgreich mit Meta verbunden!", "success");
        addNotification(
            "success",
            "Meta verbunden",
            "SignalOne ist erfolgreich mit Meta verbunden."
        );
    } catch (err) {
        console.error("OAuth Redirect Error:", err);
        showToast("Verbindungsfehler bei Meta OAuth", "error");
        addNotification(
            "error",
            "Verbindungsfehler",
            "Beim Verbinden mit Meta ist ein Fehler aufgetreten."
        );
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
        addNotification(
            "info",
            "Meta-Token geladen",
            "Token wurde aus dem lokalen Speicher geladen."
        );
        clearMetaCache();

        fetchMetaUser(stored)
            .then((user) => {
                AppState.meta.user = user || {};
                return loadAdAccountsAndCampaigns();
            })
            .then(() => {
                updateUI();
            })
            .catch((err) => {
                console.error("Auto-Reconnect Fehler:", err);
                showToast(
                    "Fehler beim Wiederherstellen der Meta-Verbindung",
                    "error"
                );
                addNotification(
                    "error",
                    "Wiederherstellung fehlgeschlagen",
                    "Meta-Verbindung konnte nicht wiederhergestellt werden."
                );
                AppState.metaConnected = false;
                AppState.meta.accessToken = null;
            });
    } catch (e) {
        console.warn("LocalStorage read failed:", e);
    }
}

/* -------------------------------------------------------
    ACCOUNT & CAMPAIGNS (mit Cache, Token-abhängig)
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    ensureMetaCache();

    const token = AppState.meta.accessToken;
    if (!token) {
        AppState.meta.adAccounts = [];
        AppState.meta.campaigns = [];
        return;
    }

    // 1) AdAccounts – erst Cache prüfen
    if (isCacheValid(AppState.metaCache.adAccounts)) {
        AppState.meta.adAccounts = AppState.metaCache.adAccounts.data;
    } else {
        const data = await fetchMetaAdAccounts(token);
        AppState.meta.adAccounts = Array.isArray(data) ? data : [];
        AppState.metaCache.adAccounts = {
            data: AppState.meta.adAccounts,
            fetchedAt: Date.now()
        };
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
            const data = await fetchMetaCampaigns(accId, token);
            const arr = Array.isArray(data) ? data : [];
            AppState.meta.campaigns = arr;
            AppState.metaCache.campaignsByAccount[accId] = {
                data: arr,
                fetchedAt: Date.now()
            };
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

    const token = AppState.meta.accessToken;
    if (!AppState.selectedAccountId || !token) {
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
        const data = await fetchMetaAds(accId, token);
        const arr = Array.isArray(data) ? data : [];
        AppState.meta.ads = arr;
        AppState.creativesLoaded = true;

        AppState.metaCache.adsByAccount[accId] = {
            data: arr,
            fetchedAt: Date.now()
        };
    } catch (err) {
        console.error(err);
        AppState.meta.ads = [];
        AppState.creativesLoaded = false;
        AppState.metaCache.adsByAccount[accId] = {
            data: [],
            fetchedAt: Date.now()
        };
        showToast("Fehler beim Laden der Creatives.", "error");
        addNotification(
            "error",
            "Creatives Fehler",
            "Fehler beim Laden der Creatives."
        );
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

function applyDashboardNoDataState() {
    const kpiContainer = document.getElementById("dashboardKpiContainer");
    const chartContainer = document.getElementById("dashboardChartContainer");
    const heroContainer = document.getElementById(
        "dashboardHeroCreativesContainer"
    );

    if (kpiContainer) {
        kpiContainer.innerHTML =
            "<p style='color:var(--text-secondary);font-size:13px;'>Verbinde Meta, um Performance-KPIs zu sehen.</p>";
    }
    if (chartContainer) {
        chartContainer.innerHTML =
            "<div class='chart-placeholder'>Keine Daten – Meta nicht verbunden.</div>";
    }
    if (heroContainer) {
        heroContainer.innerHTML = "";
    }
}

function applyDemoDashboardState() {
    const summary = document.getElementById("dashboardMetaSummary");
    const kpiContainer = document.getElementById("dashboardKpiContainer");
    const chartContainer = document.getElementById("dashboardChartContainer");
    const heroContainer = document.getElementById(
        "dashboardHeroCreativesContainer"
    );

    if (summary) {
        summary.textContent =
            "Demo-Modus aktiv – es werden Beispiel-KPIs angezeigt (keine echten Meta-Daten).";
    }

    if (kpiContainer) {
        kpiContainer.innerHTML = `
            <div class="kpi-grid">
                <div class="kpi-card success">
                    <div class="kpi-label"><i class="fas fa-euro-sign"></i> Spend (30d)</div>
                    <div class="kpi-value">12.340 €</div>
                    <div class="kpi-trend trend-positive">+18% vs. Vormonat</div>
                </div>
                <div class="kpi-card success">
                    <div class="kpi-label"><i class="fas fa-bullseye"></i> ROAS</div>
                    <div class="kpi-value">3,8x</div>
                    <div class="kpi-trend trend-positive">Top 10% deiner Branche</div>
                </div>
                <div class="kpi-card warning">
                    <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR</div>
                    <div class="kpi-value">1,4%</div>
                    <div class="kpi-trend trend-neutral">stabil</div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-label"><i class="fas fa-shopping-cart"></i> Conversions</div>
                    <div class="kpi-value">926</div>
                    <div class="kpi-trend trend-positive">+9% vs. letzte 30 Tage</div>
                </div>
            </div>
        `;
    }

    if (chartContainer) {
        chartContainer.innerHTML =
            "<div class='chart-placeholder'>Demo-Chart – hier siehst du in der Live-Version die Performance-Kurve deiner Kampagnen.</div>";
    }

    if (heroContainer) {
        heroContainer.innerHTML = `
            <div class="hero-grid">
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div class="creative-faux-thumb">1</div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">Top Funnel – Prospecting Europe</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS: <span class="kpi-value-mini">4,2x</span></span>
                            <span>Spend: <span class="kpi-value-mini">4.800 €</span></span>
                        </div>
                    </div>
                </div>
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div class="creative-faux-thumb">2</div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">Mid Funnel – ATC Retargeting</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS: <span class="kpi-value-mini">3,1x</span></span>
                            <span>Spend: <span class="kpi-value-mini">2.100 €</span></span>
                        </div>
                    </div>
                </div>
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div class="creative-faux-thumb">3</div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">Bottom Funnel – DPA Remarketing</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS: <span class="kpi-value-mini">5,6x</span></span>
                            <span>Spend: <span class="kpi-value-mini">1.450 €</span></span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

function updateUI() {
    const connected = checkMetaConnection();
    const demo = isDemoMode();

    updateGreeting();
    updateAccountAndCampaignSelectors();

    if (AppState.currentView === "dashboardView") {
        if (connected) {
            updateDashboardView(true);
        } else if (demo) {
            applyDemoDashboardState();
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
    updateNotificationsBadge();
}

/* -------------------------------------------------------
    SETTINGS UI
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
                            <option value="EUR" ${settings.currency === "EUR" ? "selected" : ""}>EUR (€)</option>
                            <option value="USD" ${settings.currency === "USD" ? "selected" : ""}>USD ($)</option>
                        </select>
                    </div>
                </div>
                <div class="settings-row">
                    <label for="settingsDefaultRange">Standard-Zeitraum Dashboard</label>
                    <div class="settings-control">
                        <select id="settingsDefaultRange">
                            <option value="today" ${settings.defaultTimeRange === "today" ? "selected" : ""}>Heute</option>
                            <option value="yesterday" ${settings.defaultTimeRange === "yesterday" ? "selected" : ""}>Gestern</option>
                            <option value="today_yesterday" ${settings.defaultTimeRange === "today_yesterday" ? "selected" : ""}>Heute + Gestern</option>
                            <option value="last_7d" ${settings.defaultTimeRange === "last_7d" ? "selected" : ""}>Letzte 7 Tage</option>
                            <option value="last_30d" ${settings.defaultTimeRange === "last_30d" ? "selected" : ""}>Letzte 30 Tage</option>
                            <option value="this_month" ${settings.defaultTimeRange === "this_month" ? "selected" : ""}>Aktueller Monat</option>
                            <option value="last_month" ${settings.defaultTimeRange === "last_month" ? "selected" : ""}>Letzter Monat</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Darstellung</div>
                <div class="settings-row">
                    <label>Theme</label>
                    <div class="settings-control">
                        <div class="settings-radio-group">
                            <label>
                                <input type="radio" name="theme" value="light" ${settings.theme !== "dark" ? "checked" : ""} />
                                Light
                            </label>
                            <label>
                                <input type="radio" name="theme" value="dark" ${settings.theme === "dark" ? "checked" : ""} />
                                Dark
                            </label>
                        </div>
                    </div>
                </div>
                <div class="settings-group">
                    <div class="settings-group-title">🎮 Demo & Testing</div>
                    <div class="settings-row">
                        <label>Demo-Modus</label>
                        <div class="settings-control">
                            <div class="settings-radio-group">
                                <label>
                                    <input type="radio" name="demoMode" value="true" ${settings.demoMode ? "checked" : ""} />
                                    Ein (zeige Demo-Daten & alle Features)
                                </label>
                                <label>
                                    <input type="radio" name="demoMode" value="false" ${!settings.demoMode ? "checked" : ""} />
                                    Aus (nur echte Meta-Daten)
                                </label>
                            </div>
                        </div>
                    </div>
                    <p style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
                        Im Demo-Modus siehst du alle Features mit realistischen Beispieldaten – perfekt für Präsentationen!
                    </p>
                </div>                
                <div class="settings-row">
                    <label for="settingsCreativeLayout">Creative Layout</label>
                    <div class="settings-control">
                        <select id="settingsCreativeLayout">
                            <option value="grid" ${settings.creativeLayout === "grid" ? "selected" : ""}>Grid</option>
                            <option value="list" ${settings.creativeLayout === "list" ? "selected" : ""}>Liste</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="settings-group">
                <div class="settings-group-title">Meta / Cache</div>
                <div class="settings-row">
                    <label for="settingsCacheTtl">Cache-Dauer für Meta-Daten (Minuten)</label>
                    <div class="settings-control">
                        <input
                            type="number"
                            id="settingsCacheTtl"
                            min="5"
                            max="120"
                            step="5"
                            value="${settings.metaCacheTtlMinutes || 15}"
                        />
                    </div>
                </div>
                <p style="font-size:11px;color:var(--text-secondary);margin-top:4px;">
                    Je höher die Dauer, desto weniger API-Calls – aber Daten sind weniger „frisch“.
                </p>
            </div>

            <button type="submit" class="primary-btn" id="settingsSaveButton">Speichern</button>
        </form>
    `;

    openModal("Settings", html);

    const form = document.getElementById("settingsForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const currencyEl = document.getElementById("settingsCurrency");
            const rangeEl = document.getElementById("settingsDefaultRange");
            const layoutEl = document.getElementById("settingsCreativeLayout");
            const cacheEl = document.getElementById("settingsCacheTtl");
            const themeRadio = form.querySelector(
                'input[name="theme"]:checked'
            );

            const currency = currencyEl?.value || "EUR";
            const defaultRange = rangeEl?.value || "last_30d";
            const creativeLayout = layoutEl?.value || "grid";
            const cacheMinutes = parseInt(cacheEl?.value || "15", 10);
            const theme = themeRadio?.value === "dark" ? "dark" : "light";

            const settings = ensureSettings();
            const demoModeRadio = form.querySelector(
                'input[name="demoMode"]:checked'
            );
            const demoMode = demoModeRadio?.value === "true";
            settings.demoMode = demoMode;
            settings.currency = currency;
            settings.defaultTimeRange = defaultRange;
            settings.creativeLayout = creativeLayout;
            settings.metaCacheTtlMinutes = isNaN(cacheMinutes)
                ? 15
                : Math.min(Math.max(cacheMinutes, 5), 120);
            settings.theme = theme;

            saveSettingsToStorage();
            applyThemeFromSettings();
            applyDashboardTimeRangeFromSettings();

            showToast("Settings gespeichert.", "success");
            addNotification(
                "success",
                "Settings gespeichert",
                "Deine Einstellungen wurden aktualisiert."
            );

            updateUI();
        });
    }
}

/* -------------------------------------------------------
    NOTIFICATION UI
---------------------------------------------------------*/

function openNotificationsModal() {
    const list = ensureNotifications();
    if (!list.length) {
        openModal(
            "Benachrichtigungen",
            "<p style='font-size:13px;color:var(--text-secondary);'>Keine Benachrichtigungen.</p>"
        );
        return;
    }

    const itemsHtml = list
        .map((n) => {
            const d = new Date(n.timestamp);
            const ts = isNaN(d.getTime())
                ? ""
                : d.toLocaleString("de-DE", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                  });
            let badgeClass = "badge-green";
            if (n.type === "error") badgeClass = "badge-red";
            else if (n.type === "warning") badgeClass = "badge-yellow";

            return `
                <div style="border-bottom:1px solid var(--border);padding:8px 0;">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <span style="font-size:13px;font-weight:600;">${n.title ||
                            "System"}</span>
                        <span class="badge ${badgeClass}">${n.type.toUpperCase()}</span>
                    </div>
                    <p style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                        ${n.message || ""}
                    </p>
                    <p style="font-size:11px;color:var(--text-secondary);margin-top:2px;">
                        ${ts}
                    </p>
                </div>
            `;
        })
        .join("");

    const html = `
        <div style="max-height:360px;overflow-y:auto;font-size:13px;">
            ${itemsHtml}
        </div>
    `;

    openModal("Benachrichtigungen", html);
}

/* -------------------------------------------------------
    INIT
---------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
    ensureSettings();
    ensureNotifications();
    loadSettingsFromStorage();
    applyThemeFromSettings();

    loadMetaTokenFromStorage();

    // Dashboard Default Range setzen
    applyDashboardTimeRangeFromSettings();

    showView(AppState.currentView);
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();
    updateNotificationsBadge();

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
            const user = AppState.meta?.user || {};
            const name = user.name || "SignalOne User";
            const id = user.id || "n/a";

            const html = `
                <div style="display:flex; flex-direction:column; gap:12px; font-size:13px;">
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:38px;height:38px;border-radius:999px;background:linear-gradient(135deg,#6366F1,#4F46E5);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;">
                            ${name
                                .split(" ")
                                .map((p) => p[0])
                                .join("")
                                .slice(0, 2)
                                .toUpperCase()}
                        </div>
                        <div>
                            <div style="font-weight:700;">${name}</div>
                            <div style="font-size:12px;color:var(--text-secondary);">Meta ID: ${id}</div>
                        </div>
                    </div>
                    <div style="font-size:12px;color:var(--text-secondary);">
                        <p>In der finalen Version werden hier deine Team- und Account-Daten aus der SignalOne-Datenbank angezeigt.</p>
                        <ul style="margin-left:18px;margin-top:6px;">
                            <li>Verknüpfte Werbekonten & Rollen</li>
                            <li>Benachrichtigungs-Einstellungen & E-Mail-Reports</li>
                            <li>Fehler- & Aktivitätslog für dieses Profil</li>
                        </ul>
                    </div>
                    <p style="font-size:11px;color:var(--text-secondary);margin-top:6px;">
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
            openNotificationsModal();
        });
    }

    const settingsBtn = document.getElementById("openSettingsButton");
    if (settingsBtn) {
        settingsBtn.addEventListener("click", () => {
            openSettingsModal();
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
            const settings = ensureSettings();
            settings.defaultTimeRange = e.target.value;
            saveSettingsToStorage();
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

            ensureMetaCache();
            if (newAccountId && AppState.meta.accessToken) {
                const token = AppState.meta.accessToken;
                delete AppState.metaCache.campaignsByAccount[newAccountId];
                delete AppState.metaCache.adsByAccount[newAccountId];

                const data = await fetchMetaCampaigns(newAccountId, token);
                const arr = Array.isArray(data) ? data : [];
                AppState.meta.campaigns = arr;
                AppState.metaCache.campaignsByAccount[newAccountId] = {
                    data: arr,
                    fetchedAt: Date.now()
                };
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
