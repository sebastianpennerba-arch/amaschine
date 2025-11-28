// packages/dashboard/dashboard.demo.js
// Demo-Quelle für das Dashboard (P1 Final)
// Aggregiert Demo-Kampagnen und Creatives in ein stabiles Format.

import { demoCampaigns, demoCreatives } from "../../demoData.js";

export function getDemoDashboardMetrics() {
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
        const s = num(c.spend);
        const i = num(c.impressions);
        const cl = num(c.clicks);
        const conv = num(c.conversions);
        const r = num(c.roas);

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

    // Demo: einfache feste Trends, damit Alerts & Badges „leben“
    const trendRoas = 0.10; // +10%
    const trendCtr = -0.06; // -6%
    const trendSpend = 0.22; // +22%

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

export function getDemoCreativesForDashboard() {
    const list = Array.isArray(demoCreatives) ? demoCreatives : [];

    return list.map((c, idx) => ({
        id: c.id || `demo-${idx}`,
        name: c.name || c.title || "Demo Creative",
        thumbnail:
            c.thumbnail ||
            c.imageUrl ||
            "https://via.placeholder.com/250x250/cccccc/000000?text=Creative",
        roas: num(c.roas),
        ctr: num(c.ctr),
        spend: num(c.spend)
    }));
}

function num(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}
