// ======================================================================
// SIGNALONE.CLOUD - CREATIVE INTELLIGENCE PLATFORM
// ======================================================================

// GLOBAL STATE
const SignalState = {
  token: null,
  period: "24h",
  accountId: null,
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,
  creatives: [],
  filter: "all",
  sortBy: "roas",
  viewMode: "grid",
  senseiActive: false,
  senseiStrategy: null
};

let MOCK_MODE = true;
let trendChart = null;
let scoreChart = null;

// ======================================================================
// FORMATTERS
// ======================================================================
const fmt = {
  num: (v, d = 0) =>
    Number(v || 0).toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }),
  curr: (v) =>
    Number(v || 0).toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  pct: (v) => (Number(v || 0)).toFixed(2).replace(".", ",") + " %",
  short: (v) => {
    const num = Number(v || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }
};

// ======================================================================
// INITIALIZATION
// ======================================================================
window.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupSensei();
  setupMockToggle();
  setupPeriodToggles();
  setupFilterButtons();
  setupViewSwitcher();
  setupSortSelect();
  setupCollapsible();
  setupMetaButton();
  setupMetaPostMessage();
  restoreMetaSession();
  initDate();
  
  if (MOCK_MODE) {
    loadMockCreatives();
  }
  
  updateLastUpdate();
  setInterval(updateLastUpdate, 60000);
});

// ======================================================================
// SIDEBAR
// ======================================================================
function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");

  if (!sidebar || !toggle) return;

  // Desktop toggle (collapse)
  toggle.addEventListener("click", () => {
    if (window.innerWidth > 1200) {
      sidebar.classList.toggle("collapsed");
      return;
    }

    // Mobile open/close
    sidebar.classList.toggle("open");
  });

  // Close mobile on click outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth > 1200) return;
    if (!sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove("open");
    }
  });

// ===== PAGE NAVIGATION FIX =====
document.querySelectorAll(".menu-item").forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();

    const view = item.dataset.view;
    if (!view) return;

    // Navigation highlight
    document.querySelectorAll(".menu-item")
      .forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    // All pages hide
    document.querySelectorAll(".view")
      .forEach(v => v.classList.add("hidden"));

    // Target view show
    const target = document.getElementById("view-" + view);
    if (target) target.classList.remove("hidden");

    // Update page title
    const pageTitle = document.querySelector(".page-title");
    if (pageTitle) {
      pageTitle.textContent = item.querySelector(".menu-label").textContent;
    }

    // Mobile close
    const sidebar = document.getElementById("sidebar");
    if (window.innerWidth <= 1200) sidebar.classList.remove("open");
  });
});

// ======================================================================
// SIGNALSENSEI ASSISTANT
// ======================================================================
function setupSensei() {
  const panel = document.getElementById("senseiPanel");
  const toggle = document.getElementById("toggleSensei");
  const close = document.getElementById("closeSensei");
  const overlay = document.getElementById("senseiOverlay");

  if (!panel || !toggle) return;

  function openPanel() {
    panel.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    SignalState.senseiActive = true;
    analyzeSenseiStrategy();
  }

  function closePanel() {
    panel.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    SignalState.senseiActive = false;
  }

  toggle.addEventListener("click", openPanel);
  close.addEventListener("click", closePanel);
  overlay.addEventListener("click", closePanel);

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) return;
    if (!panel.classList.contains("open")) return;
    closePanel();
  });
}
  // Sensei actions
  document.querySelectorAll(".sensei-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      executeSenseiAction(action);
    });
  });
}

function analyzeSenseiStrategy() {
  const strategyEl = document.getElementById("senseiStrategy");
  const insightsEl = document.getElementById("senseiInsights");
  
  if (!SignalState.kpi || !strategyEl) return;
  
  // Analyze performance and determine strategy
  const roas = SignalState.kpi.ROAS;
  const ctr = SignalState.kpi.CTR;
  const cr = SignalState.kpi.CR;
  
  let strategy = determineStrategy(roas, ctr, cr);
  SignalState.senseiStrategy = strategy;
  
  strategyEl.innerHTML = `
    <div class="strategy-badge">${strategy.name}</div>
    <h4 style="font-size:14px; font-weight:700; margin-bottom:6px;">${strategy.title}</h4>
    <p style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${strategy.description}</p>
  `;
  
  if (insightsEl) {
    insightsEl.innerHTML = generateSenseiInsights(strategy);
  }
}

