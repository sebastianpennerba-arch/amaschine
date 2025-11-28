// reports.js – FINAL VERSION (Export Suite)

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Entry-Point
 * app.js ruft: updateReportsView(hasData)
 */
export function updateReportsView(hasData) {
    const summaryBox = document.getElementById("reportsSummaryContainer");
    const tableBox = document.getElementById("reportsTableContainer");
    const exportBox = document.getElementById("reportsExportContainer");

    if (!summaryBox || !tableBox || !exportBox) return;

    if (!hasData) {
        summaryBox.innerHTML = `<div class="card hero-empty"><p>Keine Daten geladen.</p></div>`;
        tableBox.innerHTML = "";
        exportBox.innerHTML = "";
        return;
    }

    const campaigns = AppState.meta?.campaigns || [];
    const insights = AppState.meta?.insightsByCampaign || {};

    const metrics = aggregateMetrics(campaigns, insights);

    // Panels rendern
    summaryBox.innerHTML = renderSummary(metrics);
    tableBox.innerHTML = renderCampaignTable(campaigns, insights);
    exportBox.innerHTML = renderExports();

    attachExportHandlers(campaigns, insights, metrics);
}

/* ============================================================
   SUMMARY PANEL
============================================================ */

function renderSummary(m) {
    return `
        <section class="card">
            <h3 class="section-title"><i class="fas fa-file-lines"></i> Summary</h3>
            <div class="summary-list">
                <div class="summary-row">
                    <span>Total Spend:</span>
                    <span>${fmtE(m.totalSpend)}</span>
                </div>
                <div class="summary-row">
                    <span>Total Revenue:</span>
                    <span>${fmtE(m.totalRevenue)}</span>
                </div>
                <div class="summary-row">
                    <span>ROAS:</span>
                    <span>${m.roas ? m.roas.toFixed(2) + "x" : "–"}</span>
                </div>
                <div class="summary-row">
                    <span>Kampagnen:</span>
                    <span>${m.count}</span>
                </div>
            </div>
        </section>
    `;
}

/* ============================================================
   CAMPAIGN TABLE
============================================================ */

