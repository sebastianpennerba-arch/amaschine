// ======================================================
// Elite Performance Dashboard - META ONLY
// ======================================================

// Global State
const MetaState = {
  token: null,
  period: "24h", // "24h" oder "7d"
  accountId: null,
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,      // aggregierte KPI (Account / Kampagne)
  creatives: [],  // für Creative Grid (vereinheitlichte Objekte)
  filter: "all",
};

// Formatter
const fmt = {
  num: (v, d = 0) => {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    });
  },
  curr: (v) => {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  },
  pct: (v) => {
    const n = Number(v || 0);
    return n.toFixed(2).replace(".", ",") + " %";
  },
};

// DOM Ready
window.addEventListener("DOMContentLoaded", () => {
  console.log("Dashboard (Meta-only) initialisiert");
  setupMetaButton();
  setupPeriodToggle();
  setupFilterButtons();
  setupMetaMessageListener();
  initDate();
  restoreMetaSession();
});

// ------------------------------------------------------
// Allgemeine UI
// ------------------------------------------------------
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
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

// ------------------------------------------------------
// Zeitraum-Toggle (24h / 7 Tage)
// ------------------------------------------------------
function setupPeriodToggle() {
  const buttons = document.querySelectorAll(".toggle-btn");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const p = String(btn.dataset.period || "1");
      MetaState.period = p === "7" ? "7d" : "24h";
      console.log("Zeitraum gewechselt:", MetaState.period);

      if (MetaState.token && MetaState.accountId) {
        loadMetaKpiAndCreatives();
      }
    });
  });
}

