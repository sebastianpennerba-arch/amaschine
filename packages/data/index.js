// packages/data/index.js
// -----------------------------------------------------------------------------
// 🌐 SignalOne DataLayer
// - Zentraler Einstiegspunkt für alle datengetriebenen Views
// - Unterstützt Demo + Live + Auto-Hybrid (Option C)
// - Nutzt dein Backend (/api/meta/* & /api/sensei/*)
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------------------
// IMPORTS (Live + Demo Layer)
// -----------------------------------------------------------------------------
import {
  fetchLiveCampaigns,
  fetchLiveCampaignInsights,
} from "./live/campaigns.js";
import {
  demoCampaignsForAccount,
  demoInsightsForCampaign,
} from "./demo/campaigns.js";

import {
  fetchLiveCreatives,
  fetchLiveCreativeInsights,
} from "./live/creatives.js";
import {
  demoCreativesForAccount,
  demoCreativeInsights,
} from "./demo/creatives.js";

import { buildLiveTestingLog } from "./live/testing.js";
import { demoTestingLog } from "./demo/testing.js";

// -----------------------------------------------------------------------------
// GENERISCHE HELFER
// -----------------------------------------------------------------------------

const API_BASE = "/api";

async function postJSON(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body || {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `[DataLayer] POST ${path} failed: ${res.status} ${res.statusText} ${text}`,
    );
  }

  let json;
  try {
    json = await res.json();
  } catch (err) {
    throw new Error(`[DataLayer] POST ${path} invalid JSON: ${err.message}`);
  }
  return json;
}

function getAppState() {
  try {
    return (window.SignalOne && window.SignalOne.AppState) || {};
  } catch {
    return {};
  }
}

/**
 * Demo/Live/Auto-Auflösung:
 * - AppState.settings.demoMode → immer DEMO
 * - AppState.settings.dataMode → 'auto' | 'live' | 'demo'
 * - opts.modeOverride → per Call überschreibbar
 * - preferLive beeinflusst Auto-Verhalten
 */
function resolveDataMode({ preferLive = false, modeOverride } = {}) {
  const state = getAppState();
  const settings = state.settings || {};

  // 1) DemoMode dominiert – wichtig für Produkt-Demos
  if (settings.demoMode === true) return "demo";

  // 2) Expliziter Override pro Call
  if (modeOverride === "live" || modeOverride === "demo") {
    return modeOverride;
  }

  // 3) Globale Einstellung
  const configured =
    settings.dataMode === "live" || settings.dataMode === "demo"
      ? settings.dataMode
      : "auto";

  if (configured === "live" || configured === "demo") return configured;

  // 4) Auto-Modus: bei preferLive versuchen wir Live, sonst Demo
  if (preferLive) return "live";

  return "demo";
}

// Meta-Token-Gatekeeper (P5-Regel)
function getMetaAccessToken() {
  const state = getAppState();
  const token =
    state.meta?.accessToken ||
    state.metaAccessToken ||
    (state.meta && state.meta.token) ||
    null;
  return token || null;
}

