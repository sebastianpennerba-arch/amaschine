// packages/data/demo/creatives.js
// -----------------------------------------------------------------------------
// DEMO Creatives (Premium + realistisch für Präsentationen)
// - Mehrere Verticals, klare Winner/Loser, Hook-Cluster, Varianten
// - Ziel: Creative Library, Sensei & Testing Log so aussehen lassen,
//   als kämen sie aus einem 5-stelligen Monats-Account.
// -----------------------------------------------------------------------------

/**
 * optionale accountId:
 *  - "demo_beauty" | "demo_home" | "demo_fashion" | "demo_tech" | "demo_fitness"
 *  default: gemischter Account mit allen Creatives
 */
export function demoCreativesForAccount(accountId) {
  const beauty = [
    {
      id: "cre_beauty_ugc_problem_v1",
      name: "BEAUTY • UGC Problem/Solution – V1",
      type: "UGC",
      hook: "Problem/Solution",
      thumbnail: null,
      metrics: {
        spend: 7_400,
        impressions: 230_000,
        clicks: 8_200,
        ctr: 3.56,
        cpm: 7.2,
        purchases: 520,
        roas: 5.1,
      },
    },
    {
      id: "cre_beauty_ugc_problem_v2",
      name: "BEAUTY • UGC Problem/Solution – V2",
      type: "UGC",
      hook: "Problem/Solution",
      thumbnail: null,
      metrics: {
        spend: 7_600,
        impressions: 250_000,
        clicks: 9_100,
        ctr: 3.64,
        cpm: 7.6,
        purchases: 630,
        roas: 6.0,
      },
    },
    {
      id: "cre_beauty_static_offer",
      name: "BEAUTY • Static – Mid Funnel Offer",
      type: "STATIC",
      hook: "Offer / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 6_200,
        impressions: 210_000,
        clicks: 5_600,
        ctr: 2.67,
        cpm: 7.3,
        purchases: 320,
        roas: 3.9,
      },
    },
    {
      id: "cre_beauty_retarg_sp",
      name: "BEAUTY • Retargeting – Social Proof Carousel",
      type: "CAROUSEL",
      hook: "Social Proof",
      thumbnail: null,
      metrics: {
        spend: 4_100,
        impressions: 145_000,
        clicks: 4_200,
        ctr: 2.9,
        cpm: 7.1,
        purchases: 260,
        roas: 4.8,
      },
    },
    {
      id: "cre_beauty_cold_banner",
      name: "BEAUTY • Static Cold – Brand Banner",
      type: "STATIC",
      hook: "Brand",
      thumbnail: null,
      metrics: {
        spend: 4_800,
        impressions: 190_000,
        clicks: 2_000,
        ctr: 1.05,
        cpm: 8.1,
        purchases: 70,
        roas: 1.6,
      },
    },
  ];

  const home = [
    {
      id: "cre_home_ugc_beforeafter",
      name: "HOME • UGC Before/After – Sofa",
      type: "UGC",
      hook: "Before/After",
      thumbnail: null,
      metrics: {
        spend: 8_200,
        impressions: 260_000,
        clicks: 9_400,
        ctr: 3.61,
        cpm: 7.5,
        purchases: 540,
        roas: 4.7,
      },
    },
    {
      id: "cre_home_static_offer",
      name: "HOME • Static – Bundle Offer",
      type: "STATIC",
      hook: "Offer",
      thumbnail: null,
      metrics: {
        spend: 6_800,
        impressions: 220_000,
        clicks: 5_800,
        ctr: 2.63,
        cpm: 7.7,
        purchases: 320,
        roas: 3.6,
      },
    },
    {
      id: "cre_home_ugc_bf_flash",
      name: "HOME • UGC – Black Friday Flash",
      type: "UGC",
      hook: "Urgency / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 7_600,
        impressions: 240_000,
        clicks: 10_200,
        ctr: 4.25,
        cpm: 7.9,
        purchases: 610,
        roas: 5.4,
      },
    },
  ];

  const fashion = [
    {
      id: "cre_fashion_ugc_tryon_v1",
      name: "FASHION • UGC Try-On – V1",
      type: "UGC",
      hook: "Try-On / Lifestyle",
      thumbnail: null,
      metrics: {
        spend: 7_900,
        impressions: 250_000,
        clicks: 9_000,
        ctr: 3.6,
        cpm: 7.2,
        purchases: 480,
        roas: 4.1,
      },
    },
    {
      id: "cre_fashion_ugc_tryon_v2",
      name: "FASHION • UGC Try-On – V2 (Hookswitch)",
      type: "UGC",
      hook: "Hook Switch",
      thumbnail: null,
      metrics: {
        spend: 8_100,
        impressions: 260_000,
        clicks: 10_200,
        ctr: 3.92,
        cpm: 7.5,
        purchases: 560,
        roas: 4.6,
      },
    },
    {
      id: "cre_fashion_static_brand",
      name: "FASHION • Static – Brand Mood",
      type: "STATIC",
      hook: "Brand",
      thumbnail: null,
      metrics: {
        spend: 5_600,
        impressions: 240_000,
        clicks: 3_200,
        ctr: 1.33,
        cpm: 8.4,
        purchases: 130,
        roas: 2.1,
      },
    },
  ];

  const tech = [
    {
      id: "cre_tech_ugc_demo",
      name: "TECH • UGC Explainer – App Demo",
      type: "UGC",
      hook: "Explainer / Demo",
      thumbnail: null,
      metrics: {
        spend: 9_200,
        impressions: 310_000,
        clicks: 8_600,
        ctr: 2.77,
        cpm: 7.4,
        purchases: 380,
        roas: 3.8,
      },
    },
    {
      id: "cre_tech_static_features",
      name: "TECH • Static – Feature Breakdown",
      type: "STATIC",
      hook: "Feature / Benefit",
      thumbnail: null,
      metrics: {
        spend: 6_400,
        impressions: 260_000,
        clicks: 4_200,
        ctr: 1.62,
        cpm: 7.6,
        purchases: 140,
        roas: 2.3,
      },
    },
    {
      id: "cre_tech_retarg_testimonial",
      name: "TECH • Retargeting – Video Testimonial",
      type: "UGC",
      hook: "Testimonial",
      thumbnail: null,
      metrics: {
        spend: 4_900,
        impressions: 150_000,
        clicks: 4_600,
        ctr: 3.06,
        cpm: 7.1,
        purchases: 260,
        roas: 4.2,
      },
    },
  ];

  const fitness = [
    {
      id: "cre_fit_ugc_transform_v1",
      name: "FITNESS • Transformation – 30 Days V1",
      type: "UGC",
      hook: "Before/After",
      thumbnail: null,
      metrics: {
        spend: 8_600,
        impressions: 280_000,
        clicks: 11_800,
        ctr: 4.21,
        cpm: 7.4,
        purchases: 640,
        roas: 5.0,
      },
    },
    {
      id: "cre_fit_ugc_transform_v2",
      name: "FITNESS • Transformation – 30 Days V2",
      type: "UGC",
      hook: "Before/After",
      thumbnail: null,
      metrics: {
        spend: 8_900,
        impressions: 290_000,
        clicks: 12_200,
        ctr: 4.21,
        cpm: 7.6,
        purchases: 680,
        roas: 5.3,
      },
    },
    {
      id: "cre_fit_static_program",
      name: "FITNESS • Static – Program Überblick",
      type: "STATIC",
      hook: "Program Overview",
      thumbnail: null,
      metrics: {
        spend: 5_200,
        impressions: 210_000,
        clicks: 3_600,
        ctr: 1.71,
        cpm: 7.9,
        purchases: 150,
        roas: 2.7,
      },
    },
  ];

  switch (accountId) {
    case "demo_beauty":
      return beauty;
    case "demo_home":
      return home;
    case "demo_fashion":
      return fashion;
    case "demo_tech":
      return tech;
    case "demo_fitness":
      return fitness;
    default:
      return [...beauty, ...home, ...fashion, ...tech, ...fitness];
  }
}

/**
 * Kleine generische Insight-Response für Creative-Detail & Charts.
 * Da die Metrics bereits im Creative stecken, reicht hier eine Sample-Zeile.
 */
export function demoCreativeInsights(creativeId) {
  return [
    {
      impressions: 120_000,
      clicks: 4_200,
      spend: 3_800,
      ctr: 3.5,
      cpm: 7.4,
      purchases: 210,
      roas: 5.1,
      creativeId,
    },
  ];
}
