// ======================================================================
// SignalOne.cloud – Rebuild Option 1 (Mock-System, Style A)
// ======================================================================

"use strict";

// ----------------------------------------------------------------------
// MOCK-DATEN (stylisches Demo-System)
// ----------------------------------------------------------------------

const MockData = {
  creatives: [
    {
      id: "c1",
      name: "UGC Hook – Unboxing Reel",
      mediaType: "video",
      url: "/mock/Creative10.mp4",
      format: "9:16",
      objective: "Sales",
      roas: 3.8,
      ctr: 2.7,
      cpc: 0.78,
      impressions: 28450,
      spend: 222.3,
      revenue: 845.6,
      score: 89,
      platform: "Meta"
    },
    {
      id: "c2",
      name: "Static – Hero Product Shot",
      mediaType: "image",
      url: "/mock/Creative1.png",
      format: "1:1",
      objective: "Sales",
      roas: 3.2,
      ctr: 2.1,
      cpc: 0.71,
      impressions: 19840,
      spend: 141.9,
      revenue: 454.2,
      score: 84,
      platform: "Meta"
    },
    {
      id: "c3",
      name: "Carousel – Before / After",
      mediaType: "image",
      url: "/mock/Creative2.png",
      format: "1:1",
      objective: "Sales",
      roas: 2.4,
      ctr: 1.9,
      cpc: 0.84,
      impressions: 16200,
      spend: 136.1,
      revenue: 326.4,
      score: 73,
      platform: "Meta"
    },
    {
      id: "c4",
      name: "Story – Rabatt Countdown",
      mediaType: "image",
      url: "/mock/Creative3.png",
      format: "9:16",
      objective: "Sales",
      roas: 1.6,
      ctr: 1.3,
      cpc: 0.92,
      impressions: 14890,
      spend: 137.0,
      revenue: 219.2,
      score: 58,
      platform: "Meta"
    },
    {
      id: "c5",
      name: "Feed Video – Testimonial",
      mediaType: "video",
      url: "/mock/Creative11.mp4",
      format: "4:5",
      objective: "Sales",
      roas: 4.1,
      ctr: 3.1,
      cpc: 0.69,
      impressions: 26210,
      spend: 180.4,
      revenue: 739.2,
      score: 92,
      platform: "Meta"
    },
    {
      id: "c6",
      name: "Static – Minimalist Brand Ad",
      mediaType: "image",
      url: "/mock/Creative4.png",
      format: "1:1",
      objective: "Awareness",
      roas: 1.9,
      ctr: 0.9,
      cpc: 1.02,
      impressions: 22110,
      spend: 225.3,
      revenue: 285.4,
      score: 52,
      platform: "Meta"
    },
    {
      id: "c7",
      name: "Reel – POV Use Case",
      mediaType: "video",
      url: "/mock/Creative12.mp4",
      format: "9:16",
      objective: "Sales",
      roas: 2.9,
      ctr: 2.3,
      cpc: 0.76,
      impressions: 17890,
      spend: 135.9,
      revenue: 394.8,
      score: 81,
      platform: "Meta"
    },
    {
      id: "c8",
      name: "Static – Bold Offer 20% OFF",
      mediaType: "image",
      url: "/mock/Creative5.png",
      format: "1:1",
      objective: "Sales",
      roas: 1.3,
      ctr: 0.8,
      cpc: 1.15,
      impressions: 15430,
      spend: 177.5,
      revenue: 230.1,
      score: 44,
      platform: "Meta"
    }
  ],
  campaigns: [
    {
      id: "cmp1",
      name: "Prospecting – Broad DE",
      spend: 640.3,
      impressions: 118_400,
      clicks: 2_436,
      ctr: 2.06,
      cpc: 0.26,
      purchases: 212,
      revenue: 13_420.0,
      roas: 4.19
    },
    {
      id: "cmp2",
      name: "Retargeting – 7 Days",
      spend: 280.4,
      impressions: 34_820,
      clicks: 1_512,
      ctr: 4.34,
      cpc: 0.19,
      purchases: 164,
      revenue: 9_780.0,
      roas: 6.96
    },
    {
      id: "cmp3",
      name: "Lookalike 1% – AT / CH",
      spend: 420.7,
      impressions: 82_330,
      clicks: 1_623,
      ctr: 1.97,
      cpc: 0.26,
      purchases: 118,
      revenue: 5_840.0,
      roas: 3.88
    },
    {
      id: "cmp4",
      name: "Advantage+ Shopping Test",
      spend: 310.2,
      impressions: 71_940,
      clicks: 1_284,
      ctr: 1.79,
      cpc: 0.24,
      purchases: 101,
      revenue: 4_560.0,
      roas: 3.68
    },
    {
      id: "cmp5",
      name: "Remarketing – Abandoned Cart",
      spend: 190.4,
      impressions: 21_740,
      clicks: 984,
      ctr: 4.52,
      cpc: 0.19,
      purchases: 137,
      revenue: 6_120.0,
      roas: 8.08
    }
  ],
  insights: [
    {
      id: "ins1",
      type: "creative",
      title: "UGC-Videos outperformen Static Ads um +38% ROAS",
      body: "Deine UGC Reels (Unboxing & POV) liefern deutlich besseren ROAS als statische Produktbilder. Du solltest das Budget schrittweise von schwachen Statics zu diesen Formaten verschieben.",
      impact: "hoch"
    },
    {
      id: "ins2",
      type: "funnel",
      title: "Starker CTR, aber Conversion-Rate unter Benchmarks",
      body: "Klicks sind solide, aber die CR nach Klick ist schwächer. Vermutlich brechen Nutzer auf der Produktseite ab – Landing-Page-Optimierung lohnt sich hier.",
      impact: "mittel"
    },
    {
      id: "ins3",
      type: "audience",
      title: "Retargeting 7 Tage ist dein heimlicher Champion",
      body: "Retargeting-Kampagnen haben den besten ROAS. Prüfe, ob du hier mehr Budget allokieren und die Zielgruppen-Logik verfeinern kannst.",
      impact: "hoch"
    },
    {
      id: "ins4",
      type: "offer",
      title: "Offer-Ad mit starkem Rabatt zieht, aber ist ineffizient",
      body: "Die 20%-Rabatt-Creatives holen viele Klicks, aber die Profitabilität ist niedrig. Rabatthöhe & Communication solltest du testen.",
      impact: "mittel"
    }
  ]
};

