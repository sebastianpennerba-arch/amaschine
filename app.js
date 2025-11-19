// ======================================================
// AdStream Analytics – FULL VERSION with UNIVERSAL MOCK LOADER
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
};

let MOCK_MODE = false;

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
  pct: (v) =>
    (Number(v || 0)).toFixed(2).replace(".", ",") + " %",
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
});

// --------------------------------------------------------------------
// MOCK SWITCH
// --------------------------------------------------------------------
function setupMockToggle() {
  const liveBtn = document.getElementById("liveModeBtn");
  const mockBtn = document.getElementById("mockModeBtn");

  liveBtn.addEventListener("click", () => {
    MOCK_MODE = false;
    liveBtn.classList.add("active");
    mockBtn.classList.remove("active");
    document.getElementById("mockStatus").innerHTML = "Live (Meta)";
    loadMetaData();
  });

  mockBtn.addEventListener("click", () => {
    MOCK_MODE = true;
    mockBtn.classList.add("active");
    liveBtn.classList.remove("active");
    document.getElementById("mockStatus").innerHTML = "Simulated Mode aktiv";
    loadMockAdAccounts();
  });
}

// --------------------------------------------------------------------
// UNIVERSAL MOCK LOADER
// --------------------------------------------------------------------
async function loadMockCreatives() {
  console.log("Mock Mode → Lade Dateien aus /mock/...");

  try {
    const res = await fetch("/mock/");
    const html = await res.text();

    const files = [...html.matchAll(/href="([^"]+)"/g)]
      .map((m) => m[1])
      .filter((name) =>
        name.match(/\.(jpg|jpeg|png|mp4)$/i) &&
        !name.includes("..") &&
        !name.startsWith("/")
      );

    console.log("Mock Files:", files);

    MetaState.creatives = files.map((file, i) => {
      const lower = file.toLowerCase();
      const isVideo = lower.endsWith(".mp4");

      return {
        id: "mock_" + i,
        name: file,
        URL: "/mock/" + file,
        mediaType: isVideo ? "video" : "image",
        CTR: +(Math.random() * 3 + 1).toFixed(2),
        CPC: +(Math.random() * 0.50 + 0.05).toFixed(2),
        ROAS: +(Math.random() * 4).toFixed(2),
      };
    });

    MetaState.kpi = generateMockInsights();
    renderOverview();
    renderFunnel();
    renderKPIs();
    renderCreatives();
  } catch (err) {
    console.error("Fehler im Mock Loader:", err);
  }
}

// --------------------------------------------------------------------
// MOCK – AdAccounts
// --------------------------------------------------------------------
function loadMockAdAccounts() {
  MetaState.accountId = "mock_acc_1";

  MetaState.campaigns = [
    { id: "mockCamp1", name: "Mock Kampagne A" },
    { id: "mockCamp2", name: "Mock Kampagne B" },
  ];

  MetaState.selectedCampaignId = "mockCamp1";

  loadMockCreatives();
}

// --------------------------------------------------------------------
// MOCK – Insights / KPIs
// --------------------------------------------------------------------
function generateMockInsights() {
  const impressions = Math.floor(Math.random() * 80000 + 20000);
  const clicks = Math.floor(impressions * (Math.random() * 0.04 + 0.01));
  const purchases = Math.floor(clicks * (Math.random() * 0.05 + 0.01));
  const spend = +(Math.random() * 800 + 200).toFixed(2);
  const revenue = +(purchases * (Math.random() * 50 + 30)).toFixed(2);

  return {
    Impressions: impressions,
    Clicks: clicks,
    AddToCart: Math.floor(clicks * (Math.random() * 0.4)),
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
// META LOGIN FLOW
// --------------------------------------------------------------------
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  btn.addEventListener("click", () => {
    if (MOCK_MODE) {
      alert("Im Simulated Mode ist Meta Login deaktiviert.");
      return;
    }

    const appId = "732040642590155";
    const redirect = "https://amaschine.vercel.app/api/meta-auth";
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

    document.getElementById("metaStatus").textContent = "Meta verbunden";
    document.getElementById("metaStatus").style.color = "green";

    loadMetaData();
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  MetaState.token = token;
  loadMetaData();
}

// --------------------------------------------------------------------
// PERIOD SWITCH
// --------------------------------------------------------------------
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      MetaState.period = btn.dataset.period === "7" ? "7d" : "24h";
      if (!MOCK_MODE) loadMetaData();
    });
  });
}

