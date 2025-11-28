// dashboard.js
// Legacy-Shim: wird von app.js importiert und reicht an das Dashboard-Package weiter.

import DashboardPackage from "./packages/dashboard/index.js";

export async function updateDashboardView(connected) {
    return DashboardPackage.render({ connected });
}

export function initDashboard() {
    if (typeof DashboardPackage.init === "function") {
        DashboardPackage.init();
    }
}
