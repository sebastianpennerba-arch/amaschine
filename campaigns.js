// campaigns.js – Premium Version (P3+) mit Add-Buttons & Sensei-Hooks
// SignalOne.cloud – Campaign Manager

import { AppState } from "./state.js";
import {
    fetchMetaCampaigns,
    fetchMetaCampaignInsights,
    updateMetaCampaignStatus
} from "./metaApi.js";

import { openModal, showToast } from "./uiCore.js";
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
   Toolbar (Add Kampagne / Adset / Ad)
---------------------------------------------------------*/

let toolbarInitialized = false;

function ensureCampaignToolbar() {
    if (toolbarInitialized) return;

    const view = document.getElementById("campaignsView");
    if (!view) return;

    // Erstes Card-Element im Campaigns-View (Filter-Karte mit Suche/Status)
    const firstCard = view.querySelector(".card");
    if (!firstCard) return;

    const row = firstCard.firstElementChild;
    if (!row) return;

    // Toolbar nur einmal anlegen
    const existing = row.querySelector(".campaigns-toolbar");
    if (existing) {
        toolbarInitialized = true;
        return;
    }

    const toolbar = document.createElement("div");
    toolbar.className = "campaigns-toolbar";
    toolbar.style.display = "flex";
    toolbar.style.gap = "8px";
    toolbar.style.marginLeft = "auto";
    toolbar.style.flexWrap = "wrap";

    toolbar.innerHTML = `
        <button type="button" class="action-button" data-create-type="campaign">
            + Kampagne
        </button>
        <button type="button" class="action-button-secondary" data-create-type="adset">
            + Anzeigengruppe
        </button>
        <button type="button" class="action-button-secondary" data-create-type="ad">
            + Anzeige
        </button>
    `;

    row.appendChild(toolbar);

    toolbar.querySelectorAll("[data-create-type]").forEach((btn) => {
        btn.addEventListener("click", () => {
            const type = btn.getAttribute("data-create-type");
            if (!AppState.metaConnected || !AppState.selectedAccountId) {
                showToast(
                    "Bitte zuerst ein Meta-Werbekonto verbinden, bevor du neue Elemente erstellst.",
                    "error"
                );
                return;
            }
            openCreateEntityModal(type);
        });
    });

    toolbarInitialized = true;
}

