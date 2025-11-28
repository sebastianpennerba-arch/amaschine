// campaigns.js – SignalOne.cloud – Campaigns Overview (mit KPIs + Filter + Actions)

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";

/* -------------------------------------------------------
   Formatter
---------------------------------------------------------*/

function formatMoney(val) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    }).format(Number(val || 0));
}

function formatInt(val) {
    return new Intl.NumberFormat("de-DE").format(Number(val || 0));
}

function formatPct(val) {
    const n = Number(val || 0);
    return `${n.toFixed(2)}%`;
}

/* -------------------------------------------------------
   Helper: Insights holen (falls schon geladen)
---------------------------------------------------------*/

function getCampaignInsights(campaignId) {
    const map = AppState.meta?.insightsByCampaign || {};
    return map[campaignId] || null;
}

/* -------------------------------------------------------
   MAIN: Campaigns View updaten
---------------------------------------------------------*/

export function updateCampaignsView() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const campaigns = AppState.meta.campaigns || [];

    // Kein Meta-Connect / keine Kampagnen
    if (!AppState.metaConnected || !AppState.meta.accessToken) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.innerHTML =
            '<span style="color:var(--text-secondary);font-size:13px;">Verbinde Meta, um Kampagnen zu laden.</span>';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    if (!campaigns.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.textContent = "Keine Kampagnen gefunden.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    // Filter: Suche + Status
    const searchInput = document.getElementById("campaignSearch");
    const statusSelect = document.getElementById("campaignStatusFilter");

    const search = searchInput?.value?.toLowerCase().trim() || "";
    const statusFilter = statusSelect?.value || "all";

    let filtered = campaigns.slice();

    if (search.length > 0) {
        filtered = filtered.filter((c) =>
            (c.name || "").toLowerCase().includes(search)
        );
    }

    if (statusFilter !== "all") {
        filtered = filtered.filter((c) => (c.status || "") === statusFilter);
    }

    if (!filtered.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.textContent = "Keine Kampagnen passend zum Filter.";
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    // Tabelle füllen – exakt passend zu den 9 Spalten im Header
    filtered.forEach((c) => {
        const tr = document.createElement("tr");

        const insights = getCampaignInsights(c.id) || {};

        const dailyBudget =
            typeof c.daily_budget !== "undefined"
                ? formatMoney(Number(c.daily_budget) / 100)
                : "-";

        const spend30d =
            typeof insights.spend !== "undefined"
                ? formatMoney(insights.spend)
                : "-";

        const roas30d =
            typeof insights.roas !== "undefined" && insights.roas !== null
                ? `${Number(insights.roas || 0).toFixed(2)}x`
                : "-";

        const ctr30d =
            typeof insights.ctr !== "undefined" && insights.ctr !== null
                ? formatPct(insights.ctr)
                : "-";

        const imps30d =
            typeof insights.impressions !== "undefined" &&
            insights.impressions !== null
                ? formatInt(insights.impressions)
                : "-";

        // 1) Status
        const tdStatus = document.createElement("td");
        tdStatus.textContent = c.status || "-";

        // 2) Name
        const tdName = document.createElement("td");
        tdName.textContent = c.name || "-";

        // 3) Objective
        const tdObjective = document.createElement("td");
        tdObjective.textContent = c.objective || "-";

        // 4) Daily Budget
        const tdBudget = document.createElement("td");
        tdBudget.textContent = dailyBudget;

        // 5) Spend (30D)
        const tdSpend = document.createElement("td");
        tdSpend.textContent = spend30d;

        // 6) ROAS (30D)
        const tdRoas = document.createElement("td");
        tdRoas.textContent = roas30d;

        // 7) CTR (30D)
        const tdCtr = document.createElement("td");
        tdCtr.textContent = ctr30d;

        // 8) Impressions (30D)
        const tdImps = document.createElement("td");
        tdImps.textContent = imps30d;

        // 9) Aktionen (Details-Button)
        const tdActions = document.createElement("td");
        const detailsBtn = document.createElement("button");
        detailsBtn.type = "button";
        detailsBtn.className = "action-button-secondary";
        detailsBtn.textContent = "Details";
        detailsBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            openCampaignModal(c);
        });
        tdActions.appendChild(detailsBtn);

        tr.appendChild(tdStatus);
        tr.appendChild(tdName);
        tr.appendChild(tdObjective);
        tr.appendChild(tdBudget);
        tr.appendChild(tdSpend);
        tr.appendChild(tdRoas);
        tr.appendChild(tdCtr);
        tr.appendChild(tdImps);
        tr.appendChild(tdActions);

        // Optional: ganze Zeile klickbar für Details
        tr.addEventListener("click", () => openCampaignModal(c));

        tbody.appendChild(tr);
    });
}

