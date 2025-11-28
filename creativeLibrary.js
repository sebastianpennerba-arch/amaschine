// creativeLibrary.js – SignalOne.cloud
// Datads-Level Creative Library (Full KPIs, Grouping, Ranking, Bars + Deep Dive Modal)
// --------------------------------------------------------------

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";

let filtersInitialized = false;

/* ================================================================
   1. Insights / Metrics Helpers
==================================================================*/

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

/* ================================================================
   2. Creative Type + Thumbnail
==================================================================*/

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

/* ================================================================
   3. Grouping Logic
==================================================================*/

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

function groupAds(ads, mode) {
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

/* ================================================================
   4. PUBLIC API
==================================================================*/

export async function updateCreativeLibraryView(initialLoad = false) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    initCreativeLibraryFiltersOnce();

    if (!AppState.metaConnected) {
        grid.innerHTML =
            "<p style='color:var(--text-secondary);'>Nicht mit Meta verbunden.</p>";
        return;
    }

    if (!AppState.selectedAccountId) {
        grid.innerHTML =
            "<p style='color:var(--text-secondary);'>Kein Werbekonto ausgewählt.</p>";
        return;
    }

    if (initialLoad || !AppState.creativesLoaded) {
        try {
            const ads = await fetchMetaAds(AppState.selectedAccountId);
            AppState.meta.ads = Array.isArray(ads) ? ads : [];
            AppState.creativesLoaded = true;
        } catch (err) {
            console.error(err);
            showToast("Fehler beim Laden der Creatives.", "error");
            return;
        }
    }

    renderCreativeLibrary();
}

function initCreativeLibraryFiltersOnce() {
    if (filtersInitialized) return;
    filtersInitialized = true;

    ["creativeSearch", "creativeSort", "creativeType", "creativeGroupBy"].forEach(
        (id) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", () => renderCreativeLibrary());
            el.addEventListener("change", () => renderCreativeLibrary());
        }
    );
}

/* ================================================================
   5. RENDER – Datads Full Card Layout
==================================================================*/

export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    const search =
        document.getElementById("creativeSearch")?.value?.toLowerCase() || "";
    const sort = document.getElementById("creativeSort")?.value || "roas_desc";
    const typeFilter = document.getElementById("creativeType")?.value || "all";
    const groupBy = document.getElementById("creativeGroupBy")?.value || "none";

    let ads = [...(AppState.meta.ads || [])];

    if (typeFilter !== "all") {
        ads = ads.filter((ad) => getAdType(ad) === typeFilter);
    }

    if (search.length > 0) {
        ads = ads.filter((ad) =>
            (ad.name || "").toLowerCase().includes(search)
        );
    }

    let groups = groupAds(ads, groupBy);

    groups.sort((a, b) => {
        const ma = a.metrics;
        const mb = b.metrics;

        if (sort === "roas_desc") return mb.roas - ma.roas;
        if (sort === "spend_desc") return mb.spend - ma.spend;
        if (sort === "spend_asc") return ma.spend - mb.spend;
        return 0;
    });

    const frag = document.createDocumentFragment();
    grid.innerHTML = "";

    groups.forEach((group, index) => {
        const anyAd = group.ads[0];
        const m = group.metrics;

        const thumb = getAdThumbnail(anyAd);
        const adType = getAdType(anyAd);

        const purchases = m.purchases || 0;
        const cpp = m.cpp || 0;
        const spend = m.spend || 0;
        const hcr = m.hookToClickRatio || 0;
        const tsr = m.thumbstopRatio || 0;
        const cpc = m.cpc || 0;
        const ctr = m.ctr || 0;
        const roas = m.roas || 0;
        const clicks = m.clicks || 0;

        const kp = (v, s = "", d = 2) =>
            v > 0 ? v.toFixed(d) + s : "--";

        const roasWidth = Math.min(roas * 20, 100);
        const spendNorm = Math.min(spend / 10, 100);

        const card = document.createElement("div");
        card.className = "creative-library-item";

        card.innerHTML = `
            <div class="creative-media-container-library">
                ${
                    thumb
                        ? `<img src="${thumb}" alt="${group.label}" />`
                        : `<div class="creative-faux-thumb">${
                              adType === "video" ? "▶" : "?"
                          }</div>`
                }
                ${
                    groupBy !== "none"
                        ? `<div class="creative-rank-badge">#${index + 1}</div>`
                        : ""
                }
            </div>

            <div class="creative-stats">
                <div class="creative-name-library">${group.label}</div>
                <div class="creative-meta">${group.ads.length} Ad${
            group.ads.length > 1 ? "s" : ""
        } • ${adType}</div>

                <div class="creative-kpi-line"><span class="creative-kpi-label">Purchases</span><span class="creative-kpi-value">${purchases}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">Cost per Purchase</span><span class="creative-kpi-value">€${kp(cpp)}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">Spend</span><span class="creative-kpi-value">€${kp(spend)}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">Hook → Click Ratio</span><span class="creative-kpi-value">${kp(hcr, "%", 1)}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">Thumbstop Ratio</span><span class="creative-kpi-value">${kp(tsr, "%", 1)}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">CPC</span><span class="creative-kpi-value">€${kp(cpc, "", 3)}</span></div>
                <div class="creative-kpi-line"><span class="creative-kpi-label">CTR</span><span class="creative-kpi-value">${kp(ctr, "%")}</span></div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">ROAS</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill ${
                            roas >= 2 ? "fill-positive" : "fill-negative"
                        }" style="width:${roasWidth}%"></div>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">Spend</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-spend" style="width:${spendNorm}%"></div>
                    </div>
                </div>

                <div class="creative-footer-kpis">
                    <span>ROAS: ${kp(roas, "x")}</span>
                    <span>CTR: ${kp(ctr, "%")}</span>
                    <span>Clicks: ${clicks}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => openCreativeModal(group));
        frag.appendChild(card);
    });

    grid.appendChild(frag);
}

