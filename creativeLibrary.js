// creativeLibrary.js – SignalOne.cloud – FIXED VERSION + DEMO MODE
// Enthält: updateCreativeLibraryView + renderCreativeLibrary

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";
import { demoCreatives } from "./demoData.js";

/* -------------------------------------------------------
   DEMO-HELPER: Demo-Creatives in „Meta-Ads-Format“ mappen
---------------------------------------------------------*/

function buildDemoAdsFromCreatives() {
    if (!Array.isArray(demoCreatives)) return [];

    return demoCreatives.map((c, idx) => {
        const spend = Number(c.spend || 0);
        const impressions = Number(c.impressions || 0);
        const clicks = Number(c.clicks || 0);
        const ctr = c.ctr != null
            ? Number(c.ctr)
            : impressions
            ? (clicks / impressions) * 100
            : 0;
        const roas = Number(c.roas || 0);
        const revenue = c.revenue || spend * roas;
        const cpc = clicks ? spend / clicks : 0;
        const cpm = impressions ? (spend / impressions) * 1000 : 0;

        return {
            id: c.id || `demo_ad_${idx}`,
            name: c.name || `Demo Creative ${idx + 1}`,
            creative: {
                object_story_spec: {
                    // Wir nutzen link_data als Standard (Static/Image)
                    link_data: {
                        name: c.name || "",
                        link: c.landingPage || c.url || "#",
                        image_hash: c.thumbnail || "",
                        call_to_action: {
                            type: "SHOP_NOW"
                        }
                    }
                }
            },
            insights: {
                data: [
                    {
                        spend: spend.toFixed(2),
                        impressions,
                        clicks,
                        ctr,
                        cpc,
                        cpm,
                        purchase_roas: [{ value: roas }],
                        revenue,
                        purchases: c.purchases || Math.round(revenue / 50)
                    }
                ]
            }
        };
    });
}

/* -------------------------------------------------------
   VIEW UPDATE (lädt Ads + ruft Renderer)
---------------------------------------------------------*/

