// packages/reports/index.js
// SignalOne – Report Center (Weekly, Executive, Deep Analytics)
// Nutzt Brand-Kontext (AppState.selectedBrandId) & Demo-/Live-Mode (env.useDemoMode)

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

  // Live-Guard – ohne Demo & ohne Meta → Info
  if (!useDemo && !AppState.metaConnected) {
    const msg = document.createElement("p");
    msg.textContent =
      "Live-Modus aktiv. Das Report Center wird echte Reports generieren, sobald die Meta-Anbindung fertig ist. Aktuell kannst du den Demo-Modus nutzen.";
    rootEl.appendChild(msg);
    return;
  }

  const reportData = getReportDataForBrand(brand ? brand.id : null);

  // -------------------------------------------------------------
  // HEADER (Hero)
  // -------------------------------------------------------------

  const header = document.createElement("div");
  header.className = "dashboard-hero";

  const statusChip = document.createElement("div");
  statusChip.className = "dashboard-hero-status";
  statusChip.textContent = brand
    ? `${brand.name} • Report Center`
    : "Kein Werbekonto ausgewählt";

  const title = document.createElement("h2");
  title.className = "dashboard-hero-title";
  title.textContent = "Report Center";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    subtitle.textContent = useDemo
      ? "Hier kannst du Weekly Reports, Executive Summaries und Deep Analytics Reports auf Basis deines Demo-Accounts generieren."
      : "Im Live-Modus werden hier echte Reports auf Basis deiner Meta-Daten generiert.";
  } else {
    subtitle.textContent =
      "Wähle oben ein Werbekonto, um Reports für dieses Konto zu erstellen.";
  }

  header.appendChild(statusChip);
  header.appendChild(title);
  header.appendChild(subtitle);
  rootEl.appendChild(header);

  // -------------------------------------------------------------
  // Tab-Bar + Export-Area
  // -------------------------------------------------------------

  const tabBarWrapper = document.createElement("div");
  tabBarWrapper.style.display = "flex";
  tabBarWrapper.style.justifyContent = "space-between";
  tabBarWrapper.style.alignItems = "center";
  tabBarWrapper.style.marginBottom = "12px";

  const tabBar = document.createElement("div");
  tabBar.style.display = "inline-flex";
  tabBar.style.borderRadius = "999px";
  tabBar.style.padding = "3px";
  tabBar.style.background = "var(--color-surface-muted)";

  const tabs = [
    { key: "weekly", label: "Weekly Report" },
    { key: "executive", label: "Executive Summary" },
    { key: "analytics", label: "Deep Analytics" },
  ];

  let currentTab = "weekly";

  const tabButtons = {};

  tabs.forEach((t) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = t.label;
    btn.style.border = "none";
    btn.style.borderRadius = "999px";
    btn.style.padding = "6px 14px";
    btn.style.fontSize = "0.85rem";
    btn.style.cursor = "pointer";
    btn.style.background = t.key === currentTab ? "var(--color-surface)" : "transparent";
    btn.style.color =
      t.key === currentTab
        ? "var(--color-text)"
        : "var(--color-text-soft)";

    btn.addEventListener("click", () => {
      currentTab = t.key;
      updateTabStyles();
      renderTabContent();
    });

    tabButtons[t.key] = btn;
    tabBar.appendChild(btn);
  });

  const exportArea = document.createElement("div");
  exportArea.style.display = "flex";
  exportArea.style.gap = "8px";

  const exportCsvBtn = document.createElement("button");
  exportCsvBtn.type = "button";
  exportCsvBtn.textContent = "Export als CSV";
  exportCsvBtn.style.fontSize = "0.8rem";
  exportCsvBtn.style.padding = "6px 10px";

  const copyTextBtn = document.createElement("button");
  copyTextBtn.type = "button";
  copyTextBtn.textContent = "Report-Text anzeigen";
  copyTextBtn.style.fontSize = "0.8rem";
  copyTextBtn.style.padding = "6px 10px";

  exportArea.appendChild(exportCsvBtn);
  exportArea.appendChild(copyTextBtn);

  tabBarWrapper.appendChild(tabBar);
  tabBarWrapper.appendChild(exportArea);

  rootEl.appendChild(tabBarWrapper);

  // Content-Container
  const content = document.createElement("div");
  rootEl.appendChild(content);

  // -------------------------------------------------------------
  // Tab-Rendering
  // -------------------------------------------------------------

  function updateTabStyles() {
    tabs.forEach((t) => {
      const btn = tabButtons[t.key];
      if (!btn) return;
      const active = t.key === currentTab;
      btn.style.background = active ? "var(--color-surface)" : "transparent";
      btn.style.color = active
        ? "var(--color-text)"
        : "var(--color-text-soft)";
    });
  }

  function renderTabContent() {
    content.innerHTML = "";

    if (!brand) {
      const p = document.createElement("p");
      p.textContent = "Kein Brand ausgewählt. Wähle oben ein Werbekonto.";
      content.appendChild(p);
      return;
    }

    if (currentTab === "weekly") {
      renderWeeklyReport(content, brand, reportData);
    } else if (currentTab === "executive") {
      renderExecutiveSummary(content, brand, reportData);
    } else {
      renderDeepAnalytics(content, brand, reportData);
    }
  }

  // Initial
  updateTabStyles();
  renderTabContent();

  // -------------------------------------------------------------
  // Export-Buttons
  // -------------------------------------------------------------

  exportCsvBtn.addEventListener("click", () => {
    try {
      exportReportCsv(currentTab, brand, reportData);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          `Report „${getTabLabel(currentTab)}“ als CSV exportiert.`,
          "success"
        );
      }
    } catch (err) {
      console.error("Report CSV Export Fehler:", err);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          "Report-Export aktuell nicht möglich (Demo-Limit).",
          "error"
        );
      }
    }
  });

  copyTextBtn.addEventListener("click", () => {
    if (!window.SignalOne || !window.SignalOne.openSystemModal) return;

    const text = generatePlainTextReport(currentTab, brand, reportData);
    const body = `
      <p><strong>${getTabLabel(currentTab)} – Textversion</strong></p>
      <p style="font-size:0.85rem;color:#6b7280;margin-top:4px;">
        Du kannst diesen Text in E-Mails, Notion-Dokumente oder Präsentationen kopieren.
      </p>
      <textarea style="width:100%;min-height:220px;margin-top:8px;font-size:0.85rem;">${text}</textarea>
      <p style="margin-top:8px;font-size:0.8rem;color:#6b7280;">
        Hinweis: Später kann hier zusätzlich ein echter PDF-Export integriert werden.
      </p>
    `;
    window.SignalOne.openSystemModal("Report-Text", body);
  });
}

