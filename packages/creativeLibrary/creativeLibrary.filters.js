// packages/creativeLibrary/creativeLibrary.filters.js
// Filter-, Such- und Sortierlogik für Creative Library.

function matchSearch(creative, search) {
    if (!search) return true;
    const q = search.toLowerCase();

    return (
        (creative.name || "").toLowerCase().includes(q) ||
        (creative.campaignName || "").toLowerCase().includes(q) ||
        (creative.adsetName || "").toLowerCase().includes(q) ||
        (creative.headline || "").toLowerCase().includes(q) ||
        (creative.landingPage || "").toLowerCase().includes(q)
    );
}

function matchType(creative, type) {
    if (!type || type === "all") return true;
    const t = (creative.type || "").toLowerCase();
    if (type === "static") return t === "image" || t === "static";
    if (type === "video") return t === "video";
    if (type === "carousel") return t === "carousel";
    return true;
}

function sortCreatives(creatives, sortKey) {
    const list = [...creatives];

    if (sortKey === "spend_desc") {
        return list.sort((a, b) => (b.spend || 0) - (a.spend || 0));
    }
    if (sortKey === "spend_asc") {
        return list.sort((a, b) => (a.spend || 0) - (b.spend || 0));
    }
    // Default: ROAS desc
    return list.sort((a, b) => (b.roas || 0) - (a.roas || 0));
}

/**
 * Gruppierung ist aktuell nur ein Metadatum – später können wir
 * wirklich gruppierte Renders machen. Vorerst flach.
 */
export function applyCreativeFilters(creatives, filters) {
    if (!Array.isArray(creatives)) return [];

    const { search, type, sort, groupBy } = filters;

    let result = creatives.filter(
        (c) => matchSearch(c, search) && matchType(c, type)
    );

    result = sortCreatives(result, sort);

    // groupBy wird als Info an den Renderer weitergegeben (noch keine echte Gruppen-UI)
    return {
        items: result,
        groupBy: groupBy || "none"
    };
}