/* -------------------------------------------------------
   MODAL: Kampagnen-Details – modern + mit KPIs
---------------------------------------------------------*/

function openCampaignModal(campaign) {
    const insights = getCampaignInsights(campaign.id) || {};

    const spend = typeof insights.spend !== "undefined" ? insights.spend : null;
    const roas = typeof insights.roas !== "undefined" ? insights.roas : null;
    const ctr = typeof insights.ctr !== "undefined" ? insights.ctr : null;
    const imps =
        typeof insights.impressions !== "undefined"
            ? insights.impressions
            : null;
    const clicks =
        typeof insights.clicks !== "undefined" ? insights.clicks : null;

    const dailyBudget =
        typeof campaign.daily_budget !== "undefined"
            ? formatMoney(Number(campaign.daily_budget) / 100)
            : "-";

    const created = campaign.created_time
        ? new Date(campaign.created_time).toLocaleString("de-DE")
        : "-";

    const hasInsights = spend || roas || ctr || imps || clicks;

    const html = `
        <div class="modal-section">
            <h3>Basisdaten</h3>
            <p><strong>Name:</strong> ${campaign.name || "-"}</p>
            <p><strong>Status:</strong> ${campaign.status || "-"}</p>
            <p><strong>Objective:</strong> ${campaign.objective || "-"}</p>
            <p><strong>ID:</strong> ${campaign.id || "-"}</p>
        </div>

        <div class="modal-section">
            <h3>Budget & Zeit</h3>
            <p><strong>Daily Budget:</strong> ${dailyBudget}</p>
            <p><strong>Erstellt:</strong> ${created}</p>
        </div>

        <div class="modal-section">
            <h3>Performance (letzte 30 Tage)</h3>
            ${
                hasInsights
                    ? `
                <ul style="padding-left:18px; margin: 0;">
                    <li>Spend: ${spend !== null ? formatMoney(spend) : "-"}</li>
                    <li>ROAS: ${
                        roas !== null ? `${Number(roas).toFixed(2)}x` : "-"
                    }</li>
                    <li>CTR: ${
                        ctr !== null ? formatPct(ctr) : "-"
                    }</li>
                    <li>Impressions: ${
                        imps !== null ? formatInt(imps) : "-"
                    }</li>
                    <li>Clicks: ${
                        clicks !== null ? formatInt(clicks) : "-"
                    }</li>
                </ul>
            `
                    : `<p style="color:var(--text-secondary);font-size:13px;">Für diese Kampagne wurden noch keine Insights geladen. Lade im Dashboard einen Zeitraum & Kampagnen-Filter, um Daten zu aggregieren.</p>`
            }
        </div>

        <div class="modal-section">
            <p style="font-size:12px;color:var(--text-secondary);">
                Starten / Pausieren / Ändern der Kampagne wird in einer späteren Phase direkt über die Meta API angebunden.
                Aktuell dient SignalOne hier als Auswertungs- und Entscheidungsoberfläche.
            </p>
        </div>
    `;

    openModal("Kampagnen-Details", html);
}
