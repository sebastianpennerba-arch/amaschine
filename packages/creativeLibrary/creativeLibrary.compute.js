// packages/creativeLibrary/creativeLibrary.compute.js
// State- & KPI-Engine für Creative Library (Demo + Live).

import { AppState } from "../../state.js";
import { demoCreatives } from "./creativeLibrary.demo.js";
import { applyCreativeFilters } from "./creativeLibrary.filters.js";

function mapDemoCreatives() {
    return demoCreatives.map((c, idx) => ({
        id: c.id || `demo-${idx}`,
        name: c.name || c.headline || "Demo Creative",
        campaignName: c.campaignName || "Demo Campaign",
        adsetName: c.adsetName || "Demo Adset",
        type: c.type || "image",
        platform: c.platform || "Meta",
        thumbnail: c.thumbnail || c.imageUrl || "",
        roas: Number(c.roas || 0),
        spend: Number(c.spend || 0),
        ctr: Number(c.ctr || 0),
        cpm: Number(c.cpm || 0),
        impressions: Number(c.impressions || 0),
        clicks: Number(c.clicks || 0),
        conversions: Number(c.conversions || 0),
        rank: c.rank || idx + 1
    }));
}

function safeNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function mapLiveCreatives() {
    const ads = AppState.meta?.ads || [];

    return ads.map((a, idx) => {
        const insights = Array.isArray(a.insights?.data)
            ? a.insights.data[0]
            : a.insights?.data || a.insights || null;

        const spend = safeNumber(insights?.spend);
        const impressions = safeNumber(insights?.impressions);
        const clicks = safeNumber(insights?.clicks);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

        let roas = 0;
        if (
            Array.isArray(insights?.website_purchase_roas) &&
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
            campaignName: a.campaign_name || a.campaign?.name || "",
            adsetName: a.adset_name || a.adset?.name || "",
            type: (a.creative?.object_type || a.object_type || "image").toLowerCase(),
            platform: "Meta",
            thumbnail: thumb,
            roas,
            spend,
            ctr,
            cpm,
            impressions,
            clicks,
            conversions: safeNumber(insights?.actions?.find?.((x) => x.action_type === "purchase")?.value),
            rank: idx + 1
        };
    });
}

/**
 * Zentrale State-Fabrik für Creative Library.
 */
export async function buildCreativeLibraryState({ connected, filters }) {
    const demoMode = !!AppState.settings?.demoMode;

    let baseCreatives;
    let mode = "live";

    if (demoMode || !connected) {
        baseCreatives = mapDemoCreatives();
        mode = demoMode ? "demo" : "disconnected";
    } else {
        baseCreatives = mapLiveCreatives();
        mode = "live";
    }

    const { items, groupBy } = applyCreativeFilters(baseCreatives, filters || {});

    return {
        mode,
        items,
        baseItems: baseCreatives,
        filters: filters || {},
        groupBy
    };
}
