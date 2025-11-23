// campaigns.js – Kampagnen-Tabelle (P3) – überarbeitete Version
// --------------------------------------------------------------
// Ziele dieser Version:
// 1) Dropdowns oben links (Werbekonto + Kampagne) werden automatisch
//    mit Live-Daten befüllt, sobald Meta verbunden ist – auch dann,
//    wenn der User NICHT zuerst auf "Campaigns" klickt.
// 2) Start/Stop der Kampagnen direkt aus der Tabelle.
// 3) Klick auf eine Kampagne öffnet ein hochwertiges Detail-Modal
//    (kein "DOS-Alert" mehr).
// 4) Wechsel der Dropdowns synchronisiert Dashboard & Creative Library.

import { AppState } from "./state.js";
import {
  fetchMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaCampaignInsights,
  // Optional: Wenn du diese Funktion in metaApi.js schon hast, lass sie drin.
  // Wenn nicht, einfach die Zeilen mit updateMetaCampaignStatus unten auskommentieren
  // oder die Funktion dort ergänzen.
  updateMetaCampaignStatus,
} from "./metaApi.js";
import { openModal, showToast } from "./uiCore.js";
import { updateDashboardView } from "./dashboard.js";
import { updateCreativeLibraryView } from "./creativeLibrary.js";

let topbarHydrated = false;

// ---------------------------------------------------------
// Kleine Format-Helper
// ---------------------------------------------------------

function formatEuro(value) {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return "€ 0";
  return `€ ${n.toLocaleString("de-DE", { minimumFractionDigits: 0 })}`;
}

function formatPercent(value) {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return "0%";
  return `${n.toFixed(2)}%`;
}

function formatRoas(value) {
  const n = Number(value);
  if (!isFinite(n) || n === 0) return "0x";
  return `${n.toFixed(2)}x`;
}

function getStatusIndicatorClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "active") return "status-green";
  if (s === "paused") return "status-yellow";
  if (s === "deleted" || s === "archived") return "status-red";
  return "status-yellow";
}

// ---------------------------------------------------------
// Platzhalter / Loading
// ---------------------------------------------------------