function renderCampaignTable(campaigns, insights) {
    if (!campaigns.length) {
        return `<div class="card"><p>Keine Kampagnen gefunden.</p></div>`;
    }

    return `
        <div class="card">
            <h3 class="section-title"><i class="fas fa-table"></i> Kampagnen-Detail</h3>
            <table class="campaigns-table">
                <thead>
                    <tr>
                        <th>Kampagne</th>
                        <th>Status</th>
                        <th>Spend</th>
                        <th>Revenue</th>
                        <th>ROAS</th>
                        <th>Impressions</th>
                        <th>Clicks</th>
                    </tr>
                </thead>
                <tbody>
                    ${campaigns
                        .map((c) => {
                            const ins = insights[c.id] || {};

                            const spend = num(ins.spend ?? ins.spend_total);
                            const rev = num(ins.revenue ?? ins.purchase_value);
                            const impressions = num(ins.impressions);
                            const clicks = num(ins.clicks);
                            const roas = spend > 0 ? rev / spend : 0;

                            return `
                                <tr>
                                    <td>${esc(c.name || c.campaign_name || "N/A")}</td>
                                    <td>${esc(c.status || "N/A")}</td>
                                    <td>${fmtE(spend)}</td>
                                    <td>${fmtE(rev)}</td>
                                    <td>${roas ? roas.toFixed(2) + "x" : "–"}</td>
                                    <td>${fmt(impressions)}</td>
                                    <td>${fmt(clicks)}</td>
                                </tr>
                            `;
                        })
                        .join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* ============================================================
   EXPORT PANEL
============================================================ */

function renderExports() {
    return `
        <div class="card">
            <h3 class="section-title"><i class="fas fa-download"></i> Exporte</h3>

            <button class="action-button-secondary" id="exportSummaryCsv">
                Summary CSV
            </button>

            <button class="action-button-secondary" id="exportCampaignCsv">
                Kampagnen CSV
            </button>

            <button class="action-button-secondary" id="exportInsightsCsv">
                Insights CSV
            </button>

            <button class="action-button-secondary" id="exportJson">
                JSON Export
            </button>
        </div>
    `;
}

/* ============================================================
   EXPORT HANDLERS
============================================================ */

function attachExportHandlers(campaigns, insights, metrics) {
    const btnSummary = document.getElementById("exportSummaryCsv");
    const btnCampaign = document.getElementById("exportCampaignCsv");
    const btnInsights = document.getElementById("exportInsightsCsv");
    const btnJson = document.getElementById("exportJson");

    if (btnSummary) {
        btnSummary.addEventListener("click", () => {
            downloadCsv("summary.csv", buildSummaryCsv(metrics));
        });
    }

    if (btnCampaign) {
        btnCampaign.addEventListener("click", () => {
            downloadCsv("campaigns.csv", buildCampaignCsv(campaigns, insights));
        });
    }

    if (btnInsights) {
        btnInsights.addEventListener("click", () => {
            downloadCsv("insights.csv", buildInsightsCsv(campaigns, insights));
        });
    }

    if (btnJson) {
        btnJson.addEventListener("click", () => {
            const json = JSON.stringify({ campaigns, insights, metrics }, null, 2);
            downloadFile("report.json", json);
        });
    }
}

/* ============================================================
   CSV GENERATORS
============================================================ */

function buildSummaryCsv(m) {
    return (
        "Metric,Value\n" +
        `Total Spend,${m.totalSpend}\n` +
        `Total Revenue,${m.totalRevenue}\n` +
        `ROAS,${m.roas}\n` +
        `Count Campaigns,${m.count}`
    );
}

function buildCampaignCsv(campaigns, insights) {
    const header = "Name,Status,Spend,Revenue,ROAS,Impressions,Clicks\n";

    const rows = campaigns
        .map((c) => {
            const ins = insights[c.id] || {};
            const spend = num(ins.spend ?? ins.spend_total);
            const rev = num(ins.revenue ?? ins.purchase_value);
            const im = num(ins.impressions);
            const cl = num(ins.clicks);
            const roas = spend > 0 ? rev / spend : 0;

            return [
                esc(c.name || c.campaign_name),
                c.status,
                spend,
                rev,
                roas,
                im,
                cl
            ]
                .map(csvSafe)
                .join(",");
        })
        .join("\n");

    return header + rows;
}

function buildInsightsCsv(campaigns, insights) {
    const header = "CampaignId,Spend,Revenue,ROAS,Impressions,Clicks\n";

    const rows = campaigns
        .map((c) => {
            const ins = insights[c.id] || {};
            const spend = num(ins.spend ?? ins.spend_total);
            const rev = num(ins.revenue ?? ins.purchase_value);
            const im = num(ins.impressions);
            const cl = num(ins.clicks);
            const roas = spend > 0 ? rev / spend : 0;

            return [c.id, spend, rev, roas, im, cl].map(csvSafe).join(",");
        })
        .join("\n");

    return header + rows;
}

/* ============================================================
   HELPERS
============================================================ */

function aggregateMetrics(camps, insMap) {
    let spend = 0;
    let rev = 0;

    camps.forEach((c) => {
        const ins = insMap[c.id] || {};
        spend += num(ins.spend ?? ins.spend_total);
        rev += num(ins.revenue ?? ins.purchase_value);
    });

    return {
        totalSpend: spend,
        totalRevenue: rev,
        roas: spend > 0 ? rev / spend : 0,
        count: camps.length
    };
}

function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function fmtE(v) {
    return Number(v || 0).toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    });
}

function fmt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

function esc(str) {
    return String(str || "").replace(/[&<>"']/g, "_");
}

function csvSafe(v) {
    const s = String(v ?? "");
    if (s.includes(",") || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
}

function downloadCsv(filename, text) {
    const blob = new Blob([text], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, filename);
}

function downloadFile(filename, text) {
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    downloadUrl(url, filename);
}

function downloadUrl(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}
