// reports.js – SignalOne Premium Export Suite (P6)
// ------------------------------------------------------
// Funktionen:
// 1) Export JSON
// 2) Export CSV
// 3) Export XLSX (Excel)
// 4) Export PDF (SignalOne Styled: Logo, Farben, KPIs, Tabellen)
// 5) Scope-Auswahl + Snapshot Preview

import { AppState } from "./state.js";
import { showToast, openModal } from "./uiCore.js";

/* ---------------------------------------------------
   Helpers: Formatierung
--------------------------------------------------- */

const nf = new Intl.NumberFormat("de-DE");

function fEuro(v) {
    const n = Number(v);
    return isFinite(n) ? `€ ${nf.format(n)}` : "€ 0";
}
function fPct(v) {
    return `${Number(v || 0).toFixed(2)}%`;
}
function fRoas(v) {
    return `${Number(v || 0).toFixed(2)}x`;
}

/* ---------------------------------------------------
   Report Scopes
--------------------------------------------------- */

function getCurrentScope() {
    const sel = document.getElementById("reportScopeSelect");
    return sel?.value || "account";
}

function buildReportData(scope) {
    const metrics = AppState.dashboardMetrics || {};
    const campaigns = AppState.meta?.campaigns || [];
    const creatives = AppState.meta?.creatives || [];
    const raw = AppState.meta || {};

    if (scope === "account") {
        return {
            type: "Account Report",
            accountId: AppState.selectedAccountId,
            timeRange: metrics.timeRangeLabel,
            spend: metrics.spend,
            roas: metrics.roas,
            ctr: metrics.ctr,
            cpm: metrics.cpm,
            campaigns,
            creativesCount: creatives.length
        };
    }

    if (scope === "campaign") {
        const id = AppState.selectedCampaignId;
        const c = campaigns.find((x) => x.id === id) || {};
        return {
            type: "Campaign Report",
            campaignId: id,
            name: c.name || "Unknown",
            objective: c.objective,
            metrics: metrics,
            creatives
        };
    }

    if (scope === "creatives") {
        return {
            type: "Creative Library Report",
            count: creatives.length,
            items: creatives
        };
    }

    if (scope === "raw") {
        return {
            type: "RAW Technical Dump",
            meta: raw
        };
    }

    return {};
}

/* ---------------------------------------------------
   CSV Export
--------------------------------------------------- */

