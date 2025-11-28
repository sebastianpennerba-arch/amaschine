// packages/creativeLibrary/creativeLibrary.demo.js
// Demo-Creatives für Creative Library (P2 Final Version)
// Stützt sich auf demoData.js, aber erweitert sie um fallback safety.

import { demoCreatives as baseDemo } from "../../demoData.js";

/**
 * Wir geben die Demo Creatives *immer* in einem sauberen, stabilen Format zurück,
 * weil demoData.js in Zukunft erweitert oder verändert wird.
 */
export const demoCreatives = baseDemo.map((c, idx) => ({
    id: c.id || `demo-${idx}`,
    name: c.name || c.title || "Demo Creative",
    headline: c.headline || "",
    thumbnail:
        c.thumbnail ||
        c.imageUrl ||
        "https://via.placeholder.com/300x300/cccccc/000000?text=Creative",
    type: c.type || "image",

    // KPIs – fallback auf 0
    roas: safeNum(c.roas),
    ctr: safeNum(c.ctr),
    cpm: safeNum(c.cpm),
    spend: safeNum(c.spend),
    conversions: safeNum(c.conversions),
    clicks: safeNum(c.clicks),
    impressions: safeNum(c.impressions)
}));

function safeNum(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}
