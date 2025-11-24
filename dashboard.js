// dashboard.js – Premium Dashboard (Final Version)
// SignalOne.cloud – Meta Performance Dashboard

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";

/* -------------------------------------------------------
    Helper Formatters
---------------------------------------------------------*/

const nf = new Intl.NumberFormat("de-DE");

const fEuro = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "€ 0" : `€ ${nf.format(n)}`;
};

const fPct = (v) => {
    const n = Number(v);
    return !isFinite(n) ? "0%" : `${n.toFixed(2)}%`;
};

const fRoas = (v) => {
    const n = Number(v);
    return !isFinite(n) ? "0x" : `${n.toFixed(2)}x`;
};

/* -------------------------------------------------------
    Render KPI Cards
---------------------------------------------------------*/

function renderKpis(metrics) {
    const el = document.getElementById("dashboardKpiContainer");
    if (!el) return;
    if (!metrics) {
        el.innerHTML = `
        <div class="card">Keine Daten verfügbar.</div>
        `;
        return;
    }

    const { spend, roas, ctr, cpm } = metrics;

    el.innerHTML = `
        <div class="kpi-grid">

            <div class="kpi-card">
                <div class="kpi-label"><i class="fa-solid fa-coins"></i> Umsatz / Spend</div>
                <div class="kpi-value">${fEuro(spend)}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label"><i class="fa-solid fa-rocket"></i> ROAS</div>
                <div class="kpi-value">${fRoas(roas)}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label"><i class="fa-solid fa-mouse-pointer"></i> CTR</div>
                <div class="kpi-value">${fPct(ctr)}</div>
            </div>

            <div class="kpi-card">
                <div class="kpi-label"><i class="fa-solid fa-chart-column"></i> CPM</div>
                <div class="kpi-value">${fEuro(cpm)}</div>
            </div>

        </div>
    `;
}

/* -------------------------------------------------------
    Top Creatives Quick Ranking
---------------------------------------------------------*/

function renderTopCreatives(creatives = []) {
    const el = document.getElementById("dashboardHeroCreativesContainer");
    if (!el) return;

    if (!creatives.length) {
        el.innerHTML = `<div class="card">Keine Creatives verfügbar.</div>`;
        return;
    }

    el.innerHTML = `
        <div class="hero-grid">
            ${creatives.map((c, i) => `
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        ${
                            c.thumbnail_url
                                ? `<img src="${c.thumbnail_url}" />`
                                : `<div class="creative-faux-thumb">${i + 1}</div>`
                        }
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">${c.name || "Creative"}</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS:</span>
                            <span class="kpi-value-mini">${fRoas(c.roas || 0)}</span>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* -------------------------------------------------------
    Load Insights & Aggregate
---------------------------------------------------------*/

async function loadDashboardInsights() {
    const campaignList = AppState.meta.campaigns;
    if (!campaignList || !campaignList.length) return null;

    let sumSpend = 0;
    let sumClicks = 0;
    let sumImpressions = 0;
    let weightedRoas = 0;

    for (const camp of campaignList) {
        if (!AppState.meta.insightsByCampaign[camp.id]) {
            const ir = await fetchMetaCampaignInsights(
                camp.id,
                AppState.timeRangePreset
            );
            AppState.meta.insightsByCampaign[camp.id] =
                ir?.success ? ir.data?.data?.[0] || {} : {};
        }

        const m = AppState.meta.insightsByCampaign[camp.id];
        const spend = Number(m.spend || 0);
        const roas = Number(m.purchase_roas || m.roas || 0);
        const ctr = Number(m.ctr || 0);
        const cpm = Number(m.cpm || 0);
        const clicks = Number(m.clicks || 0);
        const imp = Number(m.impressions || 0);

        sumSpend += spend;
        sumClicks += clicks;
        sumImpressions += imp;

        weightedRoas += roas * spend;
    }

    const finalRoas = sumSpend > 0 ? weightedRoas / sumSpend : 0;
    const finalCtr = sumImpressions > 0 ? (sumClicks / sumImpressions) * 100 : 0;
    const finalCpm = sumImpressions > 0 ? (sumSpend / sumImpressions) * 1000 : 0;

    return {
        spend: sumSpend,
        roas: finalRoas,
        ctr: finalCtr,
        cpm: finalCpm
    };
}

/* -------------------------------------------------------
    MAIN ENTRY
---------------------------------------------------------*/

export async function updateDashboardView(connected) {
    const sumEl = document.getElementById("dashboardMetaSummary");
    if (!connected) {
        sumEl.innerHTML = "Nicht mit Meta verbunden.";
        return;
    }

    sumEl.innerHTML = "Daten werden geladen…";

    const metrics = await loadDashboardInsights();
    AppState.dashboardMetrics = metrics;

    renderKpis(metrics);

    // For later Creative Ranking:
    renderTopCreatives(
        AppState.meta.creatives?.slice(0, 3) || []
    );

    sumEl.innerHTML = "Dashboard aktualisiert.";
}
