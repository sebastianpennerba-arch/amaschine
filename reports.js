// reports.js
import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Reports View – zeigt einfache Export-Optionen
 * und eine Zusammenfassung der wichtigsten Zahlen.
 */
export function renderReports() {
    const container = document.getElementById("reportsContent");
    if (!container) return;

    const { campaigns, insightsByCampaign } = AppState.meta;
    const metrics = aggregate(campaigns || [], insightsByCampaign || {});

    container.innerHTML = `
        <section class="card">
            <div class="view-header">
                <div>
                    <h2 class="elite-title">Reports & Exports</h2>
                    <p class="reports-hint">
                        Exportiere Account-Performance und Testing-Daten für Kunden oder interne Reviews.
                    </p>
                </div>
                <div class="reports-actions">
                    <button class="action-button-secondary" id="exportSummaryBtn">
                        <i class="ri-download-2-line"></i> Summary als CSV
                    </button>
                    <button class="action-button-secondary" id="exportCampaignsBtn">
                        <i class="ri-download-cloud-2-line"></i> Kampagnen-Detail CSV
                    </button>
                </div>
            </div>

            <div class="hero-card">
                <div class="hero-title">Account Summary</div>
                <div class="hero-metric-row">
                    <span>Total Spend</span>
                    <span class="hero-metric-value">${formatCurrency(metrics.totalSpend)}</span>
                </div>
                <div class="hero-metric-row">
                    <span>Total Revenue</span>
                    <span class="hero-metric-value">${formatCurrency(metrics.totalRevenue)}</span>
                </div>
                <div class="hero-metric-row">
                    <span>ROAS</span>
                    <span class="hero-metric-value">${metrics.roas ? metrics.roas.toFixed(2) + "x" : "–"}</span>
                </div>
                <div class="hero-metric-row">
                    <span>Kampagnen</span>
                    <span class="hero-metric-value">${metrics.countCampaigns}</span>
                </div>
            </div>
        </section>
    `;

    const exportSummaryBtn = document.getElementById("exportSummaryBtn");
    const exportCampaignsBtn = document.getElementById("exportCampaignsBtn");

    if (exportSummaryBtn) {
        exportSummaryBtn.addEventListener("click", () => {
            showToast("Summary CSV Export (Demo Placeholder).", "info");
        });
    }

    if (exportCampaignsBtn) {
        exportCampaignsBtn.addEventListener("click", () => {
            showToast("Campaigns CSV Export (Demo Placeholder).", "info");
        });
    }
}

function aggregate(campaigns, insightsByCampaign) {
    let spend = 0;
    let rev = 0;

    campaigns.forEach(c => {
        const ins = insightsByCampaign[c.id] || {};
        spend += Number(ins.spend || 0);
        rev += Number(ins.revenue || 0);
    });

    return {
        totalSpend: spend,
        totalRevenue: rev,
        roas: spend > 0 ? rev / spend : 0,
        countCampaigns: campaigns.length
    };
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
