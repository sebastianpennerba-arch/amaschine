/**
 * SIGNALONE — FINAL APP.JS
 * - Meta OAuth Flow
 * - Klarer Verbindungsstatus (Top-Pill + Sidebar + Stripe)
 * - Sidebar Navigation & Views
 * - Dashboard KPIs & Hero-Creatives (Live + Fallback)
 * - Campaigns Table (Live + Fallback)
 * - Brand- & Campaign-Dropdowns an Live Meta API angebunden
 */

// ============================================
// GLOBAL APP STATE
// ============================================

const AppState = {
    currentView: "dashboardView",
    metaConnected: false,
    meta: {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        insightsByCampaign: {}
    },
    selectedAccountId: null,
    selectedCampaignId: null,
    dashboardLoaded: false,
    campaignsLoaded: false
};

// Demo-Daten (Fallback)
const DEMO_DASHBOARD = {
    spend: 12450,
    roas: 3.8,
    ctr: 2.4,
    cpm: 9.4
};

const DEMO_CAMPAIGNS = [
    {
        id: "CAMP-001",
        name: "Scaling Q1 – Main Funnel",
        status: "active",
        objective: "CONVERSIONS",
        daily_budget: 50000, // in Cent
        spend: 14500,
        roas: 3.9,
        ctr: 2.4
    },
    {
        id: "CAMP-002",
        name: "Creative Testing – Hooks Batch 3",
        status: "paused",
        objective: "TRAFFIC",
        daily_budget: 15000,
        spend: 2900,
        roas: 2.1,
        ctr: 1.8
    },
    {
        id: "CAMP-003",
        name: "Retargeting – Warm Traffic 30D",
        status: "active",
        objective: "CONVERSIONS",
        daily_budget: 20000,
        spend: 6200,
        roas: 4.3,
        ctr: 3.1
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
    tokenEndpoint: "https://signalone-backend.onrender.com/api/meta/oauth/token",
    adAccountsEndpoint: "https://signalone-backend.onrender.com/api/meta/adaccounts",
    campaignsEndpoint: (accountId) => `https://signalone-backend.onrender.com/api/meta/campaigns/${accountId}`,
    insightsEndpoint: (campaignId) => `https://signalone-backend.onrender.com/api/meta/insights/${campaignId}`
};

// ============================================
// TOOLS
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

    // URL aufräumen
    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Meta-Code empfangen – tausche Token aus...", "info");

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
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        AppState.selectedAccountId = null;
        AppState.selectedCampaignId = null;

        showToast("Mit Meta verbunden!", "success");
        updateUI();
    } catch (e) {
        console.error(e);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

// ============================================
// LIVE META API CALLS
// ============================================

async function fetchMetaAdAccounts() {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.adAccountsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    });
    return await res.json();
}

async function fetchMetaCampaigns(accountId) {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.campaignsEndpoint(accountId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    });
    return await res.json();
}

async function fetchMetaCampaignInsights(campaignId) {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.insightsEndpoint(campaignId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    });
    return await res.json();
}

// ============================================
// DROPDOWNS: BRANDS (ADACCOUNTS) & CAMPAIGNS
// ============================================

