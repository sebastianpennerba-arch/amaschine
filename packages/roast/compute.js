/*
 * Roast Compute
 * Nimmt ein Creative (oder nur den Dateinamen) und generiert Feedback.
 * Hier nur ein heuristischer Dummy.
 */

export function roastCreative(file) {
  const name = file?.name?.toLowerCase() || "";

  const positives = ["Klares Angebot", "Strukturierte Story"];
  const negatives = [];

  if (name.includes("static")) {
    negatives.push("Zu statisch – teste UGC-Varianten.");
  }
  if (name.includes("long")) {
    negatives.push("Video vermutlich zu lang – Hook kürzen.");
  }
  if (!name) {
    negatives.push("Kein Dateiname – hier läuft ein Demo-Roast.");
  }

  if (negatives.length === 0) {
    negatives.push("CTA könnte stärker hervorgehoben werden.");
  }

  const score = 7; // Dummy

  const summary =
    "Gute Basis, aber vermutlich noch nicht dein finaler Winner. Teste verschiedene Hooks, Längen und Thumbnails im Testing Log.";

  return {
    positives,
    negatives,
    score,
    summary,
  };
}
