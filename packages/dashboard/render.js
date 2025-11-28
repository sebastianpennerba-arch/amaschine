/*
 * Dashboard Render
 * Baut die UI für das Dashboard auf:
 *  - Hero-Bar (Meta/Demo Status)
 *  - KPI-Grid
 *  - Alerts
 *  - Mini-Insight-Box
 */

import { computeKPIs, detectAlerts } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const isDemo = AppState.settings?.demoMode;
  const isMeta = AppState.metaConnected;

  // Mock-Daten – später via Meta / Backend ersetzen
  const rawData = {
    spend: 47892,
    roas: 4.8,
    revenue: 229882,
    ctr: 0.032,
    cpm: 8.4,
  };

  const kpis = computeKPIs(rawData);
  const alerts = detectAlerts(kpis);

  // --- Hero-Bar -----------------------------------------------------------
  const hero = document.createElement("section");
  hero.className = "dashboard-hero";

  const statusLabel = document.createElement("div");
  statusLabel.className = "dashboard-hero-status";
  statusLabel.textContent = isMeta
    ? "Live-Daten verbunden"
    : isDemo
    ? "Demo-Daten aktiv"
    : "Offline – bitte Meta verbinden oder Demo aktivieren";

  const headline = document.createElement("h2");
  headline.className = "dashboard-hero-title";
  headline.textContent = "Account Performance – letzte 30 Tage";

  const kpiSummary = document.createElement("p");
  kpiSummary.className = "dashboard-hero-subtitle";
  kpiSummary.textContent = `Spend: €${formatNumber(
    kpis.spend
  )} · ROAS: ${kpis.roas.toFixed(1)}x · Revenue: €${formatNumber(
    kpis.revenue
  )}`;

  hero.appendChild(statusLabel);
  hero.appendChild(headline);
  hero.appendChild(kpiSummary);

  // --- KPI-Grid -----------------------------------------------------------
  const kpiGrid = document.createElement("div");
  kpiGrid.className = "kpi-grid";

  const kpiItems = [
    { label: "Spend", value: `€${formatNumber(kpis.spend)}` },
    { label: "ROAS", value: `${kpis.roas.toFixed(1)}x` },
    { label: "Revenue", value: `€${formatNumber(kpis.revenue)}` },
    { label: "CTR", value: `${(kpis.ctr * 100).2f || (kpis.ctr * 100).toFixed(2)} %` },
    // Fix: directly
  ];
}
