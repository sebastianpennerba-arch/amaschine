/* ----------------------------------------------------------
   CAMPAIGNS – compute.js
   Hybrid Demo / Meta Live Analytics Layer
-----------------------------------------------------------*/

import { formatCurrency, formatNumber, formatPercent } from "../utils/format.js";

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n =
    typeof value === "string"
      ? parseFloat(value.replace(/,/g, ""))
      : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/* Deterministic pseudo-random for Demo */
function seededRandom(seed) {
  let h = 0;
  const str = String(seed || "");
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0) / 0xffffffff;
}

/* ----------------------------------------------------------
   Health Score
-----------------------------------------------------------*/
function computeHealthScoreFromMetrics(metrics) {
  if (!metrics) return { score: 0, label: "unknown" };

  const roasScore = Math.min(metrics.roas / 6, 1);
  const ctrScore = Math.min((metrics.ctr * 100) / 4, 1);
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
   Demo metrics
-----------------------------------------------------------*/
function buildDemoMetrics(camp, brandId, index) {
  const seed = (brandId || "b") + ":" + (camp.id || index);
  const r1 = seededRandom(seed + ":a");
  const r2 = seededRandom(seed + ":b");
  const r3 = seededRandom(seed + ":c");
  const r4 = seededRandom(seed + ":d");

  const spend = Math.round(4000 + r1 * 24000);
  const roas = Number((2 + r2 * 4).toFixed(1));
  const ctr = Number((0.012 + r3 * 0.028).toFixed(3));
  const cpm = Number((6 + (1 - r2) * 6).toFixed(1));
  const purchases = Math.round(spend / (25 + r4 * 40));

  return { spend, roas, ctr, cpm, purchases };
}

/* ----------------------------------------------------------
   Live metrics
-----------------------------------------------------------*/
function normalizeLiveMetrics(raw) {
  const src = raw?.metrics || raw || {};

  const impressions = toNumber(src.impressions);
  const clicks = toNumber(src.clicks);
  const spend = toNumber(src.spend);

  let ctr = toNumber(src.ctr);
  if (!ctr && impressions > 0) ctr = clicks / impressions;

  let cpm = toNumber(src.cpm);
  if (!cpm && impressions > 0) cpm = (spend / impressions) * 1000;

  const roas =
    toNumber(src.roas) ||
    toNumber(src.purchase_roas) ||
    toNumber(src.website_purchase_roas) ||
    0;

  const purchases = toNumber(
    src.purchases ?? src.purchases_30d ?? src.purchase ?? 0
  );

  return { spend, roas, ctr, cpm, purchases };
}

function normalizeStatus(s) {
  if (!s) return "ACTIVE";
  const t = String(s).toUpperCase();
  if (t.includes("PAUSE")) return "PAUSED";
  if (t.includes("TEST")) return "TESTING";
  if (t === "ACTIVE") return "ACTIVE";
  return t;
}

/* ----------------------------------------------------------
   Build campaigns Hybrid (Demo/Live)
-----------------------------------------------------------*/
export function buildCampaignsForBrand(brandId, appState, { useDemoMode }) {
  const demoData = window.SignalOneDemo?.DemoData;
  const effectiveBrand =
    brandId || appState.selectedBrandId || demoData?.brands?.[0]?.id;

  const demoList = demoData?.campaignsByBrand?.[effectiveBrand] || [];

  const hasLive =
    !useDemoMode &&
    appState.metaConnected &&
    Array.isArray(appState.meta?.campaigns) &&
    appState.meta.campaigns.length > 0;

  const rawList = hasLive ? appState.meta.campaigns : demoList;
  const source = hasLive ? "live" : "demo";

  return {
    campaigns: rawList.map((raw, i) => {
      const metrics =
        source === "live"
          ? normalizeLiveMetrics(raw)
          : buildDemoMetrics(raw, effectiveBrand, i);

      const health = computeHealthScoreFromMetrics(metrics);

      return {
        id:
          raw.id ||
          raw.campaign_id ||
          raw.campaignId ||
          `camp_${effectiveBrand}_${i}`,
        name: raw.name || raw.campaign_name || `Kampagne ${i + 1}`,
        status: normalizeStatus(raw.status || raw.effective_status),
        metrics,
        health,
        objective: raw.objective || null,
        _source: source,
      };
    }),

    source,
  };
}

/* ----------------------------------------------------------
   Summary
-----------------------------------------------------------*/
export function computeCampaignSummary(campaigns) {
  if (!campaigns?.length) {
    return {
      spendTotal: formatCurrency(0),
      avgROAS: formatNumber(0, 1, "x"),
      avgCTR: formatPercent(0, 1),
      activeCount: 0,
      testingCount: 0,
      pausedCount: 0,
    };
  }

  let spend = 0,
    roas = 0,
    ctr = 0;

  let A = 0,
    P = 0,
    T = 0;

  campaigns.forEach((c) => {
    spend += c.metrics.spend;
    roas += c.metrics.roas;
    ctr += c.metrics.ctr;

    if (c.status === "ACTIVE") A++;
    if (c.status === "PAUSED") P++;
    if (c.status === "TESTING") T++;
  });

  const n = campaigns.length;

  return {
    spendTotal: formatCurrency(spend),
    avgROAS: formatNumber(roas / n, 1, "x"),
    avgCTR: formatPercent((ctr / n) * 100, 1),
    activeCount: A,
    testingCount: T,
    pausedCount: P,
  };
}