// Library = alle Creatives
MockData.library = [...MockData.creatives];

// ----------------------------------------------------------------------
// APP STATE + LOG
// ----------------------------------------------------------------------

const AppState = {
  theme: "light",
  mode: "demo",      // "demo" | "live"
  period: "30d",     // 24h | 7d | 30d (nur Label)
  creativeSort: "roas", // roas | ctr | cpc | impressions | score
  creativeView: "grid", // grid | list
  connections: {
    meta: false,
    tiktok: false,
    google: false
  },
  kpi: null
};

const EventLog = [];

function logEvent(type, payload = {}) {
  EventLog.push({
    type,
    payload,
    ts: new Date().toISOString()
  });
  if (EventLog.length > 200) EventLog.shift();
  if (document.getElementById("stateInspector")?.classList.contains("open")) {
    renderInspector();
  }
}

// ----------------------------------------------------------------------
// FORMATTER
// ----------------------------------------------------------------------

const fmt = {
  num(v, d = 1) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    });
  },
  int(v) {
    return Number(v || 0).toLocaleString("de-DE");
  },
  pct(v, d = 2) {
    const n = Number(v || 0);
    return (
      n.toLocaleString("de-DE", {
        minimumFractionDigits: d,
        maximumFractionDigits: d
      }) + " %"
    );
  },
  curr(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  },
  short(v) {
    const n = Number(v || 0);
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + "M";
    if (n >= 1_000) return (n / 1_000).toFixed(1).replace(".", ",") + "K";
    return n.toString();
  }
};

// ----------------------------------------------------------------------
// KPI BERECHNUNG (aus Mock-Creatives)
// ----------------------------------------------------------------------

function calculateGlobalKpi() {
  const list = MockData.creatives;
  if (!list.length) return null;

  const acc = list.reduce(
    (a, c) => {
      a.impressions += c.impressions;
      const clicks = Math.round(c.impressions * (c.ctr / 100));
      a.clicks += clicks;
      a.spend += c.spend;
      a.revenue += c.revenue;
      return a;
    },
    { impressions: 0, clicks: 0, spend: 0, revenue: 0 }
  );

  const purchases = Math.round(acc.revenue / 60); // grob: 60€ AOV
  const ctr = acc.impressions ? (acc.clicks / acc.impressions) * 100 : 0;
  const cpc = acc.clicks ? acc.spend / acc.clicks : 0;
  const roas = acc.spend ? acc.revenue / acc.spend : 0;
  const cr = acc.clicks ? (purchases / acc.clicks) * 100 : 0;
  const aov = purchases ? acc.revenue / purchases : 0;

  return {
    impressions: acc.impressions,
    clicks: acc.clicks,
    spend: acc.spend,
    revenue: acc.revenue,
    roas,
    ctr,
    cpc,
    cr,
    aov,
    purchases
  };
}

// ----------------------------------------------------------------------
// THEME
// ----------------------------------------------------------------------

function initTheme() {
  const saved = localStorage.getItem("sig_theme");
  const theme = saved === "dark" ? "dark" : "light"; // Standard = light
  AppState.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  logEvent("theme:init", { theme });
}

function setupThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const isDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", isDark);
    const theme = isDark ? "dark" : "light";
    AppState.theme = theme;
    localStorage.setItem("sig_theme", theme);
    logEvent("theme:toggle", { theme });
  });
}

// ----------------------------------------------------------------------
// DATUM + MODE (Demo/Live-Schalter rechts oben)
// ----------------------------------------------------------------------

function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  el.textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short"
  }).format(now);
}

