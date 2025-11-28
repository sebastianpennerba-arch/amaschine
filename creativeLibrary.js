// creativeLibrary.js – SignalOne.cloud – APPLE-PRO VERSION
// Nutzt: AppState.meta.ads, fetchMetaAds, globales Modal-System (openModal)

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";

/* -------------------------------------------------------
   INTERNER STATE
---------------------------------------------------------*/

let filtersInitialized = false;

/* -------------------------------------------------------
   VIEW UPDATE (lädt Ads + ruft Renderer)
---------------------------------------------------------*/

export async function updateCreativeLibraryView(initialLoad = false) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    // Filter-Events nur einmal anhängen
    initCreativeLibraryFiltersOnce();

    grid.innerHTML = "";

    // Nicht verbunden?
    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Verbinde dich mit Meta, um Creatives zu laden.</p>";
        return;
    }

    // Kein Account gewählt?
    if (!AppState.selectedAccountId) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Wähle ein Werbekonto in der Topbar.</p>";
        return;
    }

    // Beim ersten Aufruf oder wenn explizit angefordert: Creatives laden
    if (initialLoad || !AppState.creativesLoaded) {
        try {
            const ads = await fetchMetaAds(AppState.selectedAccountId);

            // metaApi.fetchMetaAds() liefert direkt ein Array zurück :contentReference[oaicite:2]{index=2}
            AppState.meta.ads = Array.isArray(ads) ? ads : [];
            AppState.creativesLoaded = true;
        } catch (err) {
            console.error("Creative Load Error:", err);
            showToast("Fehler beim Laden der Creatives.", "error");
            AppState.meta.ads = [];
        }
    }

    // Wenn weiterhin keine Creatives vorhanden:
    if (!AppState.meta.ads.length) {
        grid.innerHTML =
            "<p style='font-size:14px;color:var(--text-secondary);'>Keine Creatives gefunden.</p>";
        return;
    }

    renderCreativeLibrary(); // 👉 Karten wirklich zeichnen
}

/* -------------------------------------------------------
   FILTER-INIT – wird genau EINMAL gesetzt
---------------------------------------------------------*/

function initCreativeLibraryFiltersOnce() {
    if (filtersInitialized) return;
    filtersInitialized = true;

    const searchInput = document.getElementById("creativeSearch");
    const sortSelect = document.getElementById("creativeSort");
    const typeSelect = document.getElementById("creativeType");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            renderCreativeLibrary();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", () => {
            renderCreativeLibrary();
        });
    }

    if (typeSelect) {
        typeSelect.addEventListener("change", () => {
            renderCreativeLibrary();
        });
    }
}

/* -------------------------------------------------------
   HILFSFUNKTIONEN: Metriken & Thumbnail
---------------------------------------------------------*/

function getAdInsights(ad) {
    // Meta Ads Endpoint liefert insights als Array in ad.insights.data[0] :contentReference[oaicite:3]{index=3}
    return ad?.insights?.data?.[0] || {};
}

