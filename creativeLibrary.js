// creativeLibrary.js – SignalOne.cloud – FINAL

import { AppState } from "./state.js";
import { fetchMetaAds } from "./metaApi.js";
import { showToast, openModal } from "./uiCore.js";

export async function updateCreativeLibraryView() {
  const grid = document.getElementById("creativesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  if (!AppState.metaConnected || !AppState.meta.accessToken) {
    grid.innerHTML =
      "<p>Verbinde dich mit Meta, um Creatives zu laden.</p>";
    return;
  }

  if (!AppState.selectedAccountId) {
    grid.innerHTML =
      "<p>Wähle ein Werbekonto in der Topbar, um Creatives zu laden.</p>";
    return;
  }

  // Wenn wir noch keine Ads geladen haben → laden
  if (!AppState.meta.ads || !AppState.meta.ads.length) {
    try {
      const ads = await fetchMetaAds(
        AppState.selectedAccountId,
        AppState.meta.accessToken
      );
      AppState.meta.ads = ads || [];
    } catch (err) {
      console.error("updateCreativeLibraryView error:", err);
      showToast("Fehler beim Laden der Creatives.", "error");
    }
  }

  const ads = AppState.meta.ads || [];
  if (!ads.length) {
    grid.innerHTML =
      "<p>Keine Creatives für dieses Werbekonto gefunden.</p>";
    return;
  }

  const frag = document.createDocumentFragment();

  ads.forEach((ad) => {
    const card = document.createElement("div");
    card.classList.add("creative-card");
    card.addEventListener("click", () => openCreativeModal(ad));

    const name = ad.name || "(ohne Namen)";
    const status = ad.status || "-";

    let thumb =
      ad.creative?.thumbnail_url || "";

    const insights = ad.insights?.data?.[0] || {};
    const spend = Number(insights.spend || 0);
    const impressions = Number(insights.impressions || 0);
    const clicks = Number(insights.clicks || 0);
    const ctr =
      impressions > 0 ? (clicks / impressions) * 100 : 0;

    let roasVal = 0;
    if (Array.isArray(insights.purchase_roas) && insights.purchase_roas.length) {
      roasVal = Number(insights.purchase_roas[0].value || 0);
    }

    card.innerHTML = `
      <div class="creative-thumb">
        ${
          thumb
            ? `<img src="${thumb}" alt="${name}" />`
            : `<div class="creative-thumb-placeholder">Kein Preview</div>`
        }
      </div>
      <div class="creative-body">
        <div class="creative-title">${name}</div>
        <div class="creative-meta">
          <span class="badge">${status}</span>
        </div>
        <div class="creative-kpis">
          <span>Spend: €${spend.toFixed(2)}</span>
          <span>ROAS: ${roasVal.toFixed(2)}x</span>
          <span>CTR: ${ctr.toFixed(2)}%</span>
        </div>
      </div>
    `;

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function openCreativeModal(ad) {
  const insights = ad.insights?.data?.[0] || {};
  const spend = Number(insights.spend || 0);
  const impressions = Number(insights.impressions || 0);
  const clicks = Number(insights.clicks || 0);
  const ctr =
    impressions > 0 ? (clicks / impressions) * 100 : 0;

  let roasVal = 0;
  if (Array.isArray(insights.purchase_roas) && insights.purchase_roas.length) {
    roasVal = Number(insights.purchase_roas[0].value || 0);
  }

  const html = `
    <div class="creative-modal-section">
      <h3>${ad.name || "(ohne Namen)"}</h3>
      <p><strong>Status:</strong> ${ad.status || "-"}</p>
      <p><strong>ID:</strong> ${ad.id || "-"}</p>
    </div>
    <div class="creative-modal-section">
      <h3>KPIs</h3>
      <ul>
        <li>Spend: €${spend.toFixed(2)}</li>
        <li>Impressions: ${impressions}</li>
        <li>Clicks: ${clicks}</li>
        <li>CTR: ${ctr.toFixed(2)}%</li>
        <li>ROAS: ${roasVal.toFixed(2)}x</li>
      </ul>
    </div>
  `;

  openModal("Creative Details", html);
}
