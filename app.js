/**
 * SignalOne Elite Dashboard - app.js
 *
 * Phase A – Live-Ready Architektur
 *
 * Enthält:
 * 1. Globalen AppState (Meta-ready)
 * 2. Render Engine (Dashboard, Creatives, Campaigns)
 * 3. Initialisierung (Datum/Uhrzeit-Update, Navigation)
 * 4. View Handling (Sidebar-Navigation)
 * 5. Toast (Benachrichtigungs-) System
 * 6. Modal System
 * 7. Mock-Handler für Klick-Aktionen (handleDeadButton, handleDropdownChange, handleTimeRange)
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
    timeRange: "last_7d",   // später: 'today', 'yesterday', 'last_30d'
    brand: null,
    campaignGroup: null,

    // Live-Daten aus Meta API
    meta: {
        accessToken: null,
        adAccounts: [],
        selectedAdAccount: null,

        // später dynamisch gefüllt:
        campaigns: [],
        adsets: [],
        ads: [],
        creatives: [],      // normalisiert
        insights: {},       // globale KPIs
    },

    // Systemdaten
    loading: false,
    error: null,
};


/* ============================================
   RENDER ENGINE (Phase 1 – Live Ready)
   ============================================ */

/* ----------------------------
   1. Dashboard Renderer
---------------------------- */
function renderDashboard() {
    renderDashboardKPIs();
    renderDashboardChart();
    renderHeroCreatives();
}

/* KPIs */
function renderDashboardKPIs() {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    container.innerHTML = ""; // reset

    // Platzhalter-KPIs – werden später mit echten Meta-Daten befüllt
    const kpis = [
        { label: "RETURN ON AD SPEND (ROAS)", value: "-", trend: "" },
        { label: "COST PER PURCHASE (CPP)", value: "-", trend: "" },
        { label: "CREATIVE CTR (GESAMT)", value: "-", trend: "" },
        { label: "AD SPEND (HEUTE)", value: "-", trend: "" }
    ];

    const grid = document.createElement("div");
    grid.className = "kpi-grid";

    kpis.forEach(kpi => {
        const card = document.createElement("div");
        card.className = "kpi-card";

        card.innerHTML = `
            <span class="kpi-label">${kpi.label}</span>
            <span class="kpi-value">${kpi.value}</span>
            <span class="kpi-trend">${kpi.trend}</span>
        `;

        grid.appendChild(card);
    });

    container.appendChild(grid);
}

