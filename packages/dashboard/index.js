// packages/dashboard/index.js
// Enterprise Dashboard Grid für SignalOne
// Nutzt DemoData (window.SignalOneDemo) + AppState (Brand/Kampagne/Mode).

export function render(rootEl, AppState, env = {}) {
  if (!rootEl) return;

  const useDemo =
    typeof env.useDemoMode === "boolean" ? env.useDemoMode : true;

  const demo = window.SignalOneDemo && window.SignalOneDemo.DemoData;
  const brands = demo && demo.brands ? demo.brands : [];

  let brandId = AppState.selectedBrandId;
  if (!brandId && brands.length) {
    brandId = brands[0].id;
  }

  const brand =
    brands.find((b) => b.id === brandId) || (brands.length ? brands[0] : null);

  rootEl.innerHTML = "";

  if (!useDemo && !AppState.metaConnected) {
    const p = document.createElement("p");
    p.textContent =
      "Live-Modus aktiv. Dashboard wartet auf echte Meta-Daten, sobald das Backend angebunden ist.";
    rootEl.appendChild(p);
    return;
  }

  // ---- KPI / Demo Daten vorbereiten --------------------------------------

  const spend = brand ? brand.spend30d : 0;
  const roas = brand ? brand.roas30d : 0;
  const revenue = spend * roas;
  const kpis = getKpisForBrand(brand ? brand.id : null, spend, roas);
  const alerts = getAlertsForBrand(brand);
  const trendData = getTrendDataForBrand(brand);
  const leaderboard = getLeaderboardForBrand(brand);

  // ---- Hero-Bereich ------------------------------------------------------

  const hero = document.createElement("div");
  hero.className = "dashboard-hero";

  const heroStatus = document.createElement("div");
  heroStatus.className = "dashboard-hero-status";
  if (brand) {
    heroStatus.textContent = `${brand.name} • ROAS ${roas.toFixed(
      1
    )}x • Spend 30 Tage: ${formatCurrency(spend)}`;
  } else {
    heroStatus.textContent = "Kein Werbekonto ausgewählt.";
  }

  const heroTitle = document.createElement("h2");
  heroTitle.className = "dashboard-hero-title";
  heroTitle.textContent = "SignalOne Performance Dashboard";

  const heroSubtitle = document.createElement("p");
  heroSubtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    heroSubtitle.textContent = useDemo
      ? `Demo-Modus aktiv – simulierte Meta-Daten für ${brand.vertical}.`
      : `Live-Modus – Daten werden aus Meta geladen, sobald das Backend angebunden ist.`;
  } else {
    heroSubtitle.textContent =
      "Wähle links ein Modul und oben ein Werbekonto, um zu starten.";
  }

  hero.appendChild(heroStatus);
  hero.appendChild(heroTitle);
  hero.appendChild(heroSubtitle);

  rootEl.appendChild(hero);

  // ---- KPI Grid ----------------------------------------------------------

  const kpiGrid = document.createElement("div");
  kpiGrid.className = "kpi-grid";

  kpis.forEach((k) => {
    const card = document.createElement("div");
    card.className = "kpi-card";

    const label = document.createElement("strong");
    label.textContent = k.label;

    const value = document.createElement("div");
    value.textContent = k.value;

    card.appendChild(label);
    card.appendChild(value);
    kpiGrid.appendChild(card);
  });

  rootEl.appendChild(kpiGrid);

  // ---- Main Grid: Links Trends & Insight, Rechts Alerts ------------------

  const mainGrid = document.createElement("div");
  // minimal inline Layout, Rest kommt aus bestehenden Card-Styles
  mainGrid.style.display = "grid";
  mainGrid.style.gridTemplateColumns = "minmax(0, 2.2fr) minmax(0, 1.4fr)";
  mainGrid.style.gap = "16px";
  mainGrid.style.marginBottom = "24px";

  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");

  // Trends Card (nutzt sensei-card Style)
  const trendsCard = document.createElement("div");
  trendsCard.className = "sensei-card";
  const trendsTitle = document.createElement("h3");
  trendsTitle.textContent = "Performance-Tendenz (letzte 7 Tage)";
  const trendsList = document.createElement("ul");
  trendsList.style.listStyle = "none";
  trendsList.style.paddingLeft = "0";
  trendsList.style.margin = "8px 0 0";

  trendData.forEach((t) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "8px";
    li.style.marginBottom = "4px";

    const label = document.createElement("span");
    label.style.minWidth = "70px";
    label.style.fontSize = "0.8rem";
    label.textContent = t.label;

    const barWrapper = document.createElement("div");
    barWrapper.style.flex = "1";
    barWrapper.style.height = "6px";
    barWrapper.style.borderRadius = "999px";
    barWrapper.style.background = "#e0ddd8";

    const bar = document.createElement("div");
    bar.style.height = "100%";
    bar.style.borderRadius = "999px";
    bar.style.width = `${t.relative}%`;
    bar.style.background =
      "linear-gradient(90deg, var(--color-primary), #7e9e7a)";

    barWrapper.appendChild(bar);

    const value = document.createElement("span");
    value.style.fontSize = "0.8rem";
    value.textContent = t.value;

    li.appendChild(label);
    li.appendChild(barWrapper);
    li.appendChild(value);
    trendsList.appendChild(li);
  });

  trendsCard.appendChild(trendsTitle);
  trendsCard.appendChild(trendsList);

  // Insight Card (nutzt dashboard-insight)
  const insightCard = document.createElement("div");
  insightCard.className = "dashboard-insight";

  const insightTitle = document.createElement("strong");
  insightTitle.textContent = "Sensei Insight";

  const insightBody = document.createElement("p");
  insightBody.style.marginTop = "6px";
  insightBody.style.fontSize = "0.9rem";
  insightBody.style.lineHeight = "1.5";

  insightBody.textContent = getInsightText(brand, kpis, alerts);

  insightCard.appendChild(insightTitle);
  insightCard.appendChild(insightBody);

  leftCol.appendChild(trendsCard);
  leftCol.appendChild(insightCard);

  // Alerts rechts
  const alertsCard = document.createElement("div");
  alertsCard.className = "sensei-card";

  const alertsTitle = document.createElement("h3");
  alertsTitle.textContent = "Alerts & Checks";

  alertsCard.appendChild(alertsTitle);

  if (!alerts.length) {
    const empty = document.createElement("p");
    empty.className = "dashboard-alerts-empty";
    empty.textContent = "Keine kritischen Alerts für dieses Konto.";
    alertsCard.appendChild(empty);
  } else {
    alerts.forEach((a) => {
      const row = document.createElement("div");
      row.className = "alert";
      if (a.severity === "warning") row.classList.add("alert-warning");
      if (a.severity === "critical") row.classList.add("alert-critical");

      const title = document.createElement("strong");
      title.textContent = a.title + " ";

      const msg = document.createElement("span");
      msg.textContent = a.message;

      row.appendChild(title);
      row.appendChild(msg);
      alertsCard.appendChild(row);
    });
  }

  rightCol.appendChild(alertsCard);

  mainGrid.appendChild(leftCol);
  mainGrid.appendChild(rightCol);

  rootEl.appendChild(mainGrid);

  // ---- Creative Leaderboard (volle Breite, Enterprise-Style) -------------

  const lbWrapper = document.createElement("div");
  lbWrapper.className = "campaign-table";

  const table = document.createElement("table");

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  [
    "Creative",
    "Tags",
    "Spend (30d)",
    "ROAS",
    "CTR",
    "CPM",
    "Status",
  ].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");
  leaderboard.forEach((c) => {
    const tr = document.createElement("tr");

    // Name
    const tdName = document.createElement("td");
    tdName.textContent = c.name;
    tr.appendChild(tdName);

    // Tags
    const tdTags = document.createElement("td");
    tdTags.textContent = c.tags.join(" • ");
    tr.appendChild(tdTags);

    // Spend
    const tdSpend = document.createElement("td");
    tdSpend.textContent = formatCurrency(c.spend);
    tr.appendChild(tdSpend);

    // ROAS
    const tdRoas = document.createElement("td");
    tdRoas.textContent = `${c.roas.toFixed(1)}x`;
    tr.appendChild(tdRoas);

    // CTR
    const tdCtr = document.createElement("td");
    tdCtr.textContent = `${c.ctr.toFixed(2)} %`;
    tr.appendChild(tdCtr);

    // CPM
    const tdCpm = document.createElement("td");
    tdCpm.textContent = formatCurrency(c.cpm);
    tr.appendChild(tdCpm);

    // Status
    const tdStatus = document.createElement("td");
    tdStatus.textContent = c.status;
    tr.appendChild(tdStatus);

    tbody.appendChild(tr);
  });

  table.appendChild(thead);
  table.appendChild(tbody);
  lbWrapper.appendChild(table);

  rootEl.appendChild(lbWrapper);
}