function renderCampaignsPlaceholder(
  text = "Verbinde Meta, um deine Kampagnen anzuzeigen."
) {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="padding:16px; color: var(--text-secondary); text-align:center;">
        ${text}
      </td>
    </tr>
  `;
}

function renderCampaignsLoading() {
  renderCampaignsPlaceholder("Lade Kampagnen & Metriken aus Meta…");
}

// ---------------------------------------------------------
// Topbar-Dropdowns (Werbekonto + Kampagne)
// ---------------------------------------------------------

async function hydrateTopbarSelectors() {
  const accountSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignGroupSelect");
  if (!accountSelect || !campaignSelect) return;
  if (!AppState.metaConnected) return;

  // 1) Ad Accounts laden (falls noch nicht im State)
  if (!Array.isArray(AppState.meta.adAccounts) || !AppState.meta.adAccounts.length) {
    const accountsRes = await fetchMetaAdAccounts();
    if (!accountsRes?.success) {
      console.warn("Konnte Meta Ad Accounts nicht laden.");
      return;
    }
    const accounts = accountsRes.data?.data || [];
    AppState.meta.adAccounts = accounts;
    if (!AppState.selectedAccountId && accounts.length) {
      AppState.selectedAccountId = accounts[0].id;
    }
  }

  // 2) Kampagnen für ausgewähltes Konto laden
  if (AppState.selectedAccountId) {
    const campaignsRes = await fetchMetaCampaigns(AppState.selectedAccountId);
    if (campaignsRes?.success) {
      AppState.meta.campaigns = campaignsRes.data?.data || [];
    }
  }

  // 3) Dropdowns befüllen
  updateTopbarDropdowns(accountSelect, campaignSelect);
}

function updateTopbarDropdowns(accountSelect, campaignSelect) {
  const accounts = AppState.meta.adAccounts || [];
  const campaigns = AppState.meta.campaigns || [];

  // Werbekonto
  accountSelect.innerHTML = "";
  const accPlaceholder = document.createElement("option");
  accPlaceholder.value = "";
  accPlaceholder.textContent = "Werbekonto wählen";
  accountSelect.appendChild(accPlaceholder);

  accounts.forEach((acc) => {
    const opt = document.createElement("option");
    opt.value = acc.id;
    opt.textContent = acc.name || acc.id;
    accountSelect.appendChild(opt);
  });

  accountSelect.disabled = accounts.length === 0;
  if (AppState.selectedAccountId) {
    accountSelect.value = AppState.selectedAccountId;
  }

  // Kampagne
  campaignSelect.innerHTML = "";
  const campPlaceholder = document.createElement("option");
  campPlaceholder.value = "";
  campPlaceholder.textContent = "Kampagne wählen";
  campaignSelect.appendChild(campPlaceholder);

  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name || c.id;
    campaignSelect.appendChild(opt);
  });

  campaignSelect.disabled = campaigns.length === 0;
  if (AppState.selectedCampaignId) {
    campaignSelect.value = AppState.selectedCampaignId;
  }
}

function initTopbarDropdownBehaviour() {
  document.addEventListener("DOMContentLoaded", () => {
    const accountSelect = document.getElementById("brandSelect");
    const campaignSelect = document.getElementById("campaignGroupSelect");
    if (!accountSelect || !campaignSelect) return;

    // Änderungen am Werbekonto → Kampagnen + Views neu laden
    accountSelect.addEventListener("change", async (e) => {
      const newId = e.target.value || null;
      AppState.selectedAccountId = newId;
      AppState.selectedCampaignId = null;

      // Flags resetten, damit Ansichten neu geladen werden können
      AppState.campaignsLoaded = false;
      AppState.dashboardLoaded = false;
      AppState.creativesLoaded = false;

      if (!newId) {
        AppState.meta.campaigns = [];
      } else {
        const campaignsRes = await fetchMetaCampaigns(newId);
        if (campaignsRes?.success) {
          AppState.meta.campaigns = campaignsRes.data?.data || [];
        }
      }

      updateTopbarDropdowns(accountSelect, campaignSelect);

      if (AppState.metaConnected) {
        await updateDashboardView(true);
        await updateCreativeLibraryView(true);
        await updateCampaignsView(true);
      }
    });

    // Änderungen an der Kampagne → Dashboard + Creatives + Campaigns filtern
    campaignSelect.addEventListener("change", async (e) => {
      const newCampaignId = e.target.value || null;
      AppState.selectedCampaignId = newCampaignId;

      AppState.dashboardLoaded = false;
      AppState.creativesLoaded = false;
      AppState.campaignsLoaded = false;

      if (AppState.metaConnected) {
        await updateDashboardView(true);
        await updateCreativeLibraryView(true);
        await updateCampaignsView(true);
      }
    });

    // Polling: Sobald Meta verbunden ist, werden Accounts + Kampagnen geladen,
    // auch wenn der User noch nie auf "Campaigns" geklickt hat.
    const poll = window.setInterval(async () => {
      if (!AppState.metaConnected || topbarHydrated) return;
      topbarHydrated = true;
      window.clearInterval(poll);
      try {
        await hydrateTopbarSelectors();
      } catch (err) {
        console.error("Fehler beim Initialisieren der Topbar-Selectoren:", err);
      }
    }, 1000);
  });
}

// Direkt ausführen, sobald dieses Modul geladen wird.
initTopbarDropdownBehaviour();

// ---------------------------------------------------------
// Kampagnen-Daten laden & Tabelle rendern
// ---------------------------------------------------------

async function ensureCampaignsWithInsights() {
  if (!AppState.metaConnected) {
    return [];
  }

  // Sicherstellen, dass Accounts & Kampagnen vorhanden sind
  if (!topbarHydrated) {
    try {
      await hydrateTopbarSelectors();
      topbarHydrated = true;
    } catch (err) {
      console.error("Fehler beim Hydratisieren der Topbar:", err);
    }
  }

  const accountId = AppState.selectedAccountId;
  if (!accountId) return [];

  // Kampagnen laden (falls nötig)
  if (!Array.isArray(AppState.meta.campaigns) || !AppState.meta.campaigns.length) {
    const campaignsRes = await fetchMetaCampaigns(accountId);
    if (campaignsRes?.success) {
      AppState.meta.campaigns = campaignsRes.data?.data || [];
    }
  }

  const campaigns = AppState.meta.campaigns || [];
  if (!campaigns.length) return [];

  // Insights pro Kampagne laden
  const ids = campaigns.map((c) => c.id);
  const insightsRes = await fetchMetaCampaignInsights(accountId, ids);
  const insightsByCampaign = insightsRes?.success ? insightsRes.data || {} : {};

  const enriched = campaigns.map((c) => {
    const metrics = insightsByCampaign[c.id] || {};
    return {
      ...c,
      metrics,
    };
  });

  AppState.meta.campaigns = enriched;
  AppState.campaignsLoaded = true;

  return enriched;
}

function renderCampaignsTable(campaigns) {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  if (!campaigns.length) {
    renderCampaignsPlaceholder("Keine Kampagnen für dieses Werbekonto gefunden.");
    return;
  }

  campaigns.forEach((c) => {
    const tr = document.createElement("tr");
    tr.dataset.campaignId = c.id;

    const statusIndicatorClass = getStatusIndicatorClass(c.status);
    const metrics = c.metrics || {};

    const isActive = (c.status || "").toUpperCase() === "ACTIVE";
    const toggleLabel = isActive ? "Stoppen" : "Starten";

    tr.innerHTML = `
      <td>
        <span class="status-indicator ${statusIndicatorClass}"></span>
        ${c.status || "-"}
      </td>
      <td>${c.name || "-"}</td>
      <td>${c.objective || "-"}</td>
      <td>${formatEuro(metrics.daily_budget || c.daily_budget / 100 || 0)}</td>
      <td>${formatEuro(metrics.spend || 0)}</td>
      <td>${formatRoas(metrics.roas || metrics.purchase_roas || 0)}</td>
      <td>${formatPercent(metrics.ctr || 0)}</td>
      <td>${metrics.impressions || 0}</td>
      <td style="white-space:nowrap;">
        <button class="action-button action-secondary" data-action="toggle">
          ${toggleLabel}
        </button>
        <button class="action-button" data-action="details">
          Details
        </button>
      </td>
    `;

    // Zeilenklick → Detail-Modal
    tr.addEventListener("click", (event) => {
      const btn = event.target.closest("button");
      if (btn) return; // Buttons separat behandeln
      openCampaignDetails(c);
    });

    // Buttons für Start/Stop & Details
    tr.querySelectorAll("button[data-action]").forEach((btn) => {
      const action = btn.dataset.action;
      btn.addEventListener("click", async (event) => {
        event.stopPropagation();

        if (action === "toggle") {
          await handleToggleCampaignStatus(c);
        } else if (action === "details") {
          openCampaignDetails(c);
        }
      });
    });

    tbody.appendChild(tr);
  });
}

// ---------------------------------------------------------
// Public API – von app.js aufgerufen
// ---------------------------------------------------------

export async function updateCampaignsView(connected) {
  const tbody = document.getElementById("campaignsTableBody");
  if (!tbody) return;

  if (!connected) {
    renderCampaignsPlaceholder();
    return;
  }

  renderCampaignsLoading();

  try {
    const campaigns = await ensureCampaignsWithInsights();
    renderCampaignsTable(campaigns);
  } catch (err) {
    console.error("Fehler beim Laden der Kampagnen:", err);
    renderCampaignsPlaceholder("Fehler beim Laden der Kampagnen.");
  }
}

// ---------------------------------------------------------
// Start / Stop Kampagne
// ---------------------------------------------------------

async function handleToggleCampaignStatus(campaign) {
  if (typeof updateMetaCampaignStatus !== "function") {
    console.warn(
      "updateMetaCampaignStatus ist nicht definiert. Bitte in metaApi.js implementieren oder Import entfernen."
    );
    return;
  }

  const current = (campaign.status || "").toUpperCase();
  const newStatus = current === "ACTIVE" ? "PAUSED" : "ACTIVE";

  try {
    const res = await updateMetaCampaignStatus(campaign.id, newStatus);
    if (!res?.success) {
      showToast("Kampagnenstatus konnte nicht aktualisiert werden.", "error");
      return;
    }

    campaign.status = newStatus;
    showToast(
      `Kampagne wurde ${newStatus === "ACTIVE" ? "gestartet" : "pausiert"}.`,
      "success"
    );

    AppState.campaignsLoaded = false;
    await updateCampaignsView(true);
  } catch (err) {
    console.error("Fehler beim Aktualisieren des Kampagnenstatus:", err);
    showToast("Fehler beim Aktualisieren des Kampagnenstatus.", "error");
  }
}

// ---------------------------------------------------------
// Edel: Kampagnen-Detail-Modal
// ---------------------------------------------------------

function openCampaignDetails(campaign) {
  const metrics = campaign.metrics || {};

  const statusClass = getStatusIndicatorClass(campaign.status);
  const isActive = (campaign.status || "").toUpperCase() === "ACTIVE";

  const html = `
    <div style="display:flex; flex-direction:column; gap:20px; max-width:640px;">
      <header style="display:flex; justify-content:space-between; gap:16px; align-items:flex-start;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              padding:4px 10px;
              border-radius:999px;
              font-size:11px;
              font-weight:600;
              background:rgba(99,102,241,0.08);
              color:var(--primary);
            ">
              Meta • Campaign
            </span>
            <span class="status-indicator ${statusClass}"></span>
            <span style="font-size:12px; color:var(--text-secondary); text-transform:uppercase;">
              ${campaign.status || "-"}
            </span>
          </div>
          <h3 style="font-size:20px; font-weight:600; margin:0 0 4px 0;">
            ${campaign.name || "Unbenannte Kampagne"}
          </h3>
          <p style="margin:0; font-size:13px; color:var(--text-secondary);">
            Ziel: <strong>${campaign.objective || "-"}</strong> · ID: ${campaign.id}
          </p>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:flex-end;">
          <button
            class="action-button action-secondary"
            data-modal-action="toggle"
            style="min-width:120px;"
          >
            ${isActive ? "Kampagne pausieren" : "Kampagne starten"}
          </button>
        </div>
      </header>

      <section style="display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:12px;">
        <div class="metric-chip">
          <div class="metric-label">Spend (30D)</div>
          <div class="metric-value">${formatEuro(metrics.spend || 0)}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">ROAS (30D)</div>
          <div class="metric-value">${formatRoas(
            metrics.roas || metrics.purchase_roas || 0
          )}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">CTR (30D)</div>
          <div class="metric-value">${formatPercent(metrics.ctr || 0)}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">Impressions (30D)</div>
          <div class="metric-value">${(metrics.impressions || 0).toLocaleString(
            "de-DE"
          )}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">Clicks (30D)</div>
          <div class="metric-value">${(metrics.clicks || 0).toLocaleString(
            "de-DE"
          )}</div>
        </div>
        <div class="metric-chip">
          <div class="metric-label">CPM (30D)</div>
          <div class="metric-value">${formatEuro(metrics.cpm || 0)}</div>
        </div>
      </section>

      <section style="display:flex; flex-direction:column; gap:8px;">
        <div style="font-size:13px; font-weight:600;">Nächste Schritte (Placeholder)</div>
        <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-secondary);">
          <li>„Jetzt Performanceanalyse durchführen“ – später: öffnet Sensei/Insights für diese Kampagne.</li>
          <li>„Neue Kampagne mit Sensei erstellen“ – später: AI-gestütztes Setup auf Basis der Best-Performer.</li>
          <li>„Meta Metriken besser verstehen“ – später: kurzer Lern-Overlay mit Erklärungen zu ROAS, CTR, CPM etc.</li>
        </ul>
      </section>
    </div>
  `;

  openModal("Kampagnendetails", html, {
    onOpen(modalElement) {
      const toggleBtn = modalElement.querySelector(
        'button[data-modal-action="toggle"]'
      );
      if (toggleBtn) {
        toggleBtn.addEventListener("click", async () => {
          await handleToggleCampaignStatus(campaign);
        });
      }
    },
  });
}
