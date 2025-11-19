console.log("app.js geladen");

// ------------------------------
// 1. Dashboard initialisieren
// ------------------------------

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM geladen");
  setupMetaButton();
});

// Wird von identity.js aufgerufen,
// wenn Clerk meldet, dass der User eingeloggt ist
function loadDashboard() {
  console.log("Dashboard wird geladen...");

  loadMetaData(); // <-- Meta API (kommt später sobald Token vorhanden)
  loadDummyData(); // Dummy Daten für sofortige Anzeige
}

// ------------------------------
// 2. Meta Connect Button
// ------------------------------

function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) {
    console.warn("connectMeta Button existiert nicht.");
    return;
  }

  btn.addEventListener("click", () => {
    console.log("Meta verbinden geklickt.");

    const metaAppId = "732040642590155"; // <-- Ersetzen!

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${metaAppId}&` +
      `redirect_uri=https://amaschine.vercel.app/api/meta-auth&` +
      `scope=ads_read,ads_management,business_management,pages_show_list`;

    window.open(authUrl, "_blank", "width=500,height=700");
  });
}

// ------------------------------
// 3. Meta Daten abrufen
// ------------------------------

async function loadMetaData() {
  const user = Clerk.user;
  const token = user.unsafeMetadata.meta_token;

  if (!token) {
    console.log("Meta nicht verbunden.");
    return;
  }

  // 1. Ad Accounts laden
  const accResponse = await fetch("/api/meta-adaccounts", {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  const accounts = await accResponse.json();
  console.log("Werbekonten:", accounts);

  const firstAccount = accounts.data?.[0]?.account_id;
  if (!firstAccount) return;

  // 2. Insights laden
  const insightResponse = await fetch("/api/meta-insights", {
    method: "POST",
    body: JSON.stringify({
      token,
      accountId: firstAccount,
    }),
  });

  const insights = await insightResponse.json();
  console.log("Insights:", insights);

  // 3. Rendering
  renderOverviewFromMeta(insights);
  renderKPIsFromMeta(insights);
}

// 3) Ads laden
const adsRes = await fetch("/api/meta-ads", {
  method: "POST",
  body: JSON.stringify({
    token,
    campaignId: firstCampaign
  }),
});
const ads = await adsRes.json();

// 4) Creatives extrahieren
const creatives = ads.data?.map(ad => ({
  id: ad.id,
  name: ad.name,
  thumbnail: ad.creative?.thumbnail_url,
  metrics: {
    roas: insights.data?.[0]?.purchase_roas || 0,
    ctr: insights.data?.[0]?.ctr || 0,
    spend: insights.data?.[0]?.spend || 0,
  }
}));

renderCreativeGrid(creatives);


// ------------------------------
// 4. Dummy Daten fürs Dashboard
// ------------------------------

function loadDummyData() {
  const dummy = {
    impressions: 12500,
    clicks: 320,
    atc: 57,
    purchases: 8,
    revenue: 742,
    spend: 100,
    roas: 3.5,
    ctr: 2.56,
    cpc: 0.66,
    aov: 100,
    cr: 2.5,
  };

  renderOverview(dummy);
  renderKPIs(dummy);
}

// ------------------------------
// 5. Rendering Funktionen
// ------------------------------

function renderOverview(data) {
  const g = document.getElementById("overviewGrid");
  if (!g) return;

  g.innerHTML = `
    ${makeCard("Impressions", data.impressions)}
    ${makeCard("Clicks", data.clicks)}
    ${makeCard("AddToCart", data.atc)}
    ${makeCard("Purchases", data.purchases)}
    ${makeCard("Revenue", data.revenue + " €")}
    ${makeCard("Spend", data.spend + " €")}
    ${makeCard("ROAS", data.roas)}
  `;

  document.getElementById("funnelSteps").innerHTML = `
    ${makeCard("Impressions", data.impressions)}
    ${makeCard("Clicks", data.clicks)}
    ${makeCard("ATCs", data.atc)}
    ${makeCard("Purchases", data.purchases)}
  `;
}

function renderKPIs(data) {
  const k = document.getElementById("kpiGrid");
  if (!k) return;

  k.innerHTML = `
    ${makeCard("CTR", data.ctr + " %")}
    ${makeCard("CPC", data.cpc + " €")}
    ${makeCard("ROAS", data.roas)}
    ${makeCard("AOV", data.aov + " €")}
    ${makeCard("CR", data.cr + " %")}
  `;
}

// ------------------------------
// 6. Helper Funktion
// ------------------------------

function makeCard(title, value) {
  return `
    <div class="card">
      <div class="metric-title">${title}</div>
      <div class="metric-value">${value}</div>
    </div>
  `;
}

function renderCreativeGrid(items) {
  const el = document.getElementById("creativeGrid");
  if (!el) return;

  el.innerHTML = items.map(c => {
    const isVideo = c.thumbnail.match(/mp4|video/);
    const thumb = c.thumbnail || "https://via.placeholder.com/400x300";

    const roas = c.metrics?.roas || 0;
    const ctr = c.metrics?.ctr || 0;
    const spend = c.metrics?.spend || 0;

    const roasClass =
      roas >= 3 ? "kpi-green" : roas >= 1.5 ? "kpi-yellow" : "kpi-red";

    return `
      <div class="creative-card">
        ${isVideo
          ? `<video src="${thumb}" class="creative-thumb" controls muted></video>`
          : `<img src="${thumb}" class="creative-thumb" />`
        }

        <div class="creative-title">${c.name}</div>

        <div class="creative-kpis">
          <div class="kpi-badge ${roasClass}">ROAS ${roas.toFixed(2)}</div>
          <div class="kpi-badge">${ctr}% CTR</div>
          <div class="kpi-badge">${spend}€ Spend</div>
        </div>
      </div>
    `;
  }).join("");
}


// ----------------------------------------------------
// 7. Toggle (letzte 24 Stunden / letzte 7 Tage)
// ----------------------------------------------------

document.querySelectorAll(".toggle-btn").forEach((b) => {
  b.addEventListener("click", () => {
    document
      .querySelectorAll(".toggle-btn")
      .forEach((x) => x.classList.remove("active"));
    b.classList.add("active");

    console.log("Zeitraum geändert:", b.dataset.period);

    // Später: API Call für Zeitraum
    loadDummyData();
  });
});






