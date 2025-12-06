// ============================================================
// DEMO DATA - WINDOW OBJECT (NO ES6 EXPORTS!)
// ============================================================

(function() {
  'use strict';

  // Wrap everything in window.SignalOneDemo
  window.SignalOneDemo = window.SignalOneDemo || {};

  // Account
  window.SignalOneDemo.demoAccount = {
    id: "demo_act_001",
    name: "DEMO BRAND – UGC Performance",
    industry: "Beauty / Skin-Care",
    averageMonthlySpend: 42000,
    createdAt: "2023-08-14",
    country: "Deutschland"
  };

  // Campaigns
  window.SignalOneDemo.demoCampaigns = [
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
      funnel_stage: "Top Funnel"
    }
  ];

  // Creatives
  window.SignalOneDemo.demoCreatives = [
    {
      id: "cr_01",
      name: "UGC Creator – Hook: „STOP! Du musst DAS sehen…"",
      type: "Video",
      spend: 8400,
      revenue: 55200,
      roas: 6.57,
      ctr: 4.1,
      performance: "Winner"
    }
  ];

  // Funnel
  window.SignalOneDemo.demoFunnel = {
    tof: { score: 86, issues: "Stark" },
    mof: { score: 74, issues: "Mittel" },
    bof: { score: 69, issues: "Checkout-Abbrüche" }
  };

  // Alerts
  window.SignalOneDemo.demoAlerts = [
    {
      id: "al_01",
      type: "Warnung",
      severity: "Hoch",
      title: "Creative Fatigue erkannt",
      message: "ROAS fällt seit 3 Tagen."
    }
  ];

  // Creators
  window.SignalOneDemo.demoCreators = [
    {
      id: "crlead_01",
      name: "Mia",
      avg_roas: 5.9,
      avg_ctr: 4.2
    }
  ];

  // Log success
  console.log("✅ SignalOneDemo loaded successfully!", window.SignalOneDemo);

})();
