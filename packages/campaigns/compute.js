/* ----------------------------------------------------------
   CAMPAIGNS – compute.js
   Vollversion • Premium Analytics Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Health Score Berechnung für jede Kampagne
-----------------------------------------------------------*/
function computeHealthScore(c) {
  if (!c || !c.metrics) return { score: 0, label: "unknown" };

  const m = c.metrics;

  const roasScore = Math.min(m.roas / 6, 1);       // 6x ROAS = 100%
  const ctrScore = Math.min((m.ctr * 100) / 4, 1); // 4% CTR = 100%
  const cpmScore = m.cpm < 8 ? 1 : m.cpm < 12 ? 0.6 : 0.3;
  const spendScore = Math.min(m.spend / 20000, 1);

  const finalScore = (roasScore + ctrScore + cpmScore + spendScore) / 4;

  let label = "good";
  if (finalScore < 0.35) label = "critical";
  else if (finalScore < 0.65) label = "warning";

  return {
    score: Math.round(finalScore * 100),
    label,
  };
}

/* ----------------------------------------------------------
   Kampagnen zusammenbauen
-----------------------------------------------------------*/
export function buildCampaignsForBrand(brandId, DemoData) {
  if (!brandId || !DemoData) return [];

  const raw = DemoData.campaignsByBrand[brandId] || [];

  return raw.map((c) => {
    // Demo-Performance generieren
    const spend = Math.round(2000 + Math.random() * 18000);
    const roas = Number((2 + Math.random() * 4).toFixed(1));
    const ctr = Number((0.01 + Math.random() * 0.03).toFixed(3));
    const cpm = Number((6 + Math.random() * 6).toFixed(1));
    const purchases = Math.round(spend / (20 + Math.random() * 30));

    const metrics = { spend, roas, ctr, cpm, purchases };

    const health = computeHealthScore({ metrics });

    return {
      ...c,
      metrics,
      health,
    };
  });
}

/* ----------------------------------------------------------
   Aggregierte KPIs (oben im Header)
-----------------------------------------------------------*/
export function computeCampaignSummary(campaigns) {
  if (!campaigns || !campaigns.length) {
    return {
      spendTotal: "–",
      avgROAS: "–",
      avgCTR: "–",
      activeCount: 0,
      testingCount: 0,
      pausedCount: 0,
    };
  }

  let spend = 0;
  let roas = 0;
  let ctr = 0;

  let active = 0;
  let paused = 0;
  let testing = 0;

  campaigns.forEach((c) => {
    spend += c.metrics.spend;
    roas += c.metrics.roas;
    ctr += c.metrics.ctr;

    if (c.status === "ACTIVE") active++;
    if (c.status === "PAUSED") paused++;
    if (c.status === "TESTING") testing++;
  });

  return {
    spendTotal: formatCurrency(spend),
    avgROAS: formatNumber(roas / campaigns.length, 1, "x"),
    avgCTR: formatPercent((ctr / campaigns.length) * 100, 1),
    activeCount: active,
    testingCount: testing,
    pausedCount: paused,
  };
}
