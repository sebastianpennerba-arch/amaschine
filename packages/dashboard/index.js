// packages/dashboard/index.js
// Dashboard Package – Einstiegspunkt für den Dashboard-View.
// Aktuell nutzt es intern die bestehende updateDashboardView-Logik,
// sodass sich am Verhalten nichts ändert.

import { updateDashboardView } from "../../dashboard.js";

const DashboardPackage = {
    /**
     * Initialisierung – einmalig beim App-Start.
     * Hier könnten später Event-Listener oder eigene State-Strukturen hin.
     */
    init(options = {}) {
        console.debug("[DashboardPackage] init()", options);
    },

    /**
     * Vollständiges Rendern des Dashboards.
     * Derzeit reine Durchleitung an die bestehende View-Funktion.
     */
    render(options = {}) {
        console.debug("[DashboardPackage] render()", options);
        updateDashboardView(true);
    },

    /**
     * Update bei State-/Filter-Änderungen.
     * Aktuell identisch zu render(), um kompatibel zu bleiben.
     */
    update(options = {}) {
        console.debug("[DashboardPackage] update()", options);
        updateDashboardView(true);
    },

    /**
     * Cleanup-Hook für spätere Erweiterungen.
     */
    destroy() {
        console.debug("[DashboardPackage] destroy()");
    }
};

// Modul „versiegeln“, damit niemand es versehentlich überschreibt.
Object.freeze(DashboardPackage);

export default DashboardPackage;
