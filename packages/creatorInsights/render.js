/*
 * Creator Insights Render
 * Zeigt eine Rangliste der Creator und ermöglicht einen Deep Dive
 * in einem System-Modal.
 */

import { aggregateByCreator } from "./compute.js";
import { renderProfile } from "./sections.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Creator Leaderboard";
  container.appendChild(heading);

  const description = document.createElement("p");
  description.textContent =
    "Sieh, welche Creator den größten Impact auf ROAS und Revenue haben.";
  container.appendChild(description);

  const creatives = [
    { id: 1, creator: "Mia", roas: 6.2, spend: 6200 },
    { id: 2, creator: "Tom", roas: 5.1, spend: 4800 },
    { id: 3, creator: "Mia", roas: 5.9, spend: 8200 },
    { id: 4, creator: "Lisa", roas: 4.8, spend: 3100 },
    { id: 5, creator: "Sarah", roas: 2.3, spend: 4200 },
  ];

  const list = aggregateByCreator(creatives).sort(
    (a, b) => b.avgRoas - a.avgRoas
  );

  const table = document.createElement("table");
  const header = document.createElement("tr");
  ["Creator", "Creatives", "Avg. ROAS", "Spend", "Aktion"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  list.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.creator}</td>
      <td>${item.count}</td>
      <td>${item.avgRoas.toFixed(2)}x</td>
      <td>€${item.spend.toLocaleString("de-DE")}</td>
      <td><button type="button" data-creator="${item.creator}">Profil</button></td>
    `;
    row.querySelector("button").onclick = () => {
      renderProfile(item);
    };
    table.appendChild(row);
  });

  container.appendChild(table);
}
