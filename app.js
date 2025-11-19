// ======================================================
// AdStream Analytics – echtes Meta OAuth
// Final stabile Version
// ======================================================

// Global State
const MetaState = {
  token: null,
  period: "24h",
  accountId: null,
  campaigns: [],
  selectedCampaignId: null,
  creatives: [],
  filter: "all",
  kpi: null
};

// Formatting helpers
const fmt = {
  num: (v, d = 0) =>
    Number(v || 0).toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d
    }),
  curr: (v) =>
    Number(v || 0).toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR"
    }),
  pct: (v) => (Number(v || 0)).toFixed(2) + " %"
};

// Init
window.addEventListener("DOMContentLoaded", () => {
  console.log("AdStream gestartet");

  initDate();
  setupMetaButton();
  setupMetaPostMessage();
  setupPeriodToggle();
  setupFilterButtons();

  restoreMetaSession();
});

// ========================================
// DATE DISPLAY
// ========================================
function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;

  const now = new Date();
  el.textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(now);
}

// ========================================
// Meta Connect Button
// ========================================
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const appId = "732040642590155";
    const redirect = "https://amaschine.vercel.app/meta-popup.html";
    const scopes = "ads_read,ads_management,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    window.open(
      authUrl,
      "metaAuth",
      "width=900,height=900,top=100,left=100"
    );
  });
}

function updateMetaStatus() {
  const el = document.getElementById("metaStatus");
  if (!el) return;

  if (MetaState.token) {
    el.textContent = "Meta verbunden";
    el.style.color = "green";
  } else {
    el.textContent = "Meta nicht verbunden";
    el.style.color = "red";
  }
}

// ========================================
// OAuth popup → Dashboard postMessage
// ========================================
function setupMetaPostMessage() {
  window.addEventListener("message", (event) => {
    const data = event.data || {};

    if (data.access_token) {
      console.log("Meta token erhalten:", data.access_token);

      MetaState.token = data.access_token;
      localStorage.setItem("meta_access_token", data.access_token);

      updateMetaStatus();
      loadMetaData();
    }

    if (data.error) {
      console.error("OAuth Fehler:", data);
      alert("Meta Login Fehler: " + (data.details?.error?.message || data.error));
    }
  });
}

function restoreMetaSession() {
  const t = localStorage.getItem("meta_access_token");
  if (!t) return;

  MetaState.token = t;
  updateMetaStatus();
  loadMetaData();
}

// ========================================
// Zeitraum Buttons
// ========================================
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");

  btns.forEach((b) =>
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");

      MetaState.period = b.dataset.period === "7" ? "7d" : "24h";

      if (MetaState.token && MetaState.accountId) loadMetaData();
    })
  );
}

// ========================================
// MAIN DATA FLOW
// ========================================
async function loadMetaData() {
  if (!MetaState.token) return;

  showLoading(true);

  try {
    // 1) Konten laden
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token })
    });

    const accJson = await accRes.json();
    const accounts = accJson.data || [];

    if (!accounts.length) {
      console.warn("Keine Werbekonten");
      return;
    }

    MetaState.accountId = accounts[0].id || accounts[0].account_id;

    // 2) Insights holen
    const preset = MetaState.period === "7d" ? "last_7d" : "yesterday";

    const insRes = await fetch("/api/meta-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        accountId: MetaState.accountId,
        preset
      })
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

    // 3) Kampagnen laden
    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token, accountId: MetaState.accountId })
    });

    const campJson = await campRes.json();
    MetaState.campaigns = campJson.data || [];

    if (!MetaState.campaigns.length) {
      renderCreativesEmpty();
      return;
    }

    MetaState.selectedCampaignId = MetaState.campaigns[0].id;

    await loadCreativesForCampaign(MetaState.selectedCampaignId);

  } catch (e) {
    console.error("Fehler loadMetaData:", e);
  }

  showLoading(false);
}

// ========================================
// Mapping für KPI
// ========================================
function mapInsightsRow(row) {
  const spend = parseFloat(row.spend) || 0;
  const revenue = row.action_values?.find(a => a.action_type.includes("purchase"))?.value || 0;
  const purchases = row.actions?.find(a => a.action_type.includes("purchase"))?.value || 0;

  return {
    Impressions: +row.impressions || 0,
    Clicks: +row.clicks || 0,
    AddToCart: 0,
    Purchases: +purchases || 0,
    Revenue: +revenue || 0,
    Spend: spend,
    ROAS: spend > 0 ? revenue / spend : 0,
    CTR: parseFloat(row.ctr) || 0,
    CPC: parseFloat(row.cpc) || 0,
    AOV: purchases > 0 ? revenue / purchases : 0,
    CR: row.clicks > 0 ? (purchases / row.clicks) * 100 : 0
  };
}

