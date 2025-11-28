/*
 * Shopify Compute
 * Verwalten der Verbindung zu Shopify und (später) Synchronisation von Daten.
 */

export async function connectShopify() {
  // In einer echten Implementierung wird hier der OAuth-Flow gestartet.
  // Für jetzt geben wir einfach "true" zurück.
  await delay(200);
  return true;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
