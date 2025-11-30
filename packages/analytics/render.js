/* ----------------------------------------------------------
   ANALYTICS – render.js
   Premium VisionOS KPI & Trend UI
-----------------------------------------------------------*/

import { buildAnalytics } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Trend Chart
-----------------------------------------------------------*/
function trendChartHTML(points, colorVar = "#3b82f6") {
  const max = Math.max(...points);
  const min = Math.min(...points);

  const mapped = points
    .map((v, i) => {
      const x = (i / (points.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="analytics-chart">
      <polyline points="${mapped}" class="analytics-line" style="stroke:${colorVar}"></polyline>
    </svg>
  `;
}

/* ----------------------------------------------------------
   MAIN RENDER
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const creatives = window.SignalOneDemo?.BASE_CREATIVES || [];
  const stats = buildAnalytics(creatives);

  section.innerHTML = `
    <div class="analytics-view-root">

      <header class="analytics-header">
        <div>
          <div class="view-kicker">AdSensei • Analytics</div>
          <h2 class="view-headline">Analytics Übersicht</h2>
          <p class="view-subline">Alle KPIs auf einen Blick – mit Trends der letzten 14 Sessions.</p>

          <div class="analytics-meta-row">
            <span class="view-meta-pill">ROAS: ${stats.avg.roas}</span>
            <span class="view-meta-pill">CPM: ${stats.avg.cpm}</span>
            <span class="view-meta-pill">CTR: ${stats.avg.ctr}</span>
            <span class="view-meta-pill">Purchases: ${stats.avg.purchases}</span>
          </div>
        </div>
      </header>

      <section class="analytics-grid">
        
        <article class="analytics-card">
          <div class="analytics-card-title">Spend Trend</div>
          <div class="analytics-card-body">
            ${trendChartHTML(stats.spendTrend)}
          </div>
        </article>

        <article class="analytics-card">
          <div class="analytics-card-title">ROAS Trend</div>
          <div class="analytics-card-body">
            ${trendChartHTML(stats.roasTrend, "#16a34a")}
          </div>
        </article>

        <article class="analytics-kpi-card">
          <div class="analytics-kpi">
            <label>Spend</label>
            <span>${stats.avg.spend}</span>
          </div>
          <div class="analytics-kpi">
            <label>ROAS</label>
            <span>${stats.avg.roas}</span>
          </div>
          <div class="analytics-kpi">
            <label>CTR</label>
            <span>${stats.avg.ctr}</span>
          </div>
          <div class="analytics-kpi">
            <label>CPM</label>
            <span>${stats.avg.cpm}</span>
          </div>
        </article>

      </section>

    </div>
  `;
}
