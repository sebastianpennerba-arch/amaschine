// AdStream Analytics - Professional Dashboard
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

const fmt = {
  num: (v, d = 0) => Number(v || 0).toLocaleString("de-DE", { minimumFractionDigits: d, maximumFractionDigits: d }),
  curr: (v) => Number(v || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }),
  pct: (v) => (Number(v || 0)).toFixed(2).replace(".", ",") + "%",
};

// INIT
window.addEventListener("DOMContentLoaded", () => {
  setupMockToggle();
  setupPeriodToggle();
  setupFilterButtons();
  setupMetaButton();
  setupMetaPostMessage();
  restoreMetaSession();
  initDate();
  
  if (MOCK_MODE) loadMockCreatives();
});

function setupMockToggle() {
  const liveBtn = document.getElementById("mode-live");
  const mockBtn = document.getElementById("mode-sim");
  if (!liveBtn || !mockBtn) return;

  liveBtn.addEventListener("click", () => {
    MOCK_MODE = false;
    liveBtn.classList.add("active");
    mockBtn.classList.remove("active");
    updateStatusBadge();
    if (MetaState.token) loadMetaData();
    else clearDashboard();
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
    badge.textContent = "Demo";
    badge.style.background = "#fef3c7";
    badge.style.color = "#f59e0b";
  } else if (MetaState.token) {
    badge.textContent = "Connected";
    badge.style.background = "#d1fae5";
    badge.style.color = "#10b981";
  } else {
    badge.textContent = "Offline";
    badge.style.background = "#fee2e2";
    badge.style.color = "#ef4444";
  }
}

function clearDashboard() {
  MetaState.kpi = null;
  MetaState.creatives = [];
  renderAll();
}

// MOCK DATA
function loadMockCreatives() {
  const mockFiles = [
    "Creative1.png", "Creative2.png", "Creative3.png", "Creative4.png",
    "Creative5.png", "Creative6.png", "Creative7.png", "Creative8.png",
    "Creative9.jpg", "Creative10.mp4", "Creative11.mp4", "Creative12.mp4"
  ];

  MetaState.creatives = mockFiles.map((file, i) => {
    const isVideo = file.toLowerCase().endsWith(".mp4");
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
      score: Math.round((roas / 5) * 40 + (ctr / 5) * 35 + Math.max(25 - (cpc * 20), 0))
    };
  });

  MetaState.kpi = generateMockInsights();
  renderAll();
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

// META INTEGRATION
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
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${encodeURIComponent(redirect)}&scope=${encodeURIComponent(scopes)}`;
    window.open(authUrl, "metaAuth", "width=900,height=900");
  });
}

function setupMetaPostMessage() {
  window.addEventListener("message", (event) => {
    if (!event.data?.access_token) return;
    MetaState.token = event.data.access_token;
    localStorage.setItem("meta_access_token", MetaState.token);
    updateStatusBadge();
    if (!MOCK_MODE) loadMetaData();
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  MetaState.token = token;
  updateStatusBadge();
  if (!MOCK_MODE) loadMetaData();
}

async function loadMetaData() {
  if (MOCK_MODE || !MetaState.token) return;

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
      body: JSON.stringify({ token: MetaState.token, accountId: MetaState.accountId, preset }),
    });
    const insJson = await insRes.json();
    const row = insJson.data?.[0] || null;

    if (row) MetaState.kpi = mapInsightsRow(row);

    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token, accountId: MetaState.accountId }),
    });
    const campJson = await campRes.json();
    MetaState.campaigns = campJson.data || [];
    
    if (MetaState.campaigns.length > 0) {
      MetaState.selectedCampaignId = MetaState.campaigns[0]?.id;
      await loadCreativesForCampaign(MetaState.selectedCampaignId);
    }

    renderAll();
  } catch (err) {
    console.error("Fehler:", err);
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
      const thumb = cr.thumbnail_url || cr.image_url || cr.video_url || cr?.object_story_spec?.link_data?.picture || "";
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
    console.error("Fehler:", err);
  }
}

// PERIOD TOGGLE
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const period = btn.dataset.period;
      MetaState.period = period === "30" ? "30d" : period === "7" ? "7d" : "24h";
      
      if (MOCK_MODE) loadMockCreatives();
      else if (MetaState.token) loadMetaData();
    });
  });
}

// FILTER & SORT
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

// RENDER ALL
function renderAll() {
  renderOverview();
  renderFunnel();
  renderKPIs();
  renderCreatives();
  renderTrendChart();
}

function renderOverview() {
  const grid = document.getElementById("overviewGrid");
  const KPI = MetaState.kpi;
  if (!grid) return;
  
  if (!KPI) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:#6B7280;">Keine Daten verfügbar</div>';
    return;
  }

  const cards = [
    { label: "Impressions", val: fmt.num(KPI.Impressions) },
    { label: "Clicks", val: fmt.num(KPI.Clicks) },
    { label: "Add to Cart", val: fmt.num(KPI.AddToCart) },
    { label: "Purchases", val: fmt.num(KPI.Purchases) },
    { label: "Revenue", val: fmt.curr(KPI.Revenue) },
    { label: "Spend", val: fmt.curr(KPI.Spend) },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2) },
  ];

  grid.innerHTML = cards.map(c => `
    <div class="overview-card">
      <div class="metric-label">${c.label}</div>
      <div class="metric-value">${c.val}</div>
    </div>
  `).join("");
}

function renderFunnel() {
  const el = document.getElementById("funnelSteps");
  const KPI = MetaState.kpi;
  if (!el) return;
  
  if (!KPI) {
    el.innerHTML = '<div style="color:#6B7280;">Keine Daten</div>';
    return;
  }

  const steps = [
    { label: "Impressions", value: KPI.Impressions },
    { label: "Clicks", value: KPI.Clicks },
    { label: "Add to Cart", value: KPI.AddToCart },
    { label: "Purchases", value: KPI.Purchases }
  ];

  el.innerHTML = steps.map(s => `
    <div class="funnel-step">
      <div class="metric-label">${s.label}</div>
      <div class="funnel-step-value">${fmt.num(s.value)}</div>
    </div>
  `).join("");
}

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
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
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
          backgroundColor: "#1a1a1a",
          padding: 10,
          titleFont: { size: 12 },
          bodyFont: { size: 12 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#e5e7eb" },
          ticks: { font: { size: 11 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 11 } }
        }
      }
    }
  });
}

function renderKPIs() {
  const el = document.getElementById("kpiGrid");
  const KPI = MetaState.kpi;
  if (!el) return;
  
  if (!KPI) {
    el.innerHTML = '<div style="grid-column:1/-1; color:#6B7280;">Keine Daten</div>';
    return;
  }

  const cards = [
    { label: "CTR", val: fmt.pct(KPI.CTR) },
    { label: "CPC", val: fmt.curr(KPI.CPC) },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2) },
    { label: "AOV", val: fmt.curr(KPI.AOV) },
    { label: "CR", val: fmt.pct(KPI.CR) },
  ];

  el.innerHTML = cards.map(c => `
    <div class="kpi-card">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.val}</div>
    </div>
  `).join("");
}

function renderCreatives() {
  const grid = document.getElementById("creativeGrid");
  if (!grid) return;

  let items = [...MetaState.creatives];

  if (MetaState.filter === "image") items = items.filter(c => c.mediaType === "image");
  if (MetaState.filter === "video") items = items.filter(c => c.mediaType === "video");

  items.sort((a, b) => b.ROAS - a.ROAS);

  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1; color:#6B7280;">Keine Creatives</div>';
    return;
  }

  grid.innerHTML = items.map(c => {
    const isVideo = c.mediaType === "video";
    const media = isVideo
      ? `<video class="creative-thumb" controls src="${c.URL}"></video>`
      : `<img class="creative-thumb" src="${c.URL}" alt="${c.name}" onerror="this.src='https://via.placeholder.com/220x200?text=Creative'" />`;

    const roasClass = c.ROAS >= 3 ? "kpi-green" : c.ROAS >= 1.5 ? "kpi-yellow" : "kpi-red";
    const ctrClass = c.CTR >= 2 ? "kpi-green" : c.CTR >= 1 ? "kpi-yellow" : "kpi-red";

    return `
      <div class="creative-card">
        ${media}
        <div class="creative-title">${c.name}</div>
        <div class="creative-kpis">
          <span class="kpi-badge ${roasClass}">ROAS ${fmt.num(c.ROAS, 2)}</span>
          <span class="kpi-badge ${ctrClass}">CTR ${fmt.num(c.CTR, 2)}%</span>
          <span class="kpi-badge kpi-yellow">CPC ${fmt.curr(c.CPC)}</span>
        </div>
      </div>
    `;
  }).join("");
}

// UTILITY
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

window.AdStreamAnalytics = {
  state: MetaState,
  refresh: renderAll,
  loadMock: loadMockCreatives
};
