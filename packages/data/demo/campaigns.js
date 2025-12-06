// packages/data/demo/campaigns.js
// -----------------------------------------------------------------------------
// DEMO Campaign Data (premium + realistisch, Multi-Vertical)
// - Ziel: Ein Demo-Account, der wie 5 echte E-Com Brands wirkt
// - Verticals: Beauty, Home, Fashion, Tech, Fitness
// - Jede Kampagne bringt klare Stories für Dashboard, Campaign View & Sensei
// -----------------------------------------------------------------------------

/**
 * Optionale accountId:
 *  - "demo_beauty"
 *  - "demo_home"
 *  - "demo_fashion"
 *  - "demo_tech"
 *  - "demo_fitness"
 *
 * Fallback (default): gemergter "Big Demo Account" mit allem.
 */
export function demoCampaignsForAccount(accountId) {
  const beauty = [
    {
      id: "camp_beauty_scale_01",
      name: "BEAUTY • Q4 Scaling – UGC Problem/Solution",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 27800,
        roas: 6.1,
        ctr: 3.8,
        cpm: 7.9,
        purchases: 2100,
      },
    },
    {
      id: "camp_beauty_ugc_test",
      name: "BEAUTY • UGC Hook-Battle – v1 vs v2",
      status: "TESTING",
      objective: "SALES",
      metrics: {
        spend: 9200,
        roas: 3.8,
        ctr: 2.0,
        cpm: 8.4,
        purchases: 310,
      },
    },
    {
      id: "camp_beauty_retarg_sp",
      name: "BEAUTY • Retargeting – Social Proof",
      status: "ACTIVE",
      objective: "RETARGETING",
      metrics: {
        spend: 6800,
        roas: 5.4,
        ctr: 2.8,
        cpm: 7.1,
        purchases: 310,
      },
    },
    {
      id: "camp_beauty_cold_weak",
      name: "BEAUTY • Cold Broad – Creative Weakness",
      status: "PAUSED",
      objective: "AWARENESS",
      metrics: {
        spend: 7800,
        roas: 1.4,
        ctr: 0.92,
        cpm: 12.0,
        purchases: 68,
      },
    },
  ];

  const home = [
    {
      id: "camp_home_scale_01",
      name: "HOME • Evergreen Scale – UGC Before/After",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 18400,
        roas: 4.9,
        ctr: 3.2,
        cpm: 7.4,
        purchases: 980,
      },
    },
    {
      id: "camp_home_static_mf",
      name: "HOME • Static Mid-Funnel Offer",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 11600,
        roas: 3.8,
        ctr: 2.4,
        cpm: 8.9,
        purchases: 460,
      },
    },
    {
      id: "camp_home_bf_flash",
      name: "HOME • Black Friday Flash Sale",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 9800,
        roas: 5.6,
        ctr: 4.1,
        cpm: 6.9,
        purchases: 720,
      },
    },
  ];

  const fashion = [
    {
      id: "camp_fashion_brand",
      name: "FASHION • Brand Awareness – Lifestyle Static",
      status: "ACTIVE",
      objective: "BRAND_AWARENESS",
      metrics: {
        spend: 12300,
        roas: 2.4,
        ctr: 1.8,
        cpm: 9.8,
        purchases: 210,
      },
    },
    {
      id: "camp_fashion_ugc_tryon",
      name: "FASHION • UGC Try-On Haul",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 14200,
        roas: 4.3,
        ctr: 3.9,
        cpm: 7.1,
        purchases: 640,
      },
    },
    {
      id: "camp_fashion_sale_lastcall",
      name: "FASHION • Last Call Sale – 48h",
      status: "PAUSED",
      objective: "SALES",
      metrics: {
        spend: 6200,
        roas: 3.1,
        ctr: 2.2,
        cpm: 8.4,
        purchases: 220,
      },
    },
  ];

  const tech = [
    {
      id: "camp_tech_launch",
      name: "TECH • Product Launch – UGC Explainer",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 19600,
        roas: 3.9,
        ctr: 2.9,
        cpm: 8.1,
        purchases: 540,
      },
    },
    {
      id: "camp_tech_retarg_demo",
      name: "TECH • Retargeting – Demo Request",
      status: "ACTIVE",
      objective: "LEAD",
      metrics: {
        spend: 5400,
        roas: 0, // Leads statt Direct Sales
        ctr: 2.7,
        cpm: 7.2,
        purchases: 0,
      },
    },
  ];

  const fitness = [
    {
      id: "camp_fit_challenge",
      name: "FITNESS • 30-Day Challenge – UGC Transformations",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 13200,
        roas: 5.2,
        ctr: 4.4,
        cpm: 7.0,
        purchases: 780,
      },
    },
    {
      id: "camp_fit_upsell",
      name: "FITNESS • Upsell – Coaching Add-On",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 4800,
        roas: 3.6,
        ctr: 2.6,
        cpm: 8.7,
        purchases: 210,
      },
    },
    {
      id: "camp_fit_broad_fail",
      name: "FITNESS • Cold Broad – Fatigue & Overlap",
      status: "PAUSED",
      objective: "AWARENESS",
      metrics: {
        spend: 7200,
        roas: 1.2,
        ctr: 0.84,
        cpm: 11.8,
        purchases: 52,
      },
    },
  ];

  // Optional: Vertical-spezifische Sichten
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
      // Big Demo Account – alles gemischt
      return [...beauty, ...home, ...fashion, ...tech, ...fitness];
  }
}

/**
 * Simulierte Kampagnen-Insights
 * - Kleine, aber realistische Sample-Response für Charts & Detail-Views
 */
export function demoInsightsForCampaign(campaignId) {
  // Einfache generische Beispielzeile – reicht für KPI-Anzeigen & Charts
  return [
    {
      impressions: 120_000,
      clicks: 4_200,
      spend: 3_800,
      ctr: 3.5,
      cpm: 7.4,
      website_purchase_roas: [{ value: 5.1 }],
      actions: [{ action_type: "purchase", value: 210 }],
      campaignId,
    },
  ];
}
