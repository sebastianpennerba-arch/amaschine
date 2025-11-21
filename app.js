// =======================================================================
// SIGNALONE.CLOUD - ELITE MASTER JAVASCRIPT V10.11 (KONSOLIDIERT)
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --------------------------------------------------
    // 1. UHRZEIT ANZEIGE
    // --------------------------------------------------
    function updateTime() {
        const now = new Date();
        const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        
        const dateEl = document.getElementById('currentDate');
        const timeEl = document.getElementById('currentTime');

        // Aktualisiert nur, falls die Elemente existieren
        if (dateEl) dateEl.textContent = 'Datum: ' + now.toLocaleDateString('de-DE', dateOptions);
        if (timeEl) timeEl.textContent = 'Zeit: ' + now.toLocaleTimeString('de-DE', timeOptions);
    }

    // Initialer Aufruf und Aktualisierung im Sekundentakt
    updateTime();
    setInterval(updateTime, 1000); 

    // --------------------------------------------------
    // 2. VIEW NAVIGATION START
    // --------------------------------------------------
    // Stellt sicher, dass das Dashboard beim Start aktiv ist
    const dashboardMenu = document.getElementById('menuDashboard');
    if (dashboardMenu) {
        window.showView('dashboardView', dashboardMenu);
    }
});

// =======================================================================
// GLOBALE FUNKTIONEN (für HTML-Interaktion)
// =======================================================================

/**
 * Globales Toast-Anzeigesystem (für visuelles Feedback im Mockup).
 * Diese Funktion muss global sein (window.), um von allen Handlern aufgerufen werden zu können.
 */
window.showToast = function(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toastContainer');
    
    if (!container) {
        console.warn(`Toast System: #toastContainer fehlt. Nachricht: ${message}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    container.prepend(toast); // Fügen Sie den Toast am Anfang hinzu

    // Fade out und Entfernung
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if(toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300); // 300ms CSS-Dauer
    }, duration);
}


/**
 * Schaltet die aktive Ansicht (View) um und markiert den Menüpunkt.
 * Wird über onclick="..." in der Sidebar aufgerufen.
 */
window.showView = function(viewId, menuItem) {
    // 1. Alle Views verstecken
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });

    // 2. Ziel-View anzeigen
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // 3. Aktives Menü-Item markieren
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    if (menuItem) {
        menuItem.classList.add('active');
        // Update URL Hash (optional, für saubere Navigation)
        // Entfernt "View" vom Ende, um den Hash zu säubern (z.B. #dashboard)
        const hashId = viewId.replace('View', ''); 
        history.pushState(null, '', `#${hashId}`);
    }
}


// --------------------------------------------------
// PLATZHALTER HANDLER (MOCK-INTERAKTIONEN)
// --------------------------------------------------

/**
 * Generische Funktion für tote Buttons (Platzhalter).
 */
window.handleDeadButton = function(action) {
    window.showToast(`Funktion nicht implementiert: ${action}`, 'warning');
}

/**
 * Generische Funktion für Dropdown-Änderungen (Platzhalter).
 */
window.handleDropdownChange = function(type, value) {
    window.showToast(`${type} geändert auf: ${value}`, 'success');
}

/**
 * Generische Funktion für Chart-Steuerung (Platzhalter).
 */
window.handleChartChange = function(metric) {
    window.showToast(`Chart-Metrik geändert zu: ${metric.toUpperCase()}`, 'info');
}

/**
 * Generische Funktion für Zeitbereichs-Auswahl (Platzhalter).
 * Erfordert, dass der Button als zweiter Parameter übergeben wird (z.B. onclick="handleTimeRange('Heute', this)")
 */
window.handleTimeRange = function(range, buttonElement) {
    // Wenn ein Button-Element übergeben wurde, die 'active'-Klasse umschalten
    if (buttonElement && buttonElement.parentNode) {
        // Entferne 'active' von allen Geschwistern
        buttonElement.parentNode.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
        // Füge 'active' zum geklickten Button hinzu
        buttonElement.classList.add('active');
    }
    
    window.showToast(`Zeitraum geändert: ${range.toUpperCase()}`, 'info');
}
