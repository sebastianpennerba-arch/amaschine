// packages/sensei/compute.js
// --------------------------------------------------------
// Hilfsfunktionen für Sensei-Frontend:
// - Normalisierung der Backend-Antwort
// - Tonalität (good / warning / critical)
// - Formatierung für UI
// --------------------------------------------------------

function avg(list) {
  if (!Array.isArray(list) || !list.length) return 0;
  const sum = list.reduce((acc, v) => acc + (Number(v) || 0), 0);
  return sum / list.length;
}

/**
 * Score → Badge-Typ (good / warning / critical)
 * Optionaler Fallback über Label (Winner / Testing / Loser).
 */
export function classifyTone(score, label) {
  const s = Number.isFinite(score) ? score : 0;
  const normalizedLabel = (label || "").toLowerCase();

  if (normalizedLabel.includes("winner") || normalizedLabel.includes("strong")) {
    return "good";
  }
  if (normalizedLabel.includes("loser")) {
    return "critical";
  }
  if (normalizedLabel.includes("test") || normalizedLabel.includes("review")) {
    return "warning";
  }

  if (s >= 70) return "good";
  if (s >= 40) return "warning";
  return "critical";
}

/**
 * Normalisiert die Backend-Analyse in ein UI-freundliches Objekt.
 * Erwartet die Antwort von /api/sensei/analyze.
 */
export function normalizeSenseiAnalysis(raw) {
  if (!raw || typeof raw !== "object") return null;

  const performance = raw.performance || {};
  const summary = performance.summary || {};
  const scoring = Array.isArray(performance.scoring)
    ? performance.scoring
    : [];

  const scores = scoring.map((s) => Number(s.score || 0));
  const avgScore =
    Number.isFinite(summary.avgScore) && summary.avgScore > 0
      ? summary.avgScore
      : avg(scores);

  const tones = scoring.map((s) => classifyTone(s.score, s.label));
  const goodCount = tones.filter((t) => t === "good").length;
  const warningCount = tones.filter((t) => t === "warning").length;
  const criticalCount = tones.filter((t) => t === "critical").length;

  const creativeInsights = scoring.map((s, idx) => {
    const metrics = s.metrics || {};
    const tone = classifyTone(s.score, s.label);

    return {
      id: s.id || s.creativeId || s.metaId || `creative_${idx}`,
      name: s.name || s.title || "Unbenannte Creative",
      creator: s.creator || s.author || null,
      hookLabel: s.hookLabel || s.hook || "",
      isTesting: !!s.isTesting,
      fatigue: s.fatigue ?? null,
      label: s.label || "",
      tone,
      score: Number(s.score || 0),
      reasoning: s.reasoning || "",
      metrics: {
        roas: Number(metrics.roas ?? metrics.roas30d ?? 0),
        spend: Number(metrics.spend ?? metrics.spend30d ?? 0),
        revenue: Number(metrics.revenue ?? 0),
        ctr: Number(metrics.ctr ?? metrics.ctrPct ?? 0),
        cpm: Number(metrics.cpm ?? 0),
        purchases: Number(metrics.purchases ?? metrics.conversions ?? 0),
      },
    };
  });

  return {
    raw,
    source: raw._source || "demo",
    totals: {
      totalCreatives:
        summary.totalCreatives || creativeInsights.length || 0,
      avgScore,
      goodCount,
      warningCount,
      criticalCount,
      totalSpend: Number(summary.totalSpend ?? 0),
      totalRevenue: Number(summary.totalRevenue ?? 0),
      avgRoas: Number(summary.avgRoas ?? 0),
      avgCtr: Number(summary.avgCtr ?? 0),
      avgCpm: Number(summary.avgCpm ?? 0),
    },
    creatives: creativeInsights,
    offer: raw.offer || null,
    hook: raw.hook || null,
    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations
      : [],
  };
}

/**
 * Format-Helper für das UI
 */
export function formatCurrency(value) {
  const v = Number(value || 0);
  return v.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

export function formatNumber(value) {
  const v = Number(value || 0);
  return v.toLocaleString("de-DE", {
    maximumFractionDigits: 0,
  });
}

export function formatPercent(value) {
  const v = Number(value || 0);
  return `${v.toFixed(1).replace(".", ",")}%`;
}
