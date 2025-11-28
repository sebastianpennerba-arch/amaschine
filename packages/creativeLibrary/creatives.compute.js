// packages/creatives/creatives.compute.js
// Metrics, Grouping, Type/Thumbnail für Creative Library

function getInsights(ad) {
    return ad?.insights?.data?.[0] || {};
}

function getAction(ins, type) {
    const list = ins?.actions;
    if (!Array.isArray(list)) return 0;
    const entry = list.find((a) => a.action_type === type);
    return entry ? Number(entry.value || 0) : 0;
}

function getActionValue(ins, type) {
    const list = ins?.action_values;
    if (!Array.isArray(list)) return 0;
    const entry = list.find((a) => a.action_type === type);
    return entry ? Number(entry.value || 0) : 0;
}

export function getAdMetrics(ad) {
    const ins = getInsights(ad);

    const spend = Number(ins.spend || 0);
    const impressions = Number(ins.impressions || 0);
    const clicks = Number(ins.clicks || 0);

    const purchases =
        getAction(ins, "purchase") ||
        getAction(ins, "offsite_conversion.purchase") ||
        getAction(ins, "website_purchase");

    const revenue =
        getActionValue(ins, "purchase") ||
        getActionValue(ins, "offsite_conversion.purchase") ||
        getActionValue(ins, "website_purchase");

    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const roas = spend > 0 && revenue > 0 ? revenue / spend : 0;
    const cpp = purchases > 0 ? spend / purchases : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;

    const hooks =
        getAction(ins, "link_click") ||
        getAction(ins, "post_engagement") ||
        0;

    const videoPlays =
        getAction(ins, "video_plays") ||
        getAction(ins, "video_10s_views") ||
        0;

    const hookToClickRatio = hooks > 0 ? (clicks / hooks) * 100 : 0;
    const thumbstopRatio =
        impressions > 0 && videoPlays > 0
            ? (videoPlays / impressions) * 100
            : 0;

    return {
        spend,
        impressions,
        clicks,
        ctr,
        roas,
        cpp,
        cpc,
        purchases,
        revenue,
        hookToClickRatio,
        thumbstopRatio
    };
}

export function getAdType(ad) {
    const spec = ad?.creative?.object_story_spec;
    if (!spec) return "static";
    if (spec.video_data) return "video";
    if (spec.carousel_data) return "carousel";
    if (spec.link_data) return "static";
    return "static";
}

export function getAdThumbnail(ad) {
    const creative = ad.creative || {};

    if (creative.thumbnail_url) return creative.thumbnail_url;

    const spec = creative.object_story_spec || {};

    if (spec.video_data?.thumbnail_url) return spec.video_data.thumbnail_url;
    if (spec.link_data?.image_url) return spec.link_data.image_url;

    return null;
}

function getGroupKey(ad, mode) {
    const creative = ad.creative || {};
    const spec = creative.object_story_spec || {};

    switch (mode) {
        case "creative":
            return creative.id || ad.creative_id || ad.id;

        case "ad_name":
            return (ad.name || "").trim() || "Unnamed Ad";

        case "headline":
            return (
                spec?.link_data?.message ||
                spec?.video_data?.title ||
                spec?.link_data?.name ||
                "Ohne Headline"
            );

        case "landing_page":
            return (
                spec?.link_data?.link ||
                spec?.link_data?.link_url ||
                "Ohne Landing Page"
            );

        case "post_id":
            return creative.object_story_id || ad.id;

        default:
            return ad.id;
    }
}

function getGroupLabel(ad, mode) {
    const creative = ad.creative || {};
    const spec = creative.object_story_spec || {};

    switch (mode) {
        case "creative":
            return `Creative ${creative.id || ad.id}`;

        case "ad_name":
            return ad.name || "Unnamed Ad";

        case "headline":
            return (
                spec?.link_data?.message ||
                spec?.video_data?.title ||
                spec?.link_data?.name ||
                "Ohne Headline"
            );

        case "landing_page":
            return (
                spec?.link_data?.link ||
                spec?.link_data?.link_url ||
                "Ohne Landing Page"
            );

        case "post_id":
            return `Post ${creative.object_story_id || ad.id}`;

        default:
            return ad.name || `Ad ${ad.id}`;
    }
}

export function groupAds(ads, mode) {
    if (!mode || mode === "none") {
        return ads.map((ad) => {
            const metrics = getAdMetrics(ad);
            return {
                key: ad.id,
                label: getGroupLabel(ad, "none"),
                ads: [ad],
                metrics
            };
        });
    }

    const map = new Map();

    ads.forEach((ad) => {
        const key = getGroupKey(ad, mode);
        const label = getGroupLabel(ad, mode);
        const existing = map.get(key);

        if (existing) {
            existing.ads.push(ad);
        } else {
            map.set(key, { key, label, ads: [ad], metrics: null });
        }
    });

    const groups = [];

    for (const [, group] of map.entries()) {
        let agg = {
            spend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0,
            revenue: 0,
            hookToClickRatio: 0,
            thumbstopRatio: 0
        };

        group.ads.forEach((ad) => {
            const m = getAdMetrics(ad);
            agg.spend += m.spend;
            agg.impressions += m.impressions;
            agg.clicks += m.clicks;
            agg.purchases += m.purchases;
            agg.revenue += m.revenue;
            agg.hookToClickRatio += m.hookToClickRatio;
            agg.thumbstopRatio += m.thumbstopRatio;
        });

        agg.ctr =
            agg.impressions > 0
                ? (agg.clicks / agg.impressions) * 100
                : 0;

        agg.roas =
            agg.spend > 0 && agg.revenue > 0 ? agg.revenue / agg.spend : 0;

        agg.cpp = agg.purchases > 0 ? agg.spend / agg.purchases : 0;
        agg.cpc = agg.clicks > 0 ? agg.spend / agg.clicks : 0;

        group.metrics = agg;
        groups.push(group);
    }

    return groups;
}

export function sortGroups(groups, sort) {
    const list = Array.isArray(groups) ? [...groups] : [];
    list.sort((a, b) => {
        const ma = a.metrics;
        const mb = b.metrics;

        if (!ma || !mb) return 0;

        if (sort === "roas_desc") return mb.roas - ma.roas;
        if (sort === "spend_desc") return mb.spend - ma.spend;
        if (sort === "spend_asc") return ma.spend - mb.spend;
        return 0;
    });
    return list;
}