function determineStrategy(roas, ctr, cr) {
  // 6 different strategies based on performance patterns
  if (roas > 4 && ctr > 3 && cr > 4) {
    return {
      name: "Scale Master",
      title: "Aggressive Scaling Strategy",
      description: "Deine Performance ist exzellent. Jetzt ist der richtige Zeitpunkt für aggressives Scaling bei gleichzeitiger Qualitätskontrolle.",
      icon: "🚀",
      actions: ["Increase budget by 30-50%", "Test new audiences", "Expand to new placements"]
    };
  } else if (roas > 3 && roas <= 4 && ctr > 2) {
    return {
      name: "Optimizer",
      title: "Continuous Optimization Strategy",
      description: "Gute Performance mit Verbesserungspotential. Fokus auf kontinuierliche Optimierung und Testing.",
      icon: "⚡",
      actions: ["A/B test creatives", "Optimize ad schedule", "Refine targeting"]
    };
  } else if (roas > 2 && roas <= 3) {
    return {
      name: "Creative Tester",
      title: "Creative Testing Strategy",
      description: "Solide Basis, aber Creative-Performance kann verbessert werden. Mehr Testing nötig.",
      icon: "🎨",
      actions: ["Launch creative tests", "Analyze top performers", "Pause low performers"]
    };
  } else if (roas > 1.5 && roas <= 2) {
    return {
      name: "Efficiency Hunter",
      title: "Cost Efficiency Strategy",
      description: "Profitabel aber ineffizient. Fokus auf Cost-Reduktion und Conversion-Optimierung.",
      icon: "💰",
      actions: ["Reduce wasted spend", "Improve landing pages", "Tighten targeting"]
    };
  } else if (ctr < 1.5 && roas < 2) {
    return {
      name: "Attention Seeker",
      title: "Engagement Boost Strategy",
      description: "Niedrige Engagement-Rates. Kreative Elemente müssen überarbeitet werden.",
      icon: "👁️",
      actions: ["Redesign creatives", "Test new hooks", "Improve ad copy"]
    };
  } else {
    return {
      name: "Foundation Builder",
      title: "Rebuild & Test Strategy",
      description: "Performance unter Erwartungen. Zurück zu den Grundlagen und systematisches Testing.",
      icon: "🏗️",
      actions: ["Review fundamentals", "Start fresh tests", "Analyze competition"]
    };
  }
}

function generateSenseiInsights(strategy) {
  const insights = [
    `<div class="sensei-insight">
      <div class="insight-icon">${strategy.icon}</div>
      <div class="insight-content">
        <strong>Empfohlene Strategie:</strong> ${strategy.name}
      </div>
    </div>`,
    ...strategy.actions.map(action => `
      <div class="sensei-insight">
        <div class="insight-icon">✓</div>
        <div class="insight-content">${action}</div>
      </div>
    `)
  ];
  
  return insights.join("");
}

function executeSenseiAction(action) {
  console.log("Executing Sensei action:", action);
  
  const insightsEl = document.getElementById("senseiInsights");
  if (!insightsEl) return;
  
  // Simulate action execution
  insightsEl.innerHTML += `
    <div class="sensei-insight" style="background:var(--success-light); border:1px solid var(--success); margin-top:12px; padding:12px; border-radius:8px;">
      <div class="insight-content">
        <strong style="color:var(--success);">Aktion gestartet!</strong><br>
        <span style="font-size:12px;">Die Analyse läuft im Hintergrund...</span>
      </div>
    </div>
  `;
}

// ======================================================================
// MOCK MODE TOGGLE
// ======================================================================
function setupMockToggle() {
  const liveBtn = document.getElementById("mode-live");
  const mockBtn = document.getElementById("mode-sim");

  if (!liveBtn || !mockBtn) return;

  liveBtn.addEventListener("click", () => {
    MOCK_MODE = false;
    liveBtn.classList.add("active");
    mockBtn.classList.remove("active");
    
    if (SignalState.token) {
      loadMetaData();
    } else {
      clearDashboard();
    }
  });

  mockBtn.addEventListener("click", () => {
    MOCK_MODE = true;
    mockBtn.classList.add("active");
    liveBtn.classList.remove("active");
    
    loadMockCreatives();
  });
}

function clearDashboard() {
  SignalState.kpi = null;
  SignalState.creatives = [];
  renderAll();
}