// ===========================================================================
// TAB-INHALTE
// ===========================================================================

function renderWeeklyReport(container, brand, data) {
  const summaryRow = document.createElement("div");
  summaryRow.className = "kpi-grid";

  const cardSpend7 = createKpiCard(
    "Ad Spend – letzte 7 Tage",
    formatCurrency(data.metrics.spend7d)
  );
  const cardRevenue7 = createKpiCard(
    "Revenue – letzte 7 Tage",
    formatCurrency(data.metrics.revenue7d)
  );
  const cardRoas7 = createKpiCard(
    "ROAS – letzte 7 Tage",
    `${data.metrics.roas7d.toFixed(1)}x`
  );
  const cardWinrate = createKpiCard(
    "Testing Winrate",
    data.testing.winrateLabel
  );

  summaryRow.appendChild(cardSpend7);
  summaryRow.appendChild(cardRevenue7);
  summaryRow.appendChild(cardRoas7);
  summaryRow.appendChild(cardWinrate);

  container.appendChild(summaryRow);

  // Grid: links Performance, rechts Testing / Sensei
  const mainGrid = document.createElement("div");
  mainGrid.style.display = "grid";
  mainGrid.style.gridTemplateColumns = "minmax(0, 2.1fr) minmax(0, 1.4fr)";
  mainGrid.style.gap = "16px";
  mainGrid.style.marginTop = "16px";

  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");

  // Top-Kampagnen
  const topCampCard = document.createElement("div");
  topCampCard.className = "sensei-card";
  const topCampTitle = document.createElement("h3");
  topCampTitle.textContent = "Top Kampagnen (letzte 30 Tage)";
  topCampCard.appendChild(topCampTitle);

  const campTableWrapper = document.createElement("div");
  campTableWrapper.className = "campaign-table";
  const campTable = document.createElement("table");
  const campThead = document.createElement("thead");
  const campHeadRow = document.createElement("tr");
  ["Kampagne", "Spend", "ROAS", "Rolle"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    campHeadRow.appendChild(th);
  });
  campThead.appendChild(campHeadRow);
  campTable.appendChild(campThead);

  const campTbody = document.createElement("tbody");
  data.topCampaigns.forEach((c) => {
    const tr = document.createElement("tr");
    const tdName = document.createElement("td");
    tdName.textContent = c.name;
    const tdSpend = document.createElement("td");
    tdSpend.textContent = formatCurrency(c.spend);
    const tdRoas = document.createElement("td");
    tdRoas.textContent = `${c.roas.toFixed(1)}x`;
    const tdRole = document.createElement("td");
    tdRole.textContent = c.role;
    tr.appendChild(tdName);
    tr.appendChild(tdSpend);
    tr.appendChild(tdRoas);
    tr.appendChild(tdRole);
    campTbody.appendChild(tr);
  });
  campTable.appendChild(campTbody);
  campTableWrapper.appendChild(campTable);
  topCampCard.appendChild(campTableWrapper);
  leftCol.appendChild(topCampCard);

  // Top-Creatives
  const topCreativesCard = document.createElement("div");
  topCreativesCard.className = "sensei-card";
  const topCreativesTitle = document.createElement("h3");
  topCreativesTitle.textContent = "Top Creatives";
  topCreativesCard.appendChild(topCreativesTitle);

  const ulCreatives = document.createElement("ul");
  ulCreatives.style.margin = "6px 0 0";
  ulCreatives.style.paddingLeft = "18px";
  ulCreatives.style.fontSize = "0.9rem";

  data.topCreatives.forEach((c) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.innerHTML = `<strong>${c.name}</strong> • ROAS ${c.roas.toFixed(
      1
    )}x • Spend ${formatCurrency(c.spend)}<br/><span style="font-size:0.8rem;color:var(--color-text-soft);">${c.comment}</span>`;
    ulCreatives.appendChild(li);
  });

  topCreativesCard.appendChild(ulCreatives);
  leftCol.appendChild(topCreativesCard);

  // Right: Testing Summary
  const testingCard = document.createElement("div");
  testingCard.className = "sensei-card";
  const testingTitle = document.createElement("h3");
  testingTitle.textContent = "Testing Summary";
  testingCard.appendChild(testingTitle);

  const testingBody = document.createElement("p");
  testingBody.style.fontSize = "0.9rem";
  testingBody.style.marginTop = "6px";
  testingBody.innerHTML = `
    Tests insgesamt: <strong>${data.testing.total}</strong><br/>
    Laufende Tests: <strong>${data.testing.running}</strong><br/>
    Abgeschlossene Tests: <strong>${data.testing.completed}</strong><br/>
    Winrate: <strong>${data.testing.winrateLabel}</strong>
  `;
  testingCard.appendChild(testingBody);

  const testingList = document.createElement("ul");
  testingList.style.margin = "6px 0 0";
  testingList.style.paddingLeft = "18px";
  testingList.style.fontSize = "0.9rem";

  data.testing.highlights.forEach((h) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = h;
    testingList.appendChild(li);
  });

  testingCard.appendChild(testingList);
  rightCol.appendChild(testingCard);

  // Sensei Weekly Insights
  const senseiCard = document.createElement("div");
  senseiCard.className = "sensei-card";
  const senseiTitle = document.createElement("h3");
  senseiTitle.textContent = "Sensei Weekly Insights";
  senseiCard.appendChild(senseiTitle);

  const senseiList = document.createElement("ul");
  senseiList.style.margin = "6px 0 0";
  senseiList.style.paddingLeft = "18px";
  senseiList.style.fontSize = "0.9rem";

  data.weeklyInsights.forEach((i) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = i;
    senseiList.appendChild(li);
  });

  senseiCard.appendChild(senseiList);
  rightCol.appendChild(senseiCard);

  mainGrid.appendChild(leftCol);
  mainGrid.appendChild(rightCol);

  container.appendChild(mainGrid);
}