// ---- Helper: KPI Daten pro Brand -----------------------------------------

function getKpisForBrand(brandId, spend, roas) {
  // simple presets pro Brand für realistische KPIs
  const presets = {
    acme_fashion: {
      cpm: 8.4,
      ctr: 2.7,
      cpc: 0.72,
      conv: 2180,
      profitMargin: 0.32,
    },
    techgadgets_pro: {
      cpm: 11.9,
      ctr: 1.9,
      cpc: 1.12,
      conv: 890,
      profitMargin: 0.28,
    },
    beautylux_cosmetics: {
      cpm: 7.6,
      ctr: 3.4,
      cpc: 0.61,
      conv: 3420,
      profitMargin: 0.36,
    },
    fitlife_supplements: {
      cpm: 9.1,
      ctr: 2.3,
      cpc: 0.83,
      conv: 1460,
      profitMargin: 0.30,
    },
    homezen_living: {
      cpm: 10.4,
      ctr: 1.7,
      cpc: 1.02,
      conv: 620,
      profitMargin: 0.24,
    },
  };

  const p = presets[brandId] || {
    cpm: 9.5,
    ctr: 2.2,
    cpc: 0.9,
    conv: 1000,
    profitMargin: 0.3,
  };

  const revenue = spend * roas;
  const profit = revenue * p.profitMargin;

  return [
    {
      key: "spend",
      label: "Ad Spend (30 Tage)",
      value: formatCurrency(spend),
    },
    {
      key: "revenue",
      label: "Revenue (30 Tage)",
      value: formatCurrency(revenue),
    },
    {
      key: "roas",
      label: "ROAS",
      value: `${roas.toFixed(1)}x`,
    },
    {
      key: "cpm",
      label: "CPM",
      value: formatCurrency(p.cpm),
    },
    {
      key: "ctr",
      label: "CTR",
      value: `${p.ctr.toFixed(2)} %`,
    },
    {
      key: "cpc",
      label: "CPC",
      value: formatCurrency(p.cpc),
    },
    {
      key: "conversions",
      label: "Conversions (30 Tage)",
      value: formatNumber(p.conv),
    },
    {
      key: "profit",
      label: "Estimated Profit",
      value: formatCurrency(profit),
    },
  ];
}

