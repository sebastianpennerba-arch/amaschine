// packages/creativeLibrary/compute.js
// ---------------------------------------------------------
//  P2.2 / P2.3 – Creative Library Compute Layer
//  -> Zentrale Quelle für Scoring, Buckets, Tag-Counts & Variant-Key
//  -> Rein "pure functions", kein DOM, kein DataLayer-Access
// ---------------------------------------------------------

/**
 * Baut das ViewModel für die Creative Library auf Basis roh
 * geladener Creative-Daten (Live oder Demo).
 *
 * @param {Array<Object>} rawCreatives - Rohdaten vom DataLayer oder Demo-Layer
 * @param {Object} options
 * @param {string} [options.brandName]
 * @param {string} [options.rangeLabel]
 * @param {boolean} [options.preferLive]
 * @returns {{
 *  creatives: Array<Object>,
 *  tags: { total:number, winners:number, testing:number, losers:number, ugc:number, static:number },
 *  stats: { totalSpend:number, avgRoas:number, avgCtr:number, avgCpm:number, topScore:number },
 *  meta: { brandName:string, rangeLabel:string, modeLabel:string }
 * }}
 */
export function buildCreativeLibraryViewModel(rawCreatives = [], options = {}) {
  const {
    brandName = "Dein Brand",
    rangeLabel = "Letzte 30 Tage",
    preferLive = false,
  } = options;

  const normalized = (rawCreatives || []).map((c, idx) =>
    normalizeCreative(c, idx),
  );

  const tags = buildTagSummary(normalized);
  const stats = buildStats(normalized);
  const modeLabel = preferLive
    ? `Live-Daten • ${rangeLabel}`
    : `Demo-Modus • ${rangeLabel}`;

  return {
    creatives: normalized,
    tags,
    stats,
    meta: {
      brandName,
      rangeLabel,
      modeLabel,
    },
  };
}

/* ----------------------------------------------------------
   Normalisierung & Feature Engineering
-----------------------------------------------------------*/

/**
 * Normalisiert Creative-Daten (Demo + Live) in das interne
 * Creative-View-Model der Library.
 *
 * WICHTIG: Hier wird auch der variantKey berechnet (Hybrid C):
 *   1) Primär: technische creativeId / metaCreativeId
 *   2) Fallback: Creator + Hook + Format
 */
function normalizeCreative(raw = {}, index = 0) {
  const metrics = extractMetrics(raw);

  const bucket = getPerformanceBucket(metrics);
  const score = computeSenseiScore(metrics, bucket, raw);

  const name =
    raw.name ||
    raw.title ||
    raw.adName ||
    raw.assetName ||
    "Unbenanntes Creative";

  const hook =
    raw.hook ||
    raw.primaryText ||
    raw.primary_text ||
    raw.headline ||
    raw.title ||
    "";

  const creator =
    raw.creator ||
    raw.creatorName ||
    raw.creator_name ||
    raw.pageName ||
    raw.page_name ||
    raw.brand ||
    "Unknown Creator";

  const formatRaw = (raw.format || raw.type || "").toString().toLowerCase();
  const isVideo =
    formatRaw.includes("video") ||
    formatRaw.includes("reel") ||
    formatRaw.includes("story");

  const format = raw.format || raw.type || (isVideo ? "video" : "image");

  // 1) Technischer Schlüssel (Meta Creative ID etc.)
  const technicalKey =
    raw.creativeId ||
    raw.creative_id ||
    raw.metaCreativeId ||
    raw.assetId ||
    raw.asset_id ||
    null;

  // 2) Fallback-Key: Creator + Hook + Format
  const normalizedHook = hook
    .toString()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  const creatorKey = creator.toString().toLowerCase().trim();
  const formatKey = isVideo ? "video" : "static";

  const fallbackKey = `${creatorKey || "n/a"}__${normalizedHook || "n/a"}__${formatKey}`;

  const variantKey = technicalKey || fallbackKey;

  const tags = buildTags(
    {
      ...raw,
      format,
      hook,
    },
    bucket,
  );

  return {
    id: String(raw.id || raw.creativeId || raw.creative_id || `demo-${index}`),

    // Hybrid Varianten-Key für P2.3
    variantKey,
    variantSource: technicalKey ? "technical" : "heuristic",

    name,
    thumbnailUrl: raw.thumbnailUrl || raw.thumbnail || raw.imageUrl || null,
    platform: raw.platform || "Meta",
    format,
    status: raw.status || "ACTIVE",

    // Story / Kontext
    hook,
    creator,
    daysActive: safeNumber(raw.daysActive || raw.ageInDays || raw.days_active || 0),

    // Performance
    bucket,
    score,
    tags,

    metrics,

    // Meta für Sortierung / Anzeige
    createdAt: raw.createdAt || raw.dateStart || raw.date_start || null,
  };
}

/**
 * Zieht Metriken aus verschiedenen möglichen Feldern zusammen.
 */
