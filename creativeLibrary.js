// creativeLibrary.js – Creative Library (P2) – überarbeitete Version
// -----------------------------------------------------------------
// Ziele dieser Version:
// 1) Creative-Cards im DatAds-Style (vertikal, großes Thumbnail,
//    KPIs in Balkenform), aber mit SignalOne-Look.
// 2) Skaliert sauber von 0 bis 1000+ Creatives.
// 3) Klick auf Card öffnet ein hochwertiges Detail-Modal.

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";

function getCreativesForCurrentSelection() {
  const meta = AppState.meta || {};
  let creatives = meta.creatives || meta.ads || [];

  if (!Array.isArray(creatives)) return [];

  if (AppState.selectedCampaignId) {
    creatives = creatives.filter((c) => {
      const cid = c.campaign_id || c.campaignId;
      return cid === AppState.selectedCampaignId;
    });
  }

  return creatives;
}

function renderLibraryPlaceholder(
  text = "Verbinde Meta und wähle ein Werbekonto, um Creatives zu sehen."
) {
  const grid = document.getElementById("creativeLibraryGrid");
  if (!grid) return;

  grid.innerHTML = `
    <div style="
      grid-column: 1 / -1;
      padding:24px;
      border-radius:16px;
      background:var(--card-bg, #ffffff);
      box-shadow:0 10px 30px rgba(15,23,42,0.06);
      text-align:center;
      font-size:14px;
      color:var(--text-secondary);
    ">
      ${text}
    </div>
  `;
}

function renderLibraryLoading() {
  renderLibraryPlaceholder("Lade Creatives & Performance-Metriken…");
}

function asNumber(val) {
  const n = Number(val);
  return isFinite(n) ? n : 0;
}

function buildKpiBar(label, valueFormatted, normalized, suffix = "") {
  const width = Math.min(100, Math.max(0, normalized * 100));
  return `
    <div style="display:flex; flex-direction:column; gap:4px;">
      <div style="display:flex; justify-content:space-between; font-size:11px;">
        <span style="color:var(--text-secondary);">${label}</span>
        <span style="font-weight:500;">${valueFormatted}${suffix}</span>
      </div>
      <div style="
        position:relative;
        width:100%;
        height:6px;
        border-radius:999px;
        background:rgba(15,23,42,0.06);
        overflow:hidden;
      ">
        <div style="
          position:absolute;
          inset:0;
          transform-origin:left center;
          transform:scaleX(${width / 100 || 0});
          background:linear-gradient(90deg, #6366F1, #06B6D4);
        "></div>
      </div>
    </div>
  `;
}

// ---------------------------------------------------------
// Public API – von app.js aufgerufen
// ---------------------------------------------------------

