// Creative Library Entry – Public API für den Backbone
import {
  renderLibrary,
  setExternalFilters,
  openCreativeDetailById,
} from "./render.js";

/**
 * Haupt-Render-Funktion, wird vom Backbone (app.js) aufgerufen.
 * container: DOM-Element der View
 * AppState: globaler AppState aus app.js
 */
export function render(container, AppState) {
  renderLibrary(container, AppState);
}

/**
 * Optionaler Public API: Filter von außen aktualisieren
 * (z. B. später über Sensei oder Testing Log).
 */
export function updateFilters(filtersPartial) {
  setExternalFilters(filtersPartial);
}

/**
 * Optionaler Public API: Ein Creative direkt per ID öffnen.
 */
export function openDetails(creativeId) {
  openCreativeDetailById(creativeId);
}
