/* ----------------------------------------------------------
   Creative Library – SignalOne (Strict Live Mode, P2)
   Option A: Demo ODER Live – kein Overlay
   Datenquelle:
     - Demo: window.SignalOneDemo.BASE_CREATIVES
     - Live:  SignalOne.DataLayer.fetchCreativesForAccount(...)
-----------------------------------------------------------*/

/* ==========================================================
   1) HELPERS & DEMO-DATA
========================================================== */

const BASE_CREATIVES = window.SignalOneDemo?.BASE_CREATIVES || [];

/**
 * Ermittelt den aktiven Brand aus dem globalen AppState.
 * Fällt auf das erste Demo-Brand zurück, falls nötig.
 */
function getActiveBrandFromState(appState) {
  const demo = window.SignalOneDemo;
  if (!demo || !demo.brands || !demo.brands.length) return null;

  if (appState?.selectedBrandId) {
    return (
      demo.brands.find((b) => b.id === appState.selectedBrandId) ||
      demo.brands[0]
    );
  }

  return demo.brands[0];
}

/* ---------- Format Helpers ---------- */

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

/* ---------- Buckets & Tags ---------- */

function getBucketTone(bucket) {
  if (bucket === "winner") return "good";
  if (bucket === "testing") return "warning";
  if (bucket === "loser") return "critical";
  return "neutral";
}

/* DEMO: Creatives auf Brand mappen */
function buildCreativesForBrandDemo(brand) {
  if (!brand || !BASE_CREATIVES.length) return [];

  return BASE_CREATIVES.map((c) => ({
    ...c,
    brandId: brand.id,
  }));
}

/* Tag- & Bucket-Summary */
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
    if (c.bucket === "winner") summary.winners += 1;
    if (c.bucket === "testing") summary.testing += 1;
    if (c.bucket === "loser") summary.losers += 1;

    if (Array.isArray(c.type)) {
      if (c.type.includes("ugc")) summary.ugc += 1;
      if (c.type.includes("static")) summary.static += 1;
    }
  }

  return summary;
}

/* Range-Label für Header */
function getRangeLabel(appState) {
  const range = appState?.settings?.defaultRange || "last_30_days";
  switch (range) {
    case "last_7_days":
      return "Letzte 7 Tage";
    case "last_90_days":
      return "Letzte 90 Tage";
    case "last_30_days":
    default:
      return "Letzte 30 Tage";
  }
}

/* ==========================================================
   2) LIVEMODE • DATALAYER-INTEGRATION (STRICT)
========================================================== */

function resolveDataLayer() {
  return (
    (window.SignalOne && window.SignalOne.DataLayer) ||
    window.SignalOneDataLayer ||
    window.DataLayer ||
    null
  );
}

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeDate(value) {
  const d = value ? new Date(value) : null;
  if (d && !Number.isNaN(d.getTime())) return d;
  return new Date();
}

/**
 * Heuristik zur Score-Berechnung (0–100) aus Performance-Daten.
 */
function computeScoreFromMetrics(metrics) {
  const roas = safeNumber(metrics.roas, 0);
  const ctr = safeNumber(metrics.ctr, 0);
  const spend = safeNumber(metrics.spend, 0);
  const purchases = safeNumber(metrics.purchases, 0);

  const roasScore = Math.min(roas / 5, 1) * 100; // 5x ROAS ~ 100
  const ctrScore = Math.min(ctr / 0.04, 1) * 100; // 4% CTR ~ 100
  const spendScore = Math.min(spend / 15000, 1) * 100; // 15k Spend ~ 100
  const purchaseScore = Math.min(purchases / 120, 1) * 100; // 120 Purchases ~ 100

  const score =
    0.45 * roasScore +
    0.25 * ctrScore +
    0.15 * spendScore +
    0.15 * purchaseScore;

  return Math.round(score);
}

/**
 * Bucket-Zuordnung auf Basis von ROAS & Score.
 */
function resolveBucketFromMetrics(metrics) {
  const roas = safeNumber(metrics.roas, 0);
  const score = safeNumber(metrics.score, computeScoreFromMetrics(metrics));

  if (score >= 80 && roas >= 4) return "winner";
  if (score <= 40 || roas < 1.5) return "loser";
  return "testing";
}

/**
 * Mappt ein beliebiges Live-Creative-Objekt aus dem DataLayer
 * auf das interne View-Modell der Creative Library.
 */
