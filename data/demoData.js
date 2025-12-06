/* ------------------------------------------------------------
   DEMO-DATEN FÜR SIGNALONE – basierend auf den 3 PDFs
   Vollständig übersetzt & perfekt strukturiert
   Version: 1.0 (DEMO-MODUS)
------------------------------------------------------------- */

window.DemoData = {
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
    },
    {
      id: "demo_cmp_ret1",
      name: "RETARGETING – 30 Tage (DPA + Video)",
      objective: "Conversions",
      status: "Aktiv",
      spend: 6200,
      revenue: 19840,
      roas: 3.2,
      ctr: 2.4,
      cpm: 11.40,
      cpc: 0.72,
      impressions: 540000,
      clicks: 12900,
      funnel_stage: "Middle Funnel",
      creatives: ["cr_11", "cr_12"],
      description: "Retargeting der letzten 30 Tage – performt stabil."
    },
    {
      id: "demo_cmp_broad1",
      name: "PROSPECTING – Broad 1",
      objective: "Conversions",
      status: "Aktiv",
      spend: 12000,
      revenue: 25200,
      roas: 2.1,
      ctr: 1.7,
      cpm: 9.8,
      cpc: 0.61,
      impressions: 1220000,
      clicks: 20300,
      funnel_stage: "Top Funnel",
      creatives: ["cr_21", "cr_22", "cr_23"],
      description: "Breite Ansprache ohne Interessen – Testing neuer Hooks."
    },
    {
      id: "demo_cmp_ht1",
      name: "HOOK-TEST – Varianten Vol. 8",
      objective: "Conversions",
      status: "Aktiv",
      spend: 4500,
      revenue: 16200,
      roas: 3.6,
      ctr: 4.2,
      cpm: 7.80,
      cpc: 0.39,
      impressions: 487000,
      clicks: 12900,
      funnel_stage: "Top Funnel",
      creatives: ["cr_31", "cr_32", "cr_33", "cr_34"],
      description: "Hook-Test mit 4 Varianten – Fokus: Scrollstop + Mikro-Hooks."
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
    },
    {
      id: "cr_02",
      name: "UGC Creator – „Mein Freund hasst es, aber…"",
      type: "Video",
      thumbnail: "https://via.placeholder.com/320x180?text=UGC+2",
      spend: 5400,
      revenue: 19800,
      roas: 3.66,
      ctr: 3.2,
      cpm: 8.90,
      cpc: 0.61,
      impressions: 607000,
      clicks: 10300,
      hook: "Story",
      performance: "Gut"
    },
    {
      id: "cr_03",
      name: "Static – Offer -30%",
      type: "Image",
      thumbnail: "https://via.placeholder.com/320x180?text=-30%25",
      spend: 1200,
      revenue: 1800,
      roas: 1.5,
      ctr: 1.8,
      cpm: 9.1,
      cpc: 0.71,
      impressions: 132000,
      clicks: 2430,
      hook: "Offer",
      performance: "Schwach"
    },
    {
      id: "cr_04",
      name: "Hook-Test – „Ich habe DAS ausprobiert…"",
      type: "Video",
      thumbnail: "https://via.placeholder.com/320x180?text=HT1",
      spend: 2100,
      revenue: 9100,
      roas: 4.33,
      ctr: 4.8,
      cpm: 7.2,
      cpc: 0.33,
      impressions: 292000,
      clicks: 6300,
      hook: "Experience",
      performance: "Winner"
    }
  ],

  funnel: {
    tof: {
      score: 86,
      issues: ["Scrollstop stark", "CTR stabil über Benchmark"],
      opportunities: ["Mehr Broad-Scaling möglich"]
    },
    mof: {
      score: 74,
      issues: ["Video-View-Rate mittel"],
      opportunities: ["DPA testen", "Testimonials verstärken"]
    },
    bof: {
      score: 69,
      issues: ["Checkout-Abbrüche 14%"],
      opportunities: ["Landing Pages A/B test", "Trust Badges"]
    }
  },

  alerts: [
    {
      id: "al_01",
      type: "Warnung",
      severity: "Hoch",
      title: "UGC Vol.3 – Creative Fatigue erkannt",
      message: "ROAS fällt seit 3 Tagen. CTR sinkt um 18%. Neues Creative testen.",
      timestamp: "2025-01-21"
    },
    {
      id: "al_02",
      type: "Info",
      severity: "Mittel",
      title: "Retargeting – CPM gestiegen",
      message: "CPM +22% im 30d Vergleich. Budget prüfen.",
      timestamp: "2025-01-20"
    },
    {
      id: "al_03",
      type: "Erfolg",
      severity: "Niedrig",
      title: "Hook A outperformt andere Varianten",
      message: "CTR +32%, CPC -12% → Hochskalieren empfohlen.",
      timestamp: "2025-01-19"
    }
  ],

  creators: [
    {
      id: "cr_lead_01",
      name: "Mia",
      avg_roas: 5.9,
      avg_ctr: 4.2,
      total_spend: 11800,
      profile_picture: "https://via.placeholder.com/80?text=M"
    },
    {
      id: "cr_lead_02",
      name: "Tom",
      avg_roas: 4.1,
      avg_ctr: 3.6,
      total_spend: 9400,
      profile_picture: "https://via.placeholder.com/80?text=T"
    },
    {
      id: "cr_lead_03",
      name: "Sarah",
      avg_roas: 3.7,
      avg_ctr: 3.2,
      total_spend: 7400,
      profile_picture: "https://via.placeholder.com/80?text=S"
    }
  ],

  hookAnalysis: [
    {
      hook: "Stop Scroll",
      ctr: 4.8,
      roas: 5.1,
      conversions: 3800,
      message: "Sehr stark – eignet sich zum Skalieren"
    },
    {
      hook: "Story",
      ctr: 3.1,
      roas: 3.6,
      conversions: 1400,
      message: "Stabil – gut für Retargeting"
    },
    {
      hook: "Problem-Solution",
      ctr: 2.8,
      roas: 2.9,
      conversions: 900,
      message: "Erweiterbar – neue Varianten testen"
    }
  ],

  testingLog: [
    {
      id: "test_01",
      title: "Hook-Test Vol. 8",
      status: "Laufend",
      findings: "Hook A outperformt alle Varianten. A wird Gewinner. B/C pausieren.",
      next_step: "Neue Hook-Varianten entwickeln.",
      date: "2025-01-22"
    },
    {
      id: "test_02",
      title: "Retargeting – DPA vs Video",
      status: "Abgeschlossen",
      findings: "Video outperformt DPA bei CTR deutlich.",
      next_step: "2 neue Videos testen.",
      date: "2025-01-19"
    }
  ],

  forecast: {
    next7days: {
      projected_spend: 7200,
      projected_revenue: 34800,
      projected_roas: 4.83,
      confidence: 0.87
    },
    message: "Basierend auf der Performance der letzten 14 Tage."
  }
};

// Legacy support (falls alter Code noch demoAccount verwendet)
window.demoAccount = window.DemoData.account;
window.demoCampaigns = window.DemoData.campaigns;
window.demoCreatives = window.DemoData.creatives;
window.demoFunnel = window.DemoData.funnel;
window.demoAlerts = window.DemoData.alerts;
window.demoCreators = window.DemoData.creators;
window.demoHookAnalysis = window.DemoData.hookAnalysis;
window.demoTestingLog = window.DemoData.testingLog;
window.demoForecast = window.DemoData.forecast;

console.log("✅ DemoData loaded successfully!");
