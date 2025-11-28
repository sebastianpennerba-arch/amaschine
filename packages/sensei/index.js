// packages/sensei/index.js
// Sensei – AI Performance Coach Dashboard
// Nutzt Brand-Kontext (AppState.selectedBrandId) & Demo-/Live-Mode (env.useDemoMode)

export function render(rootEl, AppState, env = {}) {
  if (!rootEl) return;

  const useDemo =
    typeof env.useDemoMode === "boolean" ? env.useDemoMode : true;
  const timeframe = env.timeframe || "30d"; // "7d" | "30d" | "90d"

  const demo = window.SignalOneDemo && window.SignalOneDemo.DemoData;
  const brands = demo && demo.brands ? demo.brands : [];

  let brandId = AppState.selectedBrandId;
  if (!brandId && brands.length) {
    brandId = brands[0].id;
  }
  const brand =
    brands.find((b) => b.id === brandId) || (brands.length ? brands[0] : null);

  rootEl.innerHTML = "";

  // Live-Guard
  if (!useDemo && !AppState.metaConnected) {
    const msg = document.createElement("p");
    msg.textContent =
      "Live-Modus aktiv. Sensei wird echte Performance-Insights generieren, sobald die Meta-Anbindung fertig ist. Aktuell kannst du den Demo-Modus nutzen.";
    rootEl.appendChild(msg);
    return;
  }

  const senseiData = getSenseiDataForBrand(brand ? brand.id : null, timeframe);

  // ---------------------------------------------------------------------------
  // HEADER (Hero)
  // ---------------------------------------------------------------------------

  const header = document.createElement("div");
  header.className = "dashboard-hero";

  const statusChip = document.createElement("div");
  statusChip.className = "dashboard-hero-status";
  statusChip.textContent = brand
    ? `${brand.name} • Sensei AI aktiv`
    : "Kein Werbekonto ausgewählt";

  const title = document.createElement("h2");
  title.className = "dashboard-hero-title";
  title.textContent = "Sensei – AI Performance Coach";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    subtitle.textContent = useDemo
      ? "Sensei analysiert deinen Demo-Account so, wie später deine echten Meta-Daten: Kampagnen, Creatives, Hooks und Skalierung."
      : "Sensei ist im Live-Modus bereit. Sobald Meta angebunden ist, erhältst du hier tägliche AI-Insights auf Basis realer Daten.";
  } else {
    subtitle.textContent =
      "Wähle oben ein Werbekonto, damit Sensei die passenden Insights generieren kann.";
  }

  header.appendChild(statusChip);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Timeframe Filter
  const filters = document.createElement("div");
  filters.className = "creative-filters";

  const timeframeSelect = document.createElement("select");
  [
    { value: "7d", label: "Zeitraum: Letzte 7 Tage" },
    { value: "30d", label: "Letzte 30 Tage" },
    { value: "90d", label: "Letzte 90 Tage" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    timeframeSelect.appendChild(o);
  });
  timeframeSelect.value = timeframe;

  const info = document.createElement("span");
  info.style.fontSize = "0.85rem";
  info.style.color = "var(--color-text-muted)";
  info.textContent =
    "Sensei simuliert hier bereits die Logik, wie sie später mit Live-Daten funktioniert.";

  filters.appendChild(timeframeSelect);
  filters.appendChild(info);

  // Summary Text
  const summary = document.createElement("p");
  summary.style.margin = "0 0 12px";
  summary.style.fontSize = "0.85rem";
  summary.style.color = "var(--color-text-muted)";
  if (brand) {
    summary.textContent = `Zeitraum: ${formatTimeframe(timeframe)} • Brand: ${
      brand.name
    } • Fokus: ${senseiData.focus}`;
  } else {
    summary.textContent = "Kein Brand ausgewählt.";
  }

  rootEl.appendChild(header);
  rootEl.appendChild(filters);
  rootEl.appendChild(summary);

  // ---------------------------------------------------------------------------
  // MAIN GRID (Premium AI Dashboard Layout)
  // Links: Top Actions + Scaling
  // Rechts: Critical Alerts + Fatigue
  // ---------------------------------------------------------------------------

  const mainGrid = document.createElement("div");
  mainGrid.style.display = "grid";
  mainGrid.style.gridTemplateColumns = "minmax(0, 2.1fr) minmax(0, 1.4fr)";
  mainGrid.style.gap = "16px";
  mainGrid.style.marginBottom = "24px";

  const leftCol = document.createElement("div");
  const rightCol = document.createElement("div");

  // ----- Card: Today's Top Actions -----------------------------------------

  const actionsCard = document.createElement("div");
  actionsCard.className = "sensei-card";
  const actionsTitle = document.createElement("h3");
  actionsTitle.textContent = "Today's Top Recommendations";
  actionsCard.appendChild(actionsTitle);

  const actionsList = document.createElement("ol");
  actionsList.style.margin = "6px 0 0";
  actionsList.style.paddingLeft = "18px";
  actionsList.style.fontSize = "0.9rem";

  senseiData.topActions.forEach((a) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    const strong = document.createElement("strong");
    strong.textContent = a.title + ": ";
    const span = document.createElement("span");
    span.textContent = a.text;
    li.appendChild(strong);
    li.appendChild(span);
    actionsList.appendChild(li);
  });

  actionsCard.appendChild(actionsList);
  leftCol.appendChild(actionsCard);

  // ----- Card: Scaling Opportunities ---------------------------------------

  const scaleCard = document.createElement("div");
  scaleCard.className = "sensei-card";
  const scaleTitle = document.createElement("h3");
  scaleTitle.textContent = "Scaling Opportunities";
  scaleCard.appendChild(scaleTitle);

  const scaleList = document.createElement("ul");
  scaleList.style.margin = "6px 0 0";
  scaleList.style.paddingLeft = "18px";
  scaleList.style.fontSize = "0.9rem";

  senseiData.scaling.forEach((s) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = s;
    scaleList.appendChild(li);
  });

  scaleCard.appendChild(scaleList);
  leftCol.appendChild(scaleCard);

  // ----- Right: Critical Alerts + Fatigue ----------------------------------

  const alertCard = document.createElement("div");
  alertCard.className = "sensei-card";
  const alertTitle = document.createElement("h3");
  alertTitle.textContent = "Critical Alerts";
  alertCard.appendChild(alertTitle);

  if (!senseiData.criticalAlerts.length) {
    const p = document.createElement("p");
    p.style.fontSize = "0.9rem";
    p.style.color = "var(--color-text-muted)";
    p.textContent =
      "Aktuell keine kritischen Alerts. Sensei überwacht weiterhin deine Kampagnen & Creatives.";
    alertCard.appendChild(p);
  } else {
    const list = document.createElement("ul");
    list.style.margin = "6px 0 0";
    list.style.paddingLeft = "18px";
    list.style.fontSize = "0.9rem";
    senseiData.criticalAlerts.forEach((a) => {
      const li = document.createElement("li");
      li.style.marginBottom = "4px";
      li.textContent = a;
      list.appendChild(li);
    });
    alertCard.appendChild(list);
  }

  const fatigueCard = document.createElement("div");
  fatigueCard.className = "sensei-card";
  const fatigueTitle = document.createElement("h3");
  fatigueTitle.textContent = "Creative Fatigue & Risk";
  fatigueCard.appendChild(fatigueTitle);

  const fatigueList = document.createElement("ul");
  fatigueList.style.margin = "6px 0 0";
  fatigueList.style.paddingLeft = "18px";
  fatigueList.style.fontSize = "0.9rem";

  senseiData.fatigue.forEach((f) => {
    const li = document.createElement("li");
    li.style.marginBottom = "4px";
    li.textContent = f;
    fatigueList.appendChild(li);
  });
  fatigueCard.appendChild(fatigueList);

  rightCol.appendChild(alertCard);
  rightCol.appendChild(fatigueCard);

  mainGrid.appendChild(leftCol);
  mainGrid.appendChild(rightCol);

  rootEl.appendChild(mainGrid);

  // ---------------------------------------------------------------------------
  // SECOND ROW – Hook Performance & Creator Snapshot (volle Breite)
  // ---------------------------------------------------------------------------

  const bottomGrid = document.createElement("div");
  bottomGrid.style.display = "grid";
  bottomGrid.style.gridTemplateColumns = "minmax(0, 2fr) minmax(0, 1.6fr)";
  bottomGrid.style.gap = "16px";

  // Hook Performance Card
  const hooksCard = document.createElement("div");
  hooksCard.className = "sensei-card";
  const hooksTitle = document.createElement("h3");
  hooksTitle.textContent = "Hook Performance Breakdown";
  hooksCard.appendChild(hooksTitle);

  const hooksList = document.createElement("ul");
  hooksList.style.listStyle = "none";
  hooksList.style.margin = "8px 0 0";
  hooksList.style.paddingLeft = "0";

  senseiData.hooks.forEach((h) => {
    const li = document.createElement("li");
    li.style.display = "flex";
    li.style.alignItems = "center";
    li.style.gap = "8px";
    li.style.marginBottom = "6px";

    const label = document.createElement("div");
    label.style.minWidth = "120px";
    label.style.fontSize = "0.85rem";
    label.style.fontWeight = "500";
    label.textContent = h.name;

    const barWrapper = document.createElement("div");
    barWrapper.style.flex = "1";
    barWrapper.style.height = "6px";
    barWrapper.style.borderRadius = "999px";
    barWrapper.style.background = "#e0ddd8";

    const bar = document.createElement("div");
    bar.style.height = "100%";
    bar.style.borderRadius = "999px";
    bar.style.width = `${h.score}%`;
    bar.style.background =
      "linear-gradient(90deg, var(--color-primary), #7e9e7a)";

    barWrapper.appendChild(bar);

    const kpi = document.createElement("div");
    kpi.style.display = "flex";
    kpi.style.flexDirection = "column";
    kpi.style.alignItems = "flex-end";
    kpi.style.fontSize = "0.78rem";

    const line1 = document.createElement("span");
    line1.textContent = `${h.roas.toFixed(1)}x ROAS • ${h.share}% Spend`;

    const line2 = document.createElement("span");
    line2.style.color = "var(--color-text-soft)";
    line2.textContent = h.comment;

    kpi.appendChild(line1);
    kpi.appendChild(line2);

    li.appendChild(label);
    li.appendChild(barWrapper);
    li.appendChild(kpi);

    hooksList.appendChild(li);
  });

  hooksCard.appendChild(hooksList);
  bottomGrid.appendChild(hooksCard);

  // Creator Snapshot Card
  const creatorCard = document.createElement("div");
  creatorCard.className = "sensei-card";
  const creatorTitle = document.createElement("h3");
  creatorTitle.textContent = "Creator Performance Snapshot";
  creatorCard.appendChild(creatorTitle);

  const creatorList = document.createElement("ul");
  creatorList.style.margin = "8px 0 0";
  creatorList.style.paddingLeft = "18px";
  creatorList.style.fontSize = "0.9rem";

  senseiData.creators.forEach((c) => {
    const li = document.createElement("li");
    li.style.marginBottom = "6px";

    const line1 = document.createElement("div");
    line1.innerHTML = `<strong>${c.name}</strong> • ${c.role} • ROAS ${c.roas.toFixed(
      1
    )}x • Spend ${formatCurrency(c.spend)}`;

    const line2 = document.createElement("div");
    line2.style.fontSize = "0.8rem";
    line2.style.color = "var(--color-text-soft)";
    line2.textContent = c.comment;

    li.appendChild(line1);
    li.appendChild(line2);
    creatorList.appendChild(li);
  });

  creatorCard.appendChild(creatorList);
  bottomGrid.appendChild(creatorCard);

  rootEl.appendChild(bottomGrid);

  // ---------------------------------------------------------------------------
  // Interaktion: Timeframe-Select
  // ---------------------------------------------------------------------------

  timeframeSelect.addEventListener("change", () => {
    const tf = timeframeSelect.value;
    // Re-Render Sensei-View mit neuem Zeitraum
    render(rootEl, AppState, {
      ...env,
      timeframe: tf,
    });
    if (window.SignalOne && window.SignalOne.showToast) {
      window.SignalOne.showToast(
        `Sensei aktualisiert Insights für ${formatTimeframe(tf)}.`,
        "success"
      );
    }
  });
}

