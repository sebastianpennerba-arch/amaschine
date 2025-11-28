/*
 * Campaigns Render
 * Zeigt eine Tabelle aller Kampagnen mit Kennzahlen, Status-Badges
 * und einem Detail-Button, der das zentrale System-Modal nutzt.
 */

import { computeCampaignStats } from "./compute.js";
import { renderCampaignDetail } from "./sections.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Kampagnen-Übersicht";
  container.appendChild(heading);

  // Beispiel-Kampagnen – später via Meta/API ersetzen
  const campaigns = [
    {
      id: 1,
      name: "Brand Awareness",
      spend: 12890,
      roas: 2.1,
      ctr: 0.014,
    },
    {
      id: 2,
      name: "UGC Scale Test",
      spend: 18420,
      roas: 5.8,
      ctr: 0.039,
    },
    {
      id: 3,
      name: "Retargeting Cold",
      spend: 8340,
      roas: 1.3,
      ctr: 0.009,
    },
    {
      id: 4,
      name: "Testing: Hook Battle",
      spend: 2100,
      roas: 4.2,
      ctr: 0.031,
    },
  ];

  const enriched = computeCampaignStats(campaigns);

  const table = document.createElement("table");
  table.className = "campaign-table";

  const headerRow = document.createElement("tr");
  ["Kampagne", "Spend", "ROAS", "CTR", "Status", "Action"].forEach((col) => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);

  enriched.forEach((c) => {
    const row = document.createElement("tr");

    const statusBadge = `<span class="badge ${badgeClassForStatus(
      c.status
    )}">${labelForStatus(c.status)}</span>`;

    row.innerHTML = `
      <td>${c.name}</td>
      <td>€${c.spend.toLocaleString("de-DE")}</td>
      <td>${c.roas.toFixed(2)}x</td>
      <td>${(c.ctr * 100).toFixed(2)} %</td>
      <td>${statusBadge}</td>
      <td><button type="button" data-id="${c.id}">Details</button></td>
    `;

    const btn = row.querySelector("button");
    btn.onclick = () => {
      renderCampaignDetail(c, AppState);
    };

    table.appendChild(row);
  });

  container.appendChild(table);
}

function badgeClassForStatus(status) {
  switch (status) {
    case "scaling":
      return "badge-online";
    case "watch":
      return "badge-warning";
    case "failing":
      return "badge-offline";
    default:
      return "badge-offline";
  }
}

function labelForStatus(status) {
  switch (status) {
    case "scaling":
      return "Scaling";
    case "watch":
      return "Review";
    case "failing":
      return "Failing";
    default:
      return status;
  }
}