export async function updateCreativeLibraryView(initialLoad = false) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    grid.innerHTML = "";

    const isDemo = !!AppState.settings?.demoMode;

    // DEMO MODE: Kein Meta-Token? -> Nutze Demo-Creatives wie echte Daten
    if ((!AppState.metaConnected || !AppState.meta.accessToken) && isDemo) {
        AppState.meta.ads = buildDemoAdsFromCreatives();
        AppState.creativesLoaded = true;

        if (!AppState.meta.ads.length) {
            grid.innerHTML = "<p>Demo-Account hat aktuell keine Creatives definiert.</p>";
            return;
        }

        renderCreativeLibrary();
        return;
    }

    // Nicht verbunden (und kein Demo)?
    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        grid.innerHTML = "<p>Verbinde dich mit Meta, um Creatives zu laden.</p>";
        return;
    }

    // Kein Account gewählt?
    if (!AppState.selectedAccountId) {
        grid.innerHTML = "<p>Wähle ein Werbekonto in der Topbar.</p>";
        return;
    }

    // Beim ersten Aufruf: Creatives laden (LIVE)
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

    renderCreativeLibrary();
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
    const groupBy = document.getElementById("creativeGroupBy")?.value || "none";

    let ads = [...(AppState.meta.ads || [])];

    /* FILTER: TYPE -------------------------------------*/
    if (type !== "all") {
        ads = ads.filter(ad => {
            const c = ad.creative;
            if (!c) return false;
            const story = c.object_story_spec || {};
            const adType = story.video_data
                ? "video"
                : story.link_data
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

        const aCtr = Number(aIns.ctr || 0);
        const bCtr = Number(bIns.ctr || 0);

        switch (sort) {
            case "spend_desc":
                return bSpend - aSpend;
            case "spend_asc":
                return aSpend - bSpend;
            case "ctr_desc":
                return bCtr - aCtr;
            case "ctr_asc":
                return aCtr - bCtr;
            case "roas_asc":
                return aRoas - bRoas;
            case "roas_desc":
            default:
                return bRoas - aRoas;
        }
    });

    /* GROUPING -----------------------------------------*/
    let groups = {};
    if (groupBy === "none") {
        groups["__all__"] = ads;
    } else {
        ads.forEach((ad) => {
            let key = "";
            switch (groupBy) {
                case "creative":
                    key = ad.creative?.id || ad.id || "Unknown Creative";
                    break;
                case "ad_name":
                    key = ad.name || "Ohne Namen";
                    break;
                case "headline":
                    key =
                        ad.creative?.object_story_spec?.link_data?.name ||
                        ad.creative?.object_story_spec?.video_data?.title ||
                        "Ohne Headline";
                    break;
                case "landing_page":
                    key =
                        ad.creative?.object_story_spec?.link_data?.link ||
                        ad.creative?.object_story_spec?.video_data?.call_to_action?.value
                            ?.link ||
                        "Ohne Landing Page";
                    break;
                case "post_id":
                    key =
                        ad.creative?.object_story_spec?.page_id ||
                        ad.creative?.effective_object_story_id ||
                        "Ohne Post ID";
                    break;
                default:
                    key = "__all__";
                    break;
            }
            if (!groups[key]) groups[key] = [];
            groups[key].push(ad);
        });
    }

    /* RENDER -------------------------------------------*/
    grid.innerHTML = "";

    const groupKeys = Object.keys(groups);
    if (!groupKeys.length) {
        grid.innerHTML = "<p>Keine Creatives gefunden.</p>";
        return;
    }

    groupKeys.forEach((groupKey) => {
        const items = groups[groupKey];
        if (!items || !items.length) return;

        const groupWrapper = document.createElement("div");
        groupWrapper.className = "creative-group";

        // Headline + farbige Unterstreichung (Datads-Style, über CSS)
        const titleEl = document.createElement("h3");
        titleEl.className = "creative-group-title";
        titleEl.innerHTML = `
            <span>${groupKey === "__all__" ? "Alle Creatives" : groupKey}</span>
            <span class="creative-group-underline"></span>
        `;
        groupWrapper.appendChild(titleEl);

        const groupGrid = document.createElement("div");
        groupGrid.className = "creative-grid";

        items.forEach((ad) => {
            const c = ad.creative || {};
            const story = c.object_story_spec || {};
            const ins = ad.insights?.data?.[0] || {};

            const spend = Number(ins.spend || 0);
            const impressions = Number(ins.impressions || 0);
            const clicks = Number(ins.clicks || 0);
            const roas = Array.isArray(ins.purchase_roas)
                ? Number(ins.purchase_roas?.[0]?.value || 0)
                : 0;
            const ctr = ins.ctr != null
                ? Number(ins.ctr)
                : impressions
                ? (clicks / impressions) * 100
                : 0;
            const cpm = impressions ? (spend / impressions) * 1000 : 0;

            const thumb =
                story.link_data?.image_hash ||
                story.video_data?.picture ||
                "https://via.placeholder.com/600x600.png?text=Creative";

            const card = document.createElement("article");
            card.className = "creative-card";
            card.addEventListener("click", () => openCreativeDetail(ad));

            card.innerHTML = `
                <div class="creative-thumb">
                    <img src="${thumb}" alt="${ad.name || "Creative"}" />
                </div>
                <div class="creative-body">
                    <div class="creative-title-row">
                        <h4 class="creative-name">${ad.name || "Ohne Namen"}</h4>
                        <span class="creative-pill">
                            ${roas ? `${roas.toFixed(2)}x ROAS` : "n/a"}
                        </span>
                    </div>
                    <div class="creative-metrics">
                        <div class="metric-pill">
                            <span class="label">Spend</span>
                            <span class="value">${spend.toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 0
                            })}</span>
                        </div>
                        <div class="metric-pill">
                            <span class="label">CTR</span>
                            <span class="value">${ctr.toFixed(2)}%</span>
                        </div>
                        <div class="metric-pill">
                            <span class="label">CPM</span>
                            <span class="value">${cpm.toLocaleString("de-DE", {
                                style: "currency",
                                currency: "EUR",
                                maximumFractionDigits: 2
                            })}</span>
                        </div>
                        <div class="metric-pill">
                            <span class="label">Impr.</span>
                            <span class="value">${impressions.toLocaleString("de-DE")}</span>
                        </div>
                    </div>
                </div>
            `;

            groupGrid.appendChild(card);
        });

        groupWrapper.appendChild(groupGrid);
        grid.appendChild(groupWrapper);
    });
}

