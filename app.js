/**
 * SignalOne Elite Dashboard - app.js
 *
 * Phase A – Live-Ready Architektur
 *
 * Enthält:
 * 1. Globalen AppState (Meta-ready)
 * 2. Meta Normalizer Layer
 * 3. UI Component Library
 * 4. Render Engine (Dashboard, Creatives, Campaigns)
 * 5. Navigation ohne Inline JS
 * 6. Meta-Connect Gatekeeper + Stripe + Simulation
 * 7. Toast & Modal System
 */


/* ============================================
   GLOBALER APP STATE (Phase 1 – Live Ready)
   ============================================ */

const AppState = {
    // Meta Connection Status
    metaConnected: false,

    // Auth / User (später)
    user: null,

    // Aktives UI Verhalten
    currentView: "dashboardView",
    timeRange: "last_7d",
    brand: null,
    campaignGroup: null,

    // Live-Daten aus Meta API (später live befüllt)
    meta: {
        accessToken: null,
        adAccounts: [],
        selectedAdAccount: null,

        // Normalisierte Daten (siehe Normalizer-Layer)
        campaigns: [],   // [{ id, name, status, statusColor, goal, dailyBudget, spend30d, roas30d, ctr }]
        adsets: [],
        ads: [],
        creatives: [],   // [{ id, name, type, url, thumbnail, platform, metrics: {...} }]
        insights: {},    // { roas, roasTrend, cpp, cppTrend, ctr, ctrTrend, spendToday, spendTodayTrend }
    },

    // Systemdaten
    loading: false,
    error: null,
};


/* ============================================
   META CONNECT GATEKEEPER
   ============================================ */

/**
 * Zeigt/versteckt die Meta-Connect-Stripe oben im Layout.
 * Gibt true zurück, wenn verbunden; false sonst.
 */
function checkMetaConnection() {
    const stripe = document.getElementById("metaConnectStripe");

    if (!AppState.metaConnected) {
        if (stripe) stripe.classList.remove("hidden");
        return false;
    } else {
        if (stripe) stripe.classList.add("hidden");
        return true;
    }
}

/**
 * Gatekeeper für datenladende Funktionen:
 * - zeigt Toast
 * - aktualisiert Stripe
 * - verhindert API-Calls
 */
function requireMetaConnection() {
    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        showToast("Bitte verbinde Meta Ads, bevor Daten geladen werden.", "warning");
        checkMetaConnection();
        return false;
    }
    return true;
}

/**
 * TEMPORÄR: Simulierter Meta-Connect (für UI-Tests in Phase A).
 * Kann in der Browser-Konsole aufgerufen werden:
 *   simulateMetaConnect()
 */
function simulateMetaConnect() {
    AppState.metaConnected = true;
    AppState.meta.accessToken = "SIMULATED_TOKEN";
    showToast("Meta erfolgreich verbunden (Simulation)", "success");
    checkMetaConnection();

    // Aktuelle View mit neuem Status neu rendern
    handleViewRendering(AppState.currentView);
}

// Für Debug-Zugriff im Browser:
window.simulateMetaConnect = simulateMetaConnect;


/* ============================================
   META NORMALIZER LAYER (Phase 1 – Live Ready)
   ============================================ */
/**
 * Ziel:
 *  - Rohdaten von Meta (Campaigns, Ads, Insights) in ein einheitliches,
 *    UI-freundliches SignalOne-Format bringen.
 *  - Später auch TikTok/Pinterest über dieselben Normalizer schleusen.
 */

function toNumber(value) {
    const n = Number(value);
    return isNaN(n) ? 0 : n;
}

/**
 * Normalisiert eine Meta-Ad + zugehörige Creative- & Insights-Daten
 * in das interne Creative-Format von SignalOne.
 *
 * Erwartete Inputs (später aus Backend):
 *  - metaAd:        { id, name, creative: { id }, ... }
 *  - metaCreative:  { id, object_story_spec, thumbnail_url, ... }
 *  - insights:      Meta Insights-Objekt für diese Ad
 */
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
            score: null, // später: eigener Score-Algorithmus
        }
    };
}

/**
 * Normalisiert eine Meta-Kampagne + Insights in das interne Campaign-Format.
 * - metaCampaign: { id, name, objective, status, daily_budget, ... }
 * - insights:     Meta Insights (aggregiert über 30 Tage o.ä.)
 */
function normalizeMetaCampaign(metaCampaign, insights) {
    const metrics = extractMetricsFromInsights(insights);

    return {
        id: metaCampaign.id,
        name: metaCampaign.name || "Unnamed Campaign",
        status: metaCampaign.status || "UNKNOWN",
        statusColor: deriveStatusColorFromMetaStatus(metaCampaign.status),
        goal: metaCampaign.objective || "n/a",
        dailyBudget: toNumber(metaCampaign.daily_budget) / 100, // Meta in Cent
        spend30d: metrics.spend,
        roas30d: metrics.roas,
        ctr: metrics.ctr,
    };
}

/**
 * Aggregiert eine Liste von Insights (z.B. pro Ad) in globale Dashboard-KPIs.
 * input: Array von Meta-Insights-Objekten
 * output: Struktur für AppState.meta.insights
 */
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
        roasTrend: null,       // Trendberechnung erfolgt später (Vergleich vs. Vorperiode)
        cpp,
        cppTrend: null,
        ctr,
        ctrTrend: null,
        spendToday: null,      // kann über heutigen Insights-Call berechnet werden
        spendTodayTrend: null,
    };
}

