/*
 * Creator Insights Compute
 * Konsolidiert Kampagnen- und Creative-Daten pro Creator.
 */

export function aggregateByCreator(creatives) {
  const byCreator = {};
  creatives.forEach((c) => {
    if (!byCreator[c.creator]) {
      byCreator[c.creator] = { count: 0, roasSum: 0, spendSum: 0 };
    }
    byCreator[c.creator].count += 1;
    byCreator[c.creator].roasSum += c.roas;
    byCreator[c.creator].spendSum += c.spend;
  });
  return Object.keys(byCreator).map((creator) => ({
    creator,
    count: byCreator[creator].count,
    avgRoas: byCreator[creator].roasSum / byCreator[creator].count,
    spend: byCreator[creator].spendSum,
  }));
}