function setupModeToggle() {
  const liveBtn = document.getElementById("mode-live");
  const simBtn = document.getElementById("mode-sim");
  if (!liveBtn || !simBtn) return;

  function updateButtons() {
    if (AppState.mode === "demo") {
      simBtn.classList.add("active");
      liveBtn.classList.remove("active");
    } else {
      liveBtn.classList.add("active");
      simBtn.classList.remove("active");
    }
  }

  liveBtn.addEventListener("click", () => {
    AppState.mode = "live";
    updateButtons();
    alert(
      "Live-Mode: Hier hängst du später einfach die echte Meta-API dran. Aktuell noch Demo-Daten."
    );
    logEvent("mode:change", { mode: "live" });
  });

  simBtn.addEventListener("click", () => {
    AppState.mode = "demo";
    updateButtons();
    logEvent("mode:change", { mode: "demo" });
  });

  updateButtons();
}

// ----------------------------------------------------------------------
// SIDEBAR / NAVIGATION
// ----------------------------------------------------------------------

function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  if (!sidebar || !toggle) return;

  function isMobile() {
    return window.innerWidth <= 1200;
  }

  toggle.addEventListener("click", () => {
    if (isMobile()) {
      sidebar.classList.toggle("open");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });

  window.addEventListener("resize", () => {
    if (!isMobile()) {
      sidebar.classList.remove("open");
    }
  });

  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      if (!view) return;

      document.querySelectorAll(".menu-item").forEach((i) =>
        i.classList.remove("active")
      );
      item.classList.add("active");

      document.querySelectorAll(".view").forEach((v) => {
        v.classList.add("hidden");
        v.classList.remove("active");
      });

      const target = document.getElementById("view-" + view);
      if (!target) return;
      target.classList.remove("hidden");
      target.classList.add("active");

      const pageTitle = document.querySelector(".page-title");
      if (pageTitle) {
        const labelEl = item.querySelector(".menu-label");
        pageTitle.textContent = labelEl
          ? labelEl.textContent
          : item.dataset.tooltip || "Dashboard";
      }

      if (isMobile()) {
        sidebar.classList.remove("open");
      }

      logEvent("nav:change", { view });
      renderAll();
    });
  });
}

// ----------------------------------------------------------------------
// DASHBOARD (Style A)
// ----------------------------------------------------------------------

