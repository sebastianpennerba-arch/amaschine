/* ----------------------------------------------------------
   SENSEI – render.js
   Premium VisionOS UI
-----------------------------------------------------------*/

import { generateSenseiInsights, computeSenseiSummary } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Empfehlungen-Karte
-----------------------------------------------------------*/
function senseiCardHTML(item) {
  const tone =
    item.label === "GOOD"
      ? "good"
      : item.label === "WARNING"
      ? "warning"
      : "critical";

  return `
    <article class="sensei-card">
      <header class="sensei-card-header">
        <div class="sensei-title">${item.name}</div>
        <div class="sensei-badge ${tone}">${item.score}/100</div>
      </header>

      <div class="sensei-meta">
        <span>${item.creator}</span> •
        <span>${item.hook}</span>
      </div>

      <div class="sensei-kpis">
        <div><label>ROAS</label> ${formatNumber(item.metrics.roas, 1, "x")}</div>
        <div><label>Spend</label> ${formatCurrency(item.metrics.spend)}</div>
        <div><label>CTR</label> ${formatPercent(item.metrics.ctr * 100, 1)}</div>
        <div><label>CPM</label> ${formatCurrency(item.metrics.cpm)}</div>
      </div>

      <p class="sensei-reco">${item.recommendation}</p>

      <footer class="sensei-actions">
        <button data-action="scale" data-id="${item.id}">Skalieren</button>
        <button data-action="variants" data-id="${item.id}">Varianten</button>
        <button data-action="log" data-id="${item.id}">Testing-Log</button>
      </footer>
    </article>
  `;
}

/* ----------------------------------------------------------
   MAIN RENDER
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const creatives = window.SignalOneDemo?.BASE_CREATIVES || [];
  const insights = generateSenseiInsights(creatives);
  const summary = computeSenseiSummary(insights);

  section.innerHTML = `
    <div class="sensei-view-root">

      <header class="sensei-header">
        <div>
          <div class="view-kicker">AdSensei • AI Suite</div>
          <h2 class="view-headline">Sensei – AI Recommendations</h2>
          <p class="view-subline">
            Strategische Vorschläge basierend auf Creatives, Hooks & KPIs.
          </p>

          <div class="sensei-meta-row">
            <span class="view-meta-pill">Avg Score: ${summary.avgScore}</span>
            <span class="view-meta-pill">Good: ${summary.good}</span>
            <span class="view-meta-pill">Warning: ${summary.warning}</span>
            <span class="view-meta-pill">Critical: ${summary.critical}</span>
          </div>
        </div>
      </header>

      <section class="sensei-grid" data-role="grid"></section>

    </div>
  `;

  const grid = section.querySelector("[data-role='grid']");
  grid.innerHTML = insights.map(senseiCardHTML).join("");

  // ACTIONS
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const id = btn.dataset.id;
    const action = btn.dataset.action;
    window.SignalOne.showToast(`Sensei: ${action} → ${id}`, "success");
  });
}
