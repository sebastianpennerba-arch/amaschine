/*
 * Campaign Sections
 * Detailliertes Modal für Kampagnen.
 * Verwendet das zentrale System-Modal aus app.js.
 */

export function renderCampaignDetail(campaign, AppState) {
  const api = window.SignalOne || {};
  const openSystemModal = api.openSystemModal || fallbackModal;
  const title = `Kampagnen-Details: ${campaign.name}`;

  const spend = `€${campaign.spend.toLocaleString("de-DE")}`;
  const ctr = `${(campaign.ctr * 100).toFixed(2)} %`;
  const roas = `${campaign.roas.toFixed(2)}x`;

  const body = `
    <div class="campaign-detail">
      <p><strong>Spend:</strong> ${spend}</p>
      <p><strong>ROAS:</strong> ${roas}</p>
      <p><strong>CTR:</strong> ${ctr}</p>
      <p><strong>Status:</strong> ${campaign.status}</p>
      <h3>Sensei-Empfehlung</h3>
      <p>${
        campaign.scalingHint ||
        "Diese Kampagne sollte weiter beobachtet werden."
      }</p>
      <ul>
        <li>Prüfe Top-Creatives in der Creative Library.</li>
        <li>Nutze den Testing Log für strukturierte Experimente.</li>
        <li>Betrachte Cross-Brand-Insights, falls mehrere Brands aktiv sind.</li>
      </ul>
    </div>
  `;

  openSystemModal(title, body);
}

function fallbackModal(title, bodyHtml) {
  // Fallback, falls das System-Modal nicht verfügbar ist
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.innerHTML = `
    <div class="modal-content">
      <h2>${title}</h2>
      ${bodyHtml}
      <button type="button" id="fallback-modal-close">Schließen</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  document
    .getElementById("fallback-modal-close")
    .addEventListener("click", () => {
      document.body.removeChild(wrapper);
    });
}