// -----------------------------------------------------------------------------
// DEMO – Sensei Analyse (premium + realistisch)
// -----------------------------------------------------------------------------
function buildDemoSenseiResponse() {
  const creatives = [
    {
      id: "cre_ugc_scale",
      name: "UGC Scale Test – Q4",
      creator: "Lea (UGC Creator)",
      hook: "Problem/Solution – „Von Scroll zu Sale“",
      metrics: {
        spend: 27298,
        revenue: 159000,
        roas: 5.9,
        impressions: 920000,
        clicks: 33400,
        ctr: 3.63,
        cpm: 8.0,
        purchases: 1900,
      },
    },
    {
      id: "cre_static_awareness",
      name: "Brand Awareness Static",
      creator: "Inhouse Design",
      hook: "Static – Brand Frame",
      metrics: {
        spend: 16972,
        revenue: 72000,
        roas: 4.2,
        impressions: 610000,
        clicks: 16500,
        ctr: 2.7,
        cpm: 9.4,
        purchases: 740,
      },
    },
    {
      id: "cre_hook_battle",
      name: "Hook Battle – Social Proof vs. Problem",
      creator: "Alex (Creative Strategist)",
      hook: "Testimonial / Review",
      metrics: {
        spend: 16002,
        revenue: 64000,
        roas: 4.0,
        impressions: 540000,
        clicks: 14100,
        ctr: 2.6,
        cpm: 8.5,
        purchases: 600,
      },
    },
    {
      id: "cre_ugc_unboxing",
      name: "UGC Unboxing – TikTok Style",
      creator: "Mara (UGC Creator)",
      hook: "UGC / Unboxing",
      metrics: {
        spend: 9800,
        revenue: 51000,
        roas: 5.2,
        impressions: 360000,
        clicks: 15400,
        ctr: 4.3,
        cpm: 7.0,
        purchases: 520,
      },
    },
    {
      id: "cre_retarg_carousel",
      name: "Retargeting Carousel – Social Proof",
      creator: "Performance Team",
      hook: "Direct CTA",
      metrics: {
        spend: 7400,
        revenue: 39000,
        roas: 5.3,
        impressions: 240000,
        clicks: 7200,
        ctr: 3.0,
        cpm: 7.9,
        purchases: 410,
      },
    },
    {
      id: "cre_static_offer",
      name: "Static – Mid Funnel Offer",
      creator: "Inhouse Design",
      hook: "Offer / Scarcity",
      metrics: {
        spend: 6200,
        revenue: 18000,
        roas: 2.9,
        impressions: 210000,
        clicks: 3900,
        ctr: 1.9,
        cpm: 7.4,
        purchases: 160,
      },
    },
  ];

  const totals = creatives.reduce(
    (acc, c) => {
      acc.totalSpend += c.metrics.spend;
      acc.totalRevenue += c.metrics.revenue;
      acc.totalPurchases += c.metrics.purchases;
      acc.totalImpressions += c.metrics.impressions;
      acc.totalClicks += c.metrics.clicks;
      return acc;
    },
    {
      totalSpend: 0,
      totalRevenue: 0,
      totalPurchases: 0,
      totalImpressions: 0,
      totalClicks: 0,
    },
  );

  const avgRoas = totals.totalRevenue / Math.max(totals.totalSpend, 1);
  const avgCtr =
    (totals.totalClicks / Math.max(totals.totalImpressions, 1)) * 100;
  const avgCpm =
    (totals.totalSpend / Math.max(totals.totalImpressions, 1)) * 1000;

  const scoring = creatives.map((c) => {
    const roasScore = Math.min(c.metrics.roas / 6, 1);
    const ctrScore = Math.min(c.metrics.ctr / 4, 1);
    const spendScore = Math.min(c.metrics.spend / 30000, 1);

    let score = Math.round(
      55 + roasScore * 25 + ctrScore * 12 + spendScore * 8,
    );
    if (score > 100) score = 100;
    if (score < 35) score = 35;

    let label = "Neutral";
    if (score >= 85) label = "Winner";
    else if (score >= 70) label = "Strong";
    else if (score <= 45) label = "Loser";
    else if (score <= 60) label = "Under Review";

    const reasoning = [];

    if (c.metrics.roas > avgRoas * 1.3) {
      reasoning.push("Deutlich über Account-ROAS.");
    } else if (c.metrics.roas < avgRoas * 0.8) {
      reasoning.push("Unter Account-ROAS – Budget prüfen.");
    }

    if (c.metrics.ctr > avgCtr * 1.3) {
      reasoning.push("Überdurchschnittliche CTR – Hook sitzt.");
    } else if (c.metrics.ctr < avgCtr * 0.8) {
      reasoning.push("Schwache CTR – Scrollstop überarbeiten.");
    }

    if (!reasoning.length) {
      reasoning.push("Solide Performance, aber noch kein klarer Winner.");
    }

    const tone =
      score >= 80 ? "good" : score >= 55 ? "warning" : "critical";

    return {
      id: c.id,
      name: c.name,
      creator: c.creator,
      hookLabel: c.hook,
      label,
      tone,
      score,
      reasoning: reasoning.join(" "),
      metrics: {
        roas: c.metrics.roas,
        spend: c.metrics.spend,
        revenue: c.metrics.revenue,
        ctr: c.metrics.ctr,
        cpm: c.metrics.cpm,
        purchases: c.metrics.purchases,
      },
    };
  });

  const performance = {
    summary: {
      totalCreatives: creatives.length,
      totalSpend: totals.totalSpend,
      totalRevenue: totals.totalRevenue,
      avgRoas,
      avgCtr,
      avgCpm,
      avgScore:
        scoring.reduce((sum, s) => sum + s.score, 0) /
        Math.max(scoring.length, 1),
    },
    scoring,
    winners: scoring.filter((s) => s.label === "Winner"),
    losers: scoring.filter((s) => s.label === "Loser"),
    testing: scoring.filter((s) => s.label === "Under Review"),
    recommendations: [
      {
        type: "budget_shift",
        priority: "high",
        title: "Budget in UGC-Winner verschieben",
        message:
          "Deine UGC-Creatives mit Social Proof liefern den höchsten ROAS. Schiebe Budget von schwachen Statics in diese Winner.",
        details: {},
      },
      {
        type: "testing",
        priority: "medium",
        title: "Hook-Battle fortführen",
        message:
          "Die Hook-Battle-Kampagnen liefern solide erste Signale. Führe strukturierte Tests über 3–5 Tage durch.",
        details: {},
      },
    ],
  };

  const offer = {
    summary: {
      totalCampaigns: 3,
      avgRoas: avgRoas * 0.95,
      avgCtr,
      avgCpm,
      totalSpend: totals.totalSpend,
      totalRevenue: totals.totalRevenue,
    },
    campaigns: [],
    recommendations: [
      {
        type: "offer",
        priority: "high",
        title: "Offer mit starkem Social Proof skalieren",
        message:
          "Offer-Varianten, die auf Testimonials setzen, liegen deutlich über dem Account-ROAS.",
        details: {},
      },
    ],
  };

  const hook = {
    summary: {
      hookCount: 4,
      totalCreatives: creatives.length,
    },
    hooks: [],
    recommendations: [
      {
        type: "hook_winners",
        priority: "high",
        title: "Problem/Solution & UGC sind deine Hook-Winner",
        message:
          "Diese Hook-Cluster schlagen statische Banner deutlich. Produziere mehr Variationen in diesem Stil.",
        details: {},
      },
    ],
  };

  const combinedRecs = [
    ...performance.recommendations,
    ...offer.recommendations,
    ...hook.recommendations,
  ];

  return {
    success: true,
    _source: "demo",
    performance,
    offer,
    hook,
    recommendations: combinedRecs,
  };
}

