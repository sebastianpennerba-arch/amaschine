// ======================================================
// AdStream Analytics - Meta Live + Simulated Mock Mode
// ======================================================

const MetaState = {
  token: null,
  period: "24h",         // "24h" oder "7d"
  accountId: null,
  accounts: [],
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,
  creatives: [],
  filter: "all",
};

window.mockMode = false; // Live (Meta) = false, Simulated = true

// ----------------- Formatter -----------------
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

// ----------------- DOM Ready -----------------
window.addEventListener("DOMContentLoaded", () => {
  initDate();
  setupPeriodToggle();
  setupFilterButtons();
  setupModeToggle();
  setupMetaButton();
  restoreMetaSession();
  updateMetaStatus();
});

// ----------------- Datum -----------------
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

// ----------------- Loading Overlay -----------------
function showLoading(show) {
  const el = document.getElementById("loading");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

// ----------------- Zeitraum Toggle -----------------
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      MetaState.period = btn.dataset.period === "7" ? "7d" : "24h";

      if (window.mockMode) {
        loadMockData();
      } else if (MetaState.token && MetaState.accountId) {
        loadMetaData();
      }
    });
  });
}

// ----------------- Mode Toggle (Live / Simulated) -----------------
function setupModeToggle() {
  const liveBtn = document.getElementById("mode-live");
  const simBtn = document.getElementById("mode-sim");

  if (!liveBtn || !simBtn) return;

  liveBtn.addEventListener("click", () => {
    window.mockMode = false;
    liveBtn.classList.add("active");
    simBtn.classList.remove("active");
    updateMetaStatus();
    if (MetaState.token) {
      loadMetaData();
    } else {
      // ohne Token einfach UI leeren
      clearDashboard();
    }
  });

  simBtn.addEventListener("click", () => {
    window.mockMode = true;
    simBtn.classList.add("active");
    liveBtn.classList.remove("active");
    updateMetaStatus();
    loadMockData();
  });
}

// ----------------- Meta Connect Button -----------------
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;

  btn.addEventListener("click", () => {
    if (window.mockMode) {
      alert("Im Simulated Mode wird keine echte Meta-Verbindung aufgebaut.");
      return;
    }

    const appId = "732040642590155";
    const redirect = "https://amaschine.vercel.app/api/meta-auth";
    const scopes = "ads_management,ads_read,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    const w = 900;
    const h = 900;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    window.open(
      authUrl,
      "metaAuth",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  });

  // token vom popup empfangen
  window.addEventListener("message", (event) => {
    const data = event.data || {};
    if (!data.access_token) return;

    MetaState.token = data.access_token;
    localStorage.setItem("meta_access_token", data.access_token);
    window.mockMode = false; // wenn echter Token kommt → Live Mode
    updateMetaStatus();
    loadMetaData();
  });
}

function updateMetaStatus() {
  const el = document.getElementById("metaStatus");
  if (!el) return;

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

// ======================================================
//  LIVE: Meta Daten holen
// ======================================================
async function loadMetaData() {
  if (window.mockMode) {
    loadMockData();
    return;
  }
  if (!MetaState.token) return;

  try {
    showLoading(true);

    // 1) Werbekonten
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
      console.warn("Keine Werbekonten gefunden");
      return;
    }

    MetaState.accountId = accounts[0].account_id || accounts[0].id;

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

    // 3) Kampagnen
    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        accountId: MetaState.accountId,
      }),
    });

    const campJson = await campRes.json();
    const campaigns = campJson.data || campJson.campaigns || [];
    MetaState.campaigns = campaigns;

    if (!campaigns.length) {
      MetaState.creatives = [];
      renderCreatives();
      return;
    }

    MetaState.selectedCampaignId = campaigns[0].id;
    await loadCreativesForCampaign(MetaState.selectedCampaignId);
  } catch (err) {
    console.error("Fehler in loadMetaData:", err);
  } finally {
    showLoading(false);
  }
}

