// packages/creativeLibrary/creativeLibrary.sections.js
// Rendert Detail-Ansichten von Creatives (Modal View)
// Wird vom Creative Library Package über index.js → openDetails() aufgerufen.

import { showToast } from "../../uiCore.js";

/**
 * Öffnet ein Detail-Modal für ein spezifisches Creative.
 * Erwartet ein Creative-Objekt nach mapping aus compute.js
 */
export function renderCreativeDetailsModal(item, isDemo) {
    if (!item) return;

    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");

    if (!overlay || !titleEl || !bodyEl) {
        console.warn("[CreativeDetailsModal] Missing modal elements");
        return;
    }

    titleEl.textContent = item.name || "Creative Details";

    bodyEl.innerHTML = `
        <div class="creative-details-wrapper">

            <!-- Thumbnail -->
            <div class="creative-details-left">
                <img src="${item.thumbnail}" class="creative-details-thumb" />

                <div class="creative-meta-block">
                    <div><strong>Typ:</strong> ${escapeHtml(item.type || "—")}</div>
                    <div><strong>ID:</strong> ${escapeHtml(item.id || "—")}</div>
                </div>
            </div>

            <!-- Right KPIs -->
            <div class="creative-details-right">
                <h3>Performance</h3>

                <div class="creative-kpi-grid">
                    ${kpi("ROAS", fmt(item.roas), "x")}
                    ${kpi("CTR", fmt(item.ctr), "%")}
                    ${kpi("CPM", fmt(item.cpm), " €")}
                    ${kpi("Spend", number(item.spend).toLocaleString("de-DE"), " €")}
                    ${kpi("Conversions", fmt(item.conversions))}
                    ${kpi("Clicks", fmt(item.clicks))}
                    ${kpi("Impressions", fmt(item.impressions))}
                </div>

                <h3 style="margin-top: 16px;">Beschreibung</h3>
                <p class="creative-desc">
                    ${escapeHtml(item.headline || "Keine Beschreibung vorhanden")}
                </p>

                ${isDemo ? `<span class="badge-demo">Demo Mode</span>` : ""}
            </div>

        </div>
    `;

    overlay.classList.add("visible");
}

/* ============================================================
   KPIs
============================================================ */

function kpi(label, value, suffix = "") {
    return `
        <div class="creative-kpi-card">
            <div class="label">${label}</div>
            <div class="value">${value}${suffix}</div>
        </div>
    `;
}

function fmt(v) {
    if (v == null) return "—";
    return Number(v).toFixed(2);
}

function number(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function escapeHtml(str) {
    return (str + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
