/* ----------------------------------------------------------
   Creative Library – SignalOne
   Final UI Version (Part A)
-----------------------------------------------------------*/

/* DEMO DATA ACCESS HELPERS */
function getDemoData() {
  return window.SignalOneDemo?.DemoData || null;
}

function getActiveBrandFromState(appState) {
  const demo = getDemoData();
  if (!demo || !demo.brands || !demo.brands.length) return null;

  const id = appState.selectedBrandId || demo.brands[0].id;
  return demo.brands.find((b) => b.id === id) || demo.brands[0];
}

/* FORMATTING HELPERS */
function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value, fractionDigits = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + suffix
  );
}

function formatPercent(value, fractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + " %"
  );
}

/* BUCKET LOGIC */
function getBucketLabel(bucket) {
  if (bucket === "winner") return "Winner";
  if (bucket === "testing") return "Testing";
  if (bucket === "loser") return "Loser";
  return bucket;
}

function getBucketTone(bucket) {
  if (bucket === "winner") return "good";
  if (bucket === "testing") return "warning";
  if (bucket === "loser") return "critical";
  return "neutral";
}

/* ----------------------------------------------------------
   BASE CREATIVE BLUEPRINTS
   (Unverändert – du hast sie bereits, daher gekürzt)
-----------------------------------------------------------*/

const BASE_CREATIVES = window.SignalOneDemo?.BASE_CREATIVES || [];

/* BRAND-AJUSTED CREATIVE DATA */
function buildCreativesForBrand(brand) {
  if (!brand) return BASE_CREATIVES.map((c) => ({ ...c }));

  const baseRoas = 4.8;
  const baseSpend30d = 47892;

  const roasFactor = brand.roas30d / baseRoas;
  const spendFactor = brand.spend30d / baseSpend30d;

  return BASE_CREATIVES.map((c, idx) => {
    const scaledRoas = c.metrics.roas * roasFactor;
    const scaledSpend = Math.round((c.metrics.spend * spendFactor) / 50) * 50;

    return {
      ...c,
      id: brand.id + "__" + c.id,
      brandId: brand.id,
      metrics: {
        ...c.metrics,
        roas: Number(scaledRoas.toFixed(1)),
        spend: scaledSpend,
      },
    };
  });
}

/* TAG COUNTS */
function buildTagSummary(creatives) {
  const summary = {
    total: creatives.length,
    winners: 0,
    testing: 0,
    losers: 0,
    ugc: 0,
    static: 0,
  };

  for (const c of creatives) {
    if (c.bucket === "winner") summary.winners++;
    if (c.bucket === "testing") summary.testing++;
    if (c.bucket === "loser") summary.losers++;
    if (c.type.includes("ugc")) summary.ugc++;
    if (c.type.includes("static")) summary.static++;
  }

  return summary;
}
/* ----------------------------------------------------------
   MAIN RENDER FUNCTION
-----------------------------------------------------------*/

