/**
 * SIGNALONE — FINAL WORKING APP.JS
 * - Meta OAuth
 * - Klarer Verbindungsstatus
 * - Sidebar Navigation
 * - Dashboard KPIs & Hero-Creatives (Demo)
 * - Campaigns Table (Demo)
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

// Demo-Daten für Dashboard & Campaigns (bis Live-Meta-Daten angebunden sind)
const DEMO_DASHBOARD = {
    spend: 12450,
    roas: 3.8,
    conversions: 327,
    cpm: 9.4,
    trendSpend: "+12%",
    trendRoas: "+8%",
    trendConv: "+5%",
    trendCpm: "-3%"
};

const DEMO_CAMPAIGNS = [
    {
        id: "CAMP-001",
        name: "Scaling Q1 – Main Funnel",
        status: "active",
        goal: "Scaling",
        dailyBudget: 500,
        spend30d: 14500,
        roas30d: 3.9,
        ctr: "2.4%"
    },
    {
        id: "CAMP-002",
        name: "Creative Testing – Hooks Batch 3",
        status: "paused",
        goal: "Testing",
        dailyBudget: 150,
        spend30d: 2900,
        roas30d: 2.1,
        ctr: "1.8%"
    },
    {
        id: "CAMP-003",
        name: "Retargeting – Warm Traffic 30D",
        status: "active",
        goal: "Scaling",
        dailyBudget: 200,
        spend30d: 6200,
        roas30d: 4.3,
        ctr: "3.1%"
    }
];

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
    const connected = !!(AppState.metaConnected && AppState.meta.accessToken);

    const stripe = document.getElementById("metaConnectStripe");
    const stripeText = document.getElementById("metaStripeText");
    const pill = document.getElementById("metaConnectionPill");
    const pillLabel = document.getElementById("metaConnectionLabel");
    const pillDot = document.getElementById("metaConnectionDot");
    const sidebarLabel = document.getElementById("sidebarMetaStatusLabel");
    const sidebarIndicator = document.getElementById("sidebarMetaStatusIndicator");

    if (connected) {
        if (stripe) stripe.classList.add("hidden");
        if (stripeText) {
            stripeText.innerHTML = '<i class="fas fa-plug"></i> Mit Meta Ads verbunden';
        }

        if (pill) {
            pill.classList.add("meta-connected");
            pill.classList.remove("meta-disconnected");
        }
        if (pillLabel) {
            pillLabel.textContent = "Verbunden mit Meta Ads";
        }
        if (pillDot) {
            pillDot.style.backgroundColor = "var(--success)";
        }

        if (sidebarLabel) {
            sidebarLabel.textContent = "Meta Ads (Live)";
        }
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-red");
            sidebarIndicator.classList.add("status-green");
        }

        return true;
    } else {
        if (stripe) stripe.classList.remove("hidden");
        if (stripeText) {
            stripeText.innerHTML = '<i class="fas fa-plug"></i> Nicht mit Meta Ads verbunden';
        }

        if (pill) {
            pill.classList.add("meta-disconnected");
            pill.classList.remove("meta-connected");
        }
        if (pillLabel) {
            pillLabel.textContent = "Nicht mit Meta verbunden";
        }
        if (pillDot) {
            pillDot.style.backgroundColor = "var(--danger)";
        }

        if (sidebarLabel) {
            sidebarLabel.textContent = "Meta Ads (Offline)";
        }
        if (sidebarIndicator) {
            sidebarIndicator.classList.remove("status-green");
            sidebarIndicator.classList.add("status-red");
        }

        return false;
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
        console.error("Token exchange error:", data);
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
            if (!targetView) return;
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
    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");

    AppState.currentView = viewId;
    updateUI();
}

// ============================================
// DASHBOARD RENDERING
// ============================================

function renderDashboardKpis() {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    const d = DEMO_DASHBOARD;

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend (30D)</div>
                <div class="kpi-value">€ ${d.spend.toLocaleString("de-DE")}</div>
                <div class="kpi-trend trend-positive">${d.trendSpend} vs. Vormonat</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS (30D)</div>
                <div class="kpi-value">${d.roas.toFixed(1)}x</div>
                <div class="kpi-trend trend-positive">${d.trendRoas} vs. Vormonat</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-bullseye"></i> Conversions (30D)</div>
                <div class="kpi-value">${d.conversions}</div>
                <div class="kpi-trend trend-positive">${d.trendConv} vs. Vormonat</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM (30D)</div>
                <div class="kpi-value">€ ${d.cpm.toFixed(2)}</div>
                <div class="kpi-trend trend-neutral">${d.trendCpm} vs. Vormonat</div>
            </div>
        </div>
    `;
}

function renderDashboardChart() {
    const container = document.getElementById("dashboardChartContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <h3>Performance Verlauf</h3>
                <div class="controls">
                    <div class="time-range-group">
                        <button class="active">7D</button>
                        <button>30D</button>
                        <button>90D</button>
                    </div>
                </div>
            </div>
            <div class="chart-placeholder">
                Charts folgen nach Meta Live-Daten Integration.
            </div>
        </div>
    `;
}

function renderDashboardHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="hero-grid">
            <div class="creative-hero-item">
                <div class="creative-media-container">
                    <img src="https://via.placeholder.com/400x200?text=Top+Creative+1" alt="Creative 1">
                </div>
                <div class="creative-details">
                    <div class="creative-name">Hook: "Stop Scrolling – Scale Smart"</div>
                    <div class="creative-kpi-bar">
                        <span>ROAS</span>
                        <span class="kpi-value-mini">4.2x</span>
                    </div>
                </div>
            </div>
            <div class="creative-hero-item">
                <div class="creative-media-container">
                    <img src="https://via.placeholder.com/400x200?text=Top+Creative+2" alt="Creative 2">
                </div>
                <div class="creative-details">
                    <div class="creative-name">UGC: "Honest Review Clip"</div>
                    <div class="creative-kpi-bar">
                        <span>CTR</span>
                        <span class="kpi-value-mini">3.1%</span>
                    </div>
                </div>
            </div>
            <div class="creative-hero-item">
                <div class="creative-media-container">
                    <img src="https://via.placeholder.com/400x200?text=Top+Creative+3" alt="Creative 3">
                </div>
                <div class="creative-details">
                    <div class="creative-name">Static: "Clean Product Shot"</div>
                    <div class="creative-kpi-bar">
                        <span>Spend 30D</span>
                        <span class="kpi-value-mini">€ 4.200</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// CAMPAIGNS RENDERING
// ============================================

function renderCampaignsTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    DEMO_CAMPAIGNS.forEach(c => {
        const tr = document.createElement("tr");

        let statusBadge = "";
        if (c.status === "active") {
            statusBadge = `<span class="status-indicator status-green"></span> Aktiv`;
        } else if (c.status === "paused") {
            statusBadge = `<span class="status-indicator status-yellow"></span> Pausiert`;
        } else {
            statusBadge = `<span class="status-indicator status-red"></span> ${c.status}`;
        }

        tr.innerHTML = `
            <td>${statusBadge}</td>
            <td>${c.name}</td>
            <td>${c.goal}</td>
            <td>€ ${c.dailyBudget.toLocaleString("de-DE")}</td>
            <td>€ ${c.spend30d.toLocaleString("de-DE")}</td>
            <td>${c.roas30d.toFixed(1)}x</td>
            <td>${c.ctr}</td>
            <td>
                <button class="action-button">Details</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

// ============================================
// UI UPDATE
// ============================================

function updateUI() {
    checkMetaConnection();

    if (AppState.currentView === "dashboardView") {
        renderDashboardKpis();
        renderDashboardChart();
        renderDashboardHeroCreatives();
    } else if (AppState.currentView === "campaignsView") {
        renderCampaignsTable();
    }
}

// ============================================
// TOAST SYSTEM
// ============================================

function showToast(message, type = "info") {
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

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    // Default-View anzeigen
    showView(AppState.currentView);

    // Navigation
    initSidebarNavigation();

    // Meta-Connect Button
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    // Meta-Redirect verarbeiten (falls von Meta zurück)
    handleMetaOAuthRedirectIfPresent();
});
