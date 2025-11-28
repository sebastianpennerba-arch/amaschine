// creativeLibrary.js – FINAL VERSION (Grid + Table, Demo- & Live-ready)

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

let controlsInitialized = false;

/**
 * Entry-Point aus app.js
 * app.js ruft: updateCreativeLibraryView(dataConnected)
 */
export function updateCreativeLibraryView(hasData) {
    const gridRoot = document.getElementById("creativeLibraryGrid");
    if (!gridRoot) return;

    if (!hasData) {
        gridRoot.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Daten geladen. Verbinde Meta Ads oder aktiviere den Demo Mode in den Einstellungen.</p>
            </div>
        `;
        return;
    }

    if (!controlsInitialized) {
        initControls();
        controlsInitialized = true;
    }

    renderCreativeLibrary();
}

/* ============================================================
   CONTROLS (Search / Filter / Sort / Group / Layout)
============================================================ */

function initControls() {
    const search = document.getElementById("creativeSearch");
    const type = document.getElementById("creativeType");
    const sort = document.getElementById("creativeSort");
    const groupBy = document.getElementById("creativeGroupBy");

    // Wir nutzen AppState.settings.creativeLayout ("grid" | "list")
    // und erweitern es einfach – Settings-Modal / settings.js kümmert sich um Änderung.

    const rerender = () => renderCreativeLibrary();

    if (search) search.addEventListener("input", rerender);
    if (type) type.addEventListener("change", rerender);
    if (sort) sort.addEventListener("change", rerender);
    if (groupBy) groupBy.addEventListener("change", rerender);
}

/* ============================================================
   HAUPT-RENDER
============================================================ */

function renderCreativeLibrary() {
    const root = document.getElementById("creativeLibraryGrid");
    if (!root) return;

    const allCreatives = getCreativesFromState();

    if (!allCreatives.length) {
        root.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Creatives gefunden. Verbinde Meta oder nutze den Demo Mode.</p>
            </div>
        `;
        return;
    }

    const filterState = getFilterState();
    let list = applyFiltersAndMapping(allCreatives, filterState);

    if (!list.length) {
        root.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Creatives für die aktuelle Filterung gefunden.</p>
            </div>
        `;
        return;
    }

    // Layout basierend auf Settings: "grid" (default) oder "list"
    const layout = (AppState.settings?.creativeLayout || "grid").toLowerCase();

    if (layout === "list") {
        root.innerHTML = renderTableLayout(list, filterState);
    } else {
        root.innerHTML = renderGridLayout(list, filterState);
    }
}

/* ============================================================
   DATA SOURCE
============================================================ */

function getCreativesFromState() {
    // Reihenfolge:
    // 1) explizite creatives
    // 2) ads (mit creative Infos)
    // 3) leeres Array
    const meta = AppState.meta || {};
    if (Array.isArray(meta.creatives) && meta.creatives.length) return meta.creatives;
    if (Array.isArray(meta.ads) && meta.ads.length) return meta.ads;
    return [];
}

/* ============================================================
   FILTER STATE
============================================================ */

function getFilterState() {
    const search = document.getElementById("creativeSearch");
    const type = document.getElementById("creativeType");
    const sort = document.getElementById("creativeSort");
    const groupBy = document.getElementById("creativeGroupBy");

    return {
        search: (search?.value || "").trim().toLowerCase(),
        type: type?.value || "all",
        sort: sort?.value || "roas_desc",
        groupBy: groupBy?.value || "none"
    };
}

/* ============================================================
   FILTER & MAPPING
============================================================ */

function applyFiltersAndMapping(rawCreatives, filterState) {
    const { search, type, sort, groupBy } = filterState;

    // Mappe rawCreative → normalizedCreative mit Metrics
    let list = rawCreatives.map(normalizeCreative);

    // Type-Filter
    if (type !== "all") {
        list = list.filter((c) => c.type === type);
    }

    // Search-Filter
    if (search) {
        list = list.filter((c) => {
            const haystack = [
                c.name,
                c.campaignName,
                c.adsetName,
                c.headline,
                c.primaryText,
                c.landingPage
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return haystack.includes(search);
        });
    }

    // Gruppierung
    if (groupBy && groupBy !== "none") {
        const grouped = groupCreatives(list, groupBy);
        list = summarizeGroups(grouped);
    }

    // Sortierung
    list = sortCreatives(list, sort);

    return list;
}

/* ============================================================
   NORMALISIERUNG EINZELNER CREATIVE OBJEKTE
============================================================ */

function normalizeCreative(raw) {
    const id =
        raw.id ||
        raw.creative_id ||
        raw.ad_id ||
        raw.post_id ||
        raw.object_story_id ||
        "n/a";

    const name =
        raw.name ||
        raw.ad_name ||
        raw.creative_name ||
        raw.title ||
        raw.headline ||
        "Unbenanntes Creative";

    const campaignName = raw.campaign_name || raw.campaign?.name || "";
    const adsetName = raw.adset_name || raw.adset?.name || "";
    const headline = raw.headline || raw.asset_headline || "";
    const primaryText =
        raw.primary_text || raw.asset_text || raw.body || raw.message || "";
    const landingPage =
        raw.landing_page || raw.url || raw.link_url || raw.deep_link || "";

    const format = raw.format || raw.asset_type || raw.creative_type || "";
    const type = detectCreativeType(raw, format);

    const thumb =
        raw.thumbnail_url ||
        raw.image_url ||
        raw.image ||
        raw.preview_url ||
        null;

    const platform = raw.platform || "Meta Ads";

    // Metriken
    const m = raw.metrics || raw.insights || raw;

    const spend = toNumber(m.spend ?? m.spend_total);
    const revenue = toNumber(m.revenue ?? m.purchase_value);
    const impressions = toNumber(m.impressions);
    const clicks = toNumber(m.clicks);
    const ctrExplicit = toNumber(m.ctr);
    const roasExplicit = toNumber(m.roas);

    const ctr =
        ctrExplicit ||
        (impressions > 0 ? (clicks / impressions) * 100 : 0);

    const roas =
        roasExplicit || (spend > 0 ? revenue / spend : 0);

    const cpc = clicks > 0 ? spend / clicks : 0;

    return {
        id,
        name,
        platform,
        format,
        type,
        thumbnailUrl: thumb,
        campaignName,
        adsetName,
        headline,
        primaryText,
        landingPage,
        raw,
        metrics: {
            spend,
            revenue,
            impressions,
            clicks,
            ctr,
            roas,
            cpc
        }
    };
}

function detectCreativeType(raw, formatStr = "") {
    const f = String(formatStr || "").toLowerCase();
    const objStory = raw.object_story_spec || {};

    if (f.includes("video") || raw.video_id || raw.asset_video) return "video";
    if (f.includes("carousel") || Array.isArray(objStory.child_attachments))
        return "carousel";
    if (f.includes("image") || raw.image_url || raw.thumbnail_url) return "static";

    return "static"; // Fallback
}

/* ============================================================
   GROUPING
============================================================ */

function groupCreatives(list, groupBy) {
    const groups = new Map();

    list.forEach((c) => {
        let key = "";

        switch (groupBy) {
            case "creative":
                key = c.id;
                break;
            case "ad_name":
                key = c.name;
                break;
            case "headline":
                key = c.headline || c.name;
                break;
            case "landing_page":
                key = c.landingPage || "(keine Landing Page)";
                break;
            case "post_id":
                key = c.raw?.post_id || c.raw?.object_story_id || c.id;
                break;
            default:
                key = c.id;
        }

        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(c);
    });

    return groups;
}

function summarizeGroups(groups) {
    const result = [];

    for (const [key, creatives] of groups.entries()) {
        if (!creatives.length) continue;

        // Aggregation
        let spend = 0;
        let revenue = 0;
        let impressions = 0;
        let clicks = 0;

        creatives.forEach((c) => {
            spend += c.metrics.spend;
            revenue += c.metrics.revenue;
            impressions += c.metrics.impressions;
            clicks += c.metrics.clicks;
        });

        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
        const roas = spend > 0 ? revenue / spend : 0;

        const primary = creatives[0];

        result.push({
            ...primary,
            name: primary.name || key,
            metrics: {
                spend,
                revenue,
                impressions,
                clicks,
                ctr,
                roas,
                cpc: clicks > 0 ? spend / clicks : 0
            },
            groupSize: creatives.length
        });
    }

    return result;
}

/* ============================================================
   SORTIERUNG
============================================================ */

function sortCreatives(list, sortKey) {
    const copy = [...list];

    switch (sortKey) {
        case "spend_desc":
            copy.sort((a, b) => b.metrics.spend - a.metrics.spend);
            break;
        case "spend_asc":
            copy.sort((a, b) => a.metrics.spend - b.metrics.spend);
            break;
        case "roas_desc":
        default:
            copy.sort((a, b) => (b.metrics.roas || 0) - (a.metrics.roas || 0));
            break;
    }

    return copy;
}

/* ============================================================
   LAYOUT: GRID (Datads Style)
============================================================ */

function renderGridLayout(list, filterState) {
    return list
        .map((c, index) => {
            const m = c.metrics;
            const roasPct = clamp(m.roas * 20, 0, 100);
            const ctrPct = clamp(m.ctr, 0, 100); // 0–100 %
            const spendPct = clamp(spendScale(m.spend), 0, 100);

            return `
        <article class="creative-library-item" data-creative-id="${escapeAttr(
            c.id
        )}">
            <div class="creative-media-container-library">
                ${
                    c.thumbnailUrl
                        ? `<img src="${escapeAttr(c.thumbnailUrl)}" alt="${escapeAttr(c.name)}" />`
                        : `<div class="creative-faux-thumb">${(index + 1)
                              .toString()
                              .padStart(2, "0")}</div>`
                }
                <span class="platform-badge">${escapeHtml(
                    c.platform || "Meta Ads"
                )}</span>
                ${
                    c.groupSize && c.groupSize > 1
                        ? `<span class="creative-rank-badge">${c.groupSize}x Variant</span>`
                        : ""
                }
            </div>

            <div class="creative-stats">
                <div class="creative-name-library">${escapeHtml(c.name)}</div>
                <div class="creative-meta">
                    ${c.campaignName ? `Kampagne: ${escapeHtml(c.campaignName)} · ` : ""}
                    ID: ${escapeHtml(c.id)} · Format: ${escapeHtml(c.format || c.type || "n/a")}
                </div>

                <div class="creative-kpi-list">
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">ROAS</span>
                        <span class="creative-kpi-value">${
                            m.roas ? m.roas.toFixed(2) + "x" : "–"
                        }</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">Spend</span>
                        <span class="creative-kpi-value">${formatCurrency(m.spend)}</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">CTR</span>
                        <span class="creative-kpi-value">${
                            m.ctr ? m.ctr.toFixed(2) + "%" : "–"
                        }</span>
                    </div>
                    <div class="creative-kpi-line">
                        <span class="creative-kpi-label">CPC</span>
                        <span class="creative-kpi-value">${
                            m.cpc ? formatCurrency(m.cpc) : "–"
                        }</span>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">ROAS</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-positive" style="width: ${roasPct}%;"></div>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">CTR</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-positive" style="width: ${ctrPct}%;"></div>
                    </div>
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">Spend</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-spend" style="width: ${spendPct}%;"></div>
                    </div>
                </div>

                <div class="creative-footer-kpis">
                    <span>Clicks: ${formatShort(m.clicks)}</span>
                    <span>Impressions: ${formatShort(m.impressions)}</span>
                </div>
            </div>
        </article>
        `;
        })
        .join("");
}

/* ============================================================
   LAYOUT: TABLE (List Mode)
============================================================ */

function renderTableLayout(list, filterState) {
    return `
        <div class="card">
            <table class="campaigns-table">
                <thead>
                    <tr>
                        <th>Creative</th>
                        <th>Kampagne</th>
                        <th>Format</th>
                        <th>Spend</th>
                        <th>ROAS</th>
                        <th>CTR</th>
                        <th>Clicks</th>
                        <th>Impressions</th>
                    </tr>
                </thead>
                <tbody>
                    ${list
                        .map((c) => {
                            const m = c.metrics;
                            return `
                        <tr>
                            <td>
                                <strong>${escapeHtml(c.name)}</strong><br/>
                                <span style="font-size:12px; color:var(--text-secondary);">
                                    ID: ${escapeHtml(c.id)}
                                    ${
                                        c.groupSize && c.groupSize > 1
                                            ? ` · ${c.groupSize}x Varianten`
                                            : ""
                                    }
                                </span>
                            </td>
                            <td>${escapeHtml(c.campaignName || "–")}</td>
                            <td>${escapeHtml(c.format || c.type || "n/a")}</td>
                            <td>${formatCurrency(m.spend)}</td>
                            <td>${m.roas ? m.roas.toFixed(2) + "x" : "–"}</td>
                            <td>${m.ctr ? m.ctr.toFixed(2) + "%" : "–"}</td>
                            <td>${formatShort(m.clicks)}</td>
                            <td>${formatShort(m.impressions)}</td>
                        </tr>
                        `;
                        })
                        .join("")}
                </tbody>
            </table>
        </div>
    `;
}

/* ============================================================
   HELPERS
============================================================ */

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v || 0));
}

function spendScale(spend) {
    const s = Number(spend || 0);
    if (s <= 0) return 0;
    if (s > 5000) return 100;
    if (s > 1000) return 80;
    if (s > 500) return 60;
    if (s > 100) return 40;
    if (s > 10) return 20;
    return 10;
}

function toNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    });
}

function formatShort(v) {
    const num = Number(v || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString("de-DE");
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (s) =>
        ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[s])
    );
}

function escapeAttr(str) {
    return escapeHtml(str);
}
