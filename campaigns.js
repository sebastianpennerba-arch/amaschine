// campaigns.js – FINAL VERSION (Datads Premium Style: Heatmap + KPIs)

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

let controlsInitialized = false;

/**
 * Entry-Point aus app.js
 * app.js ruft: updateCampaignsView(dataConnected)
 */
export function updateCampaignsView(hasData) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    if (!hasData) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <span style="color: var(--text-secondary); font-size:14px;">
                        Keine Daten geladen. Verbinde Meta Ads oder aktiviere den Demo Mode in den Einstellungen.
                    </span>
                </td>
            </tr>
        `;
        return;
    }

    if (!controlsInitialized) {
        initControls();
        controlsInitialized = true;
    }

    renderCampaignsTable();
}

/* ============================================================
   CONTROLS (Search + Status Filter)
============================================================ */

function initControls() {
    const searchInput = document.getElementById("campaignSearch");
    const statusFilter = document.getElementById("campaignStatusFilter");

    const rerender = () => renderCampaignsTable();

    if (searchInput) searchInput.addEventListener("input", rerender);
    if (statusFilter) statusFilter.addEventListener("change", rerender);
}

/* ============================================================
   MAIN RENDER
============================================================ */

function renderCampaignsTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    const campaigns = AppState.meta?.campaigns || [];
    const insightsByCampaign = AppState.meta?.insightsByCampaign || {};

    if (!campaigns.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <span style="color: var(--text-secondary); font-size:14px;">
                        Keine Kampagnen gefunden. Verbinde Meta oder nutze Demo-Daten.
                    </span>
                </td>
            </tr>
        `;
        return;
    }

    const filterState = getFilterState();
    const decorated = decorateCampaignsWithMetrics(campaigns, insightsByCampaign);
    let filtered = applyCampaignFilters(decorated, filterState);

    // Default: sort nach Spend desc
    filtered.sort((a, b) => b.metrics.spend - a.metrics.spend);

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <span style="color: var(--text-secondary); font-size:14px;">
                        Keine Kampagnen für die aktuelle Filterung gefunden.
                    </span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(renderCampaignRow).join("");

    attachRowActions();
}

/* ============================================================
   FILTER STATE + FILTER LOGIK
============================================================ */

function getFilterState() {
    const searchInput = document.getElementById("campaignSearch");
    const statusFilter = document.getElementById("campaignStatusFilter");

    return {
        search: (searchInput?.value || "").trim().toLowerCase(),
        status: (statusFilter?.value || "all").toUpperCase()
    };
}