function openCreateEntityModal(type) {
    let title = "";
    let description = "";
    let fieldsHtml = "";

    if (type === "campaign") {
        title = "Neue Kampagne anlegen";
        description =
            "Lege eine neue Kampagne an. In einem späteren Schritt wird dieser Dialog direkt mit der Meta API verknüpft. Sensei kann hier zukünftig automatisch Ziele & Budgets vorschlagen.";
        fieldsHtml = `
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Kampagnenname
                <input type="text" id="createCampaignName" placeholder="z.B. Q4 Prospecting DE" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Objective
                <select id="createCampaignObjective" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);">
                    <option value="CONVERSIONS">Conversions</option>
                    <option value="LEAD_GENERATION">Leads</option>
                    <option value="AWARENESS">Awareness</option>
                    <option value="TRAFFIC">Traffic</option>
                </select>
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Tägliches Budget (EUR)
                <input type="number" min="0" step="1" id="createCampaignBudget" 
                    placeholder="z.B. 100" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
        `;
    } else if (type === "adset") {
        title = "Neue Anzeigengruppe anlegen";
        description =
            "Diese Anzeigengruppe wird später mit einer Meta-Kampagne verknüpft. Sensei kann hier Zielgruppen & Placements empfehlen.";
        fieldsHtml = `
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Name der Anzeigengruppe
                <input type="text" id="createAdsetName" placeholder="z.B. DE - Broad - 25-45" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Zugehörige Kampagne (ID oder Name)
                <input type="text" id="createAdsetCampaignRef" placeholder="z.B. Kampagnen-ID oder -Name" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Tägliches Budget (EUR)
                <input type="number" min="0" step="1" id="createAdsetBudget" 
                    placeholder="z.B. 50" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
        `;
    } else {
        title = "Neue Anzeige anlegen";
        description =
            "Lege eine neue Anzeige an. In der späteren Ausbaustufe kann Sensei hier direkt Ad-Copies, Hooks & Creatives empfehlen.";
        fieldsHtml = `
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Anzeigenname
                <input type="text" id="createAdName" placeholder="z.B. UGC Hook 01" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Zugehörige Anzeigengruppe (ID oder Name)
                <input type="text" id="createAdAdsetRef" placeholder="z.B. Adset-ID oder -Name" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
            <label style="display:flex; flex-direction:column; gap:4px; font-size:13px;">
                Creative-Referenz (z.B. Creative-ID)
                <input type="text" id="createAdCreativeRef" placeholder="z.B. Creative-ID" 
                    style="padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </label>
        `;
    }

    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-width:520px;">
            <p style="font-size:13px; color:var(--text-secondary); margin:0;">
                ${description}
            </p>

            <div style="display:flex; flex-direction:column; gap:10px;">
                ${fieldsHtml}
            </div>

            <div style="font-size:11px; color:var(--text-secondary); margin-top:4px;">
                <strong>Hinweis:</strong> Aktuell werden diese Entwürfe noch nicht live
                zu Meta übertragen. In der nächsten Ausbaustufe wird hier die echte Meta API
                angebunden und Sensei liefert konkrete Vorschläge.
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:6px;">
                <button type="button" class="action-button-secondary" data-create-role="sensei-hint">
                    Sensei-Empfehlung anzeigen
                </button>
                <button type="button" class="action-button" data-create-role="save">
                    Entwurf speichern
                </button>
            </div>
        </div>
    `;

    openModal(title, html, {
        onOpen(modal) {
            const saveBtn = modal.querySelector('[data-create-role="save"]');
            const senseiBtn = modal.querySelector('[data-create-role="sensei-hint"]');

            if (saveBtn) {
                saveBtn.addEventListener("click", () => {
                    showToast(
                        "Der Entwurf wurde lokal vorgemerkt. In der nächsten Phase wird hier die echte Meta-Erstellung angebunden.",
                        "success"
                    );
                });
            }

            if (senseiBtn) {
                senseiBtn.addEventListener("click", () => {
                    showToast(
                        "Sensei wird in einer späteren Stufe konkrete Vorschläge für Ziel, Budget & Struktur geben.",
                        "info"
                    );
                });
            }
        }
    });
}

/* -------------------------------------------------------
   Render Placeholder
---------------------------------------------------------*/

function renderCampaignsPlaceholder(
    text = "Verbinde Meta, um deine Kampagnen zu sehen."
) {
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
   Modal – Campaign Details
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

                        <span class="status-indicator ${statusClass(
                            campaign.status
                        )}"></span>
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
                <div class="metric-chip"><div class="metric-label">Spend</div><div class="metric-value">${fEuro(
                    m.spend || 0
                )}</div></div>
                <div class="metric-chip"><div class="metric-label">ROAS</div><div class="metric-value">${fRoas(
                    m.purchase_roas || m.roas || 0
                )}</div></div>
                <div class="metric-chip"><div class="metric-label">CTR</div><div class="metric-value">${fPct(
                    m.ctr || 0
                )}</div></div>
                <div class="metric-chip"><div class="metric-label">Impressions</div><div class="metric-value">${nf.format(
                    m.impressions || 0
                )}</div></div>
                <div class="metric-chip"><div class="metric-label">Clicks</div><div class="metric-value">${nf.format(
                    m.clicks || 0
                )}</div></div>
                <div class="metric-chip"><div class="metric-label">CPM</div><div class="metric-value">${fEuro(
                    m.cpm || 0
                )}</div></div>
            </section>

            <section style="margin-top:10px;">
                <h4 style="font-size:14px; margin-bottom:6px;">Sensei Aktionen (Preview)</h4>
                <div style="display:flex; flex-direction:column; gap:6px; color:var(--text-secondary); font-size:13px;">
                    <button class="action-button-secondary" data-sensei-role="analyze">
                        Performanceanalyse starten
                    </button>
                    <button class="action-button-secondary" data-sensei-role="duplicate">
                        Neue Kampagne aus dieser Struktur
                    </button>
                    <button class="action-button-secondary" data-sensei-role="explain">
                        Meta Metriken verstehen
                    </button>
                </div>
            </section>
        </div>
    `;

    openModal("Kampagnendetails", html, {
        onOpen(modal) {
            const toggleBtn = modal.querySelector("[data-modal-action='toggle']");
            if (toggleBtn) {
                toggleBtn.addEventListener("click", async () => {
                    await toggleCampaignStatus(campaign);
                });
            }

            modal.querySelectorAll("[data-sensei-role]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const role = btn.getAttribute("data-sensei-role");
                    if (role === "analyze") {
                        showToast(
                            "Sensei wird in Kürze eine detaillierte Performanceanalyse für diese Kampagne bereitstellen.",
                            "info"
                        );
                    } else if (role === "duplicate") {
                        showToast(
                            "Die Funktion ‚Neue Kampagne aus dieser Struktur‘ wird mit der Meta API verbunden. Aktuell noch Vorschau.",
                            "info"
                        );
                    } else if (role === "explain") {
                        showToast(
                            "Hier wird Sensei später deine Metriken (ROAS, CTR, CPM) in Klartext erklären.",
                            "info"
                        );
                    }
                });
            });
        }
    });
}

/* -------------------------------------------------------
   Public API
---------------------------------------------------------*/

export async function updateCampaignsView(connected) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    // Toolbar oben immer sicherstellen
    ensureCampaignToolbar();

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