/* CHART */
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
            <div class="chart-placeholder">[ ELITE CHART PLATZHALTER – Live Daten folgen nach Meta-Integration ]</div>
        </div>
    `;
}

/* HERO CREATIVES */
function renderHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");
    if (!container) return;

    container.innerHTML = ""; // reset

    const wrapper = document.createElement("div");
    wrapper.className = "card hero-creatives-card";

    wrapper.innerHTML = `
        <h3 class="elite-title" style="font-size: 24px; margin-bottom: 5px;">Hero Creatives (Top Performer)</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
            Live-Daten werden nach Meta-Integration geladen. Aktuell keine Creatives im State.
        </p>
        <div class="hero-grid" id="heroCreativesGrid">
            <!-- Später: dynamische Hero-Cards auf Basis AppState.meta.creatives -->
        </div>
    `;

    container.appendChild(wrapper);
}


/* ----------------------------
   2. Creative Library Renderer
---------------------------- */
function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    grid.innerHTML = ""; // reset

    // solange keine Live-Daten vorhanden sind:
    if (!AppState.meta.creatives || AppState.meta.creatives.length === 0) {
        const empty = document.createElement("p");
        empty.style.color = "var(--text-secondary)";
        empty.style.padding = "8px";
        empty.innerText = "Noch keine Creatives geladen. Bitte Meta Ads verbinden, um Live-Daten zu sehen.";
        grid.appendChild(empty);
        return;
    }

    // Später: hier iterieren wir über AppState.meta.creatives und erstellen Cards
}


/* ----------------------------
   3. Campaigns Renderer
---------------------------- */
function renderCampaigns() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = ""; // reset

    if (!AppState.meta.campaigns || AppState.meta.campaigns.length === 0) {
        const emptyRow = document.createElement("tr");
        emptyRow.innerHTML = `
            <td colspan="8" style="text-align:center; padding:20px; color:var(--text-secondary);">
                Noch keine Kampagnen geladen. Bitte Meta Ads verbinden, um Live-Daten zu sehen.
            </td>
        `;
        tbody.appendChild(emptyRow);
        return;
    }

    // Später: hier iterieren wir über AppState.meta.campaigns und erstellen Tabellenzeilen
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
            ${trendValue ? (trendValue > 0 ? "▲ " : "▼ ") + trendValue + "%" : ""}
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

    element.className = "creative-video-mock"; // CSS passt schon
    container.appendChild(element);

    // Plattform-Badge (Meta, TikTok, Pinterest)
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
   INITIALISIERUNG
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Datum/Uhrzeit
    updateDateTime();
    setInterval(updateDateTime, 1000); 

    // 2. Navigation initialisieren
    initNavigation();

    // 3. Initiale View anzeigen (Dashboard)
    const initialActiveMenuItem = document.querySelector('.menu-item.active');
    let initialViewId = "dashboardView";

    if (initialActiveMenuItem) {
        const dataView = initialActiveMenuItem.getAttribute('data-view');
        if (dataView) {
            initialViewId = dataView;
        }
    }

    AppState.currentView = initialViewId;
    showView(initialViewId, initialActiveMenuItem, { skipToast: true });
});


/* ============================================
   BASIS-FUNKTIONEN
   ============================================ */

// --- 1. DATUM & UHRZEIT FUNKTION ---
function updateDateTime() {
    const now = new Date();
    
    // Format für Datum (z.B. 21. November 2025)
    const dateOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    const dateString = now.toLocaleDateString('de-DE', dateOptions);

    // Format für Zeit (z.B. 09:53:30)
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const timeString = now.toLocaleTimeString('de-DE', timeOptions);

    const dateElement = document.getElementById('currentDate');
    const timeElement = document.getElementById('currentTime');

    if (dateElement) {
        dateElement.textContent = dateString;
    }
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}


// --- 2. NAVIGATION INIT ---
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


// --- 3. VIEW & NAVIGATION HANDLING ---
/**
 * Wechselt die angezeigte Hauptansicht und aktualisiert den aktiven Menüpunkt.
 * @param {string} viewId - Die ID des anzuzeigenden <section class="view"> Elements (z.B. 'dashboardView').
 * @param {HTMLElement} clickedElement - Das geklickte <a> Element aus der Sidebar.
 * @param {Object} options - Zusätzliche Optionen (z.B. { skipToast: true }).
 */
function showView(viewId, clickedElement, options = {}) {
    // Alle Views ausblenden
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });

    // Gewünschte View anzeigen
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Aktiven Menüpunkt hervorheben
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    if (clickedElement) {
        clickedElement.classList.add('active');
    }

    // Renderer für die jeweilige View triggern
    handleViewRendering(viewId);
    
    // Kleiner Toast zur Bestätigung (Mock-Feedback) – optional
    if (!options.skipToast) {
        const label = viewId.replace('View', '');
        showToast(`Ansicht gewechselt: ${label}`, 'info');
    }
}


// --- 4. TOAST SYSTEM (Benachrichtigungen) ---
/**
 * Zeigt eine temporäre Benachrichtigung (Toast) an.
 * @param {string} message - Die Nachricht, die angezeigt werden soll.
 * @param {string} type - Typ des Toasts ('success', 'error', 'info', 'warning').
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${getIconForType(type)}"></i> ${message}`;
    
    // Farbe für den Left Border (dynamisch aus CSS-Variablen)
    let borderColor = 'var(--color-primary)';
    if (type === 'success') borderColor = 'var(--success)';
    if (type === 'error') borderColor = 'var(--danger)';
    if (type === 'warning') borderColor = 'var(--warning)';

    toast.style.borderLeftColor = borderColor;

    container.appendChild(toast);

    // Entfernen des Toasts nach 4 Sekunden
    setTimeout(() => {
        toast.style.opacity = 0;
        toast.style.transform = 'translateX(100%)';
        // Nach Fade-Out das Element entfernen
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


// --- 5. MODAL SYSTEM ---
/**
 * Öffnet ein modales Fenster.
 * Wird hier nur als Mock für die "Dead Buttons" verwendet.
 * @param {string} title - Titel des Modals.
 * @param {string} body - Hauptinhalt des Modals.
 */
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
    if (overlay) {
        overlay.classList.remove('active');
    }
}


// --- 6. MOCK HANDLER FÜR INTERAKTIONEN ---

/**
 * Allgemeine Funktion zur Simulation einer Aktion (für alle Buttons, die noch keine Logik haben).
 * Zeigt einen Toast oder ein Modal.
 * @param {string} actionName - Name der ausgelösten Aktion.
 */
function handleDeadButton(actionName) {
    if (actionName.includes('Detailansicht') || actionName.includes('Custom Date Range')) {
        openModal(actionName, `Dies ist die Detailansicht/Funktion für: "${actionName}". Die vollständige Implementierung folgt in einer späteren Phase.`);
    } else {
        showToast(`Aktion ausgeführt (Mock): ${actionName}`, 'info');
    }
}

/**
 * Handler für die Dropdown-Änderungen (Top Bar, Filter etc.).
 * @param {string} type - Typ des Dropdowns (z.B. 'Brand', 'Kampagnen Gruppe').
 * @param {string} value - Der ausgewählte Wert.
 */
function handleDropdownChange(type, value) {
    showToast(`${type} geändert auf: ${value}`, 'info');
    // In einer echten Anwendung würde hier ein Daten-Reload folgen.
}

/**
 * Handler für die Chart-Dropdowns.
 * @param {string} value - Die ausgewählte KPI (z.B. 'ROAS', 'Spend').
 */
function handleChartChange(value) {
    showToast(`Chart Ansicht gewechselt zu: ${value}`, 'info');
}

/**
 * Handler für die Zeitbereichs-Buttons im Chart-Bereich.
 * @param {string} range - Der ausgewählte Zeitbereich.
 * @param {HTMLElement} clickedButton - Der geklickte Button.
 */
function handleTimeRange(range, clickedButton) {
    // Entfernt 'active' von allen Zeitbereichs-Buttons
    document.querySelectorAll('.time-range-button').forEach(btn => {
        btn.classList.remove('active');
    });

    // Fügt 'active' zum geklickten Button hinzu
    if (clickedButton) {
        clickedButton.classList.add('active');
    }

    AppState.timeRange = range;
    showToast(`Zeitbereich auf ${range} eingestellt.`, 'info');
}
