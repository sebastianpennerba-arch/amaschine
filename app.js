/**
 * SIGNALONE — APP.JS (Dashboard + Meta Connect + Campaigns)
 * - Meta OAuth Flow (Connect + Disconnect)
 * - Klarer Verbindungsstatus (Top-Pill + Sidebar + Stripe)
 * - Sidebar Navigation & Views
 * - Dashboard KPIs & Hero-Kampagnen (Live + Fallback)
 * - Campaigns Table (Live + Fallback)
 * - Brand- & Campaign-Dropdowns an Live Meta API angebunden
 * - Aggregation: "Alle Kampagnen" vs. einzelne Kampagne
 * - Dynamischer Zeitraum (aus date_start / date_stop vom Meta Insight)
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
        insightsByCampaign: {}, // Cache für Kampagnen-Insights
        user: null
    },
    selectedAccountId: null,
    selectedCampaignId: null, // null = "Alle Kampagnen"
    dashboardLoaded: false,
    campaignsLoaded: false,
    dashboardMetrics: null // { spend, roas, ctr, cpm, scopeLabel, timeRangeLabel }
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
        daily_budget: 50000,
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
    insightsEndpoint: (campaignId) => `https://signalone-backend.onrender.com/api/meta/insights/${campaignId}`,
    meEndpoint: "https://signalone-backend.onrender.com/api/meta/me"
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

// Modal Helper
function openModal(title, bodyHtml) {
    const overlay = document.getElementById("modalOverlay");
    const titleEl = document.getElementById("modalTitle");
    const bodyEl = document.getElementById("modalBody");
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    overlay.classList.add("visible");
}

function closeModal() {
    const overlay = document.getElementById("modalOverlay");
    if (!overlay) return;
    overlay.classList.remove("visible");
}
window.closeModal = closeModal;

// ============================================
// GREETING / USERNAME
// ============================================

function updateGreeting() {
    const titleEl = document.getElementById("greetingTitle");
    if (!titleEl) return;

    const base = "Guten Tag";
    if (AppState.meta && AppState.meta.user && AppState.meta.user.name) {
        titleEl.textContent = `${base}, ${AppState.meta.user.name}!`;
    } else {
        titleEl.textContent = `${base}!`;
    }
}

async function fetchMetaUser() {
    if (!AppState.meta.accessToken) return;
    try {
        const res = await fetch(META_BACKEND_CONFIG.meEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        });
        const data = await res.json();
        if (data && data.success && data.data) {
            AppState.meta.user = {
                id: data.data.id,
                name: data.data.name
            };
            updateGreeting();
        }
    } catch (e) {
        console.warn("fetchMetaUser error:", e);
    }
}

// ============================================
// META CONNECT / DISCONNECT LOGIC
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
        if (pillLabel) pillLabel.textContent = "Verbunden mit Meta Ads";
        if (pillDot) pillDot.style.backgroundColor = "var(--success)";
        if (sidebarLabel) sidebarLabel.textContent = "Meta Ads (Live)";
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

function disconnectMeta() {
    AppState.metaConnected = false;
    AppState.meta = {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        insightsByCampaign: {},
        user: null
    };
    AppState.selectedAccountId = null;
    AppState.selectedCampaignId = null;
    AppState.dashboardLoaded = false;
    AppState.campaignsLoaded = false;
    AppState.dashboardMetrics = null;
    updateGreeting();
    showToast("Verbindung zu Meta wurde getrennt.", "info");
    updateUI();
}

async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

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
        AppState.dashboardMetrics = null;
        AppState.meta.insightsByCampaign = {};

        await fetchMetaUser();
        showToast("Mit Meta verbunden!", "success");
        updateUI();
    } catch (e) {
        console.error(e);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

// ============================================
// META API CALLS
// ============================================

async function fetchMetaAdAccounts() {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.adAccountsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);
    if (!res) return { success: false };
    return await res.json();
}

async function fetchMetaCampaigns(accountId) {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.campaignsEndpoint(accountId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);
    if (!res) return { success: false };
    return await res.json();
}

async function fetchMetaCampaignInsights(campaignId) {
    if (!AppState.meta.accessToken) return { success: false, error: "No access token" };

    const res = await fetch(META_BACKEND_CONFIG.insightsEndpoint(campaignId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);
    if (!res) return { success: false };
    return await res.json();
}

// ============================================
// DATUMS-HILFSFUNKTIONEN FÜR DASHBOARD
// ============================================

function buildTimeRangeLabel(dateStartStr, dateStopStr) {
    if (!dateStartStr || !dateStopStr) return "Standard (Meta Zeitraum)";

    const start = new Date(dateStartStr);
    const stop = new Date(dateStopStr);
    if (isNaN(start) || isNaN(stop)) return "Standard (Meta Zeitraum)";

    const diffMs = stop - start;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    const sameDay =
        start.getFullYear() === stop.getFullYear() &&
        start.getMonth() === stop.getMonth() &&
        start.getDate() === stop.getDate();

    const today = new Date();
    const isToday =
        start.getFullYear() === today.getFullYear() &&
        start.getMonth() === today.getMonth() &&
        start.getDate() === today.getDate() &&
        sameDay;

    if (isToday) return "Heute";
    if (sameDay) return start.toLocaleDateString("de-DE");

    if (diffDays <= 3) return `Letzte ${diffDays} Tage`;
    if (diffDays === 7) return "Letzte 7 Tage";
    if (diffDays === 30) return "Letzte 30 Tage";

    return `${start.toLocaleDateString("de-DE")} – ${stop.toLocaleDateString("de-DE")}`;
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

    select.onchange = async (e) => {
        AppState.selectedAccountId = e.target.value;
        AppState.selectedCampaignId = null;
        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;
        AppState.dashboardMetrics = null;
        AppState.meta.insightsByCampaign = {};
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

    const allOpt = document.createElement("option");
    allOpt.value = "all";
    allOpt.textContent = `Alle Kampagnen (${total})`;
    select.appendChild(allOpt);

    campaigns.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c.id;
        opt.textContent = c.name || c.id;
        select.appendChild(opt);
    });

    if (AppState.selectedCampaignId) {
        select.value = AppState.selectedCampaignId;
    } else {
        select.value = "all";
    }

    select.onchange = async (e) => {
        const val = e.target.value;
        AppState.selectedCampaignId = val === "all" ? null : val;
        AppState.dashboardLoaded = false;
        AppState.dashboardMetrics = null;
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
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM</div>
                <div class="kpi-value">–</div>
                <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
            </div>
        </div>
    `;
}

function renderDashboardKpisLive(spend, roas, ctr, cpm) {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    const safe = (v, unit = "") => {
        const n = Number(v);
        if (!isFinite(n)) return "–";
        if (n === 0) return "0";
        if (unit === "€") return `€ ${n.toLocaleString("de-DE")}`;
        if (unit === "%") return `${n.toFixed(2)}%`;
        if (unit === "x") return `${n.toFixed(2)}x`;
        return n.toString();
    };

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend</div>
                <div class="kpi-value">${safe(spend, "€")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS</div>
                <div class="kpi-value">${safe(roas, "x")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR</div>
                <div class="kpi-value">${safe(ctr, "%")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM</div>
                <div class="kpi-value">${safe(cpm, "€")}</div>
            </div>
        </div>
    `;
}

function renderDashboardChart() {
    const container = document.getElementById("dashboardChartContainer");
    if (!container) return;

    const metrics = AppState.dashboardMetrics;

    if (!metrics) {
        container.innerHTML = `
            <div class="card performance-card">
                <div class="card-header">
                    <h3>Performance Profil</h3>
                </div>
                <div class="chart-placeholder">
                    Verbinde Meta, um deinen Performance-Zeitraum zu sehen.
                </div>
            </div>
        `;
        return;
    }

    const spend = Number(metrics.spend) || 0;
    const roas = Number(metrics.roas) || 0;
    const ctr = Number(metrics.ctr) || 0;
    const cpm = Number(metrics.cpm) || 0;
    const scopeLabel = metrics.scopeLabel || "Aktuelle Auswahl";
    const timeRangeLabel = metrics.timeRangeLabel || "Standard (Meta Zeitraum)";

    const items = [
        { key: "spend", label: "Spend", value: spend, formatted: spend > 0 ? `€ ${spend.toLocaleString("de-DE")}` : "0" },
        { key: "roas", label: "ROAS", value: roas, formatted: roas > 0 ? `${roas.toFixed(2)}x` : "0" },
        { key: "ctr", label: "CTR", value: ctr, formatted: ctr > 0 ? `${ctr.toFixed(2)}%` : "0" },
        { key: "cpm", label: "CPM", value: cpm, formatted: cpm > 0 ? `€ ${cpm.toFixed(2)}` : "0" }
    ];

    const values = items.map(i => i.value > 0 ? i.value : 0);
    const maxVal = Math.max(...values, 1);

    const rowsHtml = items.map(i => {
        const pct = i.value > 0 ? Math.max(8, Math.min(100, (i.value / maxVal) * 100)) : 8;
        return `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:110px; font-size:12px; color:var(--text-secondary);">${i.label}</div>
                <div style="flex:1; height:8px; border-radius:999px; background:rgba(148,163,184,0.35); overflow:hidden;">
                    <div style="width:${pct}%; height:100%; border-radius:inherit; background:var(--color-primary);"></div>
                </div>
                <div style="width:90px; text-align:right; font-size:12px; color:var(--text-primary);">${i.formatted}</div>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <div>
                    <h3>Performance Profil</h3>
                    <div style="font-size:12px; color:var(--text-secondary); margin-top:4px;">
                        Basis: ${scopeLabel} • Zeitraum: ${timeRangeLabel}
                    </div>
                </div>
            </div>
            <div class="chart-placeholder">
                <div style="width:100%; max-width:640px; display:flex; flex-direction:column; gap:12px;">
                    ${rowsHtml}
                </div>
            </div>
        </div>
    `;
}

// HERO „KAMPAGNEN“ (Top-Kampagnen)
function renderDashboardHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");
    if (!container) return;

    const entries = Object.entries(AppState.meta.insightsByCampaign || {});
    const campaigns = AppState.meta.campaigns || [];

    if (!AppState.metaConnected || !entries.length || !campaigns.length) {
        // Klarer Hinweis statt Fake-Creatives
        container.innerHTML = `
            <div class="card">
                <h3>Top-Kampagnen</h3>
                <p style="color: var(--text-secondary); font-size:14px; margin-top:8px;">
                    Sobald deine Kampagnen mit Spend und Ergebnissen laufen, siehst du hier deine Top-Kampagnen.
                </p>
            </div>
        `;
        return;
    }

    const enriched = entries.map(([id, m]) => {
        const camp = campaigns.find(c => c.id === id) || { name: id };
        return {
            id,
            name: camp.name || id,
            spend: m.spend || 0,
            roas: m.roas || 0,
            ctr: m.ctr || 0
        };
    });

    enriched.sort((a, b) => {
        const aScore = (a.roas || 0) * (a.spend || 0);
        const bScore = (b.roas || 0) * (b.spend || 0);
        return bScore - aScore;
    });

    const top3 = enriched.slice(0, 3);

    container.innerHTML = `
        <div class="card" style="margin-bottom: 16px;">
            <h3 style="margin-bottom: 8px;">Top-Kampagnen (Impact-basiert)</h3>
            <p style="color: var(--text-secondary); font-size:12px;">
                Ranking nach Spend × ROAS. Perfekt, um schnell die stärksten Kampagnen zu erkennen.
            </p>
        </div>
        <div class="hero-grid">
            ${top3.map((c, idx) => `
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div class="creative-faux-thumb">
                            <span>#${idx + 1}</span>
                        </div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">${c.name}</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS</span>
                            <span class="kpi-value-mini">${c.roas > 0 ? c.roas.toFixed(2) + "x" : "0"}</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>Spend</span>
                            <span class="kpi-value-mini">${c.spend > 0 ? "€ " + c.spend.toLocaleString("de-DE") : "0"}</span>
                        </div>
                        <div class="creative-kpi-bar">
                            <span>CTR</span>
                            <span class="kpi-value-mini">${c.ctr > 0 ? c.ctr.toFixed(2) + "%" : "0"}</span>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

// ============================================
// AGGREGATION: MEHRERE KAMPAGNEN (für Dashboard)
// ============================================

async function aggregateInsightsForCampaigns(campaignIds) {
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let roasWeightedSum = 0;
    let roasWeight = 0;
    let minStart = null;
    let maxStop = null;

    for (const id of campaignIds) {
        try {
            const cached = AppState.meta.insightsByCampaign[id];
            let d;

            if (cached && cached.raw) {
                d = cached.raw;
            } else {
                const insights = await fetchMetaCampaignInsights(id);
                if (
                    !insights.success ||
                    !insights.data ||
                    !Array.isArray(insights.data.data) ||
                    insights.data.data.length === 0
                ) {
                    continue;
                }
                d = insights.data.data[0];
                storeCampaignInsightInCache(id, d);
            }

            if (!d) continue;

            const spend = parseFloat(d.spend || "0") || 0;
            const impressions = parseFloat(d.impressions || "0") || 0;
            const clicks = parseFloat(d.clicks || "0") || 0;

            let roasVal = 0;
            if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length > 0) {
                roasVal = parseFloat(d.website_purchase_roas[0].value || "0") || 0;
            }

            totalSpend += spend;
            totalImpressions += impressions;
            totalClicks += clicks;

            if (spend > 0 && roasVal > 0) {
                roasWeightedSum += roasVal * spend;
                roasWeight += spend;
            }

            if (d.date_start && d.date_stop) {
                const start = new Date(d.date_start);
                const stop = new Date(d.date_stop);
                if (!isNaN(start)) {
                    if (!minStart || start < minStart) minStart = start;
                }
                if (!isNaN(stop)) {
                    if (!maxStop || stop > maxStop) maxStop = stop;
                }
            }
        } catch (e) {
            console.warn("Aggregation Insights Fehler für Kampagne:", id, e);
        }
    }

    if (totalSpend === 0 && totalImpressions === 0 && totalClicks === 0) {
        return null;
    }

    const aggSpend = totalSpend;
    const aggCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const aggCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;
    const aggRoas = roasWeight > 0 ? roasWeightedSum / roasWeight : 0;

    let dateStartStr = null;
    let dateStopStr = null;
    if (minStart && maxStop) {
        dateStartStr = minStart.toISOString().slice(0, 10);
        dateStopStr = maxStop.toISOString().slice(0, 10);
    }

    return {
        spend: aggSpend,
        ctr: aggCtr,
        cpm: aggCpm,
        roas: aggRoas,
        dateStartStr,
        dateStopStr
    };
}

function storeCampaignInsightInCache(campaignId, d) {
    if (!AppState.meta.insightsByCampaign) {
        AppState.meta.insightsByCampaign = {};
    }

    const spend = Number(d.spend || 0);
    let roas = 0;
    if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length > 0) {
        roas = Number(d.website_purchase_roas[0].value || 0);
    }
    const ctr = Number(d.ctr || 0);
    const cpm = Number(d.cpm || 0);

    AppState.meta.insightsByCampaign[campaignId] = {
        spend,
        roas,
        ctr,
        cpm,
        raw: d
    };
}

async function loadDashboardMetaData() {
    try {
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
            AppState.dashboardMetrics = {
                spend: 0,
                roas: 0,
                ctr: 0,
                cpm: 0,
                scopeLabel: "Keine Daten",
                timeRangeLabel: "Keine Daten"
            };
            renderDashboardKpisLive(0, 0, 0, 0);
            renderDashboardChart();
            AppState.dashboardLoaded = true;
            renderDashboardHeroCreatives();
            return;
        }

        const accounts = accountsResult.data.data;
        AppState.meta.adAccounts = accounts;

        if (!AppState.selectedAccountId) {
            AppState.selectedAccountId = accounts[0].id;
        }

        populateBrandDropdown();

        const campaignsResult = await fetchMetaCampaigns(AppState.selectedAccountId);

        if (
            !campaignsResult.success ||
            !campaignsResult.data ||
            !Array.isArray(campaignsResult.data.data) ||
            campaignsResult.data.data.length === 0
        ) {
            console.warn("Keine Meta Kampagnen gefunden.");
            AppState.meta.campaigns = [];
            populateCampaignDropdown();
            AppState.dashboardMetrics = {
                spend: 0,
                roas: 0,
                ctr: 0,
                cpm: 0,
                scopeLabel: "Keine Kampagnen",
                timeRangeLabel: "Keine Daten"
            };
            renderDashboardKpisLive(0, 0, 0, 0);
            renderDashboardChart();
            AppState.dashboardLoaded = true;
            renderDashboardHeroCreatives();
            return;
        }

        const campaigns = campaignsResult.data.data;
        AppState.meta.campaigns = campaigns;

        if (
            AppState.selectedCampaignId &&
            !campaigns.some((c) => c.id === AppState.selectedCampaignId)
        ) {
            AppState.selectedCampaignId = null;
        }

        populateCampaignDropdown();

        let spend, cpm, ctr, roas, scopeLabel, timeRangeLabel;

        if (!AppState.selectedCampaignId) {
            const ids = campaigns.map((c) => c.id);
            const agg = await aggregateInsightsForCampaigns(ids);
            if (!agg) {
                console.warn("Keine aggregierten Insights.");
                AppState.dashboardMetrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
                renderDashboardKpisLive(0, 0, 0, 0);
                renderDashboardChart();
                AppState.dashboardLoaded = true;
                renderDashboardHeroCreatives();
                return;
            }
            spend = agg.spend;
            cpm = agg.cpm;
            ctr = agg.ctr;
            roas = agg.roas;
            scopeLabel = `Alle Kampagnen (${campaigns.length})`;
            timeRangeLabel = buildTimeRangeLabel(agg.dateStartStr, agg.dateStopStr);
        } else {
            const insights = await fetchMetaCampaignInsights(AppState.selectedCampaignId);

            if (
                !insights.success ||
                !insights.data ||
                !Array.isArray(insights.data.data) ||
                insights.data.data.length === 0
            ) {
                console.warn("Keine Insights für ausgewählte Kampagne.");
                AppState.dashboardMetrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
                renderDashboardKpisLive(0, 0, 0, 0);
                renderDashboardChart();
                AppState.dashboardLoaded = true;
                renderDashboardHeroCreatives();
                return;
            }

            const d = insights.data.data[0];
            storeCampaignInsightInCache(AppState.selectedCampaignId, d);

            spend = parseFloat(d.spend || "0") || 0;
            cpm = parseFloat(d.cpm || "0") || 0;
            ctr = parseFloat(d.ctr || "0") || 0;
            roas = 0;
            if (Array.isArray(d.website_purchase_roas) && d.website_purchase_roas.length > 0) {
                roas = parseFloat(d.website_purchase_roas[0].value || "0") || 0;
            }

            const selectedCampaign = campaigns.find(c => c.id === AppState.selectedCampaignId);
            scopeLabel = selectedCampaign ? selectedCampaign.name : "Ausgewählte Kampagne";
            timeRangeLabel = buildTimeRangeLabel(d.date_start, d.date_stop);
        }

        AppState.dashboardMetrics = {
            spend: Number(spend) || 0,
            roas: Number(roas) || 0,
            ctr: Number(ctr) || 0,
            cpm: Number(cpm) || 0,
            scopeLabel,
            timeRangeLabel
        };

        renderDashboardKpisLive(spend, roas, ctr, cpm);
        renderDashboardChart();
        AppState.dashboardLoaded = true;
        renderDashboardHeroCreatives();
    } catch (e) {
        console.error("loadDashboardMetaData error:", e);
        AppState.dashboardMetrics = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            scopeLabel: "Fehler",
            timeRangeLabel: "Fehler"
        };
        renderDashboardKpisLive(0, 0, 0, 0);
        renderDashboardChart();
        AppState.dashboardLoaded = true;
        renderDashboardHeroCreatives();
    }
}

// ============================================
// CAMPAIGNS RENDERING
// ============================================

function renderCampaignsPlaceholder(text = "Verbinde Meta, um deine Kampagnen anzuzeigen.") {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="padding:16px; color: var(--text-secondary); text-align:center;">
                ${text}
            </td>
        </tr>
    `;
}

function renderCampaignsLoading() {
    renderCampaignsPlaceholder("Lade Kampagnen & Metriken aus Meta...");
}

function formatEuro(value) {
    const n = Number(value);
    if (!isFinite(n) || n === 0) return "0";
    return `€ ${n.toLocaleString("de-DE")}`;
}

function formatPercent(value) {
    const n = Number(value);
    if (!isFinite(n) || n === 0) return "0";
    return `${n.toFixed(2)}%`;
}

function formatRoas(value) {
    const n = Number(value);
    if (!isFinite(n) || n === 0) return "0";
    return `${n.toFixed(2)}x`;
}

function getStatusIndicatorClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "active") return "status-green";
    if (s === "paused") return "status-yellow";
    if (s === "deleted" || s === "archived") return "status-red";
    return "status-yellow";
}

async function loadLiveCampaignTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    renderCampaignsLoading();

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

        if (!AppState.meta.insightsByCampaign) {
            AppState.meta.insightsByCampaign = {};
        }

        const rows = [];

        for (let c of list) {
            let kpisObj = AppState.meta.insightsByCampaign[c.id];

            if (!kpisObj || !kpisObj.raw) {
                const insights = await fetchMetaCampaignInsights(c.id);
                const d =
                    insights.success &&
                    insights.data &&
                    Array.isArray(insights.data.data) &&
                    insights.data.data[0]
                        ? insights.data.data[0]
                        : null;

                if (d) {
                    storeCampaignInsightInCache(c.id, d);
                    kpisObj = AppState.meta.insightsByCampaign[c.id];
                } else {
                    kpisObj = {
                        spend: 0,
                        roas: 0,
                        ctr: 0,
                        cpm: 0
                    };
                }
            }

            rows.push({
                campaign: c,
                metrics: kpisObj
            });
        }

        const searchInput = document.getElementById("campaignSearch");
        const statusFilter = document.getElementById("campaignStatusFilter");

        const searchTerm = searchInput ? searchInput.value.trim().toLowerCase() : "";
        const statusValue = statusFilter ? statusFilter.value : "all";

        let filteredRows = rows;

        if (searchTerm) {
            filteredRows = filteredRows.filter(({ campaign }) =>
                (campaign.name || "").toLowerCase().includes(searchTerm) ||
                (campaign.id || "").toLowerCase().includes(searchTerm)
            );
        }

        if (statusValue !== "all") {
            filteredRows = filteredRows.filter(({ campaign }) => {
                const status = (campaign.status || "").toLowerCase();
                if (statusValue === "active") return status === "active";
                if (statusValue === "paused") return status === "paused";
                if (statusValue === "completed") return status === "completed";
                return true;
            });
        }

        filteredRows.sort((a, b) => (b.metrics.spend || 0) - (a.metrics.spend || 0));

        tbody.innerHTML = "";

        filteredRows.forEach(({ campaign: c, metrics: kpis }) => {
            const spend = Number(kpis.spend || 0);
            const roas = Number(kpis.roas || 0);
            const ctr = Number(kpis.ctr || 0);
            const dailyBudget = Number(c.daily_budget || 0) / 100;

            const tr = document.createElement("tr");
            const statusIndicatorClass = getStatusIndicatorClass(c.status);

            tr.innerHTML = `
                <td><span class="status-indicator ${statusIndicatorClass}"></span> ${c.status || "-"}</td>
                <td>${c.name || c.id}</td>
                <td>${c.objective || "-"}</td>
                <td>${formatEuro(dailyBudget)}</td>
                <td>${formatEuro(spend)}</td>
                <td>${formatRoas(roas)}</td>
                <td>${formatPercent(ctr)}</td>
                <td><button class="action-button campaign-details-btn" data-campaign-id="${c.id}">Details</button></td>
            `;

            tbody.appendChild(tr);
        });

        if (!filteredRows.length) {
            renderCampaignsPlaceholder("Keine Kampagnen entsprechen den aktuellen Filtern.");
        }

        tbody.querySelectorAll(".campaign-details-btn").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                const campaignId = e.currentTarget.getAttribute("data-campaign-id");
                await openCampaignDetails(campaignId);
            });
        });

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
        const statusIndicatorClass = getStatusIndicatorClass(c.status);

        tr.innerHTML = `
            <td><span class="status-indicator ${statusIndicatorClass}"></span> ${c.status}</td>
            <td>${c.name}</td>
            <td>${c.objective}</td>
            <td>${formatEuro(c.daily_budget / 100)}</td>
            <td>${formatEuro(c.spend)}</td>
            <td>${formatRoas(c.roas)}</td>
            <td>${formatPercent(c.ctr)}</td>
            <td><button class="action-button">Details</button></td>
        `;

        tbody.appendChild(tr);
    });
}

async function openCampaignDetails(campaignId) {
    if (!campaignId) return;

    let metrics = AppState.meta.insightsByCampaign[campaignId];

    if (!metrics || !metrics.raw) {
        const insights = await fetchMetaCampaignInsights(campaignId);
        if (
            insights.success &&
            insights.data &&
            Array.isArray(insights.data.data) &&
            insights.data.data[0]
        ) {
            storeCampaignInsightInCache(campaignId, insights.data.data[0]);
            metrics = AppState.meta.insightsByCampaign[campaignId];
        }
    }

    const campaign = (AppState.meta.campaigns || []).find(c => c.id === campaignId) || { name: campaignId };
    const m = metrics || { spend: 0, roas: 0, ctr: 0, cpm: 0 };

    const html = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <div><strong>Status:</strong> ${campaign.status || "-"}</div>
            <div><strong>Objective:</strong> ${campaign.objective || "-"}</div>
            <div><strong>Ad Spend:</strong> ${formatEuro(m.spend)}</div>
            <div><strong>ROAS:</strong> ${formatRoas(m.roas)}</div>
            <div><strong>CTR:</strong> ${formatPercent(m.ctr)}</div>
            <div><strong>CPM:</strong> ${formatEuro(m.cpm)}</div>
        </div>
   `;

    openModal(`Kampagne: ${campaign.name || campaignId}`, html);
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
    updateGreeting();

    if (AppState.currentView === "dashboardView") {
        if (connected) {
            if (!AppState.dashboardLoaded) {
                loadDashboardMetaData();
            } else if (AppState.dashboardMetrics) {
                renderDashboardKpisLive(
                    AppState.dashboardMetrics.spend,
                    AppState.dashboardMetrics.roas,
                    AppState.dashboardMetrics.ctr,
                    AppState.dashboardMetrics.cpm
                );
                renderDashboardChart();
                renderDashboardHeroCreatives();
            }
        } else {
            renderDashboardKpisPlaceholder();
            renderDashboardChart();
            renderDashboardHeroCreatives();
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
    showView(AppState.currentView);
    initSidebarNavigation();

    const metaBtn = document.getElementById("connectMetaButton");
    if (metaBtn) metaBtn.addEventListener("click", handleMetaConnectClick);

    const disconnectBtn = document.getElementById("disconnectMetaButton");
    if (disconnectBtn) {
        disconnectBtn.addEventListener("click", (e) => {
            e.preventDefault();
            disconnectMeta();
        });
    }

    initDateTime();
    updateGreeting();
    handleMetaOAuthRedirectIfPresent();

    const searchInput = document.getElementById("campaignSearch");
    const statusFilter = document.getElementById("campaignStatusFilter");

    if (searchInput) {
        searchInput.addEventListener("input", () => {
            if (!AppState.metaConnected) return;
            AppState.campaignsLoaded = false;
            loadLiveCampaignTable();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener("change", () => {
            if (!AppState.metaConnected) return;
            AppState.campaignsLoaded = false;
            loadLiveCampaignTable();
        });
    }
});