// ------------------------------------------------------
// Meta verbinden
// ------------------------------------------------------
function setupMetaButton() {
  const btn =
    document.getElementById("connectMeta") ||
    document.getElementById("metaConnectBtn") ||
    document.getElementById("meta-connect-btn");
  if (!btn) {
    console.warn("Kein Meta-Connect Button im HTML gefunden.");
    return;
  }

  btn.addEventListener("click", () => {
    console.log("Meta verbinden geklickt");

    const metaAppId = "732040642590155"; // deine App-ID
    const redirectUri = "https://amaschine.vercel.app/api/meta-auth";
    const scopes = [
      "ads_management",
      "ads_read",
      "business_management",
    ].join(",");

    const authUrl =
      "https://www.facebook.com/v19.0/dialog/oauth?" +
      `client_id=${encodeURIComponent(metaAppId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    const w = 900;
    const h = 900;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top = window.screenY + (window.outerHeight - h) / 2;

    window.open(
      authUrl,
      "meta_auth_popup",
      `width=${w},height=${h},left=${left},top=${top}`
    );
  });

  updateMetaStatus();
}

function setupMetaMessageListener() {
  window.addEventListener("message", (event) => {
    if (event.origin !== window.location.origin) return;

    const data = event.data || {};
    if (!data.access_token) {
      console.warn("postMessage ohne access_token:", data);
      return;
    }
    console.log("Meta-Token empfangen:", data);

    MetaState.token = data.access_token;
    localStorage.setItem("meta_access_token", MetaState.token);
    updateMetaStatus();

    alert("Meta erfolgreich verbunden!");
    loadMetaKpiAndCreatives();
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  MetaState.token = token;
  updateMetaStatus();
  loadMetaKpiAndCreatives();
}

function updateMetaStatus() {
  const statusEl = document.getElementById("metaStatus");
  if (!statusEl) return;

  if (!MetaState.token) {
    statusEl.textContent = "Meta nicht verbunden";
    statusEl.classList.remove("green");
    statusEl.classList.add("red");
  } else {
    const short = MetaState.token.slice(0, 8) + "…";
    statusEl.textContent = `Meta verbunden (${short})`;
    statusEl.classList.remove("red");
    statusEl.classList.add("green");
  }
}

// ------------------------------------------------------
// Meta-Daten laden (KPI + Creatives)
// ------------------------------------------------------
async function loadMetaKpiAndCreatives() {
  if (!MetaState.token) {
    console.warn("Kein Meta-Token vorhanden.");
    return;
  }

  try {
    showLoading(true);

    // 1) AdAccounts holen
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token }),
    });
    const accJson = await accRes.json();
    console.log("AdAccounts:", accJson);

    const accounts = accJson.data || accJson.accounts || [];
    if (!accounts.length) {
      console.warn("Keine AdAccounts gefunden.");
      return;
    }
    const firstAcc = accounts[0];
    MetaState.accountId = firstAcc.account_id || firstAcc.id;

    // 2) KPI / Insights holen (Account-Level)
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
    console.log("Insights:", insJson);

    const row = insJson.data && insJson.data[0] ? insJson.data[0] : null;
    if (row) {
      MetaState.kpi = mapInsightsRow(row);
      renderOverview();
      renderFunnel();
      renderKPIs();
    } else {
      console.warn("Keine Insights-Daten erhalten.");
    }

    // 3) Kampagnen holen
    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        accountId: MetaState.accountId,
      }),
    });
    const campJson = await campRes.json();
    console.log("Kampagnen:", campJson);
    const campaigns = campJson.data || campJson.campaigns || [];
    MetaState.campaigns = campaigns;

    if (!campaigns.length) {
      console.warn("Keine Kampagnen gefunden.");
      MetaState.creatives = [];
      renderCreatives();
      return;
    }

    const firstCampaignId = campaigns[0].id;
    MetaState.selectedCampaignId = firstCampaignId;
    await loadCreativesForCampaign(firstCampaignId);
  } catch (err) {
    console.error("Fehler beim Laden der Meta-Daten:", err);
  } finally {
    showLoading(false);
  }
}

// Mapping Insights → KPI Objekt
function mapInsightsRow(row) {
  const impressions = Number(row.impressions || 0);
  const clicks = Number(row.clicks || 0);
  const spend = Number(row.spend || 0);
  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);

  let purchases = 0;
  let revenue = 0;
  if (Array.isArray(row.actions)) {
    const a = row.actions.find(
      (x) => x.action_type && x.action_type.toLowerCase().includes("purchase")
    );
    if (a) purchases = Number(a.value || 0);
  }
  if (Array.isArray(row.action_values)) {
    const v = row.action_values.find(
      (x) => x.action_type && x.action_type.toLowerCase().includes("purchase")
    );
    if (v) revenue = Number(v.value || 0);
  }

  let roas = 0;
  if (Array.isArray(row.purchase_roas) && row.purchase_roas[0]) {
    roas = Number(row.purchase_roas[0].value || 0);
  } else if (spend > 0 && revenue > 0) {
    roas = revenue / spend;
  }

  const aov = purchases > 0 ? revenue / purchases : 0;
  const cr = clicks > 0 ? (purchases / clicks) * 100 : 0;

  return {
    Impressions: impressions,
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

// ------------------------------------------------------
// Creatives für Kampagne laden (MVP: Account-KPI für alle)
// ------------------------------------------------------
async function loadCreativesForCampaign(campaignId) {
  if (!MetaState.token || !campaignId) return;

  try {
    showLoading(true);
    const adsRes = await fetch("/api/meta-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: MetaState.token,
        campaignId,
      }),
    });
    const adsJson = await adsRes.json();
    console.log("Ads:", adsJson);
    const ads = adsJson.data || adsJson.ads || [];

    const kpi = MetaState.kpi || {};
    const creatives = ads.map((ad) => {
      const creative = ad.creative || {};
      const thumb =
        creative.thumbnail_url ||
        (creative.object_story_spec &&
          creative.object_story_spec.link_data &&
          creative.object_story_spec.link_data.picture) ||
        "";

      const url = thumb || "";
      const isVideo =
        url.toLowerCase().includes(".mp4") ||
        url.toLowerCase().includes("video");

      return {
        id: ad.id,
        name: ad.name || "Creative",
        URL: url,
        mediaType: isVideo ? "video" : "image",
        CTR: kpi.CTR || 0,
        CPC: kpi.CPC || 0,
        ROAS: kpi.ROAS || 0,
      };
    });

    MetaState.creatives = creatives;
    renderCreatives();
  } catch (err) {
    console.error("Fehler beim Laden der Creatives:", err);
  } finally {
    showLoading(false);
  }
}

// ------------------------------------------------------
// FILTER-BUTTONS (Alle / Bilder / Videos)
// ------------------------------------------------------
function setupFilterButtons() {
  const buttons = document.querySelectorAll(".filter-btn");
  if (!buttons.length) return;
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      MetaState.filter = btn.dataset.filter || "all";
      renderCreatives();
    });
  });
}

// ------------------------------------------------------
// RENDER: OVERVIEW
// ------------------------------------------------------
function renderOverview() {
  const el = document.getElementById("overviewGrid");
  if (!el || !MetaState.kpi) return;
  const KPI = MetaState.kpi;

  const metrics = [
    { label: "Impressions", key: "Impressions" },
    { label: "Clicks", key: "Clicks" },
    { label: "AddToCart", key: "AddToCart" },
    { label: "Purchases", key: "Purchases" },
    { label: "Revenue", key: "Revenue", fmt: "curr" },
    { label: "Spend", key: "Spend", fmt: "curr" },
    { label: "ROAS", key: "ROAS", fmt: "num2" },
  ];

  el.innerHTML = metrics
    .map((m) => {
      const raw = Number(KPI[m.key] || 0);
      let valText;
      if (m.fmt === "curr") valText = fmt.curr(raw);
      else if (m.fmt === "num2") valText = fmt.num(raw, 2);
      else valText = fmt.num(raw, 0);

      return `
        <div class="overview-card">
          <div class="metric-label">${m.label}</div>
          <div class="metric-value">${valText}</div>
        </div>`;
    })
    .join("");
}

// ------------------------------------------------------
// RENDER: FUNNEL
// ------------------------------------------------------
function renderFunnel() {
  const el = document.getElementById("funnelSteps");
  if (!el || !MetaState.kpi) return;
  const KPI = MetaState.kpi;

  const imp = Number(KPI.Impressions || 0);
  const clicks = Number(KPI.Clicks || 0);
  const atc = Number(KPI.AddToCart || 0);
  const purchases = Number(KPI.Purchases || 0);

  el.innerHTML = `
    <div class="funnel-step">
      <div class="metric-label">Impressions</div>
      <div class="funnel-step-value">${fmt.num(imp, 0)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">Clicks</div>
      <div class="funnel-step-value">${fmt.num(clicks, 0)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">ATCs</div>
      <div class="funnel-step-value">${fmt.num(atc, 0)}</div>
    </div>
    <div class="funnel-step">
      <div class="metric-label">Purchases</div>
      <div class="funnel-step-value">${fmt.num(purchases, 0)}</div>
    </div>
  `;
}

// ------------------------------------------------------
// RENDER: KPIs
// ------------------------------------------------------
function renderKPIs() {
  const el = document.getElementById("kpiGrid");
  if (!el || !MetaState.kpi) return;
  const KPI = MetaState.kpi;

  const metrics = [
    { label: "CTR", key: "CTR", type: "pct" },
    { label: "CPC", key: "CPC", type: "curr" },
    { label: "ROAS", key: "ROAS", type: "num2" },
    { label: "AOV", key: "AOV", type: "curr" },
    { label: "CR", key: "CR", type: "pct" },
  ];

  el.innerHTML = metrics
    .map((m) => {
      const raw = Number(KPI[m.key] || 0);
      let valText;
      if (m.type === "curr") valText = fmt.curr(raw);
      else if (m.type === "pct") valText = fmt.pct(raw);
      else if (m.type === "num2") valText = fmt.num(raw, 2);
      else valText = fmt.num(raw, 0);

      return `
        <div class="kpi-card">
          <div class="kpi-label">${m.label}</div>
          <div class="kpi-value">${valText}</div>
        </div>`;
    })
    .join("");
}

// ------------------------------------------------------
// RENDER: CREATIVES
// ------------------------------------------------------
function renderCreatives() {
  const grid = document.getElementById("creativesGrid");
  if (!grid) return;

  let items = MetaState.creatives || [];
  if (MetaState.filter === "image") {
    items = items.filter((c) => c.mediaType === "image");
  } else if (MetaState.filter === "video") {
    items = items.filter((c) => c.mediaType === "video");
  }

  if (!items.length) {
    grid.innerHTML = `
      <div style="grid-column:1 / -1; text-align:center; color:#6B7280; padding:20px;">
        Keine Creatives vorhanden.
      </div>`;
    return;
  }

  grid.innerHTML = items
    .map((c) => {
      const ctr = Number(c.CTR || 0);
      const cpc = Number(c.CPC || 0);
      const roas = Number(c.ROAS || 0);
      const url = c.URL || "";
      const media =
        c.mediaType === "video"
          ? `<video class="creative-media" controls src="${url}"></video>`
          : `<img class="creative-media" src="${url}" alt="Creative">`;

      const roasClass = roas >= 3 ? "kpi-green" : roas >= 1.5 ? "kpi-yellow" : "kpi-red";
      const ctrClass = ctr >= 2 ? "kpi-green" : ctr >= 1 ? "kpi-yellow" : "kpi-red";

      return `
        <div class="creative-card">
          ${media}
          <div class="creative-metrics">
            <span class="${roasClass}">ROAS: ${fmt.num(roas, 2)}</span>
            <span class="${ctrClass}">CTR: ${fmt.num(ctr, 2)} %</span>
            <span>CPC: ${fmt.curr(cpc)}</span>
          </div>
        </div>`;
    })
    .join("");
}
