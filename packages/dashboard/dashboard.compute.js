// packages/dashboard/dashboard.compute.js
// Berechnungs-Engine für das Dashboard (Demo + Live)

import { AppState } from "../../state.js";
import { fetchMetaCampaignInsights } from "../../metaApi.js";
import { demoCampaigns } from "./dashboard.demo.js";

/**
 * DEMO: Aggregiert Kampagnen-Metriken aus Demo-Daten.
 */
export function calculateDemoMetrics() {
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
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    return {
        spend: totalSpend,
        revenue: totalRevenue,
        roas: weightedRoas,
        ctr,
        cpm,
        impressions: totalImpressions,
        clicks: totalClicks,
        scopeLabel: "Demo Account – Alle Kampagnen",
        timeRangeLabel: "Letzte 30 Tage"
    };
}

/**
 * Helper: formatiert ein Zeitbereichslabel.
 */
export function timeRangeLabel(from, to) {
    if (!from || !to) return "Zeitraum unbekannt";
    const df = new Date(from);
    const dt = new Date(to);
    return `${df.toLocaleDateString("de-DE")} – ${dt.toLocaleDateString(
        "de-DE"
    )}`;
}

/**
 * Aggregiert Insights für mehrere Kampagnen-IDs (Live-Mode).
 * Schreibt nebenbei AppState.meta.insightsByCampaign.
 */
export async function aggregateCampaigns(ids, preset) {
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

            if (!AppState.meta.insightsByCampaign) {
                AppState.meta.insightsByCampaign = {};
            }

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

/**
 * Zentrale State-Engine für das Dashboard.
 * Liefert einen einfachen State, den das Render-Modul nutzt.
 */
export async function computeDashboardState(connected) {
    const demoMode = !!AppState.settings?.demoMode;

    // DEMO MODE
    if (demoMode) {
        const metrics = calculateDemoMetrics();
        AppState.dashboardMetrics = metrics;
        AppState.dashboardLoaded = true;
        return {
            mode: "demo",
            metrics
        };
    }

    // Nicht verbunden & kein Demo
    if (!connected) {
        AppState.dashboardMetrics = null;
        AppState.dashboardLoaded = false;
        return {
            mode: "disconnected",
            metrics: null,
            summaryText:
                "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        };
    }

    // LIVE MODE
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
            const ir = await fetchMetaCampaignInsights(
                AppState.selectedCampaignId,
                preset
            );
            const d = ir?.data?.data?.[0];
            const campaignsList = AppState.meta?.campaigns || [];

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

                const camp = campaignsList.find(
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
                    timeRangeLabel: timeRangeLabel(d.date_start, d.date_stop)
                };
            }
        }

        AppState.dashboardMetrics = metrics;
        AppState.dashboardLoaded = true;

        return {
            mode: "live",
            metrics
        };
    } catch (error) {
        console.error("Dashboard Error:", error);

        const metrics = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            scopeLabel: "Fehler",
            timeRangeLabel: "Fehler"
        };

        AppState.dashboardMetrics = metrics;
        AppState.dashboardLoaded = false;

        return {
            mode: "error",
            metrics,
            error
        };
    }
}