function renderDashboard() {
  const kpi = AppState.kpi;

  // Hero Grid – Top 4 Creatives
  const hero = document.getElementById("creativeGridHero");
  if (hero) {
    const topCreatives = [...MockData.creatives]
      .sort((a, b) => b.roas - a.roas)
      .slice(0, 4);

    hero.innerHTML = topCreatives
      .map((c) => {
        const isVideo = c.mediaType === "video";
        const media = isVideo
          ? `<video class="creative-thumb" src="${c.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
          : `<img class="creative-thumb" src="${c.url}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/400x400?text=Creative'"/>`;

        const roasClass = c.roas >= 3.5 ? "success" : c.roas >= 2 ? "warning" : "danger";
        const ctrClass = c.ctr >= 2.5 ? "success" : c.ctr >= 1.5 ? "warning" : "danger";

        return `
        <article class="creative-card-enhanced creative-hero-card" data-creative-id="${c.id}">
          <div class="creative-media-container">
            ${media}
            <div class="creative-platform-badge">
              <span class="platform-icon meta-icon">f</span> ${c.platform}
            </div>
            <div class="creative-score-badge">${c.score}/100</div>
          </div>
          <div class="creative-card-body">
            <div class="creative-title">${c.name}</div>
            <div class="creative-metrics-grid">
              <div class="metric-item ${roasClass}">
                <div class="metric-label-sm">ROAS</div>
                <div class="metric-value-sm">${fmt.num(c.roas, 2)}x</div>
              </div>
              <div class="metric-item ${ctrClass}">
                <div class="metric-label-sm">CTR</div>
                <div class="metric-value-sm">${fmt.num(c.ctr, 2)}%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label-sm">CPC</div>
                <div class="metric-value-sm">${fmt.curr(c.cpc)}</div>
              </div>
            </div>
          </div>
        </article>`;
      })
      .join("");

    // Klick -> Details
    hero.querySelectorAll("[data-creative-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-creative-id");
        showCreativeDetails(id);
      });
    });
  }

  // Summary Cards
  if (kpi) {
    const avgROAS = document.getElementById("avgROAS");
    const avgCTR = document.getElementById("avgCTR");
    const totalSpend = document.getElementById("totalSpend");
    const totalRevenue = document.getElementById("totalRevenue");

    if (avgROAS) avgROAS.textContent = fmt.num(kpi.roas, 1) + "x";
    if (avgCTR) avgCTR.textContent = fmt.num(kpi.ctr, 1) + " %";
    if (totalSpend) totalSpend.textContent = fmt.curr(kpi.spend);
    if (totalRevenue) totalRevenue.textContent = fmt.curr(kpi.revenue);

    setTrend("avgROASTrend", kpi.roas, 3.0);
    setTrend("avgCTRTrend", kpi.ctr, 2.0);
    setTrend("totalSpendTrend", kpi.spend, kpi.spend * 0.9, true);
    setTrend("totalRevenueTrend", kpi.revenue, kpi.revenue * 0.9);
  }

  // KPI Deep Dive
  if (kpi) {
    const deepROAS = document.getElementById("deepROAS");
    const deepCTR = document.getElementById("deepCTR");
    const deepCPC = document.getElementById("deepCPC");
    const deepCR = document.getElementById("deepCR");
    const deepAOV = document.getElementById("deepAOV");
    const deepRevenue = document.getElementById("deepRevenue");

    if (deepROAS) deepROAS.textContent = fmt.num(kpi.roas, 2) + "x";
    if (deepCTR) deepCTR.textContent = fmt.pct(kpi.ctr, 2);
    if (deepCPC) deepCPC.textContent = fmt.curr(kpi.cpc);
    if (deepCR) deepCR.textContent = fmt.pct(kpi.cr, 2);
    if (deepAOV) deepAOV.textContent = fmt.curr(kpi.aov);
    if (deepRevenue) deepRevenue.textContent = fmt.curr(kpi.revenue);
  }

  // Winner / Loser
  renderWinnerLoser();

  // Kurz-Insights im Dashboard
  const insightsShort = document.getElementById("insightsContent");
  if (insightsShort) {
    const topInsights = MockData.insights.slice(0, 3);
    insightsShort.innerHTML = topInsights
      .map(
        (i) => `
      <div class="insight-card">
        <div class="insight-meta">
          ${i.type.toUpperCase()} · Impact: ${i.impact.toUpperCase()}
        </div>
        <div class="insight-title">${i.title}</div>
        <div class="insight-body">${i.body}</div>
      </div>
    `
      )
      .join("");
  }

  updatePeriodLabel();
}

function setTrend(id, value, baseline, invert = false) {
  const el = document.getElementById(id);
  if (!el) return;
  const diff = baseline ? ((value - baseline) / baseline) * 100 : 0;
  const rounded = Math.round(diff);
  el.textContent = (diff >= 0 ? "+" : "") + rounded + " %";

  el.classList.remove("positive", "negative", "neutral");
  if (Math.abs(diff) < 2) {
    el.classList.add("neutral");
  } else if ((diff >= 0 && !invert) || (diff < 0 && invert)) {
    el.classList.add("positive");
  } else {
    el.classList.add("negative");
  }
}

function renderWinnerLoser() {
  if (!MockData.creatives.length) return;
  const sorted = [...MockData.creatives].sort((a, b) => b.roas - a.roas);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];

  const winnerEl = document.getElementById("winnerContent");
  const loserEl = document.getElementById("loserContent");

  function cardHtml(c, isWinner) {
    const isVideo = c.mediaType === "video";
    const media = isVideo
      ? `<video style="width:100%; border-radius:8px; margin-bottom:12px;" controls src="${c.url}"></video>`
      : `<img style="width:100%; border-radius:8px; margin-bottom:12px;" src="${c.url}" alt="${c.name}" />`;

    const hint = isWinner
      ? "🚀 Skalierungskandidat – Budget sanft nach oben schieben und ähnliche Creatives testen."
      : "⚠️ Unterperformer – pausieren oder komplett neues Creative testen (anderer Hook, anderes Visual).";

    return `
      ${media}
      <h3 style="font-size:15px; margin-bottom:10px; font-weight:700;">${c.name}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div style="background:${isWinner ? "var(--success-light)" : "var(--danger-light)"}; padding:10px; border-radius:8px;">
          <div style="font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">ROAS</div>
          <div style="font-size:20px; font-weight:800;">${fmt.num(c.roas, 2)}x</div>
        </div>
        <div style="background:var(--bg-alt); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-size:10px; color:var(--text-light); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">CTR</div>
          <div style="font-size:20px; font-weight:800;">${fmt.num(c.ctr, 2)}%</div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${hint}</div>
    `;
  }

  if (winnerEl && winner) winnerEl.innerHTML = cardHtml(winner, true);
  if (loserEl && loser) loserEl.innerHTML = cardHtml(loser, false);
}

// ----------------------------------------------------------------------
// CREATIVES VIEW
// ----------------------------------------------------------------------

function setupCreativesControls() {
  const sort = document.getElementById("sortCreatives");
  if (sort) {
    sort.addEventListener("change", (e) => {
      AppState.creativeSort = e.target.value;
      logEvent("creatives:sort", { sort: AppState.creativeSort });
      renderCreativesView();
    });
  }

  const viewBtns = document.querySelectorAll(
    "#view-creatives .view-btn[data-view]"
  );
  viewBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      viewBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      AppState.creativeView = btn.dataset.view || "grid";
      logEvent("creatives:view", { view: AppState.creativeView });
      renderCreativesView();
    });
  });
}

function renderCreativesView() {
  const grid = document.getElementById("creativeGrid");
  if (!grid) return;

  let items = [...MockData.creatives];

  // Sortierung
  items.sort((a, b) => {
    switch (AppState.creativeSort) {
      case "roas":
        return b.roas - a.roas;
      case "ctr":
        return b.ctr - a.ctr;
      case "cpc":
        return a.cpc - b.cpc;
      case "impressions":
        return b.impressions - a.impressions;
      case "score":
        return b.score - a.score;
      default:
        return 0;
    }
  });

  // Anzahl in Sidebar
  const creativeCount = document.getElementById("creativeCount");
  if (creativeCount) creativeCount.textContent = items.length.toString();

  const isList = AppState.creativeView === "list";
  grid.className = isList ? "creative-grid creative-grid-list" : "creative-grid";

  grid.innerHTML = items
    .map((c) => {
      const isVideo = c.mediaType === "video";
      const media = isVideo
        ? `<video class="creative-thumb" src="${c.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
        : `<img class="creative-thumb" src="${c.url}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/400x400?text=Creative'"/>`;

      const layoutClass = isList ? "creative-card list" : "creative-card";

      return `
      <article class="${layoutClass}" data-creative-id="${c.id}">
        <div style="position:relative;">
          ${media}
          <span class="creative-badge">${c.score}/100</span>
        </div>
        <div class="creative-info">
          <div>
            <div style="font-weight:600; margin-bottom:4px;">${c.name}</div>
            <div style="font-size:11px; color:var(--text-secondary);">
              ${c.format} · ${c.objective} · ${c.platform}
            </div>
          </div>
          <div style="text-align:right; font-size:12px;">
            <div>ROAS: <strong>${fmt.num(c.roas, 2)}x</strong></div>
            <div>CTR: <strong>${fmt.num(c.ctr, 2)}%</strong></div>
            <div>CPC: <strong>${fmt.curr(c.cpc)}</strong></div>
          </div>
        </div>
      </article>
    `;
    })
    .join("");

  // Klickhandling (Details)
  grid.querySelectorAll("[data-creative-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-creative-id");
      showCreativeDetails(id);
    });
  });
}