function renderExecutiveSummary(container, brand, data) {
  const card = document.createElement("div");
  card.className = "sensei-card";

  const title = document.createElement("h3");
  title.textContent = "Executive Summary";
  card.appendChild(title);

  const pIntro = document.createElement("p");
  pIntro.style.fontSize = "0.9rem";
  pIntro.style.marginTop = "6px";
  pIntro.textContent = `Kurzfassung der Performance für ${brand.name} – ideal für Management-Reports und wöchentliche Check-ins.`;
  card.appendChild(pIntro);

  const sections = document.createElement("div");
  sections.style.display = "grid";
  sections.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr)";
  sections.style.gap = "16px";
  sections.style.marginTop = "12px";

  // KPIs
  const kpiBox = document.createElement("div");
  const kpiTitle = document.createElement("strong");
  kpiTitle.textContent = "1. Kern-KPIs (letzte 30 Tage)";
  const kpiBody = document.createElement("p");
  kpiBody.style.fontSize = "0.9rem";
  kpiBody.style.marginTop = "4px";
  kpiBody.innerHTML = `
    Ad Spend: <strong>${formatCurrency(
      data.metrics.spend30d
    )}</strong><br/>
    Revenue: <strong>${formatCurrency(
      data.metrics.revenue30d
    )}</strong><br/>
    ROAS: <strong>${data.metrics.roas30d.toFixed(1)}x</strong><br/>
    CPM: <strong>${formatCurrency(data.metrics.cpm)}</strong><br/>
    CTR: <strong>${data.metrics.ctr.toFixed(2)} %</strong>
  `;
  kpiBox.appendChild(kpiTitle);
  kpiBox.appendChild(kpiBody);

  // Campaigns
  const campBox = document.createElement("div");
  const campTitle = document.createElement("strong");
  campTitle.textContent = "2. Stärkste Kampagnen";
  const campBody = document.createElement("ul");
  campBody.style.marginTop = "4px";
  campBody.style.paddingLeft = "18px";
  campBody.style.fontSize = "0.9rem";

  data.topCampaigns.slice(0, 3).forEach((c) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.name}</strong> – ROAS ${c.roas.toFixed(
      1
    )}x, Spend ${formatCurrency(c.spend)} (${c.role})`;
    campBody.appendChild(li);
  });

  campBox.appendChild(campTitle);
  campBox.appendChild(campBody);

  sections.appendChild(kpiBox);
  sections.appendChild(campBox);

  // Creatives / Risks / Actions
  const bottomSections = document.createElement("div");
  bottomSections.style.display = "grid";
  bottomSections.style.gridTemplateColumns = "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)";
  bottomSections.style.gap = "16px";
  bottomSections.style.marginTop = "16px";

  // Creatives
  const crBox = document.createElement("div");
  const crTitle = document.createElement("strong");
  crTitle.textContent = "3. Creative Highlights";
  const crBody = document.createElement("ul");
  crBody.style.marginTop = "4px";
  crBody.style.paddingLeft = "18px";
  crBody.style.fontSize = "0.9rem";

  data.topCreatives.slice(0, 3).forEach((c) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${c.name}</strong> – ROAS ${c.roas.toFixed(
      1
    )}x, Spend ${formatCurrency(c.spend)}`;
    crBody.appendChild(li);
  });

  crBox.appendChild(crTitle);
  crBox.appendChild(crBody);

  // Risks
  const riskBox = document.createElement("div");
  const riskTitle = document.createElement("strong");
  riskTitle.textContent = "4. Risiken & Alerts";
  const riskBody = document.createElement("ul");
  riskBody.style.marginTop = "4px";
  riskBody.style.paddingLeft = "18px";
  riskBody.style.fontSize = "0.9rem";

  data.risks.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = r;
    riskBody.appendChild(li);
  });

  riskBox.appendChild(riskTitle);
  riskBox.appendChild(riskBody);

  // Actions
  const actBox = document.createElement("div");
  const actTitle = document.createElement("strong");
  actTitle.textContent = "5. Nächste Schritte (Top 3)";
  const actBody = document.createElement("ol");
  actBody.style.marginTop = "4px";
  actBody.style.paddingLeft = "18px";
  actBody.style.fontSize = "0.9rem";

  data.nextActions.slice(0, 3).forEach((a) => {
    const li = document.createElement("li");
    li.textContent = a;
    actBody.appendChild(li);
  });

  actBox.appendChild(actTitle);
  actBox.appendChild(actBody);

  bottomSections.appendChild(crBox);
  bottomSections.appendChild(riskBox);
  bottomSections.appendChild(actBox);

  card.appendChild(sections);
  card.appendChild(bottomSections);

  container.appendChild(card);
}

