// packages/sensei/compute.js
// -----------------------------------------------------------------------------
// Sensei Compute Layer
// - Normalisiert die rohe Sensei-Analyse (Demo + Live) in ein einheitliches Modell
// - Liefert: Totals, Creative-Liste, Offer-/Hook-Insights, Recommendations
// -----------------------------------------------------------------------------

/**
 * Klassifiziert den Ton der Empfehlung / Health.
 * Ergebnis wird für Emoji + semantische Einordnung genutzt.
 */
export function classifyTone(score, label) {
  const s = Number(score);
  const normalizedScore = Number.isFinite(s) ? s : null;
  const lbl = (label || "").toLowerCase();

  if (lbl === "winner" || lbl === "strong") return "good";
  if (lbl === "loser" || lbl === "underperforming") return "critical";

  if (normalizedScore != null) {
    if (normalizedScore >= 80) return "good";
    if (normalizedScore <= 45) return "critical";
    return "warning";
  }

  return "warning";
}

/**
 * Normalisiert die Roh-Antwort aus:
 * - DataLayer.buildDemoSenseiResponse()
 * - Live /api/sensei/analyze
 *
 * Rückgabe:
 * {
 *   meta: { mode, source, createdAt },
 *   totals: { totalCreatives, totalSpend, totalRevenue, avgRoas, avgCtr, avgCpm, avgScore },
 *   creatives: [...],
 *   offer,
 *   hook,
 *   recommendations: [...]
 * }
 */
export function normalizeSenseiAnalysis(raw, context = {}) {
  if (!raw || raw.success === false) {
    return null;
  }

  const performance = raw.performance || {};
  const metaMode = raw.mode || performance.mode || context.mode || "demo";
  const source =
    raw._source || performance._source || (metaMode === "demo" ? "demo" : "live");

  // 1) Creatives sammeln ------------------------------------------------------
  const creativeSource =
    performance.creatives ||
    performance.scoredCreatives ||
    raw.creatives ||
    raw.items ||
    [];

  const creatives = Array.isArray(creativeSource)
    ? creativeSource.map((c, index) => normalizeCreative(c, index))
    : [];

  // 2) Totals berechnen -------------------------------------------------------
  const totals = computeTotals(creatives, performance);

  // 3) Offer / Hook / Recommendations ----------------------------------------
  const offerBlock = normalizeOffer(raw.offer || performance.offer || null);
  const hookBlock = normalizeHook(raw.hook || performance.hook || null);
  const recommendations = normalizeRecommendations(
    raw.recommendations || performance.recommendations || [],
  );

  return {
    meta: {
      mode: metaMode,
      source,
      createdAt:
        raw.generatedAt || raw.createdAt || performance.generatedAt || null,
      accountId: context.accountId || null,
    },
    totals,
    creatives,
    offer: offerBlock,
    hook: hookBlock,
    recommendations,
  };
}

// -----------------------------------------------------------------------------
// Helpers – Creatives & KPIs
// -----------------------------------------------------------------------------

function normalizeCreative(raw, index) {
  const metrics = raw.metrics || {};
  const score = toNumber(raw.score, null);
  const label =
    raw.label ||
    raw.healthLabel ||
    (score != null
      ? score >= 80
        ? "Winner"
        : score >= 60
          ? "Strong"
          : score >= 40
            ? "Neutral"
            : "Loser"
      : "Neutral");

  const hookLabel = raw.hookLabel || raw.hook || raw.storyHook || null;
  const fatigue = raw.fatigue || raw.fatigueLabel || null;
  const tone = classifyTone(score, label);

  return {
    id: raw.id || `sensei_cre_${index}`,
    name: raw.name || raw.title || "Unbenanntes Creative",
    creator: raw.creator || raw.owner || "Unbekannt",
    hookLabel,
    label,
    tone,
    fatigue,
    score,
    metrics: {
      roas: toNumber(metrics.roas),
      spend: toNumber(metrics.spend),
      ctr: toNumber(metrics.ctr),
      cpm: toNumber(metrics.cpm),
      purchases: toNumber(metrics.purchases),
      impressions: toNumber(metrics.impressions),
      clicks: toNumber(metrics.clicks),
      revenue: toNumber(metrics.revenue),
    },
  };
}

