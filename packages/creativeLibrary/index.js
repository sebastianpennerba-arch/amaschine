/*
 * packages/creativeLibrary/index.js
 * SignalOne – Creative Library (Layout B, 24 Demo-Creatives)
 * Uses DemoData via window.SignalOneDemo and respects Meta/Demo status indirectly
 * through app.js (modulesRequiringMeta + useDemoMode Gatekeeper).
 */

/* ----------------------------------------------------------
   DATA ACCESS HELPERS (shared with Dashboard)
-----------------------------------------------------------*/

function getDemoData() {
  return window.SignalOneDemo?.DemoData || null;
}

function getActiveBrandFromState(appState) {
  const demo = getDemoData();
  if (!demo || !demo.brands || !demo.brands.length) return null;

  const id = appState.selectedBrandId || demo.brands[0].id;
  return demo.brands.find((b) => b.id === id) || demo.brands[0];
}

/* ----------------------------------------------------------
   FORMAT HELPERS (copied from Dashboard view)
-----------------------------------------------------------*/

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

/* ----------------------------------------------------------
   BASE DEMO DATA – 24 CREATIVE BLUEPRINTS
   These will be scaled per brand (ROAS / Spend etc.).
-----------------------------------------------------------*/

const BASE_CREATIVES = [
  {
    id: "C-01",
    name: "Mia_Hook_Problem_Solution_v3",
    title: "Hook: Problem → Lösung (UGC)",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Winner",
    tags: ["Winner", "UGC", "Video"],
    platform: "Meta",
    hook: "Problem/Solution",
    creator: "Mia",
    campaignName: "UGC Scale Test",
    score: 94,
    metrics: {
      roas: 6.8,
      spend: 12340,
      ctr: 0.041,
      cpm: 7.2,
      purchases: 214,
    },
    daysActive: 12,
    variantsCount: 4,
    thumbTheme: "mia",
  },
  {
    id: "C-02",
    name: "Tom_Testimonial_ShortForm_v1",
    title: "Testimonial mit starker Social Proof Line",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Feed / Story",
    primaryTag: "Winner",
    tags: ["Winner", "UGC", "Video"],
    platform: "Meta",
    hook: "Testimonial",
    creator: "Tom",
    campaignName: "Trust Booster",
    score: 91,
    metrics: {
      roas: 5.9,
      spend: 8420,
      ctr: 0.038,
      cpm: 7.9,
      purchases: 156,
    },
    daysActive: 9,
    variantsCount: 3,
    thumbTheme: "tom",
  },
  {
    id: "C-03",
    name: "Lisa_BeforeAfter_Showcase_v2",
    title: "Before/After Transformation",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Winner",
    tags: ["Winner", "UGC", "Video"],
    platform: "Meta",
    hook: "Before/After",
    creator: "Lisa",
    campaignName: "Transformation Stories",
    score: 89,
    metrics: {
      roas: 5.2,
      spend: 6120,
      ctr: 0.035,
      cpm: 8.1,
      purchases: 127,
    },
    daysActive: 11,
    variantsCount: 3,
    thumbTheme: "lisa",
  },
  {
    id: "C-04",
    name: "Carousel_Benefit_Tiles_v3",
    title: "Carousel mit 3 Key Benefits",
    bucket: "winner",
    status: "active",
    type: "carousel",
    format: "Feed",
    primaryTag: "Winner",
    tags: ["Winner", "Static", "Carousel"],
    platform: "Meta",
    hook: "Benefit Highlights",
    creator: "Inhouse",
    campaignName: "Value Highlights",
    score: 87,
    metrics: {
      roas: 4.9,
      spend: 9340,
      ctr: 0.029,
      cpm: 7.6,
      purchases: 141,
    },
    daysActive: 18,
    variantsCount: 2,
    thumbTheme: "carousel",
  },
  {
    id: "C-05",
    name: "UGC_Unboxing_Authentic_v1",
    title: "Authentisches Unboxing (Handy-Style)",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Reels / Story",
    primaryTag: "Winner",
    tags: ["Winner", "UGC", "Video"],
    platform: "Meta",
    hook: "Unboxing",
    creator: "Anna",
    campaignName: "Launch Push",
    score: 90,
    metrics: {
      roas: 6.1,
      spend: 7380,
      ctr: 0.043,
      cpm: 6.9,
      purchases: 163,
    },
    daysActive: 7,
    variantsCount: 2,
    thumbTheme: "unboxing",
  },
  {
    id: "C-06",
    name: "Story_FlashSale_48h_v2",
    title: "Story mit 48h Flash Sale + Swipe Up",
    bucket: "winner",
    status: "active",
    type: "story",
    format: "Story",
    primaryTag: "Winner",
    tags: ["Winner", "Story", "Promo"],
    platform: "Meta",
    hook: "Urgency / Sale",
    creator: "Inhouse",
    campaignName: "Flash Sale 48h",
    score: 86,
    metrics: {
      roas: 4.6,
      spend: 5340,
      ctr: 0.051,
      cpm: 6.2,
      purchases: 121,
    },
    daysActive: 3,
    variantsCount: 1,
    thumbTheme: "flashsale",
  },

  // --- TESTING (MIDFIELD) ---

  {
    id: "C-07",
    name: "Hook_Battle_Problem_vs_Testimonial_A",
    title: "Hook Battle – Variante A (Problem/Solution)",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Testing",
    tags: ["Testing", "UGC", "Video"],
    platform: "Meta",
    hook: "Problem/Solution",
    creator: "Mia",
    campaignName: "Hook Battle 47",
    score: 78,
    metrics: {
      roas: 3.8,
      spend: 3120,
      ctr: 0.033,
      cpm: 8.4,
      purchases: 54,
    },
    daysActive: 2,
    variantsCount: 2,
    thumbTheme: "test-a",
  },
  {
    id: "C-08",
    name: "Hook_Battle_Problem_vs_Testimonial_B",
    title: "Hook Battle – Variante B (Testimonial)",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Testing",
    tags: ["Testing", "UGC", "Video"],
    platform: "Meta",
    hook: "Testimonial",
    creator: "Tom",
    campaignName: "Hook Battle 47",
    score: 72,
    metrics: {
      roas: 3.1,
      spend: 2980,
      ctr: 0.027,
      cpm: 9.1,
      purchases: 41,
    },
    daysActive: 2,
    variantsCount: 2,
    thumbTheme: "test-b",
  },
  {
    id: "C-09",
    name: "Native_Article_Style_v1",
    title: "Native Article Style (Feed, Long Copy)",
    bucket: "testing",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Testing",
    tags: ["Testing", "Static"],
    platform: "Meta",
    hook: "Storytelling",
    creator: "Inhouse",
    campaignName: "Story Angle Test",
    score: 74,
    metrics: {
      roas: 3.4,
      spend: 4210,
      ctr: 0.021,
      cpm: 10.2,
      purchases: 49,
    },
    daysActive: 5,
    variantsCount: 1,
    thumbTheme: "native",
  },
  {
    id: "C-10",
    name: "Static_Product_On_White_v5",
    title: "Product on White – Clean Shot",
    bucket: "testing",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Testing",
    tags: ["Testing", "Static"],
    platform: "Meta",
    hook: "Product Focus",
    creator: "Inhouse",
    campaignName: "Prospecting Clean",
    score: 69,
    metrics: {
      roas: 2.9,
      spend: 2860,
      ctr: 0.018,
      cpm: 11.3,
      purchases: 32,
    },
    daysActive: 6,
    variantsCount: 2,
    thumbTheme: "product-white",
  },
  {
    id: "C-11",
    name: "UGC_CreatorPack_v2",
    title: "Creator Pack – 3 schnelle Szenen",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Reels",
    primaryTag: "Testing",
    tags: ["Testing", "UGC"],
    platform: "Meta",
    hook: "Fast Cut",
    creator: "Creator Squad",
    campaignName: "Creator Pack Test",
    score: 76,
    metrics: {
      roas: 3.6,
      spend: 3540,
      ctr: 0.039,
      cpm: 7.8,
      purchases: 57,
    },
    daysActive: 4,
    variantsCount: 3,
    thumbTheme: "creatorpack",
  },
  {
    id: "C-12",
    name: "FAQ_Explainer_Cutdown_v1",
    title: "FAQ Explainer – 15s Cutdown",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Testing",
    tags: ["Testing", "UGC"],
    platform: "Meta",
    hook: "FAQ / Objection",
    creator: "Support Lead",
    campaignName: "Objection Handling",
    score: 71,
    metrics: {
      roas: 3.0,
      spend: 2650,
      ctr: 0.024,
      cpm: 9.8,
      purchases: 36,
    },
    daysActive: 5,
    variantsCount: 1,
    thumbTheme: "faq",
  },

  // --- LOSER (BOTTOM 20%) ---

  {
    id: "C-13",
    name: "Generic_Product_Static_v12",
    title: "Generic Static ohne Hook",
    bucket: "loser",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Loser",
    tags: ["Loser", "Static"],
    platform: "Meta",
    hook: "Kein klarer Hook",
    creator: "Inhouse",
    campaignName: "Legacy Creatives",
    score: 41,
    metrics: {
      roas: 1.2,
      spend: 3200,
      ctr: 0.009,
      cpm: 13.4,
      purchases: 11,
    },
    daysActive: 24,
    variantsCount: 1,
    thumbTheme: "generic",
  },
  {
    id: "C-14",
    name: "Banner_Discount_Only_Text_v3",
    title: "Nur -20% Banner ohne Kontext",
    bucket: "loser",
    status: "active",
    type: "static_image",
    format: "Feed / Story",
    primaryTag: "Loser",
    tags: ["Loser", "Static"],
    platform: "Meta",
    hook: "Discount Only",
    creator: "Inhouse",
    campaignName: "Old Promo",
    score: 45,
    metrics: {
      roas: 1.5,
      spend: 2780,
      ctr: 0.011,
      cpm: 12.9,
      purchases: 14,
    },
    daysActive: 19,
    variantsCount: 1,
    thumbTheme: "discount",
  },
  {
    id: "C-15",
    name: "Stock_Footage_Generic_v4",
    title: "Stock Footage ohne Produktbezug",
    bucket: "loser",
    status: "active",
    type: "video",
    format: "Feed",
    primaryTag: "Loser",
    tags: ["Loser", "Video"],
    platform: "Meta",
    hook: "Generic Stock",
    creator: "Stock",
    campaignName: "Generic Awareness",
    score: 39,
    metrics: {
      roas: 1.1,
      spend: 3010,
      ctr: 0.008,
      cpm: 14.1,
      purchases: 10,
    },
    daysActive: 21,
    variantsCount: 1,
    thumbTheme: "stock",
  },
  {
    id: "C-16",
    name: "Product_Catalog_Screenshot_v1",
    title: "Screenshot vom Shop-Katalog",
    bucket: "loser",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Loser",
    tags: ["Loser", "Static"],
    platform: "Meta",
    hook: "Catalog Screenshot",
    creator: "Inhouse",
    campaignName: "Catalog Push",
    score: 43,
    metrics: {
      roas: 1.4,
      spend: 2440,
      ctr: 0.010,
      cpm: 12.5,
      purchases: 13,
    },
    daysActive: 20,
    variantsCount: 1,
    thumbTheme: "catalog",
  },
  {
    id: "C-17",
    name: "Long_Copy_No_Hook_v2",
    title: "Langweilige Long Copy ohne Hook",
    bucket: "loser",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Loser",
    tags: ["Loser", "Static"],
    platform: "Meta",
    hook: "Wall of Text",
    creator: "Inhouse",
    campaignName: "Blog Style Old",
    score: 38,
    metrics: {
      roas: 1.0,
      spend: 2310,
      ctr: 0.007,
      cpm: 13.9,
      purchases: 9,
    },
    daysActive: 26,
    variantsCount: 1,
    thumbTheme: "longcopy",
  },
  {
    id: "C-18",
    name: "Story_Too_Much_Text_v1",
    title: "Story mit zu viel kleinem Text",
    bucket: "loser",
    status: "active",
    type: "story",
    format: "Story",
    primaryTag: "Loser",
    tags: ["Loser", "Story"],
    platform: "Meta",
    hook: "Hard to read",
    creator: "Inhouse",
    campaignName: "Old Story Batch",
    score: 36,
    metrics: {
      roas: 0.9,
      spend: 1890,
      ctr: 0.006,
      cpm: 14.5,
      purchases: 7,
    },
    daysActive: 22,
    variantsCount: 1,
    thumbTheme: "text-heavy",
  },

  // --- ADDITIONAL MIDFIELD TO REACH 24 TOTAL ---

  {
    id: "C-19",
    name: "UGC_Duet_Reaction_v1",
    title: "Reaction/Duet auf Kunden-Video",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Reels",
    primaryTag: "Testing",
    tags: ["Testing", "UGC"],
    platform: "Meta",
    hook: "Reaction",
    creator: "Mia & Customer",
    campaignName: "Social Proof Remix",
    score: 77,
    metrics: {
      roas: 3.7,
      spend: 3290,
      ctr: 0.037,
      cpm: 8.0,
      purchases: 52,
    },
    daysActive: 3,
    variantsCount: 2,
    thumbTheme: "reaction",
  },
  {
    id: "C-20",
    name: "UGC_POV_DayInLife_v1",
    title: "POV / Day in the Life",
    bucket: "testing",
    status: "active",
    type: "ugc_video",
    format: "Reels / Story",
    primaryTag: "Testing",
    tags: ["Testing", "UGC"],
    platform: "Meta",
    hook: "POV",
    creator: "Lisa",
    campaignName: "Lifestyle Integration",
    score: 75,
    metrics: {
      roas: 3.5,
      spend: 3470,
      ctr: 0.034,
      cpm: 8.6,
      purchases: 50,
    },
    daysActive: 4,
    variantsCount: 2,
    thumbTheme: "pov",
  },
  {
    id: "C-21",
    name: "UGC_Problem_Agit_Solve_v1",
    title: "Problem–Agitate–Solve Script",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Feed / Reels",
    primaryTag: "Winner",
    tags: ["Winner", "UGC"],
    platform: "Meta",
    hook: "Problem-Agitate-Solve",
    creator: "Tom",
    campaignName: "Painkiller Angle",
    score: 88,
    metrics: {
      roas: 5.0,
      spend: 5810,
      ctr: 0.040,
      cpm: 7.4,
      purchases: 119,
    },
    daysActive: 8,
    variantsCount: 2,
    thumbTheme: "pas",
  },
  {
    id: "C-22",
    name: "UGC_BeforeAfter_Short_v1",
    title: "Snappy Before/After Cutdown",
    bucket: "winner",
    status: "active",
    type: "ugc_video",
    format: "Reels",
    primaryTag: "Winner",
    tags: ["Winner", "UGC"],
    platform: "Meta",
    hook: "Before/After",
    creator: "Mia",
    campaignName: "Transformation Boost",
    score: 92,
    metrics: {
      roas: 6.2,
      spend: 6940,
      ctr: 0.045,
      cpm: 6.8,
      purchases: 143,
    },
    daysActive: 6,
    variantsCount: 2,
    thumbTheme: "beforeafter",
  },
  {
    id: "C-23",
    name: "Static_UGC_Quote_Card_v1",
    title: "UGC Quote Card (Screenshot Review)",
    bucket: "testing",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Testing",
    tags: ["Testing", "Static"],
    platform: "Meta",
    hook: "Quote",
    creator: "Customer",
    campaignName: "Review Highlights",
    score: 73,
    metrics: {
      roas: 3.2,
      spend: 2710,
      ctr: 0.026,
      cpm: 9.3,
      purchases: 43,
    },
    daysActive: 5,
    variantsCount: 1,
    thumbTheme: "quote",
  },
  {
    id: "C-24",
    name: "Static_Comparison_BeforeAfter_Grid_v1",
    title: "Before/After Grid Static",
    bucket: "winner",
    status: "active",
    type: "static_image",
    format: "Feed",
    primaryTag: "Winner",
    tags: ["Winner", "Static"],
    platform: "Meta",
    hook: "Before/After",
    creator: "Inhouse",
    campaignName: "Static Transform",
    score: 85,
    metrics: {
      roas: 4.4,
      spend: 5080,
      ctr: 0.032,
      cpm: 8.2,
      purchases: 94,
    },
    daysActive: 10,
    variantsCount: 1,
    thumbTheme: "grid",
  },
];

