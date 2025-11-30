/* ----------------------------------------------------------
   REPORTS – render.js
   Premium VisionOS Reports Table + Trend
-----------------------------------------------------------*/

import { buildDailyReport, computeReportSummary } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Trendline (Spend)
-----------------------------------------------------------*/
function spendTrendHTML(rows) {
  const points = rows.map((r) => r.spend);
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
    <svg class="reports-chart" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline points="${mapped}" class="reports-line"></polyline>
    </svg>
  `;
}

/* ----------------------------------------------------------
   MAIN RENDER
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const creatives = window.SignalOneDemo?.BASE_CREATIVES || [];
  const rows = buildDailyReport(creatives);
  const summary = computeReportSummary(rows);

  section.innerHTML = `
    <div class="reports-view-root">

      <header class="reports-header">
        <div>
          <div class="view-kicker">AdSensei • Reports</div>
          <h2 class="view-headline">Reports – Letzte 14 Tage</h2>
          <p class="view-subline">Daten, Trends & Tages-Performance.</p>

          <div class="reports-meta-row">
            <span class="view-meta-pill">Spend: ${summary.spend}</span>
            <span class="view-meta-pill">ROAS: ${summary.roas}</span>
            <span class="view-meta-pill subtle">CTR: ${summary.ctr}</span>
            <span class="view-meta-pill">CPM: ${summary.cpm}</span>
            <span class="view-meta-pill subtle">Purchases: ${summary.purchases}</span>
          </div>
        </div>
      </header>

      <article class="reports-card">
        <div class="reports-card-title">Spend Trend</div>
        <div class="reports-card-body">${spendTrendHTML(rows)}</div>
      </article>

      <section class="reports-table-wrapper">
        <table class="reports-table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Spend</th>
              <th>ROAS</th>
              <th>CTR</th>
              <th>CPM</th>
              <th>Purchases</th>
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr>
                <td>${r.date}</td>
                <td>${formatCurrency(r.spend)}</td>
                <td>${formatNumber(r.roas, 1, "x")}</td>
                <td>${formatPercent(r.ctr * 100, 1)}</td>
                <td>${formatCurrency(r.cpm)}</td>
                <td>${r.purchases}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </section>
    </div>
  `;
}
