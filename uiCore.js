/* ============================================================
   UI CORE – ZENTRALE UI FUNKTIONEN
   Für Navigation, Toasts, Modals, Debug, Status UI
============================================================ */

import { AppState } from "./state.js";

/* ============================================================
   VIEW SWITCHING
============================================================ */

export function switchView(viewId) {
    const views = document.querySelectorAll(".view");

    views.forEach(v => v.classList.add("hidden"));

    const activeView = document.getElementById(viewId);
    if (activeView) {
        activeView.classList.remove("hidden");
        AppState.currentView = viewId;
    }
}


/* ============================================================
   SIDEBAR ACTIVE ITEM
============================================================ */

export function updateSidebarActiveItem(selectedItem) {
    const items = document.querySelectorAll(".nav-item");
    items.forEach(i => i.classList.remove("active"));
    selectedItem.classList.add("active");
}


/* ============================================================
   PAGE TITLE (Fallback handled in app.js)
============================================================ */



/* ============================================================
   META STATUS INDICATOR (TOPBAR)
============================================================ */

export function updateMetaStatusIndicator(state) {
    const indicator = document.getElementById("metaStatusIndicator");
    if (!indicator) return;

    if (state === "connected") {
        indicator.innerHTML = `
            <div class="topbar-meta-status meta-status-connected">
                <i class="ri-check-line"></i> Connected
            </div>
        `;
    }
    else if (state === "connected-demo") {
        indicator.innerHTML = `
            <div class="topbar-meta-status meta-status-connected">
                <i class="ri-magic-line"></i> Demo Mode
            </div>
        `;
    }
    else {
        indicator.innerHTML = `
            <div class="topbar-meta-status meta-status-disconnected">
                <i class="ri-error-warning-line"></i> Not Connected
            </div>
        `;
    }
}


/* ============================================================
   DEMO BADGE (rechts oben in Topbar)
============================================================ */

export function showDemoBadge(isActive) {
    const badge = document.querySelector("[data-role='demo-badge']");
    if (!badge) return;

    if (isActive) {
        badge.textContent = "DEMO MODE";
        badge.classList.add("show");
    } else {
        badge.classList.remove("show");
    }
}


/* ============================================================
   TOAST SYSTEM
============================================================ */

export function showToast(message, type = "info", duration = 3200) {
    let container = document.querySelector(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");

        setTimeout(() => {
            toast.remove();
        }, 300);
    }, duration);
}


/* ============================================================
   MODAL SYSTEM (Apple-like)
============================================================ */

const modalOverlayId = "globalModalOverlay";
const modalContentId = "globalModalContent";

function ensureModalStructure() {
    if (!document.getElementById(modalOverlayId)) {
        const overlay = document.createElement("div");
        overlay.id = modalOverlayId;
        overlay.className = "modal-overlay";

        const content = document.createElement("div");
        content.id = modalContentId;
        content.className = "modal-content";

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // Close animation
        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
    }
}

export function openModal(html) {
    ensureModalStructure();

    const overlay = document.getElementById(modalOverlayId);
    const content = document.getElementById(modalContentId);

    content.innerHTML = html;

    overlay.classList.add("visible");
}

export function closeModal() {
    const overlay = document.getElementById(modalOverlayId);
    if (overlay) {
        overlay.classList.remove("visible");
    }
}

window.closeGlobalModal = closeModal;


/* ============================================================
   SETTINGS MODAL (wird über app.js geöffnet)
============================================================ */

export const ui = {
    openSettingsModal(settings) {
        openModal(`
            <h3>Einstellungen</h3>

            <div class="modal-section">
                <div class="modal-section-title">Darstellung</div>

                <div class="modal-row">
                    <label>Thema</label>
                    <select id="settingsTheme">
                        <option value="light">Hell</option>
                        <option value="dark">Dunkel</option>
                    </select>
                </div>

                <div class="modal-row">
                    <label>Währung</label>
                    <select id="settingsCurrency">
                        <option value="EUR">EUR</option>
                        <option value="USD">USD</option>
                    </select>
                </div>

                <div class="modal-row">
                    <label>Default Zeitraum</label>
                    <select id="settingsTimeRange">
                        <option value="last_7d">Letzte 7 Tage</option>
                        <option value="last_30d">Letzte 30 Tage</option>
                        <option value="last_90d">Letzte 90 Tage</option>
                    </select>
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-section-title">System</div>

                <div class="modal-row">
                    <label>Meta Cache TTL (Minuten)</label>
                    <input type="number" id="settingsTTL" min="1" value="${settings.metaCacheTtlMinutes}">
                </div>

                <div class="modal-row">
                    <label>Kreativ-Layout</label>
                    <select id="settingsCreativeLayout">
                        <option value="grid">Grid</option>
                        <option value="list">Liste</option>
                    </select>
                </div>
            </div>

            <button id="modalCloseButton" onclick="closeGlobalModal()">Schließen</button>
            <button class="primary-btn" id="settingsSaveBtn">Speichern</button>
        `);

        // Werte setzen
        document.getElementById("settingsTheme").value = settings.theme;
        document.getElementById("settingsCurrency").value = settings.currency;
        document.getElementById("settingsTimeRange").value = settings.defaultTimeRange;
        document.getElementById("settingsCreativeLayout").value = settings.creativeLayout;

        // Speichern
        document.getElementById("settingsSaveBtn").addEventListener("click", () => {
            AppState.settings.theme = document.getElementById("settingsTheme").value;
            AppState.settings.currency = document.getElementById("settingsCurrency").value;
            AppState.settings.defaultTimeRange = document.getElementById("settingsTimeRange").value;
            AppState.settings.creativeLayout = document.getElementById("settingsCreativeLayout").value;
            AppState.settings.metaCacheTtlMinutes = parseInt(document.getElementById("settingsTTL").value);

            applyTheme(AppState.settings.theme);
            showToast("Einstellungen gespeichert", "success");
            closeModal();
        });
    }
};


/* ============================================================
   THEME APPLICATION
============================================================ */

export function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.setAttribute("data-theme", "dark");
    } else {
        document.documentElement.removeAttribute("data-theme");
    }
}


/* ============================================================
   DEBUG CONSOLE
============================================================ */

export function debugLog(...args) {
    if (!document.getElementById("debugConsole")) {
        const box = document.createElement("div");
        box.id = "debugConsole";
        box.className = "debug-console hidden";
        document.body.appendChild(box);
    }

    const dbg = document.getElementById("debugConsole");
    dbg.classList.remove("hidden");

    dbg.innerHTML += args.join(" ") + "<br>";
    dbg.scrollTop = dbg.scrollHeight;
}
