// creativeLibrary.js – Creative Library (P2)

import { AppState } from "./state.js";
import { fetchMetaAdAccounts, fetchMetaAds } from "./metaApi.js";
import { openModal } from "./uiCore.js";

function mapObjectTypeToCreativeType(objectType) {
    if (!objectType) return "static";
    const t = String(objectType).toLowerCase();
    if (t.includes("video")) return "video";
    if (t.includes("carousel")) return "carousel";
    return "static";
}

export async function updateCreativeLibraryView(connected) {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    if (!connected) {
        grid.innerHTML = `
            <div class="card">
                <p style="color: var(--text-secondary); font-size:14px;">
                    Verbinde dein Meta-Konto, um deine Creatives zu sehen.
                </p>
            </div>
        `;
        return;
    }

    if (AppState.creativesLoaded && AppState.meta.creatives?.length) {
        renderCreativeLibrary();
        return;
    }

    await loadCreativeLibraryMetaData();
}

async function loadCreativeLibraryMetaData() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    try {
        let accountId = AppState.selectedAccountId;

        if (!accountId) {
            const accounts = await fetchMetaAdAccounts();
            if (
                !accounts.success ||
                !accounts.data ||
                !Array.isArray(accounts.data.data) ||
                accounts.data.data.length === 0
            ) {
                grid.innerHTML = `
                    <div class="card">
                        <p style="color: var(--text-secondary); font-size:14px;">
                            Kein Ad-Konto gefunden. Bitte prüfe deine Meta-Verbindung.
                        </p>
                    </div>
                `;
                AppState.creativesLoaded = true;
                return;
            }
            accountId = accounts.data.data[0].id;
            AppState.selectedAccountId = accountId;
            AppState.meta.adAccounts = accounts.data.data;
        }

        grid.innerHTML = `
            <div class="card">
                <p style="color: var(--text-secondary); font-size:14px;">
                    Lade Creatives & Anzeigen aus Meta...
                </p>
            </div>
        `;

        const adsResult = await fetchMetaAds(accountId);

        if (
            !adsResult.success ||
            !adsResult.data ||
            !Array.isArray(adsResult.data.data) ||
            adsResult.data.data.length === 0
        ) {
            AppState.meta.ads = [];
            AppState.meta.creatives = [];
            AppState.creativesLoaded = true;
            grid.innerHTML = `
                <div class="card">
                    <p style="color: var(--text-secondary); font-size:14px;">
                        Im ausgewählten Zeitraum liegen keine aktiven Anzeigen / Creatives vor.
                    </p>
                </div>
            `;
            return;
        }

        const ads = adsResult.data.data;
        AppState.meta.ads = ads;

        const creatives = ads.map((ad) => {
            const creative = ad.creative || {};
            const insightsArr =
                ad.insights && Array.isArray(ad.insights.data) ? ad.insights.data : [];
            const insight = insightsArr.length ? insightsArr[0] : {};

            const spend = parseFloat(insight.spend || "0") || 0;
            const impressions = parseFloat(insight.impressions || "0") || 0;
            const clicks = parseFloat(insight.clicks || "0") || 0;
            const ctr = parseFloat(insight.ctr || "0") || 0;
            const cpm = parseFloat(insight.cpm || "0") || 0;

            let roas = 0;
            if (
                Array.isArray(insight.website_purchase_roas) &&
                insight.website_purchase_roas.length > 0
            ) {
                roas = parseFloat(
                    insight.website_purchase_roas[0].value || "0"
                ) || 0;
            }

            return {
                id: ad.id,
                name: ad.name || creative.title || `Ad ${ad.id}`,
                campaignId: ad.campaign_id || null,
                adsetId: ad.adset_id || null,
                status: ad.status || "-",
                creativeId: creative.id || null,
                thumbnailUrl: creative.thumbnail_url || "",
                objectType: creative.object_type || "",
                type: mapObjectTypeToCreativeType(creative.object_type),
                spend,
                impressions,
                clicks,
                ctr,
                cpm,
                roas
            };
        });

        AppState.meta.creatives = creatives;
        AppState.creativesLoaded = true;
        renderCreativeLibrary();
    } catch (e) {
        console.error("loadCreativeLibraryMetaData error:", e);
        const grid = document.getElementById("creativeLibraryGrid");
        if (grid) {
            grid.innerHTML = `
                <div class="card">
                    <p style="color: var(--text-secondary); font-size:14px;">
                        Fehler beim Laden der Creatives. Bitte versuche es später erneut.
                    </p>
                </div>
            `;
        }
        AppState.creativesLoaded = true;
    }
}

