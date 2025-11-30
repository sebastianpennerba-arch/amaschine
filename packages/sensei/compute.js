/* ----------------------------------------------------------
   SENSEI – compute.js
   Premium AI Strategy Layer (Demo Logik)
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Bewertung eines Creatives (AI-Style)
-----------------------------------------------------------*/
function scoreCreative(c) {
  const m = c.metrics;

  const hookScore = c.hook.includes("Problem") ? 0.9 : c.hook.includes("Story") ? 0.75 : 0.6;
  const roasScore = Math.min(m.roas / 6, 1);
  const ctrScore = Math.min((m.ctr * 100) / 4, 1);
  const cpmScore = m.cpm < 8 ? 1 : m.cpm < 12 ? 0.7 : 0.4;

  const final = (hookScore + roasScore + ctrScore + cpmScore) / 4;

  let label = "GOOD";
  if (final < 0.35) label = "CRITICAL";
  else if (final < 0.65) label = "WARNING";

  return {
    score: Math.round(final * 100),
    label,
  };
}

/* ----------------------------------------------------------
   Empfehlungen generieren
-----------------------------------------------------------*/
export function generateSenseiInsights(creatives) {
  return creatives.slice(0, 6).map((c) => {
    const evalScore = scoreCreative(c);

    const recommendation =
      evalScore.label === "GOOD"
        ? "Skalieren – Performance stabil & effizient."
        : evalScore.label === "WARNING"
        ? "Varianten testen – Hook / First Frame optimieren."
        : "Stoppen – Budget in Winner umschichten.";

    return {
      id: c.id,
      name: c.name,
      creator: c.creator,
      hook: c.hook,
      metrics: c.metrics,
      score: evalScore.score,
      label: evalScore.label,
      recommendation,
    };
  });
}

/* ----------------------------------------------------------
   Sensei Summary
-----------------------------------------------------------*/
export function computeSenseiSummary(data) {
  if (!data || !data.length) {
    return {
      avgScore: "–",
      good: 0,
      warning: 0,
      critical: 0,
    };
  }

  let good = 0, warning = 0, critical = 0, totalScore = 0;

  data.forEach((d) => {
    totalScore += d.score;
    if (d.label === "GOOD") good++;
    if (d.label === "WARNING") warning++;
    if (d.label === "CRITICAL") critical++;
  });

  return {
    avgScore: Math.round(totalScore / data.length),
    good,
    warning,
    critical,
  };
}
