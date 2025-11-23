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

export function openModal(title, bodyHtml) {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    overlay.classList.add("visible");
    window.closeModal = closeModal;
}

export function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (!overlay) return;
    overlay.classList.remove("visible");
}

export function updateGreeting() {
    const titleEl = document.getElementById("greetingTitle");
    if (!titleEl) return;

    const base = "Guten Tag";
    if (AppState.meta?.user?.name) {
        titleEl.textContent = `${base}, ${AppState.meta.user.name}!`;
    } else {
        titleEl.textContent = `${base}!`;
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

    if (connected) {
        stripe?.classList.add("hidden");
        if (stripeText) stripeText.innerHTML =
            '<i class="fas fa-plug"></i> Mit Meta Ads verbunden';
        pill?.classList.add("meta-connected");
        pill?.classList.remove("meta-disconnected");
        if (pillLabel) pillLabel.textContent = "Verbunden mit Meta Ads";
        if (pillDot) pillDot.style.backgroundColor = "var(--success)";
        if (sidebarLabel) sidebarLabel.textContent = "Meta Ads (Live)";
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-red");
            sidebarIndicator.classList.add("status-green");
        }
        return true;
    } else {
        stripe?.classList.remove("hidden");
        if (stripeText) stripeText.innerHTML =
            '<i class="fas fa-plug"></i> Nicht mit Meta Ads verbunden';
        pill?.classList.add("meta-disconnected");
        pill?.classList.remove("meta-connected");
        if (pillLabel) pillLabel.textContent = "Nicht mit Meta verbunden";
        if (pillDot) pillDot.style.backgroundColor = "var(--danger)";
        if (sidebarLabel) sidebarLabel.textContent = "Meta Ads (Offline)";
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-green");
            sidebarIndicator.classList.add("status-red");
        }
        return false;
    }
}

export function initSidebarNavigation(onViewChange) {
    const items = document.querySelectorAll(".menu-item[data-view]");
    items.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = item.getAttribute("data-view");
            if (!targetView) return;
            onViewChange(targetView);
            setActiveMenuItem(item);
        });
    });
}

export function setActiveMenuItem(activeItem) {
    document
        .querySelectorAll(".menu-item")
        .forEach((i) => i.classList.remove("active"));
    activeItem.classList.add("active");
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
    setInterval(update, 60 * 1000);
}
