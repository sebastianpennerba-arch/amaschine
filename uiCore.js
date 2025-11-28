/* ============================================================
   UI CORE – DEMO-STABLE VERSION
============================================================ */

import { AppState } from "./state.js";

/* ============================================================
   META CONNECTION CHECK
============================================================ */

export function checkMetaConnection() {
    const isDemo = AppState.settings?.demoMode;
    if (isDemo) return true;
    const hasToken = !!AppState.meta?.accessToken;
    return hasToken === true;
}

/* ============================================================
   META STATUS INDICATOR (TOPBAR + SIDEBAR)
============================================================ */

export function updateMetaStatusIndicator(state) {
    const topbar = document.getElementById("topbarMetaStatus");
    const sidebar = document.getElementById("sidebarMetaStatusIndicator");
    const sidebarLabel = document.getElementById("sidebarMetaStatusLabel");

    if (!topbar || !sidebar || !sidebarLabel) return;

    if (state === "connected") {
        topbar.classList.remove("meta-status-disconnected");
        topbar.classList.add("meta-status-connected");
        topbar.innerHTML = `<i class="fas fa-check-circle"></i> <span>Meta: Verbunden</span>`;

        sidebar.className = "status-indicator status-green";
        sidebarLabel.textContent = "Meta Ads (Online)";
    }
    else if (state === "connected-demo") {
        topbar.classList.remove("meta-status-disconnected");
        topbar.classList.add("meta-status-connected");
        topbar.innerHTML = `<i class="fas fa-magic"></i> <span>Meta: Demo Mode</span>`;

        sidebar.className = "status-indicator status-yellow";
        sidebarLabel.textContent = "Meta Ads (Demo Mode)";
    }
    else {
        topbar.classList.remove("meta-status-connected");
        topbar.classList.add("meta-status-disconnected");
        topbar.innerHTML = `<i class="fas fa-plug"></i> <span>Meta: Getrennt</span>`;

        sidebar.className = "status-indicator status-red";
        sidebarLabel.textContent = "Meta Ads (Offline)";
    }
}

/* ============================================================
   DEMO BADGE (rechts oben)
============================================================ */

export function showDemoBadge(isActive, presetName = "") {
    let badge = document.querySelector("[data-role='demo-badge']");

    if (!badge) {
        badge = document.createElement("div");
        badge.setAttribute("data-role", "demo-badge");
        badge.className = "badge-demo hidden";
        document.body.appendChild(badge);
    }

    if (isActive) {
        badge.textContent = `DEMO MODE – ${presetName}`;
        badge.classList.remove("hidden");
        badge.classList.add("show");
    } else {
        badge.classList.add("hidden");
    }
}

/* ============================================================
   GREETING
============================================================ */

export function updateGreeting() {
    const el = document.getElementById("greetingTitle");
    if (!el) return;

    const h = new Date().getHours();
    let g = "Guten Tag!";

    if (h < 11) g = "Guten Morgen!";
    else if (h < 17) g = "Guten Tag!";
    else g = "Guten Abend!";

    el.textContent = g;
}

/* ============================================================
   DATE & TIME
============================================================ */

export function initDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    if (!dateEl || !timeEl) return;

    const update = () => {
        const d = new Date();
        dateEl.textContent = d.toLocaleDateString("de-DE");
        timeEl.textContent = d.toLocaleTimeString("de-DE");
    };

    update();
    setInterval(update, 1000);
}

/* ============================================================
   SIDEBAR NAVIGATION
============================================================ */

export function initSidebarNavigation(onSwitch) {
    const items = document.querySelectorAll(".menu-item");

    items.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();

            const view = item.dataset.view;
            if (!view) return;

            document
                .querySelectorAll(".menu-item")
                .forEach((i) => i.classList.remove("active"));
            item.classList.add("active");

            onSwitch(view);
        });
    });
}

/* ============================================================
   SYSTEM HEALTH
============================================================ */

export function updateHealthStatus() {
    const sysDot = document.getElementById("sidebarSystemHealthIndicator");
    const sysLbl = document.getElementById("sidebarSystemHealthLabel");

    const campDot = document.getElementById(
        "sidebarCampaignHealthIndicator"
    );
    const campLbl = document.getElementById("sidebarCampaignHealthLabel");

    if (!sysDot || !campDot) return;

    sysDot.className = "status-indicator status-green";
    sysLbl.textContent = "System Health (OK)";

    const hasData = (AppState.meta?.campaigns || []).length > 0;

    if (hasData) {
        campDot.className = "status-indicator status-green";
        campLbl.textContent = "Campaign Health (OK)";
    } else {
        campDot.className = "status-indicator status-yellow";
        campLbl.textContent = "Campaign Health (n/a)";
    }
}

/* ============================================================
   TOASTS
============================================================ */

export function showToast(message, type = "info", duration = 3000) {
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
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/* ============================================================
   MODAL SYSTEM
============================================================ */

export function openModal(html) {
    let overlay = document.getElementById("globalModalOverlay");
    let content = document.getElementById("globalModalContent");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "globalModalOverlay";
        overlay.className = "modal-overlay";

        content = document.createElement("div");
        content.id = "globalModalContent";
        content.className = "modal-content";

        overlay.appendChild(content);
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    content.innerHTML = html;
    overlay.classList.add("visible");
}

export function closeModal() {
    const overlay = document.getElementById("globalModalOverlay");
    if (overlay) overlay.classList.remove("visible");
}

/* ============================================================
   THEME
============================================================ */

export function applyTheme(theme) {
    if (theme === "dark") {
        document.documentElement.dataset.theme = "dark";
    } else {
        document.documentElement.dataset.theme = "light";
    }
}

/* ============================================================
   DEBUG CONSOLE → DEAKTIVIERT (kein schwarzer Balken)
============================================================ */

export function debugLog(...args) {
    // Nur Konsole, kein DOM
    if (typeof console !== "undefined") {
        console.log("[SignalOne]", ...args);
    }
}