export function updateCreativeLibraryView(connected) {
  const grid = document.getElementById("creativeLibraryGrid");
  if (!grid) return;

  if (!connected) {
    renderLibraryPlaceholder();
    return;
  }

  renderLibraryLoading();

  const creatives = getCreativesForCurrentSelection();

  if (!creatives.length) {
    renderLibraryPlaceholder(
      AppState.selectedCampaignId
        ? "Für diese Kampagne wurden keine Creatives gefunden."
        : "Keine Creatives gefunden. Prüfe Filter oder Kampagnenauswahl."
    );
    return;
  }

  // Grid optisch auf Links ausrichten, egal ob 1 oder 50 Cards
  grid.style.maxWidth = "100%";
  grid.style.margin = "0";
  grid.style.justifyItems = "stretch";

  const maxRoas = Math.max(
    ...creatives.map((c) => asNumber(c.metrics?.roas || c.metrics?.purchase_roas))
  );
  const maxSpend = Math.max(
    ...creatives.map((c) => asNumber(c.metrics?.spend || c.metrics?.spend_30d))
  );
  const maxCtr = Math.max(
    ...creatives.map((c) => asNumber(c.metrics?.ctr || c.metrics?.ctr_30d))
  );

  grid.innerHTML = creatives
    .map((creative) => {
      const metrics = creative.metrics || {};
      const name =
        creative.name ||
        creative.ad_name ||
        creative.headline ||
        "Unbenanntes Creative";

      const thumbnail =
        creative.thumbnail_url ||
        creative.preview_url ||
        creative.image_url ||
        null;

      const roas = asNumber(metrics.roas || metrics.purchase_roas);
      const spend = asNumber(metrics.spend || metrics.spend_30d);
      const ctr = asNumber(metrics.ctr || metrics.ctr_30d);

      const normalizedRoas = maxRoas ? roas / maxRoas : 0;
      const normalizedSpend = maxSpend ? spend / maxSpend : 0;
      const normalizedCtr = maxCtr ? ctr / maxCtr : 0;

      const roasFormatted = roas ? `${roas.toFixed(2)}x` : "0x";
      const spendFormatted = spend
        ? `€ ${spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`
        : "€ 0";
      const ctrFormatted = ctr ? `${ctr.toFixed(2)}%` : "0%";

      const impressions = metrics.impressions || metrics.impressions_30d || 0;
      const clicks = metrics.clicks || metrics.clicks_30d || 0;

      return `
        <article
          class="creative-library-item"
          data-ad-id="${creative.id}"
          style="
            display:flex;
            flex-direction:column;
            gap:12px;
            border-radius:18px;
            background:#ffffff;
            box-shadow:0 16px 40px rgba(15,23,42,0.10);
            padding:14px;
            cursor:pointer;
            transition:transform 120ms ease-out, box-shadow 120ms ease-out;
          "
        >
          <div
            style="
              position:relative;
              width:100%;
              padding-top:75%;
              border-radius:14px;
              overflow:hidden;
              background:linear-gradient(145deg,#E5E7EB,#F9FAFB);
            "
          >
            ${
              thumbnail
                ? `
              <img
                src="${thumbnail}"
                alt="${name}"
                style="
                  position:absolute;
                  inset:0;
                  width:100%;
                  height:100%;
                  object-fit:cover;
                "
              />
            `
                : `
              <div style="
                position:absolute;
                inset:0;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:12px;
                color:var(--text-secondary);
              ">
                Kein Preview verfügbar
              </div>
            `
            }
            <div style="
              position:absolute;
              top:8px;
              left:8px;
              padding:3px 9px;
              border-radius:999px;
              font-size:10px;
              font-weight:600;
              background:rgba(0,0,0,0.6);
              color:#ffffff;
              display:flex;
              align-items:center;
              gap:4px;
            ">
              <span style="
                display:inline-flex;
                width:14px;
                height:14px;
                border-radius:4px;
                background:#ffffff;
                align-items:center;
                justify-content:center;
                font-size:9px;
                font-weight:700;
                color:#000;
              ">
                M
              </span>
              Meta Creative
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:10px;">
            <div style="display:flex; justify-content:space-between; gap:10px;">
              <div style="
                font-size:13px;
                font-weight:600;
                white-space:nowrap;
                overflow:hidden;
                text-overflow:ellipsis;
                max-width:260px;
              ">
                ${name}
              </div>
              <div style="font-size:11px; color:var(--text-secondary); text-align:right;">
                Ad ID: ${creative.id}
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:8px;">
              ${buildKpiBar("ROAS (30D)", roasFormatted, normalizedRoas)}
              ${buildKpiBar("Spend (30D)", spendFormatted, normalizedSpend)}
              ${buildKpiBar("CTR (30D)", ctrFormatted, normalizedCtr)}
            </div>

            <div style="
              display:flex;
              justify-content:space-between;
              align-items:center;
              font-size:11px;
              color:var(--text-secondary);
            ">
              <span>Impr: <strong>${impressions.toLocaleString("de-DE")}</strong></span>
              <span>Clicks: <strong>${clicks.toLocaleString("de-DE")}</strong></span>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Card-Click → Detail-Modal
  grid.querySelectorAll(".creative-library-item").forEach((card) => {
    const adId = card.getAttribute("data-ad-id");
    const creative = creatives.find((c) => String(c.id) === String(adId));
    if (!creative) return;

    card.addEventListener("click", () => {
      openCreativeDetails(creative);
    });

    // Hover-Effekt
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
      card.style.boxShadow = "0 22px 50px rgba(15,23,42,0.18)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "0 16px 40px rgba(15,23,42,0.10)";
    });
  });
}

// ---------------------------------------------------------
// Detail-Modal für ein einzelnes Creative
// ---------------------------------------------------------

function openCreativeDetails(creative) {
  const metrics = creative.metrics || {};
  const name =
    creative.name ||
    creative.ad_name ||
    creative.headline ||
    "Unbenanntes Creative";

  const thumbnail =
    creative.thumbnail_url ||
    creative.preview_url ||
    creative.image_url ||
    null;

  const roas = asNumber(metrics.roas || metrics.purchase_roas);
  const spend = asNumber(metrics.spend || metrics.spend_30d);
  const ctr = asNumber(metrics.ctr || metrics.ctr_30d);
  const impressions = metrics.impressions || metrics.impressions_30d || 0;
  const clicks = metrics.clicks || metrics.clicks_30d || 0;
  const cpm = asNumber(metrics.cpm || metrics.cpm_30d || 0);
  const cpc = clicks ? spend / clicks : 0;

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px; max-width:720px;">
      <header style="display:flex; gap:20px; align-items:flex-start;">
        <div style="
          position:relative;
          width:180px;
          padding-top:120px;
          border-radius:14px;
          overflow:hidden;
          background:linear-gradient(145deg,#E5E7EB,#F9FAFB);
          flex-shrink:0;
        ">
          ${
            thumbnail
              ? `
            <img
              src="${thumbnail}"
              alt="${name}"
              style="
                position:absolute;
                inset:0;
                width:100%;
                height:100%;
                object-fit:cover;
              "
            />
          `
              : `
            <div style="
              position:absolute;
              inset:0;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:12px;
              color:var(--text-secondary);
            ">
              Kein Preview verfügbar
            </div>
          `
          }
          <div style="
            position:absolute;
            top:8px;
            left:8px;
            padding:3px 9px;
            border-radius:999px;
            font-size:10px;
            font-weight:600;
            background:rgba(0,0,0,0.65);
            color:#ffffff;
            display:flex;
            align-items:center;
            gap:4px;
          ">
            <span style="
              display:inline-flex;
              width:14px;
              height:14px;
              border-radius:4px;
              background:#ffffff;
              align-items:center;
              justify-content:center;
              font-size:9px;
              font-weight:700;
              color:#000;
            ">
              M
            </span>
            Meta Creative
          </div>
        </div>

        <div style="flex:1; display:flex; flex-direction:column; gap:10px;">
          <div>
            <h3 style="margin:0 0 4px 0; font-size:20px; font-weight:600;">
              ${name}
            </h3>
            <p style="margin:0; font-size:13px; color:var(--text-secondary);">
              Ad ID: <strong>${creative.id}</strong>
              ${
                creative.campaign_id || creative.campaignId
                  ? ` · Kampagne: <strong>${
                      creative.campaign_name || creative.campaignId || creative.campaign_id
                    }</strong>`
                  : ""
              }
            </p>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:8px; font-size:11px;">
            <span style="
              padding:4px 10px;
              border-radius:999px;
              background:rgba(99,102,241,0.08);
              color:var(--primary);
              font-weight:600;
              text-transform:uppercase;
            ">
              ${creative.status || "STATUS UNBEKANNT"}
            </span>
            ${
              creative.objective
                ? `<span style="padding:4px 10px; border-radius:999px; background:rgba(15,23,42,0.04);">
                     Ziel: ${creative.objective}
                   </span>`
                : ""
            }
          </div>
        </div>
      </header>

      <section style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">
        <div class="metric-chip">
          <div class="metric-label">ROAS (30D)</div>
          <div class="metric-value">${roas ? `${roas.toFixed(2)}x` : "0x"}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">Spend (30D)</div>
          <div class="metric-value">
            ${
              spend
                ? `€ ${spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`
                : "€ 0"
            }
          </div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">CTR (30D)</div>
          <div class="metric-value">${ctr ? `${ctr.toFixed(2)}%` : "0%"}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">Impressions (30D)</div>
          <div class="metric-value">${impressions.toLocaleString("de-DE")}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">Clicks (30D)</div>
          <div class="metric-value">${clicks.toLocaleString("de-DE")}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">CPM / CPC (30D)</div>
          <div class="metric-value">
            ${
              cpm
                ? `CPM: € ${cpm.toFixed(2)}`
                : "CPM: –"
            }
            ${
              cpc
                ? ` · CPC: € ${cpc.toFixed(2)}`
                : ""
            }
          </div>
        </div>
      </section>

      <section style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:13px; font-weight:600;">Geplante Sensei-Features (Placeholder)</div>
        <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-secondary);">
          <li>„AdSensei Score“ für dieses Creative (0–100) basierend auf Performance & Konsistenz.</li>
          <li>Hook-, Angle- und Offer-Breakdown inkl. Vorschlägen für neue Varianten.</li>
          <li>Button: „Neue Variation mit Sensei erzeugen“ (später: AI-Text & -Briefing).</li>
        </ul>
      </section>
    </div>
  `;

  openModal("Creative / Ad Details", html);
}
