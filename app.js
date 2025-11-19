// ======================================================
// AdStream Analytics – PREMIUM VERSION
// ======================================================

// GLOBAL STATE
const MetaState = {
  token: null,
  period: "24h",
  accountId: null,
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,
  creatives: [],
  filter: "all",
  sortBy: "roas"
};

let MOCK_MODE = true;
let trendChart = null;
let scoreChart = null;

// --------------------------------------------------------------------
// FORMATTER
// --------------------------------------------------------------------
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
};

// --------------------------------------------------------------------
// INIT
// --------------------------------------------------------------------
window.addEventListener("DOMContentLoaded", () => {
  setupMockToggle();
  setupPeriodToggle();
  setupFilterButtons();
  setupMetaButton();
  setupMetaPostMessage();
  restoreMetaSession();
  initDate();
  setupAIInsights();
  setupSortSelect();
  
  if (MOCK_MODE) {
    loadMockCreatives();
  }
  
  updateLastUpdate();
  setInterval(updateLastUpdate, 60000);
});

// --------------------------------------------------------------------
// MOCK TOGGLE
// --------------------------------------------------------------------
function setupMockToggle() {
  const liveBtn = document.getElementById("mode-live");
  const mockBtn = document.getElementById("mode-sim");

  if (!liveBtn || !mockBtn) return;

  liveBtn.addEventListener("click", () => {
    MOCK_MODE = false;
    liveBtn.classList.add("active");
    mockBtn.classList.remove("active");
    
    updateStatusBadge();
    
    if (MetaState.token) {
      loadMetaData();
    } else {
      clearDashboard();
    }
  });

  mockBtn.addEventListener("click", () => {
    MOCK_MODE = true;
    mockBtn.classList.add("active");
    liveBtn.classList.remove("active");
    
    updateStatusBadge();
    loadMockCreatives();
  });
}

function updateStatusBadge() {
  const badge = document.getElementById("metaStatus");
  if (!badge) return;
  
  if (MOCK_MODE) {
    badge.textContent = "Demo Mode";
    badge.style.background = "var(--warning-light)";
    badge.style.color = "var(--warning)";
  } else if (MetaState.token) {
    badge.textContent = "Live Connected";
    badge.style.background = "var(--success-light)";
    badge.style.color = "var(--success)";
  } else {
    badge.textContent = "Not Connected";
    badge.style.background = "var(--danger-light)";
    badge.style.color = "var(--danger)";
  }
}

function clearDashboard() {
  MetaState.kpi = null;
  MetaState.creatives = [];
  renderAll();
}

// --------------------------------------------------------------------
// MOCK LOADER
// --------------------------------------------------------------------
async function loadMockCreatives() {
  console.log("🎭 Mock Mode → Lade Demo-Daten");

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

  MetaState.creatives = mockFiles.map((file, i) => {
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
      score: calculateCreativeScore(roas, ctr, cpc)
    };
  });

  MetaState.kpi = generateMockInsights();
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

// --------------------------------------------------------------------
// META INTEGRATION
// --------------------------------------------------------------------
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

    MetaState.token = event.data.access_token;
    localStorage.setItem("meta_access_token", MetaState.token);

    updateStatusBadge();

    if (!MOCK_MODE) {
      loadMetaData();
    }
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  
  MetaState.token = token;
  updateStatusBadge();
  
  if (!MOCK_MODE) {
    loadMetaData();
  }
}

async function loadMetaData() {
  if (MOCK_MODE || !MetaState.token) return;

  console.log("📡 Lade echte Meta-Daten…");

  try {
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token }),
    });
    const accJson = await accRes.json();
    const accounts = accJson.data || [];

    if (!accounts.length) return;

    MetaState.accountId = accounts[0].account_id;

    const preset = MetaState.period === "7d" ? "last_7d" : "yesterday";
    const insRes = await fetch("/api/meta-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        accountId: MetaState.accountId,
        preset,
      }),
    });
    const insJson = await insRes.json();
    const row = insJson.data?.[0] || null;

    if (row) {
      MetaState.kpi = mapInsightsRow(row);
    }

    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        accountId: MetaState.accountId,
      }),
    });

    const campJson = await campRes.json();
    MetaState.campaigns = campJson.data || [];
    
    if (MetaState.campaigns.length > 0) {
      MetaState.selectedCampaignId = MetaState.campaigns[0]?.id;
      await loadCreativesForCampaign(MetaState.selectedCampaignId);
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
      body: JSON.stringify({ token: MetaState.token, campaignId }),
    });
    const adsJson = await adsRes.json();
    const ads = adsJson.data || [];

    MetaState.creatives = ads.map((ad) => {
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
        CTR: MetaState.kpi?.CTR || 0,
        CPC: MetaState.kpi?.CPC || 0,
        ROAS: MetaState.kpi?.ROAS || 0,
        impressions: MetaState.kpi?.Impressions || 0,
        score: 75
      };
    });
  } catch (err) {
    console.error("Fehler beim Laden der Creatives:", err);
  }
}

