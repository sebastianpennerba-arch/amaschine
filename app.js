console.log("app.js geladen");

// ===============================
// 0. CONFIG – HIER ANPASSEN
// ===============================

// !!! HIER DEIN TESTTOKEN EINTRAGEN !!!
const META_TOKEN = "EAASV03Be6MwBP1LrB3hIwl2XH0PS4vhAIqtZB6apofudEB1HAOgfiOqjg2Upjo2RrWptuVkN0O5rF4SaDz5eFZBDRbZAkDu9mvkEMA3WhnLRV5FBWtZCRQSeYFZAVIjzHyHDv36pY2HybyLpf9VyHHsXU3wx6a91ZB9gXIwCiZBp2pDWOmSqCZAgEuue1ESe4xFnxVkR";

// Ad Account immer mit "act_"
const AD_ACCOUNT_ID = "act_1147027830286117";

// Date-Period (1 = letzte 24h, 7 = letzte 7 Tage)
let CURRENT_PERIOD = 1;

// Creatives-Speicher
let ALL_CREATIVES = [];
let CURRENT_FILTER = "all";

// ===============================
// 1. HELFER
// ===============================

function formatNumber(n) {
  if (n == null || isNaN(n)) return "0";
  return Number(n).toLocaleString("de-DE");
}

