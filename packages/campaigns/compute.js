/*
 * Campaigns Compute
 * Berechnet Kennzahlen, Status und einfache Scaling-Indikatoren
 * für Kampagnen.
 */

export function computeCampaignStats(campaigns) {
  return campaigns.map((c) => {
    let status = "watch";

    if (c.roas >= 4) {
      status = "scaling";
    } else if (c.roas < 1.5) {
      status = "failing";
    }

    const scalingHint =
      status === "scaling"
        ? "Budget erhöhen (starke Performance)."
        : status === "failing"
        ? "Budget reduzieren oder pausieren."
        : "Beobachten und Creative/Hook testen.";

    return {
      ...c,
      status,
      scalingHint,
    };
  });
}
