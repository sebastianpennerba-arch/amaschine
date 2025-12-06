/**
 * demoData.js
 *
 * Zentrale Demo-Daten für SignalOne:
 * - Brands (Werbekonten)
 * - Kampagnen pro Brand
 * - Creatives
 * - Funnel Health
 * - Alerts
 * - Creator Leaderboard
 *
 * Exportiert:
 *  - demoBrands
 *  - demoCampaignsByBrand
 *  - demoCreatives
 *  - demoFunnel
 *  - demoAlerts
 *  - demoCreators
 *  - DemoData (aggregiert)
 *    -> DemoData.brands, DemoData.campaignsByBrand, ...
 *
 * Zusätzlich:
 *  - setzt window.SignalOneDemo.DemoData & .brands
 *    damit compute.js im Dashboard via window.SignalOneDemo arbeiten kann.
 */

/* ------------------------------------------------------------
   BRANDS (Werbekonten)
------------------------------------------------------------- */

export const demoBrands = [
  {
    id: "acme_fashion",
    name: "ACME Fashion",
    ownerName: "ACME Fashion GmbH",
    vertical: "DTC / Fashion",
    spend30d: 51234,
    roas30d: 4.8,
    campaignHealth: "good",
  },
  {
    id: "techgadgets_pro",
    name: "TechGadgets Pro",
    ownerName: "TechGadgets Pro GmbH",
    vertical: "Electronics / Gadgets",
    spend30d: 43211,
    roas30d: 4.4,
    campaignHealth: "good",
  },
  {
    id: "beautylux_cosmetics",
    name: "BeautyLux Cosmetics",
    ownerName: "BeautyLux GmbH",
    vertical: "Cosmetics / Beauty",
    spend30d: 29877,
    roas30d: 3.8,
    campaignHealth: "warning",
  },
  {
    id: "fitlife_supplements",
    name: "FitLife Supplements",
    ownerName: "FitLife Labs",
    vertical: "Fitness / Nutrition",
    spend30d: 32101,
    roas30d: 4.1,
    campaignHealth: "warning",
  },
  {
    id: "homezen_living",
    name: "HomeZen Living",
    ownerName: "HomeZen Living GmbH",
    vertical: "Home / Living / Deko",
    spend30d: 19883,
    roas30d: 3.6,
    campaignHealth: "critical",
  },
];

/* ------------------------------------------------------------
   KAMPAGNEN PRO BRAND
------------------------------------------------------------- */

export const demoCampaignsByBrand = {
  acme_fashion: [
    { id: "acme_ugc_scale", name: "UGC Scale Test", status: "ACTIVE" },
    { id: "acme_brand_static", name: "Brand Awareness Static", status: "PAUSED" },
    { id: "acme_hook_battle", name: "Hook Battle Q4", status: "TESTING" },
  ],
  techgadgets_pro: [
    { id: "tech_launch", name: "Launch Funnel EU", status: "ACTIVE" },
    { id: "tech_retarg", name: "Retargeting Core", status: "ACTIVE" },
  ],
  beautylux_cosmetics: [
    { id: "beauty_creators", name: "Creator Evergreen", status: "ACTIVE" },
    { id: "beauty_ba", name: "Brand Awareness Beauty", status: "PAUSED" },
  ],
  fitlife_supplements: [
    { id: "fit_scale", name: "Scale Stack Q4", status: "ACTIVE" },
  ],
  homezen_living: [
    { id: "home_test", name: "Creative Testing", status: "TESTING" },
  ],
};

/* ------------------------------------------------------------
   CREATIVES (vereinheitlichte Beispiel-Daten)
------------------------------------------------------------- */