/* ================================================================
   6. Creative Deep Dive Modal
==================================================================*/

function buildSenseiSnapshot(m) {
    if (!m || !m.spend) {
        return "Noch zu wenig Daten für eine Bewertung. Lass den Creative länger laufen oder erhöhe das Budget.";
    }

    if (m.roas >= 3 && m.ctr >= 2) {
        return "🔥 Sensei sagt: Das ist ein Winner. Skalieren mit +20–30% Budget pro Tag, solange ROAS stabil bleibt.";
    }

    if (m.roas >= 1.5) {
        return "⚖️ Solider Creative. Leichtes Upscaling testen und parallel neue Varianten launchen.";
    }

    if (m.roas > 0 && m.ctr < 1) {
        return "⚠️ Hook ist schwach. CTR ist niedrig – teste aggressivere Hooks und klarere Problem-Statements in den ersten 3 Sekunden.";
    }

    return "🧊 Performance aktuell unter Durchschnitt. Budget eher begrenzen und aus den Hooks/Angles für neue Tests lernen.";
}

function openCreativeModal(group) {
    const m = group.metrics;
    const anyAd = group.ads[0];
    const thumb = getAdThumbnail(anyAd);
    const adType = getAdType(anyAd);

    const kp = (v, s = "", d = 2) =>
        v > 0 ? v.toFixed(d) + s : "--";

    const adRows = group.ads
        .map((ad) => {
            const mm = getAdMetrics(ad);
            const link =
                ad.permalink_url ||
                ad.creative?.object_story_spec?.link_data?.link ||
                ad.creative?.object_story_spec?.link_data?.link_url ||
                "";

            return `
                <tr>
                    <td>${ad.name || "Ohne Namen"}</td>
                    <td>${kp(mm.roas, "x")}</td>
                    <td>€${kp(mm.cpp)}</td>
                    <td>${mm.purchases || 0}</td>
                    <td>${kp(mm.ctr, "%", 1)}</td>
                    <td>${kp(mm.hookToClickRatio, "%", 1)}</td>
                    <td>${kp(mm.thumbstopRatio, "%", 1)}</td>
                    <td>${link ? `<a href="${link}" target="_blank" rel="noopener noreferrer">Öffnen</a>` : "–"}</td>
                </tr>
            `;
        })
        .join("");

    const senseiText = buildSenseiSnapshot(m);

    const html = `
        <div class="creative-modal-layout">
            <div class="creative-modal-col">
                <div class="modal-section">
                    <div class="modal-section-title">Creative Group</div>
                    <div class="modal-row" style="align-items:flex-start;">
                        <div style="flex:1;">
                            <div style="font-weight:700; font-size:16px; margin-bottom:6px;">${group.label}</div>
                            <div style="font-size:13px;color:var(--text-secondary);">
                                ${group.ads.length} Ad${group.ads.length > 1 ? "s" : ""} • Typ: ${adType}
                            </div>
                        </div>

                        <div class="creative-modal-thumb">
                            ${
                                thumb
                                    ? `<img src="${thumb}" alt="${group.label}" />`
                                    : `<div class="creative-faux-thumb">${
                                          adType === "video" ? "▶" : "?"
                                      }</div>`
                            }
                        </div>
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Performance (aggregiert)</div>

                    <div class="modal-kpis-grid">
                        <div class="metric-chip"><div class="metric-label">Purchases</div><div class="metric-value">${m.purchases || 0}</div></div>
                        <div class="metric-chip"><div class="metric-label">CPP</div><div class="metric-value">€${kp(m.cpp)}</div></div>
                        <div class="metric-chip"><div class="metric-label">Spend</div><div class="metric-value">€${kp(m.spend)}</div></div>
                        <div class="metric-chip"><div class="metric-label">ROAS</div><div class="metric-value">${kp(m.roas, "x")}</div></div>
                        <div class="metric-chip"><div class="metric-label">CTR</div><div class="metric-value">${kp(m.ctr, "%", 1)}</div></div>
                        <div class="metric-chip"><div class="metric-label">CPC</div><div class="metric-value">€${kp(m.cpc, "", 3)}</div></div>
                        <div class="metric-chip"><div class="metric-label">Hook → Click</div><div class="metric-value">${kp(m.hookToClickRatio, "%", 1)}</div></div>
                        <div class="metric-chip"><div class="metric-label">Thumbstop Ratio</div><div class="metric-value">${kp(m.thumbstopRatio, "%", 1)}</div></div>
                    </div>
                </div>
            </div>

            <div class="creative-modal-col">
                <div class="modal-section">
                    <div class="modal-section-title">Performance Story</div>
                    <p class="creative-modal-copy">
                        ROAS: <strong>${kp(m.roas, "x")}</strong>,
                        Spend: <strong>€${kp(m.spend)}</strong>,
                        CTR: <strong>${kp(m.ctr, "%", 1)}</strong>,
                        Purchases: <strong>${m.purchases || 0}</strong>.
                    </p>
                    <p class="creative-modal-copy">
                        Hook → Click: <strong>${kp(m.hookToClickRatio, "%", 1)}</strong>,
                        Thumbstop: <strong>${kp(m.thumbstopRatio, "%", 1)}</strong>
                        – ideal, um zu sehen, wie stark das Creative im Scroll-Strom abschneidet.
                    </p>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Varianten-Vergleich</div>
                    <div class="creative-modal-table-wrapper">
                        <table class="creative-modal-table">
                            <thead>
                                <tr>
                                    <th>Ad</th>
                                    <th>ROAS</th>
                                    <th>CPP</th>
                                    <th>Purch.</th>
                                    <th>CTR</th>
                                    <th>Hook→Click</th>
                                    <th>Thumbstop</th>
                                    <th>Meta</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${
                                    adRows ||
                                    `<tr><td colspan="8" style="text-align:center;color:var(--text-secondary);">Keine Einzel-Varianten gefunden.</td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Sensei Snapshot</div>
                    <div class="sensei-snapshot">
                        <div class="sensei-label">🧠 Sensei Insight</div>
                        <div class="sensei-text">${senseiText}</div>
                    </div>
                </div>

                <div class="modal-section">
                    <div class="modal-section-title">Enthaltene Ads</div>
                    <ul style="max-height:200px;overflow:auto;font-size:13px;padding-left:18px;">
                        ${group.ads
                            .map(
                                (ad) =>
                                    `<li><strong>${ad.name || "Ohne Namen"}</strong> – ID: ${
                                        ad.id
                                    }</li>`
                            )
                            .join("")}
                    </ul>
                </div>
            </div>
        </div>
    `;

    openModal("Creative Details", html);
}
