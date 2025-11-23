// creativeLibrary.js – Creative Library (P2) – Premium Version (Option B)
// -----------------------------------------------------------------------
// Ziele dieser Version:
// 1) Creative-Cards im DatAds-Style (vertikal, großes Thumbnail),
//    aber mit SignalOne-Look (leicht tiefer, SaaS-Style).
// 2) Skaliert sauber von 0 bis 1000+ Creatives (kein Vollbreiten-Problem bei 1 Creative).
// 3) Klick auf Card öffnet ein hochwertiges Detail-Modal.
// 4) Nutzt Ads + Insights aus Meta, ist robust falls metrics/insights fehlen.
// 5) Unterstützt Such-, Sortier- und Typ-Filter über renderCreativeLibrary().

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";

// interner Cache für gefetchte/abgeleitete Creatives
let cachedCreatives = [];

// ---------------------------------------------------------
// Helper: Roh-Ads/Creatives normalisieren
// ---------------------------------------------------------

function normalizeCreative(raw) {
    // Rohobjekt kann verschiedene Strukturen haben:
    // - Meta Ad (mit .creative + .insights)
    // - Vor-normalisiertes Objekt mit .metrics
    // - Fallback aus Demo-Daten etc.

    const base = raw || {};
    const metricsFromObject = base.metrics || {};

    // Falls Insights wie von Meta: ad.insights.data[0]
    const insights =
        base.insights?.data?.[0] ||
        base.insights?.[0] ||
        metricsFromObject ||
        {};

    const spend = numberOrZero(
        insights.spend ??
            metricsFromObject.spend ??
            metricsFromObject.spend_30d
    );
    const impressions = intOrZero(
        insights.impressions ??
            metricsFromObject.impressions ??
            metricsFromObject.impressions_30d
    );
    const clicks = intOrZero(
        insights.clicks ??
            metricsFromObject.clicks ??
            metricsFromObject.clicks_30d
    );
    const ctr = numberOrZero(
        insights.ctr ?? metricsFromObject.ctr ?? metricsFromObject.ctr_30d
    );
    const cpm = numberOrZero(
        insights.cpm ?? metricsFromObject.cpm ?? metricsFromObject.cpm_30d
    );

    // ROAS (website_purchase_roas aus Meta)
    let roas = 0;
    const roasArr =
        insights.website_purchase_roas ||
        metricsFromObject.website_purchase_roas;
    if (Array.isArray(roasArr) && roasArr.length > 0) {
        roas = numberOrZero(roasArr[0].value);
    } else if (
        typeof metricsFromObject.roas !== "undefined" ||
        typeof metricsFromObject.purchase_roas !== "undefined"
    ) {
        roas = numberOrZero(
            metricsFromObject.roas ?? metricsFromObject.purchase_roas
        );
    }

    const name =
        base.name ||
        base.ad_name ||
        base.headline ||
        base.creative?.title ||
        "Unbenanntes Creative";

    const thumbnail =
        base.thumbnail_url ||
        base.image_url ||
        base.preview_url ||
        base.creative?.thumbnail_url ||
        null;

    const type =
        base.creative?.object_type ||
        base.object_type ||
        inferCreativeTypeFromName(name);

    return {
        ...base,
        _view: {
            // vereinheitlichte View-Properties
            id: base.id,
            name,
            status: base.status || "UNKNOWN",
            campaignId: base.campaign_id || base.campaignId || null,
            thumbnail,
            type
        },
        metrics: {
            spend,
            impressions,
            clicks,
            ctr,
            cpm,
            roas
        }
    };
}

function inferCreativeTypeFromName(name) {
    const n = (name || "").toLowerCase();
    if (n.includes("ugc") || n.includes("tiktok") || n.includes("reel"))
        return "VIDEO";
    if (n.includes("carousel")) return "CAROUSEL";
    return "IMAGE";
}

