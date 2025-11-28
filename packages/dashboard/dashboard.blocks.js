// packages/dashboard/dashboard.blocks.js
// UI-Blöcke für Dashboard: Top/Flop Creatives, KPI Mini Cards, Hero Bars

/**
 * Rendert Top & Flop Creatives basierend auf KPIs
 * input: creatives = [{ id, name, thumbnail, ctr, roas, spend }]
 */
export function renderTopFlopCreatives(creatives = []) {
    if (!creatives.length) return "";

    const sorted = [...creatives].sort((a, b) => b.roas - a.roas);
    const top = sorted.slice(0, 3);
    const flop = sorted.slice(-3);

    return `
        <div class="dashboard-block">
            <h3>Top Creatives</h3>
            <div class="creative-mini-grid">
                ${top.map(renderCreativeMiniCard).join("")}
            </div>

            <h3 style="margin-top:24px;">Flop Creatives</h3>
            <div class="creative-mini-grid">
                ${flop.map(renderCreativeMiniCard).join("")}
            </div>
        </div>
    `;
}

function renderCreativeMiniCard(c) {
    const img =
        c.thumbnail ||
        "https://via.placeholder.com/200x200/cccccc/000000?text=No+Preview";

    return `
        <div class="creative-mini-card">
            <img src="${img}" class="creative-mini-thumb">
            <div class="creative-mini-info">
                <div class="name">${escapeHtml(c.name || "Creative")}</div>
                <div class="kpis">
                    <span>ROAS: ${fmt(c.roas)}x</span>
                    <span>CTR: ${fmt(c.ctr)}%</span>
                </div>
            </div>
        </div>
    `;
}

/**
 * KPI Mini Card Block für Dashboard Header
 */
export function renderKpiMiniCards(metrics = {}) {
    const {
        roas = 0,
        ctr = 0,
        cpm = 0,
        spend = 0,
        conversions = 0
    } = metrics;

    return `
        <div class="kpi-grid">
            ${kpi("ROAS", roas.toFixed(2) + "x")}
            ${kpi("CTR", ctr.toFixed(2) + "%")}
            ${kpi("CPM", cpm.toFixed(2) + " €")}
            ${kpi(
                "Spend",
                spend.toLocaleString("de-DE") + " €"
            )}
            ${kpi("Conversions", conversions)}
        </div>
    `;
}

function kpi(label, value) {
    return `
        <div class="kpi-card">
            <div class="kpi-label">${label}</div>
            <div class="kpi-value">${value}</div>
        </div>
    `;
}

/**
 * Hero Bar für Dashboard
 */
export function renderHeroBar(connected, demo) {
    if (connected) return "";

    if (demo) {
        return `
            <div class="hero-bar demo">
                Demo Mode aktiv – Echtzeitwerte werden simuliert ⚡
            </div>
        `;
    }

    return `
        <div class="hero-bar danger">
            Nicht mit Meta Ads verbunden
            <button id="heroConnectButton" class="hero-btn">Mit Meta verbinden</button>
        </div>
    `;
}

function escapeHtml(str) {
    return (str + "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function fmt(v) {
    if (v == null) return "-";
    return Number(v).toFixed(2);
}
