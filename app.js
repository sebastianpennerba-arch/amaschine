/**
 * SignalOne Elite Dashboard - app.js (FINAL FIXED VERSION)
 * 
 * - Vollständige Korrektur des Meta OAuth Flows
 * - Entfernte ungültige Funktion handleViewRendering()
 * - Ersetzt durch updateUI()
 * - Fix für showView()
 * - Fix für exchangeMetaCodeForToken()
 * - Redirect + Token Handling stabilisiert
 */

// ============================================
// GLOBALER APP STATE
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
    },
    selectedAccount: null,
    selectedCampaign: null,
    selectedAd: null,
    selectedCreative: null,
    filters: {
        search: "",
        status: "all",
        dateRange: "last_7_days"
    },
    timeRange: "7d"
};

// ============================================
// OAUTH KONFIGURATION
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
// META CONNECT GATEKEEPER
// ============================================

function checkMetaConnection() {
    const stripe = document.getElementById("metaConnectStripe");
    const connected = !!(AppState.metaConnected && AppState.meta.accessToken);

    if (!connected) {
        if (stripe) stripe.classList.remove("hidden");
        return false;
    } else {
        if (stripe) stripe.classList.add("hidden");
        return true;
    }
}

function handleMetaConnectClick() {
    if (AppState.loading) return;

    const stripe = document.getElementById("metaConnectStripe");
    if (stripe) stripe.classList.add("connecting");

    showToast("Verbinde mit Meta Ads...", "info");
    startMetaOAuthFlow();
}

// ============================================
// OAUTH FLOW STARTEN
// ============================================

function startMetaOAuthFlow() {
    const authUrl =
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        }).toString();

    window.location.href = authUrl;
}

// ============================================
// OAUTH: CODE ERKENNEN NACH REDIRECT
// ============================================

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");

    if (!code) return;

    // Cleanup URL
    window.history.replaceState({}, document.title, META_OAUTH_CONFIG.redirectUri);

    showToast("Meta-Code empfangen – tausche Token aus...", "info");

    await exchangeMetaCodeForToken(code);
}

// ============================================
// OAUTH: CODE → TOKEN
// ============================================

async function exchangeMetaCodeForToken(code) {
    try {
        const body = {
            code,
            redirectUri: META_OAUTH_CONFIG.redirectUri
        };

        const response = await fetch(META_BACKEND_CONFIG.tokenEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!data.success) {
            console.error("Token error:", data);
            showToast("Fehler beim Verbinden mit Meta.", "error");
            return;
        }

        // Erfolg!
        AppState.meta.accessToken = data.accessToken;
        AppState.metaConnected = true;
        saveAppState(AppState);

        showToast("Mit Meta verbunden!", "success");
        updateUI(); // <- FIX

    } catch (err) {
        console.error("Meta OAuth Fehler:", err);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

// ============================================
// VIEW HANDLING (FIXED)
// ============================================

function showView(viewId) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.add("hidden"));

    const target = document.getElementById(viewId);
    if (target) target.classList.remove("hidden");

    AppState.currentView = viewId;

    updateUI(); // <- handleViewRendering() ersetzt
}

// ============================================
// UPDATE UI (Haupt-Render)
// ============================================

function updateUI() {
    checkMetaConnection();

    const dashboard = document.getElementById("dashboardView");
    if (dashboard) {
        dashboard.querySelector(".statusMeta").innerText =
            AppState.metaConnected ? "Verbunden" : "Nicht verbunden";
    }

    updateSidebarActiveState();
}

function updateSidebarActiveState() {
    const buttons = document.querySelectorAll(".sidebar button[data-view]");
    buttons.forEach(btn => {
        const target = btn.getAttribute("data-view");
        if (target === AppState.currentView) {
            btn.classList.add("active");
        } else {
            btn.classList.remove("active");
        }
    });
}

// ============================================
// STATE SPEICHERN
// ============================================

function saveAppState() {
    localStorage.setItem("SignalOneState", JSON.stringify(AppState));
}

function loadAppState() {
    try {
        const stored = JSON.parse(localStorage.getItem("SignalOneState"));
        if (stored) Object.assign(AppState, stored);
    } catch (err) {
        console.warn("Konnte AppState nicht laden:", err);
    }
}

// ============================================
// TOAST SYSTEM
// ============================================

function showToast(message, type = "info") {
    const toastContainer = document.getElementById("toastContainer");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

// ============================================
// INIT
// ============================================

window.addEventListener("DOMContentLoaded", () => {
    loadAppState();
    updateUI();
    handleMetaOAuthRedirectIfPresent();
});