function numberOrZero(val) {
    const n = Number(val);
    return isFinite(n) ? n : 0;
}

function intOrZero(val) {
    const n = parseInt(val, 10);
    return isFinite(n) ? n : 0;
}

// ---------------------------------------------------------
// UI Helpers
// ---------------------------------------------------------

function renderLibraryPlaceholder(
    text = "Verbinde Meta und wähle ein Werbekonto, um Creatives zu sehen."
) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    grid.innerHTML = `
        <div style="
            grid-column: 1 / -1;
            padding:24px;
            border-radius:16px;
            background:#ffffff;
            box-shadow:0 10px 30px rgba(15,23,42,0.06);
            text-align:center;
            font-size:14px;
            color:var(--text-secondary);
        ">
            ${text}
        </div>
    `;
}

function renderLibraryLoading() {
    renderLibraryPlaceholder("Lade Creatives & Performance-Metriken…");
}

function buildKpiBar(label, valueFormatted, normalized, suffix = "") {
    const width = Math.min(100, Math.max(0, normalized * 100));
    return `
        <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; justify-content:space-between; font-size:11px;">
                <span style="color:var(--text-secondary);">${label}</span>
                <span style="font-weight:500;">${valueFormatted}${suffix}</span>
            </div>
            <div style="
                position:relative;
                width:100%;
                height:6px;
                border-radius:999px;
                background:rgba(15,23,42,0.06);
                overflow:hidden;
            ">
                <div style="
                    position:absolute;
                    inset:0;
                    transform-origin:left center;
                    transform:scaleX(${width / 100 || 0});
                    background:linear-gradient(90deg, #6366F1, #06B6D4);
                "></div>
            </div>
        </div>
    `;
}

// ---------------------------------------------------------
// Creatives für aktuelle Auswahl
// ---------------------------------------------------------

function getCreativesForCurrentSelection() {
    const meta = AppState.meta || {};
    let items = meta.creatives && meta.creatives.length
        ? meta.creatives
        : meta.ads || [];

    if (!Array.isArray(items)) return [];

    // Filtern nach Kampagne (falls ausgewählt)
    if (AppState.selectedCampaignId) {
        items = items.filter((c) => {
            const cid = c.campaign_id || c.campaignId;
            return cid === AppState.selectedCampaignId;
        });
    }

    // Normalisieren
    return items.map(normalizeCreative);
}

// ---------------------------------------------------------
// Public API – von app.js aufgerufen
// ---------------------------------------------------------

export function updateCreativeLibraryView(connected) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    if (!connected) {
        renderLibraryPlaceholder();
        return;
    }

    renderLibraryLoading();

    const creatives = getCreativesForCurrentSelection();
    cachedCreatives = creatives;

    if (!creatives.length) {
        renderLibraryPlaceholder(
            AppState.selectedCampaignId
                ? "Für diese Kampagne wurden keine Creatives gefunden."
                : "Keine Creatives gefunden. Prüfe Filter oder Kampagnenauswahl."
        );
        return;
    }

    renderCreativeLibrary();
}

