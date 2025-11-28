// packages/dashboard/index.js
// Public API für das Dashboard (P1).

import { buildDashboardState } from "./dashboard.compute.js";
import { renderDashboard } from "./dashboard.render.js";

const DashboardPackage = {
    async init() {
        // Platzhalter – später z.B. für Polling, Websocket etc.
        console.debug("[DashboardPackage] init()");
    },

    async render(options = {}) {
        const { connected } = options;
        const state = await buildDashboardState({ connected });
        renderDashboard(state);
    },

    async update(options = {}) {
        return this.render(options);
    },

    destroy() {
        console.debug("[DashboardPackage] destroy()");
    }
};

Object.freeze(DashboardPackage);

export default DashboardPackage;