function renderDeepAnalytics(container, brand, data) {
  const grid = document.createElement("div");
  grid.style.display = "grid";
  grid.style.gridTemplateColumns = "minmax(0, 2fr) minmax(0, 1.4fr)";
  grid.style.gap = "16px";

  const left = document.createElement("div");
  const right = document.createElement("div");

  // Zeitreihen / ASCII Charts (7d vs 30d Vergleich)
  const trendCard = document.createElement("div");
  trendCard.className = "sensei-card";
  const trendTitle = document.createElement("h3");
  trendTitle.textContent = "KPI-Trends (simuliert)";
  trendCard.appendChild(trendTitle);

  const trendBody = document.createElement("pre");
  trendBody.style.fontSize = "0.8rem";
  trendBody.style.marginTop = "8px";
  trendBody.textContent = buildAsciiTrendBlock(data);
  trendCard.appendChild(trendBody);

  left.appendChild(trendCard);

  // Hook / Creative Struktur – Kurzfassung
  const breakdownCard = document.createElement("div");
  breakdownCard.className = "sensei-card";
  const breakdownTitle = document.createElement("h3");
  breakdownTitle.textContent = "Performance Breakdown";
  breakdownCard.appendChild(breakdownTitle);

  const breakdownList = document.createElement("ul");
  breakdownList.style.marginTop = "6px";
  breakdownList.style.paddingLeft = "18px";
  breakdownList.style.fontSize = "0.9rem";

  data.analyticsHighlights.forEach((h) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = h;
    breakdownList.appendChild(li);
  });

  breakdownCard.appendChild(breakdownList);
  left.appendChild(breakdownCard);

  // Rechts: Hook & Testing Fokus
  const hookCard = document.createElement("div");
  hookCard.className = "sensei-card";
  const hookTitle = document.createElement("h3");
  hookTitle.textContent = "Hooks & Creative Patterns";
  hookCard.appendChild(hookTitle);

  const hookList = document.createElement("ul");
  hookList.style.marginTop = "6px";
  hookList.style.paddingLeft = "18px";
  hookList.style.fontSize = "0.9rem";

  data.hookPatterns.forEach((h) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = h;
    hookList.appendChild(li);
  });

  hookCard.appendChild(hookList);

  const testCard = document.createElement("div");
  testCard.className = "sensei-card";
  const testTitle = document.createElement("h3");
  testTitle.textContent = "Testing & Experimentation";
  testCard.appendChild(testTitle);

  const testBody = document.createElement("p");
  testBody.style.fontSize = "0.9rem";
  testBody.style.marginTop = "6px";
  testBody.textContent = data.testing.deeperSummary;
  testCard.appendChild(testBody);

  right.appendChild(hookCard);
  right.appendChild(testCard);

  grid.appendChild(left);
  grid.appendChild(right);
  container.appendChild(grid);
}

// ===========================================================================
// REPORT-DATEN (Demo)
// ===========================================================================

