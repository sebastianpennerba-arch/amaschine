/*
 * Testing Log Render
 * Stellt aktuelle Tests und deren Status dar und zeigt Detailinfos
 * im System-Modal.
 */

import { createTest, predictWinner } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Testing Log";
  container.appendChild(heading);

  // Beispieldaten – später über State/API ersetzen
  const tests = [
    createTest(47, "Hook Battle – Problem vs. Testimonial", [
      "Problem/Solution Hook",
      "Testimonial Hook",
    ]),
    createTest(46, "Creator Battle – Mia vs. Sarah", ["Mia", "Sarah"]),
  ];

  const table = document.createElement("table");
  table.className = "test-table";
  const header = document.createElement("tr");
  ["Name", "Hypothese", "Status", "Aktion"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    header.appendChild(th);
  });
  table.appendChild(header);

  tests.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${t.name}</td>
      <td>${t.hypothesis}</td>
      <td>${t.status}</td>
      <td><button type="button" data-id="${t.id}">Details</button></td>
    `;
    row.querySelector("button").onclick = () => showTestDetail(t);
    table.appendChild(row);
  });

  container.appendChild(table);
}

function showTestDetail(test) {
  const api = window.SignalOne || {};
  const openSystemModal = api.openSystemModal || fallbackModal;

  const winnerPrediction = predictWinner(test);
  const title = `Test-Details: ${test.name}`;

  const variants =
    test.variants && test.variants.length
      ? `<ul>${test.variants
          .map((v) => `<li>${v}</li>`)
          .join("")}</ul>`
      : "<p>Keine Varianten hinterlegt.</p>";

  const body = `
    <div class="test-detail">
      <p><strong>Hypothese:</strong> ${test.hypothesis}</p>
      <p><strong>Status:</strong> ${test.status}</p>
      <h3>Varianten</h3>
      ${variants}
      <h3>Sensei Prediction</h3>
      <p>${winnerPrediction || "Noch keine Vorhersage verfügbar."}</p>
      <h3>Nächste Schritte</h3>
      <p>${
        test.nextSteps ||
        "Erhöhe Budget auf den Gewinner und dokumentiere die Learnings."
      }</p>
    </div>
  `;

  openSystemModal(title, body);
}

function fallbackModal(title, bodyHtml) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.innerHTML = `
    <div class="modal-content">
      <h2>${title}</h2>
      ${bodyHtml}
      <button type="button" id="close-test-modal">Schließen</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  document
    .getElementById("close-test-modal")
    .addEventListener("click", () => document.body.removeChild(wrapper));
}
