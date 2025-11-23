/** 
 * SIGNALONE — APP.JS (P1 FINAL POLISH)
 * Enthält:
 *  - Meta OAuth Flow (Connect + Disconnect)
 *  - UI-Update System (Sidebar, Topbar, Meta-Pill)
 *  - View Handling
 *  - Dashboard Rendering (KPIs, Hero Creatives)
 *  - Campaigns Rendering + Live Data + Fallback
 *  - Dropdown Handling (Brands, Campaigns)
 *  - Toast & Modal Polishing
 *  - Performance Micro-Optimizations
 *  - Clean Code Struktur
 */

/* ============================================================
   GLOBAL APP STATE
   ============================================================ */
const AppState = {
    currentView: "dashboardView",
    metaConnected: false,
    meta: {
        accessToken: null,
        adAccounts: [],
        campaigns: [],
        insightsByCampaign: {},
        user: null
    },
    selectedAccountId: null,
    selectedCampaignId: null,
    dashboardLoaded: false,
    campaignsLoaded: false,
    dashboardMetrics: null
};

// Fallback Dashboard
const DEMO_DASHBOARD = {
    spend: 12450,
    roas: 3.8,
    ctr: 2.4,
    cpm: 9.4
};

// Fallback Campaigns
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

/* ============================================================
   META CONFIG
   ============================================================ */
const META_OAUTH_CONFIG = {
    appId: "732040642590155",
    redirectUri: "https://signalone-frontend.onrender.com/",
    scopes: "ads_read,business_management"
};

const META_BACKEND_CONFIG = {
    tokenEndpoint: "https://signalone-backend.onrender.com/api/meta/oauth/token",
    adAccountsEndpoint: "https://signalone-backend.onrender.com/api/meta/adaccounts",
    campaignsEndpoint: (accountId) =>
        `https://signalone-backend.onrender.com/api/meta/campaigns/${accountId}`,
    insightsEndpoint: (campaignId) =>
        `https://signalone-backend.onrender.com/api/meta/insights/${campaignId}`,
    meEndpoint: "https://signalone-backend.onrender.com/api/meta/me"
};

/* ============================================================
   TOOLS — Toast & Modal (polished)
   ============================================================ */
function showToast(message, type = "info") {
    const box = document.getElementById("toastContainer");
    if (!box) return;

    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;

    box.appendChild(el);

    setTimeout(() => {
        el.classList.add("hide");
        setTimeout(() => el.remove(), 300);
    }, 2500);
}

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

/* ============================================================
   GREETING & USERNAME UPDATE
   ============================================================ */
function updateGreeting() {
    const titleEl = document.getElementById("greetingTitle");
    if (!titleEl) return;

    if (AppState.meta?.user?.name) {
        titleEl.textContent = `Guten Tag, ${AppState.meta.user.name}!`;
        return;
    }

    titleEl.textContent = "Guten Tag!";
}

async function fetchMetaUser() {
    if (!AppState.meta.accessToken) return;

    try {
        const res = await fetch(META_BACKEND_CONFIG.meEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        });

        const json = await res.json();
        if (json.success && json.data) {
            AppState.meta.user = {
                id: json.data.id,
                name: json.data.name
            };
            updateGreeting();
        }
    } catch (err) {
        console.warn("fetchMetaUser:", err);
    }
}

/* ============================================================
   META CONNECT / DISCONNECT
   ============================================================ */
