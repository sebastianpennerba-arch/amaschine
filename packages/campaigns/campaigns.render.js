// packages/campaigns/campaigns.render.js
// Orchestriert Tabelle + Events für Campaigns View.

import { renderCampaignsTable } from "./campaigns.table.js";
import { openCampaignDetailModal } from "./campaigns.modal.js";

let lastCampaigns = [];

export function renderCampaigns(state) {
    const campaigns = state?.items || [];
    lastCampaigns = campaigns;

    renderCampaignsTable(campaigns);
    attachRowHandlers();
}

function attachRowHandlers() {
    document.querySelectorAll(".campaign-details-btn").forEach((btn) => {
        const id = btn.getAttribute("data-campaign-id");
        btn.addEventListener("click", () => {
            const campaign = lastCampaigns.find((c) => c.id === id);
            if (campaign) openCampaignDetailModal(campaign);
        });
    });
}
