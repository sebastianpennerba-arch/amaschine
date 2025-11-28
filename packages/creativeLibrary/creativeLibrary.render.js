// packages/creativeLibrary/creativeLibrary.render.js
// Rendering der Creative Library Cards in #creativeLibraryGrid.

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

export function renderCreativeLibrary(state) {
    const container = document.getElementById("creativeLibraryGrid");
    if (!container) return;

    const items = state?.items || [];

    if (!items.length) {
        container.innerHTML = `
            <p style="color:var(--text-secondary); font-size:13px;">
                Keine Creatives gefunden. Verbinde Meta oder aktiviere den Demo-Modus.
            </p>
        `;
        return;
    }

    const html = items
        .map((c) => {
            const badge =
                typeof c.rank === "number"
                    ? `<div class="creative-rank-badge">#${c.rank}</div>`
                    : "";

            return `
                <div class="creative-library-item" data-creative-id="${c.id}">
                    <div class="creative-media-container-library">
                        ${
                            c.thumbnail
                                ? `<img src="${c.thumbnail}" alt="${c.name}">`
                                : `<div class="creative-faux-thumb">${(c.name || "Ad")
                                      .substring(0, 2)
                                      .toUpperCase()}</div>`
                        }
                        <div class="platform-badge">${c.platform || "META"}</div>
                        ${badge}
                    </div>
                    <div class="creative-stats">
                        <div class="creative-name-library">${c.name}</div>
                        <div class="creative-meta">
                            ${c.campaignName || "Unbekannte Kampagne"} 
                            ${c.adsetName ? " • " + c.adsetName : ""}
                        </div>

                        <div class="creative-kpi-list">
                            <div class="creative-kpi-line">
                                <span class="creative-kpi-label">Spend</span>
                                <span class="creative-kpi-value">${fEuro(c.spend)}</span>
                            </div>
                            <div class="creative-kpi-line">
                                <span class="creative-kpi-label">ROAS</span>
                                <span class="creative-kpi-value">${(c.roas || 0).toFixed(
                                    2
                                )}x</span>
                            </div>
                            <div class="creative-kpi-line">
                                <span class="creative-kpi-label">CTR</span>
                                <span class="creative-kpi-value">${fPct(c.ctr)}</span>
                            </div>
                            <div class="creative-kpi-line">
                                <span class="creative-kpi-label">CPM</span>
                                <span class="creative-kpi-value">${fEuro(c.cpm)}</span>
                            </div>
                        </div>

                        <div class="kpi-bar-visual">
                            <span class="kpi-label-small">ROAS</span>
                            <div class="kpi-slider-track">
                                <div 
                                    class="kpi-slider-fill fill-positive" 
                                    style="width:${Math.min((c.roas || 0) * 20, 100)}%">
                                </div>
                            </div>
                        </div>

                        <div class="kpi-bar-visual">
                            <span class="kpi-label-small">Spend</span>
                            <div class="kpi-slider-track">
                                <div 
                                    class="kpi-slider-fill fill-spend" 
                                    style="width:80%">
                                </div>
                            </div>
                        </div>

                        <div class="creative-footer-kpis">
                            <span>Impr: ${fInt(c.impressions)}</span>
                            <span>Clicks: ${fInt(c.clicks)}</span>
                        </div>
                    </div>
                </div>
            `;
        })
        .join("");

    container.innerHTML = html;
}