function getAdMetrics(ad) {
    const ins = getAdInsights(ad);

    const spend = Number(ins.spend || 0);
    const impressions = Number(ins.impressions || 0);
    const clicks = Number(ins.clicks || 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Backend nutzt für Ads: purchase_roas im Insights-Feld :contentReference[oaicite:4]{index=4}
    const roasVal = Array.isArray(ins.purchase_roas)
        ? Number(ins.purchase_roas?.[0]?.value || 0)
        : 0;

    return { spend, impressions, clicks, ctr, roasVal };
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

    // 1) Direktes Thumbnail
    if (creative.thumbnail_url) return creative.thumbnail_url;

    const spec = creative.object_story_spec || {};

    // 2) Video-Thumbnail
    if (spec.video_data?.thumbnail_url) return spec.video_data.thumbnail_url;

    // 3) Link-Image
    if (spec.link_data?.image_url) return spec.link_data.image_url;

    // 4) Fallback → null
    return null;
}

/* -------------------------------------------------------
   RENDERER – baut die Creative Cards im Grid
---------------------------------------------------------*/

export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    const search =
        document.getElementById("creativeSearch")?.value?.toLowerCase() || "";
    const sort = document.getElementById("creativeSort")?.value || "roas_desc";
    const typeFilter =
        document.getElementById("creativeType")?.value || "all";

    let ads = [...(AppState.meta.ads || [])];

    /* FILTER: TYPE -------------------------------------*/
    if (typeFilter !== "all") {
        ads = ads.filter((ad) => getAdType(ad) === typeFilter);
    }

    /* FILTER: SEARCH -----------------------------------*/
    if (search.length > 0) {
        ads = ads.filter((ad) =>
            (ad.name || "").toLowerCase().includes(search)
        );
    }

    /* SORT ---------------------------------------------*/
    ads.sort((a, b) => {
        const ma = getAdMetrics(a);
        const mb = getAdMetrics(b);

        switch (sort) {
            case "roas_desc":
                return mb.roasVal - ma.roasVal;
            case "spend_desc":
                return mb.spend - ma.spend;
            case "spend_asc":
                return ma.spend - mb.spend;
            default:
                return 0;
        }
    });

    /* RENDER -------------------------------------------*/
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();

    ads.forEach((ad) => {
        const card = document.createElement("div");
        card.className = "creative-library-item";

        const name = ad.name || "(ohne Namen)";
        const thumb = getAdThumbnail(ad);
        const adType = getAdType(ad);

        const { spend, impressions, clicks, ctr, roasVal } = getAdMetrics(ad);

        const roasWidth = Math.min(roasVal * 20, 100); // 5x ROAS → 100%
        const spendK = spend / 1000;

        card.innerHTML = `
            <div class="creative-media-container-library">
                ${
                    thumb
                        ? `<img src="${thumb}" alt="${name}"/>`
                        : `<div class="creative-faux-thumb">${
                              adType === "video" ? "▶" : "?"
                          }</div>`
                }
                <span class="platform-badge">Meta Ads</span>
            </div>

            <div class="creative-stats">
                <div class="creative-name-library">${name}</div>
                <div class="creative-meta">
                    ${adType === "video" ? "Video" : "Image/Link"} • 
                    Spend: €${spend.toFixed(2)} • Impr.: ${impressions.toLocaleString(
                        "de-DE"
                    )}
                </div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">ROAS</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill ${
                            roasVal >= 2 ? "fill-positive" : "fill-negative"
                        }"
                             style="width:${roasWidth}%;"></div>
                    </div>
                </div>

                <div class="kpi-bar-visual" style="margin-top:4px;">
                    <span class="kpi-label-small">Spend</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill fill-spend"
                             style="width:${Math.min(
                                 spendK * 5,
                                 100
                             )}%;"></div>
                    </div>
                </div>

                <div class="creative-footer-kpis">
                    <span>ROAS: ${roasVal.toFixed(2)}x</span>
                    <span>CTR: ${ctr.toFixed(2)}%</span>
                    <span>Clicks: ${clicks.toLocaleString("de-DE")}</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => openCreativeModal(ad));
        frag.appendChild(card);
    });

    grid.appendChild(frag);
}

/* -------------------------------------------------------
   MODAL – Creative Details im Apple-Style Modal
---------------------------------------------------------*/

function openCreativeModal(ad) {
    const insights = getAdInsights(ad);
    const { spend, impressions, clicks, ctr, roasVal } = getAdMetrics(ad);

    const name = ad.name || "(ohne Namen)";
    const adType = getAdType(ad);
    const thumb = getAdThumbnail(ad);

    const html = `
        <div class="modal-section">
            <div class="modal-section-title">Creative</div>
            <div class="modal-row" style="align-items:flex-start;">
                <div style="flex:1;">
                    <div style="font-weight:700; font-size:15px; margin-bottom:6px;">
                        ${name}
                    </div>
                    <div style="font-size:13px;color:var(--text-secondary);">
                        Typ: ${adType === "video" ? "Video" : "Image/Link"}<br/>
                        Ad ID: ${ad.id || "n/a"}
                    </div>
                </div>
                <div style="width:120px;height:80px;border-radius:10px;overflow:hidden;border:1px solid var(--border);">
                    ${
                        thumb
                            ? `<img src="${thumb}" alt="${name}" style="width:100%;height:100%;object-fit:cover;"/>`
                            : `<div class="creative-faux-thumb" style="height:100%;">${
                                  adType === "video" ? "▶" : "?"
                              }</div>`
                    }
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Performance</div>
            <div style="display:grid;grid-template-columns:repeat(2, minmax(0,1fr));gap:10px;">
                <div class="metric-chip">
                    <div class="metric-label">ROAS</div>
                    <div class="metric-value">${roasVal.toFixed(2)}x</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Spend</div>
                    <div class="metric-value">€${spend.toFixed(2)}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">CTR</div>
                    <div class="metric-value">${ctr.toFixed(2)}%</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Clicks</div>
                    <div class="metric-value">${clicks.toLocaleString(
                        "de-DE"
                    )}</div>
                </div>
            </div>
        </div>

        <div class="modal-section">
            <div class="modal-section-title">Rohdaten-Snippet</div>
            <pre style="
                max-height:160px;
                overflow:auto;
                font-size:11px;
                background:var(--color-background);
                padding:8px 10px;
                border-radius:8px;
                border:1px solid var(--border);
                white-space:pre-wrap;
            ">${JSON.stringify(insights, null, 2)}</pre>
        </div>
    `;

    // nutzt dein globales Modal-System (uiCore.openModal)
    openModal("Creative Details", html);
}
