/*
 * packages/dashboard/compute.js
 * Berechnet das komplette Dashboard-Model auf Basis von DemoData + AppState.
 * Ziel: Realistische, brand-spezifische Demo-Werte, die später 1:1 durch Live-Daten
 * ersetzt werden können (gleiche Struktur).
 */

function getDemoData() {
  return (window.SignalOneDemo && window.SignalOneDemo.DemoData) || null;
}

function getActiveBrandFromState(appState) {
  const demo = getDemoData();
  if (!demo || !demo.brands || !demo.brands.length) return null;

  const id = appState.selectedBrandId || demo.brands[0].id;
  return demo.brands.find((b) => b.id === id) || demo.brands[0];
}

/**
 * Statische Meta-Infos pro Brand (Budget, Trends, Stimmung).
 * Später kann das 1:1 aus einer DB kommen.
 */
function getBrandMetaConfig(brandId) {
  const configs = {
    acme_fashion: {
      budgetMonthly: 60000,
      heroTrends: { spend: 0.12, revenue: 0.08, roas: -0.04, profit: 0.15 },
      mood: "good",
    },
    techgadgets_pro: {
      budgetMonthly: 30000,
      heroTrends: { spend: 0.18, revenue: 0.11, roas: -0.22, profit: -0.12 },
      mood: "warning",
    },
    beautylux_cosmetics: {
      budgetMonthly: 70000,
      heroTrends: { spend: 0.09, revenue: 0.16, roas: 0.18, profit: 0.22 },
      mood: "good",
    },
    fitlife_supplements: {
      budgetMonthly: 38000,
      heroTrends: { spend: 0.07, revenue: 0.1, roas: -0.06, profit: 0.04 },
      mood: "warning",
    },
    homezen_living: {
      budgetMonthly: 26000,
      heroTrends: { spend: 0.03, revenue: -0.05, roas: -0.18, profit: -0.14 },
      mood: "critical",
    },
  };

  return (
    configs[brandId] || {
      budgetMonthly: 50000,
      heroTrends: { spend: 0.1, revenue: 0.1, roas: 0, profit: 0.1 },
      mood: "good",
    }
  );
}

/* Helper */

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function computeFinancialsForBrand(brand) {
  if (!brand) {
    return {
      spend30d: 0,
      roas30d: 0,
      revenue30d: 0,
      profit30d: 0,
    };
  }

  const spend30d = brand.spend30d || 0;
  const roas30d = brand.roas30d || 0;
  const revenue30d = spend30d * roas30d;

  // Profit gemäß PDF: Umsatz – Spend – 30 % COGS
  const profit30d = revenue30d - spend30d - revenue30d * 0.3;

  return {
    spend30d,
    roas30d,
    revenue30d,
    profit30d,
  };
}

/**
 * Vier Hero-KPI-Karten inkl. Trends & Status.
 */
function buildHeroKpis(brand, financials) {
  const cfg = getBrandMetaConfig(brand ? brand.id : null);
  const trends = cfg.heroTrends;

  function trendToLabel(value) {
    const sign = value > 0 ? "+" : "";
    return `${sign}${Math.round(value * 100)}%`;
  }

  function statusFromTrend(value, criticalDownThreshold = -0.15) {
    if (value <= criticalDownThreshold) return "critical";
    if (value < 0) return "warning";
    if (value > 0.15) return "good";
    return "neutral";
  }

  const hero = [];

  hero.push({
    key: "spend",
    label: "Ad Spend (30 Tage)",
    value: financials.spend30d,
    unit: "currency",
    trendLabel: trendToLabel(trends.spend),
    trendDirection: trends.spend >= 0 ? "up" : "down",
    status: statusFromTrend(trends.spend, -0.25),
    description: "Budget, das in Meta Ads investiert wurde.",
  });

  hero.push({
    key: "revenue",
    label: "Revenue (30 Tage)",
    value: financials.revenue30d,
    unit: "currency",
    trendLabel: trendToLabel(trends.revenue),
    trendDirection: trends.revenue >= 0 ? "up" : "down",
    status: statusFromTrend(trends.revenue, -0.25),
    description: "Umsatz, der aus bezahltem Traffic stammt.",
  });

  hero.push({
    key: "roas",
    label: "ROAS",
    value: financials.roas30d,
    unit: "multiplier",
    trendLabel: trendToLabel(trends.roas),
    trendDirection: trends.roas >= 0 ? "up" : "down",
    status: statusFromTrend(trends.roas, -0.12),
    description: "Return on Ad Spend – Effizienz deines Accounts.",
  });

  hero.push({
    key: "profit",
    label: "Estimated Profit",
    value: financials.profit30d,
    unit: "currency",
    trendLabel: trendToLabel(trends.profit),
    trendDirection: trends.profit >= 0 ? "up" : "down",
    status: statusFromTrend(trends.profit, -0.2),
    description:
      "Vereinfachte Profit-Schätzung aus deinem Paid-Social-Setup (30 Tage).",
  });

  return hero;
}

