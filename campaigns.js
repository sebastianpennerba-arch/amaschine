// campaigns.js
import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Rendert die Kampagnen-Tabelle (inkl. Status-Badges)
 */
export function renderCampaigns() {
    const container = document.getElementById("campaignsContent");
    if (!container) return;

    const campaigns = AppState.meta.campaigns || [];
    const insights = AppState.meta.insightsByCampaign || {};

    if (campaigns.length === 0) {
        container.innerHTML = `
            <div class="card hero-empty">
                <h3>Campaigns</h3>
                <p>Keine Kampagnen gefunden. Verbinde Meta oder nutze Demo-Daten.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="elite-title">Campaigns</h2>
                <div class="header-date-time">
                    Kampagnen: ${campaigns.length} · Konto: ${AppState.selectedAccountId || "n/a"}
                </div>
            </div>
            <button class="action-button-secondary" id="refreshCampaignsBtn">
                <i class="ri-refresh-line"></i> Refresh
            </button>
        </div>

        <section class="card">
            <table class="campaigns-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Spend</th>
                        <th>Revenue</th>
                        <th>ROAS</th>
                        <th>Impressions</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${campaigns.map(c => renderCampaignRow(c, insights[c.id])).join("")}
                </tbody>
            </table>
        </section>
    `;

    const refreshBtn = document.getElementById("refreshCampaignsBtn");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            // Hook für später: echte Live-Reloads
            showToast("Campaigns aktualisiert (Demo Refresh)", "info");
            renderCampaigns();
        });
    }
}

function renderCampaignRow(c, ins = {}) {
    const name = c.name || c.campaign_name || "Unbenannte Kampagne";
    const status = (c.status || "unknown").toLowerCase();

    const spend = Number(ins.spend || ins.spend_total || 0);
    const revenue = Number(ins.revenue || ins.purchase_value || 0);
    const impressions = Number(ins.impressions || 0);
    const roas = spend > 0 ? revenue / spend : 0;

    const statusClass =
        status.includes("active") ? "status-active" :
        status.includes("pause") ? "status-paused" : "status-failed";

    return `
        <tr>
            <td>${escapeHtml(name)}</td>
            <td><span class="status-badge ${statusClass}">${status.toUpperCase()}</span></td>
            <td>${formatCurrency(spend)}</td>
            <td>${formatCurrency(revenue)}</td>
            <td>${roas ? roas.toFixed(2) + "x" : "–"}</td>
            <td>${impressions.toLocaleString("de-DE")}</td>
            <td>
                <button class="action-button" data-campaign-id="${c.id}" data-action="details">
                    Details
                </button>
            </td>
        </tr>
    `;
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[s]));
}
