// campaigns.js – SignalOne.cloud – FINAL

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";

function formatMoney(val) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(val || 0);
}

export function updateCampaignsView() {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  const campaigns = AppState.meta.campaigns || [];
  if (!campaigns.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 5;
    td.textContent = "Keine Kampagnen gefunden.";
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }

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

    tr.innerHTML = `
      <td>${c.name || "-"}</td>
      <td>${c.status || "-"}</td>
      <td>${c.objective || "-"}</td>
      <td>${dailyBudget}</td>
      <td>${created}</td>
    `;

    tbody.appendChild(tr);
  });
}

function openCampaignModal(campaign) {
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
      <p><strong>Daily Budget:</strong> ${
        campaign.daily_budget
          ? formatMoney(Number(campaign.daily_budget) / 100)
          : "-"
      }</p>
      <p><strong>Erstellt:</strong> ${
        campaign.created_time
          ? new Date(campaign.created_time).toLocaleString("de-DE")
          : "-"
      }</p>
    </div>
    <div class="campaign-modal-section">
      <p>Weitere Insights werden im Dashboard/Insights-Bereich geladen.</p>
    </div>
  `;

  openModal("Kampagnen-Details", html);
}
