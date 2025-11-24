// sensei-demo-engine.js
// Regelbasiertes Sensei-System (DEMO MODE)

import { 
  demoCampaigns, 
  demoCreatives, 
  demoFunnel, 
  demoAlerts, 
  demoHookAnalysis,
  demoTestingLog,
  demoForecast
} from "./demoData.js";

// Haupt-Funktion: liefert eine komplette Analyse zurück
export function runSenseiDemoAnalysis() {

  // 1) Dashboard-Level / Gesamt-Performance
  const totalSpend = demoCampaigns.reduce((sum, c) => sum + (c.spend || 0), 0);
  const totalRevenue = demoCampaigns.reduce(
    (sum, c) => sum + (c.revenue || 0),
    0
  );
  const totalImpressions = demoCampaigns.reduce(
    (sum, c) => sum + (c.impressions || 0),
    0
  );
  const totalClicks = demoCampaigns.reduce(
    (sum, c) => sum + (c.clicks || 0),
    0
  );

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  const dashboard = {
    spend: totalSpend,
    revenue: totalRevenue,
    roas,
    ctr,
    cpm,
    impressions: totalImpressions,
    clicks: totalClicks
  };

  // 2) Alerts aus Demo-Config
  const alerts = demoAlerts.slice();

  // 3) Hook-Analyse
  const hookAnalysis = demoHookAnalysis;

  // 4) Testing Log
  const testing = demoTestingLog.slice();

  // 5) Forecast
  const forecast = demoForecast;

  // 6) Aktionen / Empfehlungen
  const actions = [
    {
      title: "Skaliere Gewinner-Kampagne",
      message:
        "Kampagne 'UGC SCALE – Evergreen Vol. 3' hat stabilen ROAS > 4.0. Empfohlen: Budget +20–30% in den nächsten 3 Tagen.",
      priority: "Hoch"
    },
    {
      title: "Testing für Retargeting ausbauen",
      message:
        "Retargeting-Kampagne zeigt solide CTR, aber schwachen ROAS. Empfohlen: Neue Hooks testen, Landingpage-Varianten prüfen.",
      priority: "Mittel"
    }
  ];

  const risks = [
    {
      title: "Abfallender ROAS in Broad-Kampagne",
      message:
        "Die Broad-Kampagne 'TOP – Prospecting Broad' verliert in den letzten 7 Tagen an Effizienz. Achte auf steigenden CPM.",
      priority: "Hoch"
    }
  ];

  const opportunities = [
    {
      title: "Starke Performance bei UGC Creatives",
      message:
        "UGC-Video-Creatives haben im Schnitt 25–40% bessere CTR. Nutze dies stärker in deinen Hauptkampagnen.",
      priority: "Mittel"
    }
  ];

  /* ---------------------------------------------------------
     RETURN – Komplettes Objekt für Sensei-Frontend
  --------------------------------------------------------- */

  return {
    date: new Date().toISOString(),
    summary: "Sensei Analyse erfolgreich abgeschlossen.",

    dashboard,
    hooks: hookAnalysis,
    alerts,
    actions,
    risks,
    opportunities,
    testing,
    forecast,
    funnel: demoFunnel
  };
}
