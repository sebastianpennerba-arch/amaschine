/* ----------------------------------------------------------
   CREATOR INSIGHTS – compute.js
   Premium VisionOS Intelligence Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Creator Aggregation
-----------------------------------------------------------*/
export function buildCreatorInsights(creatives) {
  const map = {};

  creatives.forEach((c) => {
    const creator = c.creator || "Unknown";

    if (!map[creator]) {
      map[creator] = {
        creator,
        items: [],
        spend: 0,
        roas: 0,
        ctr: 0,
        count: 0,
      };
    }

    map[creator].items.push(c);
    map[creator].spend += c.metrics.spend;
    map[creator].roas += c.metrics.roas;
    map[creator].ctr += c.metrics.ctr;
    map[creator].count++;
  });

  return Object.values(map).map((c) => ({
    creator: c.creator,
    spend: c.spend,
    avgRoas: c.roas / c.count,
    avgCtr: c.ctr / c.count,
    count: c.count,
    items: c.items,
  }));
}

/* ----------------------------------------------------------
   Summary
-----------------------------------------------------------*/
export function computeCreatorSummary(list) {
  if (!list.length)
    return { creators: 0, spend: "–", avgRoas: "–", avgCtr: "–" };

  let spend = 0,
    roas = 0,
    ctr = 0;

  let total = 0;

  list.forEach((c) => {
    spend += c.spend;
    roas += c.avgRoas;
    ctr += c.avgCtr;
    total++;
  });

  return {
    creators: total,
    spend: formatCurrency(spend),
    avgRoas: formatNumber(roas / total, 1, "x"),
    avgCtr: formatPercent((ctr / total) * 100, 1),
  };
}