function populateBrandDropdown() {
    const select = document.getElementById("brandSelect");
    if (!select) return;

    const accounts = AppState.meta.adAccounts || [];

    if (!accounts.length) {
        select.innerHTML = `<option>Kein Meta Ad-Konto gefunden</option>`;
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = "";

    accounts.forEach((acc, index) => {
        const opt = document.createElement("option");
        opt.value = acc.id;

        const statusLabel =
            acc.account_status === 1
                ? "Active"
                : acc.account_status !== undefined
                ? `Status ${acc.account_status}`
                : "Unknown";

        opt.textContent = `${acc.name || acc.id} (${statusLabel})`;

        if (
            acc.id === AppState.selectedAccountId ||
            (!AppState.selectedAccountId && index === 0)
        ) {
            opt.selected = true;
            AppState.selectedAccountId = acc.id;
        }

        select.appendChild(opt);
    });

    // On change -> Account wechseln, Dashboard & Kampagnen neu laden
    select.onchange = async (e) => {
        AppState.selectedAccountId = e.target.value;
        AppState.selectedCampaignId = null;
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        await loadDashboardMetaData();
        if (AppState.currentView === "campaignsView") {
            await loadLiveCampaignTable();
        }
    };
}

function populateCampaignDropdown() {
    const select = document.getElementById("campaignGroupSelect");
    if (!select) return;

    const campaigns = AppState.meta.campaigns || [];

    if (!campaigns.length) {
        select.innerHTML = `<option>Keine Kampagnen</option>`;
        select.disabled = true;
        return;
    }

    select.disabled = false;
    select.innerHTML = "";

    const total = campaigns.length;

    // Option "Alle Kampagnen"
    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = `Alle Kampagnen (${total})`;
    select.appendChild(allOpt);

    // Einzelne Kampagnen
    campaigns.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name || c.id;
        select.appendChild(opt);
    });

    // Auswahl passend zu AppState setzen
    if (AppState.selectedCampaignId) {
        select.value = AppState.selectedCampaignId;
    } else {
        select.value = "all";
    }

    // On change -> Kampagne im State setzen & Dashboard KPIs neu laden
    select.onchange = async (e) => {
        const val = e.target.value;
        AppState.selectedCampaignId = val === "all" ? null : val;
        AppState.dashboardLoaded = false;
        await loadDashboardMetaData();
    };
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