function getReportDataForBrand(brandId) {
  // Default Metrics
  const baseMetrics = getBaseMetricsForBrand(brandId);

  // Brand-spezifische Inhalte
  switch (brandId) {
    case "acme_fashion":
      return {
        metrics: baseMetrics,
        topCampaigns: [
          {
            name: "UGC Scale – Evergreen",
            spend: 18240,
            roas: 5.0,
            role: "Haupt-Scale",
          },
          {
            name: "Hook Battle Q4 – UGC Testing",
            spend: 7420,
            roas: 3.5,
            role: "Creative Testing",
          },
          {
            name: "Brand Awareness – Static Lookbook",
            spend: 6210,
            roas: 3.2,
            role: "Brand / Support",
          },
        ],
        topCreatives: [
          {
            name: 'UGC – "Outfit in 10 Sekunden"',
            spend: 12890,
            roas: 6.2,
            comment:
              "Klarer Evergreen-Winner mit hoher CTR und starkem ROAS über alle Zielgruppen.",
          },
          {
            name: "Static – Herbst Lookbook",
            spend: 6210,
            roas: 4.1,
            comment:
              "Solider Evergreen für Feed – besonders stark im Warm-Traffic.",
          },
          {
            name: "UGC – „Outfit Fail Fix“",
            spend: 3120,
            roas: 3.2,
            comment:
              "Story-Hook überzeugt, aber Intro könnte tighter sein – guter Kandidat für weitere Varianten.",
          },
        ],
        risks: [
          "Leichte ROAS-Abnahme in den letzten 7 Tagen – mögliche Frühzeichen von Creative Fatigue.",
          "Ältere Static-Creatives mit deutlich schwächerer Performance laufen noch mit Budget.",
        ],
        nextActions: [
          "Budget auf die besten UGC-Ads um 20–25 % erhöhen, solange ROAS > 4.5x bleibt.",
          "Schwache Hook-Varianten (< 2.0x ROAS) konsequent pausieren und durch neue Hooks ersetzen.",
          "Story-Formate aus dem Fast-Try-On-Winner ableiten, um zusätzliche Touchpoints zu generieren.",
        ],
        weeklyInsights: [
          "UGC-Winner „Outfit in 10 Sekunden“ bleibt klarer Top-Performer – Frequenz im Blick behalten.",
          "Hook-Tests zeigen: „Error/Fail“-Hooks ziehen deutlich höhere CTR als generische Outfit-Hooks.",
          "Brand-Kampagne liefert soliden Nebeneffekt, sollte aber nicht den Hauptteil des Budgets binden.",
        ],
        testing: {
          total: 3,
          running: 1,
          completed: 2,
          winrateLabel: "67 %",
          highlights: [
            "Hook-Test hat einen klaren Winner identifiziert (+35 % CTR).",
            "Creative-Test UGC vs Static bestätigt UGC als Scale-Creative.",
          ],
          deeperSummary:
            "ACME testet aktiv Hooks, Placements und Creatives. Die meisten Learnings bestätigen die Stärke von schnellen UGC-Hooks. Wichtig ist, die Learnings schnell in Scale-Kampagnen zu überführen.",
        },
        analyticsHighlights: [
          "ROAS über 30 Tage liegt klar über dem Benchmark im Fashion-Segment.",
          "Spend ist auf wenige, starke Evergreen-Kampagnen konzentriert – gutes Setup für sauberes Scaling.",
          "Testing-Kampagnen liefern ausreichend Budget, um statistisch sinnvolle Aussagen zu treffen.",
        ],
        hookPatterns: [
          "Hooks mit direkter Problemansprache („Du machst diesen Fehler…“) performen am stärksten.",
          "Lookbook-Hooks eignen sich eher für Warm-Traffic und Branding.",
          "Humorvolle, zu lange Intros performen schwächer als direkte Hooks mit Outfit-Versprechen.",
        ],
      };

    case "techgadgets_pro":
      return {
        metrics: baseMetrics,
        topCampaigns: [
          {
            name: "Launch Funnel EU – Conversion",
            spend: 15340,
            roas: 3.2,
            role: "Haupt-Funnel",
          },
          {
            name: "Retargeting Core – Demo & Unboxing",
            spend: 9480,
            roas: 4.4,
            role: "Retargeting",
          },
        ],
        topCreatives: [
          {
            name: "Product Demo – 30 Sek. Deep Dive",
            spend: 9420,
            roas: 4.3,
            comment:
              "Sehr stark im kalten Traffic – klarer Value Proposition und strukturierte Demo.",
          },
          {
            name: "Unboxing – Creator Review",
            spend: 5310,
            roas: 3.1,
            comment:
              "Gut im Warm-Traffic, aber im Prospecting etwas schwächer – Fokus auf Benefits erhöhen.",
          },
        ],
        risks: [
          "CPM im Prospecting leicht erhöht – mögliche Sättigung oder zu enge Zielgruppen.",
          "Retargeting ist stark, aber die Audience-Größe begrenzt, wenn Prospecting nicht skaliert.",
        ],
        nextActions: [
          "Retargeting-Budget moderat erhöhen, solange ROAS > 4.0x bleibt.",
          "Prospecting-Struktur verschlanken und Broad-Tests integrieren.",
          "Bundles und Up-Sells im Retargeting stärker ausspielen, um den AOV zu erhöhen.",
        ],
        weeklyInsights: [
          "Retargeting-Kampagne bringt den Großteil des Profits – Funnel oben muss nachziehen.",
          "Product-Demo-Creatives sind klar die besten Entry-Ad-Formate.",
          "Unboxing-Videos eignen sich hervorragend für Social Proof im Mittelfunnel.",
        ],
        testing: {
          total: 2,
          running: 1,
          completed: 1,
          winrateLabel: "50 %",
          highlights: [
            "Demo vs Unboxing Test bestätigt Demo als klar besseren Prospecting-Creative.",
            "Offer Test zeigt, dass Bundles den AOV erhöhen, ohne ROAS zu verschlechtern.",
          ],
          deeperSummary:
            "Testing-Fokus liegt auf Creatives und Offer-Struktur. Nächster Schritt: systematisches Audience-Testing, um CPMs zu optimieren.",
        },
        analyticsHighlights: [
          "ROAS ist stabil, aber CPM leicht ansteigend – Marktumfeld wird kompetitiver.",
          "Retargeting-ROAS liegt deutlich über Prospecting-ROAS – typischer Tech-Funnel.",
        ],
        hookPatterns: [
          "Problem → Lösung Hooks funktionieren am besten im kalten Traffic.",
          "Unboxing-Hooks sind stark im Warm-Traffic, wenn Trust bereits vorhanden ist.",
        ],
      };

    case "beautylux_cosmetics":
      return {
        metrics: baseMetrics,
        topCampaigns: [
          {
            name: "Creator Evergreen – Skin Transformation",
            spend: 21480,
            roas: 7.1,
            role: "Core Scale",
          },
          {
            name: "Brand Awareness – Ingredient Education",
            spend: 6840,
            roas: 3.3,
            role: "Education / Brand",
          },
        ],
        topCreatives: [
          {
            name: "Before/After – Skin Routine",
            spend: 15870,
            roas: 7.1,
            comment:
              "Extrem starke Before/After Visuals mit klarer Routine-Erklärung.",
          },
          {
            name: "Static – Ingredient Callout",
            spend: 7640,
            roas: 5.2,
            comment:
              "Ideal für Warm-Traffic und Retargeting, wenn Vertrauen bereits vorhanden ist.",
          },
        ],
        risks: [
          "Einige ältere Ingredient-Creatives zeigen sinkende Performance.",
          "Starke Abhängigkeit von wenigen Top-Creators – Diversifizierung sinnvoll.",
        ],
        nextActions: [
          "Weitere Transformation-Stories für unterschiedliche Skin-Concerns testen.",
          "Vertical-Formate weiter priorisieren, da sie klar besser performen.",
          "Expert-Perspektive (Dermatology) gezielt im Retargeting nutzen.",
        ],
        weeklyInsights: [
          "Transformation-Hooks treiben den Großteil des Umsatzes.",
          "Bildung/Ingredient-Content wirkt stark auf Trust, vor allem im Mittelfunnel.",
        ],
        testing: {
          total: 1,
          running: 1,
          completed: 0,
          winrateLabel: "–",
          highlights: [
            "Format-Test (1:1 vs 9:16) läuft – Vertical liegt klar vorne.",
          ],
          deeperSummary:
            "Testing-Fokus liegt aktuell auf Formaten. In der nächsten Phase sollten zusätzlich Hook- und Offer-Tests ergänzt werden.",
        },
        analyticsHighlights: [
          "BeautyLux liegt in ROAS deutlich über vielen D2C-Beauty-Benchmarks.",
          "Spend-Kurve zeigt konstantes Wachstum bei stabiler Profitabilität.",
        ],
        hookPatterns: [
          "Before/After Transformation-Hooks sind mit Abstand die stärksten.",
          "Ingredient Education eignet sich vor allem als Verstärker im Retargeting.",
        ],
      };

    case "fitlife_supplements":
      return {
        metrics: baseMetrics,
        topCampaigns: [
          {
            name: "Scale Stack Q4 – Performance",
            spend: 12810,
            roas: 4.1,
            role: "Scale",
          },
        ],
        topCreatives: [
          {
            name: "UGC – 30 Tage Progress Story",
            spend: 9740,
            roas: 4.9,
            comment:
              "Emotionale Progress-Stories funktionieren hervorragend als Entry-Creatives.",
          },
          {
            name: "Coach POV – Gym Routine",
            spend: 4130,
            roas: 3.5,
            comment:
              "Gut im Mittelfunnel, könnte im Hook noch klarer werden.",
          },
        ],
        risks: [
          "ROAS ist solide, aber noch nicht maximal – Tests haben Potenzial nach oben.",
        ],
        nextActions: [
          "Mehr Progress-Stories mit unterschiedlichen Personas testen.",
          "Coach-Content stärker mit konkreten Ergebnissen verknüpfen.",
        ],
        weeklyInsights: [
          "Progress-basierte Storytelling-Creatives schlagen klassische Produktshots deutlich.",
        ],
        testing: {
          total: 1,
          running: 0,
          completed: 1,
          winrateLabel: "100 %",
          highlights: [
            "Progress vs Coach Test hat Progress-Story klar als Winner identifiziert.",
          ],
          deeperSummary:
            "FitLife testet vor allem Creative-Konzepte. Als nächstes sollte auch Offer-/Bundle-Struktur getestet werden.",
        },
        analyticsHighlights: [
          "ROAS bewegt sich im grünen Bereich, aber CPM ist etwas höher als im Beauty-Segment.",
        ],
        hookPatterns: [
          "Journey-Hooks (30 Tage, Transformation) funktionieren deutlich besser als generische Motivations-Hooks.",
        ],
      };

    case "homezen_living":
      return {
        metrics: baseMetrics,
        topCampaigns: [
          {
            name: "Creative Testing – Cozy Home",
            spend: 6840,
            roas: 2.5,
            role: "Testing",
          },
        ],
        topCreatives: [
          {
            name: "Before/After – Wohnzimmer Makeover",
            spend: 6820,
            roas: 4.0,
            comment:
              "Sehr starker Visual-Hook – Produkte könnten noch klarer hervorgehoben werden.",
          },
          {
            name: "Static – Moodboard Cozy Home",
            spend: 2940,
            roas: 2.6,
            comment:
              "Gut für Inspiration, aber schwächer in direkter Performance.",
          },
        ],
        risks: [
          "Gesamt-ROAS noch unter Wunsch-Ziel.",
          "Testing-Kampagne hat noch keinen eindeutigen Winner hervorgebracht.",
        ],
        nextActions: [
          "Weitere Makeover-Videos für andere Räume testen.",
          "Produktfokus innerhalb der Videos erhöhen.",
        ],
        weeklyInsights: [
          "Makeover-Ads sind die bisher stärksten Kreative.",
          "Moodboard-Ads eher als Brand Layer betrachten, nicht als Performance-Treiber.",
        ],
        testing: {
          total: 1,
          running: 1,
          completed: 0,
          winrateLabel: "–",
          highlights: [
            "Makeover vs Moodboard Test zeigt klaren Trend zugunsten Makeover.",
          ],
          deeperSummary:
            "HomeZen befindet sich noch in der Findungsphase, was Creative-Positionierung angeht. Es ist sinnvoll, Tests aggressiv voranzutreiben.",
        },
        analyticsHighlights: [
          "Spend ist moderat mit Fokus auf Testing-Kampagne.",
          "Potential nach oben, sobald klare Winner identifiziert sind.",
        ],
        hookPatterns: [
          "Room-Transformation-Hooks schlagen reine Mood-Bilder.",
        ],
      };

    default:
      return {
        metrics: baseMetrics,
        topCampaigns: [],
        topCreatives: [],
        risks: [],
        nextActions: [],
        weeklyInsights: [],
        testing: {
          total: 0,
          running: 0,
          completed: 0,
          winrateLabel: "–",
          highlights: [],
          deeperSummary:
            "Noch keine Tests erfasst. Nutze den Testing Log, um strukturierte Experimente zu planen.",
        },
        analyticsHighlights: [],
        hookPatterns: [],
      };
  }
}