// -----------------------------------------------------------------------------
// DEMO – Roast Analyse (1 Creative, premium+realistisch)
// -----------------------------------------------------------------------------
function buildDemoRoastResponse(creative) {
  const name = creative?.name || "Dein Creative";
  const hookLabel =
    creative?.hook ||
    creative?.hookLabel ||
    "Problem/Solution UGC";
  const type =
    creative?.type ||
    creative?.format ||
    "UGC Vertical";

  // einfache, aber „smarte“ Bewertung
  const baseScore = 86;
  const tone = "strong";

  return {
    success: true,
    _source: "demo",
    mode: "roast",
    target: {
      name,
      hookLabel,
      type,
    },
    score: baseScore,
    verdict: "Starkes Creative mit klarer Skalierungschance",
    tone,
    strengths: [
      "Klarer Problem/Solution-Auftakt – guter Scrollstop im ersten Frame.",
      "Konsistenter Social Proof – Vertrauen wird schnell aufgebaut.",
      "Klares Offer & Call-to-Action im letzten Drittel.",
    ],
    risks: [
      "Hook-Text könnte noch aggressiver in Richtung „Outcome“ formuliert werden.",
      "Kein expliziter Zeit-/Knappheitsanker (Scarcity) im Offer.",
    ],
    nextSteps: [
      "Variante mit stärkerem „Before/After“ im ersten Hook-Frame testen.",
      "Zweite Version mit expliziter Deadline („nur diese Woche“) produzieren.",
      "Text-Overlay im CTA-Finale testen (z.B. „Jetzt 30 Tage testen“).",
    ],
  };
}

// -----------------------------------------------------------------------------
// LIVE – Sensei Analyse via Backend-Endpoint
//   POST /api/sensei/analyze
// -----------------------------------------------------------------------------

async function fetchLiveSenseiAnalysis({ creatives, campaigns } = {}) {
  const token = getMetaAccessToken();
  if (!token) {
    throw new Error("[DataLayer] No Meta access token for live Sensei.");
  }

  const payload = {
    creatives: Array.isArray(creatives) ? creatives : [],
    campaigns: Array.isArray(campaigns) ? campaigns : [],
  };

  if (!payload.creatives.length) {
    throw new Error(
      "[DataLayer] No creatives provided for live Sensei analysis.",
    );
  }

  const res = await postJSON("/sensei/analyze", payload);

  if (!res || res.success !== true) {
    throw new Error("[DataLayer] /api/sensei/analyze returned error.");
  }

  return { ...res, _source: "live" };
}

