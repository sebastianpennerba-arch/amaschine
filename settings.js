// settings.js – Theme-Handling auf Basis von AppState.settings
// -----------------------------------------------------------
// Wichtig: Die eigentliche Settings-UI liegt in app.js.
// Dieses Modul kümmert sich NUR darum, das Theme sauber
// aus AppState.settings.theme auf :root[data-theme] zu mappen.

import { AppState } from "./state.js";

export function applyThemeFromSettings() {
    const root = document.documentElement;
    const settings = AppState.settings || {};

    let theme = settings.theme || "auto";
    let finalTheme = theme;

    // "auto" → System-Theme auslesen
    if (theme === "auto") {
        const prefersDark =
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches;
        finalTheme = prefersDark ? "dark" : "light";
    }

    // Fallback: alles außer "dark" → "light"
    if (finalTheme !== "dark") {
        finalTheme = "light";
    }

    root.setAttribute("data-theme", finalTheme);
}

export function initSettings() {
    applyThemeFromSettings();
}