function getBaseMetricsForBrand(brandId) {
  // Default generisch
  let spend30d = 30000;
  let roas30d = 3.5;

  switch (brandId) {
    case "acme_fashion":
      spend30d = 47892;
      roas30d = 4.8;
      break;
    case "techgadgets_pro":
      spend30d = 28310;
      roas30d = 3.2;
      break;
    case "beautylux_cosmetics":
      spend30d = 58442;
      roas30d = 5.9;
      break;
    case "fitlife_supplements":
      spend30d = 32101;
      roas30d = 4.1;
      break;
    case "homezen_living":
      spend30d = 19883;
      roas30d = 3.6;
      break;
    default:
      break;
  }

  const revenue30d = spend30d * roas30d;
  const spend7d = spend30d * 0.28;
  const revenue7d = spend7d * (roas30d * 0.95);
  const roas7d = revenue7d / spend7d || roas30d;
  const cpm = 9.5;
  const ctr = 2.4;

  return {
    spend30d,
    revenue30d,
    roas30d,
    spend7d,
    revenue7d,
    roas7d,
    cpm,
    ctr,
  };
}

// ===========================================================================
// HILFSFUNKTIONEN – UI & EXPORT
// ===========================================================================

function createKpiCard(label, value) {
  const card = document.createElement("div");
  card.className = "kpi-card";
  const l = document.createElement("strong");
  l.textContent = label;
  const v = document.createElement("div");
  v.textContent = value;
  card.appendChild(l);
  card.appendChild(v);
  return card;
}