/* -------------------------------------------------------
   DETAIL MODAL
---------------------------------------------------------*/

function openCreativeDetail(ad) {
    const c = ad.creative || {};
    const story = c.object_story_spec || {};
    const ins = ad.insights?.data?.[0] || {};

    const spend = Number(ins.spend || 0);
    const impressions = Number(ins.impressions || 0);
    const clicks = Number(ins.clicks || 0);
    const roas = Array.isArray(ins.purchase_roas)
        ? Number(ins.purchase_roas?.[0]?.value || 0)
        : 0;
    const ctr = ins.ctr != null
        ? Number(ins.ctr)
        : impressions
        ? (clicks / impressions) * 100
        : 0;
    const cpm = impressions ? (spend / impressions) * 1000 : 0;

    const thumb =
        story.link_data?.image_hash ||
        story.video_data?.picture ||
        "https://via.placeholder.com/600x600.png?text=Creative";

    const html = `
        <div class="creative-modal-layout">
            <div class="creative-modal-left">
                <div class="creative-modal-thumb">
                    <img src="${thumb}" alt="${ad.name || "Creative"}" />
                </div>
                <div class="creative-modal-meta">
                    <p><strong>Name:</strong> ${ad.name || "-"}</p>
                    <p><strong>ID:</strong> ${ad.id || "-"}</p>
                </div>
            </div>
            <div class="creative-modal-right">
                <h3>Performance</h3>
                <div class="creative-modal-metrics">
                    <div class="metric-pill">
                        <span class="label">Spend</span>
                        <span class="value">${spend.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 0
                        })}</span>
                    </div>
                    <div class="metric-pill">
                        <span class="label">ROAS</span>
                        <span class="value">${roas ? roas.toFixed(2) + "x" : "n/a"}</span>
                    </div>
                    <div class="metric-pill">
                        <span class="label">CTR</span>
                        <span class="value">${ctr.toFixed(2)}%</span>
                    </div>
                    <div class="metric-pill">
                        <span class="label">CPM</span>
                        <span class="value">${cpm.toLocaleString("de-DE", {
                            style: "currency",
                            currency: "EUR",
                            maximumFractionDigits: 2
                        })}</span>
                    </div>
                    <div class="metric-pill">
                        <span class="label">Impressions</span>
                        <span class="value">${impressions.toLocaleString("de-DE")}</span>
                    </div>
                    <div class="metric-pill">
                        <span class="label">Clicks</span>
                        <span class="value">${clicks.toLocaleString("de-DE")}</span>
                    </div>
                </div>

                <div class="creative-modal-actions">
                    <button class="btn-danger" data-action="pause">Pausieren</button>
                    <button class="btn-primary" data-action="duplicate">Duplizieren für Test</button>
                    <button class="btn-secondary" data-action="open-report">In Report aufnehmen</button>
                </div>
            </div>
        </div>
    `;

    openModal("Creative-Details", html);

    // Simple Demo-Action-Handler (später: echte API-Calls)
    const body = document.getElementById("modalBody");
    if (body) {
        body.querySelectorAll(".creative-modal-actions button").forEach((btn) => {
            btn.addEventListener("click", () => {
                const action = btn.getAttribute("data-action");
                alert(
                    `Aktion "${action}" wird vorbereitet...\n\n(Demo-Modus – keine echte API-Aktion. Im Live-Modus würde hier die Meta API aufgerufen.)`
                );
            });
        });
    }
}
