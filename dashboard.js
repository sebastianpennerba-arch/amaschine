// dashboard.js – Premium Dashboard (Option B, verfeinert)
// -----------------------------------------------------------
// Ziele der Premium-Version:
// - Einheitliche KPI-Komponenten (Metric Chips)
// - Harmonisierte Balken-Visualisierung im Performance Profil
// - Effizientere Insights-Aggregation
// - Verbesserte Fehlerbehandlung & Null-Schutz
// - Konsistentes UI mit Creative Library + Campaign Manager

import { AppState } from "./state.js";
import {
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaCampaignInsights
} from "./metaApi.js";

/* -----------------------------------------------------------
   Utility Helpers
----------------------------------------------------------- */

const nf = new Intl.NumberFormat("de-DE");

function fEuro(v) {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "€ 0" : `€ ${nf.format(n)}`;
}

function fPct(v) {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0%" : `${n.toFixed(2)}%`;
}

function fRoas(v) {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0x" : `${n.toFixed(2)}x`;
}

function timeRangeLabel(start, stop) {
    if (!start || !stop) return "Keine Daten";
    const s = new Date(start);
    const e = new Date(stop);
    if (isNaN(s) || isNaN(e)) return "Keine Daten";

    const same =
        s.getFullYear() === e.getFullYear() &&
        s.getMonth() === e.getMonth() &&
        s.getDate() === e.getDate();
    if (same) return s.toLocaleDateString("de-DE");

    const diffDays = Math.floor((e - s) / 86400000) + 1;
    if (diffDays === 7) return "Letzte 7 Tage";
    if (diffDays === 30) return "Letzte 30 Tage";

    return `${s.toLocaleDateString("de-DE")} – ${e.toLocaleDateString("de-DE")}`;
}

/* -----------------------------------------------------------
   KPI Placeholder
----------------------------------------------------------- */

function renderKpiPlaceholder() {
    const cont = document.getElementById("dashboardKpiContainer");
    if (!cont) return;

    cont.innerHTML = `
        <div class="kpi-grid">
            ${["Ad Spend", "ROAS", "CTR", "CPM"]
                .map(
                    (l) => `
                <div class="kpi-card">
                    <div class="kpi-label">${l}</div>
                    <div class="kpi-value">–</div>
                    <div class="kpi-trend trend-neutral">Verbinde Meta</div>
                </div>
                `
                )
                .join("")}
        </div>
    `;
}

/* -----------------------------------------------------------
   KPI Live Rendering
----------------------------------------------------------- */

function renderKpis(metrics) {
    const cont = document.getElementById("dashboardKpiContainer");
    if (!cont) return;

    if (!metrics) {
        renderKpiPlaceholder();
        return;
    }

    const { spend, roas, ctr, cpm } = metrics;

    cont.innerHTML = `
        <div class="kpi-grid">

            <div class="kpi-card">
                <div class="kpi-label">
                    <i class="fa-solid fa-coins"></i>
                    Umsatz / Spend
                </div>
                <div class="kpi-value">${fEuro(spend)}</div>
                <div class="kpi-trend trend-neutral">Basis: ${metrics.scopeLabel}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">
                    <i class="fa-solid fa-rocket"></i>
                    ROAS (gewichtet)
                </div>
                <div class="kpi-value">${fRoas(roas)}</div>
                <div class="kpi-trend trend-neutral">Zeitraum: ${metrics.timeRangeLabel}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">
                    <i class="fa-solid fa-mouse-pointer"></i>
                    CTR
                </div>
                <div class="kpi-value">${fPct(ctr)}</div>
                <div class="kpi-trend trend-neutral">Impressions: ${nf.format(
                    metrics.impressions || 0
                )}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label">
                    <i class="fa-solid fa-chart-column"></i>
                    CPM
                </div>
                <div class="kpi-value">${fEuro(cpm)}</div>
                <div class="kpi-trend trend-neutral">Klicks: ${nf.format(
                    metrics.clicks || 0
                )}</div>
            </div>

        </div>
    `;
}