function renderDashboardKpisPlaceholder() {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend (30D)</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS (30D)</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR (30D)</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM (30D)</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
        </div>
    `;
}

function renderDashboardKpisLive(spend, roas, ctr, cpm) {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    const spendNum = Number(spend) || 0;
    const roasNum = Number(roas) || 0;
    const ctrNum = Number(ctr) || 0;
    const cpmNum = Number(cpm) || 0;

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend (30D)</div>
                <div class="kpi-value">€ ${spendNum.toLocaleString("de-DE")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS (30D)</div>
                <div class="kpi-value">${roasNum.toFixed(2)}x</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR (30D)</div>
                <div class="kpi-value">${ctrNum.toFixed(2)}%</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM (30D)</div>
                <div class="kpi-value">€ ${cpmNum.toFixed(2)}</div>
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

async function loadDashboardMetaData() {
    try {
        // 1) Accounts laden (falls noch nicht im State)
        let accountsResult;
        if (AppState.meta.adAccounts && AppState.meta.adAccounts.length > 0) {
            accountsResult = { success: true, data: { data: AppState.meta.adAccounts } };
        } else {
            accountsResult = await fetchMetaAdAccounts();
        }

        if (
            !accountsResult.success ||
            !accountsResult.data ||
            !Array.isArray(accountsResult.data.data) ||
            accountsResult.data.data.length === 0
        ) {
            console.warn("Keine Meta Accounts gefunden. Fallback.");
            renderDashboardKpisLive(
                DEMO_DASHBOARD.spend,
                DEMO_DASHBOARD.roas,
                DEMO_DASHBOARD.ctr,
                DEMO_DASHBOARD.cpm
            );
            AppState.dashboardLoaded = true;
            return;
        }

        const accounts = accountsResult.data.data;
        AppState.meta.adAccounts = accounts;

        // Account im State setzen, falls noch nicht vorhanden
        if (!AppState.selectedAccountId) {
            AppState.selectedAccountId = accounts[0].id;
        }

        // Brand-Dropdown füllen
        populateBrandDropdown();

        // 2) Kampagnen für Account laden
        const campaignsResult = await fetchMetaCampaigns(AppState.selectedAccountId);

        if (
            !campaignsResult.success ||
            !campaignsResult.data ||
            !Array.isArray(campaignsResult.data.data) ||
            campaignsResult.data.data.length === 0
        ) {
            console.warn("Keine Meta Kampagnen gefunden. Fallback.");
            AppState.meta.campaigns = [];
            populateCampaignDropdown();
            renderDashboardKpisLive(
                DEMO_DASHBOARD.spend,
                DEMO_DASHBOARD.roas,
                DEMO_DASHBOARD.ctr,
                DEMO_DASHBOARD.cpm
            );
            AppState.dashboardLoaded = true;
            return;
        }

        const campaigns = campaignsResult.data.data;
        AppState.meta.campaigns = campaigns;

        // Kampagne im State setzen (falls noch keine oder nicht mehr gültig)
        if (
            !AppState.selectedCampaignId ||
            !campaigns.some((c) => c.id === AppState.selectedCampaignId)
        ) {
            AppState.selectedCampaignId = campaigns[0].id;
        }

        // Campaign-Dropdown füllen
        populateCampaignDropdown();

        // 3) Insights für ausgewählte Kampagne holen
        const campaignIdToUse = AppState.selectedCampaignId || campaigns[0].id;
        const insights = await fetchMetaCampaignInsights(campaignIdToUse);

        if (
            !insights.success ||
            !insights.data ||
            !Array.isArray(insights.data.data) ||
            insights.data.data.length === 0
        ) {
            console.warn("Keine Insights. Fallback.");
            renderDashboardKpisLive(
                DEMO_DASHBOARD.spend,
                DEMO_DASHBOARD.roas,
                DEMO_DASHBOARD.ctr,
                DEMO_DASHBOARD.cpm
            );
            AppState.dashboardLoaded = true;
            return;
        }

        const d = insights.data.data[0];

        const spend = d.spend ?? DEMO_DASHBOARD.spend;
        const cpm = d.cpm ?? DEMO_DASHBOARD.cpm;
        const ctr = d.ctr ?? DEMO_DASHBOARD.ctr;
        let roas = DEMO_DASHBOARD.roas;

        if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length > 0) {
            roas = d.website_purchase_roas[0].value ?? DEMO_DASHBOARD.roas;
        }

        renderDashboardKpisLive(spend, roas, ctr, cpm);
        AppState.dashboardLoaded = true;
    } catch (e) {
        console.error("loadDashboardMetaData error:", e);
        renderDashboardKpisLive(
            DEMO_DASHBOARD.spend,
            DEMO_DASHBOARD.roas,
            DEMO_DASHBOARD.ctr,
            DEMO_DASHBOARD.cpm
        );
        AppState.dashboardLoaded = true;
    }
}

// ============================================
// CAMPAIGNS RENDERING
// ============================================

function renderCampaignsPlaceholder() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="padding:16px; color: var(--text-secondary);">
                Verbinde Meta, um deine Kampagnen anzuzeigen.
            </td>
        </tr>
    `;
}

