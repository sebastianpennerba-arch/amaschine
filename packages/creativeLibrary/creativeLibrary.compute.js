// packages/creativeLibrary/creativeLibrary.compute.js
// Erzeugt den Zustand (State) der Creative Library: Live + Demo
// Wird über index.js → render() aufgerufen.

import { AppState } from "../../state.js";
import { demoCreatives } from "./creativeLibrary.demo.js";

/**
 * Liefert den aktuellen Creative-Library-State:
 * - verbunden? (connected)
 * - Demo oder Live?
 * - Creatives: Live Ads → gemappt auf Library-Format
 */
export async function buildCreativeLibraryState({ connected }) {
    const demoMode = !!AppState.settings?.demoMode;

    // DEMO → demoCreatives
    if (demoMode || !connected || !AppState.metaConnected) {
        return {
            connected: false,
            demoMode: true,
            creatives: mapDemoCreatives()
        };
    }

    // LIVE → Ads aus Meta Ads API (AppState.meta.ads)
    const ads = AppState.meta?.ads || [];

    return {
        connected: true,
        demoMode: false,
        creatives: mapLiveCreatives(ads)
    };
}

/* ============================================================
   DEMO
============================================================ */

function mapDemoCreatives() {
    return demoCreatives.map((c, idx) => ({
        id: c.id || `demo-${idx}`,
        name: c.name || c.title || "Demo Creative",
        headline: c.headline || "",
        thumbnail:
            c.thumbnail ||
            c.imageUrl ||
            "https://via.placeholder.com/250x250?text=Creative",
        type: c.type || "image",
        roas: number(c.roas),
        ctr: number(c.ctr),
        cpm: number(c.cpm),
        spend: number(c.spend),
        conversions: number(c.conversions),
        clicks: number(c.clicks),
        impressions: number(c.impressions)
    }));
}

/* ============================================================
   LIVE
============================================================ */

function mapLiveCreatives(ads) {
    return ads.map((ad, idx) => {
        const insights = extractInsights(ad);
        return {
            id: ad.id || `ad-${idx}`,
            name: ad.name || ad.ad_name || "Ad",
            headline: ad.creative?.headline || "",
            thumbnail:
                ad.thumbnail_url ||
                ad.image_url ||
                ad.creative?.thumbnail_url ||
                ad.creative?.image_url ||
                "https://via.placeholder.com/250x250?text=No+Image",
            type: detectType(ad),
            roas: insights.roas,
            ctr: insights.ctr,
            cpm: insights.cpm,
            spend: insights.spend,
            conversions: insights.conversions,
            clicks: insights.clicks,
            impressions: insights.impressions
        };
    });
}

function extractInsights(ad) {
    let i = {};
    if (Array.isArray(ad.insights?.data) && ad.insights.data.length > 0) {
        i = ad.insights.data[0];
    }

    const spend = number(i.spend);
    const impressions = number(i.impressions);
    const clicks = number(i.clicks);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    let roas = 0;
    if (
        Array.isArray(i.website_purchase_roas) &&
        i.website_purchase_roas.length
    ) {
        roas = number(i.website_purchase_roas[0].value);
    }

    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;

    return {
        spend,
        impressions,
        clicks,
        ctr,
        roas,
        cpm,
        conversions: number(i.conversions)
    };
}

/* ============================================================
   HELPERS
============================================================ */

function detectType(ad) {
    const t = ad.creative?.object_type || ad.creative?.asset_feed_spec;
    if (!t) return "image";
    if (typeof t === "string") return t;
    return "image";
}

function number(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}