// ========================================
// Creatives
// ========================================
async function loadCreativesForCampaign(campaignId) {
  const adsRes = await fetch("/api/meta-ads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: MetaState.token,
      campaignId
    })
  });

  const adsJson = await adsRes.json();
  const ads = adsJson.data || [];
  const kpi = MetaState.kpi || { CTR: 0, CPC: 0, ROAS: 0 };

  MetaState.creatives = ads.map(ad => {
    const cr = ad.creative || {};
    const url =
      cr.thumbnail_url ||
      cr.image_url ||
      cr.video_url ||
      cr.object_story_spec?.link_data?.picture ||
      "";

    const isVideo = url.endsWith(".mp4");

    return {
      id: ad.id,
      name: ad.name,
      URL: url,
      mediaType: isVideo ? "video" : "image",
      CTR: kpi.CTR,
      CPC: kpi.CPC,
      ROAS: kpi.ROAS
    };
  });

  renderCreatives();
}

// ========================================
// UI Rendering
// ========================================
function renderOverview() {
  const grid = document.querySelector(".overview-grid");
  const KPI = MetaState.kpi;
  if (!grid || !KPI) return;

  const list = [
    ["Impressions", KPI.Impressions],
    ["Clicks", KPI.Clicks],
    ["AddToCart", KPI.AddToCart],
    ["Purchases", KPI.Purchases],
    ["Revenue", fmt.curr(KPI.Revenue)],
    ["Spend", fmt.curr(KPI.Spend)],
    ["ROAS", fmt.num(KPI.ROAS, 2)]
  ];

  grid.innerHTML = list
    .map(([label, val]) => `
      <div class="overview-card">
        <div class="metric-label">${label}</div>
        <div class="metric-value">${val}</div>
      </div>
    `)
    .join("");
}

function renderOverviewEmpty() {
  const grid = document.querySelector(".overview-grid");
  grid.innerHTML = `<div style="grid-column:1/-1;color:#777;">Keine Insights verfügbar.</div>`;
}

function renderFunnel() {
  const el = document.querySelector(".funnel-steps");
  const KPI = MetaState.kpi;

  el.innerHTML = `
    <div class="funnel-step"><div class="metric-label">Impressions</div><div class="funnel-step-value">${fmt.num(KPI.Impressions)}</div></div>
    <div class="funnel-step"><div class="metric-label">Clicks</div><div class="funnel-step-value">${fmt.num(KPI.Clicks)}</div></div>
    <div class="funnel-step"><div class="metric-label">ATCs</div><div class="funnel-step-value">${fmt.num(KPI.AddToCart)}</div></div>
    <div class="funnel-step"><div class="metric-label">Purchases</div><div class="funnel-step-value">${fmt.num(KPI.Purchases)}</div></div>
  `;
}

function renderFunnelEmpty() {
  const el = document.querySelector(".funnel-steps");
  el.innerHTML = `<div style="grid-column:1/-1;color:#777;">Keine Funnel-Daten.</div>`;
}

function renderKPIs() {
  const el = document.querySelector(".kpi-grid");
  const KPI = MetaState.kpi;

  const list = [
    ["CTR", fmt.pct(KPI.CTR)],
    ["CPC", fmt.curr(KPI.CPC)],
    ["ROAS", fmt.num(KPI.ROAS, 2)],
    ["AOV", fmt.curr(KPI.AOV)],
    ["CR", fmt.pct(KPI.CR)]
  ];

  el.innerHTML = list
    .map(([label, val]) => `
      <div class="kpi-card">
        <div class="kpi-label">${label}</div>
        <div class="kpi-value">${val}</div>
      </div>
    `)
    .join("");
}

function renderKPIsEmpty() {
  const el = document.querySelector(".kpi-grid");
  el.innerHTML = `<div style="grid-column:1/-1;color:#777;">Keine KPI-Daten.</div>`;
}

function renderCreatives() {
  const grid = document.querySelector(".creatives-grid");

  let items = MetaState.creatives || [];

  if (MetaState.filter === "image") {
    items = items.filter(c => c.mediaType === "image");
  } else if (MetaState.filter === "video") {
    items = items.filter(c => c.mediaType === "video");
  }

  if (!items.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#777;">Keine Creatives gefunden.</div>`;
    return;
  }

  grid.innerHTML = items
    .map(c => {
      const roasClass =
        c.ROAS >= 3 ? "kpi-green" : c.ROAS >= 1.5 ? "kpi-yellow" : "kpi-red";

      const ctrClass =
        c.CTR >= 2 ? "kpi-green" : c.CTR >= 1 ? "kpi-yellow" : "kpi-red";

      const media =
        c.mediaType === "video"
          ? `<video class="creative-media" controls src="${c.URL}"></video>`
          : `<img class="creative-media" src="${c.URL}">`;

      return `
        <div class="creative-card">
          ${media}
          <div class="creative-metrics">
            <span class="${roasClass}">ROAS: ${fmt.num(c.ROAS,2)}</span>
            <span class="${ctrClass}">CTR: ${fmt.num(c.CTR,2)}%</span>
            <span>CPC: ${fmt.curr(c.CPC)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCreativesEmpty() {
  const grid = document.querySelector(".creatives-grid");
  grid.innerHTML = `<div style="grid-column:1/-1;color:#777;text-align:center;">Keine Creatives.</div>`;
}

// Loading Overlay
function showLoading(show) {
  const el = document.getElementById("loading");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

// Filter buttons
function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-btn");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      MetaState.filter = btn.dataset.filter;
      renderCreatives();
    });
  });
}
