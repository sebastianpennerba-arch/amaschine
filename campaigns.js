// campaigns.js – SignalOne.cloud – PREMIUM HYBRID VIEW (Table + Cards + Deep Dive)

import { AppState } from "./state.js";
import { openModal, showToast } from "./uiCore.js";

let campaignsViewInitialized = false;
let campaignsViewMode = "table"; // "table" | "cards"

/* ----------------------------------------------------
   FORMAT HELPERS
-----------------------------------------------------*/

function formatMoney(val) {
  if (val == null || isNaN(val)) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2
  }).format(val || 0);
}

function formatInteger(val) {
  if (val == null || isNaN(val)) return "-";
  return new Intl.NumberFormat("de-DE").format(val || 0);
}

function formatPercent(val) {
  if (val == null || isNaN(val)) return "-";
  return `${Number(val).toFixed(2)}%`;
}

function formatRoas(val) {
  if (val == null || isNaN(val)) return "-";
  return `${Number(val).toFixed(2)}x`;
}

/* ----------------------------------------------------
   INSIGHTS
-----------------------------------------------------*/

function getCampaignInsights(campaign) {
  if (!campaign || !campaign.id) return {};
  const map = AppState.meta?.insightsByCampaign || {};
  const raw = map[campaign.id] || {};

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
  const impressions = raw.impressions_30d ?? raw.impressions ?? null;

  return {
    spend,
    roas,
    ctr,
    impressions
  };
}

function getStatusLabel(campaign) {
  const status = campaign.status || campaign.effective_status || "UNKNOWN";
  switch (status) {
    case "ACTIVE":
      return { label: "Aktiv", className: "status-pill active" };
    case "PAUSED":
      return { label: "Pausiert", className: "status-pill paused" };
    case "DELETED":
      return { label: "Gelöscht", className: "status-pill deleted" };
    default:
      return { label: status, className: "status-pill unknown" };
  }
}

/* ----------------------------------------------------
   VIEW INITIALIZATION
-----------------------------------------------------*/

function ensureCampaignsViewInitialized() {
  if (campaignsViewInitialized) return;
  campaignsViewInitialized = true;

  // Optional: View Mode Toggle, wenn Elemente existieren
  const toggle = document.querySelector('[data-role="campaignsViewToggle"]');
  const tableBtn = document.getElementById("campaignsViewTableBtn");
  const cardsBtn = document.getElementById("campaignsViewCardsBtn");

  if (toggle && tableBtn && cardsBtn) {
    const setActive = (mode) => {
      campaignsViewMode = mode;
      tableBtn.classList.toggle("active", mode === "table");
      cardsBtn.classList.toggle("active", mode === "cards");

      const tableEl = document.getElementById("campaignsTableWrapper");
      const cardsEl = document.getElementById("campaignsCardContainer");

      if (tableEl) tableEl.style.display = mode === "table" ? "block" : "none";
      if (cardsEl) cardsEl.style.display = mode === "cards" ? "block" : "none";
    };

    tableBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("table");
      renderCampaigns();
    });

    cardsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      setActive("cards");
      renderCampaigns();
    });

    // Initial
    setActive(campaignsViewMode);
  }

  ensureCardContainerExists();
}

function ensureCardContainerExists() {
  const view = document.getElementById("campaignsView");
  if (!view) return null;

  let cardContainer = document.getElementById("campaignsCardContainer");
  if (cardContainer) return cardContainer;

  // Fallback: neues Card-Container-Element
  cardContainer = document.createElement("div");
  cardContainer.id = "campaignsCardContainer";
  cardContainer.style.display = "none";
  cardContainer.className = "card";

  const innerGrid = document.createElement("div");
  innerGrid.id = "campaignsCardGrid";
  innerGrid.className = "campaigns-card-grid";

  cardContainer.appendChild(innerGrid);

  // Versuche, nach der Tabelle einzufügen
  const tableWrapper = document.getElementById("campaignsTableWrapper");
  if (tableWrapper && tableWrapper.parentNode) {
    tableWrapper.parentNode.insertBefore(cardContainer, tableWrapper.nextSibling);
  } else {
    view.appendChild(cardContainer);
  }

  return cardContainer;
}

/* ----------------------------------------------------
   PUBLIC API
-----------------------------------------------------*/

