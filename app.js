/**
 * SignalOne Elite Dashboard - app.js
 *
 * Enthält die Logik für:
 * 1. Initialisierung (Datum/Uhrzeit-Update)
 * 2. View Handling (Sidebar-Navigation)
 * 3. Toast (Benachrichtigungs-) System
 * 4. Modal System
 * 5. Mock-Handler für Klick-Aktionen (handleDeadButton, handleDropdownChange, handleTimeRange)
 * 6. Creative Library Logik (Phase 2)
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialisierung beim Laden der Seite
    updateDateTime();
    // Startet das Zeit-Update jede Sekunde
    setInterval(updateDateTime, 1000); 

    // Zeigt die initiale Ansicht (Dashboard)
    const initialActiveMenuItem = document.querySelector('.menu-item.active');
    if (initialActiveMenuItem) {
        const viewId = initialActiveMenuItem.getAttribute('data-view') + 'View';
        showView(viewId, initialActiveMenuItem);
    }
});

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


// --- ZUSÄTZLICHE MOCK-DATEN FÜR PHASE 2 (CREATIVE LIBRARY) ---

const MOCK_CREATIVES_DATA = [
    {
        id: 1,
        name: "Video Ad - High ROAS Hook 1",
        type: "Video",
        platform: "Meta",
        roas: 4.85,
        cpa: 12.50,
        spend: 1850.00,
        impressions: '150,000',
        score: 96, // AdSensei Score
        status: "Active", 
        trend: "positive", 
        thumbnail: "/mock/creative_video_mock1.jpg"
    },
    {
        id: 2,
        name: "UGC Image - Value Prop",
        type: "Image",
        platform: "Meta",
        roas: 3.12,
        cpa: 24.80,
        spend: 720.50,
        impressions: '65,000',
        score: 74,
        status: "Scaling",
        trend: "neutral",
        thumbnail: "/mock/creative_image_mock2.jpg"
    },
    {
        id: 3,
        name: "Carousel - Underperformer",
        type: "Carousel",
        platform: "Meta",
        roas: 1.88,
        cpa: 45.10,
        spend: 410.00,
        impressions: '32,000',
        score: 31,
        status: "Paused",
        trend: "negative",
        thumbnail: "/mock/creative_carousel_mock3.jpg"
    },
    {
        id: 4,
        name: "Story Ad - New Test",
        type: "Video",
        platform: "Meta",
        roas: 0.00,
        cpa: 0.00,
        spend: 50.00,
        impressions: '5,000',
        score: 55,
        status: "Testing",
        trend: "neutral",
        thumbnail: "/mock/creative_story_mock4.jpg"
    },
];

// --- 6. DYNAMISCHES RENDERING FÜR CREATIVE LIBRARY (PHASE 2) ---

/**
 * Erzeugt den HTML-Code für eine einzelne Creative-Kachel.
 */
function createCreativeCardHTML(creative) {
    let trendClass = '';
    if (creative.trend === 'positive') {
        trendClass = 'trend-positive';
    } else if (creative.trend === 'negative') {
        trendClass = 'trend-negative';
    }

    let statusColor = 'status-info'; 
    if (creative.status === 'Active' || creative.status === 'Scaling') {
        statusColor = 'status-green';
    } else if (creative.status === 'Paused') {
        statusColor = 'status-red';
    }

    return `
        <div class="creative-card" data-status="${creative.status.toLowerCase()}" data-type="${creative.type.toLowerCase()}" onclick="handleDeadButton('Creative-Detailansicht: ${creative.name}')">
            <div class="creative-header">
                <span class="creative-status-badge ${statusColor}">
                    ${creative.status}
                </span>
                <span class="creative-score" title="AdSensei Score">${creative.score}</span>
            </div>
            <div class="creative-media-preview">
                <img src="${creative.thumbnail}" alt="${creative.name}" onerror="this.onerror=null;this.src='/mock/placeholder.png';" />
                <span class="creative-type-badge">${creative.type}</span>
            </div>
            <div class="creative-body">
                <h4 class="creative-name">${creative.name}</h4>
                <p class="creative-meta">Plattform: ${creative.platform} | Spend: € ${creative.spend.toFixed(2)}</p>
            </div>
            <div class="creative-kpis">
                <div class="kpi-item-small">
                    <span>ROAS</span>
                    <strong class="${trendClass}">${creative.roas.toFixed(2)}x</strong>
                </div>
                <div class="kpi-item-small">
                    <span>CPA</span>
                    <strong>€ ${creative.cpa.toFixed(2)}</strong>
                </div>
            </div>
        </div>
    `;
}

