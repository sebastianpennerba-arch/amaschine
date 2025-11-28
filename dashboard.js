// dashboard.js
// Legacy-Shim: wird von app.js importiert und reicht ans DashboardPackage weiter.

import DashboardPackage from "./packages/dashboard/index.js";

export async function updateDashboardView(connected) {
    return DashboardPackage.render({ connected });
}

export function initDashboard() {
    if (DashboardPackage.init) DashboardPackage.init();
}
