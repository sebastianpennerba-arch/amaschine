/*
 * Reports Compute
 * Erzeugt Berichte und verwaltet den Zeitplan.
 */

export function scheduleReport(reports, type, frequency, channel = "email") {
  reports.push({
    id: Date.now(),
    type,
    frequency,
    channel,
    createdAt: new Date().toISOString(),
  });
}

/**
 * Erzeugt einen einfachen Textbericht auf Basis der übergebenen Daten.
 * Später kann hier HTML/PDF/CSV-Export andocken.
 */
export function generateReport(data = {}) {
  const date = new Date();
  const lines = [];

  lines.push("SIGNALONE – PERFORMANCE REPORT");
  lines.push("--------------------------------");
  lines.push(`Datum: ${date.toLocaleDateString("de-DE")}`);
  lines.push("");

  if (data.spend != null) {
    lines.push(`Spend: €${(data.spend || 0).toLocaleString("de-DE")}`);
  }
  if (data.revenue != null) {
    lines.push(`Revenue: €${(data.revenue || 0).toLocaleString("de-DE")}`);
  }
  if (data.roas != null) {
    lines.push(`ROAS: ${(data.roas || 0).toFixed(2)}x`);
  }
  if (data.topCreative) {
    lines.push(`Top Creative: ${data.topCreative}`);
  }

  lines.push("");
  lines.push("Highlights:");
  lines.push("- UGC-Strategie liefert überdurchschnittliche Ergebnisse.");
  lines.push("- Creative Fatigue bei älteren Static Ads beachten.");
  lines.push("- Weitere Tests in der Hook-Bibliothek empfohlen.");

  lines.push("");
  lines.push("Nächste Schritte:");
  lines.push(
    "- Budget auf Top-Kampagnen erhöhen und Loser pausieren (siehe Campaigns View)."
  );
  lines.push(
    "- Neue Variationen der Winner-Creatives im Testing Log anlegen."
  );
  lines.push("- Creator Leaderboard prüfen und Top-Creator stärker einsetzen.");

  return lines.join("\n");
}
