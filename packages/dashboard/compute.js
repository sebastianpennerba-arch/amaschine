/*
 * Dashboard Compute
 * Wandelt Rohdaten in KPIs und Alerts.
 */

export function computeKPIs(rawData) {
  return {
    spend: rawData.spend || 0,
    roas: rawData.roas || 0,
    revenue: rawData.revenue || 0,
    ctr: rawData.ctr || 0,
    cpm: rawData.cpm || 0,
  };
}

export function detectAlerts(kpis) {
  const alerts = [];
  if (kpis.roas < 2) {
    alerts.push({ type: "warning", message: "ROAS unter 2 – genau prüfen." });
  }
  if (kpis.ctr < 0.02) {
    alerts.push({
      type: "warning",
      message: "CTR niedrig – Creatives oder Hooks optimieren.",
    });
  }
  return alerts;
}
