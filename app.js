// ======================================================
// AdStream Analytics – Meta OAuth + Dashboard
// ======================================================

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

// ============================ BOOTSTRAP ============================
window.addEventListener("DOMContentLoaded", () => {
  initDate();
  setupMetaButton();
  setupPeriodToggle();
  setupFilterButtons();
  restoreMetaSession();
  console.log("AdStream Analytics gestartet");
});

// Token aus Popup empfangen
window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.access_token) {
    console.log("Meta Access Token erhalten:", data.access_token);

    MetaState.token = data.access_token;
    localStorage.setItem("meta_access_token", MetaState.token);

    updateMetaStatus();
    loadMetaData().catch((e) =>
      console.error("Fehler beim Laden der Meta Daten:", e)
    );
  } else if (data.error) {
    alert("Meta Fehler: " + data.error);
  }
});

// ============================ UI BASICS ============================
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

// ============================ Zeitraum ============================
function setupPeriodToggle() {
  const btns = document.querySelectorAll(".toggle-btn");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      MetaState.period = btn.dataset.period === "7" ? "7d" : "24h";

      if (MetaState.token && MetaState.accountId) {
        loadMetaData().catch((e) =>
          console.error("Fehler beim Reload nach Periodenwechsel:", e)
        );
      }
    });
  });
}

// ============================ Meta Connect ============================
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const appId = "732040642590155";
    const redirect = `${window.location.origin}/meta-popup.html`;
    const scopes = "ads_management,ads_read,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth` +
      `?client_id=${appId}` +
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

  updateMetaStatus();
}

function updateMetaStatus() {
  const el = document.getElementById("metaStatus");
  if (!el) return;

  if (!MetaState.token) {
    el.textContent = "Meta nicht verbunden";
    el.classList.remove("green");
    el.classList.add("red");
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
  console.log("Meta Token aus localStorage wiederhergestellt");
  updateMetaStatus();
  loadMetaData().catch((e) =>
    console.error("Fehler beim Laden nach Restore:", e)
  );
}

// ============================ Meta Datenfluss ============================
async function loadMetaData() {
  if (!MetaState.token) {
    console.warn("Kein Meta Token – bitte verbinden.");
    return;
  }

  showLoading(true);

  try {
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: MetaState.token }),
    });
    const accJson = await accRes.json();
    console.log("Adaccounts:", accJson);

    const accounts = accJson.data || [];
    if (!accounts.length) {
      alert("Keine Werbekonten gefunden!");
      return;
    }

    showAccountSelector(accounts);
    
  } catch(e) {
    console.error("Fehler:", e);
    alert("Fehler beim Laden der Daten: " + e.message);
  } finally {
    showLoading(false);
  }
}

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
    const v = row.action_values.find((a) =>
      a.action_type?.includes("purchase")
    );
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

function showAccountSelector(accounts) {
  const selector = document.getElementById("accountSelector");
  const accountSelect = document.getElementById("accountSelect");
  const campaignSelect = document.getElementById("campaignSelect");
  const loadBtn = document.getElementById("loadDataBtn");
  
  if (!selector || !accountSelect) return;
  
  selector.style.display = "block";
  
  accountSelect.innerHTML = accounts.map(acc => 
    `<option value="${acc.account_id || acc.id}">${acc.name} (${acc.account_id || acc.id})</option>`
  ).join("");
  
  accountSelect.addEventListener("change", async () => {
    const accountId = accountSelect.value;
    if (!accountId) return;
    
    MetaState.accountId = accountId;
    
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
    
    campaignSelect.innerHTML = campaigns.length 
      ? campaigns.map(c => `<option value="${c.id}">${c.name}</option>`).join("")
      : '<option value="">Keine aktiven Kampagnen</option>';
  });
  
  loadBtn.addEventListener("click", async () => {
    const campaignId = campaignSelect.value;
    if (!campaignId) {
      alert("Bitte wähle eine Kampagne!");
      return;
    }
    
    MetaState.selectedCampaignId = campaignId;
    await loadCampaignData();
  });
  
  if (accounts.length > 0) {
    accountSelect.dispatchEvent(new Event('change'));
  }
}

async function loadCampaignData() {
  showLoading(true);
  
  try {
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
      renderOverview();
      renderFunnel();
      renderKPIs();
    } else {
      renderOverviewEmpty();
      renderFunnelEmpty();
      renderKPIsEmpty();
    }
    
    await loadCreativesForCampaign(MetaState.selectedCampaignId);
    
  } catch(e) {
    console.error("Fehler beim Laden:", e);
    alert("Fehler: " + e.message);
  } finally {
    showLoading(false);
  }
}

// ============================ Creatives ============================
async function loadCreativesForCampaign(campaignId) {
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
  console.log("Ads:", adsJson);

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

    const isVideo = typeof thumb === "string" && thumb.toLowerCase().includes(".mp4");

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

// ============================ RENDER ============================
function renderOverview() {
  const grid =
    document.getElementById("overviewGrid") ||
    document.querySelector(".overview-grid");
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
      </div>`
    )
    .join("");
}

function renderOverviewEmpty() {
  const grid =
    document.getElementById("overviewGrid") ||
    document.querySelector(".overview-grid");
  if (!grid) return;
  grid.innerHTML =
    `<div style="grid-column:1/-1; color:#6B7280;">Keine Insights im gewählten Zeitraum verfügbar.</div>`;
}

function renderFunnel() {
  const el =
    document.getElementById("funnelSteps") ||
    document.querySelector(".funnel-steps");
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
    </div>`;
}

function renderFunnelEmpty() {
  const el =
    document.getElementById("funnelSteps") ||
    document.querySelector(".funnel-steps");
  if (!el) return;
  el.innerHTML =
    `<div style="grid-column:1/-1; color:#6B7280;">Keine Funnel-Daten verfügbar.</div>`;
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
      </div>`
    )
    .join("");
}

function renderKPIsEmpty() {
  const el = document.getElementById("kpiGrid") || document.querySelector(".kpi-grid");
  if (!el) return;
  el.innerHTML =
    `<div style="grid-column:1/-1; color:#6B7280;">Keine KPI-Daten im gewählten Zeitraum.</div>`;
}

function renderCreatives() {
  const grid =
    document.getElementById("creativesGrid") ||
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
    grid.innerHTML =
      `<div style="grid-column:1/-1; text-align:center; color:#6B7280;">Keine Creatives gefunden.</div>`;
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
        </div>`;
    })
    .join("");
}