/**
 * Rendert alle Creatives aus den MOCK_CREATIVES_DATA in das Grid.
 * Wird später für die Filterung verwendet.
 */
function renderCreativeGrid(creatives = MOCK_CREATIVES_DATA) {
    const container = document.getElementById('creativeGridContainer');
    if (!container) return; 

    if (creatives.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 50px;">Keine Creatives gefunden, die den Filtern entsprechen.</p>';
        return;
    }

    const htmlContent = creatives.map(createCreativeCardHTML).join('');
    container.innerHTML = htmlContent;
}


// --- 2. VIEW & NAVIGATION HANDLING (WIRD ERWEITERT) ---
/**
 * Wechselt die angezeigte Hauptansicht und aktualisiert den aktiven Menüpunkt.
 * @param {string} viewId - Die ID des anzuzeigenden <section class="view"> Elements (z.B. 'dashboardView').
 * @param {HTMLElement} clickedElement - Das geklickte <a> Element aus der Sidebar.
 */
function showView(viewId, clickedElement) {
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
    
    // PHASE 2: Creative Grid Rendering starten, wenn die View gewechselt wird
    if (viewId === 'creativesView') {
        renderCreativeGrid(); 
    }
    
    // Kleiner Toast zur Bestätigung (Mock-Feedback)
    showToast(`Ansicht gewechselt: ${viewId.replace('View', '')}`, 'info');
}


// --- 3. TOAST SYSTEM (Benachrichtigungen) ---
/**
 * Zeigt eine temporäre Benachrichtigung (Toast) an.
 * @param {string} message - Die Nachricht, die angezeigt werden soll.
 * @param {string} type - Typ des Toasts ('success', 'error', 'info').
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


// --- 4. MODAL SYSTEM ---
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


/**
 * PHASE 2 - Filter: Implementiert die grundlegende Such- und Filter-Logik.
 */
function filterCreatives() {
    const searchInput = document.getElementById('creativeSearchInput');
    const statusFilter = document.getElementById('creativeStatusFilter');
    const typeFilter = document.getElementById('creativeTypeFilter');

    // Sicherheit, falls Elemente nicht da sind (z.B. in Dashboard View)
    if (!searchInput || !statusFilter || !typeFilter) return;

    const searchTerm = searchInput.value.toLowerCase();
    const selectedStatus = statusFilter.value;
    const selectedType = typeFilter.value;

    let filteredCreatives = MOCK_CREATIVES_DATA.filter(creative => {
        // 1. Suche nach Name
        const matchesSearch = creative.name.toLowerCase().includes(searchTerm);

        // 2. Filter nach Status
        const matchesStatus = selectedStatus === 'all' || creative.status.toLowerCase() === selectedStatus;
        
        // 3. Filter nach Typ
        const matchesType = selectedType === 'all' || creative.type.toLowerCase() === selectedType;

        return matchesSearch && matchesStatus && matchesType;
    });

    renderCreativeGrid(filteredCreatives);
    // showToast(`Creative Library gefiltert. ${filteredCreatives.length} Creatives gefunden.`, 'info'); // Deaktiviert, da es bei jeder Eingabe triggert
}


// Fügt Event Listener für das Suchfeld hinzu, wenn das DOM geladen ist.
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('creativeSearchInput');
    if (searchInput) {
        // Fügt den Filter-Aufruf beim Tippen hinzu
        searchInput.addEventListener('input', filterCreatives);
    }
});



// --- 5. MOCK HANDLER FÜR INTERAKTIONEN ---

/**
 * Allgemeine Funktion zur Simulation einer Aktion (für alle Buttons, die noch keine Logik haben).
 * Zeigt einen Toast oder ein Modal.
 * @param {string} actionName - Name der ausgelösten Aktion.
 */
function handleDeadButton(actionName) {
    if (actionName.includes('Detailansicht') || actionName.includes('Custom Date Range')) {
        openModal(actionName, `Dies ist die Detailansicht/Funktion für: "${actionName}". Die vollständige Implementierung folgt in PHASE 2/3.`);
    } else {
        showToast(`Aktion ausgeführt (Mock): ${actionName}`, 'info');
    }
}

/**
 * Handler für die Dropdown-Änderungen in der Top Bar.
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

    showToast(`Zeitbereich auf ${range} eingestellt.`, 'info');
}