// ---- Helper: Alerts pro Brand --------------------------------------------

function getAlertsForBrand(brand) {
  if (!brand) return [];
  const alerts = [];

  if (brand.roas30d < 3.0) {
    alerts.push({
      severity: "critical",
      title: "ROAS unter Ziel",
      message:
        "Der 30-Tage-ROAS liegt unter 3.0x. Prüfe Creatives, Zielgruppen und Budgets.",
    });
  } else if (brand.roas30d < 4.0) {
    alerts.push({
      severity: "warning",
      title: "ROAS leicht unter Benchmark",
      message:
        "Der ROAS ist leicht unter deinem typischen Niveau. Mögliche Creative-Fatigue.",
    });
  }

  if (brand.spend30d > 50000 && brand.roas30d < 4.0) {
    alerts.push({
      severity: "critical",
      title: "High Spend bei mäßigem ROAS",
      message:
        "Du skalierst bereits stark, aber der ROAS fällt. Sensei empfiehlt: neue UGC-Hooks testen.",
    });
  }

  if (brand.campaignHealth === "critical") {
    alerts.push({
      severity: "critical",
      title: "Campaign Health kritisch",
      message:
        "Mehrere Kampagnen zeigen schwache Performance. Prüfe Zielgruppen-Overlap und Budgetverteilung.",
    });
  } else if (brand.campaignHealth === "warning") {
    alerts.push({
      severity: "warning",
      title: "Campaign Health beobachten",
      message:
        "Einige Kampagnen laufen stabil, andere brechen ein. Priorisiere Winner-Budgets.",
    });
  }

  if (!alerts.length) {
    alerts.push({
      severity: "info",
      title: "Alles stabil",
      message:
        "Keine kritischen Probleme erkannt. Nutze die Zeit für strukturierte Tests und neue Creatives.",
    });
  }

  return alerts;
}

// ---- Helper: Trenddaten ---------------------------------------------------

function getTrendDataForBrand(brand) {
  if (!brand) return [];

  // Simpler Demo-Ansatz: 7 Tage mit leichter Variation
  const base = brand.roas30d;
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  const arr = days.map((d, idx) => {
    const factor = 1 + (idx - 3) * 0.03; // kleine Kurve
    const roas = Math.max(1.0, base * factor);
    return {
      label: d,
      value: `${roas.toFixed(1)}x`,
      numeric: roas,
    };
  });

  const max = Math.max(...arr.map((a) => a.numeric)) || 1;
  return arr.map((a) => ({
    ...a,
    relative: Math.max(8, (a.numeric / max) * 100), // immer min 8% Breite
  }));
}

// ---- Helper: Creative Leaderboard ----------------------------------------

