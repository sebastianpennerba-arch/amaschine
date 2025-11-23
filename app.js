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


/* ============================================
   GLOBALER APP STATE
   ============================================ */

const AppState = {
    metaConnected: false,
    user: null,

    currentView: "dashboardView",
    timeRange: "last_7d",
    brand: null,
    campaignGroup: null,

    meta: {
        accessToken: null,
        adAccounts: [],
        selectedAdAccount: null,

        campaigns: [],
        adsets: [],
        ads: [],
        creatives: [],
        insights: {},
    },

    loading: false,
    error: null,
};


/* ============================================
   META OAUTH CONFIG (ANPASSEN!)
   ============================================ */

// TODO: HIER deine echte Meta App-ID eintragen
const META_OAUTH_CONFIG = {
    appId: "732040642590155",
    // Muss mit der in der Meta-App registrierten Redirect-URL übereinstimmen
    redirectUri: window.location.origin + window.location.pathname,
    scopes: "ads_read,business_management"
};

// TODO: HIER dein Backend-Endpoint eintragen, der code -> access_token tauscht
const META_BACKEND_CONFIG = {
    tokenEndpoint: "https://amaschine.vercel.app/meta/oauth/token"
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

function requireMetaConnection() {
    if (!checkMetaConnection()) {
        showToast("Bitte verbinde Meta Ads, bevor Live-Daten geladen werden.", "warning");
        return false;
    }
    return true;
}


/* ============================================
   META OAUTH FLOW (Frontend)
   ============================================ */

function generateOAuthState() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Math.random().toString(36).slice(2);
}

function startMetaOAuth() {
    if (!META_OAUTH_CONFIG.appId || META_OAUTH_CONFIG.appId === "YOUR_META_APP_ID") {
        openModal(
            "Meta OAuth nicht konfiguriert",
            "Bitte trage deine echte Meta App-ID in META_OAUTH_CONFIG.appId in app.js ein."
        );
        return;
    }

    const state = generateOAuthState();
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
                "Bitte trage deinen echten Backend-Endpoint in META_BACKEND_CONFIG.tokenEndpoint ein. Dieser Endpoint tauscht den OAuth-Code gegen ein Access Token."
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
        type: detectCreativeType(metaCreative),
        url: extractCreativeUrl(metaCreative),
        thumbnail: metaCreative.thumbnail_url || extractThumbnailFromStory(metaCreative),
        platform: "meta",
        metrics: {
            spend: metrics.spend,
            purchases: metrics.purchases,
            roas: metrics.roas,
            ctr: metrics.ctr,
            cpm: metrics.cpm,
            score: null,
        }
    };
}

function normalizeMetaCampaign(metaCampaign, insights) {
    const metrics = extractMetricsFromInsights(insights);

    return {
        id: metaCampaign.id,
        name: metaCampaign.name || "Unnamed Campaign",
        status: metaCampaign.status || "UNKNOWN",
        statusColor: deriveStatusColorFromMetaStatus(metaCampaign.status),
        goal: metaCampaign.objective || "n/a",
        dailyBudget: toNumber(metaCampaign.daily_budget) / 100,
        spend30d: metrics.spend,
        roas30d: metrics.roas,
        ctr: metrics.ctr,
    };
}

function aggregateInsightsForDashboard(insightsList) {
    if (!Array.isArray(insightsList) || insightsList.length === 0) {
        return {
            roas: null,
            roasTrend: null,
            cpp: null,
            cppTrend: null,
            ctr: null,
            ctrTrend: null,
            spendToday: null,
            spendTodayTrend: null,
        };
    }

    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalPurchases = 0;
    let totalRevenue = 0;

    insightsList.forEach(insights => {
        const m = extractMetricsFromInsights(insights);
        totalSpend += m.spend;
        totalImpressions += m.impressions;
        totalClicks += m.clicks;
        totalPurchases += m.purchases;
        totalRevenue += m.revenue;
    });

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : null;
    const cpp = totalPurchases > 0 ? totalSpend / totalPurchases : null;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : null;

    return {
        roas,
        roasTrend: null,
        cpp,
        cppTrend: null,
        ctr,
        ctrTrend: null,
        spendToday: null,
        spendTodayTrend: null,
    };
}

