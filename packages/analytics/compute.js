/* ----------------------------------------------------------
   ANALYTICS – compute.js
   Premium Cross-KPI Analytics Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Demo KPI Generierung
-----------------------------------------------------------*/
export function buildAnalytics(creatives) {
  const totals = {
    spend: 0,
    roas: 0,
    ctr: 0,
    cpm: 0,
    purchases: 0,
    count: creatives.length
  };

  creatives.forEach((c) => {
    totals.spend += c.metrics.spend;
    totals.roas += c.metrics.roas;
    totals.ctr += c.metrics.ctr;
    totals.cpm += c.metrics.cpm;
    totals.purchases += c.metrics.purchases;
  });

  const avg = {
    spend: formatCurrency(totals.spend),
    roas: formatNumber(totals.roas / totals.count, 1, "x"),
    ctr: formatPercent((totals.ctr / totals.count) * 100, 1),
    cpm: formatCurrency(totals.cpm / totals.count),
    purchases: totals.purchases
  };

  /* Trend Simulation */
  const spendTrend = Array.from({ length: 14 }).map(
    () => Math.round((totals.spend / totals.count) * (0.8 + Math.random() * 0.4))
  );
  const roasTrend = Array.from({ length: 14 }).map(
    () => Number(((totals.roas / totals.count) * (0.8 + Math.random() * 0.4)).toFixed(1))
  );

  return { avg, spendTrend, roasTrend };
}
