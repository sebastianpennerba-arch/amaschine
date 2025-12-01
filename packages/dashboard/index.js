/*
 * packages/dashboard/index.js
 * Entry Point für das Dashboard-Modul.
 * SignalOne lädt dieses Modul dynamisch über app.js → loadModule().
 *
 * Erwartet:
 *   section:   DOM-Node des Views
 *   appState:  globaler Application State
 *   opts:      { useDemoMode: boolean }
 */

import { renderDashboard } from "./render.js";

export function render(section, appState, opts = {}) {
  try {
    const useDemoMode = !!opts.useDemoMode;

    // Safety: Section muss existieren
    if (!section) {
      console.error("[Dashboard] Missing target section.");
      return;
    }

    // Render-Funktion aus render.js
    renderDashboard(section, appState, useDemoMode);
  } catch (err) {
    console.error("[Dashboard] Rendering Error:", err);
    section.innerHTML = `
      <div style="padding:24px; color:#b71c1c;">
        Fehler beim Rendern des Dashboards.<br>
        <small>${err?.message || err}</small>
      </div>
    `;
  }
}
