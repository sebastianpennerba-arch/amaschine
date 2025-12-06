// packages/creativeLibrary/health.js
// -----------------------------------------------------------------------------
// 💊 Creative Health Scoring (Premium C)
// - Bewertet jedes Creative mit einem Score von 0–100
// - Liefert Label + Tone + kurze Notizen für ROAS / CTR / CPM
// - Wird von index.js verwendet, ohne compute.js zu verändern
// -----------------------------------------------------------------------------

export function computeCreativeHealth(creative) {
  const m = creative.metrics || {};
  const roas = toNumber(m.roas);
  const ctr = toNumber(m.ctr);
  const cpm = toNumber(m.cpm);
  const spend = toNumber(m.spend);
  const bucket = creative.bucket || null;

  let score = 50;

  // ROAS – stärkster Hebel
  if (roas >= 6) score += 25;
  else if (roas >= 4) score += 15;
  else if (roas >= 2) score += 5;
  else if (roas > 0 && roas < 1.5) score -= 15;

  // CTR – Creative Qualität
  if (ctr >= 4) score += 15;
  else if (ctr >= 2.5) score += 8;
  else if (ctr > 0 && ctr < 1.5) score -= 10;

  // CPM – Kosteneffizienz
  if (cpm > 0 && cpm <= 8) score += 8;
  else if (cpm > 15) score -= 8;

  // Spend – Relevanz
  if (spend >= 15000) score += 5;

  // Bucket – aus compute.js
  if (bucket === "winner") score += 8;
  if (bucket === "loser") score -= 8;

  if (!Number.isFinite(score)) score = 50;
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let label = "Neutral";
  let tone = "warning";

  if (score >= 85) {
    label = "Top Creative";
    tone = "good";
  } else if (score >= 70) {
    label = "Stark";
    tone = "good";
  } else if (score >= 55) {
    label = "Solide";
    tone = "warning";
  } else if (score >= 40) {
    label = "Unter Beobachtung";
    tone = "warning";
  } else {
    label = "Kritisch";
    tone = "critical";
  }

  const roasNote = !Number.isFinite(roas)
    ? "Keine ROAS-Daten."
    : roas >= 4
    ? "Über Ziel-ROAS."
    : roas >= 2
    ? "Im akzeptablen Bereich."
    : "Unter Ziel-ROAS – prüfen.";

  const ctrNote = !Number.isFinite(ctr)
    ? "Keine CTR-Daten."
    : ctr >= 3.5
    ? "Sehr guter Scrollstop."
    : ctr >= 2
    ? "OK, aber ausbaufähig."
    : "Schwache CTR – Hook überarbeiten.";

  const cpmNote = !Number.isFinite(cpm)
    ? "Keine CPM-Daten."
    : cpm <= 8
    ? "Effiziente Media-Kosten."
    : cpm <= 15
    ? "Im normalen Rahmen."
    : "Hoher CPM – Targeting/Creative prüfen.";

  const reasonShort =
    score >= 85
      ? "Klares Scaling-Creative – hoher ROAS & starke CTR."
      : score >= 70
      ? "Gute Performance – weiter testen und skalieren."
      : score >= 55
      ? "Solide Performance – Beobachten & Varianten testen."
      : score >= 40
      ? "Auffällige Schwächen – besser als klare Loser, aber kritisch."
      : "Stark unter Benchmark – nur für Lernzwecke behalten.";

  const reasonLong =
    "Der Creative Health Score kombiniert ROAS, CTR, CPM, Spend und Bucket-Label zu einer einfachen Ampel. " +
    "Hoher ROAS + gute CTR + niedriger CPM ergeben einen hohen Score. Schwache CTR oder sehr hoher CPM deuten auf " +
    "Hook- / Creative-Probleme hin. Nutze den Score, um schnell deine besten und schlechtesten Creatives zu erkennen.";

  return {
    score,
    label,
    tone,
    roasNote,
    ctrNote,
    cpmNote,
    reasonShort,
    reasonLong,
  };
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}
