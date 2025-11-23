/**
 * SIGNALONE — FINAL WORKING APP.JS
 * Fixes:
 *  - Sidebar Navigation
 *  - View Switching
 *  - Meta OAuth Flow
 *  - UI Updates
 *  - Connect Button
 */

// ============================================
// GLOBAL APP STATE
// ============================================

const AppState = {
    currentView: "dashboardView",
    metaConnected: false,
    meta: {
        accessToken: null
    }
};

// ============================================
// META CONFIG
// ============================================

const META_OAUTH_CONFIG = {
    appId: "732040642590155",
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,business_management"
};

const META_BACKEND_CONFIG = {
    tokenEndpoint: "https://signalone-backend.onrender.com/api/meta/oauth/token"
};

// ============================================
// META CONNECT LOGIC
// ============================================

function checkMetaConnection() {
    const stripe = document.getElementById("metaConnectStripe");

    if (!AppState.metaConnected) {
        stripe.classList.remove("hidden");
        return false;
    } else {
        stripe.classList.add("hidden");
        return true;
    }
}

function handleMetaConnectClick() {
    showToast("Verbinde mit Meta...", "info");

    const authUrl =
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        });

    window.location.href = authUrl;
}

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Meta-Code empfangen – tausche Token aus...", "info");

    const response = await fetch(META_BACKEND_CONFIG.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code,
            redirectUri: META_OAUTH_CONFIG.redirectUri
        })
    });

    const data = await response.json();

    if (!data.success) {
        showToast("Fehler beim Verbinden mit Meta.", "error");
        return;
    }

    AppState.meta.accessToken = data.accessToken;
    AppState.metaConnected = true;

    showToast("Mit Meta verbunden!", "success");
    updateUI();
}

// ============================================
// SIDEBAR NAVIGATION
// ============================================

function initSidebarNavigation() {
    const items = document.querySelectorAll(".menu-item[data-view]");

    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = item.getAttribute("data-view");
            showView(targetView);
            setActiveMenuItem(item);
        });
    });
}

function setActiveMenuItem(activeItem) {
    document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
    activeItem.classList.add("active");
}

// ============================================
// VIEW HANDLING
// ============================================

function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById(viewId).classList.remove("hidden");

    AppState.currentView = viewId;
    updateUI();
}

// ============================================
// UI UPDATE
// ============================================

function updateUI() {
    checkMetaConnection();
}

// ============================================
// TOAST SYSTEM
// ============================================

function showToast(message, type = "info") {
    const box = document.getElementById("toastContainer");

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerText = message;

    box.appendChild(el);

    setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // Navigation fix
    initSidebarNavigation();

    // Meta Connect Button
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    // Updates
    updateUI();
    handleMetaOAuthRedirectIfPresent();
});