function extractMetrics(raw = {}) {
  const m = raw.metrics || raw.kpis || raw;

  const spend =
    safeNumber(m.spend ?? m.spend_eur ?? m.spendUsd ?? m.spendEur) || 0;
  const revenue =
    safeNumber(
      m.revenue ??
        m.purchaseValue ??
        m.purchase_value ??
        m.purchaseValueEur ??
        m.revenue_eur ??
        m.revenueUsd,
    ) || 0;

  const roas =
    spend > 0 ? safeNumber(m.roas ?? revenue / spend) : safeNumber(m.roas) || 0;

  return {
    spend,
    revenue,
    roas,
    ctr: safePercent(m.ctr ?? m.clickThroughRate ?? m.click_through_rate),
    cpm: safeNumber(m.cpm ?? m.cpm_eur ?? m.costPerMille),
    impressions: safeNumber(m.impressions),
    clicks: safeNumber(m.clicks),
    purchases: safeNumber(m.purchases ?? m.conversions ?? m.purchases_7d),
    cpa:
      safeNumber(m.cpa ?? m.costPerPurchase ?? m.costPerConversion) ||
      (safeNumber(m.purchases ?? m.conversions) > 0
        ? spend / safeNumber(m.purchases ?? m.conversions)
        : 0),
  };
}

/* ----------------------------------------------------------
   Scoring & Buckets
-----------------------------------------------------------*/

/**
 * Grobe Performance-Buckets basierend auf ROAS + Spend.
 * Winner / Testing / Loser – für UI-Tags & Filter.
 */
export function getPerformanceBucket(metrics = {}) {
  const roas = safeNumber(metrics.roas);
  const spend = safeNumber(metrics.spend);

  if (spend < 50 && roas === 0) {
    return "testing";
  }

  if (roas >= 4 && spend >= 200) return "winner";
  if (roas < 1.5 && spend >= 150) return "loser";

  return "testing";
}

/**
 * AdSensei Score (0–100) – Heuristik auf Basis von
 * ROAS, Spend, CTR & CPA. Kann später durch echten Backend-Score
 * ersetzt werden; UI bleibt stabil.
 */
export function computeSenseiScore(metrics = {}, bucket, raw = {}) {
  const roas = clamp(safeNumber(metrics.roas), 0, 10);
  const ctr = clamp(safePercent(metrics.ctr), 0, 0.15); // 15 % Hardcap
  const cpa = safeNumber(metrics.cpa);
  const spend = safeNumber(metrics.spend);

  let base = (roas / 7) * 55; // ROAS dominiert (bis ~7x)
  base += (ctr / 0.06) * 20; // CTR 6 % -> +20 Punkte

  if (cpa > 0) {
    const cpaFactor = clamp(40 / cpa, 0, 2); // kleiner CPA = besser
    base += cpaFactor * 10;
  }

  if (spend > 1000) base += 5;
  if (spend > 5000) base += 5;

  // Bucket-Bonus / Malus
  if (bucket === "winner") base += 5;
  if (bucket === "loser") base -= 5;

  const rawScore = clamp(base, 5, 99);

  // optional: Backend-Score überschreibt (falls vorhanden)
  if (raw.senseiScore != null) {
    return clamp(safeNumber(raw.senseiScore), 0, 100);
  }

  return Math.round(rawScore);
}

/* ----------------------------------------------------------
   Tags & Aggregates
-----------------------------------------------------------*/

function buildTags(raw, bucket) {
  const tags = new Set();

  if (bucket === "winner") tags.add("Winner");
  if (bucket === "testing") tags.add("Testing");
  if (bucket === "loser") tags.add("Loser");

  const format = (raw.format || raw.type || "").toString().toLowerCase();
  const isVideo =
    format.includes("video") ||
    format.includes("reel") ||
    format.includes("story");

  if (
    isVideo ||
    /ugc/i.test(raw.hook || "") ||
    /ugc/i.test(raw.name || "") ||
    /ugc/i.test(raw.format || "")
  ) {
    tags.add("UGC");
  } else {
    tags.add("Static");
  }

  if (Array.isArray(raw.tags)) {
    raw.tags.forEach((t) => {
      if (typeof t === "string" && t.trim()) tags.add(t.trim());
    });
  }

  return Array.from(tags);
}

function buildTagSummary(creatives = []) {
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

    if ((c.tags || []).includes("UGC")) summary.ugc += 1;
    if ((c.tags || []).includes("Static")) summary.static += 1;
  }

  return summary;
}

function buildStats(creatives = []) {
  if (!creatives.length) {
    return {
      totalSpend: 0,
      avgRoas: 0,
      avgCtr: 0,
      avgCpm: 0,
      topScore: 0,
    };
  }

  let spendSum = 0;
  let roasSum = 0;
  let ctrSum = 0;
  let cpmSum = 0;
  let topScore = 0;

  for (const c of creatives) {
    const m = c.metrics || {};
    spendSum += safeNumber(m.spend);
    roasSum += safeNumber(m.roas);
    ctrSum += safePercent(m.ctr);
    cpmSum += safeNumber(m.cpm);
    if (c.score > topScore) topScore = c.score || 0;
  }

  const len = creatives.length;

  return {
    totalSpend: spendSum,
    avgRoas: len ? roasSum / len : 0,
    avgCtr: len ? ctrSum / len : 0,
    avgCpm: len ? cpmSum / len : 0,
    topScore,
  };
}

/* ----------------------------------------------------------
   Helpers
-----------------------------------------------------------*/

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safePercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  // Wenn jemand 4.1 statt 0.041 liefert, normalisieren
  return n > 1 ? n / 100 : n;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