// ======================================================================
// MOCK DATA LOADER
// ======================================================================
async function loadMockCreatives() {
  const mockFiles = [
    "Creative1.png",
    "Creative10.mp4",
    "Creative11.mp4",
    "Creative12.mp4",
    "Creative2.png",
    "Creative3.png",
    "Creative4.png",
    "Creative5.png",
    "Creative6.png",
    "Creative7.png",
    "Creative8.png",
    "Creative9.jpg"
  ];

  SignalState.creatives = mockFiles.map((file, i) => {
    const lower = file.toLowerCase();
    const isVideo = lower.endsWith(".mp4");
    const roas = +(Math.random() * 4 + 1).toFixed(2);
    const ctr = +(Math.random() * 3 + 0.5).toFixed(2);
    const cpc = +(Math.random() * 0.50 + 0.20).toFixed(2);
    const impressions = Math.floor(Math.random() * 10000 + 2000);

    return {
      id: "mock_" + i,
      name: file.replace(/\.[^.]+$/, "").replace(/Creative(\d+)/, "Creative #$1"),
      URL: "/mock/" + file,
      mediaType: isVideo ? "video" : "image",
      CTR: ctr,
      CPC: cpc,
      ROAS: roas,
      impressions: impressions,
      spend: +(impressions * cpc / 100).toFixed(2),
      revenue: +(impressions * cpc / 100 * roas).toFixed(2),
      score: calculateCreativeScore(roas, ctr, cpc),
      platform: "meta"
    };
  });

  SignalState.kpi = generateMockInsights();
  renderAll();
}

function calculateCreativeScore(roas, ctr, cpc) {
  const roasScore = Math.min((roas / 5) * 40, 40);
  const ctrScore = Math.min((ctr / 5) * 35, 35);
  const cpcScore = Math.max(25 - (cpc * 20), 0);
  return Math.round(roasScore + ctrScore + cpcScore);
}

function generateMockInsights() {
  const impressions = Math.floor(Math.random() * 80000 + 20000);
  const clicks = Math.floor(impressions * (Math.random() * 0.04 + 0.01));
  const purchases = Math.floor(clicks * (Math.random() * 0.05 + 0.02));
  const spend = +(Math.random() * 800 + 200).toFixed(2);
  const revenue = +(purchases * (Math.random() * 50 + 40)).toFixed(2);

  return {
    Impressions: impressions,
    Clicks: clicks,
    AddToCart: Math.floor(clicks * (Math.random() * 0.4 + 0.2)),
    Purchases: purchases,
    Revenue: revenue,
    Spend: spend,
    ROAS: revenue / spend,
    CTR: clicks / impressions * 100,
    CPC: spend / clicks,
    AOV: purchases ? revenue / purchases : 0,
    CR: purchases / clicks * 100,
  };
}

// ======================================================================
// META INTEGRATION
// ======================================================================
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    if (MOCK_MODE) {
      alert("Im Demo Mode ist Meta Login deaktiviert. Wechsle zu 'Live' Mode.");
      return;
    }

    const appId = "732040642590155";
    const redirect = "https://amaschine.vercel.app/meta-popup.html";
    const scopes = "ads_management,ads_read,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    window.open(authUrl, "metaAuth", "width=900,height=900");
  });
}

function setupMetaPostMessage() {
  window.addEventListener("message", (event) => {
    if (!event.data?.access_token) return;

    SignalState.token = event.data.access_token;
    localStorage.setItem("meta_access_token", SignalState.token);

    if (!MOCK_MODE) {
      loadMetaData();
    }
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  
  SignalState.token = token;
  
  if (!MOCK_MODE) {
    loadMetaData();
  }
}

async function loadMetaData() {
  if (MOCK_MODE || !SignalState.token) return;

  try {
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: SignalState.token }),
    });
    const accJson = await accRes.json();
    const accounts = accJson.data || [];

    if (!accounts.length) return;

    SignalState.accountId = accounts[0].account_id;

    const preset = SignalState.period === "7d" ? "last_7d" : "yesterday";
    const insRes = await fetch("/api/meta-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: SignalState.token,
        accountId: SignalState.accountId,
        preset,
      }),
    });
    const insJson = await insRes.json();
    const row = insJson.data?.[0] || null;

    if (row) {
      SignalState.kpi = mapInsightsRow(row);
    }

    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: SignalState.token,
        accountId: SignalState.accountId,
      }),
    });

    const campJson = await campRes.json();
    SignalState.campaigns = campJson.data || [];
    
    if (SignalState.campaigns.length > 0) {
      SignalState.selectedCampaignId = SignalState.campaigns[0]?.id;
      await loadCreativesForCampaign(SignalState.selectedCampaignId);
    }

    renderAll();
  } catch (err) {
    console.error("Fehler beim Laden der Meta-Daten:", err);
  }
}

