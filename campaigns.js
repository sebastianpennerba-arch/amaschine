// campaigns.js – SignalOne.cloud – PREMIUM HYBRID VIEW (Table + Cards)

import { AppState } from "./state.js";
import { openModal, showToast } from "./uiCore.js";

let campaignsViewInitialized = false;
let campaignsViewMode = "table"; // "table" | "cards"

/* ---------- FORMAT HELPERS ---------- */

function formatMoney(val) {
  if (val == null || isNaN(val)) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatInteger(val) {
  if (val == null || isNaN(val)) return "-";
  return new Intl.NumberFormat("de-DE").format(Math.round(val));
}

function formatRoas(val) {
  if (val == null || isNaN(val)) return "-";
  const v = Number(val);
  return v.toFixed(2).replace(".", ",") + "x";
}

function formatPercent(val) {
  if (val == null || isNaN(val)) return "-";
  let v = Number(val);
  // Wenn 0–1, dann als Anteil interpretieren
  if (v > 0 && v <= 1) v = v * 100;
  return v.toFixed(2).replace(".", ",") + " %";
}

/**
 * Holt Insight-Daten aus AppState.meta.insightsByCampaign
 * und normalisiert die wichtigsten KPIs.
 */
function getCampaignInsights(campaign) {
  const map = (AppState.meta && AppState.meta.insightsByCampaign) || {};
  const raw = map[campaign.id] || {};

  // Versuche sowohl *_30d als auch generische Keys zu unterstützen
  const spend =
    raw.spend_30d ??
    raw.spend ??
    raw.spend_value ??
    raw.spend_eur ??
    null;
  const roas =
    raw.roas_30d ??
    raw.roas ??
    raw.purchase_roas ??
    null;
  const ctr = raw.ctr_30d ?? raw.ctr ?? null;
  const impressions =
    raw.impressions_30d ??
    raw.impressions ??
    null;

  return { spend, roas, ctr, impressions };
}

/* ---------- VIEW INITIALISIERUNG ---------- */

function ensureCampaignsViewInitialized() {
  if (campaignsViewInitialized) return;
  campaignsViewInitialized = true;

  const searchInput = document.getElementById("campaignSearch");
  const statusSelect = document.getElementById("campaignStatusFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => updateCampaignsView());
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", () => updateCampaignsView());
  }

  // Toggle-Buttons (Tabelle <-> Cards) dynamisch in die Filter-Zeile einbauen
  const filterRow = document.querySelector(
    "#campaignsView .card:first-of-type > div"
  );
  if (filterRow) {
    const toggleWrapper = document.createElement("div");
    toggleWrapper.style.marginLeft = "auto";

    const toggle = document.createElement("div");
    toggle.dataset.role = "campaignsViewToggle";
    toggle.style.display = "inline-flex";
    toggle.style.borderRadius = "999px";
    toggle.style.border = "1px solid var(--border)";
    toggle.style.overflow = "hidden";

    const tableBtn = document.createElement("button");
    tableBtn.type = "button";
    tableBtn.textContent = "Tabelle";
    tableBtn.dataset.mode = "table";
    styleSegmentButton(tableBtn, true);

    const cardsBtn = document.createElement("button");
    cardsBtn.type = "button";
    cardsBtn.textContent = "Cards";
    cardsBtn.dataset.mode = "cards";
    styleSegmentButton(cardsBtn, false);

    toggle.appendChild(tableBtn);
    toggle.appendChild(cardsBtn);
    toggleWrapper.appendChild(toggle);
    filterRow.appendChild(toggleWrapper);

    const handleClick = (btn, mode) => {
      campaignsViewMode = mode;
      // aktive Styles umschalten
      styleSegmentButton(tableBtn, mode === "table");
      styleSegmentButton(cardsBtn, mode === "cards");
      updateCampaignsView();
    };

    tableBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleClick(tableBtn, "table");
    });
    cardsBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      handleClick(cardsBtn, "cards");
    });
  }

  ensureCardContainerExists();
}

function styleSegmentButton(btn, active) {
  btn.style.padding = "6px 12px";
  btn.style.fontSize = "12px";
  btn.style.fontWeight = active ? "600" : "500";
  btn.style.border = "none";
  btn.style.cursor = "pointer";
  btn.style.backgroundColor = active
    ? "var(--color-primary)"
    : "var(--color-background)";
  btn.style.color = active ? "#fff" : "var(--text-secondary)";
  btn.style.transition = "background-color 0.15s, color 0.15s";
}

/**
 * Baut eine Card unterhalb der Kampagnentabelle ein,
 * in der die Karten-Ansicht gerendert wird.
 * Nutzt existierende Creative-Library-Klassen für das Layout.
 */