/**
 * 7-Tage Performance-Array
 * ROAS/Spend/Conversions aus 30d-Niveau abgeleitet, pro Brand unterschiedlich.
 */
function buildSevenDayPerformance(brand, financials) {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  if (!brand) {
    return {
      items: labels.map((label, idx) => ({
        label,
        roas: 4 + idx * 0.1,
        spend: 6000 + idx * 400,
        conversions: 250 + idx * 10,
      })),
      summary: {
        spend7d: 6000 * 7,
        conversions7d: 250 * 7,
      },
    };
  }

  const health = brand.campaignHealth || "good";

  let baseRoas = financials.roas30d || 4;
  let baseSpendPerDay = (financials.spend30d || 0) / 30;

  const roasFactorByHealth = {
    good: 1.02,
    warning: 0.93,
    critical: 0.8,
  };

  const volatilityByHealth = {
    good: 0.06,
    warning: 0.12,
    critical: 0.18,
  };

  const fRoas = roasFactorByHealth[health] || 1;
  const v = volatilityByHealth[health] || 0.1;

  baseRoas *= fRoas;

  const items = [];
  let totalSpend = 0;
  let totalConversions = 0;

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];

    const isPeakDay = label === "Fr" || label === "Sa" || label === "So";
    const dayFactor = isPeakDay ? 1.35 : 0.85;

    let spend = baseSpendPerDay * dayFactor * 1.1;
    const noise = (i - 3) * 0.04;
    spend *= 1 + noise;

    const roasDay =
      baseRoas * (1 + clamp(noise * 1.5, -v, v)); // Variation je Wochentag

    const revenueDay = spend * roasDay;
    const avgAOV = 120; // Demo: Ø Bestellwert
    const conversions = revenueDay / avgAOV;

    totalSpend += spend;
    totalConversions += conversions;

    items.push({
      label,
      roas: Number(roasDay.toFixed(1)),
      spend,
      conversions,
    });
  }

  return {
    items,
    summary: {
      spend7d: totalSpend,
      conversions7d: totalConversions,
    },
  };
}

/**
 * Alerts & Checks – aus Kampagnen-Health + Finanzstatus + Meta-Status.
 */
