// packages/creativeLibrary/creativeLibrary.sections.js
// Deep-Dive Modal & Card-Eventhandling für Creative Library.

import { openModal } from "../../uiCore.js";

function getEl(id) {
    return document.getElementById(id);
}

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

function fInt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

let lastRenderedCreatives = [];

/**
 * Wird von index.js nach jedem Render mit der aktuell gefilterten Liste aufgerufen.
 */
export function attachCreativeCardHandlers(creatives) {
    lastRenderedCreatives = creatives || [];

    document.querySelectorAll(".creative-library-item").forEach((card) => {
        const id = card.getAttribute("data-creative-id");
        card.addEventListener("click", () => {
            const creative = lastRenderedCreatives.find((c) => c.id === id);
            if (creative) openCreativeDetailModal(creative);
        });
    });
}

export function initCreativeDeepDive() {
    // Reserviert für spätere globale Event-Listener, falls nötig.
}

export function openCreativeDetailModal(creative) {
    const title = creative.name || "Creative Detail";

    const bodyHtml = `
        <div class="creative-modal-layout">
            <div class="creative-modal-col">
                <div class="creative-modal-thumb">
                    ${
                        creative.thumbnail
                            ? `<img src="${creative.thumbnail}" alt="${creative.name}">`
                            : `<div class="creative-faux-thumb">${(creative.name || "Ad")
                                  .substring(0, 2)
                                  .toUpperCase()}</div>`
                    }
                </div>
                <p class="creative-modal-copy">
                    Kampagne: <strong>${creative.campaignName || "n/a"}</strong><br>
                    Adset: <strong>${creative.adsetName || "n/a"}</strong><br>
                    Typ: <strong>${creative.type || "n/a"}</strong>
                </p>
                <div class="sensei-snapshot">
                    <div class="sensei-label">Sensei Snapshot</div>
                    <div class="sensei-text">
                        "${creative.roas > 3
                            ? "Starker Performer – Skalierung möglich. Teste neue Hook-Varianten mit ähnlichem Aufbau."
                            : "Unterperformer – als Kandidat für Pausierung & UGC-Test vormerken."}"
                    </div>
                    <div class="modal-kpis-grid">
                        <div class="metric-chip">
                            <div class="metric-label">ROAS</div>
                            <div class="metric-value">${(creative.roas || 0).toFixed(
                                2
                            )}x</div>
                        </div>
                        <div class="metric-chip">
                            <div class="metric-label">Spend</div>
                            <div class="metric-value">${fEuro(creative.spend)}</div>
                        </div>
                        <div class="metric-chip">
                            <div class="metric-label">CTR</div>
                            <div class="metric-value">${fPct(creative.ctr)}</div>
                        </div>
                        <div class="metric-chip">
                            <div class="metric-label">CPM</div>
                            <div class="metric-value">${fEuro(creative.cpm)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="creative-modal-col">
                <div class="campaign-modal-section">
                    <h3>Performance Breakdown</h3>
                    <div class="creative-modal-table-wrapper">
                        <table class="creative-modal-table">
                            <thead>
                                <tr>
                                    <th>Metric</th>
                                    <th>Wert</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr><td>Impressions</td><td>${fInt(
                                    creative.impressions
                                )}</td></tr>
                                <tr><td>Clicks</td><td>${fInt(creative.clicks)}</td></tr>
                                <tr><td>Conversions</td><td>${fInt(
                                    creative.conversions
                                )}</td></tr>
                                <tr><td>Spend</td><td>${fEuro(creative.spend)}</td></tr>
                                <tr><td>ROAS</td><td>${(creative.roas || 0).toFixed(
                                    2
                                )}x</td></tr>
                                <tr><td>CTR</td><td>${fPct(creative.ctr)}</td></tr>
                                <tr><td>CPM</td><td>${fEuro(creative.cpm)}</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="campaign-modal-section">
                    <h4>Empfohlene Aktionen</h4>
                    <p class="campaign-note">
                        Diese Aktionen sind Demo-Empfehlungen. Im Live-System können hier
                        direkte Meta-Aktionen ausgelöst werden.
                    </p>
                    <div class="campaign-actions-row">
                        <button class="action-button-secondary">In Testing Log übernehmen</button>
                        <button class="action-button">Ähnliche Creatives anzeigen</button>
                    </div>
                </div>
            </div>
        </div>
    `;

    openModal(title, bodyHtml);
}
