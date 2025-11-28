// uiCore.js – UI Core Functions + Meta Connection Check

import { AppState } from "./state.js";

/* -------------------------------------------------------
    SIDEBAR NAVIGATION
---------------------------------------------------------*/

export function initSidebarNavigation(showViewCallback) {
    const menuItems = document.querySelectorAll(".menu-item");
    
    menuItems.forEach((item) => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            
            // Remove active from all
            menuItems.forEach((mi) => mi.classList.remove("active"));
            
            // Add active to clicked
            item.classList.add("active");
            
            // Get view ID
            const viewId = item.getAttribute("data-view");
            if (viewId && showViewCallback) {
                showViewCallback(viewId);
            }
        });
    });
}

/* -------------------------------------------------------
    GREETING & DATE/TIME
---------------------------------------------------------*/

export function updateGreeting() {
    const greetingEl = document.getElementById("greetingTitle");
    if (!greetingEl) return;

    const hour = new Date().getHours();
    let greeting = "Guten Tag";

    if (hour < 12) greeting = "Guten Morgen";
    else if (hour < 18) greeting = "Guten Tag";
    else greeting = "Guten Abend";

    const userName = AppState.meta?.user?.name || "";
    greetingEl.textContent = userName ? `${greeting}, ${userName.split(" ")[0]}!` : `${greeting}!`;
}

export function initDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");

    function update() {
        const now = new Date();
        
        if (dateEl) {
            dateEl.textContent = now.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
            });
        }
        
        if (timeEl) {
            timeEl.textContent = now.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit"
            });
        }
    }

    update();
    setInterval(update, 1000);
}

/* -------------------------------------------------------
    TOAST SYSTEM
---------------------------------------------------------*/

export function showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/* -------------------------------------------------------
    MODAL SYSTEM
---------------------------------------------------------*/

export function openModal(title, bodyHtml) {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    const closeBtn = document.getElementById("modalCloseButton");

    if (!overlay || !titleEl || !bodyEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;

    overlay.classList.add("visible");

    function closeModal() {
        overlay.classList.remove("visible");
    }

    if (closeBtn) {
        closeBtn.onclick = closeModal;
    }

    overlay.onclick = (e) => {
        if (e.target === overlay) closeModal();
    };
}

/* -------------------------------------------------------
    META CONNECTION CHECK
---------------------------------------------------------*/

export function checkMetaConnection() {
    const connected = AppState.metaConnected && !!AppState.meta?.accessToken;
    
    // Update Stripe
    const stripe = document.getElementById("metaConnectStripe");
    if (stripe) {
        stripe.style.display = connected ? "none" : "block";
    }

    // Update Topbar Status
    const topbarStatus = document.getElementById("topbarMetaStatus");
    const topbarIcon = document.getElementById("topbarMetaStatusIcon");
    const topbarLabel = document.getElementById("topbarMetaStatusLabel");

    if (topbarStatus && topbarIcon && topbarLabel) {
        if (connected) {
            topbarStatus.classList.remove("meta-status-disconnected");
            topbarStatus.classList.add("meta-status-connected");
            topbarIcon.className = "fas fa-check-circle";
            topbarLabel.textContent = "Meta: Verbunden";
        } else {
            topbarStatus.classList.remove("meta-status-connected");
            topbarStatus.classList.add("meta-status-disconnected");
            topbarIcon.className = "fas fa-plug";
            topbarLabel.textContent = "Meta: Getrennt";
        }
    }

    // Update Sidebar Status
    updateHealthStatus();

    return connected;
}

/* -------------------------------------------------------
    HEALTH STATUS (Sidebar Footer)
---------------------------------------------------------*/

export function updateHealthStatus() {
    const metaConnected = AppState.metaConnected && !!AppState.meta?.accessToken;
    
    // Meta Ads Status
    const metaIndicator = document.getElementById("sidebarMetaStatusIndicator");
    const metaLabel = document.getElementById("sidebarMetaStatusLabel");
    
    if (metaIndicator && metaLabel) {
        if (metaConnected) {
            metaIndicator.className = "status-indicator status-green";
            metaLabel.textContent = "Meta Ads (Verbunden)";
        } else {
            metaIndicator.className = "status-indicator status-red";
            metaLabel.textContent = "Meta Ads (Offline)";
        }
    }

    // System Health (immer OK)
    const systemIndicator = document.getElementById("sidebarSystemHealthIndicator");
    const systemLabel = document.getElementById("sidebarSystemHealthLabel");
    
    if (systemIndicator && systemLabel) {
        systemIndicator.className = "status-indicator status-green";
        systemLabel.textContent = "System Health (OK)";
    }

    // Campaign Health
    const campaignIndicator = document.getElementById("sidebarCampaignHealthIndicator");
    const campaignLabel = document.getElementById("sidebarCampaignHealthLabel");
    
    if (campaignIndicator && campaignLabel) {
        const metrics = AppState.dashboardMetrics;
        
        if (!metrics || !metaConnected) {
            campaignIndicator.className = "status-indicator status-yellow";
            campaignLabel.textContent = "Campaign Health (n/a)";
        } else {
            const roas = metrics.roas || 0;
            
            if (roas >= 4.0) {
                campaignIndicator.className = "status-indicator status-green";
                campaignLabel.textContent = "Campaign Health (Gut)";
            } else if (roas >= 2.5) {
                campaignIndicator.className = "status-indicator status-yellow";
                campaignLabel.textContent = "Campaign Health (OK)";
            } else {
                campaignIndicator.className = "status-indicator status-red";
                campaignLabel.textContent = "Campaign Health (Schwach)";
            }
        }
    }
}
