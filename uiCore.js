// uiCore.js – UI Utilities, Sidebar, Toast, Modal

import { AppState } from "./state.js";

export function showToast(message, type = "info") {
    const box = document.getElementById("toastContainer");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerText = message;
    box.appendChild(el);
    setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

export function updateGreeting() {
    const titleEl = document.getElementById("greetingTitle");
    if (!titleEl) return;

    const now = new Date();
    const hour = now.getHours();
    let base = "Willkommen zurück";

    if (hour >= 5 && hour < 11) base = "Guten Morgen";
    else if (hour >= 11 && hour < 16) base = "Guten Tag";
    else if (hour >= 16 && hour < 22) base = "Guten Abend";
    else base = "Gute Nacht";

    if (AppState.meta && AppState.meta.user && AppState.meta.user.name) {
        titleEl.textContent = `${base}, ${AppState.meta.user.name}`;
    } else {
        titleEl.textContent = `${base}!`;
    }
}

export function initDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");
    if (!dateEl || !timeEl) return;

    function update() {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString("de-DE");
        timeEl.textContent = now.toLocaleTimeString("de-DE", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    update();
    setInterval(update, 1000 * 30);
}

export function openModal(title, html, options = {}) {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    const closeBtn = document.getElementById("modalCloseButton");

    if (!overlay || !titleEl || !bodyEl || !closeBtn) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = html;

    overlay.classList.add("visible");

    const onClose = () => {
        overlay.classList.remove("visible");
        if (typeof options.onClose === "function") {
            options.onClose();
        }
    };

    closeBtn.onclick = onClose;
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            onClose();
        }
    };

    if (typeof options.onOpen === "function") {
        options.onOpen(overlay);
    }
}

export function checkMetaConnection() {
    const connected = !!(AppState.metaConnected && AppState.meta.accessToken);

    const stripe = document.getElementById("metaConnectStripe");
    const stripeText = document.getElementById("metaStripeText");
    const pill = document.getElementById("metaConnectionPill");
    const pillLabel = document.getElementById("metaConnectionLabel");
    const pillDot = document.getElementById("metaConnectionDot");
    const sidebarLabel = document.getElementById("sidebarMetaStatusLabel");
    const sidebarIndicator = document.getElementById("sidebarMetaStatusIndicator");

    const topbarMetaStatus = document.getElementById("topbarMetaStatus");
    const topbarMetaLabel = document.getElementById("topbarMetaStatusLabel");

    if (connected) {
        // Stripe oben ausblenden, Sidebar auf "Live" setzen
        stripe?.classList.add("hidden");
        if (stripeText) {
            stripeText.innerHTML = '<i class="fas fa-plug"></i> Mit Meta Ads verbunden';
        }

        // Ehemalige Pill (falls im DOM vorhanden) weiterhin korrekt, aber i.d.R. nicht mehr genutzt
        pill?.classList.add("meta-connected");
        pill?.classList.remove("meta-disconnected");
        if (pillLabel) pillLabel.textContent = "Verbunden mit Meta Ads";
        if (pillDot) pillDot.style.backgroundColor = "var(--success)";

        if (sidebarLabel) sidebarLabel.textContent = "Meta Ads (Live)";
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-red");
            sidebarIndicator.classList.add("status-green");
        }

        // Neuer, dezenter Topbar-Status (immer sichtbar)
        if (topbarMetaStatus) {
            topbarMetaStatus.classList.add("meta-status-connected");
            topbarMetaStatus.classList.remove("meta-status-disconnected");
        }
        if (topbarMetaLabel) {
            topbarMetaLabel.textContent = "Meta: Verbunden";
        }

        return true;
    } else {
        // Stripe anzeigen, wenn nicht verbunden
        stripe?.classList.remove("hidden");
        if (stripeText) {
            stripeText.innerHTML =
                '<i class="fas fa-plug"></i> Nicht mit Meta Ads verbunden';
        }

        pill?.classList.add("meta-disconnected");
        pill?.classList.remove("meta-connected");
        if (pillLabel) pillLabel.textContent = "Nicht mit Meta verbunden";
        if (pillDot) pillDot.style.backgroundColor = "var(--danger)";

        if (sidebarLabel) sidebarLabel.textContent = "Meta Ads (Offline)";
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-green");
            sidebarIndicator.classList.add("status-red");
        }

        if (topbarMetaStatus) {
            topbarMetaStatus.classList.add("meta-status-disconnected");
            topbarMetaStatus.classList.remove("meta-status-connected");
        }
        if (topbarMetaLabel) {
            topbarMetaLabel.textContent = "Meta: Getrennt";
        }

        return false;
    }
}

export function initSidebarNavigation(onViewChange) {
    const items = document.querySelectorAll(".menu-item[data-view]");
    items.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            if (!view) return;

            document
                .querySelectorAll(".menu-item[data-view]")
                .forEach((el) => el.classList.remove("active"));
            item.classList.add("active");

            if (typeof onViewChange === "function") {
                onViewChange(view);
            }
        });
    });
}
