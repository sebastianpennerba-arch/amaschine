/*
 * Sensei Render
 * Stellt das Strategy Center dar:
 *  - Budget Leak
 *  - Scaling Opportunities
 *  - Creative Fatigue
 *  - High-Level Recommendations
 */

import {
  detectBudgetLeak,
  detectScalingOpportunity,
  detectCreativeFatigue,
  getRecommendations,
} from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Sensei Strategy Center";
  container.appendChild(heading);

  const intro = document.createElement("p");
  intro.textContent =
    "Tägliche Action Items basierend auf deinen Kampagnen- und Creative-Daten.";
  container.appendChild(intro);

  const campaigns = [
    { id: 1, name: "Brand Static", roas: 2.1, spend: 12890 },
    { id: 2, name: "UGC Scale Test", roas: 5.8, spend: 18420 },
    { id: 3, name: "Retargeting Cold", roas: 1.3, spend: 8340 },
  ];
  const creatives = [
    { id: 1, title: "Mia_v3", ageDays: 25, ctr: 0.028 },
    { id: 2, title: "Static_v12", ageDays: 32, ctr: 0.009 },
    { id: 3, title: "Tom_Testimonial_v1", ageDays: 14, ctr: 0.034 },
  ];

  const leaks = detectBudgetLeak(campaigns);
  const opps = detectScalingOpportunity(campaigns);
  const fatigued = detectCreativeFatigue(creatives);
  const recs = getRecommendations();

  container.appendChild(
    createCard(
      "Budget Leaks",
      leaks.length
        ? leaks.map(
            (c) =>
              `${c.name}: ROAS ${c.roas.toFixed(
                2
              )}x – Spend €${c.spend.toLocaleString("de-DE")}`
          )
        : ["Keine offensichtlichen Budget-Leaks entdeckt."]
    )
  );

  container.appendChild(
    createCard(
      "Scaling Opportunities",
      opps.length
        ? opps.map(
            (c) =>
              `${c.name}: ROAS ${c.roas.toFixed(
                2
              )}x – Skalierung empfohlen.`
          )
        : ["Aktuell keine klaren Scaling-Kandidaten."]
    )
  );

  container.appendChild(
    createCard(
      "Creative Fatigue",
      fatigued.length
        ? fatigued.map(
            (cr) =>
              `${cr.title}: ${cr.ageDays} Tage Laufzeit, CTR ${(
                cr.ctr * 100
              ).toFixed(2)} %`
          )
        : ["Keine Creatives mit klaren Fatigue-Signalen gefunden."]
    )
  );

  container.appendChild(
    createCard(
      "Sensei Empfehlungen",
      recs.map((r) => `${r.title}: ${r.description}`)
    )
  );
}

function createCard(title, lines) {
  const card = document.createElement("div");
  card.className = "sensei-card";
  const h3 = document.createElement("h3");
  h3.textContent = title;
  card.appendChild(h3);
  const ul = document.createElement("ul");
  lines.forEach((line) => {
    const li = document.createElement("li");
    li.textContent = line;
    ul.appendChild(li);
  });
  card.appendChild(ul);
  return card;
}
