/* ----------------------------------------------------------
   CAMPAIGNS – render.js
   Premium VisionOS + Empty State + Detail Modal + Sensei Linking
-----------------------------------------------------------*/

import { buildCampaignsForBrand, computeCampaignSummary } from "./compute.js";
import { formatCurrency, formatPercent, formatNumber } from "../utils/format.js";

/* ----------------------------------------------------------
   EMPTY STATE
-----------------------------------------------------------*/
function emptyStateHTML() {
  return `
    <div class="empty-state">
      <div class="empty-state-glass">
        <div class="empty-state-icon">📉</div>
        <h3>Keine Kampagnen gefunden</h3>
        <p>Wähle eine Brand aus oder verbinde Meta Ads, um Kampagnen zu laden.</p>
      </div>
    </div>
  `;
}

/* ----------------------------------------------------------
   DETAIL MODAL
-----------------------------------------------------------*/
function openCampaignDetailModal(c) {
  window.SignalOne.openSystemModal(
    `Kampagne: ${c.name}`,
    `
      <div class="modal-kpi-grid">
        <div><label>Spend</label><span>${formatCurrency(c.metrics.spend)}</span></div>
        <div><label>ROAS</label><span>${formatNumber(c.metrics.roas, 1, "x")}</span></div>
        <div><label>CTR</label><span>${formatPercent(c.metrics.ctr * 100, 1)}</span></div>
        <div><label>CPM</label><span>${formatCurrency(c.metrics.cpm)}</span></div>
        <div><label>Purchases</label><span>${c.metrics.purchases}</span></div>
      </div>

      <div class="modal-divider"></div>

      <p><strong>Health Score:</strong> ${c.health.score} / 100 (${c.health.label})</p>
      <p><strong>Datenquelle:</strong> ${
        c._source === "live" ? "Meta Live" : "Demo"
      }</p>

      <div class="modal-chart-placeholder">
        <div class="bar"></div>
        <div class="bar short"></div>
        <div class="bar mid"></div>
      </div>
    `
  );
}

/* ----------------------------------------------------------
   CARD COMPONENT
-----------------------------------------------------------*/
function cardHTML(c) {
  const statusIcon =
    c.status === "ACTIVE"
      ? "🟢"
      : c.status === "PAUSED"
      ? "⏸"
      : "🧪";

  return `
    <article class="campaign-card" data-id="${c.id}">
      <header>
        <div class="campaign-card-title">${statusIcon} ${c.name}</div>
        <div class="campaign-health-badge ${c.health.label}">
          ${c.health.score}
        </div>
      </header>

      <div class="campaign-kpi-row">
        <div><label>Spend</label><span>${formatCurrency(
          c.metrics.spend
        )}</span></div>
        <div><label>ROAS</label><span>${formatNumber(
          c.metrics.roas,
          1,
          "x"
        )}</span></div>
        <div><label>CTR</label><span>${formatPercent(
          c.metrics.ctr * 100,
          1
        )}</span></div>
        <div><label>CPM</label><span>${formatCurrency(
          c.metrics.cpm
        )}</span></div>
      </div>

      <footer class="campaign-card-actions">
        <button data-action="details" data-id="${c.id}">Details</button>
        <button data-action="sensei" data-id="${c.id}">Sensei</button>
      </footer>
    </article>
  `;
}

/* ----------------------------------------------------------
   RENDER-GRID
-----------------------------------------------------------*/
function renderGrid(container, list) {
  if (!list.length) {
    container.innerHTML = emptyStateHTML();
    return;
  }
  container.innerHTML = list.map(cardHTML).join("");
}

/* ----------------------------------------------------------
   MAIN RENDER
-----------------------------------------------------------*/
export function render(section, appState, opts = {}) {
  const useDemoMode = opts.useDemoMode;
  const brandId = appState.selectedBrandId;

  const { campaigns, source } = buildCampaignsForBrand(brandId, appState, {
    useDemoMode,
  });
  const summary = computeCampaignSummary(campaigns);

  const sourceLabel =
    source === "live" ? "Meta Live" : useDemoMode ? "Demo Modus" : "Demo";

  section.innerHTML = `
    <div class="campaign-view-root">

      <header class="campaign-header">
        <div class="view-kicker">AdSensei • Campaign Engine</div>
        <h2 class="view-headline">Kampagnen – ${brandId || "–"}</h2>
        <p class="view-subline">Performance & Insights – Demo/Live Hybrid.</p>

        <div class="campaign-meta-row">
          <span class="view-meta-pill">Spend ${summary.spendTotal}</span>
          <span class="view-meta-pill">ROAS ${summary.avgROAS}</span>
          <span class="view-meta-pill">CTR ${summary.avgCTR}</span>
          <span class="view-meta-pill subtle">
            ${summary.activeCount} Active •
            ${summary.testingCount} Testing •
            ${summary.pausedCount} Paused
          </span>
          <span class="view-meta-pill subtle">Quelle: ${sourceLabel}</span>
        </div>
      </header>

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

      <section class="campaign-grid" data-role="grid"></section>

    </div>
  `;

  const gridEl = section.querySelector('[data-role="grid"]');
  const searchEl = section.querySelector('[data-role="search"]');
  const filterBtns = section.querySelectorAll("[data-filter]");

  let state = { filter: "all", search: "" };

  function update() {
    let list = [...campaigns];

    if (state.filter !== "all") list = list.filter((c) => c.status === state.filter);
    if (state.search)
      list = list.filter((c) =>
        c.name.toLowerCase().includes(state.search.toLowerCase())
      );

    renderGrid(gridEl, list);

    /* ACTION BUTTON LOGIC */
    gridEl.querySelectorAll("button[data-action]").forEach((btn) => {
      const id = btn.dataset.id;
      const camp = campaigns.find((c) => c.id === id);

      btn.addEventListener("click", () => {
        if (btn.dataset.action === "details") {
          openCampaignDetailModal(camp);
        }
        if (btn.dataset.action === "sensei") {
          appState.selectedCampaignId = id;
          window.SignalOne.navigateTo("sensei");
        }
      });
    });
  }

  filterBtns.forEach((b) =>
    b.addEventListener("click", () => {
      filterBtns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      state.filter = b.dataset.filter;
      update();
    })
  );

  searchEl.addEventListener("input", () => {
    state.search = searchEl.value;
    update();
  });

  update();
}
