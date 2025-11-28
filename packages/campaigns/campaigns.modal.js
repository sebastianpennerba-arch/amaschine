// packages/campaigns/campaigns.modal.js
// Deep-Dive-Kampagnenmodal + Aktionen

import { AppState } from "../../state.js";
import { openModal, showToast } from "../../uiCore.js";
import {
    getCampaignInsights,
    formatMoney,
    formatRoas,
    formatPercent,
    formatInteger,
    buildSenseiCampaignInsight
} from "./campaigns.compute.js";

export function openCampaignModal(campaign) {
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
    const overlay =
        document.getElementById("modalOverlay") ||
        document.querySelector(".modal-overlay");
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
        showToast(
            "info",
            `„${name}“ würde jetzt pausiert werden. (Demo-Modus)`
        );
    } else if (action === "scale_up") {
        showToast(
            "success",
            `Sensei würde empfehlen: Budget von „${name}“ um ca. 30 % zu erhöhen. (Demo-Modus)`
        );
    } else if (action === "scale_down") {
        showToast(
            "info",
            `Budget von „${name}“ würde um ca. 20 % reduziert werden. (Demo-Modus)`
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