// ----------------------------------------------------------------------
// PERIOD / DATE RANGE TOGGLE (nur Label, Demo)
// ----------------------------------------------------------------------

function updatePeriodLabel() {
  const el = document.getElementById("dashPeriodLabel");
  if (!el) return;

  let label = "Letzte 30 Tage (Demo)";
  if (AppState.period === "24h") label = "Letzte 24 Stunden (Demo)";
  else if (AppState.period === "7d") label = "Letzte 7 Tage (Demo)";

  el.textContent = label;
}

function setupPeriodToggles() {
  const btns = document.querySelectorAll(".toggle-btn[data-period]");
  if (!btns.length) return;

  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const period = btn.dataset.period;
      if (period === "30") AppState.period = "30d";
      else if (period === "7") AppState.period = "7d";
      else AppState.period = "24h";

      logEvent("period:change", { period: AppState.period });
      updatePeriodLabel();
    });
  });
}

// ----------------------------------------------------------------------
// CREATIVE DETAILS (Alert – Demo)
// ----------------------------------------------------------------------

function showCreativeDetails(id) {
  const c = MockData.creatives.find((x) => x.id === id);
  if (!c) return;

  const impressionClicks = Math.round(c.impressions * (c.ctr / 100));
  const text =
    `Creative: ${c.name}\n\n` +
    `Platform: ${c.platform}\n` +
    `Format: ${c.format}\n` +
    `Objective: ${c.objective}\n\n` +
    `Impressions: ${fmt.int(c.impressions)}\n` +
    `Klicks (approx.): ${fmt.int(impressionClicks)}\n` +
    `Spend: ${fmt.curr(c.spend)}\n` +
    `Revenue: ${fmt.curr(c.revenue)}\n\n` +
    `ROAS: ${fmt.num(c.roas, 2)}x\n` +
    `CTR: ${fmt.num(c.ctr, 2)}%\n` +
    `CPC: ${fmt.curr(c.cpc)}\n` +
    `Performance-Score: ${c.score}/100\n`;

  alert(text);
  logEvent("creative:details", { id });
}

// ----------------------------------------------------------------------
// CAMPAIGNS
// ----------------------------------------------------------------------

