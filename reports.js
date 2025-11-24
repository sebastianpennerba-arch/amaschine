// reports.js – Reports & Exports (P6 – Frontend-MVP)
// ---------------------------------------------------
// Exportiert einfache CSV/JSON-Snapshots direkt aus dem Frontend.

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

function triggerDownload(filename, mimeType, content) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function toCsvRow(values) {
    return values
        .map((v) => {
            if (v === null || typeof v === "undefined") return "";
            const s = String(v).replace(/"/g, '""');
            return `"${s}"`;
        })
        .join(",");
}

function exportCampaignsCsv() {
    const campaigns = AppState.meta.campaigns || [];
    if (!campaigns.length) {
        showToast("Keine Kampagnendaten zum Export vorhanden.", "info");
        return;
    }

    const headers = [
        "id",
        "name",
        "status",
        "objective",
        "daily_budget",
        "spend_30d",
        "roas_30d",
        "ctr_30d",
        "impressions_30d",
        "clicks_30d",
        "cpm_30d"
    ];

    const rows = campaigns.map((c) => {
        const m = c.metrics || {};
        const roas =
            m.purchase_roas ||
            (Array.isArray(m.website_purchase_roas) && m.website_purchase_roas.length
                ? m.website_purchase_roas[0].value
                : m.roas || 0);

        return toCsvRow([
            c.id,
            c.name || "",
            c.status || "",
            c.objective || "",
            c.daily_budget || "",
            m.spend || "",
            roas || "",
            m.ctr || "",
            m.impressions || "",
            m.clicks || "",
            m.cpm || ""
        ]);
    });

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    triggerDownload(`signalone_campaigns_${ts}.csv`, "text/csv;charset=utf-8;", csv);
    showToast("Kampagnen-CSV wurde exportiert.", "success");
}

function exportCreativesCsv() {
    const meta = AppState.meta || {};
    const list = (meta.creatives && meta.creatives.length ? meta.creatives : meta.ads) || [];

    if (!Array.isArray(list) || !list.length) {
        showToast("Keine Creatives zum Export vorhanden.", "info");
        return;
    }

    const headers = [
        "id",
        "name",
        "campaign_id",
        "status",
        "spend_30d",
        "roas_30d",
        "ctr_30d",
        "impressions_30d",
        "clicks_30d",
        "cpm_30d"
    ];

    const rows = list.map((ad) => {
        const base = ad || {};
        const insights =
            base.insights?.data?.[0] ||
            base.insights?.[0] ||
            base.metrics ||
            {};

        const roasArr =
            insights.website_purchase_roas ||
            insights.purchase_roas ||
            (base.metrics && base.metrics.website_purchase_roas);

        let roas = 0;
        if (Array.isArray(roasArr) && roasArr.length) {
            roas = Number(roasArr[0].value || 0);
        } else if (typeof insights.roas !== "undefined") {
            roas = Number(insights.roas || 0);
        }

        return toCsvRow([
            base.id,
            base.name || "",
            base.campaign_id || "",
            base.status || "",
            insights.spend || "",
            roas || "",
            insights.ctr || "",
            insights.impressions || "",
            insights.clicks || "",
            insights.cpm || ""
        ]);
    });

    const csv = [toCsvRow(headers), ...rows].join("\n");
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    triggerDownload(`signalone_creatives_${ts}.csv`, "text/csv;charset=utf-8;", csv);
    showToast("Creative-CSV wurde exportiert.", "success");
}

function exportJsonSnapshot() {
    const snapshot = {
        createdAt: new Date().toISOString(),
        selectedAccountId: AppState.selectedAccountId,
        selectedCampaignId: AppState.selectedCampaignId,
        timeRangePreset: AppState.timeRangePreset,
        dashboardMetrics: AppState.dashboardMetrics,
        meta: {
            adAccounts: AppState.meta.adAccounts,
            campaigns: AppState.meta.campaigns,
            insightsByCampaign: AppState.meta.insightsByCampaign,
            creatives: AppState.meta.creatives,
            ads: AppState.meta.ads
        }
    };

    const json = JSON.stringify(snapshot, null, 2);
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    triggerDownload(`signalone_snapshot_${ts}.json`, "application/json", json);
    showToast("JSON Snapshot wurde exportiert.", "success");
}

function attachHandlers(connected) {
    const btnCampaigns = document.getElementById("btnExportCampaignsCsv");
    const btnCreatives = document.getElementById("btnExportCreativesCsv");
    const btnJson = document.getElementById("btnExportJsonSnapshot");

    if (!btnCampaigns || !btnCreatives || !btnJson) return;

    const disable = !connected;

    btnCampaigns.disabled = disable;
    btnCreatives.disabled = disable;
    btnJson.disabled = disable;

    if (disable) return;

    btnCampaigns.addEventListener("click", (e) => {
        e.preventDefault();
        exportCampaignsCsv();
    });

    btnCreatives.addEventListener("click", (e) => {
        e.preventDefault();
        exportCreativesCsv();
    });

    btnJson.addEventListener("click", (e) => {
        e.preventDefault();
        exportJsonSnapshot();
    });
}

/* -------------------------------------------------------
   Public API
---------------------------------------------------------*/

export function updateReportsView(connected) {
    const root = document.getElementById("reportsContent");
    if (!root) return;

    root.innerHTML = `
        <div class="card">
            <div class="reports-actions">
                <button id="btnExportCampaignsCsv" class="action-button">
                    <i class="fas fa-file-csv"></i> Kampagnen als CSV
                </button>
                <button id="btnExportCreativesCsv" class="action-button">
                    <i class="fas fa-file-csv"></i> Creatives als CSV
                </button>
                <button id="btnExportJsonSnapshot" class="action-button-secondary">
                    <i class="fas fa-database"></i> JSON Snapshot
                </button>
            </div>
            <p class="reports-hint">
                Die Exporte berücksichtigen den aktuellen State im Frontend (ausgewähltes Werbekonto, Kampagnen, bereits geladene Creatives).
                In späteren Phasen kann hier ein Backend-basiertes Reporting (inkl. PDF, E-Mail-Reports und Historie) ergänzt werden.
            </p>
            ${
                !connected
                    ? `<p class="reports-hint">
                        <strong>Hinweis:</strong> Aktuell nicht mit Meta verbunden. Verbinde ein Werbekonto, um Live-Daten zu exportieren.
                    </p>`
                    : ""
            }
        </div>
    `;

    attachHandlers(connected);
}
