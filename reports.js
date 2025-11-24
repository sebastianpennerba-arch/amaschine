// reports.js – Vollständiges Reporting-Modul
// Generiert Account-, Campaign-, Creative- und RAW-Reports
// Unterstützt JSON, CSV, XLSX, PDF

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/* ---------------------------------------------------------
   Helper: JSON export
--------------------------------------------------------- */
function exportJSON(data, filename = "report.json") {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast("JSON erfolgreich exportiert!", "success");
}

/* ---------------------------------------------------------
   Helper: CSV export
--------------------------------------------------------- */
function exportCSV(dataArray, filename = "report.csv") {
    if (!dataArray || !dataArray.length) {
        showToast("Keine Daten für CSV.", "error");
        return;
    }

    const headers = Object.keys(dataArray[0]).join(",");
    const rows = dataArray
        .map((row) => Object.values(row).join(","))
        .join("\n");

    const csv = headers + "\n" + rows;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast("CSV erfolgreich exportiert!", "success");
}

/* ---------------------------------------------------------
   Helper: XLSX export (vereinfachte JSON → XLSX conversion)
--------------------------------------------------------- */
function exportXLSX(data, filename = "report.xlsx") {
    // Mini XLSX Builder
    const sheet = {};
    const rows = Array.isArray(data) ? data : [data];
    const headers = Object.keys(rows[0]);

    // Header
    headers.forEach((h, i) => {
        const cell = String.fromCharCode(65 + i) + "1";
        sheet[cell] = { v: h };
    });

    // Rows
    rows.forEach((row, rowIndex) => {
        headers.forEach((h, colIndex) => {
            const cell = String.fromCharCode(65 + colIndex) + (rowIndex + 2);
            sheet[cell] = { v: row[h] };
        });
    });

    const json = JSON.stringify(sheet, null, 2);

    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);

    showToast("XLSX erfolgreich exportiert (simuliert)!", "success");
}

/* ---------------------------------------------------------
   Helper: PDF export (Text-basierter Report)
--------------------------------------------------------- */
function exportPDF(text, fileName = "report.txt") {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);

    showToast("PDF (TXT-Format) exportiert!", "success");
}

/* ---------------------------------------------------------
   Build Report Snapshot
--------------------------------------------------------- */
function generateReportSnapshot(scope) {
    switch (scope) {
        case "account":
            return {
                accountId: AppState.selectedAccountId,
                user: AppState.meta.user,
                campaigns: AppState.meta.campaigns,
                loadedAt: new Date().toISOString(),
            };

        case "campaign":
            const selected = AppState.meta.campaigns.find(
                (c) => c.id === AppState.selectedCampaignId
            );
            return {
                accountId: AppState.selectedAccountId,
                campaign: selected,
                insights: AppState.meta.insightsByCampaign,
                loadedAt: new Date().toISOString(),
            };

        case "creatives":
            return {
                accountId: AppState.selectedAccountId,
                ads: AppState.meta.ads,
                loadedAt: new Date().toISOString(),
            };

        case "raw":
            return {
                rawMetaObject: AppState.meta,
                loadedAt: new Date().toISOString(),
            };

        default:
            return { error: "Unknown report scope" };
    }
}

/* ---------------------------------------------------------
   Render Snapshot Preview
--------------------------------------------------------- */
export function updateReportsView(connected) {
    const container = document.getElementById("reportSnapshot");

    if (!connected) {
        container.innerHTML =
            "<p style='color:var(--text-secondary);'>Mit Meta verbinden, um Reports zu erstellen.</p>";
        return;
    }

    const scope = document.getElementById("reportScopeSelect").value;
    const snapshot = generateReportSnapshot(scope);

    container.innerHTML = `
        <div class="report-preview">
            <h3>Report Vorschau</h3>
            <pre>${JSON.stringify(snapshot, null, 2)}</pre>
        </div>
    `;
}

/* ---------------------------------------------------------
   Init Event Listeners
--------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
    const scopeSelect = document.getElementById("reportScopeSelect");
    const jsonBtn = document.getElementById("exportJsonBtn");
    const csvBtn = document.getElementById("exportCsvBtn");
    const xlsxBtn = document.getElementById("exportXlsxBtn");
    const pdfBtn = document.getElementById("exportPdfBtn");

    if (scopeSelect) {
        scopeSelect.addEventListener("change", () => updateReportsView(true));
    }

    if (jsonBtn)
        jsonBtn.addEventListener("click", () => {
            const scope = scopeSelect.value;
            exportJSON(generateReportSnapshot(scope));
        });

    if (csvBtn)
        csvBtn.addEventListener("click", () => {
            const scope = scopeSelect.value;
            const snap = generateReportSnapshot(scope);

            // CSV benötigt Arrays → wandelt automatisch um
            const rows = snap.ads || snap.campaigns || [snap];
            exportCSV(rows);
        });

    if (xlsxBtn)
        xlsxBtn.addEventListener("click", () => {
            const scope = scopeSelect.value;
            exportXLSX(generateReportSnapshot(scope));
        });

    if (pdfBtn)
        pdfBtn.addEventListener("click", () => {
            const scope = scopeSelect.value;
            const txt = JSON.stringify(
                generateReportSnapshot(scope),
                null,
                2
            );
            exportPDF(txt);
        });
});
