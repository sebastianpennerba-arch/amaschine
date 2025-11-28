// packages/reports/reports.xlsx.js
// XLSX Export – im MVP als Wrapper um CSV (damit Excel-Dateien trotzdem gehen).

import { buildCsvReport } from "./reports.csv.js";

/**
 * Im MVP geben wir einfach eine CSV als XLSX-MimeType aus.
 * Später kannst du hier eine echte XLSX-Engine (z.B. SheetJS) einbauen.
 */
export function buildXlsxReport(scope, payload) {
    const csvBlob = buildCsvReport(scope, payload);
    if (!csvBlob) return null;

    // Gleicher Inhalt, anderer Mime Type + Dateiendung.
    return new Blob([csvBlob], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
}
