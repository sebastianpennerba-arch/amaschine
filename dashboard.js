// dashboard.js – KPI-System + DEMO MODE PERFEKT INTEGRIERT + EVENT LISTENERS FIXED

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";
import {
    demoCampaigns,
    demoCreatives,
    demoAlerts,
    demoForecast
} from "./demoData.js";

/* -----------------------------------------------------------
    Formatter
----------------------------------------------------------- */

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
    return n.toFixed(2) + " %";
}

/* -----------------------------------------------------------
    DOM Helper
----------------------------------------------------------- */

function el(id) {
    return document.getElementById(id);
}

/* -----------------------------------------------------------
    Demo-Mode Metric Aggregation
----------------------------------------------------------- */

function aggregateDemoKpis() {
    const totalSpend = demoCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = demoCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalImpressions = demoCampaigns.reduce(
        (sum, c) => sum + c.impressions,
        0
    );
    const totalClicks = demoCampaigns.reduce((sum, c) => sum + c.clicks, 0);

    const weightedRoas =
        totalSpend > 0
            ? demoCampaigns.reduce((sum, c) => sum + c.roas * c.spend, 0) /
              totalSpend
            : 0;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpm =
        totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    return {
        spend: totalSpend,
        revenue: totalRevenue,
        roas: weightedRoas,
        ctr,
        cpm,
        impressions: totalImpressions,
        clicks: totalClicks,
        scopeLabel: "Alle Kampagnen (Demo)",
        timeRangeLabel: "Letzte 30 Tage (Demo)"
    };
}

/* -----------------------------------------------------------
    Render: KPIs
----------------------------------------------------------- */