// --------------------------------------------------------------------
// PERIOD TOGGLE
// --------------------------------------------------------------------
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const period = btn.dataset.period;
      if (period === "30") {
        MetaState.period = "30d";
      } else if (period === "7") {
        MetaState.period = "7d";
      } else {
        MetaState.period = "24h";
      }
      
      if (MOCK_MODE) {
        loadMockCreatives();
      } else if (MetaState.token) {
        loadMetaData();
      }
    });
  });
}

// --------------------------------------------------------------------
// FILTER & SORT
// --------------------------------------------------------------------
function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      MetaState.filter = b.dataset.filter;
      renderCreatives();
    });
  });
}

function setupSortSelect() {
  const select = document.getElementById("sortCreatives");
  if (!select) return;
  
  select.addEventListener("change", (e) => {
    MetaState.sortBy = e.target.value;
    renderCreatives();
  });
}

// --------------------------------------------------------------------
// RENDER ALL
// --------------------------------------------------------------------
function renderAll() {
  renderOverview();
  renderFunnel();
  renderKPIs();
  renderCreatives();
  renderPerformanceScore();
  renderQuickMetrics();
  renderTrendChart();
  renderHeatmap();
  renderWinnerLoser();
  updateCreativeCounts();
}

// --------------------------------------------------------------------
// PERFORMANCE SCORE
// --------------------------------------------------------------------
function renderPerformanceScore() {
  const KPI = MetaState.kpi;
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
        backgroundColor: ["#667eea", "#E5E7EB"],
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

// --------------------------------------------------------------------
// QUICK METRICS
// --------------------------------------------------------------------
function renderQuickMetrics() {
  const KPI = MetaState.kpi;
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

// --------------------------------------------------------------------
// OVERVIEW GRID
// --------------------------------------------------------------------
function renderOverview() {
  const grid = document.getElementById("overviewGrid");
  const KPI = MetaState.kpi;
  if (!grid) return;
  
  if (!KPI) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-light);">Keine Daten verfügbar</div>';
    return;
  }

  const cards = [
    { label: "Impressions", val: fmt.num(KPI.Impressions), icon: "👁️" },
    { label: "Clicks", val: fmt.num(KPI.Clicks), icon: "🖱️" },
    { label: "Add to Cart", val: fmt.num(KPI.AddToCart), icon: "🛒" },
    { label: "Purchases", val: fmt.num(KPI.Purchases), icon: "✅" },
    { label: "Revenue", val: fmt.curr(KPI.Revenue), icon: "💰" },
    { label: "Spend", val: fmt.curr(KPI.Spend), icon: "💸" },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2), icon: "📈" },
  ];

  grid.innerHTML = cards
    .map(c => `
      <div class="overview-card">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:8px;">
          <div class="metric-label">${c.label}</div>
          <span style="font-size:20px;">${c.icon}</span>
        </div>
        <div class="metric-value">${c.val}</div>
      </div>
    `)
    .join("");
}

