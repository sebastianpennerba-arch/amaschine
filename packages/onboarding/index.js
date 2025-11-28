// Dashboard Entry – wird von app.js geladen
import { render as renderonboarding } from "./render.js";

export function render(container, AppState) {
  renderonboarding(container, AppState);
}