function buildAlerts(brand, financials, appState, demoModeActive) {
  const alerts = [];

  const health = brand?.campaignHealth || "good";

  if (health === "good") {
    alerts.push({
      severity: "info",
      label: "Alles stabil",
      message: "Keine kritischen Performance-Probleme erkannt.",
    });
  } else if (health === "warning") {
    alerts.push({
      severity: "warning",
      label: "Beobachten",
      message:
        "Einige Kampagnen laufen leicht unter Ziel – Fokus auf strukturierte Creative-Tests.",
    });
  } else if (health === "critical") {
    alerts.push({
      severity: "critical",
      label: "Kritisch",
      message:
        "Mehrere Kampagnen sind deutlich unter Ziel – Testing & Budget-Shift notwendig.",
    });
  }

  // ROAS / Profit basierte Hinweise
  if (financials.roas30d && financials.roas30d < 3.0) {
    alerts.push({
      severity: "warning",
      label: "ROAS unter 3.0x",
      message:
        "Dein 30-Tage-ROAS liegt unter 3.0x – prüfe Hooks, Creatives und Zielgruppen.",
    });
  }

  if (financials.profit30d < 0) {
    alerts.push({
      severity: "critical",
      label: "Profit negativ",
      message:
        "Die vereinfachte Profit-Schätzung ist negativ – prüfe Margen, Preise und Struktur.",
    });
  }

  if (!appState.metaConnected) {
    alerts.push({
      severity: "info",
      label: demoModeActive ? "Demo-Modus aktiv" : "Meta nicht verbunden",
      message: demoModeActive
        ? "Du befindest dich im Demo-Modus. Meta Live-Daten können später jederzeit verbunden werden."
        : "Meta ist aktuell nicht verbunden – Datenstand kann veraltet sein.",
    });
  }

  // Gesamtstatus für die "Lampe"
  let overall = "good";
  if (alerts.some((a) => a.severity === "critical")) {
    overall = "critical";
  } else if (alerts.some((a) => a.severity === "warning")) {
    overall = "warning";
  }

  return { overall, items: alerts };
}

/**
 * Top Creatives – brand-spezifische Demo-Varianten.
 */
function buildTopCreatives(brand, financials) {
  const id = brand?.id || "generic";
  const base = {
    acme_fashion: [
      {
        name: 'UGC "Hook Fast Try-On"',
        type: "UGC / Reel",
        roas: 6.2,
        spend: 12800,
        ctr: 0.034,
      },
      {
        name: 'Static "Brand Hero Look"',
        type: "Static / Feed",
        roas: 5.8,
        spend: 8100,
        ctr: 0.029,
      },
      {
        name: 'Creator "Outfit Story – Lea"',
        type: "Creator / Reel",
        roas: 5.5,
        spend: 9200,
        ctr: 0.027,
      },
      {
        name: 'UGC "Problem → Lösung Wardrobe"',
        type: "UGC / Story",
        roas: 5.1,
        spend: 7400,
        ctr: 0.025,
      },
      {
        name: 'Static "Product Grid – Essentials"',
        type: "Static / Catalog",
        roas: 4.9,
        spend: 6800,
        ctr: 0.023,
      },
    ],
    techgadgets_pro: [
      {
        name: 'UGC "Unboxing Experience"',
        type: "UGC / Reel",
        roas: 4.3,
        spend: 10200,
        ctr: 0.031,
      },
      {
        name: '"Setup Tour" Static Carousel',
        type: "Static / Carousel",
        roas: 3.9,
        spend: 7600,
        ctr: 0.026,
      },
      {
        name: "Creator Review – Mark",
        type: "Creator / Reel",
        roas: 3.6,
        spend: 6800,
        ctr: 0.024,
      },
    ],
    beautylux_cosmetics: [
      {
        name: '"Morning Routine" UGC',
        type: "UGC / Reel",
        roas: 7.1,
        spend: 15200,
        ctr: 0.039,
      },
      {
        name: 'Before/After "Glow Serum"',
        type: "Static / Before-After",
        roas: 6.4,
        spend: 9300,
        ctr: 0.035,
      },
      {
        name: "Creator Dermatologin – Trust Ad",
        type: "Creator / Story",
        roas: 6.1,
        spend: 8700,
        ctr: 0.033,
      },
    ],
    fitlife_supplements: [
      {
        name: '"30-Day Challenge" UGC',
        type: "UGC / Reel",
        roas: 4.7,
        spend: 9900,
        ctr: 0.031,
      },
      {
        name: '"Gym Bag Essentials" Static',
        type: "Static / Feed",
        roas: 4.2,
        spend: 7100,
        ctr: 0.026,
      },
    ],
    homezen_living: [
      {
        name: '"Living Room Makeover" UGC',
        type: "UGC / Reel",
        roas: 3.4,
        spend: 6200,
        ctr: 0.028,
      },
      {
        name: '"Before/After Cozy Corner"',
        type: "Static / Carousel",
        roas: 3.1,
        spend: 5400,
        ctr: 0.024,
      },
    ],
    generic: [
      {
        name: "Generic UGC Concept",
        type: "UGC / Reel",
        roas: financials.roas30d || 4.2,
        spend: financials.spend30d * 0.25 || 10000,
        ctr: 0.03,
      },
    ],
  };

  return base[id] || base.generic;
}

