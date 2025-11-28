// campaigns.js – SignalOne.cloud – DEMO + LIVE

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";
import { demoCampaigns } from "./demoData.js";

function formatMoney(val) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    }).format(val || 0);
}

export function updateCampaignsView() {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const isDemo = !!AppState.settings?.demoMode;
    const isConnected = !!AppState.metaConnected && !!AppState.meta?.accessToken;

    let campaigns = AppState.meta.campaigns || [];

    // DEMO: Wenn nicht verbunden, aber Demo-Mode aktiv → Demo-Kampagnen wie echte behandeln
    if (!isConnected && isDemo && Array.isArray(demoCampaigns) && demoCampaigns.length) {
        campaigns = demoCampaigns;
    }

    if (!campaigns.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 9;
        td.innerHTML =
            '<span style="color: var(--text-secondary); font-size:14px;">Keine Kampagnen gefunden.</span>';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }

    campaigns.forEach((c) => {
        const tr = document.createElement("tr");
        tr.classList.add("clickable-row");
        tr.addEventListener("click", () => openCampaignModal(c));

        const created = c.created_time
            ? new Date(c.created_time).toLocaleDateString("de-DE")
            : "-";

        const dailyBudget =
            typeof c.daily_budget !== "undefined"
                ? formatMoney(Number(c.daily_budget) / 100)
                : c.dailyBudget
                ? formatMoney(Number(c.dailyBudget))
                : "-";

        // Metrics: aus Demo oder optional aus AppState.meta.insightsByCampaign
        const insightsByCampaign = AppState.meta?.insightsByCampaign || {};
        const liveInsight = insightsByCampaign[c.id] || {};

        const useDemoMetrics = !isConnected && isDemo && c.roas !== undefined;

        const spend = useDemoMetrics
            ? Number(c.spend || 0)
            : Number(liveInsight.spend || 0);
        const roas = useDemoMetrics
            ? Number(c.roas || 0)
            : Number(liveInsight.roas || 0);
        const ctr = useDemoMetrics
            ? Number(c.ctr || 0)
            : Number(liveInsight.ctr || 0);
        const impressions = useDemoMetrics
            ? Number(c.impressions || 0)
            : Number(liveInsight.impressions || 0);

        tr.innerHTML = `
          <td>${c.status || "-"}</td>
          <td>${c.name || "-"}</td>
          <td>${c.objective || "SALES"}</td>
          <td>${dailyBudget}</td>
          <td>${spend ? formatMoney(spend) : "-"}</td>
          <td>${roas ? roas.toFixed(2) + "x" : "-"}</td>
          <td>${ctr ? ctr.toFixed(2) + "%" : "-"}</td>
          <td>${impressions ? impressions.toLocaleString("de-DE") : "-"}</td>
          <td style="font-size:12px; color:var(--text-secondary);">
              Details & Aktionen
          </td>
        `;

        tbody.appendChild(tr);
    });
}

function openCampaignModal(campaign) {
    const isDemo = !!AppState.settings?.demoMode && !AppState.metaConnected;

    const insightsByCampaign = AppState.meta?.insightsByCampaign || {};
    const liveInsight = insightsByCampaign[campaign.id] || {};

    const useDemoMetrics = isDemo && campaign.roas !== undefined;

    const spend = useDemoMetrics
        ? Number(campaign.spend || 0)
        : Number(liveInsight.spend || 0);
    const roas = useDemoMetrics
        ? Number(campaign.roas || 0)
        : Number(liveInsight.roas || 0);
    const ctr = useDemoMetrics
        ? Number(campaign.ctr || 0)
        : Number(liveInsight.ctr || 0);
    const impressions = useDemoMetrics
        ? Number(campaign.impressions || 0)
        : Number(liveInsight.impressions || 0);
    const revenue = useDemoMetrics
        ? Number(campaign.revenue || 0)
        : Number(liveInsight.revenue || 0);

    const html = `
    <div class="campaign-modal-section">
      <h3>Basisdaten</h3>
      <p><strong>Name:</strong> ${campaign.name || "-"}</p>
      <p><strong>Status:</strong> ${campaign.status || "-"}</p>
      <p><strong>Objective:</strong> ${campaign.objective || "-"}</p>
      <p><strong>ID:</strong> ${campaign.id || "-"}</p>
    </div>
    <div class="campaign-modal-section">
      <h3>Budget & Zeit</h3>
      <p><strong>Daily Budget:</strong> ${
          campaign.daily_budget
              ? formatMoney(Number(campaign.daily_budget) / 100)
              : campaign.dailyBudget
              ? formatMoney(Number(campaign.dailyBudget))
              : "-"
      }</p>
      <p><strong>Erstellt:</strong> ${
          campaign.created_time
              ? new Date(campaign.created_time).toLocaleString("de-DE")
              : "-"
      }</p>
    </div>
    <div class="campaign-modal-section">
      <h3>Performance (letzte 30 Tage)</h3>
      <p><strong>Spend:</strong> ${spend ? formatMoney(spend) : "-"}</p>
      <p><strong>ROAS:</strong> ${roas ? roas.toFixed(2) + "x" : "-"}</p>
      <p><strong>CTR:</strong> ${ctr ? ctr.toFixed(2) + "%" : "-"}</p>
      <p><strong>Impressions:</strong> ${
          impressions ? impressions.toLocaleString("de-DE") : "-"
      }</p>
      <p><strong>Revenue:</strong> ${revenue ? formatMoney(revenue) : "-"}</p>
    </div>
    <div class="campaign-modal-section">
      <h3>Aktionen</h3>
      <div class="campaign-actions">
        <button class="btn-danger" data-action="pause">Kampagne pausieren</button>
        <button class="btn-success" data-action="start">Kampagne starten</button>
        <button class="btn-secondary" data-action="duplicate">Duplizieren für Test</button>
      </div>
      <p style="font-size:12px; color:var(--text-secondary); margin-top:8px;">
        Im Demo-Modus werden keine echten Änderungen an Meta durchgeführt.
      </p>
    </div>
  `;

    openModal("Kampagnen-Details", html);

    const body = document.getElementById("modalBody");
    if (body) {
        body.querySelectorAll(".campaign-actions button").forEach((btn) => {
            btn.addEventListener("click", () => {
                const action = btn.getAttribute("data-action");
                alert(
                    `Aktion "${action}" wird vorbereitet...\n\n(Demo-Modus – keine echte API-Aktion. Im Live-Modus würde hier die Meta API aufgerufen.)`
                );
                btn.disabled = true;
                btn.textContent = "✓ Geplant";
            });
        });
    }
}
