// packages/data/demo/creatives.js
// -----------------------------------------------------------------------------
// DEMO Creatives (Premium + realistisch für Präsentationen)
// -----------------------------------------------------------------------------

export function demoCreativesForAccount() {
  return [
    {
      id: "cre-ugc-problem",
      name: "UGC Problem/Solution – Scale",
      type: "UGC",
      hook: "Problem/Solution",
      thumbnail: null,
      metrics: {
        spend: 14800,
        impressions: 480000,
        clicks: 18400,
        ctr: 3.8,
        cpm: 7.6,
        purchases: 1150,
        roas: 5.4
      }
    },
    {
      id: "cre-static-offer",
      name: "Static – Mid Funnel Offer",
      type: "STATIC",
      hook: "Offer / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 9600,
        impressions: 310000,
        clicks: 8200,
        ctr: 2.7,
        cpm: 8.2,
        purchases: 410,
        roas: 4.1
      }
    },
    {
      id: "cre-ugc-hb",
      name: "UGC Hook Battle V2",
      type: "UGC",
      hook: "Hook Battle",
      thumbnail: null,
      metrics: {
        spend: 7200,
        impressions: 240000,
        clicks: 6900,
        ctr: 2.87,
        cpm: 7.2,
        purchases: 320,
        roas: 4.5
      }
    },
    {
      id: "cre-static-broad",
      name: "Static Broad CTA",
      type: "STATIC",
      hook: "CTA",
      thumbnail: null,
      metrics: {
        spend: 4800,
        impressions: 160000,
        clicks: 3700,
        ctr: 2.31,
        cpm: 7.8,
        purchases: 140,
        roas: 3.2
      }
    },
    {
      id: "cre-retarget-sp",
      name: "Retargeting – Social Proof",
      type: "CAROUSEL",
      hook: "Social Proof",
      thumbnail: null,
      metrics: {
        spend: 4200,
        impressions: 152000,
        clicks: 4300,
        ctr: 2.82,
        cpm: 7.6,
        purchases: 180,
        roas: 4.9
      }
    }
  ];
}

export function demoCreativeInsights(creativeId) {
  return [
    {
      impressions: 120000,
      clicks: 4200,
      spend: 3800,
      ctr: 3.5,
      cpm: 7.4,
      purchases: 210,
      roas: 5.1,
      creativeId
    }
  ];
}
