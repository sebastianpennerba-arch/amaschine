// reports.js
// Legacy-Shim: leitet die alte Reports-View-API auf das neue Reports Package um
// und initialisiert Buttons/Scope-Select beim App-Start.

import ReportsPackage from "./packages/reports/index.js";

/**
 * Alte öffentliche API, die bisher von app.js genutzt wurde.
 * Wird jetzt intern an das ReportsPackage durchgereicht.
 */
export async function updateReportsView(connected) {
    return ReportsPackage.render({ connected });
}

/**
 * Optionaler Init-Hook, falls du ihn aus app.js aufrufen willst.
 * (app.js kann auch direkt nur updateReportsView() aufrufen – ist kompatibel.)
 */
export function initReports() {
    ReportsPackage.init();
}
