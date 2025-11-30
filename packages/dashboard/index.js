/*
 * packages/dashboard/index.js
 * Public Entry für das Dashboard-Modul.
 * Wird von app.js via dynamic import geladen.
 */

import { renderDashboard } from "./render.js";

export function render(section, appState, opts = {}) {
  // app.js übergibt aktuell bereits: { useDemoMode: useDemoMode() }
  const demoModeActive = !!opts.useDemoMode;
  renderDashboard(section, appState, demoModeActive);
}