// Insights → KPI
function mapInsightsRow(row) {
  const imp = +row.impressions || 0;
  const clicks = +row.clicks || 0;
  const spend = +row.spend || 0;
  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);

  let purchases = 0;
  let revenue = 0;

  if (Array.isArray(row.actions)) {
    const p = row.actions.find((a) => a.action_type?.includes("purchase"));
    if (p) purchases = +p.value || 0;
  }
  if (Array.isArray(row.action_values)) {
    const v = row.action_values.find((a) => a.action_type?.includes("purchase"));
    if (v) revenue = +v.value || 0;
  }

  let roas = 0;
  if (row.purchase_roas?.[0]) {
    roas = +row.purchase_roas[0].value || 0;
  } else if (spend > 0) {
    roas = revenue / spend;
  }

  const aov = purchases > 0 ? revenue / purchases : 0;
  const cr = clicks > 0 ? (purchases / clicks) * 100 : 0;

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

// ======================================================
//  SIMULATED: Mock-Daten
// ======================================================
function loadMockData() {
  showLoading(true);

  // 1) Werbekonto + Kampagne simulieren
  MetaState.accounts = [
    { id: "act_mock_1", account_id: "act_mock_1", name: "Projekt_KI_Automation (Mock)" },
  ];
  MetaState.accountId = "act_mock_1";

  MetaState.campaigns = [
    { id: "cmp_hd24_1", name: "HD24 – Hotelgutscheine Funnel" },
  ];
  MetaState.selectedCampaignId = "cmp_hd24_1";

  // 2) KPI simulieren (Beispielwerte)
  const base = MetaState.period === "7d"
    ? { imp: 125000, clicks: 4200, spend: 980, purchases: 130, revenue: 4200 }
    : { imp: 18000, clicks: 620, spend: 140, purchases: 22, revenue: 680 };

  const ctr = base.clicks / base.imp * 100;
  const cpc = base.spend / base.clicks;
  const roas = base.revenue / base.spend;
  const aov = base.revenue / base.purchases;
  const cr = base.clicks > 0 ? (base.purchases / base.clicks) * 100 : 0;

  MetaState.kpi = {
    Impressions: base.imp,
    Clicks: base.clicks,
    AddToCart: Math.round(base.clicks * 0.35),
    Purchases: base.purchases,
    Revenue: base.revenue,
    Spend: base.spend,
    ROAS: roas,
    CTR: ctr,
    CPC: cpc,
    AOV: aov,
    CR: cr,
  };

  renderOverview();
  renderFunnel();
  renderKPIs();

  // 3) Creatives simulieren
  MetaState.creatives = [
    {
      id: "mock1",
      name: "Wellness – 3 Nächte",
      mediaType: "image",
      URL: "./mock/creative1.jpg",
      CTR: 3.1,
      CPC: 0.72,
      ROAS: 5.4,
    },
    {
      id: "mock2",
      name: "Frühstücks-Deal",
      mediaType: "image",
      URL: "./mock/creative2.jpg",
      CTR: 2.4,
      CPC: 0.95,
      ROAS: 3.1,
    },
    {
      id: "mock3",
      name: "Pärchen-Wellness",
      mediaType: "image",
      URL: "./mock/creative3.jpg",
      CTR: 3.8,
      CPC: 0.61,
      ROAS: 6.2,
    },
    {
      id: "mock4",
      name: "Pool-Angebot",
      mediaType: "image",
      URL: "./mock/creative4.jpg",
      CTR: 2.0,
      CPC: 1.10,
      ROAS: 2.7,
    },
    {
      id: "mock5",
      name: "Poolpaar 59 €",
      mediaType: "image",
      URL: "./mock/creative7.jpg",
      CTR: 2.7,
      CPC: 0.88,
      ROAS: 4.0,
    },
    {
      id: "mock6",
      name: "Lobby / Rezeption",
      mediaType: "image",
      URL: "./mock/creative9.jpg",
      CTR: 1.8,
      CPC: 1.30,
      ROAS: 2.2,
    },
  ];

  renderCreatives();
  showLoading(false);
}

// ======================================================
// Creatives (Live) – nur wenn NICHT mockMode
// ======================================================
async function loadCreativesForCampaign(campaignId) {
  if (window.mockMode) {
    // zur Sicherheit: Mock erneut laden
    loadMockData();
    return;
  }
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
  const kpi = MetaState.kpi || { CTR: 0, CPC: 0, ROAS: 0 };

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
      URL: thumb || "",
      mediaType: isVideo ? "video" : "image",
      CTR: kpi.CTR,
      CPC: kpi.CPC,
      ROAS: kpi.ROAS,
    };
  });

  renderCreatives();
}