export function render(section, appState, opts = {}) {
  const isDemoFn =
    typeof opts.useDemoMode === "function" ? opts.useDemoMode : () => true;
  const demoModeActive = !!isDemoFn();
  const isConnected = !!appState.metaConnected;

  const brand = getActiveBrandFromState(appState);
  const creatives = buildCreativesForBrand(brand);
  const tags = buildTagSummary(creatives);

  if (!section) return;

  const modeLabel =
    demoModeActive && !isConnected
      ? "Demo-Daten • Letzte 30 Tage"
      : demoModeActive && isConnected
      ? "Live + Demo Overlay (Beta)"
      : "Live-Daten";

  section.innerHTML = `
    <div class="creative-view-root">

      <header class="creative-library-header">
        <div>
          <div class="view-kicker">AdSensei • Creative Cockpit</div>
          <h2 class="view-headline">
            ${brand?.name || "Dein Brand"} – Creative Library
          </h2>
          <p class="view-subline">
            Winner, Testing & Loser – sauber sortiert, bereit für Aktionen.
          </p>
          <div class="view-meta-row">
            <span class="view-meta-pill">
              <span class="dot dot-live"></span>${modeLabel}
            </span>
            <span class="view-meta-pill subtle">
              ${tags.total} Creatives • ${tags.winners} Winner • ${tags.testing} Testing • ${tags.losers} Loser
            </span>
          </div>
        </div>

        <div class="creative-view-kpis">
          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Top ROAS</span>
            <span class="creative-mini-kpi-value">
              ${formatNumber(Math.max(...creatives.map((c) => c.metrics.roas)), 1, "x")}
            </span>
          </div>

          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Spend Grid</span>
            <span class="creative-mini-kpi-value">
              ${formatCurrency(creatives.reduce((s,c)=>s+(c.metrics.spend||0),0))}
            </span>
          </div>
        </div>
      </header>

      <section class="creative-filter-bar">
        <div class="creative-filter-chips" data-role="bucket-chips">
          <button class="chip active" data-bucket="all">Alle</button>
          <button class="chip" data-bucket="winner">Winner</button>
          <button class="chip" data-bucket="testing">Testing</button>
          <button class="chip" data-bucket="loser">Loser</button>
        </div>

        <div class="creative-filter-inputs">
          <input type="search" class="meta-input" placeholder="Suche..." data-role="search" />
          <select class="meta-input" data-role="sort">
            <option value="score_desc">Score (hoch)</option>
            <option value="roas_desc">ROAS (hoch)</option>
            <option value="spend_desc">Spend (hoch)</option>
            <option value="ctr_desc">CTR (hoch)</option>
            <option value="days_desc">Laufzeit (neu)</option>
          </select>
        </div>
      </section>

      <section class="creative-tags-row">
        <div class="creative-tags" data-role="tags">
          <button class="tag-pill active" data-tag="all">#Alle (${tags.total})</button>
          <button class="tag-pill" data-tag="Winner">#Winner (${tags.winners})</button>
          <button class="tag-pill" data-tag="Testing">#Testing (${tags.testing})</button>
          <button class="tag-pill" data-tag="Loser">#Loser (${tags.losers})</button>
          <button class="tag-pill" data-tag="UGC">#UGC (${tags.ugc})</button>
          <button class="tag-pill" data-tag="Static">#Static (${tags.static})</button>
        </div>
      </section>

      <section class="creative-grid" data-role="grid"></section>
    </div>
  `;

  /* ----------------------------------------------------------
       GRID + FILTERING LOGIC
  -----------------------------------------------------------*/

  const gridEl = section.querySelector('[data-role="grid"]');
  const searchInput = section.querySelector('[data-role="search"]');
  const sortSelect = section.querySelector('[data-role="sort"]');
  const tagContainer = section.querySelector('[data-role="tags"]');
  const bucketChips = section.querySelector('[data-role="bucket-chips"]');

  const state = {
    allCreatives: creatives,
    search: "",
    tag: "all",
    bucket: "all",
    sort: "score_desc",
  };

  function smoothSet(html) {
    gridEl.style.opacity = 0;
    setTimeout(() => {
      gridEl.innerHTML = html;
      gridEl.style.opacity = 1;
    }, 150);
  }

  function renderGrid() {
    let list = state.allCreatives.slice();

    if (state.bucket !== "all") {
      list = list.filter((c) => c.bucket === state.bucket);
    }

    if (state.tag !== "all") {
      const tl = state.tag.toLowerCase();
      list = list.filter((c) => c.tags.map(t => t.toLowerCase()).includes(tl));
    }

    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter((c) =>
        [c.name, c.title, c.creator, c.hook]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    const sortKey = {
      score_desc: (c) => c.score,
      roas_desc: (c) => c.metrics.roas,
      spend_desc: (c) => c.metrics.spend,
      ctr_desc: (c) => c.metrics.ctr,
      days_desc: (c) => c.daysActive,
    }[state.sort];

    list.sort((a, b) => sortKey(b) - sortKey(a));

    const html = list
      .map((c, i) => creativeCardHtml(c, i + 1))
      .join("");

    smoothSet(html);
  }
/* ----------------------------------------------------------
   CARD HTML
-----------------------------------------------------------*/

function creativeCardHtml(c, rank) {
  return `
    <article class="creative-library-item" data-creative-id="${c.id}">
      <div class="creative-thumb"></div>

      <div class="creative-info">
        <div class="creative-title">${c.name}</div>

        <div class="creative-kpi">
          #${rank} • ${c.creator} • ${c.hook}
        </div>

        <div class="creative-kpi">
          ROAS ${formatNumber(c.metrics.roas, 1, "x")} •
          ${formatCurrency(c.metrics.spend)} •
          CTR ${formatPercent(c.metrics.ctr * 100, 1)}
        </div>

        <div class="creative-kpi">
          ${c.metrics.purchases} Purchases • ${c.daysActive} Tage live
        </div>
      </div>

      <div class="creative-actions">
        <button data-action="details" data-creative-id="${c.id}">Details</button>
        <button data-action="variants" data-creative-id="${c.id}">Varianten</button>
        <button data-action="testslot" data-creative-id="${c.id}">Test-Slot</button>
      </div>
    </article>
  `;
}

/* ----------------------------------------------------------
   EVENTS
-----------------------------------------------------------*/

  renderGrid();

  searchInput.addEventListener("input", (e) => {
    state.search = e.target.value;
    renderGrid();
  });

  sortSelect.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  tagContainer.addEventListener("click", (e) => {
    const pill = e.target.closest(".tag-pill");
    if (!pill) return;
    state.tag = pill.dataset.tag;
    [...tagContainer.querySelectorAll(".tag-pill")].forEach(el =>
      el.classList.toggle("active", el === pill)
    );
    renderGrid();
  });

  bucketChips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.bucket = chip.dataset.bucket;
    [...bucketChips.querySelectorAll(".chip")].forEach(el =>
      el.classList.toggle("active", el === chip)
    );
    renderGrid();
  });

  gridEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const id = btn.dataset.creativeId;
    const c = creatives.find((x) => x.id === id);
    openCreativeModal(c, btn.dataset.action);
  });
}

/* ----------------------------------------------------------
   MODAL
-----------------------------------------------------------*/

function openCreativeModal(creative, action) {
  const m = window.SignalOne?.openSystemModal;
  if (!m) return alert("Modal: " + creative.name);

  m(
    creative.name,
    `
      <div class="creative-modal">
        <h3>${creative.title}</h3>
        <p>${creative.hook} • ${creative.creator}</p>

        <div class="creative-modal-kpis">
          ROAS: ${formatNumber(creative.metrics.roas, 1, "x")}<br>
          Spend: ${formatCurrency(creative.metrics.spend)}<br>
          CTR: ${formatPercent(creative.metrics.ctr * 100, 1)}<br>
          CPM: ${formatCurrency(creative.metrics.cpm)}
        </div>

        <p>Ansicht: <strong>${action}</strong></p>
      </div>
    `
  );
}