function mapInsightsRow(row) {
  const imp = +row.impressions || 0;
  const clicks = +row.clicks || 0;
  const spend = +row.spend || 0;
  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);

  let purchases = 0, revenue = 0;

  if (Array.isArray(row.actions)) {
    const p = row.actions.find((a) => a.action_type?.includes("purchase"));
    if (p) purchases = +p.value || 0;
  }
  if (Array.isArray(row.action_values)) {
    const v = row.action_values.find((a) => a.action_type?.includes("purchase"));
    if (v) revenue = +v.value || 0;
  }

  return {
    Impressions: imp,
    Clicks: clicks,
    AddToCart: 0,
    Purchases: purchases,
    Revenue: revenue,
    Spend: spend,
    ROAS: spend > 0 ? revenue / spend : 0,
    CTR: ctr,
    CPC: cpc,
    AOV: purchases ? revenue / purchases : 0,
    CR: clicks ? (purchases / clicks) * 100 : 0,
  };
}

async function loadCreativesForCampaign(campaignId) {
  if (!campaignId) return;
  
  try {
    const adsRes = await fetch("/api/meta-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: SignalState.token, campaignId }),
    });
    const adsJson = await adsRes.json();
    const ads = adsJson.data || [];

    SignalState.creatives = ads.map((ad) => {
      const cr = ad.creative || {};
      const thumb =
        cr.thumbnail_url ||
        cr.image_url ||
        cr.video_url ||
        cr?.object_story_spec?.link_data?.picture ||
        "";

      const isVideo = thumb.toLowerCase().includes(".mp4");

      return {
        id: ad.id,
        name: ad.name || "Creative",
        URL: thumb,
        mediaType: isVideo ? "video" : "image",
        CTR: SignalState.kpi?.CTR || 0,
        CPC: SignalState.kpi?.CPC || 0,
        ROAS: SignalState.kpi?.ROAS || 0,
        impressions: SignalState.kpi?.Impressions || 0,
        score: 75,
        platform: "meta"
      };
    });
  } catch (err) {
    console.error("Fehler beim Laden der Creatives:", err);
  }
}

// ======================================================================
// PERIOD TOGGLE
// ======================================================================
function setupPeriodToggles() {
  const btns = document.querySelectorAll(".toggle-btn[data-period]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const period = btn.dataset.period;
      if (period === "30") {
        SignalState.period = "30d";
      } else if (period === "7") {
        SignalState.period = "7d";
      } else {
        SignalState.period = "24h";
      }
      
      if (MOCK_MODE) {
        loadMockCreatives();
      } else if (SignalState.token) {
        loadMetaData();
      }
    });
  });
}

// ======================================================================
// FILTERS & SORTING
// ======================================================================
function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-chip[data-filter]");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      SignalState.filter = b.dataset.filter;
      renderCreatives();
    });
  });
}

function setupSortSelect() {
  const select = document.getElementById("sortCreatives");
  if (!select) return;
  
  select.addEventListener("change", (e) => {
    SignalState.sortBy = e.target.value;
    renderCreatives();
  });
}

function setupViewSwitcher() {
  const btns = document.querySelectorAll(".view-btn[data-view]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      SignalState.viewMode = btn.dataset.view;
      renderCreatives();
    });
  });
}

// ======================================================================
// COLLAPSIBLE SECTIONS
// ======================================================================
function setupCollapsible() {
  document.querySelectorAll(".collapse-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const section = toggle.closest(".section.collapsible");
      if (section) {
        section.classList.toggle("collapsed");
      }
    });
  });
}

// ======================================================================
// RENDER ALL
// ======================================================================
function renderAll() {
  renderOverview();
  renderFunnel();
  renderKPIs();
  renderCreatives();
  renderPerformanceScore();
  renderTrendChart();
  renderHeatmap();
  renderWinnerLoser();
  updateCreativeCounts();
  updateQuickMetrics();
  
  if (SignalState.senseiActive) {
    analyzeSenseiStrategy();
  }
}