// ---------------------------------------------------------------------------
// DEMO-INTELLIGENCE – je Brand eigene AI-Insights
// ---------------------------------------------------------------------------

function getSenseiDataForBrand(brandId, timeframe) {
  // Fallback Generic
  const generic = {
    focus: "generelle Performance",
    topActions: [
      {
        title: "Structure Check",
        text: "Überprüfe deine Kampagnenstruktur und stelle sicher, dass Budget auf die besten Kampagnen konzentriert ist.",
      },
      {
        title: "Creative Refresh",
        text: "Plane einen Creative-Refresh für unterperformende Ads, bevor Fatigue sichtbar wird.",
      },
      {
        title: "Retargeting",
        text: "Nutze Retargeting-Kampagnen, um den Traffic der letzten Tage effizient zu monetarisieren.",
      },
    ],
    scaling: [
      "Analysiere deine besten Kampagnen der letzten 30 Tage und erhöhe deren Budget schrittweise.",
      "Teste neue Hooks auf Basis der Creatives mit der höchsten CTR.",
    ],
    criticalAlerts: [],
    fatigue: [
      "Noch keine harten Fatigue-Signale erkannt – trotzdem neue Creatives vorbereiten.",
    ],
    hooks: [
      {
        name: "Standard-Hook",
        score: 60,
        roas: 3.1,
        share: 40,
        comment: "Solide Performance, aber kein echter Winner.",
      },
    ],
    creators: [
      {
        name: "Generic Creator",
        role: "UGC Creator",
        spend: 10000,
        roas: 3.5,
        comment: "Konstante Performance ohne große Ausschläge nach oben oder unten.",
      },
    ],
  };

  const tfLabel =
    timeframe === "7d" ? "letzten 7 Tage" : timeframe === "90d" ? "letzten 90 Tage" : "letzten 30 Tage";

  switch (brandId) {
    case "acme_fashion":
      return {
        focus: `Fashion Evergreen Scaling (${tfLabel})`,
        topActions: [
          {
            title: "UGC-Winner kopieren",
            text: "Skaliere den UGC-Winner „Outfit in 10 Sekunden“ in eine eigene Scale-Kampagne mit Broad & Lookalike-Zielgruppen.",
          },
          {
            title: "Schwache Hooks abschalten",
            text: "Schalte Creatives mit ROAS < 2.0x und niedriger CTR in der Hook-Battle-Kampagne ab, um Budget zu fokussieren.",
          },
          {
            title: "Story-Ads nachziehen",
            text: "Nutze Varianten des UGC-Winners als Story-Format, um zusätzliche Touchpoints in Mobilumgebungen zu gewinnen.",
          },
        ],
        scaling: [
          "Erhöhe das Budget der besten Scale-Kampagne um 20–25 %, solange ROAS über 4.5x bleibt.",
          "Kombiniere die besten Hooks aus ‚Hook Battle Q4‘ mit dem UGC-Winner für neue Creative-Varianten.",
          "Teste 1–2 internationale Zielmärkte mit lokalisierten Hooks und Untertiteln.",
        ],
        criticalAlerts:
          timeframe === "7d"
            ? [
                "ROAS ist in den letzten 7 Tagen leicht gesunken (ca. -0.4x) – mögliche Fatigue bei Bestsellern.",
              ]
            : [
                "Mehrere alte Static-Creatives sind noch aktiv, liefern aber deutlich schwächere Performance.",
              ],
        fatigue: [
          "In Lookalike-Zielgruppen ist die Frequenz einzelner Winner-Creatives deutlich angestiegen.",
          "Hook-Varianten mit langen Intros verlieren gegenüber kurzen, klaren Hooks. Sensei empfiehlt, introspektive Szenen zu kürzen.",
        ],
        hooks: [
          {
            name: "Fast Try-On",
            score: 92,
            roas: 6.4,
            share: 38,
            comment: "Klarer Gewinner – starker ROAS und hohe CTR.",
          },
          {
            name: "Outfit Fail Fix",
            score: 78,
            roas: 4.1,
            share: 24,
            comment: "Gute Performance, aber noch Luft nach oben mit klarerem CTA.",
          },
          {
            name: "Lookbook Overview",
            score: 63,
            roas: 3.0,
            share: 18,
            comment: "Solide, aber eher unterstützend als primärer Scale-Treiber.",
          },
        ],
        creators: [
          {
            name: "Lena – Fashion Creator",
            role: "UGC / TikTok-Style",
            spend: 14890,
            roas: 6.1,
            comment:
              "Lieferte die stärksten Evergreen-Winner. Weitere Kooperationen sehr sinnvoll.",
          },
          {
            name: "Mia – Storytelling",
            role: "UGC Story",
            spend: 7120,
            roas: 3.8,
            comment:
              "Gute Watchtime, aber Hook braucht Optimierung. Storytelling-Strang ausbauen.",
          },
        ],
      };

    case "techgadgets_pro":
      return {
        focus: `Tech Launch & Retargeting (${tfLabel})`,
        topActions: [
          {
            title: "Retargeting stärken",
            text: "Skaliere die Retargeting-Kampagne mit Produktdemo & Unboxing, da hier der ROAS klar über Prospecting liegt.",
          },
          {
            title: "Prospecting vereinfachen",
            text: "Reduziere die Anzahl an Zielgruppen im Launch-Funnel, um Budget auf die besten Segmente zu konzentrieren.",
          },
          {
            title: "Feature-Hook testen",
            text: "Teste Hooks, die das Hauptproblem der Zielgruppe in den ersten 2 Sekunden auf den Punkt bringen (z. B. Akkulaufzeit, Geschwindigkeit).",
          },
        ],
        scaling: [
          "Erhöhe das Budget der Retargeting-Kampagne in 10 %-Schritten und überwache ROAS & Frequenz.",
          "Dupliziere die beste Prospecting-Struktur in einen neuen Ad-Set-Test mit Broad-Zielgruppen.",
          "Nutze Unboxing-Creatives stärker im Warm-Traffic, wo Vertrauen bereits vorhanden ist.",
        ],
        criticalAlerts: [
          "CPM in einigen Prospecting-Ad-Sets deutlich erhöht – möglicher Wettbewerb oder zu enge Zielgruppen.",
        ],
        fatigue: [
          "Unboxing-Creative zeigt leichte Fatigue; Watchtime bleibt stabil, CTR sinkt.",
          "Ad-Kombinationen mit zu vielen technischen Details verlieren kalte Zielgruppen früh.",
        ],
        hooks: [
          {
            name: "Problem → Lösung",
            score: 88,
            roas: 4.5,
            share: 42,
            comment: "Starke Klarheit im Value Proposition – ideal für kalte Zielgruppen.",
          },
          {
            name: "Unboxing / First Impression",
            score: 74,
            roas: 3.4,
            share: 27,
            comment: "Gut für warme Zielgruppen; schwächer im kalten Prospecting.",
          },
          {
            name: "Specs Overview",
            score: 59,
            roas: 2.6,
            share: 17,
            comment: "Eher Retargeting-Hook, nicht als Scale-Hook geeignet.",
          },
        ],
        creators: [
          {
            name: "Tom – Tech Reviewer",
            role: "Review / Demo",
            spend: 12980,
            roas: 4.3,
            comment:
              "Ideal für Conversion-orientierte Kampagnen – glaubwürdig und strukturiert.",
          },
          {
            name: "Alex – Creator",
            role: "Unboxing",
            spend: 6840,
            roas: 3.1,
            comment:
              "Starker Fit im Middle-Funnel, sollte in Zukunft mehr auf Benefits als auf Packaging fokussieren.",
          },
        ],
      };

    case "beautylux_cosmetics":
      return {
        focus: `Beauty UGC & Transformation (${tfLabel})`,
        topActions: [
          {
            title: "Top-Transformation skalieren",
            text: "Skaliere die Before/After-Routine-Winner in neue Kampagnenstrukturen mit unterschiedlicher Tageszeit (Morgen/Abend).",
          },
          {
            title: "Skin Concerns clustern",
            text: "Erstelle Kampagnen pro Skin-Concern (Akne, Anti-Aging, Hyperpigmentation) basierend auf den besten UGC-Creatives.",
          },
          {
            title: "Routine-Bundles testen",
            text: "Nutze Bundles mit höherem AOV in Retargeting-Kampagnen, da hier Vertrauen bereits vorhanden ist.",
          },
        ],
        scaling: [
          "Erhöhe das Budget auf Kampagnen mit ROAS > 6.0x, solange CTR > 3.5 % bleibt.",
          "Teste kürzere Varianten der besten Transformation-Creatives für Stories & Reels.",
          "Nutze Creator-Testimonials gezielt im Retargeting, um Skepsis abzubauen.",
        ],
        criticalAlerts: [
          "Einige ältere Ingredient-Creatives mit komplexen Claims zeigen sinkenden ROAS.",
        ],
        fatigue: [
          "Bestperformende Transformation-Ads erreichen hohe Frequenz; irgendwann droht Creative Burnout.",
          "Hook-Varianten ohne klares Before/After verlieren deutlich an Performance.",
        ],
        hooks: [
          {
            name: "Transformation",
            score: 96,
            roas: 7.4,
            share: 44,
            comment: "Klarer Winner-Hook – bildet die Kernbotschaft ideal ab.",
          },
          {
            name: "Ingredient Education",
            score: 81,
            roas: 5.1,
            share: 29,
            comment: "Sehr stark bei warmen Zielgruppen, ideal für Retargeting.",
          },
          {
            name: "Routine Breakdown",
            score: 70,
            roas: 4.0,
            share: 19,
            comment: "Gut, aber kann von klareren Vorher/Nachher-Visuals profitieren.",
          },
        ],
        creators: [
          {
            name: "Sophie – Skinfluencer",
            role: "UGC / Routine",
            spend: 17840,
            roas: 7.0,
            comment:
              "Ihre Routine-Videos liefern konstant überdurchschnittliche Performance – weitere Kollaborationen empfohlen.",
          },
          {
            name: "Dermatology Expert",
            role: "Expert POV",
            spend: 7420,
            roas: 4.6,
            comment:
              "Ideal, um Trust im oberen Funnel aufzubauen. Mehr kurze Snippets testen.",
          },
        ],
      };

    case "fitlife_supplements":
      return {
        focus: `Fitness Progress & Coaching (${tfLabel})`,
        topActions: [
          {
            title: "Progress-Stories hervorheben",
            text: "Nutze 30-Tage-Progress-Stories als Haupt-Creatives im Scale-Stack und erstelle Varianten mit unterschiedlichen Körpertypen.",
          },
          {
            title: "Coach POV strukturieren",
            text: "Erstelle klarere Calls-to-Action in Coach-POV-Videos, um mehr Click-Throughs zu generieren.",
          },
          {
            title: "Bundles & Subscriptions",
            text: "Teste Abonnement-Angebote im Retargeting, um den LTV zu erhöhen.",
          },
        ],
        scaling: [
          "Erhöhe das Budget auf Progress-Story-Creatives mit ROAS > 4.5x.",
          "Nutze zusätzliche Hook-Varianten, die „vorher/nachher“ noch stärker emotionalisieren.",
        ],
        criticalAlerts: [],
        fatigue: [
          "Die immer gleichen Trainings-Szenen können auf Dauer repetitiv wirken – mehr Alltagsszenen testen.",
        ],
        hooks: [
          {
            name: "Progress Journey",
            score: 90,
            roas: 5.0,
            share: 41,
            comment: "Sehr starke emotionale Bindung, gut für Scale geeignet.",
          },
          {
            name: "Coach Advice",
            score: 76,
            roas: 3.9,
            share: 27,
            comment: "Gut, aber hängt stark von der Klarheit des Offers ab.",
          },
        ],
        creators: [
          {
            name: "Jonas – Fitness Creator",
            role: "Progress / Journey",
            spend: 10980,
            roas: 4.8,
            comment:
              "Ideal für kalte und warme Zielgruppen, besonders in Reels.",
          },
          {
            name: "Coach Lisa",
            role: "Coach / Trainer",
            spend: 6240,
            roas: 3.6,
            comment:
              "Stark im Mittelfunnel; mehr Fokus auf konkrete Ergebnisse steigert die Performance.",
          },
        ],
      };

    case "homezen_living":
      return {
        focus: `Interior Makeover & Inspiration (${tfLabel})`,
        topActions: [
          {
            title: "Bestes Makeover skalieren",
            text: "Skaliere das Wohnzimmer-Makeover-Video mit zusätzlichen Varianten zu anderen Räumen (Schlafzimmer, Küche).",
          },
          {
            title: "Inspirations- vs. Performance-Creatives trennen",
            text: "Trenne Moodboard-Ads klar von Conversion-Kampagnen – nutze sie eher zur Inspiration.",
          },
          {
            title: "Produkt-Fokus erhöhen",
            text: "Zeige die konkreten Produkte stärker im Video statt nur die Gesamtstimmung.",
          },
        ],
        scaling: [
          "Teste mehr Short-Form-Clips aus dem längeren Makeover-Video.",
          "Nutze Karussells mit Vorher/Nachher-Bildern im Retargeting.",
        ],
        criticalAlerts: [
          "ROAS insgesamt unter Benchmark; Kampagne befindet sich eher in explorativer Testphase.",
        ],
        fatigue: [
          "Makeover-Ads nutzen sich schneller ab als expected – hoher Wow-Faktor, aber begrenzte Variabilität.",
        ],
        hooks: [
          {
            name: "Room Transformation",
            score: 82,
            roas: 4.0,
            share: 36,
            comment: "Bester Hook, braucht aber klareren Produktfokus.",
          },
          {
            name: "Mood / Vibe",
            score: 63,
            roas: 2.7,
            share: 22,
            comment: "Gut für Inspiration, schwach für direkte Conversions.",
          },
        ],
        creators: [
          {
            name: "Anna – Interior Creator",
            role: "Makeover",
            spend: 8420,
            roas: 4.1,
            comment:
              "Ihre Makeover-Videos funktionieren gut – Product Callouts noch prominenter einsetzen.",
          },
        ],
      };

    default:
      return generic;
  }
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function formatCurrency(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTimeframe(tf) {
  switch (tf) {
    case "7d":
      return "letzte 7 Tage";
    case "90d":
      return "letzte 90 Tage";
    default:
      return "letzte 30 Tage";
  }
}
