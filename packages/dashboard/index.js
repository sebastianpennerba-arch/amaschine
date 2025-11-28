// packages/dashboard/index.js
// Zentrale API für das Dashboard-Package

import { computeDashboardState } from "./dashboard.compute.js";
import { renderDashboard } from "./dashboard.render.js";

const DashboardPackage = {
    /**
     * Initialisierung – einmalig beim App-Start.
     */
    init(options = {}) {
        console.debug("[DashboardPackage] init()", options);
    },

    /**
     * Vollständiges Rendern des Dashboards (Demo oder Live).
     */
    async render(options = {}) {
        const { connected } = options;
        const state = await computeDashboardState(connected);
        renderDashboard(state);
    },

    /**
     * Update bei Filter-/State-Änderungen.
     */
    async update(options = {}) {
        return this.render(options);
    },

    /**
     * Cleanup-Hook (für spätere Erweiterungen).
     */
    destroy() {
        console.debug("[DashboardPackage] destroy()");
    }
};

// Fertiges Modul einfrieren (Schutz vor versehentlicher Mutation)
Object.freeze(DashboardPackage);

export default DashboardPackage;