// --------------------------------------------------------------------
// FUNNEL
// --------------------------------------------------------------------
function renderFunnel() {
  const el = document.getElementById("funnelSteps");
  const KPI = MetaState.kpi;
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
      <div class="funnel-step-value">${fmt.num(s.value)}</div>
      <div style="font-size:12px; opacity:0.8; margin-top:4px;">${s.pct}%</div>
    </div>
  `).join("");
}

// --------------------------------------------------------------------
// TREND CHART
// --------------------------------------------------------------------
function renderTrendChart() {
  const canvas = document.getElementById("trendChart");
  if (!canvas) return;

  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const data = Array.from({ length: 7 }, () => Math.random() * 3 + 2);

  if (trendChart) trendChart.destroy();

  const ctx = canvas.getContext("2d");
  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "ROAS",
        data: data,
        borderColor: "#667eea",
        backgroundColor: "rgba(102, 126, 234, 0.1)",
        tension: 0.4,
        fill: true,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: "#667eea",
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0A0E27",
          padding: 12,
          cornerRadius: 8,
          titleFont: { size: 14, weight: "bold" },
          bodyFont: { size: 13 }
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
    });
  });
}

// --------------------------------------------------------------------
// KPIs
// --------------------------------------------------------------------
function renderKPIs() {
  const el = document.getElementById("kpiGrid");
  const KPI = MetaState.kpi;
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
            <div class="kpi-vs">
              <span>📊</span>
              <span>Benchmark: ${typeof c.bench === 'number' && c.label !== 'AOV' && c.label !== 'CPC' ? fmt.num(c.bench, 2) + (c.label === 'ROAS' ? '' : '%') : fmt.curr(c.bench)}</span>
            </div>
          </div>
          <div class="kpi-bar">
            <div class="kpi-bar-fill" style="width: ${barWidth}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

// --------------------------------------------------------------------
// HEATMAP
// --------------------------------------------------------------------
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
      const color = `rgba(102, 126, 234, ${intensity})`;
      const textColor = intensity > 0.5 ? "#fff" : "#0A0E27";
      
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

// --------------------------------------------------------------------
// CREATIVES
// --------------------------------------------------------------------
function renderCreatives() {
  const grid = document.getElementById("creativeGrid");
  if (!grid) return;

  let items = [...MetaState.creatives];

  // Filter
  if (MetaState.filter === "image") items = items.filter(c => c.mediaType === "image");
  if (MetaState.filter === "video") items = items.filter(c => c.mediaType === "video");

  // Sort
  items.sort((a, b) => {
    switch(MetaState.sortBy) {
      case "roas": return b.ROAS - a.ROAS;
      case "ctr": return b.CTR - a.CTR;
      case "cpc": return a.CPC - b.CPC;
      case "impressions": return b.impressions - a.impressions;
      default: return 0;
    }
  });

  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:var(--text-light);">Keine Creatives gefunden.</div>';
    return;
  }

  grid.innerHTML = items
    .map(c => {
      const isVideo = c.mediaType === "video";
      const media = isVideo
        ? `<video class="creative-thumb" controls src="${c.URL}"></video>`
        : `<img class="creative-thumb" src="${c.URL}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/280x280?text=Creative'" />`;

      const roasClass = c.ROAS >= 3.5 ? "kpi-green" : c.ROAS >= 2 ? "kpi-yellow" : "kpi-red";
      const ctrClass = c.CTR >= 2.5 ? "kpi-green" : c.CTR >= 1.5 ? "kpi-yellow" : "kpi-red";

      return `
        <div class="creative-card">
          ${media}
          <div class="creative-title">${c.name}</div>
          <div class="creative-kpis">
            <span class="kpi-badge ${roasClass}">💰 ROAS ${fmt.num(c.ROAS, 2)}</span>
            <span class="kpi-badge ${ctrClass}">⚡ CTR ${fmt.num(c.CTR, 2)}%</span>
            <span class="kpi-badge kpi-yellow">€ CPC ${fmt.curr(c.CPC)}</span>
          </div>
          <div style="margin-top:12px; font-size:12px; color:var(--text-light);">
            Score: <strong>${c.score}/100</strong> | ${fmt.num(c.impressions)} Impressions
          </div>
        </div>
      `;
    })
    .join("");
}

function updateCreativeCounts() {
  const all = MetaState.creatives.length;
  const images = MetaState.creatives.filter(c => c.mediaType === "image").length;
  const videos = MetaState.creatives.filter(c => c.mediaType === "video").length;

  const updates = [
    { id: "countAll", value: all },
    { id: "countImages", value: images },
    { id: "countVideos", value: videos }
  ];

  updates.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// --------------------------------------------------------------------
// WINNER / LOSER
// --------------------------------------------------------------------
function renderWinnerLoser() {
  if (!MetaState.creatives.length) return;

  const sorted = [...MetaState.creatives].sort((a, b) => b.ROAS - a.ROAS);
  const winner = sorted[0];
  const loser = sorted[sorted.length - 1];

  const winnerEl = document.getElementById("winnerContent");
  const loserEl = document.getElementById("loserContent");

  if (winnerEl && winner) {
    const isVideo = winner.mediaType === "video";
    const media = isVideo
      ? `<video style="width:100%; border-radius:12px; margin-bottom:16px;" controls src="${winner.URL}"></video>`
      : `<img style="width:100%; border-radius:12px; margin-bottom:16px;" src="${winner.URL}" alt="${winner.name}" />`;

    winnerEl.innerHTML = `
      ${media}
      <h3 style="font-size:18px; margin-bottom:12px;">${winner.name}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
        <div style="background:var(--success-light); padding:12px; border-radius:8px;">
          <div style="font-size:11px; color:var(--success); font-weight:600;">ROAS</div>
          <div style="font-size:24px; font-weight:900; color:var(--success);">${fmt.num(winner.ROAS, 2)}</div>
        </div>
        <div style="background:var(--bg); padding:12px; border-radius:8px;">
          <div style="font-size:11px; color:var(--text-light); font-weight:600;">CTR</div>
          <div style="font-size:24px; font-weight:900;">${fmt.num(winner.CTR, 2)}%</div>
        </div>
      </div>
      <div style="font-size:13px; color:var(--text-light); line-height:1.6;">
        <strong>Performance-Analyse:</strong> Dieses Creative übertrifft den Durchschnitt um ${((winner.ROAS / (MetaState.kpi?.ROAS || 1) - 1) * 100).toFixed(0)}%. 
        Die hohe Engagement-Rate deutet auf starke visuelle Anziehungskraft hin.
      </div>
    `;
  }

  if (loserEl && loser) {
    const isVideo = loser.mediaType === "video";
    const media = isVideo
      ? `<video style="width:100%; border-radius:12px; margin-bottom:16px;" controls src="${loser.URL}"></video>`
      : `<img style="width:100%; border-radius:12px; margin-bottom:16px;" src="${loser.URL}" alt="${loser.name}" />`;

    loserEl.innerHTML = `
      ${media}
      <h3 style="font-size:18px; margin-bottom:12px;">${loser.name}</h3>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
        <div style="background:var(--danger-light); padding:12px; border-radius:8px;">
          <div style="font-size:11px; color:var(--danger); font-weight:600;">ROAS</div>
          <div style="font-size:24px; font-weight:900; color:var(--danger);">${fmt.num(loser.ROAS, 2)}</div>
        </div>
        <div style="background:var(--bg); padding:12px; border-radius:8px;">
          <div style="font-size:11px; color:var(--text-light); font-weight:600;">CPC</div>
          <div style="font-size:24px; font-weight:900;">${fmt.curr(loser.CPC)}</div>
        </div>
      </div>
      <div style="font-size:13px; color:var(--text-light); line-height:1.6;">
        <strong>Verbesserungsvorschläge:</strong> Niedriger ROAS deutet auf schwache Conversion hin. 
        Empfehlung: Creative pausieren oder A/B-Test mit neuem Hook durchführen.
      </div>
    `;
  }
}

// --------------------------------------------------------------------
// AI INSIGHTS
// --------------------------------------------------------------------
function setupAIInsights() {
  const btn = document.getElementById("generateInsights");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const textEl = document.getElementById("aiInsights");
    if (!textEl) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="sparkle">⏳</span> Generiere...';

    await new Promise(resolve => setTimeout(resolve, 1500));

    const insights = [
      "🎯 Top-Performer Creative #3 hat 67% höheren ROAS. Budget-Shift empfohlen.",
      "📊 Video-Content zeigt 34% bessere Engagement-Rate als statische Bilder.",
      "⚡ Peak-Performance zwischen 18-21 Uhr. Dayparting aktivieren für +15% Effizienz.",
      "💡 Creatives mit ROAS < 2.0 sollten pausiert werden. Potentielle Ersparnis: €180/Woche.",
      "🎬 Mobile Video Views haben 2.8x höhere Conversion-Rate als Desktop."
    ];

    const randomInsight = insights[Math.floor(Math.random() * insights.length)];
    textEl.textContent = randomInsight;

    btn.disabled = false;
    btn.innerHTML = '<span class="sparkle">✨</span> Neu generieren';
  });
}

// --------------------------------------------------------------------
// UTILITY FUNCTIONS
// --------------------------------------------------------------------
function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  el.textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(now);
}

function updateLastUpdate() {
  const el = document.getElementById("lastUpdate");
  if (!el) return;
  
  const now = new Date();
  const minutes = now.getMinutes();
  const timeAgo = minutes % 10;
  
  el.textContent = `vor ${timeAgo === 0 ? 'wenigen Sek.' : timeAgo + ' Min.'}`;
}

// Export für mögliche externe Nutzung
window.AdStreamAnalytics = {
  state: MetaState,
  refresh: renderAll,
  loadMock: loadMockCreatives
};
