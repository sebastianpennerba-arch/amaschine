/**
 * SignalOne Elite Dashboard - app.js
 *
 * Phase A + Phase 2 (OAuth Frontend)
 *
 * 1. Globaler AppState (Meta-ready)
 * 2. OAuth-Konfiguration (Frontend-Seite)
 * 3. Meta Normalizer Layer
 * 4. UI Component Library
 * 5. Render Engine (Dashboard, Creatives, Campaigns)
 * 6. Navigation ohne Inline JS
 * 7. Meta-Connect Gatekeeper + OAuth-Flow
 * 8. Toast & Modal System
 */

/**
 * SignalOne Elite Dashboard - app.js
 *
 * Phase A + Phase 2 (OAuth Frontend)
 *
 * 1. Globaler AppState (Meta-ready)
 * 2. OAuth-Konfiguration (Frontend-Seite)
 * 3. Meta Normalizer Layer
 * 4. UI Component Library
 * 5. Render Engine (Dashboard, Creatives, Campaigns)
 * 6. Navigation ohne Inline JS
 * 7. Meta-Connect Gatekeeper + OAuth-Flow
 * 8. Toast & Modal System
 */


// ============================================
// GLOBALER APP STATE
// ============================================

const AppState = {
    currentView: "dashboardView",
    metaConnected: false,
    loading: false,
    meta: {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        ads: [],
        creatives: [],
        insights: []
    },
    selectedAccount: null,
    selectedCampaign: null,
    selectedAd: null,
    selectedCreative: null,
    filters: {
        search: "",
        status: "all",
        dateRange: "last_7_days"
    },
    timeRange: "7d"
};


// ============================================
// OAUTH KONFIGURATION (Render-Version)
// ============================================

/**
 * META_OAUTH_CONFIG:
 *  - appId: deine Facebook App ID
 *  - redirectUri: MUSS EXAKT mit:
 *      - META_OAUTH_REDIRECT_URI im Backend (Render)
 *      - gültige OAuth Redirect URI in der Meta App
 *    übereinstimmen!
 *
 *  In deinem Setup:
 *  Frontend  = https://signalone-frontend.onrender.com/
 *  Backend   = https://signalone-backend.onrender.com/
 */

META_OAUTH_CONFIG = {
    appId: "732040642590155",
    // Muss mit der in der Meta-App registrierten Redirect-URL übereinstimmen
    // Render-Frontend: signalone-frontend.onrender.com
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,business_management"
};

// TODO: HIER dein Backend-Endpoint eintragen, der code -> access_token tauscht
const META_BACKEND_CONFIG = {
    // Render-Backend: signalone-backend.onrender.com
    tokenEndpoint: "https://signalone-backend.onrender.com/api/meta/oauth/token"
};

/* ============================================
   META CONNECT GATEKEEPER
   ============================================ */

function checkMetaConnection() {
    const stripe = document.getElementById("metaConnectStripe");

    const connected = !!(AppState.metaConnected && AppState.meta.accessToken);

    if (!connected) {
        if (stripe) stripe.classList.remove("hidden");
        return false;
    } else {
        if (stripe) stripe.classList.add("hidden");
        return true;
    }
}

/**
 * Wird vom "Mit Meta Ads verbinden"-Button auf dem Stripe aufgerufen.
 */
function handleMetaConnectClick() {
    if (AppState.loading) return;

    const stripe = document.getElementById("metaConnectStripe");
    if (stripe) stripe.classList.add("connecting");

    showToast("Verbinde mit Meta Ads...", "info");
    startMetaOAuthFlow();
}

/**
 * Startet den OAuth Flow:
 * 1. State generieren & speichern
 * 2. Redirect zu Meta Dialog
 */
function startMetaOAuthFlow() {
    const state = crypto.randomUUID();
    sessionStorage.setItem("meta_oauth_state", state);

    const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
    authUrl.searchParams.set("client_id", META_OAUTH_CONFIG.appId);
    authUrl.searchParams.set("redirect_uri", META_OAUTH_CONFIG.redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", META_OAUTH_CONFIG.scopes);
    authUrl.searchParams.set("state", state);

    window.location.href = authUrl.toString();
}

async function handleMetaOAuthRedirectIfPresent() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");
    const state = params.get("state");

    if (!code && !error) return;

    const cleanupUrl = () => {
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("state");
        url.searchParams.delete("error");
        window.history.replaceState({}, "", url.toString());
    };

    if (error) {
        showToast("Meta Login abgebrochen oder fehlgeschlagen.", "error");
        cleanupUrl();
        return;
    }

    const storedState = sessionStorage.getItem("meta_oauth_state");
    if (storedState && state && storedState !== state) {
        showToast("Ungültiger OAuth State (Security Check). Bitte erneut versuchen.", "error");
        cleanupUrl();
        return;
    }
    sessionStorage.removeItem("meta_oauth_state");

    await exchangeMetaCodeForToken(code);
    cleanupUrl();
}

