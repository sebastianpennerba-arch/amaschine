/* ----------------------------------------------------------
   TESTING LOG – compute.js
   Premium Version • Deep Analysis Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Generiert Demo-Testing-Daten basierend auf Creatives
-----------------------------------------------------------*/
export function buildTestingLog(creatives) {
  if (!creatives || !creatives.length) return [];

  return creatives
    .filter((c) => c.bucket === "testing")
    .map((c) => {
      const metrics = c.metrics;

      // Trend Simulation
      const trend = Array.from({ length: 7 }).map(() =>
        Number((metrics.roas * (0.8 + Math.random() * 0.4)).toFixed(1))
      );

      // Status
      const state =
        metrics.roas > 4
          ? "HOT"
          : metrics.roas > 3
          ? "OK"
          : "COLD";

      return {
        id: c.id,
        name: c.name,
        creator: c.creator,
        hook: c.hook,
        daysActive: c.daysActive,
        campaignName: c.campaignName,
        trend,
        metrics,
        state,
      };
    });
}

/* ----------------------------------------------------------
   Summary KPIs
-----------------------------------------------------------*/
export function computeTestingSummary(list) {
  if (!list.length) return {
    total: 0,
    hot: 0,
    cold: 0,
    avgRoas: "–",
    avgCpm: "–",
    avgCtr: "–",
  };

  let hot = 0;
  let cold = 0;

  let roas = 0;
  let cpm = 0;
  let ctr = 0;

  list.forEach((t) => {
    if (t.state === "HOT") hot++;
    if (t.state === "COLD") cold++;
    roas += t.metrics.roas;
    cpm += t.metrics.cpm;
    ctr += t.metrics.ctr;
  });

  return {
    total: list.length,
    hot,
    cold,
    avgRoas: formatNumber(roas / list.length, 1, "x"),
    avgCpm: formatCurrency(cpm / list.length),
    avgCtr: formatPercent((ctr / list.length) * 100, 1),
  };
}
