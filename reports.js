// reports.js – Reports & Exports (Frontend P6 Basis)
// --------------------------------------------------
// Dieses Modul baut eine simple Reporting-Oberfläche, die auf
// AppState basiert und zwei Dinge ermöglicht:
// 1) Snapshot-Report direkt im UI
// 2) Export der aktuellen Daten als JSON (Copy & Download)
//
// Später kann man das auf CSV/XLSX/PDF erweitern, ohne das
// Grundgerüst zu ändern.

import { AppState } from "./state.js";
import { showToast, openModal } from "./uiCore.js";

function formatEuro(value) {
    const num = Number(value || 0);
    return `€ ${num.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;
}

function formatPct(value) {
    const num = Number(value || 0);
    return `${num.toFixed(2)}%`;
}

function formatRoas(value) {
    const num = Number(value || 0);
    if (!num) return "0,00x";
    return `${num.toFixed(2)}x`;
}

function getReportPayload() {
    const metrics = AppState.dashboardMetrics || {};
    const campaigns = Array.isArray(AppState.meta?.campaigns)
        ? AppState.meta.campaigns
        : [];
    const creatives = Array.isArray(AppState.meta?.creatives)
        ? AppState.meta.creatives
        : [];

    return {
        generatedAt: new Date().toISOString(),
        metaConnected: AppState.metaConnected,
        selectedAccountId: AppState.selectedAccountId || null,
        selectedCampaignId: AppState.selectedCampaignId || null,
        timeRangePreset: AppState.timeRangePreset || "last_30d",
        summary: {
            spend: Number(metrics.spend || 0),
            roas: Number(metrics.roas || 0),
            ctr: Number(metrics.ctr || 0),
            cpm: Number(metrics.cpm || 0),
        },
        counters: {
            campaigns: campaigns.length,
            creatives: creatives.length,
        },
        campaigns,
        creatives,
    };
}

function buildReportsLayout() {
    const view = document.getElementById("reportsView");
    if (!view) return null;

    view.innerHTML = `
        <h2 class="elite-title">Reports & Exports</h2>

        <div class="card" id="reportsIntroCard">
            <p style="color: var(--text-secondary); font-size:14px;">
                Hier kannst du schnell einen Snapshot deiner aktuellen Meta-Performance
                erzeugen und als JSON exportieren. Später kommen CSV/Excel/PDF-Exports dazu.
            </p>
        </div>

        <div class="card" id="reportsSummaryCard">
            <!-- Summary-Table wird dynamisch gesetzt -->
        </div>

        <div class="card" id="reportsActionsCard">
            <div style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                <button class="action-button-primary" id="exportJsonButton">
                    <i class="fas fa-file-code"></i> JSON kopieren
                </button>
                <button class="action-button-secondary" id="downloadJsonButton">
                    <i class="fas fa-download"></i> JSON herunterladen
                </button>
                <button class="action-button-secondary" id="openPreviewButton">
                    <i class="fas fa-eye"></i> Snapshot im Modal anzeigen
                </button>
            </div>
            <p style="margin-top:8px; color: var(--text-secondary); font-size:12px;">
                Exporte respektieren deinen aktuellen Zeitrange und die geladenen Meta-Daten.
            </p>
        </div>
    `;

    return {
        summaryCard: document.getElementById("reportsSummaryCard"),
        actionsCard: document.getElementById("reportsActionsCard"),
    };
}

function renderSummary(summaryCard, payload) {
    if (!summaryCard) return;

    const { summary, counters, metaConnected, timeRangePreset } = payload;

    if (!metaConnected) {
        summaryCard.innerHTML = `
            <p style="color: var(--text-secondary); font-size:14px;">
                Noch keine Verbindung zu Meta. Verbinde dein Konto im Dashboard,
                um Reports zu generieren.
            </p>
        `;
        return;
    }

    summaryCard.innerHTML = `
        <h3 style="margin-bottom:8px;">Report Snapshot</h3>
        <p style="color: var(--text-secondary); font-size:13px; margin-bottom:8px;">
            Zeitraum: <strong>${timeRangePreset}</strong><br />
            Generiert am: <strong>${new Date(payload.generatedAt).toLocaleString("de-DE")}</strong>
        </p>

        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <tbody>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">Kampagnen</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${counters.campaigns}</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">Creatives</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${counters.creatives}</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">Spend (Zeitraum)</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${formatEuro(summary.spend)}</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">ROAS (gewichtet)</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${formatRoas(summary.roas)}</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">CTR</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${formatPct(summary.ctr)}</strong></td>
                </tr>
                <tr>
                    <td style="padding:4px 0; color:var(--text-secondary);">CPM</td>
                    <td style="padding:4px 0; text-align:right;"><strong>${formatEuro(summary.cpm)}</strong></td>
                </tr>
            </tbody>
        </table>
    `;
}

function attachExportHandlers(payload) {
    const exportBtn = document.getElementById("exportJsonButton");
    const downloadBtn = document.getElementById("downloadJsonButton");
    const previewBtn = document.getElementById("openPreviewButton");

    const json = JSON.stringify(payload, null, 2);

    if (exportBtn) {
        exportBtn.onclick = async () => {
            try {
                await navigator.clipboard.writeText(json);
                showToast("success", "Report JSON wurde in die Zwischenablage kopiert.");
            } catch (e) {
                console.error("Clipboard Error", e);
                showToast(
                    "error",
                    "Konnte JSON nicht kopieren. Bitte manuell aus der Preview kopieren."
                );
            }
        };
    }

    if (downloadBtn) {
        downloadBtn.onclick = () => {
            try {
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `signalone_report_${Date.now()}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showToast("success", "Report JSON wurde heruntergeladen.");
            } catch (e) {
                console.error("Download Error", e);
                showToast("error", "Fehler beim Download des Reports.");
            }
        };
    }

    if (previewBtn) {
        previewBtn.onclick = () => {
            const safeJson = json
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");

            openModal(
                "Report Snapshot (JSON)",
                `<pre style="
                    max-height:60vh;
                    overflow:auto;
                    font-size:11px;
                    background:#0f172a;
                    color:#e5e7eb;
                    padding:12px;
                    border-radius:8px;
                ">${safeJson}</pre>`
            );
        };
    }
}

// Public API – wird von app.js aufgerufen
// ---------------------------------------
export function updateReportsView(connected) {
    const view = document.getElementById("reportsView");
    if (!view) return;

    const layout = buildReportsLayout();
    if (!layout) return;

    const payload = getReportPayload();
    renderSummary(layout.summaryCard, {
        ...payload,
        metaConnected: connected && AppState.metaConnected,
    });
    attachExportHandlers(payload);
}
