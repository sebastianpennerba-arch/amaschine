/* ----------------------------------------------------------
   CAMPAIGNS – compute.js
   Hybrid Demo / Meta Live Analytics Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

/* ----------------------------------------------------------
   Small numeric helpers
-----------------------------------------------------------*/
function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, ""))
      : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Deterministic pseudo-random generator based on a string seed.
 * Used only for demo metrics so the UI feels stable across renders.
 */
function seededRandom(seed) {
  let h = 0;
  const str = String(seed || "");
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  // Convert to [0, 1)
  return (h >>> 0) / 0xffffffff;
}

/* ----------------------------------------------------------
   Health Score Berechnung für jede Kampagne
-----------------------------------------------------------*/
function computeHealthScoreFromMetrics(metrics) {
  if (!metrics) {
    return { score: 0, label: "unknown" };
  }

  const roasScore = Math.min(metrics.roas / 6, 1); // 6x ROAS = 100%
  const ctrScore = Math.min((metrics.ctr * 100) / 4, 1); // 4% CTR = 100%
  const cpmScore = metrics.cpm < 8 ? 1 : metrics.cpm < 12 ? 0.6 : 0.3;
  const spendScore = Math.min(metrics.spend / 20000, 1);

  const finalScore = (roasScore + ctrScore + cpmScore + spendScore) / 4;
  const score = Math.round(finalScore * 100);

  let label = "good";
  if (finalScore < 0.35) label = "critical";
  else if (finalScore < 0.65) label = "warning";

  return { score, label };
}

/* ----------------------------------------------------------
   Demo-Metriken generieren (stabil dank Seed)
-----------------------------------------------------------*/
function buildDemoMetrics(campaign, brandId, index = 0) {
  const baseSeed = (brandId || "brand") + ":" + (campaign.id || index);

  const rSpend = seededRandom(baseSeed + ":spend");
  const rRoas = seededRandom(baseSeed + ":roas");
  const rCtr = seededRandom(baseSeed + ":ctr");
  const rPurchases = seededRandom(baseSeed + ":purchases");

  const spend = Math.round(4000 + rSpend * 26000); // 4k – 30k
  const roas = Number((2 + rRoas * 4).toFixed(1)); // 2x – 6x
  const ctr = Number((0.012 + rCtr * 0.028).toFixed(3)); // 1.2% – 4.0%
  const cpm = Number((6 + (1 - rRoas) * 6).toFixed(1)); // 6 – 12 EUR
  const purchases = Math.round(spend / (25 + rPurchases * 45));

  return { spend, roas, ctr, cpm, purchases };
}

/* ----------------------------------------------------------
   Live-Metriken normalisieren (Meta Insights Snapshot)
-----------------------------------------------------------*/
function normalizeLiveMetrics(raw) {
  const src = raw && raw.metrics ? raw.metrics : raw || {};

  const impressions = toNumber(src.impressions);
  const clicks = toNumber(src.clicks);

  const spend = toNumber(
    src.spend ?? src.spend_30d ?? src.spend_7d ?? src.spend_1d
  );

  const roas =
    toNumber(
      src.roas ??
        src.roas_30d ??
        src.purchase_roas ??
        src.website_purchase_roas
    ) || 0;

  let ctr = toNumber(src.ctr);
  if (!ctr && impressions > 0) {
    ctr = clicks / impressions;
  }

  let cpm = toNumber(src.cpm);
  if (!cpm && impressions > 0) {
    cpm = (spend / impressions) * 1000;
  }

  const purchases = toNumber(
    src.purchases ?? src.purchases_30d ?? src.purchase ?? 0
  );

  return {
    spend,
    roas,
    ctr,
    cpm,
    purchases,
  };
}

function normalizeStatus(status) {
  if (!status) return "ACTIVE";
  const s = String(status).toUpperCase();
  if (s.includes("PAUSE")) return "PAUSED";
  if (s.includes("TEST")) return "TESTING";
  if (s === "ACTIVE" || s === "ON") return "ACTIVE";
  return s;
}

/* ----------------------------------------------------------
   Öffentliche Helfer
-----------------------------------------------------------*/

/**
 * Baut die Kampagnenliste für eine Brand.
 * Nutzt Live-Meta, wenn verfügbar und nicht im Demo-Mode,
 * sonst DemoData als Fallback.
 */
export function buildCampaignsForBrand(brandId, appState, { useDemoMode } = {}) {
  const state = appState || {};
  const demoData = window.SignalOneDemo?.DemoData;
  const effectiveBrandId =
    brandId ||
    state.selectedBrandId ||
    (demoData?.brands && demoData.brands[0]?.id) ||
    null;

  const demoList =
    (demoData && demoData.campaignsByBrand?.[effectiveBrandId]) || [];

  const hasLiveCampaigns =
    !useDemoMode &&
    state.metaConnected &&
    Array.isArray(state.meta?.campaigns) &&
    state.meta.campaigns.length > 0;

  const insights = Array.isArray(state.meta?.insights)
    ? state.meta.insights
    : null;

  let source = "demo";
  let rawList = demoList;

  if (hasLiveCampaigns) {
    rawList = state.meta.campaigns;
    source = "live";
  }

  const campaigns = rawList.map((raw, index) => {
    let metrics;

    if (source === "live") {
      let metricsSource = raw;

      const id = raw.id || raw.campaign_id || raw.campaignId;
      if (insights && id) {
        const insight = insights.find(
          (i) => i.campaign_id === id || i.campaignId === id
        );
        if (insight) {
          metricsSource = { ...insight, ...raw };
        }
      }

      metrics = normalizeLiveMetrics(metricsSource);
    } else {
      metrics = buildDemoMetrics(raw, effectiveBrandId, index);
    }

    const health = computeHealthScoreFromMetrics(metrics);

    return {
      id: raw.id || raw.campaign_id || raw.campaignId || `campaign_${index}`,
      name: raw.name || raw.campaign_name || `Kampagne ${index + 1}`,
      status: normalizeStatus(raw.status || raw.effective_status),
      objective: raw.objective || raw.objective_type || null,
      metrics,
      health,
      _source: source,
    };
  });

  return { campaigns, source };
}

/**
 * Aggregierte Kennzahlen für Header-Pills.
 */
export function computeCampaignSummary(campaigns) {
  if (!Array.isArray(campaigns) || campaigns.length === 0) {
    return {
      spendTotal: formatCurrency(0),
      avgROAS: formatNumber(0, 1, "x"),
      avgCTR: formatPercent(0, 1),
      activeCount: 0,
      testingCount: 0,
      pausedCount: 0,
    };
  }

  let spend = 0;
  let roasSum = 0;
  let ctrSum = 0;
  let active = 0;
  let paused = 0;
  let testing = 0;

  campaigns.forEach((c) => {
    const m = c.metrics || {};
    spend += toNumber(m.spend);
    roasSum += toNumber(m.roas);
    ctrSum += toNumber(m.ctr);

    if (c.status === "ACTIVE") active++;
    if (c.status === "PAUSED") paused++;
    if (c.status === "TESTING") testing++;
  });

  const count = campaigns.length || 1;

  return {
    spendTotal: formatCurrency(spend),
    avgROAS: formatNumber(roasSum / count, 1, "x"),
    avgCTR: formatPercent((ctrSum / count) * 100, 1),
    activeCount: active,
    testingCount: testing,
    pausedCount: paused,
  };
}