/**
 * Budget-Status: aktueller Spend vs. Monatsbudget (alle Brands).
 */
function buildBudgetStatus() {
  const demo = getDemoData();
  const allBrands = (demo && demo.brands) || [];
  const rows = [];

  allBrands.forEach((b) => {
    const cfg = getBrandMetaConfig(b.id);
    const monthlyBudget = cfg.budgetMonthly;
    const spend = b.spend30d;
    const pct = clamp(spend / monthlyBudget, 0, 1.2);
    let status = "ok";
    if (pct >= 0.9) status = "warning";
    if (pct >= 1.05) status = "critical";

    rows.push({
      id: b.id,
      name: b.name,
      spend,
      monthlyBudget,
      ratio: pct,
      status,
    });
  });

  return rows;
}

/**
 * Sensei Insight – Kurztext + Empfehlung.
 */
function buildSenseiInsight(brand, financials, alerts) {
  if (!brand) {
    return {
      title: "Sensei Insight",
      text: "Verbinde ein Werbekonto oder aktiviere den Demo-Modus, um konkrete Handlungsempfehlungen zu erhalten.",
      ctaLabel: "Demo-Modus nutzen",
      ctaTarget: "settings",
    };
  }

  const hasCritical = alerts.items.some((a) => a.severity === "critical");
  const hasWarning = alerts.items.some((a) => a.severity === "warning");

  const roas = financials.roas30d || 0;
  const profit = financials.profit30d || 0;

  let text;
  let ctaLabel;

  if (!hasWarning && !hasCritical && roas >= 4 && profit > 0) {
    text = `Für ${brand.name} liegt der 30-Tage-ROAS bei etwa ${roas.toFixed(
      1
    )}x mit einem geschätzten Profit von rund ${Math.round(
      profit
    ).toLocaleString(
      "de-DE"
    )} €. Keine kritischen Probleme sichtbar – nutze das Momentum, um Winner-Creatives weiter zu skalieren und strukturierte Tests aufzusetzen.`;
    ctaLabel = "Creative-Tests planen";
  } else if (hasCritical) {
    text = `Dein Account für ${brand.name} sendet mehrere kritische Signale. ROAS und Profit liegen teilweise klar unter Ziel. Priorität: Verluste stoppen, Budgets umschichten und konsequent neue Creatives testen.`;
    ctaLabel = "Krisenplan öffnen";
  } else {
    text = `Für ${brand.name} gibt es erste Warnsignale. Performance ist noch stabil, aber nicht mehr komfortabel. Jetzt ist der ideale Zeitpunkt, um neue Hooks zu testen, Zielgruppen zu bereinigen und Budget-Allokation sauber zu strukturieren.`;
    ctaLabel = "Nächste Tests definieren";
  }

  return {
    title: "Sensei Insight",
    text,
    ctaLabel,
    ctaTarget: "testingLog",
  };
}

/**
 * Hauptfunktion: baut das komplette Dashboard-Model
 * aus AppState + DemoData.
 */
export function computeDashboardModel(appState, demoModeActive) {
  const brand = getActiveBrandFromState(appState);
  const financials = computeFinancialsForBrand(brand);
  const heroKpis = buildHeroKpis(brand, financials);
  const performance = buildSevenDayPerformance(brand, financials);
  const alerts = buildAlerts(brand, financials, appState, demoModeActive);
  const topCreatives = buildTopCreatives(brand, financials);
  const budgetStatus = buildBudgetStatus();
  const senseiInsight = buildSenseiInsight(brand, financials, alerts);

  return {
    brand,
    financials,
    heroKpis,
    performance,
    alerts,
    topCreatives,
    budgetStatus,
    senseiInsight,
  };
}
