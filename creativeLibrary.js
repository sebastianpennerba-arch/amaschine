// creativeLibrary.js – Datads-Style Creative Library mit Grouping
// - nutzt AppState.meta.ads (Meta Ads Endpoint)
// - Grouping by: none, creative, ad_name, headline, landing_page, post_id
// - KPIs: Purchases, CPP, Spend, Hook->Click Ratio, Thumbstop Ratio, CPC, CTR, ROAS
// - 1..10000 Creatives – immer schöne Cards

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";

let filtersInitialized = false;

/* -------------------------------------------------------
   HILFSFUNKTIONEN: Actions, Values, Metrics
---------------------------------------------------------*/

function getInsights(ad) {
    return ad?.insights?.data?.[0] || {};
}

function getAction(insights, type) {
    const list = insights?.actions;
    if (!Array.isArray(list)) return 0;
    const entry = list.find((a) => a.action_type === type);
    if (!entry) return 0;
    return Number(entry.value || 0) || 0;
}

function getActionValue(insights, type) {
    const list = insights?.action_values;
    if (!Array.isArray(list)) return 0;
    const entry = list.find((a) => a.action_type === type);
    if (!entry) return 0;
    return Number(entry.value || 0) || 0;
}

function getAdMetrics(ad) {
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

    // Hook → Click und Thumbstop Ratio (best-effort aus Actions)
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

function getAdType(ad) {
    const spec = ad?.creative?.object_story_spec;
    if (!spec) return "static";
    if (spec.video_data) return "video";
    if (spec.carousel_data) return "carousel";
    if (spec.link_data) return "static";
    return "static";
}

function getAdThumbnail(ad) {
    const creative = ad.creative || {};
    if (creative.thumbnail_url) return creative.thumbnail_url;

    const spec = creative.object_story_spec || {};
    if (spec.video_data?.thumbnail_url) return spec.video_data.thumbnail_url;
    if (spec.link_data?.image_url) return spec.link_data.image_url;

    return null;
}

/* -------------------------------------------------------
   GROUPING
---------------------------------------------------------*/

function getGroupKeyAndLabel(ad, mode) {
    const creative = ad.creative || {};
    const spec = creative.object_story_spec || {};

    switch (mode) {
        case "creative": {
            const key = creative.id || ad.creative_id || ad.id;
            return { key, label: `Creative ${key || "n/a"}` };
        }
        case "ad_name": {
            const key = (ad.name || "").trim() || "Unbenannter Ad Name";
            return { key, label: key };
        }
        case "headline": {
            const headline =
                spec?.link_data?.message ||
                spec?.video_data?.title ||
                spec?.link_data?.name ||
                "Ohne Headline";
            return { key: headline, label: headline };
        }
        case "landing_page": {
            const lp =
                spec?.link_data?.link ||
                spec?.link_data?.link_url ||
                "Ohne Landing Page";
            return { key: lp, label: lp };
        }
        case "post_id": {
            const p = creative.object_story_id || ad.id;
            return { key: p, label: `Post ${p}` };
        }
        case "none":
        default: {
            const key = ad.id;
            const label = ad.name || `Ad ${ad.id}`;
            return { key, label };
        }
    }
}

function groupAds(ads, mode) {
    if (!mode || mode === "none") {
        // jede Ad ist eigene Gruppe
        return ads.map((ad) => {
            const { label } = getGroupKeyAndLabel(ad, "none");
            const m = getAdMetrics(ad);
            return {
                key: ad.id,
                label,
                ads: [ad],
                metrics: m
            };
        });
    }

    const map = new Map();

    ads.forEach((ad) => {
        const { key, label } = getGroupKeyAndLabel(ad, mode);
        if (!key) return;
        if (!map.has(key)) {
            map.set(key, { key, label, ads: [] });
        }
        map.get(key).ads.push(ad);
    });

    // Aggregierte Metriken je Gruppe
    const groups = [];
    for (const [, group] of map.entries()) {
        let agg = {
            spend: 0,
            impressions: 0,
            clicks: 0,
            purchases: 0,
            revenue: 0,
            ctr: 0,
            roas: 0,
            cpp: 0,
            cpc: 0,
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

/* -------------------------------------------------------
   PUBLIC API – View Update
---------------------------------------------------------*/

export async function updateCreativeLibraryView(initialLoad = false) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    initCreativeLibraryFiltersOnce();

    grid.innerHTML = "";

    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Verbinde Meta, um Creatives zu sehen.</p>";
        return;
    }

    if (!AppState.selectedAccountId) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Wähle oben ein Werbekonto.</p>";
        return;
    }

    if (initialLoad || !AppState.creativesLoaded) {
        try {
            const ads = await fetchMetaAds(AppState.selectedAccountId);
            AppState.meta.ads = Array.isArray(ads) ? ads : [];
            AppState.creativesLoaded = true;
        } catch (err) {
            console.error("Creative Load Error:", err);
            AppState.meta.ads = [];
            showToast("Fehler beim Laden der Creatives.", "error");
        }
    }

    if (!AppState.meta.ads.length) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Keine Creatives gefunden.</p>";
        return;
    }

    renderCreativeLibrary();
}

