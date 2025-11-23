/**
 * FINAL FIXED VERSION — BUTTON & OAUTH WORKING
 */

// ============================================
// GLOBAL APP STATE
// ============================================

const AppState = {
    currentView: "dashboardView",
    metaConnected: false,
    loading: false,
    meta: {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        ads: [],
        creatives: [],
        insights: []
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
// CONNECT GATEKEEPER
// ============================================

function checkMetaConnection() {
    const stripe = document.getElementById("metaConnectStripe");
    const isConnected = AppState.metaConnected && AppState.meta.accessToken;

    if (!isConnected) {
        stripe?.classList.remove("hidden");
        return false;
    } else {
        stripe?.classList.add("hidden");
        return true;
    }
}

// ============================================
// BUTTON CLICK
// ============================================

function handleMetaConnectClick() {
    if (AppState.loading) return;

    showToast("Verbinde mit Meta...", "info");
    startMetaOAuthFlow();
}

// ============================================
// START OAUTH
// ============================================

function startMetaOAuthFlow() {
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

// ============================================
// HANDLE REDIRECT
// ============================================

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (!code) return;

    window.history.replaceState({}, document.title, META_OAUTH_CONFIG.redirectUri);

    showToast("Meta-Code erhalten – tausche Token...", "info");

    await exchangeMetaCodeForToken(code);
}

// ============================================
// EXCHANGE TOKEN
// ============================================

async function exchangeMetaCodeForToken(code) {
    try {
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
            console.error("Token exchange error:", data);
            showToast("Fehler beim Verbinden mit Meta.", "error");
            return;
        }

        AppState.meta.accessToken = data.accessToken;
        AppState.metaConnected = true;

        showToast("Mit Meta verbunden!", "success");
        updateUI();

    } catch (e) {
        console.error(e);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

// ============================================
// VIEW + UI
// ============================================

function showView(viewId) {
    document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
    document.getElementById(viewId)?.classList.remove("hidden");
    AppState.currentView = viewId;
    updateUI();
}

function updateUI() {
    checkMetaConnection();
}

// ============================================
// TOAST
// ============================================

function showToast(message, type = "info") {
    const box = document.getElementById("toastContainer");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    box.appendChild(el);
    setTimeout(() => { el.classList.add("hide"); setTimeout(() => el.remove(), 300); }, 2500);
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {

    // WICHTIG: Button ID = connectMetaButton (aus deiner index.html)
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    updateUI();
    handleMetaOAuthRedirectIfPresent();
});
