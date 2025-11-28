// packages/campaigns/campaigns.table.js
// Tabellen-Rendering für Kampagnen

import {
    getCampaignInsights,
    formatMoney,
    formatRoas,
    formatPercent,
    formatInteger,
    getStatusLabel
} from "./campaigns.compute.js";

export function renderCampaignsTable(sortedCampaigns, tbody, onOpenDetails) {
    if (!tbody) return;

    tbody.innerHTML = sortedCampaigns
        .map((c) => {
            const insights = getCampaignInsights(c);
            const spend30 =
                insights.spend != null ? formatMoney(insights.spend) : "-";
            const roas30 = formatRoas(insights.roas);
            const ctr30 = formatPercent(insights.ctr);
            const imp30 = formatInteger(insights.impressions);

            const { label: statusLabel, className: statusClass } =
                getStatusLabel(c);
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

    tbody
        .querySelectorAll("[data-role='openCampaignDetails']")
        .forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                const id = btn.getAttribute("data-campaign-id");
                const campaign = sortedCampaigns.find((c) => c.id === id);
                if (campaign) onOpenDetails(campaign);
            });
        });
}
