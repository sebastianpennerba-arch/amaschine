// campaigns.js – Premium Version (Option B)
// SignalOne.cloud – Campaign Manager (P3 Base)

import { AppState } from "./state.js";
import {
    fetchMetaCampaigns,
    fetchMetaCampaignInsights,
    updateMetaCampaignStatus
} from "./metaApi.js";

import { openModal, showToast } from "./uiCore.js";
import { updateDashboardView } from "./dashboard.js";
import { updateCreativeLibraryView } from "./creativeLibrary.js";

/* -------------------------------------------------------
   Formatting Helpers
---------------------------------------------------------*/

const nf = new Intl.NumberFormat("de-DE");

const fEuro = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "€ 0" : `€ ${nf.format(n)}`;
};

const fPct = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0%" : `${n.toFixed(2)}%`;
};

const fRoas = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0x" : `${n.toFixed(2)}x`;
};

const statusClass = (s) => {
    const v = (s || "").toLowerCase();
    if (v === "active") return "status-green";
    if (v === "paused") return "status-yellow";
    if (v === "deleted" || v === "archived") return "status-red";
    return "status-yellow";
};

/* -------------------------------------------------------
   Render Placeholder
---------------------------------------------------------*/

function renderCampaignsPlaceholder(text = "Verbinde Meta, um deine Kampagnen zu sehen.") {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="9" style="padding:18px; text-align:center; color:var(--text-secondary);">
                ${text}
            </td>
        </tr>
    `;
}

/* -------------------------------------------------------
   Load Campaign + Insights
---------------------------------------------------------*/

async function loadCampaignsWithInsights() {
    const accountId = AppState.selectedAccountId;
    if (!AppState.metaConnected || !accountId) return [];

    // 1) Load campaigns if missing
    if (!AppState.meta.campaigns.length) {
        const res = await fetchMetaCampaigns(accountId);
        if (res?.success) AppState.meta.campaigns = res.data?.data || [];
    }

    const campaigns = AppState.meta.campaigns || [];
    if (!campaigns.length) return [];

    // 2) Load insights (one by one)
    const out = [];
    for (const camp of campaigns) {
        const ir = await fetchMetaCampaignInsights(camp.id, AppState.timeRangePreset);
        const metrics = ir?.success ? ir.data?.data?.[0] || {} : {};
        out.push({ ...camp, metrics });
    }

    return out;
}

/* -------------------------------------------------------
   Render Table
---------------------------------------------------------*/

function renderCampaignsTable(campaigns) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (!campaigns.length) {
        renderCampaignsPlaceholder("Keine Kampagnen gefunden.");
        return;
    }

    for (const c of campaigns) {
        const m = c.metrics || {};
        const active = (c.status || "").toUpperCase() === "ACTIVE";

        const tr = document.createElement("tr");
        tr.dataset.campaignId = c.id;

        tr.innerHTML = `
            <td>
                <span class="status-indicator ${statusClass(c.status)}"></span>
                ${c.status || "-"}
            </td>
            <td>${c.name || "-"}</td>
            <td>${c.objective || "-"}</td>
            <td>${fEuro(m.daily_budget || c.daily_budget / 100 || 0)}</td>
            <td>${fEuro(m.spend || 0)}</td>
            <td>${fRoas(m.purchase_roas || m.roas || 0)}</td>
            <td>${fPct(m.ctr || 0)}</td>
            <td>${nf.format(m.impressions || 0)}</td>
            <td style="white-space:nowrap;">
                <button class="action-button action-secondary" data-action="toggle">
                    ${active ? "Stoppen" : "Starten"}
                </button>
                <button class="action-button" data-action="details">
                    Details
                </button>
            </td>
        `;

        // row-click = modal
        tr.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (btn) return;
            openCampaignDetails(c);
        });

        // buttons
        tr.querySelectorAll("button[data-action]").forEach((b) => {
            b.addEventListener("click", async (e) => {
                e.stopPropagation();
                const action = b.dataset.action;
                if (action === "toggle") await toggleCampaignStatus(c);
                if (action === "details") openCampaignDetails(c);
            });
        });

        tbody.appendChild(tr);
    }
}

/* -------------------------------------------------------
   Toggle Campaign Status
---------------------------------------------------------*/

async function toggleCampaignStatus(campaign) {
    const now = (campaign.status || "").toUpperCase();
    const newStatus = now === "ACTIVE" ? "PAUSED" : "ACTIVE";

    try {
        const res = await updateMetaCampaignStatus(campaign.id, newStatus);
        if (!res?.success) {
            showToast("Fehler beim Ändern des Kampagnenstatus", "error");
            return;
        }

        campaign.status = newStatus;
        showToast(
            `Kampagne wurde ${newStatus === "ACTIVE" ? "gestartet" : "pausiert"}`,
            "success"
        );

        await updateCampaignsView(true);

    } catch (err) {
        console.error(err);
        showToast("Fehler beim Aktualisieren", "error");
    }
}

/* -------------------------------------------------------
   Modal – Premium (Option B)
---------------------------------------------------------*/

function openCampaignDetails(campaign) {
    const m = campaign.metrics || {};

    const html = `
        <div style="display:flex; flex-direction:column; gap:20px; max-width:650px;">
            
            <header style="display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
                
                <div style="flex:1;">
                    <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
                        <span style="
                            padding:4px 10px;
                            border-radius:999px;
                            background:rgba(99,102,241,0.08);
                            color:var(--primary);
                            font-size:11px;
                            font-weight:600;
                        ">Meta • Campaign</span>

                        <span class="status-indicator ${statusClass(campaign.status)}"></span>
                        <span style="font-size:12px; color:var(--text-secondary); text-transform:uppercase;">
                            ${campaign.status}
                        </span>
                    </div>

                    <h3 style="margin:0; font-size:20px; font-weight:600;">
                        ${campaign.name}
                    </h3>

                    <p style="margin:0; font-size:13px; color:var(--text-secondary);">
                        Ziel: <strong>${campaign.objective}</strong> • ID: ${campaign.id}
                    </p>
                </div>

                <button class="action-button action-secondary" 
                    data-modal-action="toggle" 
                    style="min-width:140px;">
                    ${(campaign.status || "").toUpperCase() === "ACTIVE"
                        ? "Kampagne pausieren"
                        : "Kampagne starten"}
                </button>
            </header>

            <section style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">
                <div class="metric-chip"><div class="metric-label">Spend</div><div class="metric-value">${fEuro(m.spend || 0)}</div></div>
                <div class="metric-chip"><div class="metric-label">ROAS</div><div class="metric-value">${fRoas(m.purchase_roas || m.roas || 0)}</div></div>
                <div class="metric-chip"><div class="metric-label">CTR</div><div class="metric-value">${fPct(m.ctr || 0)}</div></div>
                <div class="metric-chip"><div class="metric-label">Impressions</div><div class="metric-value">${nf.format(m.impressions || 0)}</div></div>
                <div class="metric-chip"><div class="metric-label">Clicks</div><div class="metric-value">${nf.format(m.clicks || 0)}</div></div>
                <div class="metric-chip"><div class="metric-label">CPM</div><div class="metric-value">${fEuro(m.cpm || 0)}</div></div>
            </section>

            <section style="margin-top:10px;">
                <h4 style="font-size:14px; margin-bottom:6px;">Sensei Aktionen (Preview)</h4>
                <div style="display:flex; flex-direction:column; gap:6px; color:var(--text-secondary); font-size:13px;">
                    <button class="action-button" disabled style="opacity:.5;">Performanceanalyse starten</button>
                    <button class="action-button" disabled style="opacity:.5;">Neue Kampagne mit Sensei</button>
                    <button class="action-button" disabled style="opacity:.5;">Meta Metriken verstehen</button>
                </div>
            </section>
        </div>
    `;

    openModal("Kampagnendetails", html, {
        onOpen(modal) {
            const btn = modal.querySelector("[data-modal-action='toggle']");
            if (btn) {
                btn.addEventListener("click", async () => {
                    await toggleCampaignStatus(campaign);
                });
            }
        }
    });
}

/* -------------------------------------------------------
   Public API
---------------------------------------------------------*/

export async function updateCampaignsView(connected) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    if (!connected) {
        renderCampaignsPlaceholder();
        return;
    }

    renderCampaignsPlaceholder("Lade Kampagnen…");

    try {
        const data = await loadCampaignsWithInsights();
        AppState.meta.campaigns = data;
        renderCampaignsTable(data);

    } catch (err) {
        console.error(err);
        renderCampaignsPlaceholder("Fehler beim Laden der Kampagnen.");
    }
}