// -----------------------------------------------------------------------------
// PUBLIC API – DataLayer
// -----------------------------------------------------------------------------

const DataLayer = {
  /**
   * MODE: "auto" | "live" | "demo"
   * Kann über Settings oder direkt verändert werden.
   */
  mode: "auto",

  setMode(mode) {
    if (mode === "live" || mode === "demo" || mode === "auto") {
      this.mode = mode;
    }
  },

  /**
   * Modus-Resolver, der internen Mode, AppState & preferLive kombiniert
   */
  _resolveMode(opts = {}) {
    if (this.mode === "live" || this.mode === "demo") {
      return this.mode;
    }
    return resolveDataMode(opts);
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.1 — Campaigns Integration
  // ---------------------------------------------------------------------------

  async fetchCampaignsForAccount({ accountId, preferLive = false } = {}) {
    const mode = this._resolveMode({ preferLive });

    if (mode === "demo") {
      return {
        _source: "demo",
        items: demoCampaignsForAccount(accountId),
      };
    }

    try {
      const token = getMetaAccessToken();
      const live = await fetchLiveCampaigns({
        accountId,
        accessToken: token,
      });

      return {
        _source: "live",
        items: live,
      };
    } catch (err) {
      console.warn("[DataLayer] fetchCampaigns fallback demo", err);
      return {
        _source: "demo-fallback",
        items: demoCampaignsForAccount(accountId),
      };
    }
  },

  async fetchCampaignInsights({
    campaignId,
    preset = "last_7d",
    preferLive = false,
  } = {}) {
    const mode = this._resolveMode({ preferLive });

    if (mode === "demo") {
      return {
        _source: "demo",
        items: demoInsightsForCampaign(campaignId),
      };
    }

    try {
      const token = getMetaAccessToken();
      const live = await fetchLiveCampaignInsights({
        campaignId,
        accessToken: token,
        preset,
      });

      return {
        _source: "live",
        items: live,
      };
    } catch (err) {
      console.warn("[DataLayer] insights fallback demo", err);
      return {
        _source: "demo-fallback",
        items: demoInsightsForCampaign(campaignId),
      };
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.2 — Creatives Integration
  // ---------------------------------------------------------------------------

  async fetchCreativesForAccount({ accountId, preferLive = false } = {}) {
    const mode = this._resolveMode({ preferLive });

    if (mode === "demo") {
      return {
        _source: "demo",
        items: demoCreativesForAccount(accountId),
      };
    }

    try {
      const token = getMetaAccessToken();
      const live = await fetchLiveCreatives({
        accountId,
        accessToken: token,
      });
      return {
        _source: "live",
        items: live,
      };
    } catch (err) {
      console.warn("[DataLayer] fetchCreatives fallback to demo", err);
      return {
        _source: "demo-fallback",
        items: demoCreativesForAccount(accountId),
      };
    }
  },

  async fetchCreativeInsights({
    creativeId,
    campaignId,
    preset = "last_7d",
    preferLive = false,
  } = {}) {
    const mode = this._resolveMode({ preferLive });

    if (mode === "demo") {
      return {
        _source: "demo",
        items: demoCreativeInsights(creativeId),
      };
    }

    try {
      const token = getMetaAccessToken();
      const insights = await fetchLiveCreativeInsights({
        campaignId,
        accessToken: token,
        preset,
      });
      return {
        _source: "live",
        items: insights,
      };
    } catch (err) {
      console.warn("[DataLayer] creative insights demo fallback", err);
      return {
        _source: "demo-fallback",
        items: demoCreativeInsights(creativeId),
      };
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.3 — Sensei Analyse (Live + Demo + Hybrid)
  // ---------------------------------------------------------------------------

  async fetchSenseiAnalysis(opts = {}) {
    const mode = this._resolveMode(opts);

    // Demomodus erzwingen
    if (mode === "demo") {
      return buildDemoSenseiResponse();
    }

    try {
      let { creatives, campaigns } = opts;

      // Wenn nichts übergeben → wir befüllen selbst aus DataLayer
      if (
        !Array.isArray(creatives) ||
        !creatives.length ||
        !Array.isArray(campaigns) ||
        !campaigns.length
      ) {
        const state = getAppState();
        const accountId =
          opts.accountId ||
          state.meta?.selectedAdAccountId ||
          state.meta?.adAccountId ||
          state.selectedAdAccountId ||
          state.selectedAccountId ||
          null;

        if (!accountId) {
          throw new Error(
            "[DataLayer] No accountId available for live Sensei analysis.",
          );
        }

        const [campResult, creatResult] = await Promise.all([
          this.fetchCampaignsForAccount({ accountId, preferLive: true }),
          this.fetchCreativesForAccount({ accountId, preferLive: true }),
        ]);

        campaigns = campResult.items || [];
        creatives = creatResult.items || [];
      }

      const live = await fetchLiveSenseiAnalysis({ creatives, campaigns });
      return live;
    } catch (err) {
      console.warn(
        "[DataLayer] Live Sensei failed, falling back to demo:",
        err,
      );
      return buildDemoSenseiResponse();
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.4 — Testing Log Integration
  // ---------------------------------------------------------------------------

  async fetchTestingLog({ accountId, preferLive = false } = {}) {
    const mode = this._resolveMode({ preferLive });

    // DEMO erzwingen
    if (mode === "demo") {
      return demoTestingLog();
    }

    try {
      const [cre, campaigns] = await Promise.all([
        this.fetchCreativesForAccount({ accountId, preferLive: true }),
        this.fetchCampaignsForAccount({ accountId, preferLive: true }),
      ]);

      const creatives = cre.items || [];
      const campaignList = campaigns.items || [];

      const insightsMap = {};

      for (const camp of campaignList) {
        const ins = await this.fetchCampaignInsights({
          campaignId: camp.id,
          preferLive: true,
        });

        const rows = ins.items || [];

        rows.forEach((row) => {
          const cid = row.creative_id || row.ad_id || null;
          if (!cid) return;
          insightsMap[cid] = row;
        });
      }

      return await buildLiveTestingLog({
        creatives,
        insightsByCreative: insightsMap,
      });
    } catch (err) {
      console.warn("[DataLayer] TestingLog → Demo fallback", err);
      return demoTestingLog();
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.5 — Dashboard Summary Integration
  // ---------------------------------------------------------------------------

  async fetchDashboardSummary({ accountId, preferLive = false } = {}) {
    const mode = this._resolveMode({ preferLive });

    // --- DEMO SUMMARY ---------------------------------------------------------
    if (mode === "demo") {
      const demoCamps = demoCampaignsForAccount(accountId);
      const demoCreats = demoCreativesForAccount(accountId);

      return {
        _source: "demo",
        spend: demoCamps.reduce((s, c) => s + c.metrics.spend, 0),
        revenue: demoCamps.reduce(
          (s, c) => s + c.metrics.spend * c.metrics.roas,
          0,
        ),
        roas:
          demoCamps.reduce((s, c) => s + c.metrics.roas, 0) /
          Math.max(demoCamps.length, 1),
        ctr:
          demoCamps.reduce((s, c) => s + c.metrics.ctr, 0) /
          Math.max(demoCamps.length, 1),
        cpm:
          demoCamps.reduce((s, c) => s + c.metrics.cpm, 0) /
          Math.max(demoCamps.length, 1),

        topCampaign: demoCamps.sort(
          (a, b) => b.metrics.roas - a.metrics.roas,
        )[0],
        worstCampaign: demoCamps.sort(
          (a, b) => a.metrics.roas - b.metrics.roas,
        )[0],

        topCreative: demoCreats.sort(
          (a, b) => b.metrics.roas - a.metrics.roas,
        )[0],
        worstCreative: demoCreats.sort(
          (a, b) => a.metrics.roas - b.metrics.roas,
        )[0],
      };
    }

    // --- LIVE SUMMARY ---------------------------------------------------------
    try {
      const token = getMetaAccessToken();
      if (!token) throw new Error("No Meta access token");

      const [campRes, creatRes] = await Promise.all([
        this.fetchCampaignsForAccount({ accountId, preferLive: true }),
        this.fetchCreativesForAccount({ accountId, preferLive: true }),
      ]);

      const camps = campRes.items || [];
      const creats = creatRes.items || [];

      const spend = camps.reduce(
        (s, c) => s + (c.metrics?.spend || 0),
        0,
      );
      const revenue = camps.reduce(
        (s, c) =>
          s + (c.metrics?.spend || 0) * (c.metrics?.roas || 0),
        0,
      );

      const avgRoas =
        camps.reduce((s, c) => s + (c.metrics?.roas || 0), 0) /
        Math.max(camps.length, 1);

      const avgCtr =
        camps.reduce((s, c) => s + (c.metrics?.ctr || 0), 0) /
        Math.max(camps.length, 1);

      const avgCpm =
        camps.reduce((s, c) => s + (c.metrics?.cpm || 0), 0) /
        Math.max(camps.length, 1);

      const topCampaign =
        camps.sort(
          (a, b) => (b.metrics?.roas || 0) - (a.metrics?.roas || 0),
        )[0] || null;

      const worstCampaign =
        camps.sort(
          (a, b) => (a.metrics?.roas || 0) - (b.metrics?.roas || 0),
        )[0] || null;

      const topCreative =
        creats.sort(
          (a, b) => (b.metrics?.roas || 0) - (a.metrics?.roas || 0),
        )[0] || null;

      const worstCreative =
        creats.sort(
          (a, b) => (a.metrics?.roas || 0) - (b.metrics?.roas || 0),
        )[0] || null;

      return {
        _source: "live",
        spend,
        revenue,
        roas: avgRoas,
        ctr: avgCtr,
        cpm: avgCpm,
        topCampaign,
        worstCampaign,
        topCreative,
        worstCreative,
      };
    } catch (err) {
      console.warn("[DataLayer] Dashboard fallback DEMO", err);

      const demoCamps = demoCampaignsForAccount(accountId);
      const demoCreats = demoCreativesForAccount(accountId);

      return {
        _source: "demo-fallback",
        spend: demoCamps.reduce((s, c) => s + c.metrics.spend, 0),
        revenue: demoCamps.reduce(
          (s, c) => s + c.metrics.spend * c.metrics.roas,
          0,
        ),
        roas:
          demoCamps.reduce((s, c) => s + c.metrics.roas, 0) /
          Math.max(demoCamps.length, 1),
        ctr:
          demoCamps.reduce((s, c) => s + c.metrics.ctr, 0) /
          Math.max(demoCamps.length, 1),
        cpm:
          demoCamps.reduce((s, c) => s + c.metrics.cpm, 0) /
          Math.max(demoCamps.length, 1),

        topCampaign: demoCamps.sort(
          (a, b) => b.metrics.roas - a.metrics.roas,
        )[0],
        worstCampaign: demoCamps.sort(
          (a, b) => a.metrics.roas - b.metrics.roas,
        )[0],

        topCreative: demoCreats.sort(
          (a, b) => b.metrics.roas - a.metrics.roas,
        )[0],
        worstCreative: demoCreats.sort(
          (a, b) => a.metrics.roas - b.metrics.roas,
        )[0],
      };
    }
  },

  // ---------------------------------------------------------------------------
  // PHASE 1.6 — Roast Integration (Live + Demo)
  // ---------------------------------------------------------------------------

  /**
   * Single-Creative Roast:
   *  - Im DEMO-Modus: synthetische, aber realistische Bewertung
   *  - Im LIVE-Modus: nutzt /api/sensei/analyze mit einem Creative
   *
   * opts:
   *  - creative: { ... }   // Pflicht für Demo, sinnvoll für Live
   *  - campaigns?: []      // optional für Live-Kontext
   *  - preferLive?: bool
   *  - modeOverride?: "live" | "demo"
   */
  async fetchRoastAnalysis(opts = {}) {
    const mode = this._resolveMode(opts);

    if (mode === "demo") {
      return buildDemoRoastResponse(opts.creative);
    }

    try {
      let creatives = [];

      if (Array.isArray(opts.creatives) && opts.creatives.length) {
        creatives = opts.creatives;
      } else if (opts.creative) {
        creatives = [opts.creative];
      } else {
        throw new Error(
          "[DataLayer] fetchRoastAnalysis requires at least one creative.",
        );
      }

      const campaigns = Array.isArray(opts.campaigns)
        ? opts.campaigns
        : [];

      const res = await fetchLiveSenseiAnalysis({
        creatives,
        campaigns,
      });

      // Markieren, dass es ein Roast-Usecase ist
      return {
        ...res,
        mode: "roast",
        _source: res._source || "live",
      };
    } catch (err) {
      console.warn("[DataLayer] Roast Live failed, demo fallback:", err);
      return buildDemoRoastResponse(opts.creative);
    }
  },
};

export default DataLayer;