function checkMetaConnection() {
    const connected = !!(AppState.metaConnected && AppState.meta.accessToken);

    const stripe = document.getElementById("metaConnectStripe");
    const text = document.getElementById("metaStripeText");
    const pill = document.getElementById("metaConnectionPill");
    const pillDot = document.getElementById("metaConnectionDot");
    const pillLabel = document.getElementById("metaConnectionLabel");
    const sidebarLabel = document.getElementById("sidebarMetaStatusLabel");
    const sidebarIndicator = document.getElementById("sidebarMetaStatusIndicator");

    if (connected) {
        stripe?.classList.add("hidden");
        text.innerHTML = `<i class="fas fa-plug"></i> Mit Meta Ads verbunden`;

        pill.classList.remove("meta-disconnected");
        pill.classList.add("meta-connected");

        pillLabel.textContent = "Verbunden mit Meta Ads";
        pillDot.style.backgroundColor = "var(--success)";

        sidebarLabel.textContent = "Meta Ads (Live)";
        sidebarIndicator.classList.remove("status-red");
        sidebarIndicator.classList.add("status-green");
    } else {
        stripe?.classList.remove("hidden");
        text.innerHTML = `<i class="fas fa-plug"></i> Nicht mit Meta Ads verbunden`;

        pill.classList.remove("meta-connected");
        pill.classList.add("meta-disconnected");

        pillLabel.textContent = "Nicht mit Meta verbunden";
        pillDot.style.backgroundColor = "var(--danger)";

        sidebarLabel.textContent = "Meta Ads (Offline)";
        sidebarIndicator.classList.remove("status-green");
        sidebarIndicator.classList.add("status-red");
    }

    return connected;
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

/* ============================================================
   META OAUTH — TOKEN EXCHANGE
   ============================================================ */
async function handleMetaOAuthRedirectIfPresent() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return;

    window.history.replaceState({}, "", META_OAUTH_CONFIG.redirectUri);
    showToast("Meta-Code empfangen — tausche Token aus...", "info");

    try {
        const res = await fetch(META_BACKEND_CONFIG.tokenEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code, redirectUri: META_OAUTH_CONFIG.redirectUri })
        });

        const json = await res.json();

        if (!json.success) {
            showToast("Fehler beim Verbinden mit Meta.", "error");
            return;
        }

        AppState.meta.accessToken = json.accessToken;
        AppState.metaConnected = true;

        AppState.dashboardLoaded = false;
        AppState.campaignsLoaded = false;

        AppState.selectedAccountId = null;
        AppState.selectedCampaignId = null;
        AppState.meta.insightsByCampaign = {};

        await fetchMetaUser();

        showToast("Mit Meta verbunden!", "success");
        updateUI();
    } catch (err) {
        console.error("OAuth Error:", err);
        showToast("Fehler beim Verbinden mit Meta.", "error");
    }
}

/* ============================================================
   META API CALL WRAPPERS
   ============================================================ */
async function fetchMetaAdAccounts() {
    if (!AppState.meta.accessToken) return { success: false };
    try {
        const res = await fetch(META_BACKEND_CONFIG.adAccountsEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        });

        return await res.json();
    } catch (err) {
        console.warn("fetchMetaAdAccounts:", err);
        return { success: false };
    }
}

async function fetchMetaCampaigns(accountId) {
    if (!AppState.meta.accessToken) return { success: false };

    try {
        const res = await fetch(META_BACKEND_CONFIG.campaignsEndpoint(accountId), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        });
        return await res.json();
    } catch (err) {
        console.warn("fetchMetaCampaigns:", err);
        return { success: false };
    }
}

async function fetchMetaCampaignInsights(campaignId) {
    if (!AppState.meta.accessToken) return { success: false };

    try {
        const res = await fetch(META_BACKEND_CONFIG.insightsEndpoint(campaignId), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        });
        return await res.json();
    } catch (err) {
        console.warn("fetchMetaCampaignInsights:", err);
        return { success: false };
    }
}

/* ============================================================
   DROPDOWN FILLING (Brands, Campaigns)
   ============================================================ */
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
            acc.account_status === 1 ? "Active" : `Status ${acc.account_status}`;

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

/* ============================================================
   SIDEBAR NAVIGATION
   ============================================================ */
function initSidebarNavigation() {
    const items = document.querySelectorAll(".menu-item[data-view]");
    items.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const view = item.getAttribute("data-view");
            if (view) {
                showView(view);
                setActiveMenuItem(item);
            }
        });
    });
}

function setActiveMenuItem(activeItem) {
    document
        .querySelectorAll(".menu-item")
        .forEach(i => i.classList.remove("active"));
    activeItem.classList.add("active");
}

/* ============================================================
   VIEW HANDLING
   ============================================================ */
function showView(viewId) {
    const views = document.querySelectorAll(".view");
    views.forEach(v => v.classList.add("hidden"));

    const view = document.getElementById(viewId);
    if (view) view.classList.remove("hidden");

    AppState.currentView = viewId;
    updateUI();
}

/* ============================================================
   DASHBOARD RENDERING (Placeholders + Live)
   ============================================================ */
