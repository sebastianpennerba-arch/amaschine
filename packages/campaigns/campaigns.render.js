// packages/campaigns/campaigns.render.js
// Orchestrierung: Table / Cards, View-Toggle, Empty-State

import { AppState } from "../../state.js";
import { sortCampaignsBySpend } from "./campaigns.compute.js";
import { renderCampaignsTable } from "./campaigns.table.js";
import { renderCampaignCards } from "./campaigns.cards.js";
import { openCampaignModal } from "./campaigns.modal.js";

let campaignsViewInitialized = false;
let campaignsViewMode = "table"; // "table" | "cards"

function ensureCardContainerExists() {
    const view = document.getElementById("campaignsView");
    if (!view) return null;

    let cardContainer = document.getElementById("campaignsCardContainer");
    if (cardContainer) return cardContainer;

    cardContainer = document.createElement("div");
    cardContainer.id = "campaignsCardContainer";
    cardContainer.style.display = "none";
    cardContainer.className = "card";

    const innerGrid = document.createElement("div");
    innerGrid.id = "campaignsCardGrid";
    innerGrid.className = "campaigns-card-grid";

    cardContainer.appendChild(innerGrid);

    const tableWrapper = document.getElementById("campaignsTableWrapper");
    if (tableWrapper && tableWrapper.parentNode) {
        tableWrapper.parentNode.insertBefore(cardContainer, tableWrapper.nextSibling);
    } else {
        view.appendChild(cardContainer);
    }

    return cardContainer;
}

function ensureCampaignsViewInitialized() {
    if (campaignsViewInitialized) return;
    campaignsViewInitialized = true;

    const toggle = document.querySelector('[data-role="campaignsViewToggle"]');
    const tableBtn = document.getElementById("campaignsViewTableBtn");
    const cardsBtn = document.getElementById("campaignsViewCardsBtn");

    if (toggle && tableBtn && cardsBtn) {
        const setActive = (mode) => {
            campaignsViewMode = mode;
            tableBtn.classList.toggle("active", mode === "table");
            cardsBtn.classList.toggle("active", mode === "cards");

            const tableEl = document.getElementById("campaignsTableWrapper");
            const cardEl = document.getElementById("campaignsCardContainer");

            if (tableEl) tableEl.style.display = mode === "table" ? "block" : "none";
            if (cardEl) cardEl.style.display = mode === "cards" ? "block" : "none";
        };

        tableBtn.addEventListener("click", (e) => {
            e.preventDefault();
            setActive("table");
            renderCampaignsInternal();
        });

        cardsBtn.addEventListener("click", (e) => {
            e.preventDefault();
            setActive("cards");
            renderCampaignsInternal();
        });

        setActive(campaignsViewMode);
    }

    ensureCardContainerExists();
}

function renderCampaignsInternal() {
    const tbody = document.getElementById("campaignsTableBody");
    const cardContainer = ensureCardContainerExists();
    const cardGrid = cardContainer
        ? document.getElementById("campaignsCardGrid")
        : null;

    const campaigns = AppState.meta?.campaigns || [];

    if (!tbody || !cardGrid) return;

    const sorted = sortCampaignsBySpend(campaigns);

    renderCampaignsTable(sorted, tbody, openCampaignModal);
    renderCampaignCards(sorted, cardGrid, openCampaignModal);
}

export function renderCampaignsView(connected) {
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

    renderCampaignsInternal();
}
