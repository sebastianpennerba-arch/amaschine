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
} from "./data/demo/demoData.js";

// Haupt-Funktion: liefert eine komplette Analyse zurück
export function runSenseiDemoAnalysis() {

  const actions = [];
  const risks = [];
  const opportunities = [];
  const testing = [];
  const funnel = [];

  /* ---------------------------------------------------------
     1) Creative Fatigue Erkennung
  --------------------------------------------------------- */
  demoAlerts.forEach(alert => {
    if (alert.title.includes("Fatigue")) {
      risks.push({
        title: "Creative Müdigkeit erkannt",
        message: alert.message,
        priority: "Hoch"
      });

      actions.push({
        title: "Neues Creative entwickeln",
        message: "UGC Vol.3 läuft aus. Neue Hook-Variante erstellen.",
        priority: "Hoch"
      });
    }
  });

  /* ---------------------------------------------------------
     2) Top Creatives → Chancen
  --------------------------------------------------------- */
  demoCreatives
    .filter(c => c.performance === "Winner")
    .forEach(c => {
      opportunities.push({
        title: `Creative Winner: ${c.name}`,
        message: "Dieses Creative outperformt den Account-Schnitt. Skalieren empfohlen.",
        ctr: c.ctr,
        roas: c.roas,
        priority: "Mittel"
      });
    });

  /* ---------------------------------------------------------
     3) Weak Creatives → Risiken
  --------------------------------------------------------- */
  demoCreatives
    .filter(c => c.performance === "Schwach")
    .forEach(c => {
      risks.push({
        title: `Schwaches Creative: ${c.name}`,
        message: "CTR, ROAS und CPM unter Benchmark. Pausieren empfohlen.",
        priority: "Mittel"
      });

      actions.push({
        title: "Creative pausieren",
        message: `${c.name} performt unter Durchschnitt. Sofort pausieren.`,
        priority: "Mittel"
      });
    });

  /* ---------------------------------------------------------
     4) Funnel Health Auswertung
  --------------------------------------------------------- */
  const funnelData = demoFunnel;

  if (funnelData.tof.score < 80) {
    risks.push({ 
      title: "Top Funnel Potential",
      message: "CTR und Scrollstop gut – aber noch nicht maximal ausgenutzt.",
      priority: "Mittel"
    });
  }

  if (funnelData.mof.score < 70) {
    risks.push({ 
      title: "Middle Funnel Schwäche",
      message: "Video-View-Rate könnte verbessert werden.",
      priority: "Hoch"
    });

    actions.push({
      title: "Retargeting erweitern",
      message: "2 neue Video-Varianten für MoF hinzufügen.",
      priority: "Hoch"
    });
  }

  if (funnelData.bof.score < 70) {
    risks.push({ 
      title: "Bottom Funnel Problem",
      message: "Checkout Abbrüche hoch. Landing Page inspizieren.",
      priority: "Hoch"
    });
  }

  /* ---------------------------------------------------------
     5) Hook Analyse → Chancen
  --------------------------------------------------------- */
  demoHookAnalysis.forEach(hook => {
    if (hook.roas > 4) {
      opportunities.push({
        title: `Starker Hook: ${hook.hook}`,
        message: hook.message,
        ctr: hook.ctr,
        priority: "Hoch"
      });
    }
  });

  /* ---------------------------------------------------------
     6) Testing Log Integration
  --------------------------------------------------------- */
  demoTestingLog.forEach(t => {
    testing.push({
      title: t.title,
      status: t.status,
      findings: t.findings,
      next: t.next_step,
      priority: t.status === "Laufend" ? "Hoch" : "Mittel"
    });
  });

  /* ---------------------------------------------------------
     7) Forecast Empfehlungen
  --------------------------------------------------------- */

  const forecast = {
    spend: demoForecast.next7days.projected_spend,
    revenue: demoForecast.next7days.projected_revenue,
    roas: demoForecast.next7days.projected_roas,
    confidence: demoForecast.next7days.confidence,
    message: demoForecast.message
  };

  /* ---------------------------------------------------------
     FINAL RETURN OBJEKT
  --------------------------------------------------------- */

  return {
    date: new Date().toISOString(),
    summary: "Sensei Analyse erfolgreich abgeschlossen.",

    actions,
    risks,
    opportunities,
    testing,
    forecast,
    funnel: demoFunnel
  };
}
