/*
 * Shopify Render
 * Bietet einen Button, um Shopify zu verbinden, und zeigt den Status an.
 */

import { connectShopify } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Shopify Connect";
  container.appendChild(heading);

  const status = document.createElement("p");
  const connected = !!AppState.shopifyConnected;
  status.textContent = connected
    ? "Shopify ist verbunden."
    : "Shopify ist noch nicht verbunden.";

  const button = document.createElement("button");
  button.textContent = connected ? "Verbindung aktualisieren" : "Mit Shopify verbinden";

  button.onclick = async () => {
    const success = await connectShopify();
    const api = window.SignalOne || {};
    if (success) {
      AppState.shopifyConnected = true;
      status.textContent = "Shopify verbunden!";
      button.textContent = "Verbindung aktualisieren";
      if (typeof api.showToast === "function") {
        api.showToast("Shopify erfolgreich verbunden (Demo).", "success");
      }
    } else if (typeof api.showToast === "function") {
      api.showToast("Shopify-Verbindung fehlgeschlagen.", "error");
    }
  };

  container.appendChild(status);
  container.appendChild(button);
}
