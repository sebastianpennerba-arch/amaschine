// packages/data/demo/testing.js
// -----------------------------------------------------------------------------
// DEMO Testing Log (Premium + Realistisch)
// -----------------------------------------------------------------------------

export function demoTestingLog() {
  return {
    _source: "demo",
    items: [
      {
        testName: "UGC Hook-Battle – Scrollstop vs. Problem",
        variationCount: 2,
        winner: {
          id: "var_ugc_pb",
          name: "UGC Problem Solver – V2",
          metrics: {
            spend: 4200,
            roas: 6.1,
            ctr: 4.3,
            cpm: 7.1,
            purchases: 310,
            impressions: 180000,
          },
        },
        loser: {
          id: "var_ugc_sc",
          name: "UGC Scrollstop – V1",
          metrics: {
            spend: 4100,
            roas: 3.4,
            ctr: 2.1,
            cpm: 9.2,
            purchases: 140,
            impressions: 170000,
          },
        },
        variations: [
          {
            id: "var_ugc_sc",
            name: "UGC Scrollstop – V1",
            metrics: {
              spend: 4100,
              roas: 3.4,
              ctr: 2.1,
              cpm: 9.2,
              purchases: 140,
              impressions: 170000,
            },
          },
          {
            id: "var_ugc_pb",
            name: "UGC Problem Solver – V2",
            metrics: {
              spend: 4200,
              roas: 6.1,
              ctr: 4.3,
              cpm: 7.1,
              purchases: 310,
              impressions: 180000,
            },
          },
        ],
      },
      {
        testName: "Static Offer – V1 vs V2 vs V3",
        variationCount: 3,
        winner: {
          id: "static_v3",
          name: "Static Offer – V3 (Red CTA)",
          metrics: {
            spend: 2800,
            roas: 5.4,
            ctr: 3.1,
            cpm: 8.1,
            purchases: 120,
            impressions: 120000,
          },
        },
        loser: {
          id: "static_v1",
          name: "Static Offer – V1",
          metrics: {
            spend: 2600,
            roas: 2.1,
            ctr: 1.1,
            cpm: 11.2,
            purchases: 44,
            impressions: 130000,
          },
        },
        variations: [
          {
            id: "static_v1",
            name: "Static Offer – V1",
            metrics: {
              spend: 2600,
              roas: 2.1,
              ctr: 1.1,
              cpm: 11.2,
              purchases: 44,
              impressions: 130000,
            },
          },
          {
            id: "static_v2",
            name: "Static Offer – V2",
            metrics: {
              spend: 2700,
              roas: 3.6,
              ctr: 2.2,
              cpm: 9.8,
              purchases: 75,
              impressions: 125000,
            },
          },
          {
            id: "static_v3",
            name: "Static Offer – V3 (Red CTA)",
            metrics: {
              spend: 2800,
              roas: 5.4,
              ctr: 3.1,
              cpm: 8.1,
              purchases: 120,
              impressions: 120000,
            },
          },
        ],
      },
    ],
  };
}
