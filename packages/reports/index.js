// packages/reports/index.js
// Zentrale API für Reports & Exports (P6).

import { buildReportPayload } from "./reports.scope.js";
import { buildJsonReport } from "./reports.json.js";
import { buildCsvReport } from "./reports.csv.js";
import { buildXlsxReport } from "./reports.xlsx.js";
import { buildPdfReport } from "./reports.pdf.js";
import { renderReportSnapshot } from "./reports.snapshot.js";

const ReportsPackage = {
    _currentScope: "account", // "account" | "campaign" | "creatives" | "raw",

    init() {
        console.debug("[ReportsPackage] init()");

        const scopeSelect = document.getElementById("reportScopeSelect");
        const jsonBtn = document.getElementById("exportJsonBtn");
        const csvBtn = document.getElementById("exportCsvBtn");
        const xlsxBtn = document.getElementById("exportXlsxBtn");
        const pdfBtn = document.getElementById("exportPdfBtn");

        if (scopeSelect) {
            this._currentScope = scopeSelect.value || "account";
            scopeSelect.addEventListener("change", (e) => {
                this._currentScope = e.target.value || "account";
                // Snapshot live aktualisieren
                this.render({ connected: true });
            });
        }

        if (jsonBtn) {
            jsonBtn.addEventListener("click", () => this._handleExportClick("json"));
        }
        if (csvBtn) {
            csvBtn.addEventListener("click", () => this._handleExportClick("csv"));
        }
        if (xlsxBtn) {
            xlsxBtn.addEventListener("click", () => this._handleExportClick("xlsx"));
        }
        if (pdfBtn) {
            pdfBtn.addEventListener("click", () => this._handleExportClick("pdf"));
        }
    },

    async render(options = {}) {
        const { connected } = options;
        const scope = this._currentScope || "account";

        const payload = buildReportPayload(scope, { connected });
        renderReportSnapshot(scope, payload);
    },

    async update(options = {}) {
        if (options.scope) {
            this._currentScope = options.scope;
        }
        return this.render(options);
    },

    destroy() {
        console.debug("[ReportsPackage] destroy()");
    },

    _handleExportClick(type) {
        const scope = this._currentScope || "account";
        const payload = buildReportPayload(scope, { connected: true });

        if (type === "json") {
            const blob = buildJsonReport(scope, payload);
            this._downloadBlob(blob, `signalone_${scope}_report.json`);
        } else if (type === "csv") {
            const blob = buildCsvReport(scope, payload);
            this._downloadBlob(blob, `signalone_${scope}_report.csv`);
        } else if (type === "xlsx") {
            const blob = buildXlsxReport(scope, payload);
            if (blob) {
                this._downloadBlob(blob, `signalone_${scope}_report.xlsx`);
            } else {
                alert("XLSX Export ist im aktuellen MVP noch ein Platzhalter.");
            }
        } else if (type === "pdf") {
            const blob = buildPdfReport(scope, payload);
            if (blob) {
                this._downloadBlob(blob, `signalone_${scope}_report.pdf`);
            } else {
                alert("PDF Export ist im aktuellen MVP noch ein Platzhalter.");
            }
        }
    },

    _downloadBlob(blob, filename) {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
};

Object.freeze(ReportsPackage);

export default ReportsPackage;
