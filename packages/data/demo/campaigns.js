// packages/data/demo/campaigns.js
// -----------------------------------------------------------------------------
// DEMO Campaign Data (premium + realistisch)
// -----------------------------------------------------------------------------

export function demoCampaignsForAccount(accountId) {
  return [
    {
      id: "camp_scale_01",
      name: "Q4 Scaling – UGC Problem/Solution",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 27800,
        roas: 6.1,
        ctr: 3.8,
        cpm: 7.9,
        purchases: 2100
      }
    },
    {
      id: "camp_static_mf",
      name: "Static Mid-Funnel Offer",
      status: "ACTIVE",
      objective: "SALES",
      metrics: {
        spend: 16400,
        roas: 4.0,
        ctr: 2.4,
        cpm: 9.2,
        purchases: 680
      }
    },
    {
      id: "camp_ugc_test_01",
      name: "UGC Hook-Battle – v1 vs v2",
      status: "TESTING",
      objective: "SALES",
      metrics: {
        spend: 9200,
        roas: 3.8,
        ctr: 2.0,
        cpm: 8.4,
        purchases: 310
      }
    },
    {
      id: "camp_retarg_sp",
      name: "Retargeting – Social Proof",
      status: "ACTIVE",
      objective: "RETARGETING",
      metrics: {
        spend: 6800,
        roas: 5.4,
        ctr: 2.8,
        cpm: 7.1,
        purchases: 310
      }
    },
    {
      id: "camp_expensive",
      name: "Cold Broad – Creative Weakness",
      status: "PAUSED",
      objective: "AWARENESS",
      metrics: {
        spend: 7800,
        roas: 1.4,
        ctr: 0.92,
        cpm: 12.0,
        purchases: 68
      }
    }
  ];
}

export function demoInsightsForCampaign(campaignId) {
  return [
    {
      impressions: 120000,
      clicks: 4500,
      spend: 3800,
      ctr: 3.1,
      cpm: 7.6,
      website_purchase_roas: [{ value: 5.2 }],
      actions: [{ action_type: "purchase", value: 220 }]
    }
  ];
}
