console.log("app.js geladen");

// ------------------------------------
// 1. INIT – DOM Ready
// ------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM geladen");
  setupMetaButton();
  setupPeriodToggle();
});

// Wird von identity.js aufgerufen, wenn User eingeloggt ist
function loadDashboard() {
  console.log("Dashboard wird geladen...");

  // Immer erstmal etwas anzeigen
  loadDummyData();

  // Versuche Meta-Daten zu laden (falls verbunden)
  if (typeof Clerk !== "undefined" && Clerk.user) {
    loadMetaData().catch(err => console.error("Fehler bei Meta-Daten:", err));
  }
}

// ------------------------------------
// 2. Meta Connect Button
// ------------------------------------
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) {
    console.warn("connectMeta Button existiert nicht.");
    return;
  }

  btn.addEventListener("click", () => {
    console.log("Meta verbinden geklickt.");

    const metaAppId = "732040642590155"; // <-- deine App ID
    const redirectUri = "https://amaschine.vercel.app/api/meta-auth"; // muss mit Meta App übereinstimmen

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${metaAppId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=ads_read,ads_management,business_management,pages_show_list`;

    window.open(authUrl, "_blank", "width=500,height=700");
  });
}

// ------------------------------------
// 3. Meta Daten abrufen & UI füllen
// ------------------------------------
async function loadMetaData() {
  const user = Clerk.user;

  if (!user || !user.unsafeMetadata || !user.unsafeMetadata.meta_token) {
    console.log("Kein Meta Token gesetzt → Meta nicht verbunden.");
    const status = document.getElementById("metaStatus");
    if (status) status.textContent = "Meta nicht verbunden";
    return;
  }

  const token = user.unsafeMetadata.meta_token;
  const status = document.getElementById("metaStatus");
  if (status) status.textContent = "Meta verbunden – Daten werden geladen…";

  try {
    // 1) Werbekonten laden
    const accResponse = await fetch("/api/meta-adaccounts", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
    const accounts = await accResponse.json();
    console.log("Werbekonten:", accounts);

    const firstAccount = accounts.data?.[0]?.account_id;
    if (!firstAccount) {
      if (status) status.textContent = "Meta verbunden – kein Werbekonto gefunden";
      return;
    }
    if (status) status.textContent = `Meta verbunden – Konto: act_${firstAccount}`;

    // 2) Insights laden (Account-Level)
    const insightResponse = await fetch("/api/meta-insights", {
      method: "POST",
      body: JSON.stringify({
        token,
        accountId: firstAccount,
      }),
    });
    const insightsJson = await insightResponse.json();
    console.log("Insights:", insightsJson);

    const row = insightsJson.data?.[0];
    if (row) {
      const metrics = mapInsightsRow(row);
      renderOverview(metrics);
      renderKPIs(metrics);
    }

    // 3) Kampagnen laden
    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      body: JSON.stringify({ token, accountId: firstAccount }),
    });
    const campaigns = await campRes.json();
    console.log("Kampagnen:", campaigns);

    const firstCampaign = campaigns.data?.[0]?.id;
    if (!firstCampaign) {
      console.log("Keine Kampagnen gefunden.");
      return;
    }

    // 4) Ads laden
    const adsRes = await fetch("/api/meta-ads", {
      method: "POST",
      body: JSON.stringify({
        token,
        campaignId: firstCampaign,
      }),
    });
    const adsJson = await adsRes.json();
    console.log("Ads:", adsJson);

    const ads = adsJson.data || [];

    // 5) Creatives aus Ads ableiten + Metriken mergen
    const baseMetrics = row ? mapInsightsRow(row) : null;

    const creatives = ads.map(ad => ({
      id: ad.id,
      name: ad.name,
      thumbnail: ad.creative?.thumbnail_url,
      metrics: baseMetrics
        ? {
            roas: baseMetrics.roas,
            ctr: baseMetrics.ctr,
            spend: baseMetrics.spend,
          }
        : {
            roas: 0,
            ctr: 0,
            spend: 0,
          },
    }));

    renderCreativeGrid(creatives);
  } catch (err) {
    console.error("Meta API Fehler:", err);
    if (status) status.textContent = "Fehler beim Laden der Meta-Daten";
  }
}

// Hilfsfunktion: Insights-Row in unser internes Format mappen
function mapInsightsRow(row) {
  const impressions = Number(row.impressions || 0);
  const clicks = Number(row.clicks || 0);
  const spend = Number(row.spend || 0);
  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);

  // purchases & revenue aus actions / action_values ziehen
  let purchases = 0;
  let revenue = 0;

  if (Array.isArray(row.actions)) {
    const purchaseAction = row.actions.find(a =>
      a.action_type && a.action_type.toLowerCase().includes("purchase")
    );
    if (purchaseAction) {
      purchases = Number(purchaseAction.value || 0);
    }
  }

  if (Array.isArray(row.action_values)) {
    const purchaseValue = row.action_values.find(a =>
      a.action_type && a.action_type.toLowerCase().includes("purchase")
    );
    if (purchaseValue) {
      revenue = Number(purchaseValue.value || 0);
    }
  }

  let roas = 0;
  if (Array.isArray(row.purchase_roas) && row.purchase_roas[0]?.value) {
    roas = Number(row.purchase_roas[0].value || 0);
  } else if (spend > 0 && revenue > 0) {
    roas = revenue / spend;
  }

  const aov = purchases > 0 ? revenue / purchases : 0;
  const cr = clicks > 0 ? (purchases / clicks) * 100 : 0;

  return {
    impressions,
    clicks,
    atc: 0, // können wir später aus actions ableiten
    purchases,
    revenue,
    spend,
    roas,
    ctr,
    cpc,
    aov,
    cr,
  };
}

// ------------------------------------
// 4. Dummy Daten (Fallback)
// ------------------------------------
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
    aov: 92.75,
    cr: 2.5,
  };

  renderOverview(dummy);
  renderKPIs(dummy);
}

// ------------------------------------
// 5. Rendering: Overview + Funnel + KPIs
// ------------------------------------
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
    ${makeCard("ROAS", data.roas.toFixed(2))}
  `;

  const funnel = document.getElementById("funnelSteps");
  if (!funnel) return;

  funnel.innerHTML = `
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
    ${makeCard("CTR", data.ctr.toFixed(2) + " %")}
    ${makeCard("CPC", data.cpc.toFixed(2) + " €")}
    ${makeCard("ROAS", data.roas.toFixed(2))}
    ${makeCard("AOV", data.aov.toFixed(2) + " €")}
    ${makeCard("CR", data.cr.toFixed(2) + " %")}
  `;
}

// ------------------------------------
// 6. Helper: Metric Card
// ------------------------------------
function makeCard(title, value) {
  return `
    <div class="kpi-card">
      <div class="kpi-label">${title}</div>
      <div class="kpi-value">${value}</div>
    </div>
  `;
}

// ------------------------------------
// 7. Creative Grid Rendering
// ------------------------------------
function renderCreativeGrid(items) {
  const el = document.getElementById("creativeGrid");
  if (!el) return;

  if (!items || !items.length) {
    el.innerHTML = "<p style='color:#6B7280;font-size:13px;'>Keine Creatives gefunden.</p>";
    return;
  }

  el.innerHTML = items
    .map((c) => {
      const thumb = c.thumbnail || "https://via.placeholder.com/400x300";
      const roas = c.metrics?.roas || 0;
      const ctr = c.metrics?.ctr || 0;
      const spend = c.metrics?.spend || 0;

      const roasClass =
        roas >= 3 ? "kpi-green" : roas >= 1.5 ? "kpi-yellow" : "kpi-red";

      return `
        <div class="creative-card">
          <img src="${thumb}" class="creative-thumb" />

          <div class="creative-title">${c.name}</div>

          <div class="creative-kpis">
            <div class="kpi-badge ${roasClass}">ROAS ${roas.toFixed(2)}</div>
            <div class="kpi-badge">${ctr.toFixed(2)}% CTR</div>
            <div class="kpi-badge">${spend.toFixed(2)}€ Spend</div>
          </div>
        </div>
      `;
    })
    .join("");
}

// ------------------------------------
// 8. Zeitraum-Toggle
// ------------------------------------
function setupPeriodToggle() {
  const buttons = document.querySelectorAll(".toggle-btn");
  if (!buttons.length) return;

  buttons.forEach((b) => {
    b.addEventListener("click", () => {
      buttons.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");

      console.log("Zeitraum geändert:", b.dataset.period);

      // TODO: später je nach Zeitraum andere Insights laden
      loadDummyData();
    });
  });
}