async function exchangeMetaCodeForToken(code) {
    try {
        if (!META_BACKEND_CONFIG.tokenEndpoint || META_BACKEND_CONFIG.tokenEndpoint.includes("your-backend-domain")) {
            openModal(
                "Backend-Endpoint fehlt",
                "Bitte trage deinen echten Backend-Endpoint in META_BACKEND_CONFIG.tokenEndpoint in app.js ein. Dieser Endpoint tauscht den OAuth-Code gegen ein Access Token."
            );
            return;
        }

        AppState.loading = true;
        showToast("Verbinde mit Meta Ads...", "info");

        const res = await fetch(META_BACKEND_CONFIG.tokenEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                redirectUri: META_OAUTH_CONFIG.redirectUri
            })
        });

        if (!res.ok) {
            throw new Error("HTTP " + res.status);
        }

        const data = await res.json();

        if (!data.accessToken) {
            throw new Error("Kein accessToken in Backend-Response gefunden.");
        }

        AppState.meta.accessToken = data.accessToken;
        AppState.meta.adAccounts = data.adAccounts || [];
        AppState.metaConnected = true;

        checkMetaConnection();
        showToast("Meta erfolgreich verbunden.", "success");

        // Aktuelle View mit neuem Status neu rendern
        handleViewRendering(AppState.currentView);

    } catch (err) {
        console.error("Meta OAuth Fehler:", err);
        AppState.metaConnected = false;
        AppState.meta.accessToken = null;
        showToast("Fehler beim Verbinden mit Meta. Bitte erneut versuchen.", "error");
    } finally {
        AppState.loading = false;
    }
}


/* ============================================
   META NORMALIZER LAYER
   ============================================ */

function toNumber(value) {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
}

function normalizeMetaCreative(metaAd, metaCreative, insights) {
    const metrics = extractMetricsFromInsights(insights);

    return {
        id: metaAd.id,
        name: metaAd.name || "Unnamed Creative",
        previewUrl: metaCreative.effective_object_story_id
            ? `https://www.facebook.com/ads/library/?id=${metaCreative.effective_object_story_id}`
            : null,
        thumbnailUrl: metaCreative.thumbnail_url || null,
        objective: metaAd.objective || "UNKNOWN",
        ctaText: metaCreative.call_to_action_type || "NO_CTA",
        spend: metrics.spend,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        cpm: metrics.cpm,
        purchases: metrics.purchases,
        roas: metrics.roas
    };
}

function extractMetricsFromInsights(insights) {
    if (!insights || !insights.data || !insights.data.length) {
        return {
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            purchases: 0,
            roas: 0
        };
    }

    const row = insights.data[0];

    const spend = toNumber(row.spend);
    const impressions = toNumber(row.impressions);
    const clicks = toNumber(row.clicks);
    const purchases = toNumber(row.purchase);
    const revenue = toNumber(row.purchase_value);

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const roas = spend > 0 ? revenue / spend : 0;

    return {
        spend,
        impressions,
        clicks,
        ctr,
        cpc,
        cpm,
        purchases,
        roas
    };
}


/* ============================================
   UI COMPONENT LIBRARY
   ============================================ */

function createMetricCard(title, value, subtitle) {
    const card = document.createElement("div");
    card.className = "metric-card";

    const titleEl = document.createElement("div");
    titleEl.className = "metric-title";
    titleEl.textContent = title;

    const valueEl = document.createElement("div");
    valueEl.className = "metric-value";
    valueEl.textContent = value;

    const subtitleEl = document.createElement("div");
    subtitleEl.className = "metric-subtitle";
    subtitleEl.textContent = subtitle;

    card.appendChild(titleEl);
    card.appendChild(valueEl);
    card.appendChild(subtitleEl);

    return card;
}