/* -----------------------------------------------------------
   Performance Profile (Balken)
----------------------------------------------------------- */

function renderPerformanceChart(metrics) {
    const cont = document.getElementById("dashboardChartContainer");
    if (!cont) return;

    if (!metrics) {
        cont.innerHTML = `
            <div class="card performance-card">
                <h3>Performance Profil</h3>
                <div class="chart-placeholder">Verbinde Meta…</div>
            </div>
        `;
        return;
    }

    const rows = [
        { label: "Spend", value: Number(metrics.spend), formatted: fEuro(metrics.spend) },
        { label: "ROAS", value: Number(metrics.roas), formatted: fRoas(metrics.roas) },
        { label: "CTR", value: Number(metrics.ctr), formatted: fPct(metrics.ctr) },
        { label: "CPM", value: Number(metrics.cpm), formatted: fEuro(metrics.cpm) }
    ];

    const maxVal = Math.max(...rows.map((r) => r.value || 0), 1);

    cont.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <h3>Performance Profil</h3>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">
                    Basis: ${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}
                </div>
                <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                    Impressionen: ${nf.format(
                        metrics.impressions || 0
                    )} • Klicks: ${nf.format(metrics.clicks || 0)}
                </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:14px; padding-top:8px;">
                ${rows
                    .map((r) => {
                        const pct = r.value > 0 ? Math.max(6, (r.value / maxVal) * 100) : 6;
                        return `
                        <div style="display:flex; align-items:center; gap:12px;">
                            <div style="width:110px; font-size:12px; color:var(--text-secondary);">
                                ${r.label}
                            </div>
                            <div style="flex:1; height:8px; border-radius:999px; background:rgba(148,163,184,0.35); overflow:hidden;">
                                <div style="
                                    width:${pct}%; 
                                    height:100%; 
                                    background:var(--color-primary);
                                    border-radius:inherit;">
                                </div>
                            </div>
                            <div style="width:90px; text-align:right; font-size:12px; color:var(--text-primary);">
                                ${r.formatted}
                            </div>
                        </div>
                        `;
                    })
                    .join("")}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
   Top-Kampagnen (Impact Ranking)
----------------------------------------------------------- */

function renderTopCampaigns() {
    const cont = document.getElementById("dashboardHeroCreativesContainer");
    if (!cont) return;

    if (!AppState.metaConnected || !AppState.meta.campaigns.length) {
        cont.innerHTML = `
            <div class="card">
                <h3>Top-Kampagnen</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-top:8px;">
                    Hier erscheinen deine stärksten Kampagnen sobald Spend & ROAS vorliegen.
                </p>
            </div>
        `;
        return;
    }

    const enrich = Object.entries(AppState.meta.insightsByCampaign || []).map(
        ([id, m]) => {
            const camp = AppState.meta.campaigns.find((c) => c.id === id) || {};
            return {
                id,
                name: camp.name || id,
                spend: Number(m.spend || 0),
                roas: Number(m.roas || 0),
                ctr: Number(m.ctr || 0)
            };
        }
    );

    enrich.sort((a, b) => b.spend * b.roas - a.spend * a.roas);
    const top3 = enrich.slice(0, 3);

    if (!top3.length) {
        cont.innerHTML = `
            <div class="card">
                <h3>Top-Kampagnen</h3>
                <p style="color:var(--text-secondary);font-size:14px;margin-top:8px;">
                    Noch keine verwertbaren Daten (Spend & ROAS = 0).
                </p>
            </div>
        `;
        return;
    }

    cont.innerHTML = `
        <div class="card" style="margin-bottom:16px;">
            <h3>Top-Kampagnen (Impact-basiert)</h3>
            <p style="color:var(--text-secondary);font-size:12px;margin-top:4px;">
                Ranking nach Spend × ROAS
            </p>
        </div>
        <div class="hero-grid">
            ${top3
                .map(
                    (c, i) => `
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div style="
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            width:100%;
                            height:100%;
                            background:rgba(15,23,42,0.85);
                            color:#fff;
                            font-size:20px;
                            font-weight:700;">
                            #${i + 1}
                        </div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">${c.name}</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS</span>
                            <span class="kpi-value-mini">${fRoas(c.roas)}</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>Spend</span>
                            <span class="kpi-value-mini">${fEuro(c.spend)}</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>CTR</span>
                            <span class="kpi-value-mini">${fPct(c.ctr)}</span>
                        </div>
                    </div>
                </div>
                `
                )
                .join("")}
        </div>
    `;
}

/* -----------------------------------------------------------
   Insights Aggregation
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
            if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length) {
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

            // Cache für Top-Kampagnen-View
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
   Helper: Dashboard Summary
----------------------------------------------------------- */

function updateDashboardSummary(text) {
    const sumEl = document.getElementById("dashboardMetaSummary");
    if (!sumEl) return;
    sumEl.textContent = text;
}

/* -----------------------------------------------------------
   Public: Dashboard Update
----------------------------------------------------------- */

export async function updateDashboardView(connected) {
    if (!connected) {
        renderKpiPlaceholder();
        renderPerformanceChart(null);
        renderTopCampaigns();
        updateDashboardSummary(
            "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        );
        return;
    }

    try {
        // 1) Ad Accounts laden (falls noch nicht da)
        let accounts = AppState.meta.adAccounts;
        if (!accounts.length) {
            const res = await fetchMetaAdAccounts();
            if (!res?.success) throw new Error("Ad Accounts Fehler");
            accounts = res.data.data;
            AppState.meta.adAccounts = accounts;
        }

        // Default: erstes Werbekonto
        if (!AppState.selectedAccountId && accounts.length) {
            AppState.selectedAccountId = accounts[0].id;
        }

        // 2) Kampagnen für ausgewähltes Werbekonto laden
        const cr = await fetchMetaCampaigns(AppState.selectedAccountId);
        if (!cr?.success) throw new Error("Kampagnen Fehler");

        const campaigns = cr.data.data || [];
        AppState.meta.campaigns = campaigns;

        if (!campaigns.length) {
            const metrics = {
                spend: 0,
                roas: 0,
                ctr: 0,
                cpm: 0,
                impressions: 0,
                clicks: 0,
                scopeLabel: "Keine Kampagnen",
                timeRangeLabel: "Keine Daten"
            };
            renderKpis(metrics);
            renderPerformanceChart(metrics);
            renderTopCampaigns();
            updateDashboardSummary(
                "Keine Kampagnen im aktuell ausgewählten Werbekonto gefunden."
            );
            return;
        }

        // 3) Aggregation auf Basis des Time-Range-Presets
        const preset = AppState.timeRangePreset || "last_30d";
        let metrics = null;

        if (!AppState.selectedCampaignId) {
            // Alle Kampagnen aggregiert
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
                    timeRangeLabel: timeRangeLabel(agg.dateStart, agg.dateStop)
                };
            }
        } else {
            // Einzelne Kampagne
            const ir = await fetchMetaCampaignInsights(AppState.selectedCampaignId, preset);
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
                if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length) {
                    roas = Number(d.website_purchase_roas[0].value || 0);
                }

                const camp = campaigns.find((c) => c.id === AppState.selectedCampaignId);

                metrics = {
                    spend: s,
                    roas,
                    ctr,
                    cpm,
                    impressions: imp,
                    clicks: clk,
                    scopeLabel: camp ? camp.name : "Kampagne",
                    timeRangeLabel: timeRangeLabel(d.date_start, d.date_stop)
                };
            }
        }

        // 4) Render everything
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();

        // Dashboard Summary oben unter dem Titel
        updateDashboardSummary(
            `${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}`
        );
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