function mapLiveCreative(raw, brand) {
  const metricsSrc =
    raw.metrics || raw.insights || raw.performance || raw || {};

  const impressions = safeNumber(
    metricsSrc.impressions ?? metricsSrc.impr ?? metricsSrc.impressions_30d,
    0
  );
  const clicks = safeNumber(metricsSrc.clicks ?? metricsSrc.clicks_30d, 0);
  const spend = safeNumber(
    metricsSrc.spend ??
      metricsSrc.spend_eur ??
      metricsSrc.spend_value ??
      metricsSrc.spend_30d,
    0
  );
  const conversions = safeNumber(
    metricsSrc.purchases ??
      metricsSrc.conversions ??
      metricsSrc.purchase_events ??
      metricsSrc.purchases_30d,
    0
  );
  const revenue = safeNumber(
    metricsSrc.revenue ??
      metricsSrc.purchase_value ??
      metricsSrc.revenue_30d ??
      metricsSrc.value,
    0
  );

  let roas = metricsSrc.roas;
  if (roas == null || Number.isNaN(roas)) {
    roas = spend > 0 ? revenue / spend : 0;
  }
  roas = safeNumber(roas, 0);

  let ctr = metricsSrc.ctr;
  if (ctr == null || Number.isNaN(ctr)) {
    ctr = impressions > 0 ? clicks / impressions : 0;
  }
  ctr = safeNumber(ctr, 0);

  let cpm = metricsSrc.cpm;
  if (cpm == null || Number.isNaN(cpm)) {
    cpm = impressions > 0 ? (spend * 1000) / impressions : 0;
  }
  cpm = safeNumber(cpm, 0);

  const daysActive =
    safeNumber(raw.daysActive) ||
    Math.max(
      1,
      Math.round(
        (Date.now() -
          safeDate(
            raw.start_date ||
              raw.created_time ||
              raw.first_seen ||
              raw.date_start
          ).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    );

  const metrics = {
    roas,
    spend,
    ctr,
    cpm,
    purchases: conversions,
  };

  const score = computeScoreFromMetrics({
    ...metrics,
  });

  const bucket = resolveBucketFromMetrics({ ...metrics, score });

  const name =
    raw.name ||
    raw.ad_name ||
    raw.creative_name ||
    raw.title ||
    "Unbenanntes Creative";

  const hook =
    raw.hook ||
    raw.hook_type ||
    raw.angle ||
    raw.concept ||
    "Hook nicht klassifiziert";

  const creator =
    raw.creator ||
    raw.creator_name ||
    raw.page_name ||
    raw.profile_name ||
    brand?.name ||
    "Creator n/a";

  const campaignName =
    raw.campaign_name || raw.campaign || raw.adset_name || "Kampagne n/a";

  const typeHints = [];
  const typeSource =
    (raw.format || raw.creative_type || raw.placement || "").toLowerCase();
  const nameSource = (name + " " + hook).toLowerCase();

  if (typeSource.includes("video") || typeSource.includes("reel")) {
    typeHints.push("video");
  }
  if (typeSource.includes("image") || typeSource.includes("static")) {
    typeHints.push("static");
  }
  if (
    typeSource.includes("ugc") ||
    nameSource.includes("ugc") ||
    nameSource.includes("creator")
  ) {
    typeHints.push("ugc");
  }

  const type = Array.from(new Set(typeHints));
  const tags = [bucket, ...type];

  return {
    id:
      String(
        raw.id ||
          raw.creative_id ||
          raw.ad_id ||
          raw.adset_id ||
          `live_${Math.random().toString(36).slice(2)}`
      ),
    name,
    title: raw.headline || raw.primary_text || raw.title || "",
    creator,
    hook,
    type,
    bucket,
    tags,
    format: raw.format || raw.creative_type || "n/a",
    campaignName,
    daysActive,
    score,
    metrics,
  };
}

/**
 * Lädt Live-Creatives über den DataLayer.
 * STRICT MODE: kein Demo-Fallback, wenn Live aktiv ist.
 */
async function fetchLiveCreativesForBrand(appState, brand) {
  const result = {
    creatives: [],
    modeLabel: "",
    error: null,
  };

  const dataLayer = resolveDataLayer();
  const showToast = window.SignalOne?.showToast;

  // Meta-Token-Gate (Pflicht)
  if (!appState?.metaConnected || !appState?.meta?.token) {
    result.error = "NO_META";
    result.modeLabel = "Live-Daten (Meta nicht verbunden)";
    showToast?.(
      "Creative Library: Meta ist nicht verbunden – keine Live-Daten.",
      "warning"
    );
    return result;
  }

  if (!dataLayer || typeof dataLayer.fetchCreativesForAccount !== "function") {
    console.warn(
      "[CreativeLibrary] DataLayer oder fetchCreativesForAccount() fehlt."
    );
    result.error = "NO_DATALAYER";
    result.modeLabel = "Live-Daten (DataLayer fehlt)";
    showToast?.(
      "Creative Library: DataLayer noch nicht eingebunden – keine Live-Daten.",
      "warning"
    );
    return result;
  }

  const brandId = appState.selectedBrandId || null;
  const campaignId = appState.selectedCampaignId || null;

  try {
    const response = await dataLayer.fetchCreativesForAccount({
      brandId,
      campaignId,
      accessToken: appState.meta.token,
      range: appState.settings?.defaultRange || "last_30_days",
    });

    const rawList = Array.isArray(response?.creatives)
      ? response.creatives
      : Array.isArray(response)
      ? response
      : [];

    const mapped = rawList.map((raw) => mapLiveCreative(raw, brand));

    result.creatives = mapped;
    if (!mapped.length) {
      result.modeLabel = "Live-Daten (0 Creatives gefunden)";
    } else {
      result.modeLabel = `Live-Daten • ${mapped.length} Creatives`;
    }
  } catch (err) {
    console.error("[CreativeLibrary] Fehler beim Laden der Live-Creatives:", err);
    result.error = String(err);
    result.modeLabel = "Live-Daten (Fehler beim Laden)";
    showToast?.(
      "Creative Library: Fehler beim Laden der Live-Creatives.",
      "error"
    );
  }

  return result;
}

/* ==========================================================
   3) MAIN RENDER ENTRY (wird von app.js aufgerufen)
========================================================== */

export function render(section, appState, opts = {}) {
  if (!section) return;

  // In app.js wird das Ergebnis von useDemoMode() als Boolean übergeben.
  const demoModeActive = !!opts.useDemoMode;
  const brand = getActiveBrandFromState(appState);
  const rangeLabel = getRangeLabel(appState);

  (async () => {
    let creatives = [];
    let modeLabel = "";

    if (demoModeActive) {
      // STRICT OPTION A: Nur Demo-Daten, kein Live-Mix
      creatives = buildCreativesForBrandDemo(brand);
      modeLabel = `Demo-Daten • ${rangeLabel}`;
    } else {
      // STRICT OPTION A: Nur Live-Daten, kein Demo-Overlay
      const liveResult = await fetchLiveCreativesForBrand(appState, brand);
      creatives = liveResult.creatives;
      modeLabel =
        liveResult.modeLabel || `Live-Daten • ${rangeLabel}`;
    }

    const tags = buildTagSummary(creatives);

    const viewModel = {
      brand,
      creatives,
      tags,
      modeLabel,
    };

    renderCreativeLibraryView(section, viewModel);
  })();
}

/* ==========================================================
   4) VIEW-RENDERING & INTERAKTION
========================================================== */

function renderCreativeLibraryView(section, viewModel) {
  const { brand, creatives, tags, modeLabel } = viewModel;

  const topRoas = creatives.length
    ? Math.max(...creatives.map((c) => c.metrics?.roas || 0))
    : 0;

  const totalSpend = creatives.reduce(
    (sum, c) => sum + (c.metrics?.spend || 0),
    0
  );

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
              <span class="dot-live"></span>${modeLabel}
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
              ${formatNumber(topRoas, 1, "x")}
            </span>
          </div>

          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Spend Grid</span>
            <span class="creative-mini-kpi-value">
              ${formatCurrency(totalSpend)}
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
          <button class="tag-pill" data-tag="winner">#Winner (${tags.winners})</button>
          <button class="tag-pill" data-tag="testing">#Testing (${tags.testing})</button>
          <button class="tag-pill" data-tag="loser">#Loser (${tags.losers})</button>
          <button class="tag-pill" data-tag="ugc">#UGC (${tags.ugc})</button>
          <button class="tag-pill" data-tag="static">#Static (${tags.static})</button>
        </div>
      </section>

      <section class="creative-grid" data-role="grid"></section>
    </div>
  `;

  /* ---------- Grid & Filter-Logik ---------- */

  const gridEl = section.querySelector('[data-role="grid"]');
  const searchInput = section.querySelector('[data-role="search"]');
  const sortSelect = section.querySelector('[data-role="sort"]');
  const tagContainer = section.querySelector('[data-role="tags"]');
  const bucketChips = section.querySelector('[data-role="bucket-chips"]');

  const state = {
    allCreatives: creatives.slice(),
    search: "",
    tag: "all",
    bucket: "all",
    sort: "score_desc",
  };

  function smoothSet(html) {
    if (!gridEl) return;
    gridEl.style.opacity = 0;
    setTimeout(() => {
      gridEl.innerHTML = html;
      gridEl.style.opacity = 1;
    }, 120);
  }

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

  function renderGrid() {
    let list = state.allCreatives.slice();

    if (state.bucket !== "all") {
      list = list.filter((c) => c.bucket === state.bucket);
    }

    if (state.tag !== "all") {
      const tl = state.tag.toLowerCase();
      list = list.filter((c) =>
        (c.tags || []).map((t) => String(t).toLowerCase()).includes(tl)
      );
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

    const sortKeyMap = {
      score_desc: (c) => c.score,
      roas_desc: (c) => c.metrics.roas,
      spend_desc: (c) => c.metrics.spend,
      ctr_desc: (c) => c.metrics.ctr,
      days_desc: (c) => c.daysActive,
    };

    const sortKey = sortKeyMap[state.sort] || sortKeyMap.score_desc;

    list.sort((a, b) => sortKey(b) - sortKey(a));

    if (!list.length) {
      smoothSet(`
        <div class="creative-empty-state">
          <p><strong>Keine Creatives für diesen Kontext gefunden.</strong></p>
          <p class="creative-empty-hint">
            Prüfe Meta-Verbindung, Werbekonto / Kampagne oder den ausgewählten Zeitraum.
          </p>
        </div>
      `);
      return;
    }

    const html = list.map((c, i) => creativeCardHtml(c, i + 1)).join("");
    smoothSet(html);
  }

  renderGrid();

  /* ---------- Events ---------- */

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.search = e.target.value || "";
      renderGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value || "score_desc";
      renderGrid();
    });
  }

  if (tagContainer) {
    tagContainer.addEventListener("click", (e) => {
      const pill = e.target.closest(".tag-pill");
      if (!pill) return;
      state.tag = pill.dataset.tag || "all";
      [...tagContainer.querySelectorAll(".tag-pill")].forEach((el) =>
        el.classList.toggle("active", el === pill)
      );
      renderGrid();
    });
  }

  if (bucketChips) {
    bucketChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      state.bucket = chip.dataset.bucket || "all";
      [...bucketChips.querySelectorAll(".chip")].forEach((el) =>
        el.classList.toggle("active", el === chip)
      );
      renderGrid();
    });
  }

  if (gridEl) {
    gridEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const id = btn.dataset.creativeId;
      const creative = state.allCreatives.find((x) => x.id === id);
      if (!creative) return;
      openCreativeModal(creative, btn.dataset.action);
    });
  }
}

/* ==========================================================
   5) MINI-CHARTS & MODAL
========================================================== */

function renderMiniTrend(creative) {
  const values = [
    creative.metrics.roas * 0.92,
    creative.metrics.roas * 0.97,
    creative.metrics.roas,
    creative.metrics.roas * 1.06,
    creative.metrics.roas * 1.18,
  ];

  const max = Math.max(...values);
  const min = Math.min(...values);

  if (!Number.isFinite(max) || !Number.isFinite(min) || max === min) {
    return `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="mini-chart">
        <polyline points="0,50 100,50" class="mini-chart-line"></polyline>
      </svg>
    `;
  }

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 100;
      const y = 100 - ((v - min) / (max - min)) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return `
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="mini-chart">
      <polyline points="${points}" class="mini-chart-line"></polyline>
    </svg>
  `;
}

function renderPulse(creative) {
  const p = creative.metrics;

  const pulse = (p.roas / 8 + p.ctr * 25 + p.spend / 20000) / 3;
  const safe = Math.min(Math.max(pulse, 0.1), 1);

  return `
    <div class="pulse-wrapper">
      <div class="pulse-bar" style="transform: scaleX(${safe})"></div>
    </div>
  `;
}

function renderHookHeatmap(creative) {
  const metrics = creative.metrics;

  const items = [
    { name: "Hook Strength", value: creative.score / 100 },
    { name: "First Frame Impact", value: metrics.ctr * 2.4 },
    { name: "Story Clarity", value: metrics.roas / 8 },
    { name: "Visual Appeal", value: metrics.cpm < 10 ? 0.75 : 0.45 },
  ];

  return `
    <div class="hook-heatmap">
      ${items
        .map(
          (h) => `
        <div class="hook-row">
          <span>${h.name}</span>
          <div class="hook-bar">
            <div class="hook-fill" style="width:${Math.min(
              h.value * 100,
              100
            )}%"></div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

/**
 * Öffnet das System-Modal mit einem Creative-Deep-Dive.
 */
function openCreativeModal(creative, action) {
  const openModal = window.SignalOne?.openSystemModal;
  if (!openModal) {
    alert("Creative: " + (creative?.name || "Unbekannt"));
    return;
  }

  const viewLabel =
    action === "variants"
      ? "Varianten & Iterationen"
      : action === "testslot"
      ? "Testing Slot"
      : "Performance Details";

  openModal(
    creative.name,
    `
      <div class="creative-modal">

        <header class="creative-modal-header">
          <div>
            <div class="view-kicker">Creative Deep Dive</div>
            <h3 class="creative-modal-title">${creative.name}</h3>
            <p class="creative-modal-subtitle">${creative.title}</p>
          </div>

          <div class="creative-modal-badges">
            <span class="badge badge-soft">Ansicht: ${viewLabel}</span>
            <span class="badge badge-${getBucketTone(
              creative.bucket
            )}">${creative.bucket.toUpperCase()}</span>
            <span class="badge badge-soft">Score ${creative.score}/100</span>
          </div>
        </header>

        <section class="creative-modal-main">

          <!-- LEFT SIDE -->
          <div class="creative-modal-left">

            <div class="creative-modal-thumb">
              <div class="creative-modal-thumb-overlay">
                <span class="creative-modal-thumb-label">Thumbnail (Placeholder)</span>
              </div>
            </div>

            <!-- TRENDLINE -->
            ${renderMiniTrend(creative)}

            <!-- KPI BLOCKS -->
            <div class="creative-modal-kpis">
              <div>
                <span class="creative-kpi-label">ROAS</span>
                <span class="creative-kpi-value">${formatNumber(
                  creative.metrics.roas,
                  1,
                  "x"
                )}</span>
              </div>

              <div>
                <span class="creative-kpi-label">Spend</span>
                <span class="creative-kpi-value">${formatCurrency(
                  creative.metrics.spend
                )}</span>
              </div>

              <div>
                <span class="creative-kpi-label">CTR</span>
                <span class="creative-kpi-value">${formatPercent(
                  creative.metrics.ctr * 100,
                  1
                )}</span>
              </div>

              <div>
                <span class="creative-kpi-label">CPM</span>
                <span class="creative-kpi-value">${formatCurrency(
                  creative.metrics.cpm
                )}</span>
              </div>
            </div>

            <!-- PERFORMANCE PULSE -->
            <h4 style="margin-top:6px;font-size:0.82rem;">Performance Pulse</h4>
            ${renderPulse(creative)}

          </div>

          <!-- RIGHT SIDE -->
          <div class="creative-modal-right">

            <section class="creative-modal-section">
              <h4>Story Breakdown</h4>
              <p class="creative-modal-text">
                Hook: <strong>${creative.hook}</strong><br>
                Creator: <strong>${creative.creator}</strong><br>
                Kampagne: <strong>${creative.campaignName}</strong><br>
                Format: ${creative.format}<br>
                Tage live: ${creative.daysActive}
              </p>
            </section>

            <section class="creative-modal-section">
              <h4>Hook Heatmap</h4>
              ${renderHookHeatmap(creative)}
            </section>

            <section class="creative-modal-section">
              <h4>Nächste Schritte</h4>
              <div class="creative-modal-actions">
                <button class="btn primary small">Skalieren</button>
                <button class="btn ghost small">Briefing</button>
                <button class="btn ghost small">Testing Log</button>
              </div>
            </section>

          </div>
        </section>
      </div>
    `
  );
}
