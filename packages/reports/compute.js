/* ----------------------------------------------------------
   REPORTS – compute.js
   Premium Reporting Engine (Demo Logik)
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Tagesdaten simulieren
-----------------------------------------------------------*/
export function buildDailyReport(creatives) {
  const days = 14;
  const rows = [];

  for (let i = 0; i < days; i++) {
    const spend = Math.round(2000 + Math.random() * 8000);
    const roas = Number((2 + Math.random() * 4).toFixed(1));
    const ctr = Number((0.01 + Math.random() * 0.03).toFixed(3));
    const cpm = Number((6 + Math.random() * 6).toFixed(1));
    const purchases = Math.round(spend / (20 + Math.random() * 25));

    rows.push({
      date: new Date(Date.now() - i * 86400000).toLocaleDateString("de-DE"),
      spend,
      roas,
      ctr,
      cpm,
      purchases,
    });
  }

  return rows.reverse();
}

/* ----------------------------------------------------------
   Summary
-----------------------------------------------------------*/
export function computeReportSummary(rows) {
  if (!rows.length)
    return { spend: "–", roas: "–", ctr: "–", cpm: "–", purchases: "–" };

  let spend = 0,
    roas = 0,
    ctr = 0,
    cpm = 0,
    purchases = 0;

  rows.forEach((r) => {
    spend += r.spend;
    roas += r.roas;
    ctr += r.ctr;
    cpm += r.cpm;
    purchases += r.purchases;
  });

  const count = rows.length;

  return {
    spend: formatCurrency(spend),
    roas: formatNumber(roas / count, 1, "x"),
    ctr: formatPercent((ctr / count) * 100, 1),
    cpm: formatCurrency(cpm / count),
    purchases,
  };
}
