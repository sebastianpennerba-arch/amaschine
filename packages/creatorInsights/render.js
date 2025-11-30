/* ----------------------------------------------------------
   CREATOR INSIGHTS – render.js
   Premium VisionOS UI
-----------------------------------------------------------*/

import { buildCreatorInsights, computeCreatorSummary } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Creator Card
-----------------------------------------------------------*/
function creatorCardHTML(c) {
  return `
    <article class="creator-card">
      <header class="creator-header">
        <div class="creator-name">${c.creator}</div>
        <div class="creator-count">${c.count} Creatives</div>
      </header>

      <div class="creator-kpis">
        <div><label>Spend</label>${formatCurrency(c.spend)}</div>
        <div><label>ROAS</label>${formatNumber(c.avgRoas, 1, "x")}</div>
        <div><label>CTR</label>${formatPercent(c.avgCtr * 100, 1)}</div>
      </div>

      <footer class="creator-actions">
        <button data-action="brief" data-id="${c.creator}">Briefings</button>
        <button data-action="top" data-id="${c.creator}">Top Creatives</button>
      </footer>
    </article>
  `;
}

/* ----------------------------------------------------------
   MAIN RENDER
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const creatives = window.SignalOneDemo?.BASE_CREATIVES || [];
  const list = buildCreatorInsights(creatives);
  const summary = computeCreatorSummary(list);

  section.innerHTML = `
    <div class="creator-view-root">

      <header class="creator-header-main">
        <div>
          <div class="view-kicker">AdSensei • Creator Intelligence</div>
          <h2 class="view-headline">Creator Insights</h2>
          <p class="view-subline">
            Sichtbarkeit, Performance & kreative Stärken deiner Creator.
          </p>

          <div class="creator-meta-row">
            <span class="view-meta-pill">Creators: ${summary.creators}</span>
            <span class="view-meta-pill">Spend: ${summary.spend}</span>
            <span class="view-meta-pill">Avg ROAS: ${summary.avgRoas}</span>
            <span class="view-meta-pill subtle">CTR: ${summary.avgCtr}</span>
          </div>
        </div>
      </header>

      <section class="creator-grid" data-role="grid"></section>

    </div>
  `;

  const grid = section.querySelector("[data-role='grid']");
  grid.innerHTML = list.map(creatorCardHTML).join("");

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    window.SignalOne.showToast(
      `Creator Action: ${btn.dataset.action} (${btn.dataset.id})`,
      "success"
    );
  });
}
