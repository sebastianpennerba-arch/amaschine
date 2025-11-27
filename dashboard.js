// dashboard.js – SignalOne.cloud – FINAL

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";
import { showToast } from "./uiCore.js";

function parseNumber(val) {
  if (val == null) return 0;
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

function formatCurrencyEUR(val) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatPercent(val) {
  return `${(val || 0).toFixed(2)}%`;
}

function formatX(val) {
  return `${(val || 0).toFixed(2)}x`;
}

export async function updateDashboardView() {
  const viewEl = document.getElementById("dashboardView");
  if (!viewEl) return;

  const spendEl = document.getElementById("kpiTotalSpend");
  const revEl = document.getElementById("kpiTotalRevenue");
  const roasEl = document.getElementById("kpiRoas");
  const ctrEl = document.getElementById("kpiCtr");
  const summaryEl = document.getElementById("dashboardSummary");

  if (!AppState.metaConnected || !AppState.meta.accessToken) {
    if (spendEl) spendEl.textContent = "–";
    if (revEl) revEl.textContent = "–";
    if (roasEl) roasEl.textContent = "–";
    if (ctrEl) ctrEl.textContent = "–";
    if (summaryEl) {
      summaryEl.innerHTML =
        "<p>Verbinde dich mit Meta, um Live-Performance-Daten zu sehen.</p>";
    }
    return;
  }

  const campaigns = AppState.meta.campaigns || [];
  if (!campaigns.length) {
    if (summaryEl) {
      summaryEl.innerHTML =
        "<p>Keine Kampagnen gefunden. Prüfe dein Werbekonto im Meta Ads Manager.</p>";
    }
    return;
  }

  const token = AppState.meta.accessToken;
  const timePreset = AppState.timeRangePreset || "last_30d";

  let insightsRows = [];
  try {
    if (AppState.selectedCampaignId && AppState.selectedCampaignId !== "ALL") {
      const rows = await fetchMetaCampaignInsights(
        AppState.selectedCampaignId,
        token,
        timePreset
      );
      insightsRows = rows || [];
    } else {
      // Alle Kampagnen aggregieren – parallel
      const promises = campaigns.map((c) =>
        fetchMetaCampaignInsights(c.id, token, timePreset)
      );
      const results = await Promise.allSettled(promises);
      results.forEach((r) => {
        if (r.status === "fulfilled" && Array.isArray(r.value)) {
          insightsRows.push(...r.value);
        }
      });
    }
  } catch (err) {
    console.error("updateDashboardView insights error:", err);
    showToast("Fehler beim Laden der Insights.", "error");
  }

  if (!insightsRows.length) {
    if (spendEl) spendEl.textContent = formatCurrencyEUR(0);
    if (revEl) revEl.textContent = formatCurrencyEUR(0);
    if (roasEl) roasEl.textContent = formatX(0);
    if (ctrEl) ctrEl.textContent = formatPercent(0);
    if (summaryEl) {
      summaryEl.innerHTML =
        "<p>Keine Insights für diesen Zeitraum/Kampagne verfügbar.</p>";
    }
    return;
  }

  let totalSpend = 0;
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalRevenue = 0;
  let weightedRoasNumerator = 0;

  insightsRows.forEach((row) => {
    const spend = parseNumber(row.spend);
    const impressions = parseNumber(row.impressions);
    const clicks = parseNumber(row.clicks);

    totalSpend += spend;
    totalImpressions += impressions;
    totalClicks += clicks;

    // purchase_roas kommt als Array mit {action_type, value}
    let roasVal = 0;
    if (Array.isArray(row.purchase_roas) && row.purchase_roas.length > 0) {
      roasVal = parseNumber(row.purchase_roas[0].value);
    }

    if (roasVal > 0 && spend > 0) {
      weightedRoasNumerator += roasVal * spend;
      totalRevenue += roasVal * spend;
    }
  });

  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const roas =
    totalSpend > 0 ? weightedRoasNumerator / totalSpend : 0;

  AppState.dashboardMetrics = {
    spend: totalSpend,
    revenue: totalRevenue,
    ctr,
    roas,
  };

  if (spendEl) spendEl.textContent = formatCurrencyEUR(totalSpend);
  if (revEl) revEl.textContent = formatCurrencyEUR(totalRevenue);
  if (roasEl) roasEl.textContent = formatX(roas);
  if (ctrEl) ctrEl.textContent = formatPercent(ctr);

  if (summaryEl) {
    const campaignText =
      AppState.selectedCampaignId && AppState.selectedCampaignId !== "ALL"
        ? "gewählte Kampagne"
        : "alle Kampagnen";
    summaryEl.innerHTML = `
      <p>Zeitraum: <strong>${labelForTimePreset(timePreset)}</strong>, ${campaignText}.</p>
      <ul class="summary-list">
        <li>Spend: <strong>${formatCurrencyEUR(totalSpend)}</strong></li>
        <li>Revenue (approx.): <strong>${formatCurrencyEUR(totalRevenue)}</strong></li>
        <li>ROAS: <strong>${formatX(roas)}</strong></li>
        <li>CTR: <strong>${formatPercent(ctr)}</strong></li>
      </ul>
    `;
  }
}

function labelForTimePreset(preset) {
  switch (preset) {
    case "today":
      return "Heute";
    case "yesterday":
      return "Gestern";
    case "last_30d":
    default:
      return "Letzte 30 Tage";
  }
}
