// packages/creativeLibrary/creativeLibrary.render.js
// Rendert die Creative Library Grid-/Group-/Cards-Ausgabe im Root-Container
// Container-ID aus index.html: #creativeLibraryGrid

import { showToast } from "../../uiCore.js";

/**
 * Rendert die Creative Library:
 * - normale Creative Cards
 * - gruppierte Cards (wenn groupBy aktiv)
 * - Demo-Badge
 */
export function renderCreativeLibrary({ creatives = [], demoMode }) {
    const container = document.getElementById("creativeLibraryGrid");
    if (!container) {
        console.warn("[CreativeLibraryRender] #creativeLibraryGrid missing");
        return;
    }

    if (!creatives.length) {
        container.innerHTML = `
            <div class="creative-empty">
                Keine Creatives gefunden.
            </div>
        `;
        return;
    }

    // Prüfe, ob gruppierte Ergebnisse existieren (__group Marker)
    const hasGroups = creatives.some((c) => c.__group);

    if (hasGroups) {
        container.innerHTML = renderGroupedCreatives(creatives, demoMode);
    } else {
        container.innerHTML = renderFlatCreatives(creatives, demoMode);
    }
}

/* ============================================================
   FLACHE RENDERING (Standard Grid)
============================================================ */

function renderFlatCreatives(list, demoMode) {
    return `
        <div class="creative-grid">
            ${list.map((item) => renderCreativeCard(item, demoMode)).join("")}
        </div>
    `;
}

/* ============================================================
   GROUPED RENDERING
============================================================ */

function renderGroupedCreatives(list, demoMode) {
    let html = "";
    let currentGroup = null;

    list.forEach((entry) => {
        if (entry.__group) {
            // Gruppen-Titel
            html += `
                <div class="creative-group-title">
                    <span>${escapeHtml(entry.label)}</span>
                    <span class="count">${entry.count} Creatives</span>
                </div>
                <div class="creative-grid">
            `;
            currentGroup = entry.label;
        } else {
            // Creative Card
            html += renderCreativeCard(entry, demoMode);
        }

        // Check ob nächster Eintrag ein neuer Group-Header wird → dann schließen wir das grid
        const next = list[list.indexOf(entry) + 1];
        if ((entry.__group === false || entry.__group == null) && (!next || next.__group)) {
            html += `</div>`;
        }
    });

    return html;
}

/* ============================================================
   CARD TEMPLATE
============================================================ */

function renderCreativeCard(item, demoMode) {
    return `
        <div class="creative-card" data-creative-id="${item.id}">
            <div class="creative-thumb">
                <img src="${item.thumbnail}" alt="${escapeHtml(item.name)}" />
                ${demoMode ? `<span class="badge-demo-corner">DEMO</span>` : ""}
            </div>

            <div class="creative-info">
                <div class="creative-title">${escapeHtml(item.name)}</div>
                <div class="creative-kpis">
                    <span>ROAS: ${fmt(item.roas)}x</span>
                    <span>CTR: ${fmt(item.ctr)}%</span>
                </div>
            </div>
        </div>
    `;
}

/* ============================================================
   HELPERS
============================================================ */

function fmt(v) {
    if (v == null || v === "") return "—";
    return Number(v).toFixed(2);
}

function escapeHtml(str) {
    return (str + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
