// packages/data/index.js
// -----------------------------------------------------------------------------
// 🌐 SignalOne DataLayer
// - EIN zentraler Einstiegspunkt für alle datengetriebenen Views
// - Unterstützt Demo + Live + Auto-Hybrid (Option C)
// - Respektiert AppState.settings.demoMode + optionale Override-Settings
// - Bietet aktuell:
//     • fetchSenseiAnalysis({ preferLive? })
//   (weitere Endpunkte für Campaigns, Creatives etc. folgen in Phase 1.x)
// -----------------------------------------------------------------------------

const API_BASE = "/api";

// -----------------------------------------------------------------------------
// Kleine Helpers
// -----------------------------------------------------------------------------

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
      `[DataLayer] POST ${path} failed: ${res.status} ${res.statusText} ${text}`
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
 * Modusauflösung:
 * - AppState.settings.demoMode → immer DEMO
 * - AppState.settings.dataMode → 'auto' | 'live' | 'demo'
 * - opts.modeOverride → kann für einzelne Calls genutzt werden
 * - preferLive (z.B. aus View) beeinflusst Auto-Modus
 */
function resolveDataMode({ preferLive = false, modeOverride } = {}) {
  const state = getAppState();
  const settings = state.settings || {};

  // 1) DemoMode gewinnt immer – wichtig für dein Demo-Setup
  if (settings.demoMode === true) {
    return "demo";
  }

  // 2) Expliziter Override (z.B. aus Settings-UI)
  if (modeOverride === "live" || modeOverride === "demo") {
    return modeOverride;
  }

  // 3) AppState dataMode (falls vorhanden)
  const configured =
    settings.dataMode === "live" || settings.dataMode === "demo"
      ? settings.dataMode
      : "auto";

  if (configured === "live" || configured === "demo") {
    return configured;
  }

  // 4) Auto-Modus: preferLive beeinflusst nur die Entscheidung,
  //    bei Fehlen von Meta-Verbindung bleiben wir bei DEMO.
  if (preferLive) {
    return "live";
  }

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

/**
 * Erzeugt eine künstliche, aber realistische Sensei-Antwort
 * im gleichen Format wie /api/sensei/analyze.
 *
 * Ziel: Premium-Demo für Präsentationen, ohne echte Meta-Daten.
 */
function buildDemoSenseiResponse() {
  // 6 Demo-Creatives mit "premium + realistischen" Zahlen
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

  // Aggregate (vereinfachte Ableitung)
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
    }
  );

  const avgRoas = totals.totalRevenue / Math.max(totals.totalSpend, 1);
  const avgCtr =
    (totals.totalClicks / Math.max(totals.totalImpressions, 1)) * 100;
  const avgCpm =
    (totals.totalSpend / Math.max(totals.totalImpressions, 1)) * 1000;

  // Grobe Scores (kein komplexes Modell – das macht auf dem Backend dein Sensei Engine)
  const scoring = creatives.map((c) => {
    // base: roas & ctr
    const roasScore = Math.min(c.metrics.roas / 6, 1);
    const ctrScore = Math.min(c.metrics.ctr / 4, 1); // 4% CTR = 100
    const spendScore = Math.min(c.metrics.spend / 30000, 1);

    let score = Math.round(
      55 + roasScore * 25 + ctrScore * 12 + spendScore * 8
    ); // 55–100 in etwa

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
      avgCtr: avgCtr,
      avgCpm: avgCpm,
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
// LIVE – Sensei Analyse via Backend-Endpoint
// -----------------------------------------------------------------------------

async function fetchLiveSenseiAnalysis({ creatives, campaigns } = {}) {
  const token = getMetaAccessToken();
  const state = getAppState();

  // Wenn kein Meta-Token vorhanden, macht Live hier keinen Sinn → Fehler,
  // wird aber im DataLayer automatisch auf Demo zurückfallen.
  if (!token) {
    throw new Error("[DataLayer] No Meta access token for live Sensei.");
  }

  // In der finalen Ausbaustufe sollen hier echte Creatives / Kampagnen
  // aus Meta verwendet werden. Für Phase 1 nutzen wir ggf. bereits
  // vorhandene Daten aus dem AppState, falls sie existieren.
  const payload = {
    creatives:
      creatives ||
      state.meta?.creatives ||
      state.meta?.ads ||
      [], // TODO: in Phase 1.x sauber anbinden
    campaigns: campaigns || state.meta?.campaigns || [],
  };

  if (!Array.isArray(payload.creatives) || !payload.creatives.length) {
    throw new Error("[DataLayer] No creatives available for live Sensei.");
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
   * Universeller Modus-Resolver, der sowohl internen Mode
   * als auch AppState + preferLive berücksichtigt.
   */
  _resolveMode(opts = {}) {
    // interne Mode-Override (manuelles Setter)
    if (this.mode === "live" || this.mode === "demo") {
      return this.mode;
    }
    return resolveDataMode(opts);
  },

  /**
   * Sensei Analyse holen.
   * opts:
   *  - preferLive?: boolean
   *  - modeOverride?: "live" | "demo"
   *  - creatives?, campaigns? (optional für Live)
   *
   * Rückgabe: Objekt im gleichen Format wie /api/sensei/analyze.
   */
  async fetchSenseiAnalysis(opts = {}) {
    const mode = this._resolveMode(opts);

    // DEMO erzwingen
    if (mode === "demo") {
      return buildDemoSenseiResponse();
    }

    // LIVE bevorzugen, Demo fallback
    try {
      const live = await fetchLiveSenseiAnalysis(opts);
      return live;
    } catch (err) {
      console.warn(
        "[DataLayer] Live Sensei failed, falling back to demo:",
        err
      );
      return buildDemoSenseiResponse();
    }
  },

// -------------------------------------------------------
// PHASE 1.1 — Campaigns Integration
// -------------------------------------------------------

import {
  fetchLiveCampaigns,
  fetchLiveCampaignInsights
} from "./live/campaigns.js";
import {
  demoCampaignsForAccount,
  demoInsightsForCampaign
} from "./demo/campaigns.js";

// Kampagnenliste
DataLayer.fetchCampaignsForAccount = async function ({
  accountId,
  preferLive = false
} = {}) {
  const mode = this._resolveMode({ preferLive });

  // DEMO
  if (mode === "demo") {
    return {
      _source: "demo",
      items: demoCampaignsForAccount(accountId)
    };
  }

  // LIVE versuchen
  try {
    const token = getMetaAccessToken();
    const live = await fetchLiveCampaigns({
      accountId,
      accessToken: token
    });

    return {
      _source: "live",
      items: live
    };
  } catch (err) {
    console.warn("[DataLayer] fetchCampaigns fallback demo", err);
    return {
      _source: "demo-fallback",
      items: demoCampaignsForAccount(accountId)
    };
  }
};

// Kampagnen-Insights
DataLayer.fetchCampaignInsights = async function ({
  campaignId,
  preset = "last_7d",
  preferLive = false
}) {
  const mode = this._resolveMode({ preferLive });

  if (mode === "demo") {
    return {
      _source: "demo",
      items: demoInsightsForCampaign(campaignId)
    };
  }

  try {
    const token = getMetaAccessToken();
    const live = await fetchLiveCampaignInsights({
      campaignId,
      accessToken: token,
      preset
    });

    return {
      _source: "live",
      items: live
    };
  } catch (err) {
    console.warn("[DataLayer] insights fallback demo", err);
    return {
      _source: "demo-fallback",
      items: demoInsightsForCampaign(campaignId)
    };
  }
};

// -------------------------------------------------------
// PHASE 1.2 — Creatives Integration
// -------------------------------------------------------

import {
  fetchLiveCreatives,
  fetchLiveCreativeInsights
} from "./live/creatives.js";
import {
  demoCreativesForAccount,
  demoCreativeInsights
} from "./demo/creatives.js";

// Creatives holen
DataLayer.fetchCreativesForAccount = async function ({
  accountId,
  preferLive = false
} = {}) {
  const mode = this._resolveMode({ preferLive });

  if (mode === "demo") {
    return { _source: "demo", items: demoCreativesForAccount(accountId) };
  }

  try {
    const token = getMetaAccessToken();
    const live = await fetchLiveCreatives({ accountId, accessToken: token });
    return { _source: "live", items: live };
  } catch (err) {
    console.warn("[DataLayer] fetchCreatives fallback to demo", err);
    return { _source: "demo-fallback", items: demoCreativesForAccount() };
  }
};

// Creative Insights holen
DataLayer.fetchCreativeInsights = async function ({
  creativeId,
  campaignId,
  preset = "last_7d",
  preferLive = false
}) {
  const mode = this._resolveMode({ preferLive });

  if (mode === "demo") {
    return { _source: "demo", items: demoCreativeInsights(creativeId) };
  }

  try {
    const token = getMetaAccessToken();
    const insights = await fetchLiveCreativeInsights({
      campaignId,
      accessToken: token,
      preset
    });
    return { _source: "live", items: insights };
  } catch (err) {
    console.warn("[DataLayer] creative insights demo fallback", err);
    return { _source: "demo-fallback", items: demoCreativeInsights(creativeId) };
  }
};


  /**
   * TODO Phase 1.x:
   *  - fetchCampaignsForAccount({ accountId, preferLive })
   *  - fetchCampaignInsights({ campaignId, preset, preferLive })
   *  - fetchAdsForAccount({ accountId, preferLive })
   *  - fetchTestingLog(...)
   *  - fetchDashboardSummary(...)
   */
};

export default DataLayer;
