// creativeLibrary.js
import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Rendert die Creative Library (Datads-Style Cards)
 */
export function renderCreativeLibrary() {
    const container = document.getElementById("creativeLibraryContent");
    if (!container) return;

    const creatives = AppState.meta.creatives || [];

    if (creatives.length === 0) {
        container.innerHTML = `
            <div class="card hero-empty">
                <h3>Creative Library</h3>
                <p>Keine Creatives gefunden. Verbinde Meta oder nutze den Demo Mode.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="view-header">
            <div>
                <h2 class="elite-title">Creative Library</h2>
                <div class="header-date-time">
                    Creatives: ${creatives.length} · Konto: ${AppState.selectedAccountId || "n/a"}
                </div>
            </div>
        </div>

        <div id="creativeLibraryGrid">
            ${creatives.map(renderCreativeCard).join("")}
        </div>
    `;
}

function renderCreativeCard(c) {
    const platform = c.platform || "Meta Ads";
    const thumb = c.thumbnailUrl || c.image_url || null;
    const name = c.name || c.title || "Unbenanntes Creative";

    const metrics = c.metrics || {};
    const spend = Number(metrics.spend || 0);
    const roas = Number(metrics.roas || 0);
    const ctr = Number(metrics.ctr || 0);
    const cpa = Number(metrics.cpa || 0);

    const roasPct = clamp(roas * 20, 0, 100); // grober Balken
    const ctrPct = clamp(ctr * 10, 0, 100);
    const spendPct = clamp(spendScale(spend), 0, 100);

    return `
    <article class="creative-library-item" data-creative-id="${c.id}">
        <div class="creative-media-container-library">
            ${
                thumb
                    ? `<img src="${thumb}" alt="${escapeHtml(name)}" />`
                    : `<div class="creative-faux-thumb">CREATIVE</div>`
            }
            <span class="platform-badge">${platform}</span>
        </div>

        <div class="creative-stats">
            <div class="creative-name-library">${escapeHtml(name)}</div>
            <div class="creative-meta">
                ID: ${c.id || "-"} · Format: ${c.format || "n/a"}
            </div>

            <div class="creative-kpi-list">
                <div class="creative-kpi-line">
                    <span class="creative-kpi-label">ROAS</span>
                    <span class="creative-kpi-value">${roas ? roas.toFixed(2) + "x" : "–"}</span>
                </div>
                <div class="creative-kpi-line">
                    <span class="creative-kpi-label">Spend</span>
                    <span class="creative-kpi-value">${formatCurrency(spend)}</span>
                </div>
                <div class="creative-kpi-line">
                    <span class="creative-kpi-label">CTR</span>
                    <span class="creative-kpi-value">${ctr ? ctr.toFixed(2) + "%" : "–"}</span>
                </div>
                <div class="creative-kpi-line">
                    <span class="creative-kpi-label">CPA</span>
                    <span class="creative-kpi-value">${cpa ? formatCurrency(cpa) : "–"}</span>
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
                <span>Clicks: ${metrics.clicks || 0}</span>
                <span>Impressions: ${formatShort(metrics.impressions || 0)}</span>
            </div>
        </div>
    </article>
    `;
}

function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v || 0));
}

function spendScale(spend) {
    if (!spend) return 0;
    if (spend > 5000) return 100;
    if (spend > 1000) return 80;
    if (spend > 500) return 60;
    if (spend > 100) return 40;
    if (spend > 10) return 20;
    return 10;
}

function formatCurrency(v) {
    const num = Number(v || 0);
    return num.toLocaleString("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function formatShort(v) {
    const num = Number(v || 0);
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
    if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
    return num.toLocaleString("de-DE");
}

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, s => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[s]));
}