function renderCampaignsView() {
  const body = document.getElementById("campaignTableBody");
  if (!body) return;

  body.innerHTML = "";

  MockData.campaigns.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${c.name}</td>
      <td>${fmt.curr(c.spend)}</td>
      <td>${fmt.int(c.impressions)}</td>
      <td>${fmt.int(c.clicks)}</td>
      <td>${fmt.num(c.ctr, 2)}%</td>
      <td>${fmt.int(c.purchases)}</td>
      <td>${fmt.num(c.roas, 2)}x</td>
    `;
    tr.addEventListener("click", () => {
      alert(
        `Kampagne: ${c.name}\n\n` +
          `Spend: ${fmt.curr(c.spend)}\nRevenue: ${fmt.curr(
            c.revenue
          )}\nROAS: ${fmt.num(c.roas, 2)}x\nCTR: ${fmt.num(
            c.ctr,
            2
          )}%\nPurchases: ${fmt.int(c.purchases)}`
      );
      logEvent("campaign:details", { id: c.id });
    });
    body.appendChild(tr);
  });
}

// ----------------------------------------------------------------------
// INSIGHTS VIEW (Detailseite)
// ----------------------------------------------------------------------

function renderInsightsView() {
  const container = document.getElementById("insightsDetail");
  if (!container) return;
  const kpi = AppState.kpi;

  let header = "";
  if (kpi) {
    header =
      `<p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px;">` +
      `Aktueller Gesamt-ROAS: <strong>${fmt.num(kpi.roas, 2)}x</strong>, ` +
      `CTR: <strong>${fmt.num(kpi.ctr, 2)}%</strong>, ` +
      `CR: <strong>${fmt.num(kpi.cr, 2)}%</strong></p>`;
  }

  const list = MockData.insights
    .map(
      (i) => `
    <article class="insight-card-lg">
      <div class="insight-meta">
        ${i.type.toUpperCase()} · Impact: ${i.impact.toUpperCase()}
      </div>
      <h3 class="insight-title">${i.title}</h3>
      <p class="insight-body">${i.body}</p>
    </article>
  `
    )
    .join("");

  container.innerHTML = header + list;
}

// ----------------------------------------------------------------------
// SIGNAL SENSEI VIEW (Strategie-Box)
// ----------------------------------------------------------------------

function renderSenseiView() {
  const out = document.getElementById("senseiOutput");
  if (!out) return;
  const kpi = AppState.kpi;
  if (!kpi) {
    out.textContent = "Noch keine Daten geladen.";
    return;
  }

  const strategy = determineSenseiStrategy(kpi.roas, kpi.ctr, kpi.cr);

  out.innerHTML = `
    <div class="sensei-box">
      <div class="sensei-icon">${strategy.icon}</div>
      <div class="sensei-meta">Empfohlene Strategie</div>
      <h3 class="sensei-title">${strategy.title}</h3>
      <p class="sensei-body">
        ${strategy.description}
      </p>
      <ul class="sensei-actions">
        ${strategy.actions.map((a) => `<li>${a}</li>`).join("")}
      </ul>
    </div>
  `;
}

function determineSenseiStrategy(roas, ctr, cr) {
  if (roas >= 4 && ctr >= 2.5 && cr >= 3) {
    return {
      icon: "🚀",
      title: "Aggressives Scaling mit UGC-Fokus",
      description:
        "Performance ist sehr stark. Du solltest behutsam skalieren und die Top-Creatives duplizieren, ohne die Lernphase zu zerstören.",
      actions: [
        "Budget bei Top-Kampagnen um 20–30% erhöhen.",
        "Lookalike-Audiences testen (1–3%).",
        "Zusätzliche UGC-Varianten mit ähnlichem Hook launchen."
      ]
    };
  }
  if (roas >= 2.5 && ctr >= 2) {
    return {
      icon: "⚡",
      title: "Optimierungs- und Teststrategie",
      description:
        "Solide Basis, aber es steckt noch Luft nach oben drin. Fokus auf Creative-Tests und Landing-Page-Optimierung.",
      actions: [
        "2–3 neue Hooks pro Woche testen.",
        "Landing-Page mit A/B Tests für Hero-Section und Trust-Elemente verbessern.",
        "Budget auf Kampagnen mit stabiler Performance leichter hochfahren."
      ]
    };
  }
  if (roas < 2) {
    return {
      icon: "🧱",
      title: "Rebuild & Struktur-Neustart",
      description:
        "Aktuell ist die Performance nicht nachhaltig profitabel. Du solltest zurück auf ein klares Test-Setup und saubere Struktur.",
      actions: [
        "Neue Testkampagnen mit klarer Trennung Prospecting / Retargeting.",
        "Mindestens 3–5 frische Creatives pro Woche testen.",
        "Angebot, Preispositionierung und Value Proposition überprüfen."
      ]
    };
  }
  return {
    icon: "🎯",
    title: "Effizienz-Feintuning",
    description:
      "Die Ergebnisse sind in Ordnung, aber du kannst CPM, CPC und CR noch genauer optimieren.",
    actions: [
      "Placements und Ausspielzeiten analysieren und bereinigen.",
      "CPM-Treiber identifizieren (z. B. Creatives mit schlechter Relevanz).",
      "Fokus auf Creatives mit hoher CR und stabilem ROAS."
    ]
  };
}

// ----------------------------------------------------------------------
// CREATIVE LIBRARY
// ----------------------------------------------------------------------

