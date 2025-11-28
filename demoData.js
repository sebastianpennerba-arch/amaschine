// demoData.js
// Demo-Daten für SignalOne Demo Mode
// Struktur kompatibel zu AppState.meta.* (campaigns, creatives, insightsByCampaign, user)

export const DEMO_DATA_PRESETS = {
  small_store: {
    id: "small_store",
    label: "Small Store – 5k€/Monat",
    user: {
      id: "user_demo_small",
      name: "Demo Brand – Small Store",
      email: "demo-small@signalone.cloud"
    },
    adAccounts: [
      {
        id: "act_demo_small_1",
        name: "ACME Small Store",
        currency: "EUR",
        spendCap: 5000
      }
    ],
    campaigns: [
      {
        id: "cmp_small_prospecting",
        accountId: "act_demo_small_1",
        name: "Prospecting Cold – Broad",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 2100,
        revenue: 6300,
        roas: 3.0,
        impressions: 85000,
        clicks: 2125,
        ctr: 2.5,
        cpm: 24.7,
        createdTime: "2025-10-01"
      },
      {
        id: "cmp_small_retarg",
        accountId: "act_demo_small_1",
        name: "Retargeting – 30 Tage",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 1200,
        revenue: 5400,
        roas: 4.5,
        impressions: 43000,
        clicks: 1720,
        ctr: 4.0,
        cpm: 27.9,
        createdTime: "2025-10-05"
      },
      {
        id: "cmp_small_testing",
        accountId: "act_demo_small_1",
        name: "Creative Testing – UGC Hooks",
        status: "PAUSED",
        objective: "PURCHASE",
        spend: 600,
        revenue: 1500,
        roas: 2.5,
        impressions: 27000,
        clicks: 918,
        ctr: 3.4,
        cpm: 22.2,
        createdTime: "2025-10-10"
      }
    ],
    creatives: [
      {
        id: "cr_small_mia_ps_v1",
        campaignId: "cmp_small_testing",
        name: "Mia_PS_v1",
        type: "VIDEO",
        creator: "Mia",
        hookType: "Problem/Solution",
        thumbnailUrl: "/demo-assets/mia_ps_v1.jpg",
        spend: 200,
        revenue: 780,
        roas: 3.9,
        ctr: 3.8,
        cpm: 18.5,
        impressions: 10800,
        clicks: 410,
        adSenseiScore: 82
      },
      {
        id: "cr_small_generic_static",
        campaignId: "cmp_small_prospecting",
        name: "Generic_Product_Static_v12",
        type: "IMAGE",
        creator: "Stock",
        hookType: "Direct CTA",
        thumbnailUrl: "/demo-assets/generic_static_v12.jpg",
        spend: 350,
        revenue: 420,
        roas: 1.2,
        ctr: 0.9,
        cpm: 35.0,
        impressions: 10000,
        clicks: 90,
        adSenseiScore: 24
      }
    ],
    insightsByCampaign: {
      cmp_small_prospecting: {
        spend: 2100,
        revenue: 6300,
        roas: 3.0,
        ctr: 2.5,
        cpm: 24.7,
        topCreatives: ["cr_small_generic_static"],
        losers: [],
        senseiNotes: [
          "Prospecting Kampagne ist OK, aber nicht überragend.",
          "Testen von UGC-Hooks könnte ROAS auf 3.5–4.0 heben."
        ]
      },
      cmp_small_retarg: {
        spend: 1200,
        revenue: 5400,
        roas: 4.5,
        ctr: 4.0,
        cpm: 27.9,
        topCreatives: [],
        losers: [],
        senseiNotes: [
          "Retargeting hält den Laden profitabel.",
          "Skalierung begrenzt durch kleine Audience."
        ]
      }
    }
  },

  scaling_store: {
    id: "scaling_store",
    label: "Scaling Store – ~40k€/Monat",
    user: {
      id: "user_demo_scaling",
      name: "Demo Brand – Scaling UGC DTC",
      email: "demo-scaling@signalone.cloud"
    },
    adAccounts: [
      {
        id: "act_demo_scaling_1",
        name: "DTC UGC Brand – Main",
        currency: "EUR",
        spendCap: 60000
      }
    ],
    campaigns: [
      {
        id: "cmp_ugc_scale",
        accountId: "act_demo_scaling_1",
        name: "UGC Scale Test",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 18420,
        revenue: 106836,
        roas: 5.8,
        impressions: 227000,
        clicks: 8853,
        ctr: 3.9,
        cpm: 8.10,
        createdTime: "2025-10-01"
      },
      {
        id: "cmp_brand_static",
        accountId: "act_demo_scaling_1",
        name: "Brand Awareness Static",
        status: "ACTIVE",
        objective: "REACH",
        spend: 12890,
        revenue: 27069,
        roas: 2.1,
        impressions: 418000,
        clicks: 5852,
        ctr: 1.4,
        cpm: 30.8,
        createdTime: "2025-10-03"
      },
      {
        id: "cmp_retarg_cold",
        accountId: "act_demo_scaling_1",
        name: "Retargeting Cold – Broad Stacks",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 8340,
        revenue: 10842,
        roas: 1.3,
        impressions: 265000,
        clicks: 2385,
        ctr: 0.9,
        cpm: 31.5,
        createdTime: "2025-10-05"
      },
      {
        id: "cmp_hook_battle",
        accountId: "act_demo_scaling_1",
        name: "Testing: Hook Battle – Problem vs Testimonial",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 2100,
        revenue: 8840,
        roas: 4.2,
        impressions: 67000,
        clicks: 2077,
        ctr: 3.1,
        cpm: 31.3,
        createdTime: "2025-10-15"
      }
    ],
    creatives: [
      {
        id: "cr_mia_ps_v3",
        campaignId: "cmp_ugc_scale",
        name: "Mia_Hook_Problem_Solution_v3",
        type: "VIDEO",
        creator: "Mia",
        hookType: "Problem/Solution",
        thumbnailUrl: "/demo-assets/mia_ps_v3.jpg",
        spend: 12340,
        revenue: 83800,
        roas: 6.8,
        impressions: 145000,
        clicks: 5945,
        ctr: 4.1,
        cpm: 8.51,
        adSenseiScore: 94
      },
      {
        id: "cr_tom_testimonial_v1",
        campaignId: "cmp_ugc_scale",
        name: "Tom_Testimonial_ShortForm_v1",
        type: "VIDEO",
        creator: "Tom",
        hookType: "Testimonial",
        thumbnailUrl: "/demo-assets/tom_testimonial_v1.jpg",
        spend: 8400,
        revenue: 49560,
        roas: 5.9,
        impressions: 110000,
        clicks: 4180,
        ctr: 3.8,
        cpm: 7.64,
        adSenseiScore: 89
      },
      {
        id: "cr_lisa_before_after_v2",
        campaignId: "cmp_ugc_scale",
        name: "Lisa_BeforeAfter_Showcase_v2",
        type: "VIDEO",
        creator: "Lisa",
        hookType: "Before/After",
        thumbnailUrl: "/demo-assets/lisa_before_after_v2.jpg",
        spend: 6100,
        revenue: 31720,
        roas: 5.2,
        impressions: 89000,
        clicks: 3115,
        ctr: 3.5,
        cpm: 6.85,
        adSenseiScore: 86
      },
      {
        id: "cr_generic_product_static_v12",
        campaignId: "cmp_brand_static",
        name: "Generic_Product_Static_v12",
        type: "IMAGE",
        creator: "Brand",
        hookType: "Direct CTA",
        thumbnailUrl: "/demo-assets/generic_static_v12.jpg",
        spend: 3200,
        revenue: 3840,
        roas: 1.2,
        impressions: 114000,
        clicks: 1026,
        ctr: 0.9,
        cpm: 28.07,
        adSenseiScore: 20
      }
    ],
    insightsByCampaign: {
      cmp_ugc_scale: {
        spend: 18420,
        revenue: 106836,
        roas: 5.8,
        ctr: 3.9,
        cpm: 8.10,
        topCreatives: ["cr_mia_ps_v3", "cr_tom_testimonial_v1", "cr_lisa_before_after_v2"],
        losers: [],
        senseiNotes: [
          "Top-Performer Kampagne – idealer Skalierungskandidat.",
          "Budget-Erhöhung um 50 % empfohlen, Risiko niedrig.",
          "UGC Problem/Solution Hooks outperformen Account-Durchschnitt um 48 %."
        ]
      },
      cmp_brand_static: {
        spend: 12890,
        revenue: 27069,
        roas: 2.1,
        ctr: 1.4,
        cpm: 30.8,
        topCreatives: [],
        losers: ["cr_generic_product_static_v12"],
        senseiNotes: [
          "Brand Awareness Static Kampagne verbrennt Geld.",
          "Budget um 30 % reduzieren und auf UGC Kampagnen umschichten."
        ]
      },
      cmp_retarg_cold: {
        spend: 8340,
        revenue: 10842,
        roas: 1.3,
        ctr: 0.9,
        cpm: 31.5,
        topCreatives: [],
        losers: [],
        senseiNotes: [
          "Retargeting Cold Kampagne misstbare Unterperformance.",
          "Pausiere 9 von 15 Ads, behalte nur Top-Performer."
        ]
      },
      cmp_hook_battle: {
        spend: 2100,
        revenue: 8840,
        roas: 4.2,
        ctr: 3.1,
        cpm: 31.3,
        topCreatives: ["cr_mia_ps_v3"],
        losers: [],
        senseiNotes: [
          "Hook Battle: Problem/Solution vs Testimonial.",
          "Problem/Solution gewinnt mit ~35 % besserem ROAS."
        ]
      }
    }
  },

  agency: {
    id: "agency",
    label: "Agency – 100k€/Monat, Multi-Brand",
    user: {
      id: "user_demo_agency",
      name: "Demo Agency – Growth Squad",
      email: "demo-agency@signalone.cloud"
    },
    adAccounts: [
      {
        id: "act_demo_fashion",
        name: "ACME Fashion",
        currency: "EUR",
        spendCap: 40000
      },
      {
        id: "act_demo_tech",
        name: "TechGadgets Pro",
        currency: "EUR",
        spendCap: 35000
      },
      {
        id: "act_demo_beauty",
        name: "BeautyLux",
        currency: "EUR",
        spendCap: 35000
      }
    ],
    campaigns: [
      {
        id: "cmp_fashion_ugc",
        accountId: "act_demo_fashion",
        name: "Fashion UGC Scale",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 22000,
        revenue: 132000,
        roas: 6.0,
        impressions: 310000,
        clicks: 12400,
        ctr: 4.0,
        cpm: 7.1,
        createdTime: "2025-09-20"
      },
      {
        id: "cmp_tech_demo",
        accountId: "act_demo_tech",
        name: "Tech Demo – Problem/Solution",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 18500,
        revenue: 96200,
        roas: 5.2,
        impressions: 270000,
        clicks: 9450,
        ctr: 3.5,
        cpm: 6.85,
        createdTime: "2025-09-25"
      },
      {
        id: "cmp_beauty_before_after",
        accountId: "act_demo_beauty",
        name: "Beauty – Before/After UGC",
        status: "ACTIVE",
        objective: "PURCHASE",
        spend: 19500,
        revenue: 120900,
        roas: 6.2,
        impressions: 295000,
        clicks: 12490,
        ctr: 4.2,
        cpm: 6.61,
        createdTime: "2025-09-27"
      }
    ],
    creatives: [
      // Du kannst hier nach dem Muster weitere Creator / Hooks hinzufügen:
      // Mia, Tom, Lisa, Sarah, etc. pro Account/Brand
    ],
    insightsByCampaign: {
      // High-Level Cross-Brand Insights für Sensei & Reports
    }
  }
};