function getLeaderboardForBrand(brand) {
  if (!brand) return [];

  const dataByBrand = {
    acme_fashion: [
      {
        id: "acme_creative_1",
        name: "UGC – „Outfit in 10 Sekunden“",
        tags: ["Winner", "UGC", "Hook: Fast Try-On"],
        spend: 12890,
        roas: 6.2,
        ctr: 3.4,
        cpm: 7.8,
        status: "Scaling",
      },
      {
        id: "acme_creative_2",
        name: "Static – Lookbook Herbst",
        tags: ["Evergreen", "Static"],
        spend: 6210,
        roas: 4.1,
        ctr: 2.1,
        cpm: 8.2,
        status: "Stable",
      },
      {
        id: "acme_creative_3",
        name: "UGC – „Outfit Fail Fix“",
        tags: ["Testing", "UGC"],
        spend: 3120,
        roas: 3.2,
        ctr: 2.9,
        cpm: 9.1,
        status: "Testing",
      },
    ],
    techgadgets_pro: [
      {
        id: "tech_creative_1",
        name: "Product Demo – 30 Sek.",
        tags: ["Winner", "Demo", "Hook: Problem → Lösung"],
        spend: 9420,
        roas: 4.3,
        ctr: 2.1,
        cpm: 12.3,
        status: "Scaling",
      },
      {
        id: "tech_creative_2",
        name: "Unboxing – Creator Review",
        tags: ["UGC", "Creator"],
        spend: 5310,
        roas: 3.1,
        ctr: 1.7,
        cpm: 11.4,
        status: "Testing",
      },
    ],
    beautylux_cosmetics: [
      {
        id: "beauty_creative_1",
        name: "Before/After – Skin Routine",
        tags: ["Winner", "UGC", "Hook: Transformation"],
        spend: 15870,
        roas: 7.1,
        ctr: 3.9,
        cpm: 7.1,
        status: "Scaling",
      },
      {
        id: "beauty_creative_2",
        name: "Static – Ingredient Callout",
        tags: ["Evergreen", "Static"],
        spend: 7640,
        roas: 5.2,
        ctr: 2.8,
        cpm: 8.0,
        status: "Stable",
      },
    ],
    fitlife_supplements: [
      {
        id: "fit_creative_1",
        name: "UGC – „30 Tage Progress Story“",
        tags: ["Winner", "UGC"],
        spend: 9740,
        roas: 4.9,
        ctr: 2.6,
        cpm: 9.5,
        status: "Scaling",
      },
      {
        id: "fit_creative_2",
        name: "Coach POV – Gym Routine",
        tags: ["Testing", "UGC"],
        spend: 4130,
        roas: 3.5,
        ctr: 2.2,
        cpm: 8.9,
        status: "Testing",
      },
    ],
    homezen_living: [
      {
        id: "home_creative_1",
        name: "Before/After – Wohnzimmer Makeover",
        tags: ["Winner", "Hook: Raum-Transformation"],
        spend: 6820,
        roas: 4.0,
        ctr: 1.9,
        cpm: 10.1,
        status: "Scaling",
      },
      {
        id: "home_creative_2",
        name: "Static – Moodboard Cozy Home",
        tags: ["Static", "Testing"],
        spend: 2940,
        roas: 2.6,
        ctr: 1.3,
        cpm: 11.2,
        status: "Testing",
      },
    ],
  };

  const list = dataByBrand[brand.id] || [];
  // Sicherheitshalber sortieren nach ROAS und Spend
  return [...list].sort((a, b) => b.roas - a.roas || b.spend - a.spend);
}

// ---- Helper: Insight Text -------------------------------------------------

function getInsightText(brand, kpis, alerts) {
  if (!brand) {
    return "Wähle oben ein Werbekonto, um konkrete Insights zu erhalten. Sensei wertet dann deine Performance der letzten 30 Tage aus.";
  }

  const roasKpi = kpis.find((k) => k.key === "roas");
  const profitKpi = kpis.find((k) => k.key === "profit");
  const mainAlert = alerts[0];

  let base = `Für ${brand.name} liegt der aktuelle 30-Tage-ROAS bei ${
    roasKpi ? roasKpi.value : `${brand.roas30d.toFixed(1)}x`
  } mit einem geschätzten Profit von ${
    profitKpi ? profitKpi.value : "–"
  }. `;

  if (mainAlert && mainAlert.severity === "critical") {
    base +=
      "Sensei stuft die Situation als kritisch ein – priorisiere jetzt starke Creatives und senke Budget in schwachen Ad-Sets.";
  } else if (mainAlert && mainAlert.severity === "warning") {
    base +=
      "Es gibt Frühindikatoren für eine Verschlechterung. Plane neue Tests (Hooks, Thumbnails, First 3 Seconds), bevor der ROAS weiter fällt.";
  } else {
    base +=
      "Keine kritischen Probleme in Sicht. Nutze das Momentum, um Winner weiter zu skalieren und strukturierte Creative-Tests aufzusetzen.";
  }

  return base;
}

// ---- Formatting Helper ----------------------------------------------------

function formatCurrency(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE").format(value);
}