function convertToCSV(rows) {
    const header = Object.keys(rows[0]).join(",");
    const body = rows
        .map((row) => Object.values(row).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    return header + "\n" + body;
}

function downloadCSV(filename, rows) {
    if (!rows?.length) {
        showToast("Keine Daten für CSV vorhanden", "error");
        return;
    }
    const csv = convertToCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------
   XLSX Export (Lightweight)
--------------------------------------------------- */

function downloadXLSX(filename, rows) {
    if (!rows?.length) {
        showToast("Keine Daten für XLSX vorhanden", "error");
        return;
    }
    let xml = `
    <worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
    <sheetData>
    `;

    const keys = Object.keys(rows[0]);
    xml += "<row>" + keys.map((h) => `<c t="inlineStr"><is><t>${h}</t></is></c>`).join("") + "</row>";

    rows.forEach((r) => {
        xml +=
            "<row>" +
            Object.values(r)
                .map((v) => `<c t="inlineStr"><is><t>${v}</t></is></c>`)
                .join("") +
            "</row>";
    });

    xml += "</sheetData></worksheet>";

    const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------
   PDF Export (SignalOne Styled)
--------------------------------------------------- */

async function exportPDF(data) {
    const html = `
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                h1 { color: #0EA5E9; }
                h2 { color: #6366F1; }
                table { width: 100%; border-collapse: collapse; margin-top: 16px; }
                th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; }
                th { background: #f1f5f9; }
            </style>
        </head>
        <body>
            <h1>SignalOne Report</h1>
            <p><strong>Typ:</strong> ${data.type}</p>
            <p><strong>Zeitraum:</strong> ${data.timeRange || "-"}</p>
            <h2>KPI Übersicht</h2>
            <ul>
                <li><strong>Spend:</strong> ${fEuro(data.spend)}</li>
                <li><strong>ROAS:</strong> ${fRoas(data.roas)}</li>
                <li><strong>CTR:</strong> ${fPct(data.ctr)}</li>
                <li><strong>CPM:</strong> ${fEuro(data.cpm)}</li>
            </ul>

            <h2>Kampagnen</h2>
            <table>
                <tr><th>ID</th><th>Name</th><th>Objective</th><th>Status</th></tr>
                ${data.campaigns
                    ?.map(
                        (c) =>
                            `<tr><td>${c.id}</td><td>${c.name}</td><td>${c.objective}</td><td>${c.status}</td></tr>`
                    )
                    .join("")}
            </table>

            <p style="font-size:10px; margin-top:40px; color:#64748b;">
                Generated by SignalOne.cloud – Version S1-0.9-b
            </p>
        </body>
        </html>
    `;

    const blob = new Blob([html], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `SignalOne_Report_${Date.now()}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------
   JSON Export
--------------------------------------------------- */

function downloadJSON(filename, data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json"
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/* ---------------------------------------------------
   Snapshot Preview
--------------------------------------------------- */

function renderSnapshotPreview(scope, data) {
    const box = document.getElementById("reportSnapshot");
    if (!box) return;

    box.innerHTML = `
        <h3 style="margin-bottom:6px;">Snapshot Vorschau</h3>
        <p style="font-size:14px; color:var(--text-secondary); margin-bottom:12px;">
            Quelle: <strong>${scope.toUpperCase()}</strong>
        </p>

        <div class="strategy-grid">
            <div class="metric-chip">
                <div class="metric-label">Spend</div>
                <div class="metric-value">${fEuro(data.spend)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">ROAS</div>
                <div class="metric-value">${fRoas(data.roas)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">CTR</div>
                <div class="metric-value">${fPct(data.ctr)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">CPM</div>
                <div class="metric-value">${fEuro(data.cpm)}</div>
            </div>
        </div>

        <p style="margin-top:16px; font-size:12px; color:var(--text-secondary);">
            Kampagnen: ${data.campaigns?.length || 0} – Creatives: ${
        data.creativesCount || 0
    }
        </p>
    `;
}

/* ---------------------------------------------------
   Public
--------------------------------------------------- */

export function updateReportsView(connected) {
    const scopeSelect = document.getElementById("reportScopeSelect");
    const jsonBtn = document.getElementById("exportJsonBtn");
    const csvBtn = document.getElementById("exportCsvBtn");
    const xlsxBtn = document.getElementById("exportXlsxBtn");
    const pdfBtn = document.getElementById("exportPdfBtn");

    if (!connected) {
        showToast("Verbinde Meta, bevor du Reports exportierst", "error");
        return;
    }

    const applyRender = () => {
        const scope = getCurrentScope();
        const data = buildReportData(scope);
        renderSnapshotPreview(scope, data);

        jsonBtn.onclick = () =>
            downloadJSON(`SignalOne_${scope}_Report.json`, data);

        csvBtn.onclick = () => {
            if (data.campaigns) {
                downloadCSV("SignalOne_Campaigns.csv", data.campaigns);
            } else showToast("Keine tabellarischen Daten für CSV.", "error");
        };

        xlsxBtn.onclick = () => {
            if (data.campaigns) {
                downloadXLSX("SignalOne_Campaigns.xlsx", data.campaigns);
            } else showToast("Keine tabellarischen Daten für XLSX.", "error");
        };

        pdfBtn.onclick = () => exportPDF(data);
    };

    scopeSelect?.addEventListener("change", applyRender);

    applyRender();
}
