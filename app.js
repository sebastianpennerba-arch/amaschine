/**
 * SignalOne Elite Dashboard - app.js
 *
 * Enthält die Logik für:
 * 1. Initialisierung (Datum/Uhrzeit-Update)
 * 2. View Handling (Sidebar-Navigation)
 * 3. Toast (Benachrichtigungs-) System
 * 4. Modal System
 * 5. Mock-Handler für Klick-Aktionen (handleDeadButton, handleDropdownChange, handleTimeRange)
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


// --- 2. VIEW & NAVIGATION HANDLING ---
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