/* ----------------------------------------------------------
   DATA ADJUSTMENT PER BRAND
-----------------------------------------------------------*/

function buildCreativesForBrand(brand) {
  if (!brand) {
    // Fallback: return base set for generic demo
    return BASE_CREATIVES.map((c) => ({ ...c }));
  }

  const baseRoas = 4.8; // Benchmark from Demo-Dashboard spec
  const baseSpend30d = 47892;

  const roasFactor =
    typeof brand.roas30d === "number" && !Number.isNaN(brand.roas30d)
      ? brand.roas30d / baseRoas
      : 1;

  const spendFactor =
    typeof brand.spend30d === "number" && !Number.isNaN(brand.spend30d)
      ? brand.spend30d / baseSpend30d
      : 1;

  return BASE_CREATIVES.map((c, idx) => {
    const scaledRoas = c.metrics.roas * roasFactor;
    const scaledSpendRaw = c.metrics.spend * spendFactor;

    const scaledSpend = Math.round(scaledSpendRaw / 50) * 50; // round to neat €50 blocks

    const purchases =
      c.metrics.purchases && c.metrics.roas
        ? Math.max(
            1,
            Math.round(
              (c.metrics.purchases * roasFactor * (0.8 + (idx % 5) * 0.05))
            )
          )
        : c.metrics.purchases;

    return {
      ...c,
      id: brand.id + "__" + c.id,
      brandId: brand.id,
      metrics: {
        ...c.metrics,
        roas: Number(scaledRoas.toFixed(1)),
        spend: scaledSpend,
        purchases,
      },
    };
  });
}

