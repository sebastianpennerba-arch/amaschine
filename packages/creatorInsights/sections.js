/*
 * Creator Profile Sections
 * Zeigt ein detailliertes Profil eines Creators mit Statistiken und
 * Empfehlungen – über das zentrale System-Modal.
 */

export function renderProfile(item) {
  const api = window.SignalOne || {};
  const openSystemModal = api.openSystemModal || fallbackModal;

  const title = `Creator-Profil: ${item.creator}`;

  const body = `
    <div class="creator-profile">
      <p><strong>Creatives:</strong> ${item.count}</p>
      <p><strong>Durchschnittlicher ROAS:</strong> ${item.avgRoas.toFixed(
        2
      )}x</p>
      <p><strong>Gesamt-Spend:</strong> €${item.spend.toLocaleString(
        "de-DE"
      )}</p>
      <h3>Stärken</h3>
      <p>Starke Performance bei Problem/Solution Hooks und authentischem UGC.</p>
      <h3>Schwächen</h3>
      <p>ROAS fällt, wenn Creatives zu lange ohne Refresh laufen.</p>
      <h3>Sensei-Empfehlung</h3>
      <ul>
        <li>Plane 3–5 neue Varianten mit diesem Creator.</li>
        <li>Nutze verschiedene Hook-Typen und kurze Formate.</li>
        <li>Teste neue Thumbnails im Testing Log.</li>
      </ul>
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
      <button type="button" id="close-creator">Schließen</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  document
    .getElementById("close-creator")
    .addEventListener("click", () => document.body.removeChild(wrapper));
}