// --------------------------------------------------------------------
// LOAD META DATA (REAL)
// --------------------------------------------------------------------
async function loadMetaData() {
  if (MOCK_MODE) {
    loadMockCreatives();
    return;
  }

  console.log("Lade echte Meta-Daten…");

  // 1) Accounts
  const accRes = await fetch("/api/meta-adaccounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: MetaState.token }),
  });
  const accJson = await accRes.json();
  const accounts = accJson.data || [];

  MetaState.accountId = accounts[0].account_id;

  // 2) Insights
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

  if (row) MetaState.kpi = mapInsightsRow(row);

  renderOverview();
  renderFunnel();
  renderKPIs();

  // 3) Campaigns
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
  MetaState.selectedCampaignId = MetaState.campaigns[0]?.id;

  await loadCreativesForCampaign(MetaState.selectedCampaignId);
}

// --------------------------------------------------------------------
// MAP INSIGHTS FROM META
// --------------------------------------------------------------------
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

  let roas = spend > 0 ? revenue / spend : 0;

  const aov = purchases ? revenue / purchases : 0;
  const cr = clicks ? (purchases / clicks) * 100 : 0;

  return {
    Impressions: imp,
    Clicks: clicks,
    AddToCart: 0,
    Purchases: purchases,
    Revenue: revenue,
    Spend: spend,
    ROAS: roas,
    CTR: ctr,
    CPC: cpc,
    AOV: aov,
    CR: cr,
  };
}

// --------------------------------------------------------------------
// LOAD CREATIVES (REAL)
// --------------------------------------------------------------------
async function loadCreativesForCampaign(campaignId) {
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
      CTR: MetaState.kpi.CTR,
      CPC: MetaState.kpi.CPC,
      ROAS: MetaState.kpi.ROAS,
    };
  });

  renderCreatives();
}

// --------------------------------------------------------------------
// FILTER BUTTONS
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

// --------------------------------------------------------------------
// RENDER FUNCTIONS (Overview / KPIs / Creatives)
// --------------------------------------------------------------------
function renderOverview() {
  const grid = document.getElementById("overviewGrid");
  const KPI = MetaState.kpi;
  if (!grid || !KPI) return;

  const cards = [
    { label: "Impressions", val: KPI.Impressions },
    { label: "Clicks", val: KPI.Clicks },
    { label: "AddToCart", val: KPI.AddToCart },
    { label: "Purchases", val: KPI.Purchases },
    { label: "Revenue", val: fmt.curr(KPI.Revenue) },
    { label: "Spend", val: fmt.curr(KPI.Spend) },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2) },
  ];

  grid.innerHTML = cards
    .map(
      (c) => `
    <div class="overview-card">
      <div class="metric-label">${c.label}</div>
      <div class="metric-value">${c.val}</div>
    </div>
  `
    )
    .join("");
}

function renderFunnel() {
  const el = document.getElementById("funnelSteps");
  const KPI = MetaState.kpi;
  if (!el || !KPI) return;

  el.innerHTML = `
    <div class="funnel-step"><div class="metric-label">Impressions</div><div>${fmt.num(KPI.Impressions)}</div></div>
    <div class="funnel-step"><div class="metric-label">Clicks</div><div>${fmt.num(KPI.Clicks)}</div></div>
    <div class="funnel-step"><div class="metric-label">ATCs</div><div>${fmt.num(KPI.AddToCart)}</div></div>
    <div class="funnel-step"><div class="metric-label">Purchases</div><div>${fmt.num(KPI.Purchases)}</div></div>
  `;
}

function renderKPIs() {
  const el = document.getElementById("kpiGrid");
  const KPI = MetaState.kpi;
  if (!el || !KPI) return;

  const cards = [
    { label: "CTR", val: fmt.pct(KPI.CTR) },
    { label: "CPC", val: fmt.curr(KPI.CPC) },
    { label: "ROAS", val: fmt.num(KPI.ROAS, 2) },
    { label: "AOV", val: fmt.curr(KPI.AOV) },
    { label: "CR", val: fmt.pct(KPI.CR) },
  ];

  el.innerHTML = cards
    .map(
      (c) => `
    <div class="kpi-card">
      <div class="kpi-label">${c.label}</div>
      <div class="kpi-value">${c.val}</div>
    </div>
  `
    )
    .join("");
}

function renderCreatives() {
  const grid =
    document.getElementById("creativesGrid") ||
    document.querySelector(".creative-grid");

  if (!grid) return;

  let items = MetaState.creatives;

  if (MetaState.filter === "image") items = items.filter((c) => c.mediaType === "image");
  if (MetaState.filter === "video") items = items.filter((c) => c.mediaType === "video");

  if (!items.length) {
    grid.innerHTML =
      `<div style="grid-column:1/-1; color:#6B7280;">Keine Creatives gefunden.</div>`;
    return;
  }

  grid.innerHTML = items
    .map((c) => {
      const isVideo = c.mediaType === "video";
      const media = isVideo
        ? `<video class="creative-media" controls src="${c.URL}"></video>`
        : `<img class="creative-media" src="${c.URL}" />`;

      return `
        <div class="creative-card">
          ${media}
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
