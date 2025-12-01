// packages/sensei/index.js
// --------------------------------------------------------
// Entry-Point für das Sensei-View
// - Wird von app.js via dynamic import geladen:
//     import("/packages/sensei/index.js")
// - Holt Daten über den DataLayer
// - Normalisiert und übergibt an render.js
// --------------------------------------------------------

import DataLayer from "/packages/data/index.js";
import { normalizeSenseiAnalysis } from "./compute.js";
import { renderSenseiView } from "./render.js";

function showLoader(section) {
  section.innerHTML = `
    <div class="sensei-root">
      <header class="view-header sensei-header">
        <div>
          <div class="view-kicker">AdSensei • AI Suite</div>
          <h2 class="view-headline">Sensei – AI Recommendations</h2>
          <p class="view-subline">
            Analyse läuft – Sensei zieht deine Creatives & Kampagnen zusammen.
          </p>
        </div>
      </header>
      <div style="padding:18px;">
        <div class="skeleton-block" style="height: 140px; margin-bottom: 12px;"></div>
        <div class="skeleton-block" style="height: 140px; margin-bottom: 12px;"></div>
        <div class="skeleton-block" style="height: 140px;"></div>
      </div>
    </div>
  `;
}

/**
 * Haupt-Render-Funktion, wie von app.js erwartet:
 *   render(section, appState, opts)
 */
export async function render(section, appState, opts = {}) {
  const useDemoMode = !!opts.useDemoMode;

  showLoader(section);

  try {
    const rawAnalysis = await DataLayer.fetchSenseiAnalysis({
      preferLive: !useDemoMode,
    });

    const normalized = normalizeSenseiAnalysis(rawAnalysis);
    renderSenseiView(section, normalized);
  } catch (err) {
    console.error("[Sensei] Analyse fehlgeschlagen:", err);

    // Versuche freundliche Fehlermeldung + Toast
    if (window.SignalOne?.showToast) {
      window.SignalOne.showToast(
        "Sensei Analyse konnte nicht geladen werden. Fallback auf leere Ansicht.",
        "error"
      );
    }

    renderSenseiView(section, null);
  }
}

export default {
  render,
};