/* ----------------------------------------------------------
   TAG / SUMMARY HELPERS
-----------------------------------------------------------*/

function buildTagSummary(creatives) {
  const summary = {
    total: creatives.length,
    winners: 0,
    testing: 0,
    losers: 0,
    ugc: 0,
    static: 0,
    story: 0,
  };

  for (const c of creatives) {
    if (c.bucket === "winner") summary.winners++;
    if (c.bucket === "testing") summary.testing++;
    if (c.bucket === "loser") summary.losers++;
    if (c.type && c.type.indexOf("ugc") !== -1) summary.ugc++;
    if (c.type && c.type.indexOf("static") !== -1) summary.static++;
    if (c.type === "story") summary.story++;
  }

  return summary;
}

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
   CORE RENDER FUNCTION (called by app.js loadModule)
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

  if (!brand) {
    section.innerHTML = `
      <div class="view-empty">
        <p>Für die Creative Library stehen aktuell noch keine Demo-Daten bereit.</p>
        <p class="view-empty-sub">Bitte stelle sicher, dass das Demo-Dataset geladen ist oder verbinde einen Meta-Account.</p>
      </div>
    `;
    return;
  }

  const modeLabel =
    demoModeActive && !isConnected
      ? "Demo-Daten • Letzte 30 Tage"
      : demoModeActive && isConnected
      ? "Live + Demo Overlay (Beta)"
      : "Live-Daten aus Meta";

  const headlineBrandName = brand?.name || "Dein Brand";

  section.innerHTML = `
    <div class="creative-view-root">
      <header class="creative-view-header">
        <div class="creative-view-title">
          <div class="view-kicker">AdSensei • Creative Cockpit</div>
          <h2 class="view-headline">
            ${headlineBrandName} – Creative Library
          </h2>
          <p class="view-subline">
            Voller Überblick über alle aktiven Creatives: Winner, Testing & Loser – sortiert nach Performance, bereit für Sensei-Aktionen.
          </p>
          <div class="view-meta-row">
            <span class="view-meta-pill">
              <span class="dot dot-live"></span>
              ${modeLabel}
            </span>
            <span class="view-meta-pill subtle">
              ${tags.total} Creatives • ${tags.winners} Winner • ${tags.testing} Testing • ${tags.losers} Loser
            </span>
          </div>
        </div>
        <div class="creative-view-right">
          <div class="creative-view-kpis">
            <div class="creative-mini-kpi">
              <span class="creative-mini-kpi-label">Top ROAS Creative</span>
              <span class="creative-mini-kpi-value">
                ${formatNumber(
                  Math.max(...creatives.map((c) => c.metrics.roas || 0)) || 0,
                  1,
                  "x"
                )}
              </span>
            </div>
            <div class="creative-mini-kpi">
              <span class="creative-mini-kpi-label">Spend (aktiver Grid)</span>
              <span class="creative-mini-kpi-value">
                ${formatCurrency(
                  creatives.reduce(
                    (sum, c) => sum + (c.metrics.spend || 0),
                    0
                  )
                )}
              </span>
            </div>
            <div class="creative-mini-kpi">
              <span class="creative-mini-kpi-label">Winner-Quote</span>
              <span class="creative-mini-kpi-value">
                ${
                  tags.total
                    ? ((tags.winners / tags.total) * 100).toFixed(0) + " %"
                    : "–"
                }
              </span>
            </div>
          </div>
          <div class="creative-view-actions">
            <button class="btn ghost small" type="button">
              Layout
            </button>
            <button class="btn primary small" type="button">
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <section class="creative-filter-bar">
        <div class="creative-filter-chips" data-role="bucket-chips">
          <button class="chip active" data-bucket="all">Alle Creatives</button>
          <button class="chip" data-bucket="winner">Winner</button>
          <button class="chip" data-bucket="testing">Testing</button>
          <button class="chip" data-bucket="loser">Loser</button>
        </div>
        <div class="creative-filter-inputs">
          <div class="creative-search">
            <input
              type="search"
              class="creative-search-input"
              placeholder="Suche nach Hook, Creator, Kampagne..."
              data-role="search"
            />
          </div>
          <div class="creative-select-group">
            <select class="creative-select" data-role="sort">
              <option value="score_desc">Sortierung: Score (hoch → niedrig)</option>
              <option value="roas_desc">ROAS (hoch → niedrig)</option>
              <option value="spend_desc">Spend (hoch → niedrig)</option>
              <option value="ctr_desc">CTR (hoch → niedrig)</option>
              <option value="days_desc">Laufzeit (neu → alt)</option>
            </select>
          </div>
        </div>
      </section>

      <section class="creative-tags-row">
        <div class="creative-tags" data-role="tags">
          <button class="tag-pill active" data-tag="all">
            #Alle (${tags.total})
          </button>
          <button class="tag-pill" data-tag="Winner">
            #Winner (${tags.winners})
          </button>
          <button class="tag-pill" data-tag="Testing">
            #Testing (${tags.testing})
          </button>
          <button class="tag-pill" data-tag="Loser">
            #Loser (${tags.losers})
          </button>
          <button class="tag-pill" data-tag="UGC">
            #UGC (${tags.ugc})
          </button>
          <button class="tag-pill" data-tag="Static">
            #Static (${tags.static})
          </button>
        </div>
      </section>

      <section class="creative-library-grid" data-role="grid">
        <!-- Cards werden via JS gerendert -->
      </section>
    </div>
  `;

  // --- INTERACTIVE LAYER ---

  const gridEl = section.querySelector('[data-role="grid"]');
  const searchInput = section.querySelector('[data-role="search"]');
  const sortSelect = section.querySelector('[data-role="sort"]');
  const tagContainer = section.querySelector('[data-role="tags"]');
  const bucketChips = section.querySelector('[data-role="bucket-chips"]');

  if (!gridEl) return;

  const state = {
    allCreatives: creatives,
    search: "",
    activeTag: "all",
    activeBucket: "all",
    sort: "score_desc",
  };

  function applyFilters() {
    let list = state.allCreatives.slice();

    if (state.activeBucket !== "all") {
      list = list.filter((c) => c.bucket === state.activeBucket);
    }

    if (state.activeTag !== "all") {
      const tag = state.activeTag.toLowerCase();
      list = list.filter((c) =>
        (c.tags || []).some((t) => t.toLowerCase() === tag)
      );
    }

    if (state.search) {
      const q = state.search;
      list = list.filter((c) => {
        const haystack = [
          c.name,
          c.title,
          c.hook,
          c.creator,
          c.campaignName,
          c.primaryTag,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.indexOf(q) !== -1;
      });
    }

    const valueBySortKey = (c) => {
      switch (state.sort) {
        case "roas_desc":
          return c.metrics.roas || 0;
        case "spend_desc":
          return c.metrics.spend || 0;
        case "ctr_desc":
          return c.metrics.ctr || 0;
        case "days_desc":
          return c.daysActive || 0;
        case "score_desc":
        default:
          return c.score || 0;
      }
    };

    list.sort((a, b) => valueBySortKey(b) - valueBySortKey(a));
    return list;
  }

  function bucketBadgeHtml(creative) {
    const tone = getBucketTone(creative.bucket);
    const label = getBucketLabel(creative.bucket);
    return `
      <span class="badge badge-${tone}">
        ${label.toUpperCase()}
      </span>
    `;
  }

  function platformPillHtml(creative) {
    const platform = creative.platform || "Meta";
    return `
      <span class="creative-platform-pill">
        <span class="dot dot-gold"></span>
        ${platform}
      </span>
    `;
  }

  function thumbClass(creative) {
    return "creative-thumb creative-thumb-" + (creative.thumbTheme || "default");
  }

  function renderGrid() {
    const list = applyFilters();

    if (!list.length) {
      gridEl.innerHTML = `
        <div class="creative-empty">
          <p>Keine Creatives für die aktuelle Ansicht gefunden.</p>
          <p class="creative-empty-sub">
            Passe Filter oder Suche an, um wieder Ergebnisse zu sehen.
          </p>
        </div>
      `;
      return;
    }

    gridEl.innerHTML = list
      .map((creative, index) => {
        const rank = index + 1;
        const roas = formatNumber(creative.metrics.roas, 1, "x");
        const spend = formatCurrency(creative.metrics.spend);
        const ctr = formatPercent(creative.metrics.ctr * 100, 1);
        const cpm = formatCurrency(creative.metrics.cpm);

        return `
          <article
            class="creative-card"
            data-creative-id="${creative.id}"
            data-bucket="${creative.bucket}"
          >
            <div class="${thumbClass(creative)}">
              <div class="creative-rank-badge">#${rank}</div>
              ${platformPillHtml(creative)}
              <div class="creative-thumb-overlay"></div>
            </div>
            <div class="creative-card-body">
              <div class="creative-card-header">
                <div class="creative-title-block">
                  <h3 class="creative-title">${creative.name}</h3>
                  <p class="creative-subtitle">${creative.title || ""}</p>
                </div>
                <div class="creative-badges">
                  ${bucketBadgeHtml(creative)}
                  <span class="badge badge-soft">
                    Score ${creative.score}/100
                  </span>
                </div>
              </div>

              <div class="creative-meta">
                <span>🎬 ${creative.hook || "Hook unbekannt"}</span>
                <span>👤 ${creative.creator || "Unbekannter Creator"}</span>
                <span>🧪 ${creative.campaignName || "Kampagne n/a"}</span>
              </div>

              <div class="creative-kpi-row">
                <div class="creative-kpi">
                  <span class="creative-kpi-label">ROAS</span>
                  <span class="creative-kpi-value">${roas}</span>
                </div>
                <div class="creative-kpi">
                  <span class="creative-kpi-label">Spend</span>
                  <span class="creative-kpi-value">${spend}</span>
                </div>
                <div class="creative-kpi">
                  <span class="creative-kpi-label">CTR</span>
                  <span class="creative-kpi-value">${ctr}</span>
                </div>
                <div class="creative-kpi">
                  <span class="creative-kpi-label">CPM</span>
                  <span class="creative-kpi-value">${cpm}</span>
                </div>
              </div>

              <footer class="creative-card-footer">
                <div class="creative-footer-left">
                  <span class="creative-footer-meta">
                    ${creative.metrics.purchases || 0} Purchases •
                    ${creative.daysActive || 0} Tage live
                  </span>
                </div>
                <div class="creative-footer-actions">
                  <button
                    type="button"
                    class="btn-link"
                    data-action="details"
                    data-creative-id="${creative.id}"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    class="btn-link"
                    data-action="variants"
                    data-creative-id="${creative.id}"
                  >
                    Varianten (${creative.variantsCount || 1})
                  </button>
                  <button
                    type="button"
                    class="btn-link bold"
                    data-action="testslot"
                    data-creative-id="${creative.id}"
                  >
                    Test-Slot
                  </button>
                </div>
              </footer>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function setActiveTag(tagValue) {
    state.activeTag = tagValue;

    if (!tagContainer) return;
    const pills = Array.from(tagContainer.querySelectorAll(".tag-pill"));
    pills.forEach((pill) => {
      const v = pill.getAttribute("data-tag") || "all";
      pill.classList.toggle("active", v === tagValue);
    });
  }

  function setActiveBucket(bucketValue) {
    state.activeBucket = bucketValue;

    if (!bucketChips) return;
    const chips = Array.from(bucketChips.querySelectorAll(".chip"));
    chips.forEach((chip) => {
      const v = chip.getAttribute("data-bucket") || "all";
      chip.classList.toggle("active", v === bucketValue);
    });
  }

  // Initial render
  renderGrid();

  // --- EVENT WIRING ---

  if (searchInput) {
    searchInput.addEventListener("input", (ev) => {
      state.search = (ev.target.value || "").trim().toLowerCase();
      renderGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (ev) => {
      state.sort = ev.target.value || "score_desc";
      renderGrid();
    });
  }

  if (tagContainer) {
    tagContainer.addEventListener("click", (ev) => {
      const pill = ev.target.closest(".tag-pill");
      if (!pill) return;
      const tag = pill.getAttribute("data-tag") || "all";
      setActiveTag(tag);
      renderGrid();
    });
  }

  if (bucketChips) {
    bucketChips.addEventListener("click", (ev) => {
      const chip = ev.target.closest(".chip");
      if (!chip) return;
      const bucket = chip.getAttribute("data-bucket") || "all";
      setActiveBucket(bucket);
      renderGrid();
    });
  }

  gridEl.addEventListener("click", (ev) => {
    const actionEl = ev.target.closest("[data-action]");
    const cardEl = ev.target.closest("[data-creative-id]");
    if (!cardEl) return;

    const creativeId = cardEl.getAttribute("data-creative-id");
    const creative = state.allCreatives.find((c) => c.id === creativeId);
    if (!creative) return;

    const action = actionEl ? actionEl.getAttribute("data-action") : "details";

    openCreativeModal(creative, action, brand);
  });
}

/* ----------------------------------------------------------
   MODAL RENDERING (uses global SignalOne modal helper)
-----------------------------------------------------------*/

function openCreativeModal(creative, action, brand) {
  const modalFn = window.SignalOne?.openSystemModal;
  if (typeof modalFn !== "function") {
    // Fallback ohne zentrales Modal
    alert("Creative: " + (creative?.name || "Unbekannt"));
    return;
  }

  const bucketLabel = getBucketLabel(creative.bucket);
  const tone = getBucketTone(creative.bucket);

  const bodyHtml = `
    <div class="creative-modal">
      <header class="creative-modal-header">
        <div>
          <div class="view-kicker">Creative Deep Dive</div>
          <h3 class="creative-modal-title">${creative.name}</h3>
          <p class="creative-modal-subtitle">
            ${creative.title || ""}
          </p>
        </div>
        <div class="creative-modal-badges">
          <span class="badge badge-${tone}">${bucketLabel.toUpperCase()}</span>
          <span class="badge badge-soft">Score ${creative.score}/100</span>
        </div>
      </header>

      <section class="creative-modal-main">
        <div class="creative-modal-left">
          <div class="creative-modal-thumb ${
            "creative-thumb-" + (creative.thumbTheme || "default")
          }">
            <div class="creative-modal-thumb-overlay">
              <span class="creative-modal-thumb-label">Video / Thumbnail Preview (Demo)</span>
            </div>
          </div>

          <div class="creative-modal-kpis">
            <div class="creative-kpi">
              <span class="creative-kpi-label">ROAS</span>
              <span class="creative-kpi-value">
                ${formatNumber(creative.metrics.roas, 1, "x")}
              </span>
            </div>
            <div class="creative-kpi">
              <span class="creative-kpi-label">Spend</span>
              <span class="creative-kpi-value">
                ${formatCurrency(creative.metrics.spend)}
              </span>
            </div>
            <div class="creative-kpi">
              <span class="creative-kpi-label">CTR</span>
              <span class="creative-kpi-value">
                ${formatPercent(creative.metrics.ctr * 100, 1)}
              </span>
            </div>
            <div class="creative-kpi">
              <span class="creative-kpi-label">CPM</span>
              <span class="creative-kpi-value">
                ${formatCurrency(creative.metrics.cpm)}
              </span>
            </div>
          </div>
        </div>

        <div class="creative-modal-right">
          <section class="creative-modal-section">
            <h4>Story Breakdown</h4>
            <ul class="creative-modal-list">
              <li><strong>Hook:</strong> ${creative.hook || "n/a"}</li>
              <li><strong>Creator:</strong> ${creative.creator || "n/a"}</li>
              <li><strong>Kampagne:</strong> ${creative.campaignName || "n/a"}</li>
              <li><strong>Format:</strong> ${creative.format || "n/a"}</li>
              <li><strong>Tage live:</strong> ${creative.daysActive || 0}</li>
            </ul>
          </section>

          <section class="creative-modal-section">
            <h4>Sensei Insight (Demo)</h4>
            <p class="creative-modal-text">
              ${
                creative.bucket === "winner"
                  ? "Dieser Creative-Typ performt deutlich über Account-Durchschnitt. Plane 2–3 Variationen (Hook/Intro) und erhöhe Budget kontrolliert."
                  : creative.bucket === "loser"
                  ? "Unterperformer im aktuellen Setup. Pausiere zeitnah und ersetze durch UGC mit klarer Hook-Line und sichtbarem Produkt in den ersten 3 Sekunden."
                  : "Im Testing-Bereich. Lass den Test mindestens 3 Tage laufen oder bis zu 50–100 Conversions, bevor du eine finale Entscheidung triffst."
              }
            </p>
          </section>

          <section class="creative-modal-section">
            <h4>Nächste Schritte</h4>
            <div class="creative-modal-actions">
              <button type="button" class="btn primary small">Varianten planen</button>
              <button type="button" class="btn ghost small">Briefing generieren</button>
              <button type="button" class="btn ghost small">Zum Testing Log</button>
            </div>
          </section>
        </div>
      </section>
    </div>
  `;

  const title =
    (brand?.name ? brand.name + " – " : "") + (creative.name || "Creative");

  modalFn(title, bodyHtml);
}
