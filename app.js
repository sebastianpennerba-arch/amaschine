// app.js – Premium Orchestrator (Final Version, mit aktiven Dropdowns & Popup-OAuth)
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
    fetchMetaCampaigns
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
    META CONNECT
    (kein Auto-Connect mehr, nur auf Button-Klick; Login im Popup)
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

    const popup = window.open(
        url,
        "signalone_meta_login",
        "width=500,height=800"
    );

    if (!popup) {
        showToast(
            "Popup konnte nicht geöffnet werden. Bitte Popups für SignalOne erlauben.",
            "error"
        );
    }
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

    persistMetaToken(null);
    showToast("Meta getrennt", "info");
    updateUI();
}

/* -------------------------------------------------------
    OAuth Redirect
    - funktioniert weiter klassisch
    - zusätzlich: Popup-Szenario (code in Popup, Daten in Main-Window)
---------------------------------------------------------*/

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    // URL säubern
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

        // Falls wir aus einem Popup kamen: Token an das Hauptfenster schicken und Popup schließen
        if (window.opener && !window.opener.closed) {
            window.opener.postMessage(
                {
                    type: "SIGNALONE_META_CONNECTED",
                    payload: {
                        accessToken: res.accessToken
                    }
                },
                window.location.origin
            );

            // Popup kann sich danach schließen
            window.close();
            return;
        }

        // Fallback: klassischer Redirect-Flow (ohne Popup)
        AppState.meta.accessToken = res.accessToken;
        AppState.metaConnected = true;

        persistMetaToken(res.accessToken);

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
    RECEIVE TOKEN FROM POPUP (Main Window)
---------------------------------------------------------*/

async function handlePopupMessages(event) {
    // nur eigene Origin akzeptieren
    if (event.origin !== window.location.origin) return;
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "SIGNALONE_META_CONNECTED") {
        const accessToken = data.payload?.accessToken;
        if (!accessToken) return;

        AppState.meta.accessToken = accessToken;
        AppState.metaConnected = true;
        persistMetaToken(accessToken);

        try {
            await fetchMetaUser();
            await loadAdAccountsAndCampaigns();
            updateUI();
            showToast("Erfolgreich mit Meta verbunden!", "success");
        } catch (err) {
            console.error(err);
            showToast("Verbindungsfehler nach OAuth", "error");
        }
    }
}

/* -------------------------------------------------------
    ACCOUNT & CAMPAIGNS (LIVE DROPDOWNS)
---------------------------------------------------------*/

async function loadAdAccountsAndCampaigns() {
    const accRes = await fetchMetaAdAccounts();
    if (accRes?.success) {
        AppState.meta.adAccounts = accRes.data?.data || [];
    }

    if (AppState.meta.adAccounts.length > 0 && !AppState.selectedAccountId) {
        AppState.selectedAccountId = AppState.meta.adAccounts[0].id;
    }

    if (AppState.selectedAccountId) {
        const campRes = await fetchMetaCampaigns(AppState.selectedAccountId);
        if (campRes?.success) {
            AppState.meta.campaigns = campRes.data?.data || [];
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
        updateCreativeLibraryView(connected);
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

    // Health-Ampeln (System + Kampagne) aktualisieren
    updateHealthStatus();
}

/* -------------------------------------------------------
    INIT
---------------------------------------------------------*/

document.addEventListener("DOMContentLoaded", async () => {
    // KEIN Auto-Connect mehr via LocalStorage – dauerhafte Verbindung wird vermieden
    // Token kann zwar gespeichert werden, wird aber nur via Popup-Flow aktiv benutzt

    showView(AppState.currentView);
    initSidebarNavigation(showView);
    initSettings();
    initDateTime();
    updateGreeting();

    window.addEventListener("message", handlePopupMessages);

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

    // Wenn diese Instanz im Popup läuft und einen ?code hat, wird nur der Popup-Flow benutzt
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
        -> beeinflussen Dashboard, Library, Campaigns, Sensei
    ----------------------------------------------------*/

    const accountSelect = document.getElementById("brandSelect");
    if (accountSelect) {
        accountSelect.addEventListener("change", async (e) => {
            const newAccountId = e.target.value || null;
            AppState.selectedAccountId = newAccountId;
            AppState.selectedCampaignId = null;

            // Caches & Daten zurücksetzen, damit alles frisch geladen wird
            AppState.dashboardLoaded = false;
            AppState.campaignsLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;
            AppState.meta.insightsByCampaign = {};
            AppState.meta.campaigns = [];
            AppState.meta.creatives = [];
            AppState.meta.ads = [];

            if (newAccountId) {
                const campRes = await fetchMetaCampaigns(newAccountId);
                if (campRes?.success) {
                    AppState.meta.campaigns = campRes.data?.data || [];
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

            // Views neu berechnen, da sich Fokus geändert hat
            AppState.dashboardLoaded = false;
            AppState.creativesLoaded = false;
            AppState.dashboardMetrics = null;

            updateUI();
        });
    }
});
