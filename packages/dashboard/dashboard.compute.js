// packages/dashboard/dashboard.compute.js
// Berechnet den Dashboard-Status für Live- und Demo-Mode.

import { AppState } from "../../state.js";
import { demoCampaigns, demoCreatives } from "../../demoData.js";
import { generateDashboardAlerts } from "./dashboard.alerts.js";

function safeNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function isDemoMode() {
    return !!AppState.settings?.demoMode;
}

/**
 * Aggregiert Kampagnen-Metriken aus Demo-Daten.
 */
function computeDemoMetrics() {
    const list = Array.isArray(demoCampaigns) ? demoCampaigns : [];

    if (!list.length) {
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

    list.forEach((c) => {
        const s = safeNumber(c.spend);
        const i = safeNumber(c.impressions);
        const cl = safeNumber(c.clicks);
        const conv = safeNumber(c.conversions);
        const r = safeNumber(c.roas);

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

    // Demo: simple pseudo-Trends
    const trendRoas = 0.12; // +12%
    const trendCtr = -0.05; // -5%
    const trendSpend = 0.18; // +18%

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

/**
 * Aggregiert Kampagnen-Metriken aus Live-Meta-Daten.
 */
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
        const s = safeNumber(m.spend);
        const i = safeNumber(m.impressions);
        const cl = safeNumber(m.clicks);
        const conv = safeNumber(m.conversions);
        const r = safeNumber(m.roas);

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

    // Live: Trends (wenn vorhanden), sonst 0
    const trendRoas = safeNumber(AppState.dashboardMetrics?.trendRoas || 0);
    const trendCtr = safeNumber(AppState.dashboardMetrics?.trendCtr || 0);
    const trendSpend = safeNumber(AppState.dashboardMetrics?.trendSpend || 0);

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

/**
 * Mapped Demo-Creatives in ein kompaktes Array für Top/Flop Block.
 */
function mapDemoCreatives() {
    const list = Array.isArray(demoCreatives) ? demoCreatives : [];
    return list.map((c, idx) => ({
        id: c.id || `demo-${idx}`,
        name: c.name || c.headline || "Demo Creative",
        thumbnail: c.thumbnail || c.imageUrl || "",
        roas: safeNumber(c.roas),
        ctr: safeNumber(c.ctr),
        spend: safeNumber(c.spend)
    }));
}

/**
 * Mapped Live-Ads aus AppState.meta.ads.
 */
function mapLiveCreatives() {
    const ads = Array.isArray(AppState.meta?.ads) ? AppState.meta.ads : [];
    return ads.map((a, idx) => {
        const insights = Array.isArray(a.insights?.data)
            ? a.insights.data[0]
            : a.insights?.data || a.insights || {};
        const spend = safeNumber(insights.spend);
        const impressions = safeNumber(insights.impressions);
        const clicks = safeNumber(insights.clicks);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        let roas = 0;
        if (
            Array.isArray(insights.website_purchase_roas) &&
            insights.website_purchase_roas.length
        ) {
            roas = safeNumber(insights.website_purchase_roas[0].value);
        }

        const thumb =
            a.thumbnail_url ||
            a.image_url ||
            a.creative?.thumbnail_url ||
            a.creative?.image_url ||
            "";

        return {
            id: a.id || `ad-${idx}`,
            name: a.name || a.ad_name || "Ad",
            thumbnail: thumb,
            roas,
            ctr,
            spend
        };
    });
}

/**
 * Zentrale State-Fabrik für das Dashboard.
 */
export async function buildDashboardState({ connected }) {
    const demoMode = isDemoMode();
    const effectiveDemo = demoMode || !connected || !AppState.metaConnected;

    let metrics;
    let creatives;

    if (effectiveDemo) {
        metrics = computeDemoMetrics();
        creatives = mapDemoCreatives();
    } else {
        metrics = computeLiveMetrics();
        creatives = mapLiveCreatives();
    }

    const alerts = generateDashboardAlerts(metrics);

    return {
        connected: !!connected && !demoMode,
        demoMode: !!demoMode,
        metrics,
        alerts,
        creatives
    };
}