function formatCurrency(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getTabLabel(key) {
  switch (key) {
    case "weekly":
      return "Weekly Report";
    case "executive":
      return "Executive Summary";
    case "analytics":
      return "Deep Analytics";
    default:
      return key;
  }
}

function buildAsciiTrendBlock(data) {
  const { spend7d, spend30d, roas7d, roas30d, ctr, cpm } = data.metrics;

  function bar(valueNormalised) {
    const len = Math.round(valueNormalised * 20);
    return "▇".repeat(len || 1);
  }

  const spendRatio = Math.min(1, spend7d / (spend30d / 2 || 1));
  const roasRatio = Math.min(1, roas7d / (roas30d || 1));
  const ctrRatio = Math.min(1, ctr / 4);
  const cpmRatio = Math.min(1, 10 / (cpm || 1));

  return [
    "SPEND (7d vs 30d Schnitt)",
    `7d : ${bar(spendRatio)}  (${formatCurrency(spend7d)})`,
    `30d: ${bar(0.8)}  (${formatCurrency(spend30d)})`,
    "",
    "ROAS (7d vs 30d)",
    `7d : ${bar(roasRatio)}  (${roas7d.toFixed(1)}x)`,
    `30d: ${bar(0.8)}  (${roas30d.toFixed(1)}x)`,
    "",
    "CTR & CPM Indikatoren",
    `CTR : ${bar(ctrRatio)}  (${ctr.toFixed(2)} %)`,
    `CPM : ${bar(cpmRatio)}  (${formatCurrency(cpm)})`,
  ].join("\n");
}

function exportReportCsv(tabKey, brand, data) {
  const rows = [];
  const brandName = brand && brand.name ? brand.name : "Brand";

  rows.push([`Report Type`, getTabLabel(tabKey)]);
  rows.push(["Brand", brandName]);
  rows.push([]);

  // Gemeinsame Basis-Metriken
  rows.push(["Metrik", "Wert"]);
  rows.push(["Ad Spend 30 Tage", formatCurrency(data.metrics.spend30d)]);
  rows.push(["Revenue 30 Tage", formatCurrency(data.metrics.revenue30d)]);
  rows.push(["ROAS 30 Tage", `${data.metrics.roas30d.toFixed(1)}x`]);
  rows.push(["Spend 7 Tage", formatCurrency(data.metrics.spend7d)]);
  rows.push([
    "ROAS 7 Tage",
    `${(data.metrics.roas7d || data.metrics.roas30d).toFixed(1)}x`,
  ]);
  rows.push(["CPM", formatCurrency(data.metrics.cpm)]);
  rows.push(["CTR", `${data.metrics.ctr.toFixed(2)} %`]);
  rows.push([]);

  if (tabKey === "weekly" || tabKey === "executive" || tabKey === "analytics") {
    rows.push(["Top Kampagnen"]);
    rows.push(["Name", "Spend", "ROAS", "Rolle"]);
    (data.topCampaigns || []).forEach((c) => {
      rows.push([
        c.name,
        formatCurrency(c.spend),
        `${c.roas.toFixed(1)}x`,
        c.role || "",
      ]);
    });
    rows.push([]);
  }

  if (tabKey === "weekly" || tabKey === "executive") {
    rows.push(["Top Creatives"]);
    rows.push(["Name", "Spend", "ROAS"]);
    (data.topCreatives || []).forEach((c) => {
      rows.push([
        c.name,
        formatCurrency(c.spend),
        `${c.roas.toFixed(1)}x`,
      ]);
    });
    rows.push([]);
  }

  if (tabKey === "weekly" || tabKey === "analytics") {
    rows.push(["Testing Overview"]);
    rows.push(["Tests gesamt", data.testing.total]);
    rows.push(["Laufende Tests", data.testing.running]);
    rows.push(["Abgeschlossene Tests", data.testing.completed]);
    rows.push(["Winrate", data.testing.winrateLabel]);
    rows.push([]);
  }

  if (tabKey === "executive" || tabKey === "analytics") {
    rows.push(["Risiken & Nächste Schritte"]);
    rows.push(["Risiken"]);
    (data.risks || []).forEach((r) => rows.push([r]));
    rows.push([]);
    rows.push(["Nächste Schritte"]);
    (data.nextActions || []).forEach((a) => rows.push([a]));
    rows.push([]);
  }

  const csv = rows
    .map((r) =>
      r
        .map((field) => {
          const f = String(field || "");
          if (f.includes(";") || f.includes('"') || f.includes("\n")) {
            return `"${f.replace(/"/g, '""')}"`;
          }
          return f;
        })
        .join(";")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeBrand = brandName.replace(/\s+/g, "_");
  link.href = url;
  link.download = `signalone-report-${tabKey}-${safeBrand}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function generatePlainTextReport(tabKey, brand, data) {
  const lines = [];
  const header = `${getTabLabel(tabKey)} – ${brand.name}`;

  lines.push(header);
  lines.push("=".repeat(header.length));
  lines.push("");

  lines.push("Kern-KPIs (letzte 30 Tage):");
  lines.push(
    `• Ad Spend: ${formatCurrency(data.metrics.spend30d)}, Revenue: ${formatCurrency(
      data.metrics.revenue30d
    )}, ROAS: ${data.metrics.roas30d.toFixed(1)}x`
  );
  lines.push(
    `• CPM: ${formatCurrency(data.metrics.cpm)}, CTR: ${data.metrics.ctr.toFixed(
      2
    )} %`
  );
  lines.push("");

  if (tabKey === "weekly" || tabKey === "executive") {
    lines.push("Top Kampagnen:");
    (data.topCampaigns || []).forEach((c) => {
      lines.push(
        `• ${c.name} – ROAS ${c.roas.toFixed(
          1
        )}x, Spend ${formatCurrency(c.spend)} (${c.role})`
      );
    });
    lines.push("");
    lines.push("Top Creatives:");
    (data.topCreatives || []).forEach((c) => {
      lines.push(
        `• ${c.name} – ROAS ${c.roas.toFixed(
          1
        )}x, Spend ${formatCurrency(c.spend)}`
      );
    });
    lines.push("");
  }

  if (tabKey === "weekly") {
    lines.push("Testing Summary:");
    lines.push(
      `• Tests gesamt: ${data.testing.total}, laufende: ${data.testing.running}, abgeschlossene: ${data.testing.completed}, Winrate: ${data.testing.winrateLabel}`
    );
    lines.push("");
    lines.push("Sensei Weekly Insights:");
    (data.weeklyInsights || []).forEach((i) => {
      lines.push(`• ${i}`);
    });
  }

  if (tabKey === "executive") {
    lines.push("Risiken & Alerts:");
    (data.risks || []).forEach((r) => {
      lines.push(`• ${r}`);
    });
    lines.push("");
    lines.push("Nächste Schritte (Top 3):");
    (data.nextActions || []).forEach((a) => {
      lines.push(`• ${a}`);
    });
  }

  if (tabKey === "analytics") {
    lines.push("Analytics Highlights:");
    (data.analyticsHighlights || []).forEach((h) => {
      lines.push(`• ${h}`);
    });
    lines.push("");
    lines.push("Hook & Creative Patterns:");
    (data.hookPatterns || []).forEach((h) => {
      lines.push(`• ${h}`);
    });
    lines.push("");
    lines.push("Testing & Experimentation:");
    lines.push(`• ${data.testing.deeperSummary}`);
  }

  return lines.join("\n");
}
