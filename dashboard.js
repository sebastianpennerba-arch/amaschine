// dashboard.js
// Legacy-Shim, damit alte Aufrufe weiterhin funktionieren.
// Die eigentliche Logik liegt jetzt vollständig im Dashboard-Package.

import DashboardPackage from "./packages/dashboard/index.js";

/**
 * Alte öffentliche API – wird intern auf das Package gemappt.
 * Damit bleiben bestehende Import-Stellen kompatibel.
 */
export async function updateDashboardView(connected) {
    return DashboardPackage.render({ connected });
}