// ======================================================
// Filter
// ======================================================
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

// ======================================================
// Render Overview / Funnel / KPIs
// ======================================================
function renderOverview() {
  const grid = document.getElementById("overviewGrid") || document.querySelector(".overview-grid");
  const KPI = MetaState.kpi;
  if (!grid || !KPI) return;

  const cards = [
    { label: "Impressions", val: fmt.num(KPI.Impressions) },
    { label: "Clicks", val: fmt.num(KPI.Clicks) },
    { label: "AddToCart", val: fmt.num(KPI.AddToCart) },
    { label: "Purchases", val: fmt.num(KPI.Purchases) },
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

function renderOverviewEmpty() {
  const grid = document.getElementById("overviewGrid") || document.querySelector(".overview-grid");
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1; color:#6B7280;">
      Keine Insights im gewählten Zeitraum verfügbar.
    </div>
  `;
}

function renderFunnel() {
  const el = document.getElementById("funnelSteps") || document.querySelector(".funnel-steps");
  const KPI = MetaState.kpi;
  if (!el || !KPI) return;

  el.innerHTML = `
    <div class="funnel-step">
      <div class="metric-label">Impressions</div>
      <div class="funnel-step-value">${fmt.num(KPI.Impressions)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">Clicks</div>
      <div class="funnel-step-value">${fmt.num(KPI.Clicks)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">ATCs</div>
      <div class="funnel-step-value">${fmt.num(KPI.AddToCart)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">Purchases</div>
      <div class="funnel-step-value">${fmt.num(KPI.Purchases)}</div>
    </div>
  `;
}

function renderFunnelEmpty() {
  const el = document.getElementById("funnelSteps") || document.querySelector(".funnel-steps");
  if (!el) return;
  el.innerHTML = `
    <div style="grid-column:1/-1; color:#6B7280;">
      Keine Funnel-Daten verfügbar.
    </div>
  `;
}

function renderKPIs() {
  const el = document.getElementById("kpiGrid") || document.querySelector(".kpi-grid");
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

function renderKPIsEmpty() {
  const el = document.getElementById("kpiGrid") || document.querySelector(".kpi-grid");
  if (!el) return;
  el.innerHTML = `
    <div style="grid-column:1/-1; color:#6B7280;">
      Keine KPI-Daten im gewählten Zeitraum.
    </div>
  `;
}

// ======================================================
// Render Creatives
// ======================================================
function renderCreatives() {
  const grid =
    document.getElementById("creativesGrid") ||
    document.getElementById("creativeGrid") ||
    document.querySelector(".creatives-grid") ||
    document.querySelector(".creative-grid");
  if (!grid) return;

  let items = MetaState.creatives || [];

  if (MetaState.filter === "image") {
    items = items.filter((c) => c.mediaType === "image");
  } else if (MetaState.filter === "video") {
    items = items.filter((c) => c.mediaType === "video");
  }

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; color:#6B7280;">
        Keine Creatives gefunden.
      </div>
    `;
    return;
  }

  grid.innerHTML = items
    .map((c) => {
      const roasClass =
        c.ROAS >= 3 ? "kpi-green" : c.ROAS >= 1.5 ? "kpi-yellow" : "kpi-red";

      const ctrClass =
        c.CTR >= 2 ? "kpi-green" : c.CTR >= 1 ? "kpi-yellow" : "kpi-red";

      const media =
        c.mediaType === "video"
          ? `<video class="creative-media" controls src="${c.URL}"></video>`
          : `<img class="creative-media" src="${c.URL}" alt="${c.name}">`;

      return `
      <div class="creative-card">
        ${media}
        <div class="creative-metrics">
          <span class="${roasClass}">ROAS: ${fmt.num(c.ROAS, 2)}</span>
          <span class="${ctrClass}">CTR: ${fmt.num(c.CTR, 2)}%</span>
          <span>CPC: ${fmt.curr(c.CPC)}</span>
        </div>
      </div>
    `;
    })
    .join("");
}

// ----------------- Dashboard leeren (bei Fehlern) -----------------
function clearDashboard() {
  MetaState.kpi = null;
  MetaState.creatives = [];
  renderOverviewEmpty();
  renderFunnelEmpty();
  renderKPIsEmpty();
  renderCreatives();
}
