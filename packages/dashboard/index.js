// packages/dashboard/index.js
// Dashboard Package – öffentlicher Einstiegspunkt (API-Skelett)

import { renderDashboardPlaceholder } from "./dashboard.render.js";

const DashboardPackage = {
    /**
     * Initialisierungshook – einmalig beim App-Start.
     */
    init(options = {}) {
        console.debug("[DashboardPackage] init()", options);
    },

    /**
     * Vollständiges Rendern des Dashboards.
     */
    render(options = {}) {
        console.debug("[DashboardPackage] render()", options);
        renderDashboardPlaceholder(options);
    },

    /**
     * Update bei State-/Filter-Änderungen.
     */
    update(options = {}) {
        console.debug("[DashboardPackage] update()", options);
        renderDashboardPlaceholder(options);
    },

    /**
     * Cleanup, falls nötig (Event-Listener etc.).
     */
    destroy() {
        console.debug("[DashboardPackage] destroy()");
    }
};

export default DashboardPackage;
