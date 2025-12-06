// ============================================================
// SignalOne DEMO DATA - Window Object (kein ES6 export!)
// ============================================================

(function() {
  'use strict';

  const DemoData = {
    account: {
      id: "demo_act_001",
      name: "DEMO BRAND – UGC Performance",
      industry: "Beauty / Skin-Care",
      averageMonthlySpend: 42000,
      createdAt: "2023-08-14",
      country: "Deutschland"
    },

    campaigns: [
      {
        id: "demo_cmp_ug1",
        name: "UGC SCALE – Evergreen Vol. 3",
        objective: "Conversions",
        status: "Aktiv",
        spend: 18420,
        revenue: 88400,
        roas: 4.8,
        ctr: 3.9,
        cpm: 8.12,
        cpc: 0.53,
        impressions: 2267000,
        clicks: 41000,
        funnel_stage: "Top Funnel",
        creatives: ["cr_01", "cr_02", "cr_03", "cr_04", "cr_05"],
        description: "Hauptkampagne basierend auf UGC-Creators mit starken Hooks."
      }
    ],

    creatives: [
      {
        id: "cr_01",
        name: "UGC Creator – Hook: „STOP! Du musst DAS sehen…"",
        type: "Video",
        thumbnail: "https://via.placeholder.com/320x180?text=UGC+1",
        spend: 8400,
        revenue: 55200,
        roas: 6.57,
        ctr: 4.1,
        cpm: 7.82,
        cpc: 0.48,
        impressions: 1074000,
        clicks: 22400,
        hook: "Stop Scroll",
        performance: "Winner"
      }
    ]
  };

  // ✅ EXPOSE GLOBAL
  window.DemoData = DemoData;
  
  // Legacy support
  window.demoAccount = DemoData.account;
  window.demoCampaigns = DemoData.campaigns;
  window.demoCreatives = DemoData.creatives;

  console.log("✅ DemoData loaded successfully!", DemoData);
})();
