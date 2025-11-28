/*
 * Creative Library Compute
 * Bereitet KPI-Daten auf und berechnet einen Score (0–100)
 * basierend auf ROAS, CTR, Spend und Status.
 */

/**
 * Berechnet einen Score von 0–100 für ein Creative.
 * Grobe Heuristik für Demo/Prototype – kann später durch
 * echtes Modell ersetzt werden.
 */
export function computeCreativeScore(creative) {
  const roas = creative.roas || 0;
  const ctr = creative.ctr || 0;
  const spend = creative.spend || 0;

  // ROAS Anteil (max 8x)
  const roasScore = Math.min(roas, 8) / 8; // 0–1
  // CTR Anteil (max 5%)
  const ctrScore = Math.min(ctr, 0.05) / 0.05; // 0–1
  // Spend Anteil (max 10k)
  const spendScore = Math.min(spend, 10000) / 10000; // 0–1

  // Basisgewichtung
  let score = roasScore * 0.5 + ctrScore * 0.3 + spendScore * 0.2;

  // Status-Bonus/Penalty
  if (creative.tags?.includes("Winner")) {
    score += 0.15;
  }
  if (creative.tags?.includes("Loser")) {
    score -= 0.25;
  }

  if (creative.status === "testing") {
    score += 0.05;
  }
  if (creative.status === "paused") {
    score -= 0.1;
  }

  score = Math.max(0, Math.min(score, 1));
  return Math.round(score * 100);
}

/**
 * Rechnet alle KPI-Werte und Score ein.
 */
export function enrichCreatives(creatives) {
  return creatives.map((c) => ({
    ...c,
    score: computeCreativeScore(c),
  }));
}