function ensureCardContainerExists() {
  const view = document.getElementById("campaignsView");
  if (!view) return null;

  let cardContainer = document.getElementById("campaignsCardContainer");
  if (cardContainer) return cardContainer;

  const tableCard = view
    .querySelector(".card table.campaigns-table")
    ?.closest(".card");

  if (!tableCard || !tableCard.parentNode) return null;

  cardContainer = document.createElement("div");
  cardContainer.className = "card";
  cardContainer.id = "campaignsCardContainer";
  cardContainer.style.display = "none"; // initial versteckt

  const innerGrid = document.createElement("div");
  innerGrid.className = "creative-library-grid"; // bereits definierte Grid-Styles
  innerGrid.id = "campaignsCardGrid";

  cardContainer.appendChild(innerGrid);
  tableCard.parentNode.insertBefore(cardContainer, tableCard.nextSibling);

  return cardContainer;
}

/* ---------- HAUPTFUNKTION: VIEW RENDERN ---------- */

export function updateCampaignsView() {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  ensureCampaignsViewInitialized();
  const cardContainer = ensureCardContainerExists();
  const cardGrid = cardContainer
    ? document.getElementById("campaignsCardGrid")
    : null;

  const allCampaigns = AppState.meta?.campaigns || [];

  const searchVal = (
    document.getElementById("campaignSearch")?.value || ""
  ).toLowerCase();
  const statusFilter =
    document.getElementById("campaignStatusFilter")?.value || "all";

  // Filter
  let campaigns = allCampaigns.filter((c) => {
    const name = (c.name || "").toLowerCase();
    const idStr = (c.id || "").toLowerCase();
    const matchesSearch =
      !searchVal || name.includes(searchVal) || idStr.includes(searchVal);

    const status = (c.status || "").toUpperCase();
    const matchesStatus =
      statusFilter === "all" || status === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // Sortierung nach Spend (30D) desc, falls vorhanden
  campaigns.sort((a, b) => {
    const ia = getCampaignInsights(a);
    const ib = getCampaignInsights(b);
    const sa = ia.spend || 0;
    const sb = ib.spend || 0;
    return sb - sa;
  });

  /* ----- Tabelle ----- */
  tbody.innerHTML = "";

  if (!campaigns.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.textContent = "Keine Kampagnen für diesen Filter gefunden.";
    tr.appendChild(td);
    tbody.appendChild(tr);
  } else {
    campaigns.forEach((c) => {
      const tr = document.createElement("tr");
      tr.classList.add("clickable-row");
      tr.addEventListener("click", () => openCampaignModal(c));

      const created = c.created_time
        ? new Date(c.created_time).toLocaleDateString("de-DE")
        : "-";

      const dailyBudget =
        typeof c.daily_budget !== "undefined"
          ? formatMoney(Number(c.daily_budget) / 100)
          : "-";

      const insights = getCampaignInsights(c);
      const spend30 = insights.spend != null ? formatMoney(insights.spend) : "-";
      const roas30 = formatRoas(insights.roas);
      const ctr30 = formatPercent(insights.ctr);
      const imp30 = formatInteger(insights.impressions);

      const statusLabel = c.status || "-";

      tr.innerHTML = `
        <td>${statusLabel}</td>
        <td>${c.name || "-"}</td>
        <td>${c.objective || "-"}</td>
        <td>${dailyBudget}</td>
        <td>${spend30}</td>
        <td>${roas30}</td>
        <td>${ctr30}</td>
        <td>${imp30}</td>
        <td>
          <button
            type="button"
            class="action-button"
            data-campaign-id="${c.id || ""}"
            data-row-action="details"
          >
            Details
          </button>
        </td>
      `;

      const detailsBtn = tr.querySelector("[data-row-action='details']");
      if (detailsBtn) {
        detailsBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          openCampaignModal(c);
        });
      }

      tbody.appendChild(tr);
    });
  }

  // Tabelle / Cards ein- bzw. ausblenden
  const tableCard = document
    .querySelector("#campaignsView .card table.campaigns-table")
    ?.closest(".card");

  if (tableCard) {
    tableCard.style.display = campaignsViewMode === "table" ? "block" : "none";
  }
  if (cardContainer) {
    cardContainer.style.display = campaignsViewMode === "cards" ? "block" : "none";
  }

  /* ----- Karten-View (DatAds-Style, wiederverwendete Creative-Library-Styles) ----- */
  if (cardGrid) {
    cardGrid.innerHTML = "";

    if (!campaigns.length) {
      const empty = document.createElement("p");
      empty.style.color = "var(--text-secondary)";
      empty.style.fontSize = "14px";
      empty.textContent = "Keine Kampagnen für diesen Filter gefunden.";
      cardGrid.appendChild(empty);
      return;
    }

    campaigns.forEach((c) => {
      const insights = getCampaignInsights(c);
      const spend30 = insights.spend != null ? formatMoney(insights.spend) : "-";
      const roas30 = formatRoas(insights.roas);
      const ctr30 = formatPercent(insights.ctr);
      const imp30 = formatInteger(insights.impressions);

      const statusLabel = c.status || "-";
      const objective = c.objective || "-";

      const card = document.createElement("article");
      // Re-use Creative Library Card Layout für konsistenten DatAds-Look
      card.className = "creative-library-item";
      card.style.cursor = "pointer";

      card.innerHTML = `
        <div class="creative-stats">
          <div class="creative-name-library">
            ${c.name || "Unbenannte Kampagne"}
          </div>
          <div class="creative-meta">
            ${objective} • ${statusLabel} • ID: ${c.id || "-"}
          </div>

          <div class="creative-footer-kpis">
            <div class="kpi-footer-item">
              Spend (30D)<br><strong>${spend30}</strong>
            </div>
            <div class="kpi-footer-item">
              ROAS (30D)<br><strong>${roas30}</strong>
            </div>
            <div class="kpi-footer-item">
              CTR (30D)<br><strong>${ctr30}</strong>
            </div>
            <div class="kpi-footer-item">
              Impr. (30D)<br><strong>${imp30}</strong>
            </div>
          </div>
        </div>
      `;

      card.addEventListener("click", () => openCampaignModal(c));

      cardGrid.appendChild(card);
    });
  }
}