function extractMetricsFromInsights(insights) {
    if (!insights) {
        return {
            spend: 0,
            impressions: 0,
            clicks: 0,
            ctr: null,
            purchases: 0,
            revenue: 0,
            roas: null,
            cpm: 0,
        };
    }

    const spend = toNumber(insights.spend);
    const impressions = toNumber(insights.impressions);
    const clicks = toNumber(insights.clicks);

    let purchases = 0;
    let revenue = 0;

    if (Array.isArray(insights.actions)) {
        const purchaseAction = insights.actions.find(a => a.action_type === "purchase");
        if (purchaseAction) purchases = toNumber(purchaseAction.value);
    }

    if (Array.isArray(insights.action_values)) {
        const purchaseValue = insights.action_values.find(a => a.action_type === "purchase");
        if (purchaseValue) revenue = toNumber(purchaseValue.value);
    }

    let roas = null;
    if (Array.isArray(insights.purchase_roas) && insights.purchase_roas.length > 0) {
        roas = toNumber(insights.purchase_roas[0].value);
    } else if (spend > 0 && revenue > 0) {
        roas = revenue / spend;
    }

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : null;
    const cpm = toNumber(insights.cpm);

    return {
        spend,
        impressions,
        clicks,
        ctr,
        purchases,
        revenue,
        roas,
        cpm,
    };
}

function deriveStatusColorFromMetaStatus(status) {
    if (!status) return "yellow";
    const s = status.toUpperCase();

    if (s === "ACTIVE") return "green";
    if (s === "PAUSED") return "yellow";
    if (["DELETED", "ARCHIVED", "DISAPPROVED"].includes(s)) return "red";
    return "yellow";
}

function detectCreativeType(metaCreative) {
    if (!metaCreative) return "unknown";
    if (metaCreative.object_story_spec && metaCreative.object_story_spec.video_data) {
        return "video";
    }
    if (
        metaCreative.object_story_spec &&
        metaCreative.object_story_spec.link_data &&
        Array.isArray(metaCreative.object_story_spec.link_data.child_attachments) &&
        metaCreative.object_story_spec.link_data.child_attachments.length > 1
    ) {
        return "carousel";
    }
    return "static";
}

function extractCreativeUrl(metaCreative) {
    if (!metaCreative) return null;
    return metaCreative.video_url || metaCreative.image_url || null;
}

function extractThumbnailFromStory(metaCreative) {
    if (!metaCreative || !metaCreative.object_story_spec) return null;
    const spec = metaCreative.object_story_spec;

    if (spec.video_data && spec.video_data.thumbnail_url) return spec.video_data.thumbnail_url;
    if (spec.link_data && spec.link_data.picture) return spec.link_data.picture;
    return null;
}


/* ============================================
   UI COMPONENT LIBRARY
   ============================================ */

