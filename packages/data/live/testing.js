// packages/data/live/testing.js
// -----------------------------------------------------------------------------
// LIVE Testing Log – rekonstruiert aus Creatives + Insights
// Ziel: Hook-Battles, Creative-Versionen, Winner-Loser erkennen
// -----------------------------------------------------------------------------

export async function buildLiveTestingLog({ creatives, insightsByCreative }) {
  if (!Array.isArray(creatives) || !creatives.length)
    return { _source: "live", items: [] };

  const groups = {};

  creatives.forEach((cre) => {
    const name = cre.name || "";
    const baseName = name
      .replace(/v\d+/gi, "")
      .replace(/Version\s*\d+/gi, "")
      .trim();

    if (!groups[baseName]) groups[baseName] = [];

    const insights = insightsByCreative[cre.id] || null;

    groups[baseName].push({
      id: cre.id,
      name: cre.name,
      base: baseName,
      thumbnail: cre.thumbnail,
      metrics: insights
        ? {
            spend: insights.spend,
            roas: insights.roas,
            ctr: insights.ctr,
            cpm: insights.cpm,
            purchases: insights.purchases,
            impressions: insights.impressions,
          }
        : null,
    });
  });

  const items = Object.values(groups).map((variations) => {
    const sorted = variations
      .filter((v) => v.metrics)
      .sort((a, b) => b.metrics.roas - a.metrics.roas);

    const winner = sorted[0] || null;

    return {
      testName: variations[0].base,
      variations,
      winner,
      loser: sorted[sorted.length - 1] || null,
      variationCount: variations.length,
    };
  });

  return {
    _source: "live",
    items,
  };
}