// Diese Funktion wird von app.js bei Such-/Filter-Änderungen aufgerufen
export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    if (!cachedCreatives.length) {
        renderLibraryPlaceholder(
            AppState.metaConnected
                ? "Keine Creatives geladen. Wechsle Kampagne oder Werbekonto."
                : "Verbinde zuerst Meta, um Creatives zu sehen."
        );
        return;
    }

    // Filter & Sort aus UI lesen
    const searchEl = document.getElementById("creativeSearch");
    const sortEl = document.getElementById("creativeSort");
    const typeEl = document.getElementById("creativeType");

    const searchTerm = (searchEl?.value || "").toLowerCase().trim();
    const sortValue = sortEl?.value || "";
    const typeFilter = typeEl?.value || "all";

    let list = [...cachedCreatives];

    // Type-Filter (z. B. "all", "video", "image", "carousel")
    if (typeFilter !== "all") {
        const t = typeFilter.toUpperCase();
        list = list.filter((c) =>
            (c._view.type || "").toUpperCase().includes(t)
        );
    }

    // Suche nach Name / ID
    if (searchTerm) {
        list = list.filter((c) => {
            const name = (c._view.name || "").toLowerCase();
            const id = (c._view.id || "").toLowerCase();
            return name.includes(searchTerm) || id.includes(searchTerm);
        });
    }

    // Sortierung
    if (sortValue === "spend_desc") {
        list.sort((a, b) => b.metrics.spend - a.metrics.spend);
    } else if (sortValue === "roas_desc") {
        list.sort((a, b) => b.metrics.roas - a.metrics.roas);
    } else if (sortValue === "ctr_desc") {
        list.sort((a, b) => b.metrics.ctr - a.metrics.ctr);
    } else if (sortValue === "name_asc") {
        list.sort((a, b) =>
            (a._view.name || "").localeCompare(b._view.name || "", "de-DE")
        );
    }

    if (!list.length) {
        renderLibraryPlaceholder("Keine Creatives entsprechen den aktuellen Filtern.");
        return;
    }

    // Für Balken-Normalisierung
    const maxRoas = Math.max(...list.map((c) => c.metrics.roas || 0), 0);
    const maxSpend = Math.max(...list.map((c) => c.metrics.spend || 0), 0);
    const maxCtr = Math.max(...list.map((c) => c.metrics.ctr || 0), 0);

    // Grid über CSS steuern (kein Vollbreiten-Bug bei 1 Creative)
    // -> styles.css: #creativeLibraryGrid { display:grid; grid-template-columns: repeat(auto-fill,minmax(320px,1fr)); gap:22px; }
    grid.innerHTML = list
        .map((c) => {
            const v = c._view;
            const m = c.metrics;

            const roas = m.roas || 0;
            const spend = m.spend || 0;
            const ctr = m.ctr || 0;

            const roasFormatted = roas ? `${roas.toFixed(2)}x` : "0x";
            const spendFormatted = spend
                ? `€ ${spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`
                : "€ 0";
            const ctrFormatted = ctr ? `${ctr.toFixed(2)}%` : "0%";

            const impressions = m.impressions || 0;
            const clicks = m.clicks || 0;

            const roasNorm = maxRoas ? roas / maxRoas : 0;
            const spendNorm = maxSpend ? spend / maxSpend : 0;
            const ctrNorm = maxCtr ? ctr / maxCtr : 0;

            return `
                <article
                    class="creative-library-item"
                    data-ad-id="${v.id}"
                    style="
                        display:flex;
                        flex-direction:column;
                        gap:12px;
                        border-radius:18px;
                        background:#ffffff;
                        box-shadow:0 16px 40px rgba(15,23,42,0.10);
                        padding:14px;
                        cursor:pointer;
                        transition:transform 120ms ease-out, box-shadow 120ms ease-out;
                        max-width:380px;
                        margin:0 auto;
                    "
                >
                    <div
                        style="
                            position:relative;
                            width:100%;
                            padding-top:75%;
                            border-radius:14px;
                            overflow:hidden;
                            background:linear-gradient(145deg,#E5E7EB,#F9FAFB);
                        "
                    >
                        ${
                            v.thumbnail
                                ? `
                            <img
                                src="${v.thumbnail}"
                                alt="${escapeHtml(v.name)}"
                                style="
                                    position:absolute;
                                    inset:0;
                                    width:100%;
                                    height:100%;
                                    object-fit:cover;
                                "
                            />
                        `
                                : `
                            <div style="
                                position:absolute;
                                inset:0;
                                display:flex;
                                align-items:center;
                                justify-content:center;
                                font-size:12px;
                                color:var(--text-secondary);
                            ">
                                Kein Preview verfügbar
                            </div>
                        `
                        }
                        <div style="
                            position:absolute;
                            top:8px;
                            left:8px;
                            padding:3px 9px;
                            border-radius:999px;
                            font-size:10px;
                            font-weight:600;
                            background:rgba(0,0,0,0.6);
                            color:#ffffff;
                            display:flex;
                            align-items:center;
                            gap:4px;
                        ">
                            <span style="
                                display:inline-flex;
                                width:14px;
                                height:14px;
                                border-radius:4px;
                                background:#ffffff;
                                align-items:center;
                                justify-content:center;
                                font-size:9px;
                                font-weight:700;
                                color:#000;
                            ">
                                M
                            </span>
                            Meta Creative
                        </div>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <div style="display:flex; justify-content:space-between; gap:10px;">
                            <div style="
                                font-size:13px;
                                font-weight:600;
                                white-space:nowrap;
                                overflow:hidden;
                                text-overflow:ellipsis;
                                max-width:260px;
                            ">
                                ${escapeHtml(v.name)}
                            </div>
                            <div style="font-size:11px; color:var(--text-secondary); text-align:right;">
                                Ad ID: ${v.id}
                            </div>
                        </div>

                        <div style="display:flex; flex-direction:column; gap:8px;">
                            ${buildKpiBar("ROAS (30D)", roasFormatted, roasNorm)}
                            ${buildKpiBar("Spend (30D)", spendFormatted, spendNorm)}
                            ${buildKpiBar("CTR (30D)", ctrFormatted, ctrNorm)}
                        </div>

                        <div style="
                            display:flex;
                            justify-content:space-between;
                            align-items:center;
                            font-size:11px;
                            color:var(--text-secondary);
                        ">
                            <span>Impr: <strong>${impressions.toLocaleString("de-DE")}</strong></span>
                            <span>Clicks: <strong>${clicks.toLocaleString("de-DE")}</strong></span>
                        </div>
                    </div>
                </article>
            `;
        })
        .join("");

    // Interaktionen (Hover + Click → Modal)
    grid.querySelectorAll(".creative-library-item").forEach((card) => {
        const adId = card.getAttribute("data-ad-id");
        const creative = cachedCreatives.find(
            (c) => String(c._view.id) === String(adId)
        );
        if (!creative) return;

        card.addEventListener("click", () => {
            openCreativeDetails(creative);
        });

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-4px)";
            card.style.boxShadow = "0 22px 50px rgba(15,23,42,0.18)";
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "translateY(0)";
            card.style.boxShadow = "0 16px 40px rgba(15,23,42,0.10)";
        });
    });
}