function renderLibraryView() {
  const grid = document.getElementById("libraryGrid");
  if (!grid) return;

  if (!MockData.library.length) {
    grid.innerHTML =
      '<div style="grid-column:1/-1; color:var(--text-secondary);">Noch keine Creatives in der Library.</div>';
    return;
  }

  grid.innerHTML = MockData.library
    .map(
      (c) => `
    <article class="creative-card" data-library-id="${c.id}">
      <div style="position:relative;">
        ${
          c.mediaType === "video"
            ? `<video class="creative-thumb" src="${c.url}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img class="creative-thumb" src="${c.url}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/400x400?text=Creative'"/>`
        }
        <span class="creative-badge">${c.score}/100</span>
      </div>
      <div class="creative-info">
        <div>
          <div style="font-weight:600; margin-bottom:4px;">${c.name}</div>
          <div style="font-size:11px; color:var(--text-secondary);">${c.platform} · ${c.format}</div>
        </div>
      </div>
    </article>
  `
    )
    .join("");

  grid.querySelectorAll("[data-library-id]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.getAttribute("data-library-id");
      showCreativeDetails(id);
      logEvent("library:openCreative", { id });
    });
  });
}

// ----------------------------------------------------------------------
// REPORTS VIEW (Snapshot + JSON-Export)
// ----------------------------------------------------------------------

function renderReportsView() {
  const container = document.getElementById("reportsContainer");
  if (!container) return;

  const kpi = AppState.kpi;
  if (!kpi) {
    container.innerHTML = "Noch keine Daten für Reports.";
    return;
  }

  const jsonExport = {
    generatedAt: new Date().toISOString(),
    mode: AppState.mode,
    kpi,
    campaigns: MockData.campaigns,
    creatives: MockData.creatives
  };

  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
      <div>
        <h3 style="font-size:15px; font-weight:700; margin-bottom:4px;">Performance Snapshot</h3>
        <p style="font-size:12px; color:var(--text-secondary);">
          Zusammenfassung deiner aktuellen Demo-Performance. Diese Struktur kannst du 1:1 verwenden, wenn später echte Meta-Daten reinfließen.
        </p>
      </div>
      <button id="exportJsonBtn" class="button primary" style="padding:8px 12px; font-size:12px;">
        JSON-Export
      </button>
    </div>

    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin-bottom:16px;">
      <div class="summary-card">
        <div class="summary-icon">👁️</div>
        <div class="summary-content">
          <div class="summary-label">Impressions</div>
          <div class="summary-value">${fmt.short(kpi.impressions)}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">🖱️</div>
        <div class="summary-content">
          <div class="summary-label">Clicks</div>
          <div class="summary-value">${fmt.short(kpi.clicks)}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💸</div>
        <div class="summary-content">
          <div class="summary-label">Spend</div>
          <div class="summary-value">${fmt.curr(kpi.spend)}</div>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon">💰</div>
        <div class="summary-content">
          <div class="summary-label">Revenue</div>
          <div class="summary-value">${fmt.curr(kpi.revenue)}</div>
        </div>
      </div>
    </div>

    <pre style="font-size:11px; background:var(--bg); padding:10px; border-radius:8px; max-height:220px; overflow:auto; border:1px solid var(--border);">
${JSON.stringify(jsonExport, null, 2)}
    </pre>
  `;

  const btn = document.getElementById("exportJsonBtn");
  if (btn) {
    btn.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(jsonExport, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "signalone-demo-export.json";
      a.click();
      URL.revokeObjectURL(url);
      logEvent("reports:exportJson", {});
    });
  }
}

// ----------------------------------------------------------------------
// CONNECTIONS (Meta-Demo)
// ----------------------------------------------------------------------

function setupConnections() {
  const connectMeta = document.getElementById("connectMeta");
  const connectMetaSettings = document.getElementById("connectMetaSettings");

  function toggleMeta() {
    AppState.connections.meta = !AppState.connections.meta;
    renderConnectionsView();
    logEvent("connections:metaToggle", {
      connected: AppState.connections.meta
    });
  }

  if (connectMeta) connectMeta.addEventListener("click", toggleMeta);
  if (connectMetaSettings) connectMetaSettings.addEventListener("click", toggleMeta);

  renderConnectionsView();
}

function renderConnectionsView() {
  const statusText = document.getElementById("metaConnectionStatus");
  const apiStatus = document.getElementById("metaApiStatus");
  const dot = document.getElementById("metaStatusDot");
  const text = document.getElementById("metaStatusText");

  const connected = AppState.connections.meta;

  if (statusText) statusText.textContent = connected ? "Connected (Demo)" : "Not connected";
  if (apiStatus) apiStatus.textContent = connected ? "Verbunden (Demo)" : "Nicht verbunden";

  if (dot && text) {
    dot.classList.remove("meta-status-ok", "meta-status-error");
    if (connected) {
      dot.classList.add("meta-status-ok");
      text.textContent = "Demo Mode";
    } else {
      dot.classList.add("meta-status-error");
      text.textContent = "Nicht verbunden";
    }
  }
}

// ----------------------------------------------------------------------
// PROFILE & SETTINGS (LocalStorage)
// ----------------------------------------------------------------------

