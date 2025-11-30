/* ----------------------------------------------------------
   TESTING LOG – render.js
   Premium VisionOS Version
-----------------------------------------------------------*/

import { buildTestingLog, computeTestingSummary } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Trendline Component
-----------------------------------------------------------*/
function trendLineHTML(points) {
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
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="mini-chart">
      <polyline points="${mapped}" class="mini-chart-line"></polyline>
    </svg>
  `;
}

/* ----------------------------------------------------------
   Testing Card
-----------------------------------------------------------*/
function testingCardHTML(t) {
  const tone =
    t.state === "HOT"
      ? "good"
      : t.state === "COLD"
      ? "critical"
      : "warning";

  return `
    <article class="testing-card" data-id="${t.id}">
      <header class="testing-card-header">
        <div class="testing-title">${t.name}</div>
        <div class="testing-badge ${tone}">${t.state}</div>
      </header>

      <div class="testing-meta">
        <span>${t.creator}</span> • 
        <span>${t.hook}</span> • 
        <span>${t.daysActive} Tage</span>
      </div>

      <div class="testing-chart">${trendLineHTML(t.trend)}</div>

      <div class="testing-kpis">
        <div><label>ROAS</label>${formatNumber(t.metrics.roas, 1, "x")}</div>
        <div><label>Spend</label>${formatCurrency(t.metrics.spend)}</div>
        <div><label>CTR</label>${formatPercent(t.metrics.ctr * 100, 1)}</div>
        <div><label>CPM</label>${formatCurrency(t.metrics.cpm)}</div>
      </div>

      <footer class="testing-actions">
        <button data-action="promote" data-id="${t.id}">Promoten</button>
        <button data-action="briefing" data-id="${t.id}">Briefing</button>
        <button data-action="assign" data-id="${t.id}">Creative Slot</button>
      </footer>
    </article>
  `;
}

/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const brand = appState.selectedBrandId;
  const Demo = window.SignalOneDemo?.BASE_CREATIVES || [];

  const list = buildTestingLog(Demo);
  const summary = computeTestingSummary(list);

  section.innerHTML = `
    <div class="testing-view-root">

      <header class="testing-header">
        <div>
          <div class="view-kicker">AdSensei • Testing Log</div>
          <h2 class="view-headline">Testing – ${brand}</h2>
          <p class="view-subline">
            Hook Battles, Variants & Iterationen – automatisch bewertet.
          </p>

          <div class="testing-meta-row">
            <span class="view-meta-pill">Tests: ${summary.total}</span>
            <span class="view-meta-pill">Hot: ${summary.hot}</span>
            <span class="view-meta-pill">Cold: ${summary.cold}</span>
            <span class="view-meta-pill subtle">
              ROAS ${summary.avgRoas} • CPM ${summary.avgCpm} • CTR ${summary.avgCtr}
            </span>
          </div>
        </div>
      </header>

      <section class="testing-grid" data-role="grid">
      </section>

    </div>
  `;

  const grid = section.querySelector("[data-role='grid']");
  grid.innerHTML = list.map(testingCardHTML).join("");

  // Actions
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;

    window.SignalOne.showToast(`Aktion: ${action} für ${id}`, "success");
  });
}
