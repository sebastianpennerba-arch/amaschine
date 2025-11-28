// packages/dashboard/dashboard.compute.js
// KPI-Engine für das Dashboard (Phase 1 Final)
// Kombiniert Demo- und Live-Daten & baut einen sauberen State.

import { AppState } from "../../state.js";
import { getDemoDashboardMetrics, getDemoCreativesForDashboard } from "./dashboard.demo.js";
import { generateDashboardAlerts } from "./dashboard.alerts.js";

export async function buildDashboardState({ connected }) {
    const demoMode = !!AppState.settings?.demoMode;

    const effectiveDemo = demoMode || !connected || !AppState.metaConnected;

    let metrics;
    let creatives;

    if (effectiveDemo) {
        metrics = getDemoDashboardMetrics();
        creatives = getDemoCreativesForDashboard();
    } else {
        metrics = computeLiveMetrics();
        creatives = mapLiveCreatives();
    }

    // Alerts
    const alerts = generateDashboardAlerts(metrics);

    // Funnel Scores (ganz simpel, Phase-1-Light)
    const funnel = computeFunnelScores(metrics);

    // Persistiere KPIs im AppState für andere Module (Reports, Sensei, etc.)
    AppState.dashboardMetrics = metrics;

    return {
        connected: !!connected && !demoMode,
        demoMode: !!demoMode,
        metrics,
        alerts,
        creatives,
        funnel
    };
}

/* ============================================================
   LIVE METRICS
============================================================ */

function computeLiveMetrics() {
    const insightsMap = AppState.meta?.insightsByCampaign || {};
    const ids = Object.keys(insightsMap);

    if (!ids.length) {
        return {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            trendRoas: 0,
            trendCtr: 0,
            trendSpend: 0
        };
    }

    let spend = 0;
    let impressions = 0;
    let clicks = 0;
    let conversions = 0;
    let roasWeighted = 0;

    ids.forEach((id) => {
        const m = insightsMap[id] || {};
        const s = num(m.spend);
        const i = num(m.impressions);
        const cl = num(m.clicks);
        const conv = num(m.conversions);
        const r = num(m.roas);

        spend += s;
        impressions += i;
        clicks += cl;
        conversions += conv;
        if (s > 0) {
            roasWeighted += r * s;
        }
    });

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const roas = spend > 0 ? roasWeighted / spend : 0;

    // Solange keine echten Trendwerte existieren,
    // lesen wir sie aus AppState.dashboardMetrics (falls vorhanden) oder setzen 0.
    const trendRoas = num(AppState.dashboardMetrics?.trendRoas);
    const trendCtr = num(AppState.dashboardMetrics?.trendCtr);
    const trendSpend = num(AppState.dashboardMetrics?.trendSpend);

    return {
        spend,
        roas,
        ctr,
        cpm,
        impressions,
        clicks,
        conversions,
        trendRoas,
        trendCtr,
        trendSpend
    };
}

function mapLiveCreatives() {
    const ads = Array.isArray(AppState.meta?.ads) ? AppState.meta.ads : [];

    return ads.map((ad, idx) => {
        const insights = extractAdInsights(ad);
        const thumb =
            ad.thumbnail_url ||
            ad.image_url ||
            ad.creative?.thumbnail_url ||
            ad.creative?.image_url ||
            "";

        return {
            id: ad.id || `ad-${idx}`,
            name: ad.name || ad.ad_name || "Ad",
            thumbnail: thumb,
            roas: insights.roas,
            ctr: insights.ctr,
            spend: insights.spend
        };
    });
}

function extractAdInsights(ad) {
    let i = {};
    if (Array.isArray(ad.insights?.data) && ad.insights.data.length > 0) {
        i = ad.insights.data[0];
    } else if (ad.insights?.data) {
        i = ad.insights.data;
    } else if (ad.insights) {
        i = ad.insights;
    }

    const spend = num(i.spend);
    const impressions = num(i.impressions);
    const clicks = num(i.clicks);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    let roas = 0;
    if (
        Array.isArray(i.website_purchase_roas) &&
        i.website_purchase_roas.length
    ) {
        roas = num(i.website_purchase_roas[0].value);
    }

    return {
        spend,
        impressions,
        clicks,
        ctr,
        roas
    };
}

/* ============================================================
   FUNNEL SCORES (Sehr einfache Heuristik für Phase 1)
============================================================ */

function computeFunnelScores(metrics) {
    const { ctr = 0, roas = 0, conversions = 0 } = metrics;

    // TOF über CTR
    let tof = 5;
    if (ctr > 1.5) tof = 9;
    else if (ctr > 1.0) tof = 7;
    else if (ctr < 0.5) tof = 3;

    // MOF über CTR & Conversions
    let mof = 5;
    if (conversions > 500) mof = 9;
    else if (conversions > 200) mof = 7;
    else if (conversions < 50) mof = 3;

    // BOF über ROAS
    let bof = 5;
    if (roas > 3) bof = 9;
    else if (roas > 2) bof = 7;
    else if (roas < 1) bof = 3;

    return {
        tofScore: tof,
        mofScore: mof,
        bofScore: bof
    };
}

function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}
