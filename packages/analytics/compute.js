/*
 * Analytics Compute
 * Stellt Analysefunktionen bereit: Performance Map, Hook-Analyse,
 * Funnel Score.
 */

export function computePerformanceMap(creatives) {
  return creatives.map((c) => ({
    id: c.id,
    x: c.spend,
    y: c.roas,
  }));
}

export function computeHookStats(creatives) {
  const hooks = {};
  creatives.forEach((c) => {
    if (!hooks[c.hook]) hooks[c.hook] = { count: 0, roasSum: 0 };
    hooks[c.hook].count += 1;
    hooks[c.hook].roasSum += c.roas;
  });
  return Object.keys(hooks).map((hook) => ({
    hook,
    count: hooks[hook].count,
    avgRoas: hooks[hook].roasSum / hooks[hook].count,
  }));
}

export function computeFunnelScore(funnel) {
  const ctr = funnel.clicks / funnel.impressions || 0;
  const cvRate = funnel.purchases / funnel.clicks || 0;
  // Score simple: 50% CTR, 50% CR
  const score = ((ctr * 100) / 4 + (cvRate * 100) / 4) / 2; // normiert auf 0–100
  return { ctr, cvRate, score: score / 100 };
}