export function renderCreativeLibrary() {
    const grid = document.getElementById("creativeLibraryGrid");
    if (!grid) return;

    const creatives = AppState.meta.creatives || [];

    if (!creatives.length) {
        grid.innerHTML = `
            <div class="card">
                <p style="color: var(--text-secondary); font-size:14px;">
                    Noch keine Creatives geladen oder keine Daten im aktuellen Zeitraum.
                </p>
            </div>
        `;
        return;
    }

    const searchInput = document.getElementById("creativeSearch");
    const sortSelect = document.getElementById("creativeSort");
    const typeSelect = document.getElementById("creativeType");

    const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
    const sortValue = sortSelect ? sortSelect.value : "roas_desc";
    const typeValue = typeSelect ? typeSelect.value : "all";

    let filtered = creatives.slice();

    if (searchTerm) {
        filtered = filtered.filter((c) =>
            (c.name || "").toLowerCase().includes(searchTerm) ||
            (c.campaignId || "").toLowerCase().includes(searchTerm) ||
            (c.adsetId || "").toLowerCase().includes(searchTerm)
        );
    }

    if (typeValue !== "all") {
        filtered = filtered.filter((c) => c.type === typeValue);
    }

    if (sortValue === "roas_desc") {
        filtered.sort((a, b) => (b.roas || 0) - (a.roas || 0));
    } else if (sortValue === "spend_asc") {
        filtered.sort((a, b) => (a.spend || 0) - (b.spend || 0));
    }

    const maxSpend = Math.max(...filtered.map((c) => c.spend || 0), 1);

    const renderBar = (value, max, type) => {
        const safeVal = Number(value) || 0;
        const clamped = Math.max(
            0,
            Math.min(100, max > 0 ? (safeVal / max) * 100 : 0)
        );
        const fillClass =
            type === "roas" ? "fill-positive" : type === "spend" ? "fill-spend" : "";
        return `
            <div class="kpi-bar-visual">
                <div class="kpi-slider-track">
                    <div class="kpi-slider-fill ${fillClass}" style="width:${clamped}%;"></div>
                </div>
            </div>
        `;
    };

    grid.innerHTML = filtered
        .map((c) => {
            const spendLabel =
                c.spend > 0 ? `€ ${c.spend.toLocaleString("de-DE")}` : "0";
            const roasLabel = c.roas > 0 ? `${c.roas.toFixed(2)}x` : "0";
            const ctrLabel = c.ctr > 0 ? `${c.ctr.toFixed(2)}%` : "0";
            const cpmLabel = c.cpm > 0 ? `€ ${c.cpm.toFixed(2)}` : "0";

            const roasBar = renderBar(c.roas, 5, "roas");
            const spendBar = renderBar(c.spend, maxSpend, "spend");

            return `
            <div class="creative-library-item" data-ad-id="${c.id}">
                <div class="creative-media-container-library">
                    ${
                        c.thumbnailUrl
                            ? `<img src="${c.thumbnailUrl}" alt="Creative Preview">`
                            : `<div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:12px;color:var(--text-secondary);background:rgba(15,23,42,0.8);">Kein Preview</div>`
                    }
                    <div class="platform-badge">Meta</div>
                </div>
                <div class="creative-stats">
                    <div class="creative-name-library">${c.name}</div>
                    <div class="creative-meta">
                        Status: ${c.status} • Typ: ${c.type.toUpperCase()}
                    </div>
                    <div class="kpi-bar-visual-row">
                        <span class="kpi-label-small">ROAS</span>
                        ${roasBar}
                        <span class="kpi-value-mini">${roasLabel}</span>
                    </div>
                    <div class="kpi-bar-visual-row">
                        <span class="kpi-label-small">Spend</span>
                        ${spendBar}
                        <span class="kpi-value-mini">${spendLabel}</span>
                    </div>
                    <div class="creative-footer-kpis">
                        <div class="kpi-footer-item">Impr: ${c.impressions.toLocaleString(
                            "de-DE"
                        )}</div>
                        <div class="kpi-footer-item">Clicks: ${c.clicks.toLocaleString(
                            "de-DE"
                        )}</div>
                        <div class="kpi-footer-item">CTR: ${ctrLabel}</div>
                        <div class="kpi-footer-item">CPM: ${cpmLabel}</div>
                    </div>
                </div>
            </div>
        `;
        })
        .join("");

    grid.querySelectorAll(".creative-library-item").forEach((card) => {
        card.addEventListener("click", () => {
            const adId = card.getAttribute("data-ad-id");
            openCreativeDetails(adId);
        });
    });
}

function openCreativeDetails(adId) {
    if (!adId) return;

    const creatives = AppState.meta.creatives || [];
    const c = creatives.find((x) => x.id === adId);
    if (!c) return;

    const html = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <div><strong>Ad ID:</strong> ${c.id}</div>
            <div><strong>Status:</strong> ${c.status}</div>
            <div><strong>Typ:</strong> ${c.type.toUpperCase()}</div>
            <div><strong>Kampagne:</strong> ${c.campaignId || "-"}</div>
            <div><strong>Ad Set:</strong> ${c.adsetId || "-"}</div>
            <div><strong>Spend (30D):</strong> € ${c.spend.toLocaleString(
                "de-DE"
            )}</div>
            <div><strong>ROAS (30D):</strong> ${
                c.roas > 0 ? c.roas.toFixed(2) + "x" : "0"
            }</div>
            <div><strong>CTR (30D):</strong> ${
                c.ctr > 0 ? c.ctr.toFixed(2) + "%" : "0"
            }</div>
            <div><strong>CPM (30D):</strong> ${
                c.cpm > 0 ? "€ " + c.cpm.toFixed(2) : "0"
            }</div>
            <div><strong>Impressions (30D):</strong> ${c.impressions.toLocaleString(
                "de-DE"
            )}</div>
            <div><strong>Clicks (30D):</strong> ${c.clicks.toLocaleString(
                "de-DE"
            )}</div>
        </div>
    `;

    openModal(`Creative / Ad: ${c.name}`, html);
}