/**
 * Extrahiert Grund-KPIs aus einem Meta-Insights-Objekt.
 * Erwartete Felder (typische Marketing API Felder):
 *  - spend
 *  - impressions
 *  - clicks
 *  - actions (array mit purchase, etc.)
 *  - action_values
 *  - purchase_roas (array)
 *  - cpm
 */
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
        if (purchaseAction) {
            purchases = toNumber(purchaseAction.value);
        }
    }

    if (Array.isArray(insights.action_values)) {
        const purchaseValue = insights.action_values.find(a => a.action_type === "purchase");
        if (purchaseValue) {
            revenue = toNumber(purchaseValue.value);
        }
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

/**
 * Ermittelt eine visuelle Statusfarbe basierend auf Meta-Kampagnenstatus.
 * Beispiele: ACTIVE, PAUSED, DELETED, ARCHIVED...
 */
function deriveStatusColorFromMetaStatus(status) {
    if (!status) return "yellow";
    const s = status.toUpperCase();

    if (s === "ACTIVE") return "green";
    if (s === "PAUSED") return "yellow";
    if (["DELETED", "ARCHIVED", "DISAPPROVED"].includes(s)) return "red";

    return "yellow";
}

/**
 * Versucht, Kreativtyp anhand der Creative-Daten zu bestimmen.
 * (simplifiziert, später erweiterbar)
 */
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

/**
 * Extrahiert eine URL (z.B. für Poster) aus der Creative-Struktur.
 * Die konkrete Implementation hängt vom späteren Backend-Mapping ab.
 */
function extractCreativeUrl(metaCreative) {
    if (!metaCreative) return null;
    // Platzhalter: im echten System gibt uns das Backend eine saubere url.
    return metaCreative.video_url || metaCreative.image_url || null;
}

/**
 * Fallback: Thumbnail aus object_story_spec lesen.
 */
function extractThumbnailFromStory(metaCreative) {
    if (!metaCreative || !metaCreative.object_story_spec) return null;
    const spec = metaCreative.object_story_spec;

    if (spec.video_data && spec.video_data.thumbnail_url) {
        return spec.video_data.thumbnail_url;
    }
    if (spec.link_data && spec.link_data.picture) {
        return spec.link_data.picture;
    }
    return null;
}


/* ============================================
   UI COMPONENT LIBRARY (Phase 1 – Live Ready)
   ============================================ */

/* ----------------------------
   FORMATTER HELPERS
---------------------------- */
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


/* ----------------------------
   KPI CARD COMPONENT
---------------------------- */
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


/* ----------------------------
   MEDIA PREVIEW (image/video)
---------------------------- */
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

    // Plattform-Badge (Meta, TikTok, Pinterest später dynamisch)
    const badge = document.createElement("i");
    badge.className = "platform-badge fab fa-meta";
    container.appendChild(badge);

    return container;
}


/* ----------------------------
   CREATIVE CARD COMPONENT
---------------------------- */
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


/* ----------------------------
   CAMPAIGN ROW COMPONENT
---------------------------- */
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
   RENDER ENGINE (Phase 1 – Live Ready)
   ============================================ */

/* ----------------------------
   1. DASHBOARD RENDERER
---------------------------- */
function renderDashboard() {
    renderDashboardKPIs();
    renderDashboardChart();
    renderHeroCreatives();
}


// ---- KPIs ----------------------------------
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


// ---- CHART ----------------------------------
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


// ---- HERO CREATIVES ----------------------------------
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


/* ----------------------------
   2. CREATIVE LIBRARY RENDERER
---------------------------- */
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


/* ----------------------------
   3. CAMPAIGNS RENDERER
---------------------------- */
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


/* ----------------------------
   4. View Switch Hook
---------------------------- */
function handleViewRendering(viewId) {
    switch(viewId) {
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
    // 1. Datum/Uhrzeit
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // 2. Navigation initialisieren
    initNavigation();

    // 3. Meta-Stripe initial prüfen
    checkMetaConnection();
    initMetaConnectUI();

    // 4. Initiale View anzeigen (Dashboard)
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

// --- 1. DATUM & UHRZEIT ---
function updateDateTime() {
    const now = new Date();

    const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');

    if (dateElement) dateElement.textContent = now.toLocaleDateString('de-DE', dateOptions);
    if (timeElement) timeElement.textContent = now.toLocaleTimeString('de-DE', timeOptions);
}


// --- 2. NAVIGATION ---
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


// --- 3. META CONNECT UI ---
function initMetaConnectUI() {
    const connectBtn = document.getElementById("connectMetaButton");
    if (!connectBtn) return;

    connectBtn.addEventListener("click", () => {
        openModal(
            "Meta verbinden",
            "In der nächsten Phase wird hier der echte Meta OAuth Flow integriert. Aktuell ist dies ein Platzhalter."
        );
    });
}


// --- 4. VIEW HANDLING ---
function showView(viewId, clickedElement, options = {}) {
    // Views umschalten
    document.querySelectorAll('.view').forEach(view => view.classList.add('hidden'));

    const targetView = document.getElementById(viewId);
    if (targetView) targetView.classList.remove('hidden');

    // Aktiven Menüpunkt markieren
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (clickedElement) clickedElement.classList.add('active');

    // Stripe aktualisieren (nur UI, keine Blockade)
    checkMetaConnection();

    // Renderer starten
    handleViewRendering(viewId);

    // Optionaler Toast
    if (!options.skipToast) {
        const label = viewId.replace('View', '');
        showToast(`Ansicht gewechselt: ${label}`, 'info');
    }
}


// --- 5. TOAST SYSTEM ---
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


// --- 6. MODAL SYSTEM ---
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


// --- 7. MOCK HANDLER ---
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
