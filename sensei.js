// sensei.js
import { AppState } from "./state.js";

/**
 * Sensei View: nutzt Demo-Daten / aggregierte KPIs,
 * um ein Briefing + Alerts + Handlungsvorschläge zu zeigen.
 */
export function renderSensei() {
    const container = document.getElementById("senseiContent");
    if (!container) return;

    const { campaigns, insightsByCampaign } = AppState.meta;
    const metrics = buildSenseiMetrics(campaigns || [], insightsByCampaign || {});

    container.innerHTML = `
        <section class="sensei-briefing-section">
            <div class="section-title">
                <i class="ri-robot-line"></i> Sensei Briefing
            </div>

            ${renderSenseiBriefing(metrics)}
        </section>

        <section class="alerts-section">
            <div class="section-title danger">
                <i class="ri-alert-line"></i> Alerts
            </div>
            <div class="alerts-grid">
                ${renderAlerts(metrics)}
            </div>
        </section>

        <section class="top-performers-section">
            <div class="section-title">
                <i class="ri-bar-chart-2-line"></i> Top Performer
            </div>
            <div class="top-performers-grid">
                ${renderTopPerformers(metrics)}
            </div>
        </section>
    `;
}

function buildSenseiMetrics(campaigns, insightsByCampaign) {
    const decorated = campaigns.map(c => {
        const ins = insightsByCampaign[c.id] || {};
        const spend = Number(ins.spend || 0);
        const rev = Number(ins.revenue || 0);
        const roas = spend > 0 ? rev / spend : 0;
        const impressions = Number(ins.impressions || 0);
        const clicks = Number(ins.clicks || 0);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        return { ...c, insights: { spend, rev, roas, impressions, clicks, ctr } };
    });

    const sortedByRoas = [...decorated].sort((a, b) => (b.insights.roas || 0) - (a.insights.roas || 0));
    const top = sortedByRoas[0] || null;
    const bottom = sortedByRoas[sortedByRoas.length - 1] || null;

    const totalSpend = decorated.reduce((sum, c) => sum + c.insights.spend, 0);
    const totalRev = decorated.reduce((sum, c) => sum + c.insights.rev, 0);
    const overallRoas = totalSpend > 0 ? totalRev / totalSpend : 0;

    return {
        campaigns: decorated,
        topCampaign: top,
        bottomCampaign: bottom,
        totalSpend,
        totalRev,
        overallRoas
    };
}

function renderSenseiBriefing(m) {
    if (!m.campaigns.length) {
        return `
            <div class="briefing-card">
                <div class="priority-badge info">Info</div>
                <div class="briefing-content">
                    <p>Keine Kampagnen-Daten verfügbar. Verbinde Meta oder aktiviere den Demo Mode, um ein vollständiges Sensei-Briefing zu erhalten.</p>
                </div>
            </div>
        `;
    }

    return `
        <div class="briefing-card">
            <div class="priority-badge ${
                m.overallRoas >= 3 ? "success" : m.overallRoas >= 1.5 ? "warning" : "critical"
            }">
                ${
                    m.overallRoas >= 3
                        ? "System auf Skalierungsniveau"
                        : m.overallRoas >= 1.5
                        ? "Stabile Basis – Optimierung nötig"
                        : "Kritischer Zustand"
                }
            </div>
            <div class="briefing-content">
                <p>
                    Gesamt-ROAS liegt bei <strong>${m.overallRoas ? m.overallRoas.toFixed(2) + "x" : "–"}</strong>
                    bei einem Spend von <strong>${formatCurrency(m.totalSpend)}</strong> und
                    einem Revenue von <strong>${formatCurrency(m.totalRev)}</strong>.
                </p>
                <p class="action-line">
                    > Fokus-Kampagne: ${
                        m.topCampaign
                            ? escapeHtml(m.topCampaign.name || m.topCampaign.campaign_name || m.topCampaign.id)
                            : "keine"
                    }
                </p>
            </div>
        </div>
    `;
}

function renderAlerts(m) {
    if (!m.campaigns.length) {
        return `
            <div class="alert-card alert-info">
                <div class="alert-icon"><i class="ri-information-line"></i></div>
                <div class="alert-content">
                    <div class="alert-title">Keine Daten</div>
                    <div class="alert-message">Füge Kampagnen hinzu oder aktiviere Demo-Daten, um Alerts zu erhalten.</div>
                </div>
            </div>
        `;
    }

    const alerts = [];

    if (m.overallRoas < 1.0) {
        alerts.push(`
            <div class="alert-card alert-critical">
                <div class="alert-icon"><i class="ri-error-warning-line"></i></div>
                <div class="alert-content">
                    <div class="alert-title">ROAS unter 1.0</div>
                    <div class="alert-message">
                        Das Account-Level ist aktuell nicht profitabel. Überprüfe Budget-Allocation und
                        pausiere nicht performende Kampagnen.
                    </div>
                    <div class="alert-meta">Sensei · Profitabilität</div>
                </div>
            </div>
        `);
    }

    if (m.topCampaign && m.topCampaign.insights.roas >= 4) {
        alerts.push(`
            <div class="alert-card alert-success">
                <div class="alert-icon"><i class="ri-rocket-line"></i></div>
                <div class="alert-content">
                    <div class="alert-title">Skalierungschance erkannt</div>
                    <div class="alert-message">
                        Kampagne <strong>${escapeHtml(m.topCampaign.name || m.topCampaign.id)}</strong> performt mit einem
                        ROAS von ${m.topCampaign.insights.roas.toFixed(2)}x. 
                        Erhöhe kontrolliert das Budget und beobachte die Stabilität.
                    </div>
                    <div class="alert-meta">Sensei · Scaling</div>
                </div>
            </div>
        `);
    }

    if (!alerts.length) {
        alerts.push(`
            <div class="alert-card alert-success">
                <div class="alert-icon"><i class="ri-check-double-line"></i></div>
                <div class="alert-content">
                    <div class="alert-title">Keine kritischen Alerts</div>
                    <div class="alert-message">
                        Aktuell wurden keine kritischen Anomalien im Account erkannt. Nutze die Zeit für strukturelle Optimierung, Creatives und Testing.
                    </div>
                    <div class="alert-meta">Sensei · Health Check</div>
                </div>
            </div>
        `);
    }

    return alerts.join("");
}

function renderTopPerformers(m) {
    if (!m.campaigns.length) {
        return `<div class="hero-empty">Keine Kampagnen vorhanden.</div>`;
    }

    const sorted = [...m.campaigns].sort((a, b) => (b.insights.roas || 0) - (a.insights.roas || 0));
    const top3 = sorted.slice(0, 3);

    return top3
        .map((c, idx) => {
            const ins = c.insights;
            return `
                <article class="top-performer-card">
                    <div class="performer-rank">#${idx + 1}</div>

                    <div class="performer-content">
                        <div class="performer-name">${escapeHtml(c.name || c.campaign_name || c.id)}</div>
                        <div class="performer-metrics">
                            <span class="metric-badge roas">ROAS ${ins.roas ? ins.roas.toFixed(2) + "x" : "–"}</span>
                            <span class="metric-badge spend">${formatCurrency(ins.spend)} Spend</span>
                            <span class="metric-badge ctr">${ins.ctr ? ins.ctr.toFixed(2) + "% CTR" : "– CTR"}</span>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    });
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