/* -------------------------------------------------------
   Filter-Init
---------------------------------------------------------*/

function initCreativeLibraryFiltersOnce() {
    if (filtersInitialized) return;
    filtersInitialized = true;

    const searchInput = document.getElementById("creativeSearch");
    const sortSelect = document.getElementById("creativeSort");
    const typeSelect = document.getElementById("creativeType");
    const groupSelect = document.getElementById("creativeGroupBy");

    if (searchInput) {
        searchInput.addEventListener("input", () => renderCreativeLibrary());
    }
    if (sortSelect) {
        sortSelect.addEventListener("change", () => renderCreativeLibrary());
    }
    if (typeSelect) {
        typeSelect.addEventListener("change", () => renderCreativeLibrary());
    }
    if (groupSelect) {
        groupSelect.addEventListener("change", () => renderCreativeLibrary());
    }
}

/* -------------------------------------------------------
   Renderer – Datads Style Cards
---------------------------------------------------------*/

export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    const search =
        document.getElementById("creativeSearch")?.value?.toLowerCase() || "";
    const sort = document.getElementById("creativeSort")?.value || "roas_desc";
    const typeFilter =
        document.getElementById("creativeType")?.value || "all";
    const groupBy =
        document.getElementById("creativeGroupBy")?.value || "none";

    let ads = [...(AppState.meta.ads || [])];

    // TYPE FILTER
    if (typeFilter !== "all") {
        ads = ads.filter((ad) => getAdType(ad) === typeFilter);
    }

    // SEARCH
    if (search.length > 0) {
        ads = ads.filter((ad) =>
            (ad.name || "").toLowerCase().includes(search)
        );
    }

    // GROUPING
    let groups = groupAds(ads, groupBy);

    // SORTING auf Gruppenebene (nach ROAS/Spend)
    groups.sort((a, b) => {
        const ma = a.metrics;
        const mb = b.metrics;

        switch (sort) {
            case "roas_desc":
                return (mb.roas || 0) - (ma.roas || 0);
            case "spend_desc":
                return (mb.spend || 0) - (ma.spend || 0);
            case "spend_asc":
                return (ma.spend || 0) - (mb.spend || 0);
            default:
                return 0;
        }
    });

    // Render
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();

    groups.forEach((group, index) => {
        const card = document.createElement("div");
        card.className = "creative-library-item";

        const anyAd = group.ads[0];
        const thumb = getAdThumbnail(anyAd);
        const adType = getAdType(anyAd);

        const m = group.metrics;
        const roas = m.roas || 0;
        const spend = m.spend || 0;
        const ctr = m.ctr || 0;
        const clicks = m.clicks || 0;
        const purchases = m.purchases || 0;
        const cpp = m.cpp || 0;
        const cpc = m.cpc || 0;
        const hcr = m.hookToClickRatio || 0;
        const tsr = m.thumbstopRatio || 0;

        const roasWidth = Math.min(roas * 20, 100);
        const spendNorm = Math.min(spend / 10, 100); // rein visuell

        const kp = (v, suffix = "", decimals = 2) =>
            v && v > 0 ? v.toFixed(decimals) + suffix : "--";

        card.innerHTML = `
            <div class="creative-media-container-library">
                ${
                    thumb
                        ? `<img src="${thumb}" alt="${group.label}"/>`
                        : `<div class="creative-faux-thumb">${
                              adType === "video" ? "▶" : "?"
                          }</div>`
                }
                <span class="platform-badge">Meta Ads</span>
                ${
                    groupBy !== "none"
                        ? `<div class="creative-rank-badge">#${index + 1}</div>`
                        : ""
                }
            </div>

            <div class="creative-stats">
                <div class="creative-name-library">${group.label}</div>
                <div class="creative-meta">
                    ${group.ads.length} Ad${
            group.ads.length === 1 ? "" : "s"
        } • ${adType === "video" ? "Video" : "Image/Link"}
                </div>

                <div class="creative-kpi-list">
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Purchases</span>
                        <span class="creative-kpi-value">${purchases || 0}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Cost per Purchase</span>
                        <span class="creative-kpi-value">€${kp(cpp, "", 2)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Spend</span>
                        <span class="creative-kpi-value">€${kp(spend, "", 2)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Hook → Click Ratio</span>
                        <span class="creative-kpi-value">${kp(hcr, "%", 1)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Thumbstop Ratio</span>
                        <span class="creative-kpi-value">${kp(tsr, "%", 1)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">CPC</span>
                        <span class="creative-kpi-value">€${kp(cpc, "", 3)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">CTR</span>
                        <span class="creative-kpi-value">${kp(ctr, "%", 2)}</span>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">ROAS</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill ${
                            roas >= 2 ? "fill-positive" : "fill-negative"
                        }" style="width:${roasWidth}%;"></div>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">Spend</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-spend" style="width:${spendNorm}%;"></div>
                    </div>
                </div>

                <div class="creative-footer-kpis">
                    <span>ROAS: ${kp(roas, "x", 2)}</span>
                    <span>CTR: ${kp(ctr, "%", 2)}</span>
                    <span>Clicks: ${clicks.toLocaleString("de-DE")}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => openCreativeModal(group));
        frag.appendChild(card);
    });

    grid.appendChild(frag);
}

/* -------------------------------------------------------
   MODAL – Details für eine Gruppe
---------------------------------------------------------*/

function openCreativeModal(group) {
    const anyAd = group.ads[0];
    const m = group.metrics;

    const thumb = getAdThumbnail(anyAd);
    const adType = getAdType(anyAd);

    const kp = (v, suffix = "", decimals = 2) =>
        v && v > 0 ? v.toFixed(decimals) + suffix : "--";

    const html = `
        <div class="modal-section">
            <div class="modal-section-title">Creative Group</div>
            <div class="modal-row" style="align-items:flex-start;">
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:15px; margin-bottom:6px;">
                        ${group.label}
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);">
                        ${group.ads.length} Ad${
        group.ads.length === 1 ? "" : "s"
    } • Typ: ${adType === "video" ? "Video" : "Image/Link"}
                    </div>
                </div>
                <div style="width:140px;height:90px;border-radius:10px;overflow:hidden;border:1px solid var(--border);">
                    ${
                        thumb
                            ? `<img src="${thumb}" alt="${group.label}" style="width:100%;height:100%;object-fit:cover;"/>`
                            : `<div class="creative-faux-thumb" style="height:100%;">${
                                  adType === "video" ? "▶" : "?"
                              }</div>`
                    }
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Performance (aggregiert)</div>
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
                <div class="metric-chip">
                    <div class="metric-label">Purchases</div>
                    <div class="metric-value">${m.purchases || 0}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Cost per Purchase</div>
                    <div class="metric-value">€${kp(m.cpp)}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Spend</div>
                    <div class="metric-value">€${kp(m.spend)}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">ROAS</div>
                    <div class="metric-value">${kp(m.roas, "x")}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">CTR</div>
                    <div class="metric-value">${kp(m.ctr, "%")}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">CPC</div>
                    <div class="metric-value">€${kp(m.cpc, "", 3)}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Hook → Click</div>
                    <div class="metric-value">${kp(m.hookToClickRatio, "%", 1)}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Thumbstop Ratio</div>
                    <div class="metric-value">${kp(m.thumbstopRatio, "%", 1)}</div>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Enthaltene Ads</div>
            <ul style="max-height:160px;overflow:auto;font-size:12px;padding-left:18px;">
                ${group.ads
                    .map(
                        (ad) => `<li>
                            <strong>${ad.name || "(ohne Namen)"}</strong>
                            &nbsp;–&nbsp; ID: ${ad.id}
                        </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;

    openModal("Creative Details", html);
}
