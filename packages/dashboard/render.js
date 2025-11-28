/*
 * Dashboard Render
 */

import { computeKPIs, detectAlerts } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const isDemo = AppState.settings?.demoMode;
  const isMeta = AppState.metaConnected;

  const rawData = {
    spend: 47892,
    roas: 4.8,
    revenue: 229882,
    ctr: 0.032,
    cpm: 8.4,
  };

  const kpis = computeKPIs(rawData);
  const alerts = detectAlerts(kpis);

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

  const kpiGrid = document.createElement("div");
  kpiGrid.className = "kpi-grid";

  const kpiItems = [
    { label: "Spend", value: `€${formatNumber(kpis.spend)}` },
    { label: "ROAS", value: `${kpis.roas.toFixed(1)}x` },
    { label: "Revenue", value: `€${formatNumber(kpis.revenue)}` },
    { label: "CTR", value: `${(kpis.ctr * 100).toFixed(2)} %` },
    { label: "CPM", value: `€${kpis.cpm.toFixed(2)}` },
  ];

  kpiItems.forEach((item) => {
    const card = document.createElement("div");
    card.className = "kpi-card";
    card.innerHTML = `<strong>${item.label}</strong><div>${item.value}</div>`;
    kpiGrid.appendChild(card);
  });

  const alertsSection = document.createElement("section");
  alertsSection.className = "dashboard-alerts";

  const alertsTitle = document.createElement("h3");
  alertsTitle.textContent = "Alerts";
  alertsSection.appendChild(alertsTitle);

  if (!alerts.length) {
    const ok = document.createElement("p");
    ok.className = "dashboard-alerts-empty";
    ok.textContent = "Keine kritischen Alerts – weiter skalieren 🚀";
    alertsSection.appendChild(ok);
  } else {
    alerts.forEach((alert) => {
      const alertEl = document.createElement("div");
      alertEl.className = "alert";
      alertEl.textContent = alert.message;
      alertsSection.appendChild(alertEl);
    });
  }

  const insight = document.createElement("section");
  insight.className = "dashboard-insight";
  const insightTitle = document.createElement("h3");
  insightTitle.textContent = "Sensei Snapshot";
  const insightBody = document.createElement("p");
  insightBody.textContent =
    "Deine Top-3 Creatives generieren den Großteil des Revenues. Prüfe Testing Log & Creative Library, um weitere Winner zu finden.";
  insight.appendChild(insightTitle);
  insight.appendChild(insightBody);

  container.appendChild(hero);
  container.appendChild(kpiGrid);
  container.appendChild(alertsSection);
  container.appendChild(insight);
}

function formatNumber(num) {
  if (!num && num !== 0) return "0";
  return num.toLocaleString("de-DE");
}
