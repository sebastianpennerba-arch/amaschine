/*
 * Sensei Compute
 * Ermittelt Budget-Leaks, Skalierungsmöglichkeiten, Creative-Fatigue
 * und liefert Empfehlungen. Platzhalter für spätere AI-Modelle.
 */

export function detectBudgetLeak(campaigns) {
  return campaigns.filter((c) => c.roas < 2);
}

export function detectScalingOpportunity(campaigns) {
  return campaigns.filter((c) => c.roas > 4);
}

export function detectCreativeFatigue(creatives) {
  return creatives.filter((c) => c.ageDays > 21 && c.ctr < 0.03);
}

export function detectAnomaly(metricHistory) {
  const anomalies = [];
  for (let i = 1; i < metricHistory.length; i++) {
    const prev = metricHistory[i - 1];
    const curr = metricHistory[i];
    if (!prev) continue;
    const change = (curr - prev) / prev;
    if (change < -0.2) {
      anomalies.push({ index: i, value: curr });
    }
  }
  return anomalies;
}

export function getRecommendations() {
  // Dummy-Empfehlungen – werden bei echter Anbindung dynamisch
  return [
    {
      title: "Budget anpassen",
      description:
        'Reduziere "Brand Static" um 30 % und erhöhe "UGC Scale Test" um 50 %.',
    },
    {
      title: "Creative Refresh",
      description:
        "Ersetze alte Creatives (>21 Tage) durch neue UGC-Hooks mit Problem/Solution.",
    },
    {
      title: "Testing strukturieren",
      description:
        "Lege im Testing Log einen neuen Hook-Test an (Problem vs. Testimonial).",
    },
  ];
}
