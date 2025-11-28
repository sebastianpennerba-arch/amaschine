// dashboard.js
import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Dashboard Renderer
 * Zeigt KPI-Karten + ein paar Demo-Hero-Boxen.
 */
export function renderDashboard() {
    const container = document.getElementById("dashboardContent");
    if (!container) return;

    const { campaigns, insightsByCampaign } = AppState.meta;

    if (!campaigns || campaigns.length === 0) {
        container.innerHTML = `
            <div class="card hero-empty">
                <h2 class="elite-title">Dashboard</h2>
                <p>Keine Kampagnen gefunden. Verbinde Meta oder aktiviere den Demo Mode.</p>
            </div>
        `;
        return;
    }

    const metrics = aggregateMetrics(campaigns, insightsByCampaign);

    container.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="elite-title">Dashboard</h2>
                <div class="header-date-time">
                    Aktives Konto: ${AppState.selectedAccountId || "n/a"} · 
                    Kampagnen: ${campaigns.length}
                </div>
            </div>
        </div>

        <section class="card">
            <div class="kpi-grid">
                ${renderKpiCard("Ad Spend", metrics.totalSpend, "€", metrics.spendTrend)}
                ${renderKpiCard("Revenue", metrics.totalRevenue, "€", metrics.revTrend)}
                ${renderKpiCard("ROAS", metrics.avgRoas, "x", metrics.roasTrend)}
                ${renderKpiCard("Impressions", metrics.totalImpressions, "", null)}
            </div>
        </section>

        <section class="card hero-card">
            <h3 class="hero-title">Kampagnen-Performance Snapshot</h3>
            ${renderTopCampaigns(campaigns, insightsByCampaign)}
        </section>
    `;
}

function aggregateMetrics(campaigns, insightsByCampaign = {}) {
    let spend = 0;
    let revenue = 0;
    let impressions = 0;
    let roasSum = 0;
    let roasCount = 0;

    campaigns.forEach(c => {
        const ins = insightsByCampaign[c.id] || {};
        const s = Number(ins.spend || ins.spend_total || 0);
        const r = Number(ins.revenue || ins.purchase_value || 0);
        const i = Number(ins.impressions || 0);
        const roas = Number(ins.roas || (s > 0 ? r / s : 0));

        spend += s;
        revenue += r;
        impressions += i;

        if (roas > 0) {
            roasSum += roas;
            roasCount++;
        }
    });

    return {
        totalSpend: spend,
        totalRevenue: revenue,
        totalImpressions: impressions,
        avgRoas: roasCount > 0 ? roasSum / roasCount : 0,
        spendTrend: null,
        revTrend: null,
        roasTrend: null
    };
}

function renderKpiCard(label, value, suffix = "", trend = null) {
    const formatted = formatNumber(value, suffix);
    const trendClass = trend === null ? "trend-neutral" : trend > 0 ? "trend-positive" : "trend-negative";
    const trendLabel =
        trend === null
            ? "–"
            : `${trend > 0 ? "▲" : "▼"} ${Math.abs(trend).toFixed(1)}% vs. Vormonat`;

    return `
        <div class="kpi-card">
            <div class="kpi-label"><i class="ri-pulse-line"></i>${label}</div>
            <div class="kpi-value">${formatted}</div>
            <div class="kpi-trend ${trendClass}">${trendLabel}</div>
        </div>
    `;
}

function renderTopCampaigns(campaigns, insightsByCampaign = {}) {
    if (!campaigns || campaigns.length === 0) {
        return `<div class="hero-empty">Noch keine Kampagnen-Daten vorhanden.</div>`;
    }

    const decorated = campaigns.map(c => {
        const ins = insightsByCampaign[c.id] || {};
        const spend = Number(ins.spend || ins.spend_total || 0);
        const revenue = Number(ins.revenue || ins.purchase_value || 0);
        const roas = spend > 0 ? revenue / spend : 0;

        return {
            ...c,
            metrics: { spend, revenue, roas }
        };
    });

    decorated.sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0));

    const top = decorated.slice(0, 3);

    return top
        .map(c => {
            const m = c.metrics;
            return `
            <div class="hero-metric-row">
                <div>
                    <strong>${c.name || c.campaign_name || "Unbenannte Kampagne"}</strong><br/>
                    <span class="kpi-sub">Status: ${c.status || "unknown"}</span>
                </div>
                <div class="hero-metric-value">
                    ROAS: ${m.roas ? m.roas.toFixed(2) + "x" : "–"}<br/>
                    <span class="kpi-sub">Spend: ${formatNumber(m.spend, "€")}</span>
                </div>
            </div>
        `;
        })
        .join("");
}

function formatNumber(value, suffix = "") {
    const num = Number(value || 0);
    if (suffix === "€") {
        return num.toLocaleString("de-DE", {
            style: "currency",
            currency: "EUR",
            maximumFractionDigits: 0
        });
    }
    if (suffix === "x") {
        return num ? num.toFixed(2) + "x" : "–";
    }
    if (num > 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num > 1000) {
        return (num / 1000).toFixed(1) + "k";
    }
    return num.toLocaleString("de-DE");
}