// ======================================================================
// PERFORMANCE SCORE
// ======================================================================
function renderPerformanceScore() {
  const KPI = SignalState.kpi;
  if (!KPI) return;

  const roasScore = Math.min((KPI.ROAS / 5) * 100, 100);
  const ctrScore = Math.min((KPI.CTR / 5) * 100, 100);
  const crScore = Math.min((KPI.CR / 8) * 100, 100);
  const avgScore = Math.round((roasScore + ctrScore + crScore) / 3);

  const scoreEl = document.getElementById("performanceScore");
  if (scoreEl) scoreEl.textContent = avgScore;

  const canvas = document.getElementById("scoreChart");
  if (!canvas) return;

  if (scoreChart) scoreChart.destroy();

  const ctx = canvas.getContext("2d");
  scoreChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [avgScore, 100 - avgScore],
        backgroundColor: ["#2563eb", "#E5E7EB"],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: false,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

function updateQuickMetrics() {
  const KPI = SignalState.kpi;
  if (!KPI) return;

  const updates = [
    { id: "quickCR", value: fmt.pct(KPI.CR) },
    { id: "quickROAS", value: fmt.num(KPI.ROAS, 1) + "x" },
    { id: "quickCTR", value: fmt.pct(KPI.CTR) },
    { id: "quickRevenue", value: fmt.curr(KPI.Revenue) }
  ];

  updates.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// ======================================================================
// OVERVIEW GRID
// ======================================================================
function renderOverview() {
  const grid = document.getElementById("overviewGrid");
  const KPI = SignalState.kpi;
  if (!grid) return;
  
  if (!KPI) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-light);">Keine Daten verfügbar</div>';
    return;
  }

  const cards = [
    { label: "Impressions", val: fmt.short(KPI.Impressions), icon: "👁️" },
    { label: "Clicks", val: fmt.short(KPI.Clicks), icon: "🖱️" },
    { label: "Add to Cart", val: fmt.num(KPI.AddToCart), icon: "🛒" },
    { label: "Purchases", val: fmt.num(KPI.Purchases), icon: "✅" },
    { label: "Revenue", val: fmt.curr(KPI.Revenue), icon: "💰" },
    { label: "Spend", val: fmt.curr(KPI.Spend), icon: "💸" },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2), icon: "📈" },
  ];

  grid.innerHTML = cards
    .map(c => `
      <div class="overview-card">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:6px;">
          <div class="metric-label">${c.label}</div>
          <span style="font-size:16px;">${c.icon}</span>
        </div>
        <div class="metric-value">${c.val}</div>
      </div>
    `)
    .join("");
}

// ======================================================================
// FUNNEL
// ======================================================================
function renderFunnel() {
  const el = document.getElementById("funnelSteps");
  const KPI = SignalState.kpi;
  if (!el) return;
  
  if (!KPI) {
    el.innerHTML = '<div style="color:var(--text-light);">Keine Daten verfügbar</div>';
    return;
  }

  const crEl = document.getElementById("totalCR");
  if (crEl) crEl.textContent = fmt.pct(KPI.CR);

  const steps = [
    { label: "Impressions", value: KPI.Impressions, pct: 100 },
    { label: "Clicks", value: KPI.Clicks, pct: (KPI.Clicks / KPI.Impressions * 100).toFixed(1) },
    { label: "Add to Cart", value: KPI.AddToCart, pct: KPI.Clicks ? (KPI.AddToCart / KPI.Clicks * 100).toFixed(1) : 0 },
    { label: "Purchases", value: KPI.Purchases, pct: KPI.Clicks ? (KPI.Purchases / KPI.Clicks * 100).toFixed(1) : 0 }
  ];

  el.innerHTML = steps.map(s => `
    <div class="funnel-step">
      <div class="metric-label">${s.label}</div>
      <div class="funnel-step-value">${fmt.short(s.value)}</div>
      <div style="font-size:11px; opacity:0.85; margin-top:4px;">${s.pct}%</div>
    </div>
  `).join("");
}

// ======================================================================
// TREND CHART
// ======================================================================
function renderTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const data = Array.from({ length: 7 }, () => +(Math.random() * 3 + 2).toFixed(2));

  if (trendChart) trendChart.destroy();

  const ctx = canvas.getContext("2d");

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "ROAS",
        data,
        borderColor: "#2563eb",
        backgroundColor: "transparent",
        tension: 0.4,
        fill: false,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#2563eb",
        pointBorderWidth: 0,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#111827",
          padding: 10,
          cornerRadius: 8,
          titleFont: { size: 12, weight: "600" },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#E5E7EB" },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });

  setupChartFilters();
}

function setupChartFilters() {
  const btns = document.querySelectorAll(".chart-filter");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // Update chart data based on metric
    });
  });
}