async function loadLiveCampaignTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    try {
        let accountId = AppState.selectedAccountId;

        if (!accountId) {
            const accounts = await fetchMetaAdAccounts();
            if (
                !accounts.success ||
                !accounts.data ||
                !Array.isArray(accounts.data.data) ||
                accounts.data.data.length === 0
            ) {
                console.warn("Keine Accounts für Campaigns. Fallback.");
                renderDemoCampaignsTable();
                AppState.campaignsLoaded = true;
                return;
            }
            accountId = accounts.data.data[0].id;
            AppState.selectedAccountId = accountId;
            AppState.meta.adAccounts = accounts.data.data;
            populateBrandDropdown();
        }

        const campaigns = await fetchMetaCampaigns(accountId);

        if (
            !campaigns.success ||
            !campaigns.data ||
            !Array.isArray(campaigns.data.data) ||
            campaigns.data.data.length === 0
        ) {
            console.warn("Keine Kampagnen gefunden. Fallback.");
            AppState.meta.campaigns = [];
            populateCampaignDropdown();
            renderDemoCampaignsTable();
            AppState.campaignsLoaded = true;
            return;
        }

        const list = campaigns.data.data;
        AppState.meta.campaigns = list;
        populateCampaignDropdown();

        for (let c of list) {
            const insights = await fetchMetaCampaignInsights(c.id);
            const kpis =
                insights.success &&
                insights.data &&
                Array.isArray(insights.data.data) &&
                insights.data.data[0]
                    ? insights.data.data[0]
                    : {};

            const spend = Number(kpis.spend || 0);
            let roas = 0;
            if (Array.isArray(kpis.website_purchase_roas) && kpis.website_purchase_roas.length > 0) {
                roas = Number(kpis.website_purchase_roas[0].value || 0);
            }
            const ctr = Number(kpis.ctr || 0);

            const tr = document.createElement("tr");

            let statusIndicatorClass = "status-yellow";
            if (c.status === "ACTIVE" || c.status === "active") statusIndicatorClass = "status-green";
            if (c.status === "PAUSED" || c.status === "paused") statusIndicatorClass = "status-yellow";

            const dailyBudget = Number(c.daily_budget || 0) / 100; // cent -> euro

            tr.innerHTML = `
                <td><span class="status-indicator ${statusIndicatorClass}"></span> ${c.status}</td>
                <td>${c.name}</td>
                <td>${c.objective || "-"}</td>
                <td>€ ${dailyBudget.toLocaleString("de-DE")}</td>
                <td>€ ${spend.toLocaleString("de-DE")}</td>
                <td>${roas.toFixed(2)}x</td>
                <td>${ctr.toFixed(2)}%</td>
                <td><button class="action-button">Details</button></td>
            `;

            tbody.appendChild(tr);
        }

        AppState.campaignsLoaded = true;
    } catch (e) {
        console.error("loadLiveCampaignTable error:", e);
        renderDemoCampaignsTable();
        AppState.campaignsLoaded = true;
    }
}

function renderDemoCampaignsTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    DEMO_CAMPAIGNS.forEach(c => {
        const tr = document.createElement("tr");

        let statusIndicatorClass = "status-yellow";
        if (c.status === "active") statusIndicatorClass = "status-green";
        if (c.status === "paused") statusIndicatorClass = "status-yellow";

        tr.innerHTML = `
            <td><span class="status-indicator ${statusIndicatorClass}"></span> ${c.status}</td>
            <td>${c.name}</td>
            <td>${c.objective}</td>
            <td>€ ${(c.daily_budget / 100).toLocaleString("de-DE")}</td>
            <td>€ ${c.spend.toLocaleString("de-DE")}</td>
            <td>${c.roas.toFixed(2)}x</td>
            <td>${c.ctr.toFixed(2)}%</td>
            <td><button class="action-button">Details</button></td>
        `;

        tbody.appendChild(tr);
    });
}

// ============================================
// DATUM / ZEIT
// ============================================

function initDateTime() {
    const dateEl = document.getElementById("currentDate");
    const timeEl = document.getElementById("currentTime");
    if (!dateEl || !timeEl) return;

    function update() {
        const now = new Date();
        dateEl.textContent = now.toLocaleDateString("de-DE");
        timeEl.textContent = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    }

    update();
    setInterval(update, 60 * 1000);
}

// ============================================
// UI UPDATE
// ============================================

function updateUI() {
    const connected = checkMetaConnection();

    if (AppState.currentView === "dashboardView") {
        renderDashboardChart();
        renderDashboardHeroCreatives();

        if (connected) {
            if (!AppState.dashboardLoaded) {
                loadDashboardMetaData();
            }
        } else {
            renderDashboardKpisPlaceholder();
        }
    }

    if (AppState.currentView === "campaignsView") {
        if (connected) {
            if (!AppState.campaignsLoaded) {
                loadLiveCampaignTable();
            }
        } else {
            renderCampaignsPlaceholder();
        }
    }
}

// ============================================
// INIT
// ============================================

document.addEventListener("DOMContentLoaded", () => {
    // Initial View
    showView(AppState.currentView);

    // Sidebar Navigation
    initSidebarNavigation();

    // Meta-Connect Button
    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    // Datum / Zeit
    initDateTime();

    // Meta OAuth Redirect ggf. verarbeiten
    handleMetaOAuthRedirectIfPresent();
});
