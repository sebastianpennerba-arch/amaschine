// creativeLibrary.js – SignalOne.cloud – FIXED VERSION
// Enthält jetzt: updateCreativeLibraryView + renderCreativeLibrary

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";

/* -------------------------------------------------------
   VIEW UPDATE (lädt Ads + ruft Renderer)
---------------------------------------------------------*/

export async function updateCreativeLibraryView(initialLoad = false) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    // Nicht verbunden?
    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        grid.innerHTML = "<p>Verbinde dich mit Meta, um Creatives zu laden.</p>";
        return;
    }

    // Kein Account gewählt?
    if (!AppState.selectedAccountId) {
        grid.innerHTML = "<p>Wähle ein Werbekonto in der Topbar.</p>";
        return;
    }

    // Beim ersten Aufruf: Creatives laden
    if (initialLoad || !AppState.creativesLoaded) {
        try {
            const res = await fetchMetaAds(AppState.selectedAccountId);
            const arr = res?.data?.data || res?.data || [];

            AppState.meta.ads = Array.isArray(arr) ? arr : [];
            AppState.creativesLoaded = true;

        } catch (err) {
            console.error("Creative Load Error:", err);
            showToast("Fehler beim Laden der Creatives.", "error");
            AppState.meta.ads = [];
        }
    }

    // Wenn weiterhin keine Creatives vorhanden:
    if (!AppState.meta.ads.length) {
        grid.innerHTML = "<p>Keine Creatives gefunden.</p>";
        return;
    }

    renderCreativeLibrary(); // 👉 jetzt vorhanden!
}

/* -------------------------------------------------------
   RENDERER – Wird von app.js dynamisch aufgerufen
---------------------------------------------------------*/

export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    const search = document.getElementById("creativeSearch")?.value?.toLowerCase() || "";
    const sort = document.getElementById("creativeSort")?.value || "roas_desc";
    const type = document.getElementById("creativeType")?.value || "all";

    let ads = [...(AppState.meta.ads || [])];

    /* FILTER: TYPE -------------------------------------*/
    if (type !== "all") {
        ads = ads.filter(ad => {
            const c = ad.creative;
            if (!c) return false;
            const adType = c.object_story_spec?.video_data
                ? "video"
                : c.object_story_spec?.link_data
                ? "static"
                : "static";
            return adType === type;
        });
    }

    /* FILTER: SEARCH -----------------------------------*/
    if (search.length > 0) {
        ads = ads.filter(ad =>
            (ad.name || "").toLowerCase().includes(search)
        );
    }

    /* SORT ---------------------------------------------*/
    ads.sort((a, b) => {
        const aIns = a.insights?.data?.[0] || {};
        const bIns = b.insights?.data?.[0] || {};

        const aSpend = Number(aIns.spend || 0);
        const bSpend = Number(bIns.spend || 0);

        const aRoas = Array.isArray(aIns.purchase_roas)
            ? Number(aIns.purchase_roas?.[0]?.value || 0)
            : 0;

        const bRoas = Array.isArray(bIns.purchase_roas)
            ? Number(bIns.purchase_roas?.[0]?.value || 0)
            : 0;

        switch (sort) {
            case "roas_desc":
                return bRoas - aRoas;
            case "spend_desc":
                return bSpend - aSpend;
            case "spend_asc":
                return aSpend - bSpend;
            default:
                return 0;
        }
    });

    /* RENDER -------------------------------------------*/
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();

    ads.forEach(ad => {
        const card = document.createElement("div");
        card.className = "creative-library-item";

        const name = ad.name || "(ohne Namen)";
        const thumb = ad.creative?.thumbnail_url || null;

        const ins = ad.insights?.data?.[0] || {};
        const spend = Number(ins.spend || 0);
        const impressions = Number(ins.impressions || 0);
        const clicks = Number(ins.clicks || 0);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

        const roasVal = Array.isArray(ins.purchase_roas)
            ? Number(ins.purchase_roas?.[0]?.value || 0)
            : 0;

        card.innerHTML = `
            <div class="creative-media-container-library">
                ${
                    thumb
                        ? `<img src="${thumb}" alt="${name}"/>`
                        : `<div class="creative-faux-thumb">?</div>`
                }
            </div>

            <div class="creative-stats">
                <div class="creative-name-library">${name}</div>
                <div class="creative-meta">Spend: €${spend.toFixed(2)}</div>

                <div class="kpi-bar-visual">
                    <span class="kpi-label-small">ROAS</span>
                    <div class="kpi-slider-track">
                        <div class="kpi-slider-fill ${roasVal >= 2 ? "fill-positive" : "fill-negative"}"
                             style="width:${Math.min(roasVal * 20, 100)}%;"></div>
                    </div>
                </div>

                <div class="creative-footer-kpis">
                    <span>ROAS: ${roasVal.toFixed(2)}x</span>
                    <span>CTR: ${ctr.toFixed(2)}%</span>
                </div>
            </div>
        `;

        card.addEventListener("click", () => openCreativeModal(ad));
        frag.appendChild(card);
    });

    grid.appendChild(frag);
}

/* -------------------------------------------------------
   MODAL – bleibt unverändert
---------------------------------------------------------*/

function openCreativeModal(ad) {
    const insights = ad.insights?.data?.[0] || {};
    const spend = Number(insights.spend || 0);
    const impressions = Number(insights.impressions || 0);
    const clicks = Number(insights.clicks || 0);
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    const roasVal = Array.isArray(insights.purchase_roas)
        ? Number(insights.purchase_roas?.[0]?.value || 0)
        : 0;

    const html = `
        <div>
            <h3>${ad.name || "(ohne Namen)"}</h3>
            <ul>
                <li>Spend: €${spend.toFixed(2)}</li>
                <li>Impr.: ${impressions}</li>
                <li>Clicks: ${clicks}</li>
                <li>CTR: ${ctr.toFixed(2)}%</li>
                <li>ROAS: ${roasVal.toFixed(2)}x</li>
            </ul>
        </div>
    `;

    openModal("Creative Details", html);
}
