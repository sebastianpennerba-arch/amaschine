// packages/dashboard/index.js
// Public API für das Dashboard (Phase 1 – FINAL)

import { buildDashboardState } from "./dashboard.compute.js";
import { renderDashboard } from "./dashboard.render.js";

const DashboardPackage = {
    async init() {
        console.debug("[DashboardPackage] init()");
        // Platz für zukünftige Polling-/WebSocket- oder Prefetch-Logik.
    },

    async render(options = {}) {
        const state = await buildDashboardState({
            connected: options.connected
        });
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
