// packages/campaigns/campaigns.cards.js
// Card-Rendering für Kampagnen (Hybrid-View)

import {
    getCampaignInsights,
    formatMoney,
    formatRoas,
    formatPercent,
    formatInteger,
    getStatusLabel
} from "./campaigns.compute.js";

export function renderCampaignCards(sortedCampaigns, cardGrid, onOpenDetails) {
    if (!cardGrid) return;
    cardGrid.innerHTML = "";

    sortedCampaigns.forEach((c) => {
        const insights = getCampaignInsights(c);
        const spend30 =
            insights.spend != null ? formatMoney(insights.spend) : "-";
        const roas30 = formatRoas(insights.roas);
        const ctr30 = formatPercent(insights.ctr);
        const imp30 = formatInteger(insights.impressions);

        const { label: statusLabel, className: statusClass } =
            getStatusLabel(c);
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

        card.addEventListener("click", () => onOpenDetails(c));

        const btn = card.querySelector("[data-role='cardDetails']");
        if (btn) {
            btn.addEventListener("click", (e) => {
                e.stopPropagation();
                onOpenDetails(c);
            });
        }

        cardGrid.appendChild(card);
    });
}