function formatCurrency(value) {
    if (!value || isNaN(value)) return "€ 0";
    return "€ " + Number(value).toLocaleString("de-DE", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

function formatROAS(value) {
    if (!value || isNaN(value)) return "-";
    return Number(value).toFixed(2) + "x";
}

function formatPercentage(value) {
    if (!value || isNaN(value)) return "-";
    return Number(value).toFixed(2) + "%";
}

function getTrendClass(value) {
    if (value == null || isNaN(value)) return "trend-neutral";
    if (value > 0) return "trend-positive";
    if (value < 0) return "trend-negative";
    return "trend-neutral";
}

function createKpiCard({ label, value, trendValue }) {
    const trendClass = getTrendClass(trendValue);

    const card = document.createElement("div");
    card.className = "kpi-card";

    card.innerHTML = `
        <span class="kpi-label">${label}</span>
        <span class="kpi-value">${value}</span>
        <span class="kpi-trend ${trendClass}">
            ${trendValue != null ? (trendValue > 0 ? "▲ " : "▼ ") + trendValue + "%" : ""}
        </span>
    `;

    return card;
}

function createMediaPreview(creative) {
    const container = document.createElement("div");
    container.className = "creative-media-container-library";

    let element;
    const isVideo = creative.url && creative.url.endsWith(".mp4");

    if (isVideo) {
        element = document.createElement("video");
        element.src = creative.url;
        element.poster = creative.thumbnail;
        element.muted = true;
    } else {
        element = document.createElement("img");
        element.src = creative.thumbnail;
        element.alt = creative.name;
    }

    element.className = "creative-video-mock";
    container.appendChild(element);

    const badge = document.createElement("i");
    badge.className = "platform-badge fab fa-meta";
    container.appendChild(badge);

    return container;
}

function createCreativeCard(creative) {
    const card = document.createElement("div");
    card.className = "card creative-library-item";

    const media = createMediaPreview(creative);

    const stats = document.createElement("div");
    stats.className = "creative-stats";

    stats.innerHTML = `
        <h4 class="creative-name-library">${creative.name}</h4>
        <p class="creative-meta">
            Typ: ${creative.type} |
            ROAS: <strong class="${getTrendClass(creative.metrics.roas)}">
                ${formatROAS(creative.metrics.roas)}
            </strong>
        </p>

        <div class="kpi-bar-visual">
            <span class="kpi-label-small">Verkäufe:</span>
            <div class="kpi-slider-track">
                <div class="kpi-slider-fill fill-positive" style="width:${creative.metrics.purchases}%"></div>
            </div>
            <span class="kpi-value-small">${creative.metrics.purchases}</span>
        </div>

        <div class="kpi-bar-visual">
            <span class="kpi-label-small">Spend:</span>
            <div class="kpi-slider-track">
                <div class="kpi-slider-fill fill-spend" style="width:${creative.metrics.spend / 100}%"></div>
            </div>
            <span class="kpi-value-small">${formatCurrency(creative.metrics.spend)}</span>
        </div>

        <div class="creative-footer-kpis">
            <span class="kpi-footer-item">CTR: ${formatPercentage(creative.metrics.ctr)}</span>
            <span class="kpi-footer-item">CPM: ${formatCurrency(creative.metrics.cpm)}</span>
            <span class="kpi-footer-item">Score: ${creative.metrics.score ?? "-"}</span>
        </div>
    `;

    card.appendChild(media);
    card.appendChild(stats);

    return card;
}

function createCampaignRow(campaign) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
        <td><span class="status-indicator status-${campaign.statusColor}"></span> ${campaign.status}</td>
        <td>${campaign.name}</td>
        <td>${campaign.goal}</td>
        <td>${formatCurrency(campaign.dailyBudget)}</td>
        <td>${formatCurrency(campaign.spend30d)}</td>
        <td>${formatROAS(campaign.roas30d)}</td>
        <td>${formatPercentage(campaign.ctr)}</td>
        <td><button class="action-button">Details</button></td>
    `;

    return tr;
}


/* ============================================
   RENDER ENGINE
   ============================================ */

function renderDashboard() {
    renderDashboardKPIs();
    renderDashboardChart();
    renderHeroCreatives();
}

function renderDashboardKPIs() {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    container.innerHTML = "";

    const kpis = [
        {
            label: "RETURN ON AD SPEND (ROAS)",
            value: formatROAS(AppState.meta.insights?.roas),
            trendValue: AppState.meta.insights?.roasTrend
        },
        {
            label: "COST PER PURCHASE (CPP)",
            value: formatCurrency(AppState.meta.insights?.cpp),
            trendValue: AppState.meta.insights?.cppTrend
        },
        {
            label: "CREATIVE CTR (GESAMT)",
            value: formatPercentage(AppState.meta.insights?.ctr),
            trendValue: AppState.meta.insights?.ctrTrend
        },
        {
            label: "AD SPEND (HEUTE)",
            value: formatCurrency(AppState.meta.insights?.spendToday),
            trendValue: AppState.meta.insights?.spendTodayTrend
        }
    ];

    const grid = document.createElement("div");
    grid.className = "kpi-grid";

    kpis.forEach(kpi => grid.appendChild(createKpiCard(kpi)));

    container.appendChild(grid);
}

function renderDashboardChart() {
    const container = document.getElementById("dashboardChartContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <h3 class="elite-title" style="font-size: 20px;">Performance Trend</h3>
                <div class="controls">
                    <div class="select-container small-select">
                        <select id="chartMetricSelect">
                            <option>ROAS</option>
                            <option>Spend</option>
                        </select>
                    </div>
                    <div class="date-toggles time-range-group">
                        <button class="date-btn time-range-button">Heute</button>
                        <button class="date-btn time-range-button active">Letzte 7 Tage</button>
                        <button class="date-btn time-range-button">Letzte 30 Tage</button>
                        <button class="date-btn time-range-button">Custom</button>
                    </div>
                </div>
            </div>
            <div class="chart-placeholder">[ ELITE CHART – Live Meta Daten folgen ]</div>
        </div>
    `;
}

function renderHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");
    if (!container) return;

    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.className = "card hero-creatives-card";

    wrapper.innerHTML = `
        <h3 class="elite-title" style="font-size: 24px; margin-bottom: 5px;">Hero Creatives (Top Performer)</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Live-Daten werden nach Meta-Integration geladen.
        </p>
        <div class="hero-grid" id="heroCreativesGrid"></div>
    `;

    container.appendChild(wrapper);
}

function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const creatives = AppState.meta.creatives;

    if (!creatives || creatives.length === 0) {
        const empty = document.createElement("p");
        empty.style.color = "var(--text-secondary)";
        empty.style.padding = "10px";
        empty.innerText = "Noch keine Creatives geladen. Bitte Meta verbinden.";
        grid.appendChild(empty);
        return;
    }

    creatives.forEach(creative => grid.appendChild(createCreativeCard(creative)));
}

function renderCampaigns() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const campaigns = AppState.meta.campaigns;

    if (!campaigns || campaigns.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="8" style="text-align:center; padding:20px; color:var(--text-secondary);">
                Noch keine Kampagnen geladen. Bitte Meta verbinden.
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    campaigns.forEach(campaign => tbody.appendChild(createCampaignRow(campaign)));
}

function handleViewRendering(viewId) {
    switch (viewId) {
        case "dashboardView":
            renderDashboard();
            break;
        case "creativesView":
            renderCreativeLibrary();
            break;
        case "campaignsView":
            renderCampaigns();
            break;
        default:
            break;
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
