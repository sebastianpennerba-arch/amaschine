// packages/sensei/index.js
// -----------------------------------------------------------------------------
// Sensei View Entry
// - Wird von app.js dynamisch geladen
// - Holt Daten via DataLayer.fetchSenseiAnalysis()
// - Nutzt compute.js + render.js
// -----------------------------------------------------------------------------

import { normalizeSenseiAnalysis } from "./compute.js";
import { renderSenseiView } from "./render.js";

export async function render(section, AppState, opts = {}) {
  if (!section) return;

  const SignalOne = window.SignalOne || {};
  const DataLayer = SignalOne.DataLayer;
  const showToast =
    SignalOne.showToast || (window.showToast ? window.showToast.bind(window) : null);
  const useDemoMode = !!opts.useDemoMode;

  if (!DataLayer) {
    section.innerHTML = `
      <div class="view-inner">
        <header class="view-header">
          <div>
            <div class="view-kicker">AdSensei • AI Suite</div>
            <h2 class="view-title">Sensei</h2>
            <p class="view-subtitle">
              DataLayer ist noch nicht initialisiert. Bitte Backend-Konfiguration prüfen.
            </p>
          </div>
        </header>
      </div>
    `;
    return;
  }

  // Account-Kontext bestimmen (kompatibel mit AppState & Meta-Setup)
  const accountId =
    AppState?.meta?.selectedAdAccountId ||
    AppState?.meta?.adAccountId ||
    AppState?.selectedAdAccountId ||
    AppState?.selectedAccountId ||
    null;

  try {
    const result = await DataLayer.fetchSenseiAnalysis({
      accountId,
      preferLive: !useDemoMode,
    });

    const model = normalizeSenseiAnalysis(result, {
      accountId,
      mode: result?.mode || (useDemoMode ? "demo" : "live"),
    });

    renderSenseiView(section, model);
  } catch (err) {
    console.error("[Sensei] Rendering Error:", err);
    showToast?.(
      "Sensei Analyse konnte nicht geladen werden. Es wird ein leerer Zustand angezeigt.",
      "error",
    );
    renderSenseiView(section, null, { error: err });
  }
}
