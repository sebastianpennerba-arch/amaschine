// settings.js – UI Settings (Theme, etc.)
// ---------------------------------------
// Steuert aktuell den Light/Dark-Mode über den Settings-Button unten links.

import { openModal, showToast } from "./uiCore.js";

const THEME_STORAGE_KEY = "signalone_theme_v1";

function applyTheme(theme) {
    const root = document.documentElement;
    if (!theme || (theme !== "light" && theme !== "dark")) {
        theme = "light";
    }
    root.setAttribute("data-theme", theme);
}

function loadThemeFromStorage() {
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === "light" || stored === "dark") {
            return stored;
        }
    } catch (e) {
        console.warn("LocalStorage not available for theme:", e);
    }
    return "light";
}

function persistTheme(theme) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (e) {
        console.warn("LocalStorage not available for theme:", e);
    }
}

export function initSettings() {
    // Beim Start Theme anwenden
    const initialTheme = loadThemeFromStorage();
    applyTheme(initialTheme);

    const btn = document.getElementById("openSettingsButton");
    if (!btn) return;

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        openSettingsModal();
    });
}

function openSettingsModal() {
    const currentTheme = loadThemeFromStorage();

    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; min-width:260px;">
            <section>
                <h4 style="margin:0 0 8px 0; font-size:14px;">Theme</h4>
                <p style="margin:0 0 10px 0; font-size:12px; color:var(--text-secondary);">
                    Wechsle zwischen Light- und Dark-Mode. Die Einstellung wird im Browser gespeichert.
                </p>
                <div style="display:flex; flex-direction:column; gap:6px; font-size:13px;">
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="radio" name="theme" value="light" ${
                            currentTheme === "light" ? "checked" : ""
                        } />
                        <span>Light</span>
                    </label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="radio" name="theme" value="dark" ${
                            currentTheme === "dark" ? "checked" : ""
                        } />
                        <span>Dark</span>
                    </label>
                </div>
            </section>

            <section>
                <h4 style="margin:0 0 8px 0; font-size:14px;">Branding</h4>
                <p style="margin:0; font-size:12px; color:var(--text-secondary);">
                    Später können hier weitere Optionen wie Branding-Varianten, Data-Density
                    oder Sprache ergänzt werden.
                </p>
            </section>
        </div>
    `;

    openModal("Settings", html, {
        onOpen(overlay) {
            const radios = overlay.querySelectorAll('input[name="theme"]');
            radios.forEach((r) => {
                r.addEventListener("change", (e) => {
                    const theme = e.target.value === "dark" ? "dark" : "light";
                    applyTheme(theme);
                    persistTheme(theme);
                    showToast(
                        theme === "dark"
                            ? "Dark-Mode aktiviert"
                            : "Light-Mode aktiviert",
                        "success"
                    );
                });
            });
        }
    });
}
