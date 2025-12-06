// packages/data/demo/creatives.js
// -----------------------------------------------------------------------------
// DEMO Creatives (Premium + realistisch für Präsentationen)
// -----------------------------------------------------------------------------
//
// Ziel:
// - Viele unterschiedliche Creative-Typen (UGC, Static, Carousel, Story)
// - Verschiedene Hooks (Problem/Solution, Social Proof, Offer, Story, CTA)
// - Winner, solide Performer, schwache Creatives
// -----------------------------------------------------------------------------

export function demoCreativesForAccount(accountId) {
  // accountId wird aktuell ignoriert – jeder Demo-Account
  // bekommt das volle Creative-Spektrum.
  return [
    // =============== SCALE / WINNER ===============
    {
      id: "cre_ugc_ps_beauty_scale",
      name: "UGC Problem/Solution – Beauty Scale",
      type: "UGC",
      hook: "Problem/Solution",
      thumbnail: null,
      metrics: {
        spend: 16800,
        impressions: 520000,
        clicks: 20400,
        ctr: 3.92,
        cpm: 7.6,
        purchases: 1280,
        roas: 5.8,
      },
    },
    {
      id: "cre_ugc_unboxing_q4",
      name: "UGC Unboxing – Q4 Edition",
      type: "UGC",
      hook: "UGC / Unboxing",
      thumbnail: null,
      metrics: {
        spend: 11200,
        impressions: 360000,
        clicks: 15500,
        ctr: 4.3,
        cpm: 7.1,
        purchases: 780,
        roas: 5.1,
      },
    },

    // =============== STATIC OFFER ===============
    {
      id: "cre_static_offer_v1",
      name: "Static Offer – V1 (Blue CTA)",
      type: "STATIC",
      hook: "Offer / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 6200,
        impressions: 210000,
        clicks: 5100,
        ctr: 2.43,
        cpm: 7.9,
        purchases: 260,
        roas: 3.6,
      },
    },
    {
      id: "cre_static_offer_v2",
      name: "Static Offer – V2 (Green CTA)",
      type: "STATIC",
      hook: "Offer / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 6400,
        impressions: 215000,
        clicks: 5800,
        ctr: 2.7,
        cpm: 8.0,
        purchases: 310,
        roas: 4.1,
      },
    },
    {
      id: "cre_static_offer_v3_red",
      name: "Static Offer – V3 (Red CTA)",
      type: "STATIC",
      hook: "Offer / Scarcity",
      thumbnail: null,
      metrics: {
        spend: 6800,
        impressions: 220000,
        clicks: 6800,
        ctr: 3.09,
        cpm: 8.2,
        purchases: 340,
        roas: 4.9,
      },
    },

    // =============== HOOK BATTLE ===============
    {
      id: "cre_ugc_hookbattle_sp",
      name: "UGC Hook Battle – Social Proof",
      type: "UGC",
      hook: "Social Proof",
      thumbnail: null,
      metrics: {
        spend: 7200,
        impressions: 240000,
        clicks: 6900,
        ctr: 2.87,
        cpm: 7.2,
        purchases: 320,
        roas: 4.5,
      },
    },
    {
      id: "cre_ugc_hookbattle_problem",
      name: "UGC Hook Battle – Problem Story",
      type: "UGC",
      hook: "Problem/Solution",
      thumbnail: null,
      metrics: {
        spend: 7100,
        impressions: 235000,
        clicks: 7400,
        ctr: 3.15,
        cpm: 7.2,
        purchases: 340,
        roas: 4.9,
      },
    },

    // =============== RETARGETING / CAROUSEL ===============
    {
      id: "cre_retarg_carousel_reviews",
      name: "Retargeting Carousel – Reviews",
      type: "CAROUSEL",
      hook: "Social Proof",
      thumbnail: null,
      metrics: {
        spend: 4800,
        impressions: 160000,
        clicks: 4500,
        ctr: 2.81,
        cpm: 8.0,
        purchases: 220,
        roas: 4.7,
      },
    },
    {
      id: "cre_retarg_cart_abandon",
      name: "Retargeting – Cart Abandon Reminder",
      type: "STATIC",
      hook: "Direct CTA",
      thumbnail: null,
      metrics: {
        spend: 4200,
        impressions: 148000,
        clicks: 4200,
        ctr: 2.84,
        cpm: 7.8,
        purchases: 190,
        roas: 4.2,
      },
    },

    // =============== PROBLEM CASES (LOOSER) ===============
    {
      id: "cre_static_brandframe",
      name: "Static Brand Frame – Weak Hook",
      type: "STATIC",
      hook: "Brand Frame",
      thumbnail: null,
      metrics: {
        spend: 5400,
        impressions: 190000,
        clicks: 2600,
        ctr: 1.37,
        cpm: 8.5,
        purchases: 70,
        roas: 1.8,
      },
    },
    {
      id: "cre_video_mood",
      name: "Mood Video – No Clear CTA",
      type: "VIDEO",
      hook: "Soft Story",
      thumbnail: null,
      metrics: {
        spend: 5800,
        impressions: 260000,
        clicks: 3100,
        ctr: 1.19,
        cpm: 8.3,
        purchases: 80,
        roas: 1.6,
      },
    },

    // =============== FOUNDER STORY / AWARENESS ===============
    {
      id: "cre_founder_story",
      name: "Founder Story – Brand Intro",
      type: "VIDEO",
      hook: "Founder Story",
      thumbnail: null,
      metrics: {
        spend: 4600,
        impressions: 210000,
        clicks: 4200,
        ctr: 2.0,
        cpm: 8.1,
        purchases: 120,
        roas: 2.4,
      },
    },
    {
      id: "cre_story_ugc_combo",
      name: "Story + UGC Combo – 30s",
      type: "VIDEO",
      hook: "Story / Outcome",
      thumbnail: null,
      metrics: {
        spend: 7200,
        impressions: 250000,
        clicks: 7800,
        ctr: 3.12,
        cpm: 8.4,
        purchases: 260,
        roas: 3.7,
      },
    },

    // =============== TESTING FOR FUTURE ITERATIONS ===============
    {
      id: "cre_tiktok_style_vertical",
      name: "TikTok Style Vertical – Raw Cut",
      type: "UGC",
      hook: "Pattern Interrupt",
      thumbnail: null,
      metrics: {
        spend: 3900,
        impressions: 140000,
        clicks: 4600,
        ctr: 3.29,
        cpm: 7.3,
        purchases: 110,
        roas: 2.9,
      },
    },
    {
      id: "cre_static_price_anchor",
      name: "Static – Price Anchor + Slash",
      type: "STATIC",
      hook: "Offer / Price Anchor",
      thumbnail: null,
      metrics: {
        spend: 4100,
        impressions: 150000,
        clicks: 3700,
        ctr: 2.47,
        cpm: 7.6,
        purchases: 135,
        roas: 3.3,
      },
    },
  ];
}

// -----------------------------------------------------------------------------
// DEMO Creative Insights
// -----------------------------------------------------------------------------
//
// Ableitung aus den oben definierten Creatives – so bleibt alles konsistent.
// -----------------------------------------------------------------------------
export function demoCreativeInsights(creativeId) {
  const all = demoCreativesForAccount();
  const base =
    all.find((c) => c.id === creativeId) || all[0];

  const m = base.metrics;

  return [
    {
      impressions: m.impressions,
      clicks: m.clicks,
      spend: m.spend,
      ctr: m.ctr,
      cpm: m.cpm,
      purchases: m.purchases,
      roas: m.roas,
      creativeId,
    },
  ];
}