function formatCurrency(n) {
  if (n == null || isNaN(n)) return "0,00 €";
  return Number(n).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

function formatPercent(n) {
  if (n == null || isNaN(n)) return "0,00 %";
  return Number(n).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

function showLoading(show) {
  const el = document.getElementById("loading");
  if (!el) return;
  el.style.display = show ? "flex" : "none";
}

// ===============================
// 2. META FETCHES
// ===============================

async function fetchInsights() {
  const datePreset = CURRENT_PERIOD === 1 ? "yesterday" : "last_7d";

  const url =
    `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/insights` +
    `?fields=impressions,clicks,spend,ctr,cpc,actions,purchase_roas` +
    `&date_preset=${datePreset}&access_token=${META_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Insights Error: " + res.status);
  }
  const json = await res.json();
  console.log("Insights:", json);
  return json.data?.[0] || {};
}

async function fetchCreatives() {
  const url =
    `https://graph.facebook.com/v19.0/${AD_ACCOUNT_ID}/ads` +
    `?fields=name,creative{thumbnail_url,object_story_spec},insights{impressions,clicks,ctr,spend,actions}` +
    `&effective_status=['ACTIVE']&limit=30&access_token=${META_TOKEN}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Ads Error: " + res.status);
  }
  const json = await res.json();
  console.log("Ads:", json);
  return json.data || [];
}

// ===============================
// 3. RENDERING
// ===============================

function renderOverview(ins) {
  const actions = ins.actions || [];
  const purchases =
    actions.find((a) => a.action_type === "purchase")?.value || 0;
  const atc =
    actions.find((a) => a.action_type === "add_to_cart")?.value || 0;
  const revenue =
    ins.purchase_roas?.[0]?.value
      ? Number(ins.purchase_roas[0].value) * Number(ins.spend || 0)
      : 0;

  document.getElementById("ov-impr").textContent = formatNumber(ins.impressions);
  document.getElementById("ov-clicks").textContent = formatNumber(ins.clicks);
  document.getElementById("ov-atc").textContent = formatNumber(atc);
  document.getElementById("ov-purchases").textContent = formatNumber(purchases);
  document.getElementById("ov-revenue").textContent = formatCurrency(revenue);
  document.getElementById("ov-spend").textContent = formatCurrency(ins.spend);
  const roas = ins.spend > 0 ? revenue / ins.spend : 0;
  document.getElementById("ov-roas").textContent = roas.toFixed(2);

  document.getElementById("fn-impr").textContent = formatNumber(ins.impressions);
  document.getElementById("fn-clicks").textContent = formatNumber(ins.clicks);
  document.getElementById("fn-atc").textContent = formatNumber(atc);
  document.getElementById("fn-pur").textContent = formatNumber(purchases);
}

function renderKPIs(ins) {
  const actions = ins.actions || [];
  const purchases =
    actions.find((a) => a.action_type === "purchase")?.value || 0;

  const ctr = ins.ctr || 0;
  const cpc = ins.cpc || 0;
  const spend = Number(ins.spend || 0);
  const revenue =
    ins.purchase_roas?.[0]?.value
      ? Number(ins.purchase_roas[0].value) * spend
      : 0;
  const roas = spend > 0 ? revenue / spend : 0;
  const aov = purchases > 0 ? revenue / purchases : 0;
  const cr = ins.clicks > 0 ? (purchases / ins.clicks) * 100 : 0;

  document.getElementById("kpi-ctr").textContent = formatPercent(ctr);
  document.getElementById("kpi-cpc").textContent = formatCurrency(cpc);
  document.getElementById("kpi-roas").textContent = roas.toFixed(2);
  document.getElementById("kpi-aov").textContent = formatCurrency(aov);
  document.getElementById("kpi-cr").textContent = formatPercent(cr);
}

function renderCreativeGrid() {
  const container = document.getElementById("creativeGrid");
  if (!container) return;
  container.innerHTML = "";

  const list = ALL_CREATIVES.filter((c) => {
    if (CURRENT_FILTER === "all") return true;
    return c.type === CURRENT_FILTER;
  });

  if (!list.length) {
    container.innerHTML = "<p>Keine Creatives gefunden.</p>";
    return;
  }

  for (const c of list) {
    const div = document.createElement("div");
    div.className = "creative-card";

    const thumb = document.createElement("img");
    thumb.className = "creative-thumb";
    thumb.src =
      c.thumbnail ||
      "https://via.placeholder.com/400x220/111111/ffffff?text=Creative";
    div.appendChild(thumb);

    const title = document.createElement("div");
    title.className = "creative-title";
    title.textContent = c.name || "Ohne Namen";
    div.appendChild(title);

    const metrics = document.createElement("div");
    metrics.className = "creative-kpis";
    metrics.innerHTML = `
      <span class="kpi-badge kpi-green">ROAS: ${c.metrics.roas.toFixed(2)}</span>
      <span class="kpi-badge kpi-yellow">CTR: ${formatPercent(c.metrics.ctr)}</span>
      <span class="kpi-badge kpi-red">Spend: ${formatCurrency(c.metrics.spend)}</span>
    `;
    div.appendChild(metrics);

    container.appendChild(div);
  }
}

// ===============================
// 4. META DATA LADEN
// ===============================

async function loadMetaDashboard() {
  if (!META_TOKEN || !AD_ACCOUNT_ID) {
    console.warn("Meta Token oder Ad Account fehlt.");
    return;
  }

  const status = document.getElementById("metaStatus");
  try {
    showLoading(true);
    status.textContent = "Meta verbunden (lädt …)";
    status.style.color = "#2563EB";

    const [insights, ads] = await Promise.all([
      fetchInsights(),
      fetchCreatives(),
    ]);

    renderOverview(insights);
    renderKPIs(insights);

    // Creatives normalisieren
    ALL_CREATIVES = (ads || []).map((ad) => {
      const insight = ad.insights?.data?.[0] || {};
      const metrics = {
        roas:
          insight.purchase_roas?.[0]?.value
            ? Number(insight.purchase_roas[0].value)
            : 0,
        ctr: Number(insight.ctr || 0),
        spend: Number(insight.spend || 0),
      };

      // Typ grob bestimmen
      let type = "image";
      const spec = ad.creative?.object_story_spec;
      if (spec?.video_data) type = "video";

      return {
        id: ad.id,
        name: ad.name,
        thumbnail: ad.creative?.thumbnail_url,
        type,
        metrics,
      };
    });

    renderCreativeGrid();

    status.textContent = "Meta verbunden (Test-Token)";
    status.style.color = "#16A34A";
  } catch (err) {
    console.error(err);
    status.textContent = "Meta Fehler (siehe Konsole)";
    status.style.color = "#DC2626";
  } finally {
    showLoading(false);
  }
}

// ===============================
// 5. EVENTS & INIT
// ===============================

function setupEvents() {
  // Datum
  const dateEl = document.getElementById("currentDate");
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  // Period Toggle
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".toggle-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      CURRENT_PERIOD = parseInt(btn.dataset.period || "1", 10) || 1;
      loadMetaDashboard();
    });
  });

  // Creative Filter
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      CURRENT_FILTER = btn.dataset.filter || "all";
      renderCreativeGrid();
    });
  });
}

// Start
document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  loadMetaDashboard();
});
