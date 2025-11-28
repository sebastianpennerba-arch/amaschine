// packages/dashboard/dashboard.blocks.js
// UI-Blöcke für Dashboard: KPI Cards, Top/Flop Creatives, Hero Bar, einfacher Funnel-Mini-Block

/**
 * Rendert KPI-Mini-Cards (ROAS, CTR, CPM, Spend, Conversions)
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
            ${kpi("Spend", spend.toLocaleString("de-DE") + " €")}
            ${kpi("Conversions", formatInt(conversions))}
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
 * Rendert Top & Flop Creatives Block.
 * creatives: [{ id, name, thumbnail, roas, ctr, spend }]
 */
export function renderTopFlopCreatives(creatives = []) {
    if (!creatives.length) return "";

    const sorted = [...creatives].sort((a, b) => b.roas - a.roas);

    const top = sorted.slice(0, Math.min(3, sorted.length));
    const flop = sorted.slice(-Math.min(3, sorted.length)).reverse();

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
        "https://via.placeholder.com/200x200/cccccc/000000?text=Creative";

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
 * Hero Bar oben im Dashboard – Meta nicht verbunden vs. Demo vs. Live.
 */
export function renderHeroBar(connected, demo) {
    if (connected) {
        return `
            <div class="hero-bar success">
                Live Daten aktiv – Performance in Echtzeit 🔥
            </div>
        `;
    }

    if (demo) {
        return `
            <div class="hero-bar demo">
                Demo Mode aktiv – KPI-Simulation basierend auf Beispielkampagnen ⚡
            </div>
        `;
    }

    return `
        <div class="hero-bar danger">
            Nicht mit Meta Ads verbunden.
            <button id="heroConnectButton" class="hero-btn">Mit Meta verbinden</button>
        </div>
    `;
}

/**
 * Kleiner Funnel-Mini-Block (TOF/MOF/BOF Scores)
 * funnel: { tofScore, mofScore, bofScore }
 */
export function renderFunnelMiniBlock(funnel = {}) {
    if (
        funnel.tofScore == null &&
        funnel.mofScore == null &&
        funnel.bofScore == null
    ) {
        return "";
    }

    return `
        <div class="dashboard-block">
            <h3>Funnel Snapshot</h3>
            <div class="funnel-mini-grid">
                ${funnelScore("Top Funnel", funnel.tofScore)}
                ${funnelScore("Middle Funnel", funnel.mofScore)}
                ${funnelScore("Bottom Funnel", funnel.bofScore)}
            </div>
        </div>
    `;
}

function funnelScore(label, score) {
    if (score == null) return "";
    return `
        <div class="funnel-mini-card">
            <div class="label">${label}</div>
            <div class="score">${score}/10</div>
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
    if (v == null) return "–";
    return Number(v).toFixed(2);
}

function formatInt(v) {
    const n = Number(v);
    if (isNaN(n)) return "–";
    return n.toLocaleString("de-DE");
}