function createHeroCreativeCard(creative) {
    const card = document.createElement("div");
    card.className = "hero-creative-card";

    const topRow = document.createElement("div");
    topRow.className = "hero-creative-top";

    const nameEl = document.createElement("div");
    nameEl.className = "hero-creative-name";
    nameEl.textContent = creative.name;

    const badge = document.createElement("div");
    badge.className = "hero-creative-badge";
    badge.textContent = "TOP PERFORMER";

    topRow.appendChild(nameEl);
    topRow.appendChild(badge);

    const metricsRow = document.createElement("div");
    metricsRow.className = "hero-creative-metrics";

    const roasEl = document.createElement("div");
    roasEl.innerHTML = `<span>ROAS:</span> <strong>${creative.roas.toFixed(2)}</strong>`;

    const ctrEl = document.createElement("div");
    ctrEl.innerHTML = `<span>CTR:</span> <strong>${creative.ctr.toFixed(2)}%</strong>`;

    const cpcEl = document.createElement("div");
    cpcEl.innerHTML = `<span>CPC:</span> <strong>${creative.cpc.toFixed(2)} €</strong>`;

    metricsRow.appendChild(roasEl);
    metricsRow.appendChild(ctrEl);
    metricsRow.appendChild(cpcEl);

    card.appendChild(topRow);
    card.appendChild(metricsRow);

    return card;
}


/* ============================================
   RENDER ENGINE
   ============================================ */

function clearView(viewId) {
    const view = document.getElementById(viewId);
    if (!view) return;
    while (view.firstChild) {
        view.removeChild(view.firstChild);
    }
}

/* ============================================
   INITIALISIERUNG
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    updateDateTime();
    setInterval(updateDateTime, 1000);

    initNavigation();
    initMetaConnectUI();
    checkMetaConnection();
    handleMetaOAuthRedirectIfPresent();

    const initialActiveMenuItem = document.querySelector('.menu-item.active');
    let initialViewId = "dashboardView";

    if (initialActiveMenuItem) {
        const dataView = initialActiveMenuItem.getAttribute('data-view');
        if (dataView) initialViewId = dataView;
    }

    AppState.currentView = initialViewId;
    showView(initialViewId, initialActiveMenuItem, { skipToast: true });
});


/* ============================================
   BASIS-FUNKTIONEN
   ============================================ */

function updateDateTime() {
    const now = new Date();

    const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');

    if (dateElement) dateElement.textContent = now.toLocaleDateString('de-DE', dateOptions);
    if (timeElement) timeElement.textContent = now.toLocaleTimeString('de-DE', timeOptions);
}

function initNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');

    menuItems.forEach(item => {
        item.addEventListener('click', (event) => {
            event.preventDefault();
            const viewId = item.getAttribute('data-view');
            if (!viewId) return;

            AppState.currentView = viewId;
            showView(viewId, item);
        });
    });
}

function initMetaConnectUI() {
    const connectBtn = document.getElementById("connectMetaButton");
    if (!connectBtn) return;

    connectBtn.addEventListener("click", () => {
        startMetaOAuth();
    });
}

function showView(viewId, clickedElement, options = {}) {
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');

    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (clickedElement) clickedElement.classList.add('active');

    checkMetaConnection();
    handleViewRendering(viewId);

    if (!options.skipToast) {
        const label = viewId.replace('View', '');
        showToast(`Ansicht gewechselt: ${label}`, 'info');
    }
}


/* ============================================
   TOAST & MODAL
   ============================================ */

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${getIconForType(type)}"></i> ${message}`;

    let borderColor = 'var(--color-primary)';
    if (type === 'success') borderColor = 'var(--success)';
    if (type === 'error') borderColor = 'var(--danger)';
    if (type === 'warning') borderColor = 'var(--warning)';

    toast.style.borderLeftColor = borderColor;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateX(100%)';

        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function getIconForType(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        case 'info':
        default: return 'fa-info-circle';
    }
}

function openModal(title, body) {
    const overlay = document.getElementById('modalOverlay');
    const titleElement = document.getElementById('modalTitle');
    const bodyElement = document.getElementById('modalBody');

    if (overlay && titleElement && bodyElement) {
        titleElement.textContent = title;
        bodyElement.textContent = body;
        overlay.classList.add('active');
    }
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
}


/* ============================================
   MOCK HANDLER (bis wir echte Actions bauen)
   ============================================ */

function handleDeadButton(actionName) {
    if (actionName.includes('Detailansicht') || actionName.includes('Custom Date Range')) {
        openModal(actionName, `Diese Funktion wird später implementiert: "${actionName}".`);
    } else {
        showToast(`Aktion ausgeführt (Mock): ${actionName}`, 'info');
    }
}

function handleDropdownChange(type, value) {
    showToast(`${type} geändert auf: ${value}`, 'info');
}

function handleChartChange(value) {
    showToast(`Chart Ansicht gewechselt zu: ${value}`, 'info');
}

function handleTimeRange(range, clickedButton) {
    document.querySelectorAll('.time-range-button').forEach(btn => btn.classList.remove('active'));
    if (clickedButton) clickedButton.classList.add('active');

    AppState.timeRange = range;
    showToast(`Zeitbereich auf ${range} eingestellt.`, 'info');
}
