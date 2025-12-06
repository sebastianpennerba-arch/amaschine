// packages/data/demo/campaigns.js
// -----------------------------------------------------------------------------
// DEMO Campaign Data (premium + realistisch, breites Spektrum)
// -----------------------------------------------------------------------------
//
// Ziel:
// - Repräsentiert ein "großes" Ecom-Ad-Konto mit verschiedenen Kampagnentypen
// - Scale, Testing, Retargeting, Awareness, Evergreen
// - Gute Mischung aus Winnern, Soliden und Problemfällen
// -----------------------------------------------------------------------------

export function demoCampaignsForAccount(accountId) {
  // accountId wird aktuell nicht differenziert – jede Demo-Brand
  // bekommt das volle Dashboard-Spektrum.
  // (Später könnte hier pro Brand/Account verzweigt werden.)
  return [
    // =========================
    // 1) SCALE / CORE REVENUE
    // =========================
    {
      id: "camp_q4_beauty_scale",
      name: "Q4 Scale – UGC Problem/Solution (Beauty)",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 32000,
        roas: 6.2,
        ctr: 3.9,
        cpm: 7.8,
        purchases: 2400,
      },
    },
    {
      id: "camp_home_evergreen",
      name: "Evergreen – Home & Living Bundles",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 18600,
        roas: 4.4,
        ctr: 2.8,
        cpm: 8.4,
        purchases: 980,
      },
    },

    // =========================
    // 2) TESTING / HOOK BATTLES
    // =========================
    {
      id: "camp_ugc_hook_battle_01",
      name: "UGC Hook-Battle – Social Proof vs Problem",
      status: "TESTING",
      objective: "SALES",
      metrics: {
        spend: 9800,
        roas: 3.6,
        ctr: 2.3,
        cpm: 8.9,
        purchases: 370,
      },
    },
    {
      id: "camp_static_offer_test",
      name: "Static Offer Test – V1 vs V2 vs V3",
      status: "TESTING",
      objective: "SALES",
      metrics: {
        spend: 7200,
        roas: 3.1,
        ctr: 2.1,
        cpm: 9.6,
        purchases: 260,
      },
    },

    // =========================
    // 3) RETARGETING
    // =========================
    {
      id: "camp_retarg_sp_socialproof",
      name: "Retargeting – Social Proof & Reviews",
      status: "ACTIVE",
      objective: "RETARGETING",
      metrics: {
        spend: 8600,
        roas: 5.5,
        ctr: 3.2,
        cpm: 7.3,
        purchases: 430,
      },
    },
    {
      id: "camp_retarg_cart_abandon",
      name: "Retargeting – Cart Abandoners 30d",
      status: "ACTIVE",
      objective: "RETARGETING",
      metrics: {
        spend: 5800,
        roas: 4.9,
        ctr: 3.0,
        cpm: 7.1,
        purchases: 290,
      },
    },

    // =========================
    // 4) COLD BROAD / PROBLEM CASES
    // =========================
    {
      id: "camp_cold_broad_weak_creatives",
      name: "Cold Broad – Creative Weakness (High CPM)",
      status: "PAUSED",
      objective: "AWARENESS",
      metrics: {
        spend: 9100,
        roas: 1.5,
        ctr: 0.9,
        cpm: 13.4,
        purchases: 80,
      },
    },
    {
      id: "camp_cold_lookalike",
      name: "Cold Lookalike 2% – Mixed Hooks",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 13400,
        roas: 2.9,
        ctr: 1.8,
        cpm: 10.2,
        purchases: 410,
      },
    },

    // =========================
    // 5) AWARENESS / VIDEO VIEWS
    // =========================
    {
      id: "camp_awareness_brand_story",
      name: "Brand Awareness – Founder Story",
      status: "ACTIVE",
      objective: "AWARENESS",
      metrics: {
        spend: 6400,
        roas: 2.0,
        ctr: 1.6,
        cpm: 8.1,
        purchases: 140,
      },
    },
    {
      id: "camp_video_views_ugc",
      name: "Video Views – UGC Top Funnel",
      status: "ACTIVE",
      objective: "VIDEO_VIEWS",
      metrics: {
        spend: 5200,
        roas: 1.8,
        ctr: 1.9,
        cpm: 7.4,
        purchases: 120,
      },
    },
  ];
}

// -----------------------------------------------------------------------------
// DEMO Campaign Insights
// -----------------------------------------------------------------------------
//
// small helper to derive a believable insight row aus Kampagnen-Metriken
// -----------------------------------------------------------------------------
export function demoInsightsForCampaign(campaignId) {
  const campaigns = demoCampaignsForAccount();
  const base =
    campaigns.find((c) => c.id === campaignId) || campaigns[0];

  const m = base.metrics;

  // Grobe Ableitung
  const spend = Number((m.spend / 3).toFixed(2));
  const impressions = Math.round((spend / m.cpm) * 1000 * 3); // 3x Window
  const ctr = m.ctr;
  const clicks = Math.round((ctr / 100) * impressions);
  const purchases = Math.max(
    1,
    Math.round((m.purchases / m.spend) * spend),
  );
  const roas = m.roas;

  return [
    {
      impressions,
      clicks,
      spend,
      ctr,
      cpm: m.cpm,
      website_purchase_roas: [{ value: roas }],
      actions: [{ action_type: "purchase", value: purchases }],
    },
  ];
}
