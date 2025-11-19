// ======================================================
// AdStream Analytics - Meta Live + Simulated Mock Mode
// ======================================================

const MetaState = {
  token: null,
  period: "24h",
  accountId: null,
  accounts: [],
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,
  creatives: [],
  filter: "all",
};

window.mockMode = false;

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
    }),
  pct: (v) =>
    (Number(v || 0)).toFixed(2).replace(".", ",") + " %",
};

window.addEventListener("DOMContentLoaded", () => {
  initDate();
  setupPeriodToggle();
  setupFilterButtons();
  setupModeToggle();
  setupMetaButton();
  restoreMetaSession();
  updateMetaStatus();
});

function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  const f = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  el.textContent = f.format(now);
}

function showLoading(show) {
  const el = document.getElementById("loading");
  el.style.display = show ? "flex" : "none";
}

function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      MetaState.period = btn.dataset.period === "7" ? "7d" : "24h";

      if (window.mockMode) loadMockData();
      else if (MetaState.token && MetaState.accountId) loadMetaData();
    });
  });
}

function setupModeToggle() {
  const liveBtn = document.getElementById("mode-live");
  const simBtn = document.getElementById("mode-sim");

  liveBtn.addEventListener("click", () => {
    window.mockMode = false;
    liveBtn.classList.add("active");
    simBtn.classList.remove("active");
    updateMetaStatus();
    if (MetaState.token) loadMetaData();
    else clearDashboard();
  });

  simBtn.addEventListener("click", () => {
    window.mockMode = true;
    simBtn.classList.add("active");
    liveBtn.classList.remove("active");
    updateMetaStatus();
    loadMockData();
  });
}

function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (window.mockMode) {
      alert("Im Simulated Mode kein echter Meta-Login.");
      return;
    }

    const appId = "732040642590155";

    // WICHTIG: kompletter Fix – Redirect MUSS stimmen
    const redirect = "https://amaschine.vercel.app/meta-popup.html";

    const scopes = "ads_management,ads_read,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    window.open(authUrl, "metaAuth", "width=900,height=900");
  });

  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (!data.access_token) return;

    MetaState.token = data.access_token;
    localStorage.setItem("meta_access_token", data.access_token);
    window.mockMode = false;
    updateMetaStatus();
    loadMetaData();
  });
}

function updateMetaStatus() {
  const el = document.getElementById("metaStatus");

  if (window.mockMode) {
    el.textContent = "Simulated Mode aktiv";
    el.classList.remove("red");
    el.classList.add("green");
    return;
  }

  if (!MetaState.token) {
    el.textContent = "Meta nicht verbunden";
    el.classList.add("red");
    el.classList.remove("green");
  } else {
    el.textContent = "Meta verbunden";
    el.classList.remove("red");
    el.classList.add("green");
  }
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;

  MetaState.token = token;
  window.mockMode = false;
  updateMetaStatus();
  loadMetaData();
}

async function loadMetaData() {
  if (window.mockMode) return loadMockData();
  if (!MetaState.token) return;

  try {
    showLoading(true);

    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token }),
    });

    const accJson = await accRes.json();
    const accounts = accJson.data || accJson.accounts || [];
    MetaState.accounts = accounts;

    if (!accounts.length) {
      clearDashboard();
      return;
    }

    MetaState.accountId = accounts[0].account_id || accounts[0].id;

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

    if (!row) {
      MetaState.kpi = null;
      renderOverviewEmpty();
      renderFunnelEmpty();
      renderKPIsEmpty();
    } else {
      MetaState.kpi = mapInsightsRow(row);
      renderOverview();
      renderFunnel();
      renderKPIs();
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
    const campaigns = campJson.data || [];
    MetaState.campaigns = campaigns;

    if (!campaigns.length) {
      MetaState.creatives = [];
      renderCreatives();
      return;
    }

    MetaState.selectedCampaignId = campaigns[0].id;
    await loadCreativesForCampaign(MetaState.selectedCampaignId);
  } finally {
    showLoading(false);
  }
}

function mapInsightsRow(row) {
  const imp = +row.impressions || 0;
  const clicks = +row.clicks || 0;
  const spend = +row.spend || 0;

  const purchases =
    row.actions?.find((a) => a.action_type?.includes("purchase"))?.value || 0;

  const revenue =
    row.action_values?.find((a) => a.action_type?.includes("purchase"))?.value ||
    0;

  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);
  const roas =
    row.purchase_roas?.[0]?.value || (spend > 0 ? revenue / spend : 0);
  const aov = purchases > 0 ? revenue / purchases : 0;
  const cr = clicks > 0 ? (purchases / clicks) * 100 : 0;

  return {
    Impressions: imp,
    Clicks: clicks,
    AddToCart: 0,
    Purchases: +purchases,
    Revenue: +revenue,
    Spend: spend,
    ROAS: roas,
    CTR: ctr,
    CPC: cpc,
    AOV: aov,
    CR: cr,
  };
}

function loadMockData() {
  showLoading(true);

  MetaState.accounts = [{ id: "mock1", account_id: "mock1", name: "Mock Konto" }];
  MetaState.accountId = "mock1";

  MetaState.kpi = {
    Impressions: 15000,
    Clicks: 650,
    AddToCart: 200,
    Purchases: 30,
    Revenue: 900,
    Spend: 160,
    ROAS: 5.6,
    CTR: 4.2,
    CPC: 0.25,
    AOV: 30,
    CR: 3.4,
  };

  renderOverview();
  renderFunnel();
  renderKPIs();

  MetaState.creatives = [
    {
      id: "c1",
      name: "Mock Creative 1",
      mediaType: "image",
      URL: "https://placehold.co/400x600",
      CTR: 3.2,
      CPC: 0.70,
      ROAS: 4.5,
    },
  ];

  renderCreatives();
  showLoading(false);
}

