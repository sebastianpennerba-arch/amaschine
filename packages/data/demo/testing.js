// packages/data/demo/testing.js
// -----------------------------------------------------------------------------
// DEMO Testing Log (Premium + Realistisch)
// -----------------------------------------------------------------------------
//
// Ziel:
// - Mehrere Test-Szenarien (Hook-Battles, Offer-Varianten, UGC vs Static)
// - Winner/Loser klar erkennbar
// - Ideal für Testing Log View & Sensei-Interpretation
// -----------------------------------------------------------------------------

export function demoTestingLog() {
  return {
    _source: "demo",
    items: [
      // 1) UGC Hook Battle – klarer Winner
      {
        testName: "UGC Hook-Battle – Social Proof vs Problem",
        variationCount: 2,
        winner: {
          id: "cre_ugc_hookbattle_problem",
          name: "UGC Hook Battle – Problem Story",
          metrics: {
            spend: 7100,
            roas: 4.9,
            ctr: 3.15,
            cpm: 7.2,
            purchases: 340,
            impressions: 235000,
          },
        },
        loser: {
          id: "cre_ugc_hookbattle_sp",
          name: "UGC Hook Battle – Social Proof",
          metrics: {
            spend: 7200,
            roas: 4.5,
            ctr: 2.87,
            cpm: 7.2,
            purchases: 320,
            impressions: 240000,
          },
        },
        variations: [
          {
            id: "cre_ugc_hookbattle_sp",
            name: "UGC Hook Battle – Social Proof",
            metrics: {
              spend: 7200,
              roas: 4.5,
              ctr: 2.87,
              cpm: 7.2,
              purchases: 320,
              impressions: 240000,
            },
          },
          {
            id: "cre_ugc_hookbattle_problem",
            name: "UGC Hook Battle – Problem Story",
            metrics: {
              spend: 7100,
              roas: 4.9,
              ctr: 3.15,
              cpm: 7.2,
              purchases: 340,
              impressions: 235000,
            },
          },
        ],
      },

      // 2) Static Offer – V1 vs V2 vs V3
      {
        testName: "Static Offer – V1 vs V2 vs V3",
        variationCount: 3,
        winner: {
          id: "cre_static_offer_v3_red",
          name: "Static Offer – V3 (Red CTA)",
          metrics: {
            spend: 6800,
            roas: 4.9,
            ctr: 3.09,
            cpm: 8.2,
            purchases: 340,
            impressions: 220000,
          },
        },
        loser: {
          id: "cre_static_offer_v1",
          name: "Static Offer – V1 (Blue CTA)",
          metrics: {
            spend: 6200,
            roas: 3.6,
            ctr: 2.43,
            cpm: 7.9,
            purchases: 260,
            impressions: 210000,
          },
        },
        variations: [
          {
            id: "cre_static_offer_v1",
            name: "Static Offer – V1 (Blue CTA)",
            metrics: {
              spend: 6200,
              roas: 3.6,
              ctr: 2.43,
              cpm: 7.9,
              purchases: 260,
              impressions: 210000,
            },
          },
          {
            id: "cre_static_offer_v2",
            name: "Static Offer – V2 (Green CTA)",
            metrics: {
              spend: 6400,
              roas: 4.1,
              ctr: 2.7,
              cpm: 8.0,
              purchases: 310,
              impressions: 215000,
            },
          },
          {
            id: "cre_static_offer_v3_red",
            name: "Static Offer – V3 (Red CTA)",
            metrics: {
              spend: 6800,
              roas: 4.9,
              ctr: 3.09,
              cpm: 8.2,
              purchases: 340,
              impressions: 220000,
            },
          },
        ],
      },

      // 3) UGC vs Static (Top Funnel)
      {
        testName: "Top Funnel – UGC vs Static",
        variationCount: 2,
        winner: {
          id: "cre_tiktok_style_vertical",
          name: "TikTok Style Vertical – Raw Cut",
          metrics: {
            spend: 3900,
            roas: 2.9,
            ctr: 3.29,
            cpm: 7.3,
            purchases: 110,
            impressions: 140000,
          },
        },
        loser: {
          id: "cre_static_brandframe",
          name: "Static Brand Frame – Weak Hook",
          metrics: {
            spend: 5400,
            roas: 1.8,
            ctr: 1.37,
            cpm: 8.5,
            purchases: 70,
            impressions: 190000,
          },
        },
        variations: [
          {
            id: "cre_static_brandframe",
            name: "Static Brand Frame – Weak Hook",
            metrics: {
              spend: 5400,
              roas: 1.8,
              ctr: 1.37,
              cpm: 8.5,
              purchases: 70,
              impressions: 190000,
            },
          },
          {
            id: "cre_tiktok_style_vertical",
            name: "TikTok Style Vertical – Raw Cut",
            metrics: {
              spend: 3900,
              roas: 2.9,
              ctr: 3.29,
              cpm: 7.3,
              purchases: 110,
              impressions: 140000,
            },
          },
        ],
      },

      // 4) Retargeting – Creative Varianten
      {
        testName: "Retargeting – Carousel vs Static Reminder",
        variationCount: 2,
        winner: {
          id: "cre_retarg_carousel_reviews",
          name: "Retargeting Carousel – Reviews",
          metrics: {
            spend: 4800,
            roas: 4.7,
            ctr: 2.81,
            cpm: 8.0,
            purchases: 220,
            impressions: 160000,
          },
        },
        loser: {
          id: "cre_retarg_cart_abandon",
          name: "Retargeting – Cart Abandon Reminder",
          metrics: {
            spend: 4200,
            roas: 4.2,
            ctr: 2.84,
            cpm: 7.8,
            purchases: 190,
            impressions: 148000,
          },
        },
        variations: [
          {
            id: "cre_retarg_cart_abandon",
            name: "Retargeting – Cart Abandon Reminder",
            metrics: {
              spend: 4200,
              roas: 4.2,
              ctr: 2.84,
              cpm: 7.8,
              purchases: 190,
              impressions: 148000,
            },
          },
          {
            id: "cre_retarg_carousel_reviews",
            name: "Retargeting Carousel – Reviews",
            metrics: {
              spend: 4800,
              roas: 4.7,
              ctr: 2.81,
              cpm: 8.0,
              purchases: 220,
              impressions: 160000,
            },
          },
        ],
      },
    ],
  };
}
