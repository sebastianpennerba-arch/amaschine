// dashboard.js – KPI-System + Demo-Mode-Unterstützung

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";

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
    return `${n.toFixed(2)} %`;
}

/* -----------------------------------------------------------
    DOM Helper
----------------------------------------------------------- */

function getEl(id) {
    return document.getElementById(id);
}

/* -----------------------------------------------------------
    KPI-Rendering
----------------------------------------------------------- */

function renderKpis(metrics) {
    const container = getEl("dashboardKpiContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML =
            "<p style='color:var(--text-secondary);font-size:13px;'>Keine Daten verfügbar.</p>";
        return;
    }

    const {
        spend,
        roas,
        ctr,
        cpm,
        impressions,
        clicks,
        scopeLabel,
        timeRangeLabel
    } = metrics;

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${fEuro(spend)}</div>
                <div class="kpi-sub">${scopeLabel || ""}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">ROAS</div>
                <div class="kpi-value">${roas.toFixed(2)}x</div>
                <div class="kpi-sub">Return on Ad Spend</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">CTR</div>
                <div class="kpi-value">${fPct(ctr)}</div>
                <div class="kpi-sub">Click-Through-Rate</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">CPM</div>
                <div class="kpi-value">${fEuro(cpm)}</div>
                <div class="kpi-sub">Kosten pro 1.000 Impressions</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Impressions</div>
                <div class="kpi-value">${fInt(impressions)}</div>
                <div class="kpi-sub">${timeRangeLabel || ""}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label">Klicks</div>
                <div class="kpi-value">${fInt(clicks)}</div>
                <div class="kpi-sub">Traffic</div>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Chart-Rendering (simpler Placeholder)
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
                Demo-Chart / Aggregierter Verlauf
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
    Hero Creatives / Top-Kampagnen
----------------------------------------------------------- */

function getTopCampaigns() {
    const map = AppState.meta?.insightsByCampaign || {};
    const campaigns = AppState.meta?.campaigns || [];

    const list = Object.entries(map).map(([id, m]) => {
        const c = campaigns.find((x) => x.id === id);
        return {
            id,
            name: c?.name || "Kampagne",
            spend: Number(m.spend || 0),
            roas: Number(m.roas || 0),
            ctr: Number(m.ctr || 0),
            impressions: Number(m.impressions || 0),
            clicks: Number(m.clicks || 0)
        };
    });

    list.sort((a, b) => b.roas - a.roas);
    return list.slice(0, 3);
}

function renderTopCampaigns() {
    const container = getEl("dashboardHeroCreativesContainer");
    if (!container) return;

    const top = getTopCampaigns();

    if (!top.length) {
        container.innerHTML = `
            <div class="hero-empty">
                <p style="font-size:13px;color:var(--text-secondary);">
                    Noch keine Top-Kampagnen verfügbar.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="hero-grid">
            ${top
                .map(
                    (c) => `
                <div class="hero-card">
                    <div class="hero-title">${c.name}</div>
                    <div class="hero-metric-row">
                        <span>ROAS</span>
                        <span class="hero-metric-value">${c.roas.toFixed(
                            2
                        )}x</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>Spend</span>
                        <span class="hero-metric-value">${fEuro(
                            c.spend
                        )}</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>CTR</span>
                        <span class="hero-metric-value">${fPct(
                            c.ctr
                        )}</span>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;
}

/* -----------------------------------------------------------
    Insights Aggregation (nur Live-Daten)
----------------------------------------------------------- */

async function aggregateCampaigns(ids, preset) {
    let spend = 0,
        impressions = 0,
        clicks = 0,
        roasWeighted = 0,
        weight = 0;

    let minStart = null,
        maxStop = null;

    for (const id of ids) {
        try {
            const insights = await fetchMetaCampaignInsights(id, preset);
            if (!insights?.success) continue;

            const d = insights.data?.data?.[0];
            if (!d) continue;

            const s = Number(d.spend || 0);
            const imp = Number(d.impressions || 0);
            const clk = Number(d.clicks || 0);

            let r = 0;
            if (
                Array.isArray(d.website_purchase_roas) &&
                d.website_purchase_roas.length
            ) {
                r = Number(d.website_purchase_roas[0].value) || 0;
            }

            spend += s;
            impressions += imp;
            clicks += clk;

            if (s > 0 && r > 0) {
                roasWeighted += r * s;
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

            // Cache für Top-Kampagnen
            AppState.meta.insightsByCampaign[id] = {
                spend: s,
                impressions: imp,
                clicks: clk,
                roas: r,
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

function updateDashboardSummary(text) {
    const sumEl = getEl("dashboardMetaSummary");
    if (!sumEl) return;
    sumEl.textContent = text;
}

function timeRangeLabel(from, to) {
    if (!from || !to) return "Zeitraum unbekannt";
    const df = new Date(from);
    const dt = new Date(to);
    return `${df.toLocaleDateString("de-DE")} – ${dt.toLocaleDateString(
        "de-DE"
    )}`;
}

/* -----------------------------------------------------------
    Public API: updateDashboardView
----------------------------------------------------------- */

export async function updateDashboardView(connected) {
    const demoMode = !!AppState.settings?.demoMode;

    // Demo-Mode: keinerlei Live-Calls, rein über DEMO_DATA/AppState
    if (demoMode) {
        let metrics = AppState.dashboardMetrics;

        // Fallback: falls irgendwas fehlt, harte Defaults
        if (!metrics) {
            metrics = {
                spend: 0,
                impressions: 0,
                clicks: 0,
                ctr: 0,
                cpm: 0,
                roas: 0,
                scopeLabel: "Demo Account",
                timeRangeLabel: "Demo-Zeitraum"
            };
        }

        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel || "Demo Account"} • Demo-Modus – keine Live-API-Calls`
        );
        return;
    }

    // Kein Demo-Mode & nicht verbunden -> klassischer No-Data-State
    if (!connected) {
        renderKpis(null);
        renderPerformanceChart(null);
        renderTopCampaigns();
        updateDashboardSummary(
            "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        );
        return;
    }

    // Ab hier: Live-Mode
    try {
        const preset = AppState.timeRangePreset || "last_7d";
        const campaigns = AppState.meta?.campaigns || [];

        let metrics;

        if (!AppState.selectedCampaignId) {
            // Alle Kampagnen aggregieren
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
                    scopeLabel: `Alle Kampagnen (${campaigns.length})`,
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
            // Einzelne Kampagne
            const ir = await fetchMetaCampaignInsights(
                AppState.selectedCampaignId,
                preset
            );
            const d = ir?.data?.data?.[0];

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
                if (
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

        // Render
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}`
        );

        // Für Sensei/Reports im State hinterlegen
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
        renderTopCampaigns();
        updateDashboardSummary(
            "Fehler beim Laden der Dashboard-Daten. Bitte Verbindung und Berechtigungen prüfen."
        );
    }
}