function computeTotals(creatives, performance) {
  // Wenn das Backend bereits aggregierte Totals liefert, nutzen wir die bevorzugt
  const agg = performance.totals || performance.summary || {};

  let totalSpend = 0;
  let totalRevenue = 0;
  let avgRoas = toNumber(agg.avgRoas, null);
  let avgCtr = toNumber(agg.avgCtr, null);
  let avgCpm = toNumber(agg.avgCpm, null);
  let avgScore = toNumber(agg.avgScore, null);

  let roasSum = 0;
  let roasCount = 0;
  let ctrSum = 0;
  let ctrCount = 0;
  let cpmSum = 0;
  let cpmCount = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  creatives.forEach((c) => {
    const m = c.metrics || {};

    if (Number.isFinite(m.spend)) {
      totalSpend += m.spend;
    }
    if (Number.isFinite(m.revenue)) {
      totalRevenue += m.revenue;
    } else if (Number.isFinite(m.roas) && Number.isFinite(m.spend)) {
      totalRevenue += m.roas * m.spend;
    }

    if (Number.isFinite(m.roas)) {
      roasSum += m.roas;
      roasCount++;
    }
    if (Number.isFinite(m.ctr)) {
      ctrSum += m.ctr;
      ctrCount++;
    }
    if (Number.isFinite(m.cpm)) {
      cpmSum += m.cpm;
      cpmCount++;
    }
    if (Number.isFinite(c.score)) {
      scoreSum += c.score;
      scoreCount++;
    }
  });

  if (avgRoas == null && roasCount > 0) {
    avgRoas = roasSum / roasCount;
  }
  if (avgCtr == null && ctrCount > 0) {
    avgCtr = ctrSum / ctrCount;
  }
  if (avgCpm == null && cpmCount > 0) {
    avgCpm = cpmSum / cpmCount;
  }
  if (avgScore == null && scoreCount > 0) {
    avgScore = scoreSum / scoreCount;
  }

  return {
    totalCreatives: creatives.length,
    totalSpend,
    totalRevenue,
    avgRoas: avgRoas || 0,
    avgCtr: avgCtr || 0,
    avgCpm: avgCpm || 0,
    avgScore: avgScore || 0,
  };
}

// -----------------------------------------------------------------------------
// Helpers – Offer / Hook / Recommendations
// -----------------------------------------------------------------------------

function normalizeOffer(rawOffer) {
  if (!rawOffer) return null;

  return {
    headline: rawOffer.headline || rawOffer.title || "Offer & Funnel Diagnose",
    summary:
      rawOffer.summary ||
      rawOffer.overview ||
      "Sensei hat deine Offer- & Funnel-Struktur analysiert.",
    primaryIssue:
      rawOffer.primaryIssue ||
      rawOffer.mainIssue ||
      null,
    issues: Array.isArray(rawOffer.issues) ? rawOffer.issues : [],
    recommendations: Array.isArray(rawOffer.recommendations)
      ? rawOffer.recommendations
      : [],
  };
}

function normalizeHook(rawHook) {
  if (!rawHook) return null;

  return {
    headline: rawHook.headline || "Hook- & Story-Analyse",
    summary:
      rawHook.summary ||
      rawHook.overview ||
      "Sensei hat deine Hook-Struktur und Story-Patterns bewertet.",
    patterns: Array.isArray(rawHook.patterns) ? rawHook.patterns : [],
    recommendations: Array.isArray(rawHook.recommendations)
      ? rawHook.recommendations
      : [],
  };
}

function normalizeRecommendations(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item, index) => {
    if (typeof item === "string") {
      return { id: `rec_${index}`, text: item, category: "general" };
    }
    return {
      id: item.id || `rec_${index}`,
      text: item.text || item.description || "Empfehlung ohne Beschreibung",
      category: item.category || item.type || "general",
      priority: item.priority || "normal",
    };
  });
}

// -----------------------------------------------------------------------------
// Primitive Helper
// -----------------------------------------------------------------------------

function toNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}