// ======================================================================
// KPIs
// ======================================================================
function renderKPIs() {
  const el = document.getElementById("kpiGrid");
  const KPI = SignalState.kpi;
  if (!el) return;
  
  if (!KPI) {
    el.innerHTML = '<div style="grid-column:1/-1; color:var(--text-light);">Keine Daten verfügbar</div>';
    return;
  }

  const benchmarks = {
    CTR: 2.5,
    CPC: 0.80,
    ROAS: 3.0,
    AOV: 65,
    CR: 3.5
  };

  const cards = [
    { label: "CTR", val: fmt.pct(KPI.CTR), bench: benchmarks.CTR },
    { label: "CPC", val: fmt.curr(KPI.CPC), bench: benchmarks.CPC },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2), bench: benchmarks.ROAS },
    { label: "AOV", val: fmt.curr(KPI.AOV), bench: benchmarks.AOV },
    { label: "CR", val: fmt.pct(KPI.CR), bench: benchmarks.CR }
  ];

  el.className = "kpi-grid-enhanced";
  el.innerHTML = cards
    .map(c => {
      const current = parseFloat(c.val.replace(/[^0-9,.-]/g, "").replace(",", "."));
      const diff = ((current - c.bench) / c.bench * 100).toFixed(1);
      const isPositive = diff > 0;
      const barWidth = Math.min((current / c.bench) * 100, 100);

      return `
        <div class="kpi-card-enhanced">
          <div class="kpi-header">
            <div class="kpi-label">${c.label}</div>
            <div class="kpi-trend ${isPositive ? 'positive' : 'negative'}">
              ${isPositive ? '↗' : '↘'} ${Math.abs(diff)}%
            </div>
          </div>
          <div class="kpi-value">${c.val}</div>
          <div class="kpi-comparison">
            Benchmark: ${
              typeof c.bench === 'number' && c.label !== 'AOV' && c.label !== 'CPC'
                ? fmt.num(c.bench, 2) + (c.label === 'ROAS' ? '' : '%')
                : fmt.curr(c.bench)
            }
          </div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ======================================================================
// HEATMAP
// ======================================================================
function renderHeatmap() {
  const container = document.getElementById("heatmapContainer");
  if (!container) return;

  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const hours = ["0-6", "6-12", "12-18", "18-24"];

  const data = hours.map(() =>
    days.map(() => Math.random())
  );

  let html = '<div class="heatmap-label"></div>';
  days.forEach(day => {
    html += `<div class="heatmap-label">${day}</div>`;
  });

  hours.forEach((hour, i) => {
    html += `<div class="heatmap-label">${hour}h</div>`;
    days.forEach((_, j) => {
      const value = data[i][j];
      const intensity = value;
      const color = `rgba(37, 99, 235, ${0.15 + intensity * 0.75})`;
      const textColor = intensity > 0.5 ? "#fff" : "#111827";
      
      html += `
        <div class="heatmap-cell" 
             style="background: ${color}; color: ${textColor};" 
             title="${hour}h ${days[j]}: ${(value * 100).toFixed(0)}%">
          ${(value * 100).toFixed(0)}
        </div>
      `;
    });
  });

  container.innerHTML = html;
}

// ======================================================================
// CREATIVES - ENHANCED RENDERING
// ======================================================================
function renderCreatives() {
  const grid = document.getElementById("creativeGrid");
  if (!grid) return;

  let items = [...SignalState.creatives];

  // Apply filters
  if (SignalState.filter === "image") items = items.filter(c => c.mediaType === "image");
  if (SignalState.filter === "video") items = items.filter(c => c.mediaType === "video");
  if (SignalState.filter === "winner") items = items.filter(c => c.ROAS >= 3.5);
  if (SignalState.filter === "attention") items = items.filter(c => c.ROAS < 2);

  // Apply sorting
  items.sort((a, b) => {
    switch(SignalState.sortBy) {
      case "roas": return b.ROAS - a.ROAS;
      case "ctr": return b.CTR - a.CTR;
      case "cpc": return a.CPC - b.CPC;
      case "impressions": return b.impressions - a.impressions;
      case "score": return b.score - a.score;
      default: return 0;
    }
  });

  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-light); text-align:center; padding:40px;">Keine Creatives gefunden.</div>';
    return;
  }

  // Update grid class based on view mode
  if (SignalState.viewMode === "list") {
    grid.className = "creative-list-view";
  } else {
    grid.className = "creative-grid-enhanced";
  }

  grid.innerHTML = items
    .map(c => {
      const isVideo = c.mediaType === "video";
      const roasClass = c.ROAS >= 3.5 ? "success" : c.ROAS >= 2 ? "warning" : "danger";
      const ctrClass = c.CTR >= 2.5 ? "success" : c.CTR >= 1.5 ? "warning" : "danger";

      return `
        <div class="creative-card-enhanced" data-creative-id="${c.id}">
          <div class="creative-media-container">
            ${isVideo 
              ? `<video class="creative-thumb" src="${c.URL}" muted loop onmouseover="this.play()" onmouseout="this.pause()"></video>`
              : `<img class="creative-thumb" src="${c.URL}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/400x400?text=Creative'" />`
            }
            <div class="creative-platform-badge">
              <span class="platform-icon meta-icon" style="color:#0084ff;">f</span>
            </div>
            <div class="creative-score-badge">${c.score}/100</div>
          </div>
          
          <div class="creative-card-body">
            <div class="creative-title">${c.name}</div>
            
            <div class="creative-metrics-grid">
              <div class="metric-item ${roasClass}">
                <div class="metric-label-sm">ROAS</div>
                <div class="metric-value-sm">${fmt.num(c.ROAS, 2)}x</div>
              </div>
              <div class="metric-item ${ctrClass}">
                <div class="metric-label-sm">CTR</div>
                <div class="metric-value-sm">${fmt.num(c.CTR, 2)}%</div>
              </div>
              <div class="metric-item">
                <div class="metric-label-sm">CPC</div>
                <div class="metric-value-sm">${fmt.curr(c.CPC)}</div>
              </div>
              <div class="metric-item">
                <div class="metric-label-sm">Spend</div>
                <div class="metric-value-sm">${fmt.curr(c.spend || 0)}</div>
              </div>
            </div>
            
            <div class="creative-footer">
              <div class="creative-impressions">
                <span>👁️</span>
                <span>${fmt.short(c.impressions)}</span>
              </div>
              <div class="creative-actions">
                <button class="action-btn-sm" title="Details" onclick="showCreativeDetails('${c.id}')">
                  ℹ️
                </button>
                <button class="action-btn-sm" title="Analyze" onclick="analyzeCreative('${c.id}')">
                  🔍
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function showCreativeDetails(creativeId) {
  const creative = SignalState.creatives.find(c => c.id === creativeId);
  if (!creative) return;
  
  console.log("Show details for:", creative);
  alert(`Creative Details:\n\n${creative.name}\nROAS: ${creative.ROAS.toFixed(2)}x\nCTR: ${creative.CTR.toFixed(2)}%\nScore: ${creative.score}/100`);
}

function analyzeCreative(creativeId) {
  const creative = SignalState.creatives.find(c => c.id === creativeId);
  if (!creative) return;
  
  // Open Sensei panel with analysis
  const panel = document.getElementById("senseiPanel");
  if (panel) {
    panel.classList.add("open");
    
    const insightsEl = document.getElementById("senseiInsights");
    if (insightsEl) {
      insightsEl.innerHTML = `
        <div class="sensei-insight" style="background:var(--primary)15; border:1px solid var(--primary); padding:14px; border-radius:10px;">
          <div class="insight-content">
            <strong style="color:var(--primary);">Creative Analyse: ${creative.name}</strong><br><br>
            <strong>Performance-Score:</strong> ${creative.score}/100<br>
            <strong>ROAS:</strong> ${creative.ROAS.toFixed(2)}x ${creative.ROAS >= 3 ? '✅ Exzellent' : creative.ROAS >= 2 ? '⚠️ Gut' : '❌ Verbesserung nötig'}<br>
            <strong>CTR:</strong> ${creative.CTR.toFixed(2)}% ${creative.CTR >= 2.5 ? '✅ Stark' : '⚠️ Schwach'}<br><br>
            <strong style="color:var(--success);">Empfehlung:</strong><br>
            ${creative.ROAS >= 3 
              ? '🚀 Scaling-Kandidat! Budget um 30-50% erhöhen.' 
              : creative.ROAS >= 2 
                ? '⚡ Optimieren und weiter testen.' 
                : '⚠️ Pausieren oder komplett überarbeiten.'}
          </div>
        </div>
      `;
    }
  }
}

function updateCreativeCounts() {
  const all = SignalState.creatives.length;
  const images = SignalState.creatives.filter(c => c.mediaType === "image").length;
  const videos = SignalState.creatives.filter(c => c.mediaType === "video").length;

  const updates = [
    { id: "countAll", value: all },
    { id: "countImages", value: images },
    { id: "countVideos", value: videos },
    { id: "creativeCount", value: all }
  ];

  updates.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
  
  // Update summary metrics
  if (SignalState.creatives.length > 0) {
    const avgROAS = SignalState.creatives.reduce((sum, c) => sum + c.ROAS, 0) / SignalState.creatives.length;
    const avgCTR = SignalState.creatives.reduce((sum, c) => sum + c.CTR, 0) / SignalState.creatives.length;
    const totalSpend = SignalState.creatives.reduce((sum, c) => sum + (c.spend || 0), 0);
    const topCreative = [...SignalState.creatives].sort((a, b) => b.ROAS - a.ROAS)[0];
    
    const avgROASEl = document.getElementById("avgROAS");
    const avgCTREl = document.getElementById("avgCTR");
    const totalSpendEl = document.getElementById("totalSpend");
    const topCreativeEl = document.getElementById("topCreative");
    
    if (avgROASEl) avgROASEl.textContent = fmt.num(avgROAS, 1) + "x";
    if (avgCTREl) avgCTREl.textContent = fmt.num(avgCTR, 1) + "%";
    if (totalSpendEl) totalSpendEl.textContent = fmt.curr(totalSpend);
    if (topCreativeEl) topCreativeEl.textContent = topCreative.name;
  }
}

// ======================================================================
// WINNER / LOSER
// ======================================================================
function renderWinnerLoser() {
  if (!SignalState.creatives.length) return;

  const sorted = [...SignalState.creatives].sort((a, b) => b.ROAS - a.ROAS);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];

  const winnerEl = document.getElementById("winnerContent");
  const loserEl = document.getElementById("loserContent");

  if (winnerEl && winner) {
    const isVideo = winner.mediaType === "video";
    const media = isVideo
      ? `<video style="width:100%; border-radius:8px; margin-bottom:12px;" controls src="${winner.URL}"></video>`
      : `<img style="width:100%; border-radius:8px; margin-bottom:12px;" src="${winner.URL}" alt="${winner.name}" />`;

    winnerEl.innerHTML = `
      ${media}
      <h3 style="font-size:15px; margin-bottom:10px; font-weight:700;">${winner.name}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div style="background:var(--success-light); padding:10px; border-radius:8px;">
          <div style="font-size:10px; color:var(--success); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">ROAS</div>
          <div style="font-size:20px; font-weight:800; color:var(--success);">${fmt.num(winner.ROAS, 2)}</div>
        </div>
        <div style="background:var(--bg-alt); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-size:10px; color:var(--text-light); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">CTR</div>
          <div style="font-size:20px; font-weight:800;">${fmt.num(winner.CTR, 2)}%</div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
        🚀 Starker ROAS & CTR. Empfehlung: Budget schrittweise um <strong>+30-50%</strong> erhöhen und ähnliche Creatives testen.
      </div>
    `;
  }

  if (loserEl && loser) {
    const isVideo = loser.mediaType === "video";
    const media = isVideo
      ? `<video style="width:100%; border-radius:8px; margin-bottom:12px;" controls src="${loser.URL}"></video>`
      : `<img style="width:100%; border-radius:8px; margin-bottom:12px;" src="${loser.URL}" alt="${loser.name}" />`;

    loserEl.innerHTML = `
      ${media}
      <h3 style="font-size:15px; margin-bottom:10px; font-weight:700;">${loser.name}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:12px;">
        <div style="background:var(--danger-light); padding:10px; border-radius:8px;">
          <div style="font-size:10px; color:var(--danger); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">ROAS</div>
          <div style="font-size:20px; font-weight:800; color:var(--danger);">${fmt.num(loser.ROAS, 2)}</div>
        </div>
        <div style="background:var(--bg-alt); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-size:10px; color:var(--text-light); font-weight:700; text-transform:uppercase; letter-spacing:0.5px;">CPC</div>
          <div style="font-size:20px; font-weight:800;">${fmt.curr(loser.CPC)}</div>
        </div>
      </div>
      <div style="font-size:12px; color:var(--text-secondary); line-height:1.6;">
        ⚠️ Schwacher ROAS. Empfehlung: Creative pausieren oder komplett neuen Ansatz mit anderem Hook/Visual testen.
      </div>
    `;
  }
}

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================
function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  el.textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(now);
}

