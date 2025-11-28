// packages/dashboard/dashboard.render.js
// Zentrales Rendering für das Dashboard (KPI, Chart, Summary + Sections)

import {
    renderAlerts,
    renderSenseiDailyBriefing,
    renderTopPerformers,
    renderBottomPerformers,
    renderTopCampaigns
} from "./dashboard.sections.js";

function getEl(id) {
    return document.getElementById(id);
}

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fInt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

/* -----------------------------------------------------------
    KPI CARDS
----------------------------------------------------------- */
function renderKpis(metrics) {
    const container = getEl("dashboardKpiContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML =
            "<p style='color:var(--text-secondary);font-size:13px;'>Keine Daten verfügbar.</p>";
        return;
    }

    const { spend, revenue, roas, ctr, cpm, impressions, clicks } = metrics;

    const roasTrend = roas > 4.5 ? "🟢 +0.4x vs. Vorwoche" : "🟡 Stabil";
    const roasClass = roas > 4.5 ? "success" : "warning";

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${fEuro(spend)}</div>
                <div class="kpi-sub">Gesamtausgaben</div>
            </div>
            
            <div class="kpi-card ${roasClass}">
                <div class="kpi-label">ROAS</div>
                <div class="kpi-value">${roas.toFixed(2)}x</div>
                <div class="kpi-sub">${roasTrend}</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Revenue</div>
                <div class="kpi-value">${fEuro(revenue || spend * roas)}</div>
                <div class="kpi-sub">Umsatz generiert</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">CTR</div>
                <div class="kpi-value">${fPct(ctr)}</div>
                <div class="kpi-sub">Click-Through-Rate</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">CPM</div>
                <div class="kpi-value">${fEuro(cpm)}</div>
                <div class="kpi-sub">Cost per Mille</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Impressions</div>
                <div class="kpi-value">${fInt(impressions)}</div>
                <div class="kpi-sub">${fInt(clicks)} Klicks</div>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    CHART PLACEHOLDER
----------------------------------------------------------- */
function renderPerformanceChart(metrics) {
    const container = getEl("dashboardChartContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML =
            "<div class='chart-placeholder'>Keine Daten für Chart.</div>";
        return;
    }

    container.innerHTML = `
        <div class="chart-placeholder">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
                Performance-Übersicht
            </div>
            <div style="font-size:12px;">
                Spend: ${fEuro(metrics.spend)} •
                ROAS: ${metrics.roas.toFixed(2)}x •
                CTR: ${fPct(metrics.ctr)} •
                CPM: ${fEuro(metrics.cpm)}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    SUMMARY TEXT
----------------------------------------------------------- */
function updateDashboardSummary(text) {
    const sumEl = getEl("dashboardMetaSummary");
    if (!sumEl) return;
    sumEl.textContent = text;
}

/* -----------------------------------------------------------
    PUBLIC RENDER-API
----------------------------------------------------------- */
export function renderDashboard(state) {
    if (!state) return;

    const { mode, metrics, summaryText } = state;

    if (mode === "demo") {
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderAlerts();
        renderSenseiDailyBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel} • Demo-Modus – alle Features aktiv 🚀`
        );
        return;
    }

    if (mode === "disconnected") {
        renderKpis(null);
        renderPerformanceChart(null);
        renderTopCampaigns();
        updateDashboardSummary(
            summaryText ||
                "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        );
        return;
    }

    if (mode === "live") {
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}`
        );
        return;
    }

    if (mode === "error") {
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();
        updateDashboardSummary(
            "Fehler beim Laden der Dashboard-Daten. Bitte Verbindung und Berechtigungen prüfen."
        );
        return;
    }

    // Fallback
    renderKpis(null);
    renderPerformanceChart(null);
    renderTopCampaigns();
    updateDashboardSummary("Keine Dashboard-Daten verfügbar.");
}