function applyCampaignFilters(list, filterState) {
    const { search, status } = filterState;

    let result = list;

    if (status !== "all".toUpperCase() && status !== "ALL") {
        result = result.filter((c) => {
            const s = (c.status || "UNKNOWN").toUpperCase();
            return s.includes(status);
        });
    }

    if (search) {
        result = result.filter((c) => {
            const haystack = [
                c.name,
                c.objective,
                c.id,
                c.accountId
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();
            return haystack.includes(search);
        });
    }

    return result;
}

/* ============================================================
   NORMALISIERUNG + METRIKEN
============================================================ */

function decorateCampaignsWithMetrics(campaigns, insightsByCampaign = {}) {
    return campaigns.map((c) => {
        const ins = insightsByCampaign[c.id] || {};
        const spend = toNumber(ins.spend ?? ins.spend_total);
        const revenue = toNumber(ins.revenue ?? ins.purchase_value);
        const impressions = toNumber(ins.impressions);
        const clicks = toNumber(ins.clicks);
        const ctrExplicit = toNumber(ins.ctr);
        const roasExplicit = toNumber(ins.roas);

        const ctr =
            ctrExplicit || (impressions > 0 ? (clicks / impressions) * 100 : 0);
        const roas =
            roasExplicit || (spend > 0 ? revenue / spend : 0);

        const status = (c.status || "UNKNOWN").toUpperCase();
        const objective = c.objective || c.objective_type || "N/A";

        // Budget-Normalisierung (Daily / Lifetime)
        const dailyBudget = normalizeBudget(c);

        return {
            ...c,
            status,
            objective,
            accountId: c.account_id || c.ad_account_id || null,
            dailyBudget,
            metrics: {
                spend,
                revenue,
                impressions,
                clicks,
                ctr,
                roas
            }
        };
    });
}

function normalizeBudget(campaign) {
    const c = campaign || {};
    const daily = toNumber(c.daily_budget);
    const lifetime = toNumber(c.lifetime_budget);

    if (daily > 0) return daily;
    if (lifetime > 0) {
        // Grobe Approximation für Tabelle: Lifetime / 30
        return lifetime / 30;
    }
    return 0;
}

/* ============================================================
   ROW RENDER (Datads Premium Style)
============================================================ */

function renderCampaignRow(c) {
    const m = c.metrics;

    const statusClass =
        c.status.includes("ACTIVE")
            ? "status-active"
            : c.status.includes("PAUSED")
            ? "status-paused"
            : "status-failed";

    const roasHeat = Math.max(0, Math.min(100, m.roas * 20)); // ROAS 0–5 → 0–100%
    const ctrHeat = Math.max(0, Math.min(100, m.ctr)); // CTR 0–100%

    const roasBg =
        roasHeat === 0
            ? "transparent"
            : `linear-gradient(90deg, rgba(22,163,74,0.12) 0%, rgba(22,163,74,0.3) ${roasHeat}%, transparent ${roasHeat}%)`;

    const ctrBg =
        ctrHeat === 0
            ? "transparent"
            : `linear-gradient(90deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.3) ${ctrHeat}%, transparent ${ctrHeat}%)`;

    const name = c.name || c.campaign_name || "Unbenannte Kampagne";

    return `
        <tr data-campaign-id="${escapeAttr(c.id)}">
            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(c.status)}
                </span>
            </td>
            <td>
                <strong>${escapeHtml(name)}</strong><br/>
                <span style="font-size:12px; color:var(--text-secondary);">
                    ${escapeHtml(c.objective)}
                </span>
            </td>
            <td>${escapeHtml(c.objective)}</td>
            <td>${formatCurrency(c.dailyBudget)}</td>
            <td>${formatCurrency(m.spend)}</td>
            <td style="background:${roasBg};">
                ${m.roas ? m.roas.toFixed(2) + "x" : "–"}
            </td>
            <td style="background:${ctrBg};">
                ${m.ctr ? m.ctr.toFixed(2) + "%" : "–"}
            </td>
            <td>${formatShort(m.impressions)}</td>
            <td>
                <button class="action-button" data-action="details">
                    Details
                </button>
            </td>
        </tr>
    `;
}

/* ============================================================
   ROW ACTIONS
============================================================ */

function attachRowActions() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.querySelectorAll("button[data-action='details']").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tr = btn.closest("tr");
            if (!tr) return;
            const id = tr.getAttribute("data-campaign-id");
            const campaign = (AppState.meta?.campaigns || []).find((c) => c.id === id);
            const ins = AppState.meta?.insightsByCampaign?.[id] || {};
            openCampaignDetailsModal(campaign, ins);
        });
    });
}

function openCampaignDetailsModal(campaign, insights) {
    if (!campaign) {
        showToast("Keine Details zu dieser Kampagne gefunden.", "error");
        return;
    }

    const name = campaign.name || campaign.campaign_name || "Unbenannte Kampagne";
    const objective = campaign.objective || "N/A";
    const status = campaign.status || "UNKNOWN";

    const spend = toNumber(insights.spend ?? insights.spend_total);
    const revenue = toNumber(insights.revenue ?? insights.purchase_value);
    const impressions = toNumber(insights.impressions);
    const clicks = toNumber(insights.clicks);
    const ctr =
        impressions > 0 ? (clicks / impressions) * 100 : toNumber(insights.ctr);
    const roas = spend > 0 ? revenue / spend : toNumber(insights.roas);

    // Für jetzt: Einfach ein Toast + console.
    console.log("Campaign Details", { campaign, insights });

    showToast(
        `Kampagne: ${name}\nStatus: ${status}\nObjective: ${objective}\nSpend: ${formatCurrency(
            spend
        )}\nROAS: ${roas ? roas.toFixed(2) + "x" : "–"}`,
        "info",
        5000
    );
}

/* ============================================================
   HELPERS
============================================================ */

function toNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    });
}

function formatShort(v) {
    const num = Number(v || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString("de-DE");
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (s) =>
        ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[s])
    );
}

function escapeAttr(str) {
    return escapeHtml(str);
}
