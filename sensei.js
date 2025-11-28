// sensei.js – FINAL VERSION (Elite Sensei Layer P4)

import { AppState } from "./state.js";
import { showToast, openModal } from "./uiCore.js";

/**
 * Entry-Point aus app.js
 * app.js ruft: updateSenseiView(dataConnected)
 */
export function updateSenseiView(hasData) {
    const panel = document.getElementById("senseiPanelContainer");
    const insightsBox = document.getElementById("senseiInsightsContainer");
    const alertsBox = document.getElementById("senseiAlertsContainer");
    const performerBox = document.getElementById("senseiTopPerformersContainer");

    if (!panel || !insightsBox || !alertsBox || !performerBox) return;

    if (!hasData) {
        panel.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Daten geladen. Verbinde Meta Ads oder aktiviere Demo Mode für den Sensei.</p>
            </div>
        `;
        insightsBox.innerHTML = "";
        alertsBox.innerHTML = "";
        performerBox.innerHTML = "";
        return;
    }

    const campaigns = AppState.meta?.campaigns || [];
    const insights = AppState.meta?.insightsByCampaign || {};

    if (!campaigns.length) {
        panel.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Kampagnen im Zeitraum ${humanize(AppState.timeRangePreset)} gefunden.</p>
            </div>
        `;
        return;
    }

    const decorated = decorateCampaigns(campaigns, insights);

    // Core Sensei Metrics
    const metrics = buildSenseiMetrics(decorated);

    // Render
    insightsBox.innerHTML = renderBriefing(metrics);
    alertsBox.innerHTML = renderAlerts(metrics);
    performerBox.innerHTML = renderTopPerformers(metrics);
}

/* ============================================================
   DATA PREP
============================================================ */

function decorateCampaigns(campaigns, insightsByCampaign) {
    return campaigns.map((c) => {
        const ins = insightsByCampaign[c.id] || {};
        const spend = num(ins.spend ?? ins.spend_total);
        const rev = num(ins.revenue ?? ins.purchase_value);
        const impressions = num(ins.impressions);
        const clicks = num(ins.clicks);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 ? rev / spend : 0;

        return {
            ...c,
            metrics: { spend, rev, impressions, clicks, ctr, roas }
        };
    });
}

function buildSenseiMetrics(list) {
    let spend = 0;
    let revenue = 0;
    let clicks = 0;
    let impressions = 0;
    const sorted = [...list].sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0));

    list.forEach((c) => {
        spend += c.metrics.spend;
        revenue += c.metrics.rev;
        clicks += c.metrics.clicks;
        impressions += c.metrics.impressions;
    });

    const overallRoas = spend > 0 ? revenue / spend : 0;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    return {
        list,
        top: sorted.slice(0, 3),
        bottom: sorted.slice(-3),
        spend,
        revenue,
        overallRoas,
        ctr,
        impressions,
        clicks
    };
}

/* ============================================================
   BRIEFING (AI/Consulting Style)
============================================================ */

function renderBriefing(m) {
    const demo = AppState.settings?.demoMode;

    const badge =
        m.overallRoas >= 3
            ? { cls: "success", label: "Elite Performance" }
            : m.overallRoas >= 1.5
            ? { cls: "warning", label: "OK – aber ausbaufähig" }
            : { cls: "critical", label: "Unter Wasser" };

    return `
        <div class="card briefing-card">
            <span class="priority-badge ${badge.cls}">${badge.label}</span>
            <div class="briefing-content">
                <p>
                    ROAS gesamt: <strong>${fmtX(m.overallRoas)}</strong> · 
                    Spend: <strong>${fmtE(m.spend)}</strong> · 
                    Revenue: <strong>${fmtE(m.revenue)}</strong>
                </p>

                <p>
                    CTR: <strong>${fmtPct(m.ctr)}</strong> · 
                    Impressions: <strong>${fmt(m.impressions)}</strong> ·
                    Clicks: <strong>${fmt(m.clicks)}</strong>
                </p>

                <p>
                    ${
                        m.overallRoas >= 3
                            ? "Account liefert Top-Performance. Fokus: kontrolliertes Skalieren & Creative Diversifikation."
                            : m.overallRoas >= 1.5
                            ? "Solide Basis. Fokus: Testing von Creatives, Offers und Audience Clustering."
                            : "Account gefährdet. Fokus: Performance retten über Creative-First-Testing & Kampagnen-Konsolidierung."
                    }
                </p>
                ${
                    demo
                        ? `<p><em>Hinweis: Demo Mode aktiv → Werte sind simuliert.</em></p>`
                        : ""
                }
            </div>
        </div>
    `;
}

/* ============================================================
   ALERTS
============================================================ */

function renderAlerts(m) {
    const alerts = [];

    if (m.overallRoas < 1) {
        alerts.push(alert(
            "critical",
            "ROAS unter 1.0",
            "Der Account verliert Geld. Dringend Maßnahmen nötig: Kampagnen pausieren, Creative-Testing intensivieren."
        ));
    }

    if (m.ctr < 0.7) {
        alerts.push(alert(
            "warning",
            "CTR sehr niedrig",
            "Deine CTR ist niedrig – Creative Hook / Thumbnail / Messaging überprüfen."
        ));
    }

    if (m.top[0]?.metrics.roas >= 4) {
        alerts.push(alert(
            "success",
            "Skalierungspotenzial erkannt",
            `Top Kampagne: ${escape(m.top[0].name)} mit ROAS ${fmtX(m.top[0].metrics.roas)}`
        ));
    }

    if (!alerts.length) {
        alerts.push(alert(
            "info",
            "Keine kritischen Probleme",
            "Sensei hat aktuell keine kritischen Auffälligkeiten gefunden."
        ));
    }

    return alerts.join("");
}

function alert(type, title, msg) {
    return `
        <div class="alert-card alert-${type}">
            <div class="alert-icon"><i class="fas fa-bolt"></i></div>
            <div class="alert-content">
                <div class="alert-title">${escape(title)}</div>
                <div class="alert-message">${escape(msg)}</div>
            </div>
        </div>
    `;
}

/* ============================================================
   TOP PERFORMERS
============================================================ */

function renderTopPerformers(m) {
    return m.top
        .map(
            (c, idx) => `
        <article class="top-performer-card">
            <div class="performer-rank">#${idx + 1}</div>
            <div class="performer-content">
                <div class="performer-name">${escape(c.name || c.campaign_name)}</div>
                <div class="performer-metrics">
                    <span class="metric-badge roas">ROAS ${fmtX(c.metrics.roas)}</span>
                    <span class="metric-badge spend">${fmtE(c.metrics.spend)}</span>
                    <span class="metric-badge ctr">${fmtPct(c.metrics.ctr)} CTR</span>
                </div>
            </div>
        </article>
    `
        )
        .join("");
}

/* ============================================================
   HELPERS
============================================================ */

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
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
    return n.toLocaleString("de-DE");
}

function fmtPct(v) {
    return v ? v.toFixed(2) + "%" : "–";
}

function fmtX(v) {
    return v ? v.toFixed(2) + "x" : "–";
}

function humanize(r) {
    switch (r) {
        case "last_7d":
            return "Letzte 7 Tage";
        case "last_30d":
            return "Letzte 30 Tage";
        default:
            return r;
    }
}

function escape(str) {
    return String(str || "").replace(/[&<>"']/g, (s) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[s]));
}