// ---------------------------------------------------------
// Detail-Modal für ein einzelnes Creative
// ---------------------------------------------------------

function openCreativeDetails(creative) {
    const v = creative._view || {};
    const m = creative.metrics || {};

    const roas = m.roas || 0;
    const spend = m.spend || 0;
    const ctr = m.ctr || 0;
    const impressions = m.impressions || 0;
    const clicks = m.clicks || 0;
    const cpm = m.cpm || 0;
    const cpc = clicks ? spend / clicks : 0;

    const html = `
        <div style="display:flex; flex-direction:column; gap:20px; max-width:720px;">
            <header style="display:flex; gap:20px; align-items:flex-start;">
                <div style="
                    position:relative;
                    width:180px;
                    padding-top:120px;
                    border-radius:14px;
                    overflow:hidden;
                    background:linear-gradient(145deg,#E5E7EB,#F9FAFB);
                    flex-shrink:0;
                ">
                    ${
                        v.thumbnail
                            ? `
                        <img
                            src="${v.thumbnail}"
                            alt="${escapeHtml(v.name)}"
                            style="
                                position:absolute;
                                inset:0;
                                width:100%;
                                height:100%;
                                object-fit:cover;
                            "
                        />
                    `
                            : `
                        <div style="
                            position:absolute;
                            inset:0;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            font-size:12px;
                            color:var(--text-secondary);
                        ">
                            Kein Preview verfügbar
                        </div>
                    `
                    }
                    <div style="
                        position:absolute;
                        top:8px;
                        left:8px;
                        padding:3px 9px;
                        border-radius:999px;
                        font-size:10px;
                        font-weight:600;
                        background:rgba(0,0,0,0.65);
                        color:#ffffff;
                        display:flex;
                        align-items:center;
                        gap:4px;
                    ">
                        <span style="
                            display:inline-flex;
                            width:14px;
                            height:14px;
                            border-radius:4px;
                            background:#ffffff;
                            align-items:center;
                            justify-content:center;
                            font-size:9px;
                            font-weight:700;
                            color:#000;
                        ">
                            M
                        </span>
                        Meta Creative
                    </div>
                </div>

                <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
                    <div>
                        <h3 style="margin:0 0 4px 0; font-size:20px; font-weight:600;">
                            ${escapeHtml(v.name || "Unbenanntes Creative")}
                        </h3>
                        <p style="margin:0; font-size:13px; color:var(--text-secondary);">
                            Ad ID: <strong>${v.id}</strong>
                            ${
                                v.campaignId
                                    ? ` · Kampagne: <strong>${v.campaignId}</strong>`
                                    : ""
                            }
                        </p>
                    </div>

                    <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:11px;">
                        <span style="
                            padding:4px 10px;
                            border-radius:999px;
                            background:rgba(99,102,241,0.08);
                            color:var(--primary);
                            font-weight:600;
                            text-transform:uppercase;
                        ">
                            ${v.status || "STATUS UNBEKANNT"}
                        </span>
                        ${
                            v.type
                                ? `<span style="
                                        padding:4px 10px;
                                        border-radius:999px;
                                        background:rgba(15,23,42,0.04);
                                    ">
                                        Typ: ${v.type}
                                    </span>`
                                : ""
                        }
                    </div>
                </div>
            </header>

            <section style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">
                <div class="metric-chip">
                    <div class="metric-label">ROAS (30D)</div>
                    <div class="metric-value">${roas ? `${roas.toFixed(2)}x` : "0x"}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Spend (30D)</div>
                    <div class="metric-value">
                        ${
                            spend
                                ? `€ ${spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`
                                : "€ 0"
                        }
                    </div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">CTR (30D)</div>
                    <div class="metric-value">${ctr ? `${ctr.toFixed(2)}%` : "0%"}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Impressions (30D)</div>
                    <div class="metric-value">${impressions.toLocaleString("de-DE")}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">Clicks (30D)</div>
                    <div class="metric-value">${clicks.toLocaleString("de-DE")}</div>
                </div>
                <div class="metric-chip">
                    <div class="metric-label">CPM / CPC (30D)</div>
                    <div class="metric-value">
                        ${
                            cpm
                                ? `CPM: € ${cpm.toFixed(2)}`
                                : "CPM: –"
                        }
                        ${
                            cpc
                                ? ` · CPC: € ${cpc.toFixed(2)}`
                                : ""
                        }
                    </div>
                </div>
            </section>

            <section style="display:flex; flex-direction:column; gap:8px;">
                <div style="font-size:13px; font-weight:600;">Geplante Sensei-Features (Placeholder)</div>
                <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-secondary);">
                    <li>„AdSensei Score“ für dieses Creative (0–100) basierend auf Performance & Konsistenz.</li>
                    <li>Hook-, Angle- und Offer-Breakdown inkl. Vorschlägen für neue Varianten.</li>
                    <li>„Neue Variation mit Sensei erzeugen“ – später: AI-Text & -Briefing, passend zur Kampagne.</li>
                </ul>
            </section>
        </div>
    `;

    openModal("Creative / Ad Details", html);
}

// ---------------------------------------------------------
// Utils
// ---------------------------------------------------------

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
