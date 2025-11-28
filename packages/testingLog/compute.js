/*
 * Testing Log Compute
 * Verwaltet Testcases, Vorhersagen und Auswertungen.
 */

export function createTest(id, name, hypothesisOrVariants) {
  const hypothesis =
    typeof hypothesisOrVariants === "string"
      ? hypothesisOrVariants
      : "Strukturierter A/B-Test mit mehreren Varianten.";

  const variants =
    Array.isArray(hypothesisOrVariants) && hypothesisOrVariants.length
      ? hypothesisOrVariants
      : [];

  return {
    id,
    name,
    hypothesis,
    variants,
    metrics: {},
    prediction: null,
    status: "running",
    learnings: "",
    nextSteps: "",
  };
}

export function predictWinner(test) {
  // Placeholder für Prediction-Logik
  if (test.variants && test.variants.length > 1) {
    // Einfach: erste Variante als "vermuteter" Gewinner
    return `Wahrscheinlicher Gewinner: ${test.variants[0]}`;
  }
  if (test.variants && test.variants.length === 1) {
    return `Einzige Variante im Test: ${test.variants[0]}`;
  }
  return null;
}