function loadProfileSettings() {
  const profile = JSON.parse(localStorage.getItem("sig_profile") || "{}");
  const branding = JSON.parse(localStorage.getItem("sig_branding") || "{}");
  const app = JSON.parse(localStorage.getItem("sig_appSettings") || "{}");

  const profileName = document.getElementById("profileName");
  const profileEmail = document.getElementById("profileEmail");
  const profileAvatar = document.getElementById("profileAvatar");

  const brandName = document.getElementById("brandName");
  const brandColor = document.getElementById("brandColor");

  const appTheme = document.getElementById("appTheme");
  const appMotion = document.getElementById("appMotion");

  if (profileName) profileName.value = profile.name || "";
  if (profileEmail) profileEmail.value = profile.email || "";
  if (profileAvatar) profileAvatar.value = profile.avatar || "";

  if (brandName) brandName.value = branding.name || "";
  if (brandColor) brandColor.value = branding.color || "#6366f1";

  if (appTheme) appTheme.value = app.theme || "auto";
  if (appMotion) appMotion.value = app.motion || "on";
}

function setupProfileButtons() {
  const saveAccountBtn = document.getElementById("saveAccount");
  const saveBrandingBtn = document.getElementById("saveBranding");
  const saveAppBtn = document.getElementById("saveAppSettings");

  if (saveAccountBtn) {
    saveAccountBtn.addEventListener("click", () => {
      const data = {
        name: document.getElementById("profileName")?.value || "",
        email: document.getElementById("profileEmail")?.value || "",
        avatar: document.getElementById("profileAvatar")?.value || ""
      };
      localStorage.setItem("sig_profile", JSON.stringify(data));
      alert("Account-Einstellungen gespeichert (lokal).");
      logEvent("settings:accountSave", data);
    });
  }

  if (saveBrandingBtn) {
    saveBrandingBtn.addEventListener("click", () => {
      const data = {
        name: document.getElementById("brandName")?.value || "",
        color: document.getElementById("brandColor")?.value || "#6366f1"
      };
      localStorage.setItem("sig_branding", JSON.stringify(data));
      alert("Branding gespeichert (lokal).");
      logEvent("settings:brandingSave", data);
    });
  }

  if (saveAppBtn) {
    saveAppBtn.addEventListener("click", () => {
      const data = {
        theme: document.getElementById("appTheme")?.value || "auto",
        motion: document.getElementById("appMotion")?.value || "on"
      };
      localStorage.setItem("sig_appSettings", JSON.stringify(data));
      alert("App-Einstellungen gespeichert (lokal).");
      logEvent("settings:appSave", data);
    });
  }
}

// ----------------------------------------------------------------------
// STATE INSPECTOR (Systemmenü)
// ----------------------------------------------------------------------

function setupStateInspector() {
  const panel = document.getElementById("stateInspector");
  const toggle = document.getElementById("inspectorToggle");
  const close = document.getElementById("inspectorClose");
  const copy = document.getElementById("inspectorCopy");
  const tabButtons = document.querySelectorAll(".inspector-tab");
  const panels = document.querySelectorAll(".inspector-panel");

  if (!panel || !toggle) return;

  function openPanel() {
    panel.classList.add("open");
    renderInspector();
  }

  function closePanel() {
    panel.classList.remove("open");
  }

  toggle.addEventListener("click", openPanel);
  if (close) close.addEventListener("click", closePanel);

  if (copy) {
    copy.addEventListener("click", () => {
      const payload = {
        state: AppState,
        kpi: AppState.kpi,
        events: EventLog
      };
      navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      alert("State & Events in die Zwischenablage kopiert.");
      logEvent("inspector:copy", {});
    });
  }

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tab = btn.dataset.tab;
      panels.forEach((p) => p.classList.remove("active"));
      const target =
        tab === "state"
          ? document.getElementById("inspectorState")
          : document.getElementById("inspectorEvents");
      if (target) target.classList.add("active");
    });
  });
}

function renderInspector() {
  const stateEl = document.getElementById("inspectorState");
  const eventsEl = document.getElementById("inspectorEvents");
  if (stateEl) {
    stateEl.textContent = JSON.stringify(
      {
        mode: AppState.mode,
        theme: AppState.theme,
        period: AppState.period,
        connections: AppState.connections,
        kpi: AppState.kpi
      },
      null,
      2
    );
  }
  if (eventsEl) {
    eventsEl.textContent = JSON.stringify(EventLog.slice(-40), null, 2);
  }
}

// ----------------------------------------------------------------------
// RENDER ALL
// ----------------------------------------------------------------------

function renderAll() {
  // Kpi immer aus den Mock-Creatives neu berechnen
  AppState.kpi = calculateGlobalKpi();

  renderDashboard();
  renderCreativesView();
  renderCampaignsView();
  renderInsightsView();
  renderSenseiView();
  renderLibraryView();
  renderReportsView();
  renderConnectionsView();
}

// ----------------------------------------------------------------------
// INIT
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initDate();
  setupThemeToggle();
  setupModeToggle();
  setupSidebar();
  setupPeriodToggles();
  setupCreativesControls();
  setupConnections();
  loadProfileSettings();
  setupProfileButtons();
  setupStateInspector();

  AppState.kpi = calculateGlobalKpi();
  renderAll();
});