function renderKpis(metrics) {
    const container = el("dashboardKpiContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML = `
            <div class="card">
                <p style="font-size:14px;color:var(--text-secondary);">
                    Keine Daten verfügbar. Bitte Demo-Modus aktivieren oder Meta verbinden.
                </p>
            </div>
        `;
        return;
    }

    const { spend, roas, revenue, ctr, cpm, impressions, clicks } = metrics;

    container.innerHTML = `
        <div class="kpi-card">
            <div class="kpi-label">SPEND</div>
            <div class="kpi-value">${fEuro(spend)}</div>
            <div class="kpi-sub">Gesamtausgaben</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">ROAS</div>
            <div class="kpi-value">${roas.toFixed(2)}x</div>
            <div class="kpi-sub">Return on Ad Spend</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">REVENUE</div>
            <div class="kpi-value">${fEuro(revenue || spend * roas)}</div>
            <div class="kpi-sub">Umsatz generiert</div>
        </div>

        <div class="kpi-card">
            <div class="kpi-label">CTR</div>
            <div class="kpi-value">${fPct(ctr)}</div>
            <div class="kpi-sub">Click-Through-Rate</div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Render: Simple Performance Chart (Demo + Live)
----------------------------------------------------------- */

function renderPerformanceChart(metrics) {
    const container = el("dashboardChartContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML = `
            <div class="card">
                <p style="font-size:14px;color:var(--text-secondary);">
                    Kein Chart verfügbar. Es fehlen Daten für den ausgewählten Zeitraum.
                </p>
            </div>
        `;
        return;
    }

    const forecast = demoForecast || [];
    const labels = forecast.map((p) => p.label);
    const spendData = forecast.map((p) => p.spend);
    const revenueData = forecast.map((p) => p.revenue);

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Performance-Entwicklung</h3>
                <span style="font-size:12px;color:var(--text-secondary);">
                    ${metrics.timeRangeLabel}
                </span>
            </div>
            <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
                (Demo-Chart – Live-Variante zeigt später echte Kurve aus Meta-Insights)
            </div>
            <div>
                <strong>Labels:</strong> ${labels.join(" | ")}<br />
                <strong>Spend:</strong> ${spendData.map(fEuro).join(" | ")}<br />
                <strong>Revenue:</strong> ${revenueData.map(fEuro).join(" | ")}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Render: Alerts (Demo)
----------------------------------------------------------- */

function renderAlerts() {
    const container = el("dashboardAlertsContainer");
    if (!container) return;

    if (!demoAlerts || !demoAlerts.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Alerts & Signale</h3>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;font-size:13px;">
                ${demoAlerts
                    .map(
                        (a) => `
                    <div style="display:flex;align-items:flex-start;gap:8px;">
                        <span style="font-size:10px;margin-top:4px;">
                            ${
                                a.level === "danger"
                                    ? "🔴"
                                    : a.level === "warning"
                                    ? "🟡"
                                    : "🟢"
                            }
                        </span>
                        <div>
                            <div style="font-weight:600;">${a.title}</div>
                            <div style="color:var(--text-secondary);">${a.description}</div>
                        </div>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Render: Sensei Briefing (Demo)
----------------------------------------------------------- */

function renderSenseiBriefing() {
    const container = el("dashboardSenseiBriefingContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Sensei Daily Briefing</h3>
                <span style="font-size:12px;color:var(--text-secondary);">
                    AI-Preview – basiert aktuell auf Demo-KPIs
                </span>
            </div>
            <div style="font-size:13px;color:var(--text-primary);">
                <p><strong>Priorität 1:</strong> Budget von schwachen Kampagnen in die Top-Performer verschieben.</p>
                <p><strong>Priorität 2:</strong> Creative-Varianten für die 3 besten Ads testen.</p>
                <p><strong>Priorität 3:</strong> Retargeting-Setup prüfen – Frequenz & Creative-Fatigue.</p>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Render: Top / Bottom Performer Creatives (Demo)
----------------------------------------------------------- */

function renderTopPerformers() {
    const container = el("dashboardTopPerformersContainer");
    if (!container) return;

    let topCreatives = [...demoCreatives]
        .sort((a, b) => b.roas - a.roas)
        .slice(0, 3);

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Top Creatives (Demo)</h3>
                <span style="font-size:12px;color:var(--text-secondary);">
                    Basiert auf Demo-Daten – später Live-ROAS
                </span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                ${topCreatives
                    .map(
                        (c, idx) => `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:8px;background:#E5E7EB;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;">
                            #${idx + 1}
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:600;">${c.name}</div>
                            <div style="font-size:12px;color:var(--text-secondary);">
                                ROAS: ${c.roas.toFixed(2)}x • CTR: ${fPct(
                            c.ctr
                        )} • Spend: ${fEuro(c.spend)}
                            </div>
                        </div>
                        <button
                            class="btn-secondary"
                            style="font-size:11px;padding:4px 8px;"
                            data-creative-id="${c.id}"
                        >
                            Details
                        </button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </div>
    `;

    container
        .querySelectorAll("button[data-creative-id]")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const creativeId = btn.getAttribute("data-creative-id");
                alert(
                    `Creative ${creativeId} – Detailmodal folgt in P2 (Creative Library Upgrade).`
                );
            });
        });
}

function renderBottomPerformers() {
    const container = el("dashboardBottomPerformersContainer");
    if (!container) return;

    const bottomCreatives = [...demoCreatives]
        .sort((a, b) => a.roas - b.roas)
        .slice(0, 3);

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Risk Creatives (Demo)</h3>
                <span style="font-size:12px;color:var(--text-secondary);">
                    Handlungsempfehlungen folgen im Sensei-Modul
                </span>
            </div>
            <div style="display:flex;flex-direction:column;gap:8px;font-size:13px;">
                ${bottomCreatives
                    .map(
                        (c) => `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:8px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;font-size:16px;">
                            ⚠
                        </div>
                        <div style="flex:1;">
                            <div style="font-weight:600;">${c.name}</div>
                            <div style="font-size:12px;color:var(--text-secondary);">
                                ROAS: ${c.roas.toFixed(2)}x • CTR: ${fPct(
                            c.ctr
                        )} • Spend: ${fEuro(c.spend)}
                            </div>
                        </div>
                        <button
                            class="btn-primary"
                            style="font-size:11px;padding:4px 8px;"
                            data-creative-id="${c.id}"
                        >
                            Rescue-Plan
                        </button>
                    </div>
                `
                    )
                    .join("")}
            </div>
        </div>
    `;

    container
        .querySelectorAll("button[data-creative-id]")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const creativeId = btn.getAttribute("data-creative-id");
                alert(
                    `Creative ${creativeId} wird pausiert... (Demo-Modus – keine echte Aktion)`
                );
            });
        });
}

/* -----------------------------------------------------------
    Render: Top Campaigns Hero (Demo)
----------------------------------------------------------- */

function renderTopCampaigns() {
    const container = el("dashboardHeroCreativesContainer");
    if (!container) return;

    const topCampaign = [...demoCampaigns].sort(
        (a, b) => b.roas - a.roas
    )[0];
    const worstCampaign = [...demoCampaigns].sort(
        (a, b) => a.roas - b.roas
    )[0];

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h3>Performance-Profile (Demo)</h3>
            </div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;font-size:13px;">
                <div style="padding:12px;border-radius:12px;border:1px solid rgba(34,197,94,0.3);background:rgba(22,163,74,0.05);">
                    <div style="font-size:12px;color:#16A34A;margin-bottom:4px;">Top-Kampagne</div>
                    <div style="font-weight:600;margin-bottom:4px;">${topCampaign.name}</div>
                    <div class="hero-metric-row">
                        <span>ROAS</span>
                        <span class="hero-metric-value">${topCampaign.roas.toFixed(
                            2
                        )}x</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>Spend</span>
                        <span class="hero-metric-value">${fEuro(
                            topCampaign.spend
                        )}</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>CTR</span>
                        <span class="hero-metric-value">${fPct(
                            topCampaign.ctr
                        )}</span>
                    </div>
                </div>

                <div style="padding:12px;border-radius:12px;border:1px solid rgba(248,113,113,0.5);background:rgba(248,113,113,0.05);">
                    <div style="font-size:12px;color:#DC2626;margin-bottom:4px;">Risiko-Kampagne</div>
                    <div style="font-weight:600;margin-bottom:4px;">${worstCampaign.name}</div>
                    <div class="hero-metric-row">
                        <span>ROAS</span>
                        <span class="hero-metric-value">${worstCampaign.roas.toFixed(
                            2
                        )}x</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>Spend</span>
                        <span class="hero-metric-value">${fEuro(
                            worstCampaign.spend
                        )}</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>CTR</span>
                        <span class="hero-metric-value">${fPct(
                            worstCampaign.ctr
                        )}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Insights Aggregation (nur Live-Daten)
----------------------------------------------------------- */

async function aggregateCampaigns(ids, preset) {
    const token = AppState.meta?.accessToken;
    if (!token || !Array.isArray(ids) || !ids.length) return null;

    let spend = 0;
    let impressions = 0;
    let clicks = 0;
    let roasWeighted = 0;
    let weight = 0;
    let minStart = null;
    let maxStop = null;

    for (const id of ids) {
        try {
            const insights = await fetchMetaCampaignInsights(id, token, preset);
            const d = Array.isArray(insights) && insights.length ? insights[0] : null;
            if (!d) continue;

            const s = Number(d.spend || 0);
            const imp = Number(d.impressions || 0);
            const clk = Number(d.clicks || 0);

            spend += s;
            impressions += imp;
            clicks += clk;

            let roas = 0;
            if (Array.isArray(d.purchase_roas) && d.purchase_roas.length) {
                roas = Number(d.purchase_roas[0].value || 0);
            } else if (
                Array.isArray(d.website_purchase_roas) &&
                d.website_purchase_roas.length
            ) {
                roas = Number(d.website_purchase_roas[0].value || 0);
            }

            if (s > 0 && roas > 0) {
                roasWeighted += roas * s;
                weight += s;
            }

            const ds = d.date_start;
            const de = d.date_stop;

            if (ds) {
                const dsDate = new Date(ds);
                if (!minStart || dsDate < minStart) minStart = dsDate;
            }
            if (de) {
                const deDate = new Date(de);
                if (!maxStop || deDate > maxStop) maxStop = deDate;
            }

            AppState.meta.insightsByCampaign[id] = {
                spend: s,
                impressions: imp,
                clicks: clk,
                roas,
                ctr: imp > 0 ? (clk / imp) * 100 : 0
            };
        } catch (e) {
            console.warn("Insight Aggregation Error:", id, e);
        }
    }

    if (!spend && !impressions && !clicks) return null;

    return {
        spend,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        roas: weight > 0 ? roasWeighted / weight : 0,
        dateStart: minStart,
        dateStop: maxStop
    };
}

/* -----------------------------------------------------------
    Dashboard Summary Text
----------------------------------------------------------- */

function timeRangeLabel(start, stop) {
    if (!start || !stop) return "Keine Daten";
    const s = new Date(start);
    const e = new Date(stop);
    const fmt = (d) =>
        d.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "2-digit"
        });
    return `${fmt(s)} – ${fmt(e)}`;
}

function updateDashboardSummary(text) {
    const elSummary = document.getElementById("dashboardMetaSummary");
    if (!elSummary) return;
    elSummary.textContent = text;
}

/* -----------------------------------------------------------
    Hauptfunktion: updateDashboardView
----------------------------------------------------------- */

export async function updateDashboardView(connected) {
    const isDemo = AppState.demoMode === true;

    // DEMO MODE
    if (isDemo) {
        const metrics = aggregateDemoKpis();
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderAlerts();
        renderSenseiBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();

        updateDashboardSummary(
            `${metrics.scopeLabel} • Demo-Modus – alle Features aktiv 🚀`
        );

        AppState.dashboardLoaded = true;
        return;
    }

    // Kein Demo-Mode & nicht verbunden
    if (!connected) {
        renderKpis(null);
        renderPerformanceChart(null);
        renderAlerts();
        renderSenseiBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();
        updateDashboardSummary(
            "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        );
        return;
    }

    // Live-Mode
    try {
        const preset = AppState.timeRangePreset || "last_7d";
        const campaigns = AppState.meta?.campaigns || [];

        let metrics;

        if (!AppState.selectedCampaignId) {
            const ids = campaigns.map((c) => c.id);
            const agg = await aggregateCampaigns(ids, preset);

            if (!agg) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: "Keine Kampagnen",
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                metrics = {
                    spend: agg.spend,
                    roas: agg.roas,
                    ctr: agg.ctr,
                    cpm: agg.cpm,
                    impressions: agg.impressions,
                    clicks: agg.clicks,
                    scopeLabel: `Alle Kampagnen (${campaigns.length})`,
                    timeRangeLabel: timeRangeLabel(
                        agg.dateStart,
                        agg.dateStop
                    )
                };
            }
        } else {
            const token = AppState.meta?.accessToken;

            if (!token) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                const insights = await fetchMetaCampaignInsights(
                    AppState.selectedCampaignId,
                    token,
                    preset
                );
                const d = Array.isArray(insights) && insights.length ? insights[0] : null;

                if (!d) {
                    metrics = {
                        spend: 0,
                        roas: 0,
                        ctr: 0,
                        cpm: 0,
                        impressions: 0,
                        clicks: 0,
                        scopeLabel: "Keine Insights",
                        timeRangeLabel: "Keine Daten"
                    };
                } else {
                    const s = Number(d.spend || 0);
                    const imp = Number(d.impressions || 0);
                    const clk = Number(d.clicks || 0);
                    const ctr = imp > 0 ? (clk / imp) * 100 : 0;
                    const cpm = imp > 0 ? (s / imp) * 1000 : 0;

                    let roas = 0;
                    if (Array.isArray(d.purchase_roas) && d.purchase_roas.length) {
                        roas = Number(d.purchase_roas[0].value || 0);
                    } else if (
                        Array.isArray(d.website_purchase_roas) &&
                        d.website_purchase_roas.length
                    ) {
                        roas = Number(d.website_purchase_roas[0].value || 0);
                    }

                    const camp = campaigns.find(
                        (c) => c.id === AppState.selectedCampaignId
                    );

                    metrics = {
                        spend: s,
                        roas,
                        ctr,
                        cpm,
                        impressions: imp,
                        clicks: clk,
                        scopeLabel: camp ? camp.name : "Kampagne",
                        timeRangeLabel: timeRangeLabel(
                            d.date_start,
                            d.date_stop
                        )
                    };
                }
            }
        }

        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderAlerts();
        renderSenseiBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}`
        );

        AppState.dashboardMetrics = metrics;
        AppState.dashboardLoaded = true;
    } catch (err) {
        console.error("Dashboard Error:", err);

        const m = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            scopeLabel: "Fehler",
            timeRangeLabel: "Fehler"
        };

        renderKpis(m);
        renderPerformanceChart(m);
        renderAlerts();
        renderSenseiBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();
        updateDashboardSummary(
            "Fehler beim Laden der Dashboard-Daten. Bitte Verbindung und Berechtigungen prüfen."
        );
    }
}