/* ---------- MODAL & AKTIONEN ---------- */

function openCampaignModal(campaign) {
  const insights = getCampaignInsights(campaign);

  const dailyBudget =
    typeof campaign.daily_budget !== "undefined"
      ? formatMoney(Number(campaign.daily_budget) / 100)
      : "-";

  const createdFull = campaign.created_time
    ? new Date(campaign.created_time).toLocaleString("de-DE")
    : "-";

  const spend30 = insights.spend != null ? formatMoney(insights.spend) : "-";
  const roas30 = formatRoas(insights.roas);
  const ctr30 = formatPercent(insights.ctr);
  const imp30 = formatInteger(insights.impressions);

  const html = `
    <div class="campaign-modal-section">
      <h3>Basisdaten</h3>
      <p><strong>Name:</strong> ${campaign.name || "-"}</p>
      <p><strong>Status:</strong> ${campaign.status || "-"}</p>
      <p><strong>Objective:</strong> ${campaign.objective || "-"}</p>
      <p><strong>ID:</strong> ${campaign.id || "-"}</p>
    </div>

    <div class="campaign-modal-section">
      <h3>Budget & Zeit</h3>
      <p><strong>Daily Budget:</strong> ${dailyBudget}</p>
      <p><strong>Erstellt:</strong> ${createdFull}</p>
    </div>

    <div class="campaign-modal-section">
      <h3>Performance (letzte 30 Tage)</h3>
      <p><strong>Spend:</strong> ${spend30}</p>
      <p><strong>ROAS:</strong> ${roas30}</p>
      <p><strong>CTR:</strong> ${ctr30}</p>
      <p><strong>Impressions:</strong> ${imp30}</p>
      <p style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">
        Zahlen stammen aus Meta-Insights (falls geladen). In Demo- oder
        Offline-Modus können Werte leer oder 0 sein.
      </p>
    </div>

    <div class="campaign-modal-section">
      <h3>Aktionen (Demo)</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom:8px;">
        Diese Buttons simulieren das Verhalten des Meta Ads Managers. 
        Später werden hier echte Live-Aktionen angebunden.
      </p>
      <div style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:8px;">
        <button class="action-button" data-campaign-action="pause">
          Kampagne stoppen
        </button>
        <button class="action-button" data-campaign-action="start">
          Kampagne starten
        </button>
        <button class="action-button" data-campaign-action="edit">
          Kampagne bearbeiten
        </button>
      </div>
    </div>
  `;

  openModal("Kampagnen-Details", html);
  wireCampaignModalActions(campaign);
}

function wireCampaignModalActions(campaign) {
  const overlay = document.querySelector(".modal-overlay");
  if (!overlay) return;

  const buttons = overlay.querySelectorAll("[data-campaign-action]");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.getAttribute("data-campaign-action");
      handleCampaignAction(action, campaign);
    });
  });
}

function handleCampaignAction(action, campaign) {
  const name = campaign.name || campaign.id || "Kampagne";

  if (action === "pause") {
    showToast(
      "info",
      `„${name}“ würde jetzt im Meta Ads Manager pausiert werden. (Demo-Modus)`
    );
  } else if (action === "start") {
    showToast(
      "info",
      `„${name}“ würde jetzt gestartet/reaktiviert werden. (Demo-Modus)`
    );
  } else if (action === "edit") {
    showToast(
      "info",
      `„${name}“ würde jetzt zur Bearbeitung im Meta Ads Manager geöffnet. (Demo-Modus)`
    );
  } else {
    showToast("info", "Aktion im Demo-Modus – keine Live-Änderung.");
  }
}
