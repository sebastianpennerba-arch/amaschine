/*
 * Creative Library Demo Daten – Final kompatibel
 * Macht Daten global unter window.SignalOneDemo verfügbar
 */

(function () {

  const BASE_CREATIVES = [
    {
      id: "c1",
      name: "Mia_Hook_Problem_Solution_v3",
      title: "Hook: Problem → Lösung (UGC)",
      creator: "Mia",
      hook: "Problem/Solution",
      type: ["ugc", "video"],
      bucket: "winner",
      tags: ["winner", "ugc"],
      format: "UGC Video",
      campaignName: "UGC Scale Test",
      daysActive: 12,
      score: 94,
      metrics: {
        roas: 6.8,
        spend: 12340,
        ctr: 0.041,
        cpm: 7.2,
        purchases: 171
      }
    },
    {
      id: "c2",
      name: "Tom_Testimonial_ShortForm_v1",
      title: "Testimonial mit Social Proof Line",
      creator: "Tom",
      hook: "Testimonial",
      type: ["ugc", "video"],
      bucket: "winner",
      tags: ["winner"],
      format: "UGC Video",
      campaignName: "UGC Scale Test",
      daysActive: 9,
      score: 91,
      metrics: {
        roas: 5.9,
        spend: 8400,
        ctr: 0.038,
        cpm: 7.8,
        purchases: 133
      }
    },
    {
      id: "c3",
      name: "Lisa_BeforeAfter_Showcase_v2",
      title: "Snappy Before/After",
      creator: "Lisa",
      hook: "Before/After",
      type: ["video"],
      bucket: "winner",
      tags: ["winner"],
      format: "UGC Video",
      campaignName: "Conversion Boost",
      daysActive: 11,
      score: 88,
      metrics: {
        roas: 5.2,
        spend: 6100,
        ctr: 0.035,
        cpm: 7.1,
        purchases: 122
      }
    },
    {
      id: "c4",
      name: "Generic_Product_Static_v12",
      title: "Static Produkt – Direct CTA",
      creator: "Stock",
      hook: "Direct CTA",
      type: ["static"],
      bucket: "loser",
      tags: ["loser"],
      format: "Static Ad",
      campaignName: "Brand Awareness",
      daysActive: 21,
      score: 34,
      metrics: {
        roas: 1.2,
        spend: 3200,
        ctr: 0.009,
        cpm: 9.8,
        purchases: 22
      }
    },
    {
      id: "c5",
      name: "Mia_Problem_Solution_v4",
      title: "Hook Variation",
      creator: "Mia",
      hook: "Problem/Solution V2",
      type: ["ugc", "video"],
      bucket: "testing",
      tags: ["testing", "ugc"],
      format: "UGC Video",
      campaignName: "Testing: Hook Battle",
      daysActive: 4,
      score: 72,
      metrics: {
        roas: 4.2,
        spend: 2400,
        ctr: 0.038,
        cpm: 7.5,
        purchases: 55
      }
    },
    {
      id: "c6",
      name: "Tom_Testimonial_LongForm_v2",
      title: "Testimonial Long Form",
      creator: "Tom",
      hook: "Testimonial",
      type: ["video"],
      bucket: "testing",
      tags: ["testing"],
      format: "UGC Video",
      campaignName: "Testing: Hook Battle",
      daysActive: 5,
      score: 68,
      metrics: {
        roas: 3.1,
        spend: 2100,
        ctr: 0.024,
        cpm: 8.3,
        purchases: 41
      }
    },
    {
      id: "c7",
      name: "Lisa_Static_BeforeAfter_v1",
      title: "Static Variation Before/After",
      creator: "Lisa",
      hook: "Before/After",
      type: ["static"],
      bucket: "testing",
      tags: ["testing", "static"],
      format: "Static Ad",
      campaignName: "Retargeting Cold",
      daysActive: 7,
      score: 59,
      metrics: {
        roas: 3.4,
        spend: 1800,
        ctr: 0.028,
        cpm: 7.9,
        purchases: 39
      }
    },
    {
      id: "c8",
      name: "UGC_Founder_Story_v1",
      title: "Founder Story (UGC)",
      creator: "Founder",
      hook: "Story",
      type: ["ugc", "video"],
      bucket: "testing",
      tags: ["testing", "ugc"],
      format: "UGC Video",
      campaignName: "Brand Storytelling",
      daysActive: 6,
      score: 76,
      metrics: {
        roas: 4.9,
        spend: 3900,
        ctr: 0.036,
        cpm: 8.0,
        purchases: 61
      }
    }
  ];

  // brand demo
  const brands = [
    {
      id: "acme",
      name: "ACME Fashion GmbH",
      roas30d: 4.8,
      spend30d: 47892
    }
  ];

  window.SignalOneDemo = {
    BASE_CREATIVES,
    brands
  };

})();
