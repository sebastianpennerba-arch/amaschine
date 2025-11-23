// campaigns.js – Kampagnen-Tabelle (P3)

import { AppState, DEMO_CAMPAIGNS } from "./state.js";
import {
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaCampaignInsights
} from "./metaApi.js";
import { openModal } from "./uiCore.js";

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

function renderDemoCampaignsTable() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    DEMO_CAMPAIGNS.forEach((c) => {
        const tr = document.createElement("tr");
        const statusIndicatorClass = getStatusIndicatorClass(c.status);

        tr.innerHTML = `
            <td><span class="status-indicator ${statusIndicatorClass}"></span> ${
            c.status
        }</td>
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

export async function updateCampaignsView(connected) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    if (!connected) {
        renderCampaignsPlaceholder();
        return;
    }

    if (AppState.campaignsLoaded && AppState.meta.campaigns?.length) {
        // Re-render mit aktuellen Filtern
        await loadLiveCampaignTable();
        return;
    }

    await loadLiveCampaignTable();
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
                renderDemoCampaignsTable();
                AppState.campaignsLoaded = true;
                return;
            }
            accountId = accounts.data.data[0].id;
            AppState.selectedAccountId = accountId;
            AppState.meta.adAccounts = accounts.data.data;
        }

        const campaigns = await fetchMetaCampaigns(accountId);

        if (
            !campaigns.success ||
            !campaigns.data ||
            !Array.isArray(campaigns.data.data) ||
            campaigns.data.data.length === 0
        ) {
            AppState.meta.campaigns = [];
            renderDemoCampaignsTable();
            AppState.campaignsLoaded = true;
            return;
        }

        const list = campaigns.data.data;
        AppState.meta.campaigns = list;

        if (!AppState.meta.insightsByCampaign) {
            AppState.meta.insightsByCampaign = {};
        }

        const rows = [];
        const preset = AppState.timeRangePreset || "last_30d";

        for (let c of list) {
            let kpisObj = AppState.meta.insightsByCampaign[c.id];

            if (!kpisObj || !kpisObj.raw || kpisObj.rawPreset !== preset) {
                const insights = await fetchMetaCampaignInsights(c.id, preset);
                const d =
                    insights.success &&
                    insights.data &&
                    Array.isArray(insights.data.data) &&
                    insights.data.data[0]
                        ? insights.data.data[0]
                        : null;

                if (d) {
                    const spend = parseFloat(d.spend || "0") || 0;
                    let roas = 0;
                    if (
                        Array.isArray(d.website_purchase_roas) &&
                        d.website_purchase_roas.length > 0
                    ) {
                        roas = parseFloat(
                            d.website_purchase_roas[0].value || "0"
                        ) || 0;
                    }
                    const ctr = parseFloat(d.ctr || "0") || 0;
                    const cpm = parseFloat(d.cpm || "0") || 0;

                    kpisObj = {
                        spend,
                        roas,
                        ctr,
                        cpm,
                        raw: d,
                        rawPreset: preset
                    };
                    AppState.meta.insightsByCampaign[c.id] = kpisObj;
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
                <td><span class="status-indicator ${statusIndicatorClass}"></span> ${
                c.status || "-"
            }</td>
                <td>${c.name || c.id}</td>
                <td>${c.objective || "-"}</td>
                <td>${formatEuro(dailyBudget)}</td>
                <td>${formatEuro(spend)}</td>
                <td>${formatRoas(roas)}</td>
                <td>${formatPercent(ctr)}</td>
                <td><button class="action-button campaign-details-btn" data-campaign-id="${
                    c.id
                }">Details</button></td>
            `;

            tbody.appendChild(tr);
        });

        if (!filteredRows.length) {
            renderCampaignsPlaceholder("Keine Kampagnen entsprechen den aktuellen Filtern.");
        }

        tbody.querySelectorAll(".campaign-details-btn").forEach((btn) => {
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

async function openCampaignDetails(campaignId) {
    if (!campaignId) return;

    let metrics = AppState.meta.insightsByCampaign[campaignId];
    const preset = AppState.timeRangePreset || "last_30d";

    if (!metrics || !metrics.raw || metrics.rawPreset !== preset) {
        const insights = await fetchMetaCampaignInsights(campaignId, preset);
        if (
            insights.success &&
            insights.data &&
            Array.isArray(insights.data.data) &&
            insights.data.data[0]
        ) {
            const d = insights.data.data[0];
            const spend = parseFloat(d.spend || "0") || 0;
            let roas = 0;
            if (
                Array.isArray(d.website_purchase_roas) &&
                d.website_purchase_roas.length > 0
            ) {
                roas = parseFloat(d.website_purchase_roas[0].value || "0") || 0;
            }
            const ctr = parseFloat(d.ctr || "0") || 0;
            const cpm = parseFloat(d.cpm || "0") || 0;

            metrics = {
                spend,
                roas,
                ctr,
                cpm,
                raw: d,
                rawPreset: preset
            };
            AppState.meta.insightsByCampaign[campaignId] = metrics;
        }
    }

    const campaign =
        (AppState.meta.campaigns || []).find((c) => c.id === campaignId) || {
            name: campaignId
        };
    const m = metrics || { spend: 0, roas: 0, ctr: 0, cpm: 0 };

    const html = `
        <div style="display:flex; flex-direction:column; gap:8px;">
            <div><strong>Status:</strong> ${campaign.status || "-"}</div>
            <div><strong>Objective:</strong> ${campaign.objective || "-"}</div>
            <div><strong>Ad Spend (30D):</strong> ${formatEuro(m.spend)}</div>
            <div><strong>ROAS (30D):</strong> ${formatRoas(m.roas)}</div>
            <div><strong>CTR (30D):</strong> ${formatPercent(m.ctr)}</div>
            <div><strong>CPM (30D):</strong> ${formatEuro(m.cpm)}</div>
        </div>
   `;

    openModal(`Kampagne: ${campaign.name || campaignId}`, html);
}