async function loadCreativesForCampaign(campaignId) {
  if (window.mockMode) return loadMockData();
  if (!MetaState.token) return;

  const adsRes = await fetch("/api/meta-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: MetaState.token,
      campaignId,
    }),
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
      CTR: MetaState.kpi.CTR,
      CPC: MetaState.kpi.CPC,
      ROAS: MetaState.kpi.ROAS,
    };
  });

  renderCreatives();
}

function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      MetaState.filter = btn.dataset.filter;
      renderCreatives();
    });
  });
}

function renderOverview() {
  const KPI = MetaState.kpi;
  document.getElementById("overviewGrid").innerHTML = `
    <div class="overview-card"><div class="metric-label">Impressions</div><div class="metric-value">${fmt.num(KPI.Impressions)}</div></div>
    <div class="overview-card"><div class="metric-label">Clicks</div><div class="metric-value">${fmt.num(KPI.Clicks)}</div></div>
    <div class="overview-card"><div class="metric-label">AddToCart</div><div class="metric-value">${fmt.num(KPI.AddToCart)}</div></div>
    <div class="overview-card"><div class="metric-label">Purchases</div><div class="metric-value">${fmt.num(KPI.Purchases)}</div></div>
    <div class="overview-card"><div class="metric-label">Revenue</div><div class="metric-value">${fmt.curr(KPI.Revenue)}</div></div>
    <div class="overview-card"><div class="metric-label">Spend</div><div class="metric-value">${fmt.curr(KPI.Spend)}</div></div>
    <div class="overview-card"><div class="metric-label">ROAS</div><div class="metric-value">${fmt.num(KPI.ROAS, 2)}</div></div>
  `;
}

function renderOverviewEmpty() {
  document.getElementById("overviewGrid").innerHTML =
    `<div style="grid-column:1/-1;color:#666">Keine Daten.</div>`;
}

function renderFunnel() {
  const KPI = MetaState.kpi;
  document.getElementById("funnelSteps").innerHTML = `
    <div class="funnel-step"><div class="metric-label">Impressions</div><div class="funnel-step-value">${fmt.num(KPI.Impressions)}</div></div>
    <div class="funnel-step"><div class="metric-label">Clicks</div><div class="funnel-step-value">${fmt.num(KPI.Clicks)}</div></div>
    <div class="funnel-step"><div class="metric-label">ATCs</div><div class="funnel-step-value">${fmt.num(KPI.AddToCart)}</div></div>
    <div class="funnel-step"><div class="metric-label">Purchases</div><div class="funnel-step-value">${fmt.num(KPI.Purchases)}</div></div>
  `;
}

function renderFunnelEmpty() {
  document.getElementById("funnelSteps").innerHTML =
    `<div style="grid-column:1/-1;color:#666">Keine Daten.</div>`;
}

function renderKPIs() {
  const KPI = MetaState.kpi;
  document.getElementById("kpiGrid").innerHTML = `
    <div class="kpi-card"><div class="kpi-label">CTR</div><div class="kpi-value">${fmt.pct(KPI.CTR)}</div></div>
    <div class="kpi-card"><div class="kpi-label">CPC</div><div class="kpi-value">${fmt.curr(KPI.CPC)}</div></div>
    <div class="kpi-card"><div class="kpi-label">ROAS</div><div class="kpi-value">${fmt.num(KPI.ROAS,2)}</div></div>
    <div class="kpi-card"><div class="kpi-label">AOV</div><div class="kpi-value">${fmt.curr(KPI.AOV)}</div></div>
    <div class="kpi-card"><div class="kpi-label">CR</div><div class="kpi-value">${fmt.pct(KPI.CR)}</div></div>
  `;
}

function renderKPIsEmpty() {
  document.getElementById("kpiGrid").innerHTML =
    `<div style="grid-column:1/-1;color:#666">Keine Daten.</div>`;
}

function renderCreatives() {
  const grid = document.getElementById("creativeGrid");
  let items = MetaState.creatives;

  if (MetaState.filter === "image") {
    items = items.filter((c) => c.mediaType === "image");
  }
  if (MetaState.filter === "video") {
    items = items.filter((c) => c.mediaType === "video");
  }

  if (!items.length) {
    grid.innerHTML =
      `<div style="grid-column:1/-1;color:#666">Keine Creatives.</div>`;
    return;
  }

  grid.innerHTML = items
    .map((c) => {
      return `
        <div class="creative-card">
          ${
            c.mediaType === "video"
              ? `<video class="creative-media" controls src="${c.URL}"></video>`
              : `<img class="creative-media" src="${c.URL}">`
          }
          <div class="creative-metrics">
            <span>ROAS: ${fmt.num(c.ROAS, 2)}</span>
            <span>CTR: ${fmt.num(c.CTR, 2)}%</span>
            <span>CPC: ${fmt.curr(c.CPC)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function clearDashboard() {
  document.getElementById("overviewGrid").innerHTML = "";
  document.getElementById("funnelSteps").innerHTML = "";
  document.getElementById("kpiGrid").innerHTML = "";
  document.getElementById("creativeGrid").innerHTML = "";
}
