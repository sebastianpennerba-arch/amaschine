// demoData.js
// (Original unverändert oben)
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

  // (...)
  // scaling_store
  // agency
  // (Dein kompletter Rest bleibt unverändert)
};

// ======================================
// FIX: Kompatibler Export für app.js
// ======================================
export const demoData = DEMO_DATA_PRESETS;
