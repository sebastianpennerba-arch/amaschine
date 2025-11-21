// =======================================================================
// SIGNALONE.CLOUD - ELITE MASTER JAVASCRIPT V10.6
// =======================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------
    // 1. DATEI & UHRZEIT ANZEIGE
    // --------------------------------------------------
    function updateTime() {
        const now = new Date();
        
        // Datum
        const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        document.getElementById('currentDate').textContent = 'Datum: ' + now.toLocaleDateString('de-DE', dateOptions);
        
        // Uhrzeit
        const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
        document.getElementById('currentTime').textContent = 'Zeit: ' + now.toLocaleTimeString('de-DE', timeOptions);
    }

    // Beim Laden einmal aufrufen und dann jede Sekunde aktualisieren
    updateTime();
    setInterval(updateTime, 1000);
    
    // --------------------------------------------------
    // 2. VIEW NAVIGATION (SIDEBAR)
    // --------------------------------------------------
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const menuItems = sidebar.querySelectorAll('.menu-item');
    const views = mainContent.querySelectorAll('.view');

    // Funktion zum Umschalten des Views
    function switchView(viewId) {
        // Entferne 'active' von allen Menü-Items und blende alle Views aus
        menuItems.forEach(item => item.classList.remove('active'));
        views.forEach(view => view.classList.add('hidden'));

        // Füge 'active' zum geklickten Item hinzu
        const activeItem = sidebar.querySelector(`.menu-item[data-view="${viewId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }

        // Blende den gewünschten View ein
        const activeView = document.getElementById(viewId + 'View');
        if (activeView) {
            activeView.classList.remove('hidden');
        }
        
        // Update URL Hash (optional, für saubere Navigation)
        history.pushState(null, '', `#${viewId}`);
    }

    // Event Listener für Menü-Items
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = item.getAttribute('data-view');
            switchView(viewId);
            showToast(`Navigiere zu: ${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`, 'info');
        });
    });

    // Initialen View beim Laden der Seite setzen (Dashboard)
    const initialViewId = window.location.hash ? window.location.hash.substring(1) : 'dashboard';
    switchView(initialViewId);


    // --------------------------------------------------
    // 3. INTERAKTIVITÄT & TOASTS (PLATZHALTER)
    // --------------------------------------------------
    
    // Generische Funktion für Dropdown-Änderungen (Platzhalter)
    window.handleDropdownChange = function(type, value) {
        showToast(`${type} geändert auf: ${value}`, 'success');
    }

    // Generische Funktion für tote Buttons (Platzhalter)
    window.handleDeadButton = function(action) {
        showToast(`Funktion nicht implementiert: ${action}`, 'warning');
    }

    // Generische Funktion für Chart-Steuerung (Platzhalter)
    window.handleChartChange = function(metric) {
        showToast(`Chart-Metrik geändert zu: ${metric.toUpperCase()}`, 'info');
    }

    // Generische Funktion für Zeitbereichs-Auswahl (Platzhalter)
    window.handleTimeRange = function(range) {
        // Entferne 'active' von allen Buttons und füge es dem geklickten hinzu
        document.querySelectorAll('.time-range-button').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`.time-range-group button[onclick*="'${range}'"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }
        
        showToast(`Zeitraum geändert: ${range.toUpperCase()}`, 'info');
    }

    // Toast-Anzeigefunktion
    function showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Fade out und Entfernung
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300); // Entspricht der CSS transition Dauer
        }, duration);
    }
});