export const demoCreatives = [
  {
    id: "cr_acme_01",
    brandId: "acme_fashion",
    name: "UGC – „Mein Freund hasst es…“",
    type: "UGC / Reel",
    thumbnail: "https://via.placeholder.com/320x180?text=ACME+UGC",
    spend: 8400,
    revenue: 41200,
    roas: 4.9,
    ctr: 0.038,
    cpm: 7.4,
    cpc: 0.32,
    impressions: 960000,
    clicks: 36500,
    hook: "Story / Controversial",
    performance: "Winner",
  },
  {
    id: "cr_acme_02",
    brandId: "acme_fashion",
    name: "Static – -30% Summer Drop",
    type: "Static / Feed",
    thumbnail: "https://via.placeholder.com/320x180?text=ACME+Static",
    spend: 3100,
    revenue: 8700,
    roas: 2.8,
    ctr: 0.021,
    cpm: 9.1,
    cpc: 0.43,
    impressions: 337000,
    clicks: 7100,
    hook: "Offer",
    performance: "Testing",
  },
  {
    id: "cr_tech_01",
    brandId: "techgadgets_pro",
    name: "„Unboxing Day“ Creator Spot",
    type: "Creator / Story",
    thumbnail: "https://via.placeholder.com/320x180?text=Tech+UGC",
    spend: 5900,
    revenue: 28600,
    roas: 4.85,
    ctr: 0.034,
    cpm: 8.2,
    cpc: 0.29,
    impressions: 640000,
    clicks: 21800,
    hook: "Unboxing",
    performance: "Winner",
  },
  {
    id: "cr_beauty_01",
    brandId: "beautylux_cosmetics",
    name: "„Dermatologin erklärt…“",
    type: "Creator / Story",
    thumbnail: "https://via.placeholder.com/320x180?text=Beauty+Dr",
    spend: 8700,
    revenue: 53100,
    roas: 6.1,
    ctr: 0.033,
    cpm: 7.9,
    cpc: 0.31,
    impressions: 723000,
    clicks: 23900,
    hook: "Authority / Education",
    performance: "Winner",
  },
  {
    id: "cr_fit_01",
    brandId: "fitlife_supplements",
    name: "\"30-Day Challenge\" UGC",
    type: "UGC / Reel",
    thumbnail: "https://via.placeholder.com/320x180?text=FitLife+UGC",
    spend: 9900,
    revenue: 46500,
    roas: 4.7,
    ctr: 0.031,
    cpm: 7.0,
    cpc: 0.33,
    impressions: 702000,
    clicks: 21700,
    hook: "Challenge",
    performance: "Winner",
  },
  {
    id: "cr_home_01",
    brandId: "homezen_living",
    name: "\"Living Room Makeover\" UGC",
    type: "UGC / Reel",
    thumbnail: "https://via.placeholder.com/320x180?text=HomeZen+UGC",
    spend: 6200,
    revenue: 20900,
    roas: 3.37,
    ctr: 0.028,
    cpm: 7.6,
    cpc: 0.34,
    impressions: 498000,
    clicks: 13900,
    hook: "Before/After",
    performance: "Testing",
  },
];

/* ------------------------------------------------------------
   FUNNEL HEALTH (ToF/MoF/BoF)
------------------------------------------------------------- */

export const demoFunnel = {
  tof: {
    score: 86,
    issues: ["Scrollstop stark", "CTR stabil über Benchmark"],
    opportunities: ["Mehr Broad-Scaling möglich"],
  },
  mof: {
    score: 74,
    issues: ["Video-View-Rate mittel"],
    opportunities: ["DPA testen", "Testimonials verstärken"],
  },
  bof: {
    score: 69,
    issues: ["Checkout-Abbrüche 14%"],
    opportunities: ["Landing Pages A/B testen", "Trust Badges verstärken"],
  },
};

/* ------------------------------------------------------------
   ALERTS
------------------------------------------------------------- */

export const demoAlerts = [
  {
    id: "al_01",
    type: "Warnung",
    severity: "hoch",
    title: "UGC Vol.3 – Creative Fatigue erkannt",
    message:
      "ROAS fällt seit 3 Tagen. CTR sinkt um 18 %. Neues Creative testen.",
    timestamp: "2025-01-21",
  },
  {
    id: "al_02",
    type: "Info",
    severity: "mittel",
    title: "Retargeting – CPM gestiegen",
    message: "CPM +22 % im 30d-Vergleich. Budget prüfen.",
    timestamp: "2025-01-20",
  },
  {
    id: "al_03",
    type: "Erfolg",
    severity: "niedrig",
    title: "Hook A outperformt andere Varianten",
    message: "CTR +32 %, CPC -12 % → Hochskalieren empfohlen.",
    timestamp: "2025-01-19",
  },
];

/* ------------------------------------------------------------
   CREATOR LEADERBOARD
------------------------------------------------------------- */

export const demoCreators = [
  {
    id: "cr_lead_01",
    name: "Mia",
    avg_roas: 5.9,
    avg_ctr: 4.2,
    total_spend: 11800,
    profile_picture: "https://via.placeholder.com/80?text=M",
  },
  {
    id: "cr_lead_02",
    name: "Tom",
    avg_roas: 4.1,
    avg_ctr: 3.6,
    total_spend: 9400,
    profile_picture: "https://via.placeholder.com/80?text=T",
  },
  {
    id: "cr_lead_03",
    name: "Sarah",
    avg_roas: 3.7,
    avg_ctr: 3.2,
    total_spend: 7400,
    profile_picture: "https://via.placeholder.com/80?text=S",
  },
];

/* ------------------------------------------------------------
   AGGREGIERTES OBJEKT + WINDOW-HOOK
------------------------------------------------------------- */

export const DemoData = {
  brands: demoBrands,
  campaignsByBrand: demoCampaignsByBrand,
  creatives: demoCreatives,
  funnel: demoFunnel,
  alerts: demoAlerts,
  creators: demoCreators,
};

// Browser-Hook für compute.js etc.
if (typeof window !== "undefined") {
  window.SignalOneDemo = window.SignalOneDemo || {};
  window.SignalOneDemo.DemoData = DemoData;
  window.SignalOneDemo.brands = DemoData.brands;
}

export default DemoData;