function updateLastUpdate() {
  const el = document.getElementById("lastUpdate");
  if (!el) return;
  
  const now = new Date();
  const minutes = now.getMinutes();
  const timeAgo = minutes % 10;
  
  el.textContent = `● vor ${timeAgo === 0 ? 'wenigen Sek.' : timeAgo + ' Min.'}`;
}

// ======================================================================
// EXPORT FUNCTIONALITY
// ======================================================================
function setupExportButton() {
  const btn = document.getElementById("exportCreatives");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    const data = {
      timestamp: new Date().toISOString(),
      period: SignalState.period,
      kpi: SignalState.kpi,
      creatives: SignalState.creatives,
      strategy: SignalState.senseiStrategy
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signalone-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// Setup export on load
window.addEventListener("DOMContentLoaded", () => {
  setupExportButton();
});

// ======================================================================
// RECOMMENDATION REFRESH
// ======================================================================
function setupRecommendationRefresh() {
  const btn = document.getElementById("refreshRecommendations");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    // Simulate new recommendations
    btn.innerHTML = '<span>⏳</span> Lade...';
    btn.disabled = true;
    
    setTimeout(() => {
      btn.innerHTML = '<span>🔄</span> Aktualisieren';
      btn.disabled = false;
      
      // Could regenerate recommendations here
      alert("Neue Empfehlungen werden basierend auf aktuellen Daten generiert...");
    }, 1500);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  setupRecommendationRefresh();
});

// ======================================================================
// GLOBAL EXPORT
// ======================================================================
window.SignalOne = {
  state: SignalState,
  refresh: renderAll,
  loadMock: loadMockCreatives,
  analyze: analyzeSenseiStrategy
};