export function updateCampaignsView(connected) {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  ensureCampaignsViewInitialized();

  if (!connected || !AppState.metaConnected) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; color:var(--text-secondary); padding:16px;">
          Mit Meta verbinden, um Kampagnen zu laden.
        </td>
      </tr>
    `;
    const grid = document.getElementById("campaignsCardGrid");
    if (grid) grid.innerHTML = "";
    return;
  }

  renderCampaigns();
}

/* ----------------------------------------------------
   RENDER – TABLE & CARDS
-----------------------------------------------------*/

function renderCampaigns() {
  const campaigns = AppState.meta?.campaigns || [];
  const tbody = document.getElementById("campaignsTableBody");
  const cardContainer = ensureCardContainerExists();
  const cardGrid = cardContainer
    ? document.getElementById("campaignsCardGrid")
    : null;

  if (!tbody || !cardGrid) return;

  // Sortierung: Spend (30D) desc
  const sorted = [...campaigns].sort((a, b) => {
    const ia = getCampaignInsights(a).spend || 0;
    const ib = getCampaignInsights(b).spend || 0;
    return ib - ia;
  });

  // TABLE
  tbody.innerHTML = sorted
    .map((c) => {
      const insights = getCampaignInsights(c);
      const spend30 = insights.spend != null ? formatMoney(insights.spend) : "-";
      const roas30 = formatRoas(insights.roas);
      const ctr30 = formatPercent(insights.ctr);
      const imp30 = formatInteger(insights.impressions);

      const { label: statusLabel, className: statusClass } = getStatusLabel(c);
      const objective = c.objective || "Unbekannt";

      return `
        <tr data-campaign-id="${c.id || ""}" class="campaign-row">
          <td>
            <div class="campaign-name-cell">
              <span class="campaign-name-main">${c.name || "Unbenannte Kampagne"}</span>
              <span class="campaign-name-sub">${objective}</span>
            </div>
          </td>
          <td>${spend30}</td>
          <td>${roas30}</td>
          <td>${ctr30}</td>
          <td>${imp30}</td>
          <td>
            <span class="${statusClass}">
              ${statusLabel}
            </span>
          </td>
          <td>
            <button class="action-button-secondary" data-role="openCampaignDetails" data-campaign-id="${c.id}">
              Details
            </button>
          </td>
        </tr>
      `;
    })
    .join("");

  // TABLE Event Listener
  tbody.querySelectorAll("[data-role='openCampaignDetails']").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute("data-campaign-id");
      const campaign = sorted.find((c) => c.id === id);
      if (campaign) openCampaignModal(campaign);
    });
  });

  // CARDS
  cardGrid.innerHTML = "";
  sorted.forEach((c) => {
    const insights = getCampaignInsights(c);
    const spend30 = insights.spend != null ? formatMoney(insights.spend) : "-";
    const roas30 = formatRoas(insights.roas);
    const ctr30 = formatPercent(insights.ctr);
    const imp30 = formatInteger(insights.impressions);

    const { label: statusLabel, className: statusClass } = getStatusLabel(c);
    const objective = c.objective || "Unbekannt";

    const card = document.createElement("div");
    card.className = "creative-library-item";
    card.style.cursor = "pointer";

    card.innerHTML = `
      <div class="creative-stats">
        <div class="creative-name-library">
          ${c.name || "Unbenannte Kampagne"}
        </div>
        <div class="creative-meta">
          ${objective} • <span class="${statusClass}">${statusLabel}</span>
        </div>

        <div class="creative-footer-kpis">
          <div class="kpi-footer-item">
            Spend (30D)<br><strong>${spend30}</strong>
          </div>
          <div class="kpi-footer-item">
            ROAS<br><strong>${roas30}</strong>
          </div>
          <div class="kpi-footer-item">
            CTR<br><strong>${ctr30}</strong>
          </div>
          <div class="kpi-footer-item">
            Impressions<br><strong>${imp30}</strong>
          </div>
        </div>

        <div style="margin-top:10px;">
          <button class="action-button-secondary small" data-role="cardDetails">Details</button>
        </div>
      </div>
    `;

    card.addEventListener("click", () => openCampaignModal(c));

    const btn = card.querySelector("[data-role='cardDetails']");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openCampaignModal(c);
      });
    }

    cardGrid.appendChild(card);
  });
}

/* ----------------------------------------------------
   MODAL & SENSEI INSIGHT
-----------------------------------------------------*/

function buildSenseiCampaignInsight(campaign, insights) {
  const roas = Number(insights.roas ?? 0);
  const ctr = Number(insights.ctr ?? 0);
  const spend = Number(insights.spend ?? 0);

  if (!spend) {
    return "Noch zu wenig Daten, um eine sinnvolle Empfehlung zu geben. Lass die Kampagne etwas länger laufen oder erhöhe das Budget.";
  }

  if (roas >= 4 && ctr >= 3) {
    return "Top Performer: Diese Kampagne gehört zu deinen stärksten Setups. Sensei Empfehlung: Budget schrittweise (+20–30 %) erhöhen, solange ROAS stabil über 4x bleibt.";
  }

  if (roas >= 2 && ctr >= 2) {
    return "Solide Performance. Nutze die Kampagne als Benchmark und teste neue Creatives innerhalb dieses Setups, um weitere Winner zu finden.";
  }

  if (roas < 1.5 && ctr < 1.5) {
    return "Warnsignal: ROAS und CTR sind niedrig. Sensei Empfehlung: Budget begrenzen, schwache Creatives pausieren und einen strukturierten Hook- oder Offer-Test starten.";
  }

  if (roas < 1.5 && ctr >= 2) {
    return "CTR ist okay, aber ROAS zieht nicht nach. Angebot, Pricing oder Funnel nach dem Klick prüfen – die Anzeige holt die Leute rein, aber sie konvertieren nicht.";
  }

  return "Gemischtes Bild. Behalte die Kampagne im Auge und nutze sie vor allem als Test-Bühne für neue Creatives und Hooks.";
}

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

  const status = campaign.status || campaign.effective_status || "UNKNOWN";
  const objective = campaign.objective || "Unbekannt";

  // kleine Heuristik für Trend & Hinweis
  let trendLabel = "Stabil";
  let trendBadge = "neutral";
  if (insights.roas && insights.roas >= 4) {
    trendLabel = "Top Performer";
    trendBadge = "good";
  } else if (insights.roas && insights.roas < 1.5) {
    trendLabel = "Kritisch";
    trendBadge = "bad";
  }

  const kpiRow = (label, value) => `
      <div class="kpi-row">
        <span class="kpi-row-label">${label}</span>
        <span class="kpi-row-value">${value}</span>
      </div>
  `;

  const html = `
    <div class="campaign-modal-grid">
      <div class="campaign-modal-col">
        <div class="campaign-modal-section">
          <h3>${campaign.name || "Kampagne"}</h3>
          <p class="campaign-meta-line">
            Ziel: <strong>${objective}</strong> &nbsp;•&nbsp;
            Status: <strong>${status}</strong>
          </p>
          <p class="campaign-meta-line">
            Angelegt: ${createdFull}<br>
            Tagesbudget: <strong>${dailyBudget}</strong>
          </p>
          <div class="campaign-trend-badge campaign-trend-${trendBadge}">
            ${trendLabel}
          </div>
        </div>

        <div class="campaign-modal-section">
          <h4>📊 Letzte 30 Tage</h4>
          <div class="campaign-kpi-grid">
            ${kpiRow("Spend", spend30)}
            ${kpiRow("ROAS", roas30)}
            ${kpiRow("CTR", ctr30)}
            ${kpiRow("Impressions", imp30)}
          </div>
          <p class="campaign-note">
            KPIs basieren auf Meta-Insights (wenn geladen). Im Demo-Modus werden Beispielwerte angezeigt.
          </p>
        </div>

        <div class="campaign-modal-section">
          <h4>🧠 Sensei Einschätzung</h4>
          <p class="campaign-sensei-text">
            ${buildSenseiCampaignInsight(campaign, insights)}
          </p>
        </div>
      </div>

      <div class="campaign-modal-col">
        <div class="campaign-modal-section">
          <h4>📈 Performance Story</h4>
          <p class="campaign-story">
            Diese Kampagne hat in den letzten 30 Tagen ${imp30} Impressions erzeugt.
            Mit einer CTR von ${ctr30} und einem ROAS von ${roas30} ergibt sich ein
            Gesamt-Spend von ${spend30}. 
          </p>
          <p class="campaign-story">
            Nutze diese Kampagne als Benchmark für ähnliche Zielgruppen & Creatives –
            oder als Warnsignal, wenn ROAS und CTR in den nächsten Tagen fallen.
          </p>
        </div>

        <div class="campaign-modal-section">
          <h4>⚙️ Empfohlene Aktionen (Demo)</h4>
          <p class="campaign-note">
            Diese Buttons simulieren Meta Ads Manager Aktionen. Später können hier echte API-Calls angebunden werden.
          </p>
          <div class="campaign-actions-row">
            <button class="action-button" data-campaign-action="scale_up">Budget +30%</button>
            <button class="action-button-secondary" data-campaign-action="scale_down">Budget -20%</button>
            <button class="action-button-secondary" data-campaign-action="pause">Pausieren</button>
            <button class="action-button-secondary" data-campaign-action="edit">Im Ads Manager öffnen</button>
          </div>
        </div>

        <div class="campaign-modal-section">
          <h4>🔗 Verknüpfte Elemente</h4>
          <ul class="campaign-linked-list">
            <li>Account: <strong>${AppState.selectedAccountId || "Aktuelles Werbekonto"}</strong></li>
            <li>Kampagnen-ID: <strong>${campaign.id}</strong></li>
            <li>Objektiv: <strong>${objective}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  `;

  openModal("Kampagnen-Details", html);
  wireCampaignModalActions(campaign);
}

function wireCampaignModalActions(campaign) {
  const overlay = document.getElementById("modalOverlay") || document.querySelector(".modal-overlay");
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
  const name = campaign.name || "Kampagne";

  if (action === "pause") {
    showToast("info", `„${name}“ würde jetzt pausiert werden. (Demo-Modus)`);
  } else if (action === "scale_up") {
    showToast("success", `Sensei würde empfehlen: Budget von „${name}“ um ca. 30 % zu erhöhen. (Demo-Modus)`);
  } else if (action === "scale_down") {
    showToast("info", `Budget von „${name}“ würde um ca. 20 % reduziert werden. (Demo-Modus)`);
  } else if (action === "edit") {
    showToast("info", `„${name}“ würde jetzt zur Bearbeitung im Meta Ads Manager geöffnet. (Demo-Modus)`);
  } else {
    showToast("info", "Aktion im Demo-Modus – keine Live-Änderung.");
  }
}
