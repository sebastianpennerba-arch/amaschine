/* ----------------------------------------------------------
   CAMPAIGNS – render.js
   Premium UI Version (VisionOS Titanium)
-----------------------------------------------------------*/

import { buildCampaignsForBrand, computeCampaignSummary } from "./compute.js";
import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   COMPONENT: Kampagnen-Karte
-----------------------------------------------------------*/
function campaignCardHTML(c) {
  const statusIcon =
    c.status === "ACTIVE"
      ? "🟢"
      : c.status === "PAUSED"
      ? "⏸"
      : "🧪";

  const tone = c.health.label; // good | warning | critical

  return `
    <article class="campaign-card" data-id="${c.id}">
      <header class="campaign-card-header">
        <div class="campaign-card-title">
          ${statusIcon} ${c.name}
        </div>
        <div class="campaign-health-badge ${tone}">
          ${c.health.score} / 100
        </div>
      </header>

      <div class="campaign-card-kpis">
        <div class="campaign-kpi">
          <label>Spend</label>
          <span>${formatCurrency(c.metrics.spend)}</span>
        </div>
        <div class="campaign-kpi">
          <label>ROAS</label>
          <span>${formatNumber(c.metrics.roas, 1, "x")}</span>
        </div>
        <div class="campaign-kpi">
          <label>CTR</label>
          <span>${formatPercent(c.metrics.ctr * 100, 1)}</span>
        </div>
        <div class="campaign-kpi">
          <label>CPM</label>
          <span>${formatCurrency(c.metrics.cpm)}</span>
        </div>
        <div class="campaign-kpi">
          <label>Purchases</label>
          <span>${c.metrics.purchases}</span>
        </div>
      </div>

      <footer class="campaign-card-actions">
        <button data-action="details" data-id="${c.id}">Details</button>
        <button data-action="sensei" data-id="${c.id}">Sensei</button>
        <button data-action="logs" data-id="${c.id}">Testing Log</button>
      </footer>
    </article>
  `;
}

/* ----------------------------------------------------------
   COMPONENT: Grid
-----------------------------------------------------------*/
function renderGrid(container, list) {
  container.innerHTML = list.map(campaignCardHTML).join("");
}

/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const brandId = appState.selectedBrandId;
  const DemoData = window.SignalOneDemo?.DemoData;

  const campaigns = buildCampaignsForBrand(brandId, DemoData);
  const summary = computeCampaignSummary(campaigns);

  section.innerHTML = `
    <div class="campaign-view-root">

      <!-- Header -->
      <header class="campaign-header">
        <div>
          <div class="view-kicker">AdSensei • Campaign Engine</div>
          <h2 class="view-headline">Kampagnen – ${brandId}</h2>
          <p class="view-subline">
            Performance, Status & Optimierung – intelligent sortiert.
          </p>
          <div class="campaign-meta-row">
            <span class="view-meta-pill">Spend ${summary.spendTotal}</span>
            <span class="view-meta-pill">ROAS ${summary.avgROAS}</span>
            <span class="view-meta-pill">CTR ${summary.avgCTR}</span>
            <span class="view-meta-pill subtle">
              ${summary.activeCount} Active •
              ${summary.testingCount} Testing •
              ${summary.pausedCount} Paused
            </span>
          </div>
        </div>
      </header>

      <!-- Filterbar -->
      <section class="campaign-filter-bar">
        <div class="campaign-filter-group">
          <button class="chip active" data-filter="all">Alle</button>
          <button class="chip" data-filter="ACTIVE">Active</button>
          <button class="chip" data-filter="TESTING">Testing</button>
          <button class="chip" data-filter="PAUSED">Paused</button>
        </div>

        <div class="campaign-search-group">
          <input type="search" placeholder="Suche..." class="meta-input" data-role="search"/>
        </div>
      </section>

      <!-- GRID -->
      <section class="campaign-grid" data-role="grid"></section>

    </div>
  `;

  /* ---------------------------------------
     LOGIC
  --------------------------------------- */
  const gridEl = section.querySelector('[data-role="grid"]');
  const searchEl = section.querySelector('[data-role="search"]');
  const filterBtns = section.querySelectorAll("[data-filter]");

  let state = {
    filter: "all",
    search: "",
  };

  function update() {
    let list = campaigns.slice();

    if (state.filter !== "all") {
      list = list.filter((c) => c.status === state.filter);
    }

    if (state.search) {
      list = list.filter((c) =>
        c.name.toLowerCase().includes(state.search.toLowerCase())
      );
    }

    renderGrid(gridEl, list);
  }

  /* FILTER EVENTS */
  filterBtns.forEach((b) =>
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter;
      update();
    })
  );

  /* SEARCH EVENT */
  searchEl.addEventListener("input", () => {
    state.search = searchEl.value;
    update();
  });

  /* INITIAL PAINT */
  update();
}