function renderDashboardKpisPlaceholder() {
    const el = document.getElementById("dashboardKpiContainer");
    el.innerHTML = `
        <div class="kpi-grid">
            ${["Ad Spend (30D)", "ROAS (30D)", "CTR (30D)", "CPM (30D)"]
                .map(label => `
                <div class="kpi-card">
                    <div class="kpi-label"><i class="fas fa-chart-area"></i> ${label}</div>
                    <div class="kpi-value">–</div>
                    <div class="kpi-trend trend-neutral">Verbinde Meta für Live-Daten</div>
                </div>
            `).join("")}
        </div>
    `;
}

function renderDashboardKpisLive(spend, roas, ctr, cpm) {
    const el = document.getElementById("dashboardKpiContainer");

    const safe = (v, unit = "") =>
        Number(v) > 0 ? (unit === "€"
            ? `€ ${Number(v).toLocaleString("de-DE")}`
            : unit === "%"
                ? `${Number(v).toFixed(2)}%`
                : `${Number(v).toFixed(2)}x`)
        : "–";

    el.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-coins"></i> Ad Spend (30D)</div>
                <div class="kpi-value">${safe(spend, "€")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-percentage"></i> ROAS (30D)</div>
                <div class="kpi-value">${safe(roas)}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-mouse-pointer"></i> CTR (30D)</div>
                <div class="kpi-value">${safe(ctr, "%")}</div>
            </div>
            <div class="kpi-card">
                <div class="kpi-label"><i class="fas fa-chart-area"></i> CPM (30D)</div>
                <div class="kpi-value">${safe(cpm, "€")}</div>
            </div>
        </div>
    `;
}

function renderDashboardChart() {
    const container = document.getElementById("dashboardChartContainer");
    const metrics = AppState.dashboardMetrics;

    if (!metrics) {
        container.innerHTML = `
            <div class="card performance-card">
                <div class="card-header">
                    <h3>Performance Verlauf</h3>
                    <div class="controls">
                        <div class="time-range-group">
                            <button class="active">30D</button>
                            <button disabled>7D</button>
                            <button disabled>90D</button>
                        </div>
                    </div>
                </div>
                <div class="chart-placeholder">Charts folgen nach Meta Live-Daten Integration.</div>
            </div>
        `;
        return;
    }

    // Normalize and print bar rows
    const items = [
        { label: "Spend", value: metrics.spend, format: (v) => `€ ${v.toLocaleString("de-DE")}` },
        { label: "ROAS", value: metrics.roas, format: (v) => `${v.toFixed(2)}x` },
        { label: "CTR", value: metrics.ctr, format: (v) => `${v.toFixed(2)}%` },
        { label: "CPM", value: metrics.cpm, format: (v) => `€ ${v.toFixed(2)}` }
    ];

    const maxVal = Math.max(...items.map(i => i.value > 0 ? i.value : 0), 1);

    const bars = items.map(i => {
        const pct = i.value > 0 ? Math.max(8, (i.value / maxVal) * 100) : 8;
        return `
            <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:110px; font-size:12px; color:var(--text-secondary);">${i.label}</div>
                <div style="flex:1; height:8px; border-radius:999px; background:rgba(148,163,184,0.35); overflow:hidden;">
                    <div style="width:${pct}%; height:100%; border-radius:inherit; background:var(--color-primary);"></div>
                </div>
                <div style="width:90px; text-align:right; font-size:12px; color:var(--text-primary);">
                    ${i.value > 0 ? i.format(i.value) : "–"}
                </div>
            </div>
        `;
    }).join("");

    container.innerHTML = `
        <div class="card performance-card">
            <div class="card-header">
                <h3>Performance Profil</h3>
                <div class="controls">
                    <div class="time-range-group">
                        <button class="active">30D</button>
                        <button disabled>7D</button>
                        <button disabled>90D</button>
                    </div>
                </div>
            </div>
            <div class="chart-placeholder">
                <div style="width:100%; max-width:640px; display:flex; flex-direction:column; gap:12px;">
                    <div style="font-size:12px; color:var(--text-secondary); margin-bottom:4px;">
                        Basis: ${metrics.scopeLabel}, Zeitraum: letzte 30 Tage
                    </div>
                    ${bars}
                </div>
            </div>
        </div>
    `;
}

function renderDashboardHeroCreatives() {
    const container = document.getElementById("dashboardHeroCreativesContainer");

    const entries = Object.entries(AppState.meta.insightsByCampaign || {});
    const campaigns = AppState.meta.campaigns || [];

    if (!AppState.metaConnected || !entries.length || !campaigns.length) {
        container.innerHTML = `
            <div class="hero-grid">
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <img src="https://via.placeholder.com/400x200?text=Top+Creative+1" />
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">Hook: "Stop Scrolling – Scale Smart"</div>
                        <div class="creative-kpi-bar">
                            <span>ROAS</span><span class="kpi-value-mini">4.2x</span>
                        </div>
                    </div>
                </div>

                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <img src="https://via.placeholder.com/400x200?text=Top+Creative+2" />
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">UGC: "Honest Review Clip"</div>
                        <div class="creative-kpi-bar">
                            <span>CTR</span><span class="kpi-value-mini">3.1%</span>
                        </div>
                    </div>
                </div>

                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <img src="https://via.placeholder.com/400x200?text=Top+Creative+3" />
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">Static: "Clean Product Shot"</div>
                        <div class="creative-kpi-bar">
                            <span>Spend</span><span class="kpi-value-mini">€ 4.200</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    const enriched = entries.map(([id, m]) => {
        const c = campaigns.find(x => x.id === id) || { name: id };
        return {
            id,
            name: c.name,
            spend: m.spend || 0,
            roas: m.roas || 0,
            ctr: m.ctr || 0
        };
    });

    enriched.sort((a, b) => (b.roas * b.spend) - (a.roas * a.spend));

    const top3 = enriched.slice(0, 3);

    container.innerHTML = `
        <div class="hero-grid">
            ${top3.map((c, idx) => `
                <div class="creative-hero-item">
                    <div class="creative-media-container">
                        <div class="creative-faux-thumb"><span>#${idx + 1}</span></div>
                    </div>
                    <div class="creative-details">
                        <div class="creative-name">${c.name}</div>
                        <div class="creative-kpi-bar"><span>ROAS</span><span class="kpi-value-mini">${c.roas.toFixed(2)}x</span></div>
                        <div class="creative-kpi-bar"><span>Spend</span><span class="kpi-value-mini">€ ${c.spend.toLocaleString("de-DE")}</span></div>
                        <div class="creative-kpi-bar"><span>CTR</span><span class="kpi-value-mini">${c.ctr.toFixed(2)}%</span></div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}

/* ============================================================
   AGGREGATED INSIGHTS
   ============================================================ */
async function aggregateInsightsForCampaigns(ids) {
    let totalSpend = 0;
    let totalImp = 0;
    let totalClicks = 0;
    let roasWeighted = 0;
    let roasWeight = 0;

    for (const id of ids) {
        try {
            let d;

            if (AppState.meta.insightsByCampaign[id]?.raw) {
                d = AppState.meta.insightsByCampaign[id].raw;
            } else {
                const ins = await fetchMetaCampaignInsights(id);
                if (
                    !ins.success ||
                    !ins.data ||
                    !Array.isArray(ins.data.data) ||
                    !ins.data.data.length
                ) continue;

                d = ins.data.data[0];
                storeCampaignInsightInCache(id, d);
            }

            if (!d) continue;

            const spend = Number(d.spend || 0);
            const imp = Number(d.impressions || 0);
            const clicks = Number(d.clicks || 0);
            const roas = Array.isArray(d.website_purchase_roas) &&
                         d.website_purchase_roas.length > 0 ?
                         Number(d.website_purchase_roas[0].value || 0) : 0;

            totalSpend += spend;
            totalImp += imp;
            totalClicks += clicks;

            if (spend > 0 && roas > 0) {
                roasWeighted += roas * spend;
                roasWeight += spend;
            }
        } catch (err) {
            console.warn("Aggregation error:", err);
        }
    }

    if (totalSpend === 0 && totalImp === 0) {
        return null;
    }

    return {
        spend: totalSpend,
        ctr: totalImp > 0 ? (totalClicks / totalImp) * 100 : 0,
        cpm: totalImp > 0 ? (totalSpend / totalImp) * 1000 : 0,
        roas: roasWeight > 0 ? roasWeighted / roasWeight : 0
    };
}

function storeCampaignInsightInCache(id, raw) {
    const spend = Number(raw.spend || 0);
    const ctr = Number(raw.ctr || 0);
    const cpm = Number(raw.cpm || 0);

    const roas = Array.isArray(raw.website_purchase_roas) &&
                 raw.website_purchase_roas.length > 0
                 ? Number(raw.website_purchase_roas[0].value || 0)
                 : 0;

    AppState.meta.insightsByCampaign[id] = {
        spend, ctr, cpm, roas, raw
    };
}

/* ============================================================
   DASHBOARD LOADER (Meta Data)
   ============================================================ */
async function loadDashboardMetaData() {
    try {
        // 1) Ad Accounts
        let accountsResult =
            AppState.meta.adAccounts.length > 0
                ? { success: true, data: { data: AppState.meta.adAccounts } }
                : await fetchMetaAdAccounts();

        if (!accountsResult.success ||
            !accountsResult.data ||
            !Array.isArray(accountsResult.data.data) ||
            accountsResult.data.data.length === 0
        ) {
            AppState.dashboardMetrics = {
                spend: 0, roas: 0, ctr: 0, cpm: 0,
                scopeLabel: "Keine Daten"
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

        // 2) Campaigns
        const campaignsResult = await fetchMetaCampaigns(AppState.selectedAccountId);

        if (!campaignsResult.success ||
            !campaignsResult.data ||
            !Array.isArray(campaignsResult.data.data) ||
            campaignsResult.data.data.length === 0
        ) {
            AppState.meta.campaigns = [];
            populateCampaignDropdown();
            AppState.dashboardMetrics = {
                spend: 0, roas: 0, ctr: 0, cpm: 0,
                scopeLabel: "Keine Kampagnen"
            };
            renderDashboardKpisLive(0, 0, 0, 0);
            renderDashboardChart();
            AppState.dashboardLoaded = true;
            renderDashboardHeroCreatives();
            return;
        }

        const campaigns = campaignsResult.data.data;
        AppState.meta.campaigns = campaigns;

        if (AppState.selectedCampaignId &&
            !campaigns.some(c => c.id === AppState.selectedCampaignId)
        ) {
            AppState.selectedCampaignId = null;
        }

        populateCampaignDropdown();

        // 3) Insights
        let spend, ctr, cpm, roas, scopeLabel;

        if (!AppState.selectedCampaignId) {
            const ids = campaigns.map(c => c.id);
            const agg = await aggregateInsightsForCampaigns(ids);

            if (!agg) {
                AppState.dashboardMetrics = {
                    spend: 0, roas: 0, ctr: 0, cpm: 0,
                    scopeLabel: "Keine Insights"
                };
                renderDashboardKpisLive(0, 0, 0, 0);
                renderDashboardChart();
                AppState.dashboardLoaded = true;
                renderDashboardHeroCreatives();
                return;
            }

            spend = agg.spend;
            ctr = agg.ctr;
            cpm = agg.cpm;
            roas = agg.roas;
            scopeLabel = `Alle Kampagnen (${campaigns.length})`;
        } else {
            const insights = await fetchMetaCampaignInsights(AppState.selectedCampaignId);

            if (!insights.success ||
                !insights.data ||
                !Array.isArray(insights.data.data) ||
                !insights.data.data.length
            ) {
                AppState.dashboardMetrics = {
                    spend: 0, roas: 0, ctr: 0, cpm: 0,
                    scopeLabel: "Keine Insights"
                };
                renderDashboardKpisLive(0, 0, 0, 0);
                renderDashboardChart();
                AppState.dashboardLoaded = true;
                renderDashboardHeroCreatives();
                return;
            }

            const d = insights.data.data[0];
            storeCampaignInsightInCache(AppState.selectedCampaignId, d);

            const cam = campaigns.find(c => c.id === AppState.selectedCampaignId);
            scopeLabel = cam ? cam.name : "Ausgewählte Kampagne";

            spend = Number(d.spend || 0);
            ctr = Number(d.ctr || 0);
            cpm = Number(d.cpm || 0);
            roas = Array.isArray(d.website_purchase_roas) &&
                   d.website_purchase_roas.length > 0
                   ? Number(d.website_purchase_roas[0].value || 0) : 0;
        }

        AppState.dashboardMetrics = {
            spend: Number(spend),
            roas: Number(roas),
            ctr: Number(ctr),
            cpm: Number(cpm),
            scopeLabel
        };

        // Render UI
        renderDashboardKpisLive(
            AppState.dashboardMetrics.spend,
            AppState.dashboardMetrics.roas,
            AppState.dashboardMetrics.ctr,
            AppState.dashboardMetrics.cpm
        );

        renderDashboardChart();
        AppState.dashboardLoaded = true;
        renderDashboardHeroCreatives();
    } catch (err) {
        console.error("loadDashboardMetaData error:", err);
        AppState.dashboardMetrics = {
            spend: 0, roas: 0, ctr: 0, cpm: 0,
            scopeLabel: "Fehler"
        };
        renderDashboardKpisLive(0, 0, 0, 0);
        renderDashboardChart();
        AppState.dashboardLoaded = true;
        renderDashboardHeroCreatives();
    }
}

/* ============================================================
   CAMPAIGNS RENDERING
   ============================================================ */
function renderCampaignsPlaceholder(msg = "Verbinde Meta, um deine Kampagnen anzuzeigen.") {
    const tbody = document.getElementById("campaignsTableBody");
    tbody.innerHTML = `
        <tr>
            <td colspan="8" style="padding:16px; color:var(--text-secondary); text-align:center;">
                ${msg}
            </td>
        </tr>
    `;
}

function renderCampaignsLoading() {
    renderCampaignsPlaceholder("Lade Kampagnen & Metriken aus Meta...");
}

function formatEuro(value) {
    const n = Number(value);
    return isFinite(n) && n > 0 ? `€ ${n.toLocaleString("de-DE")}` : "–";
}
function formatPercent(value) {
    const n = Number(value);
    return isFinite(n) && n > 0 ? `${n.toFixed(2)}%` : "–";
}
function formatRoas(value) {
    const n = Number(value);
    return isFinite(n) && n > 0 ? `${n.toFixed(2)}x` : "–";
}

function getStatusIndicatorClass(status) {
    const s = (status || "").toLowerCase();
    if (s === "active") return "status-green";
    if (s === "paused") return "status-yellow";
    return "status-red";
}

async function loadLiveCampaignTable() {
    const tbody = document.getElementById("campaignsTableBody");

    renderCampaignsLoading();

    try {
        let accId = AppState.selectedAccountId;

        if (!accId) {
            const accounts = await fetchMetaAdAccounts();
            if (!accounts.success ||
                !accounts.data ||
                !Array.isArray(accounts.data.data) ||
                accounts.data.data.length === 0
            ) {
                renderDemoCampaignsTable();
                AppState.campaignsLoaded = true;
                return;
            }
            accId = accounts.data.data[0].id;
            AppState.selectedAccountId = accId;
            AppState.meta.adAccounts = accounts.data.data;
            populateBrandDropdown();
        }

        const campaignsRes = await fetchMetaCampaigns(accId);
        if (!campaignsRes.success ||
            !campaignsRes.data ||
            !Array.isArray(campaignsRes.data.data) ||
            campaignsRes.data.data.length === 0
        ) {
            AppState.meta.campaigns = [];
            populateCampaignDropdown();
            renderDemoCampaignsTable();
            AppState.campaignsLoaded = true;
            return;
        }

        const list = campaignsRes.data.data;
        AppState.meta.campaigns = list;
        populateCampaignDropdown();

        if (!AppState.meta.insightsByCampaign) {
            AppState.meta.insightsByCampaign = {};
        }

        const rows = [];
        for (const c of list) {
            let metrics = AppState.meta.insightsByCampaign[c.id];

            if (!metrics?.raw) {
                const ins = await fetchMetaCampaignInsights(c.id);
                if (ins.success &&
                    ins.data &&
                    Array.isArray(ins.data.data) &&
                    ins.data.data.length > 0
                ) {
                    storeCampaignInsightInCache(c.id, ins.data.data[0]);
                    metrics = AppState.meta.insightsByCampaign[c.id];
                } else {
                    metrics = { spend: 0, roas: 0, ctr: 0, cpm: 0 };
                }
            }

            rows.push({ campaign: c, metrics });
        }

        // FILTERING
        const search = document.getElementById("campaignSearch")?.value.trim().toLowerCase() || "";
        const statusFilter = document.getElementById("campaignStatusFilter")?.value || "all";

        let filtered = rows;

        if (search) {
            filtered = filtered.filter(({ campaign }) =>
                (campaign.name || "").toLowerCase().includes(search) ||
                (campaign.id || "").toLowerCase().includes(search)
            );
        }

        if (statusFilter !== "all") {
            filtered = filtered.filter(({ campaign }) => {
                const s = (campaign.status || "").toLowerCase();
                return statusFilter === "active" ? s === "active" :
                       statusFilter === "paused" ? s === "paused" :
                       statusFilter === "completed" ? s === "completed" :
                       true;
            });
        }

        filtered.sort((a, b) => (b.metrics.spend || 0) - (a.metrics.spend || 0));

        tbody.innerHTML = "";

        if (!filtered.length) {
            renderCampaignsPlaceholder("Keine Kampagnen entsprechen den Filtern.");
            return;
        }

        filtered.forEach(({ campaign: c, metrics: m }) => {
            const tr = document.createElement("tr");
            const dailyBudget = Number(c.daily_budget || 0) / 100;

            tr.innerHTML = `
                <td><span class="status-indicator ${getStatusIndicatorClass(c.status)}"></span> ${c.status || "-"}</td>
                <td>${c.name || c.id}</td>
                <td>${c.objective || "-"}</td>
                <td>${formatEuro(dailyBudget)}</td>
                <td>${formatEuro(m.spend)}</td>
                <td>${formatRoas(m.roas)}</td>
                <td>${formatPercent(m.ctr)}</td>
                <td>
                    <button class="action-button campaign-details-btn" data-campaign-id="${c.id}">Details</button>
                </td>
            `;

            tbody.appendChild(tr);
        });

        tbody.querySelectorAll(".campaign-details-btn").forEach(btn =>
            btn.addEventListener("click", async (e) => {
                const id = e.currentTarget.getAttribute("data-campaign-id");
                await openCampaignDetails(id);
            })
        );

        AppState.campaignsLoaded = true;
    } catch (err) {
        console.error("loadLiveCampaignTable error:", err);
        renderDemoCampaignsTable();
        AppState.campaignsLoaded = true;
    }
}

function renderDemoCampaignsTable() {
    const tbody = document.getElementById("campaignsTableBody");
    tbody.innerHTML = "";

    DEMO_CAMPAIGNS.forEach(c => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td><span class="status-indicator ${getStatusIndicatorClass(c.status)}"></span> ${c.status}</td>
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

async function openCampaignDetails(id) {
    if (!id) return;

    let metrics = AppState.meta.insightsByCampaign[id];

    if (!metrics?.raw) {
        const ins = await fetchMetaCampaignInsights(id);
        if (ins.success &&
            ins.data &&
            Array.isArray(ins.data.data) &&
            ins.data.data.length > 0
        ) {
            storeCampaignInsightInCache(id, ins.data.data[0]);
            metrics = AppState.meta.insightsByCampaign[id];
        }
    }

    const campaign =
        AppState.meta.campaigns.find(c => c.id === id) ||
        { name: id, status: "-", objective: "-" };

    const m = metrics || { spend: 0, roas: 0, ctr: 0, cpm: 0 };

    openModal(
        `Kampagne: ${campaign.name}`,
        `
            <div style="display:flex; flex-direction:column; gap:8px;">
                <div><strong>Status:</strong> ${campaign.status || "-"}</div>
                <div><strong>Objective:</strong> ${campaign.objective || "-"}</div>
                <div><strong>Ad Spend (30D):</strong> ${formatEuro(m.spend)}</div>
                <div><strong>ROAS (30D):</strong> ${formatRoas(m.roas)}</div>
                <div><strong>CTR (30D):</strong> ${formatPercent(m.ctr)}</div>
                <div><strong>CPM (30D):</strong> ${formatEuro(m.cpm)}</div>
            </div>
        `
    );
}

/* ============================================================
   DATE & TIME
   ============================================================ */
function initDateTime() {
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
    setInterval(update, 60000);
}

/* ============================================================
   UI UPDATE CONTROLLER
   ============================================================ */
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

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    showView(AppState.currentView);
    initSidebarNavigation();

    const metaBtn = document.getElementById("connectMetaButton");
    metaBtn?.addEventListener("click", handleMetaConnectClick);

    const disconnectBtn = document.getElementById("disconnectMetaButton");
    disconnectBtn?.addEventListener("click", (e) => {
        e.preventDefault();
        disconnectMeta();
    });

    initDateTime();
    updateGreeting();
    handleMetaOAuthRedirectIfPresent();

    // Search & Filters
    const searchInput = document.getElementById("campaignSearch");
    const statusFilter = document.getElementById("campaignStatusFilter");

    searchInput?.addEventListener("input", () => {
        if (!AppState.metaConnected) return;
        AppState.campaignsLoaded = false;
        loadLiveCampaignTable();
    });

    statusFilter?.addEventListener("change", () => {
        if (!AppState.metaConnected) return;
        AppState.campaignsLoaded = false;
        loadLiveCampaignTable();
    });
});

