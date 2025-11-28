/*
 * Analytics Render
 * Visualisiert:
 *  - Creative Performance Map (als Punkte-Grid)
 *  - Hook-Analyse
 *  - Funnel Health
 */

import {
  computePerformanceMap,
  computeHookStats,
  computeFunnelScore,
} from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Advanced Analytics";
  container.appendChild(heading);

  // Beispiel-Daten
  const creatives = [
    { id: 1, spend: 6200, roas: 6.8, hook: "Problem/Solution" },
    { id: 2, spend: 4800, roas: 5.9, hook: "Testimonial" },
    { id: 3, spend: 3100, roas: 5.2, hook: "Before/After" },
    { id: 4, spend: 3200, roas: 1.8, hook: "Direct CTA" },
  ];
  const funnel = {
    impressions: 100000,
    clicks: 3200,
    purchases: 280,
  };

  const perfMap = computePerformanceMap(creatives);
  const hookStats = computeHookStats(creatives);
  const funnelScore = computeFunnelScore(funnel);

  // Performance Map
  const perfSection = document.createElement("section");
  perfSection.innerHTML = "<h3>Creative Performance Map</h3>";
  const perfLegend = document.createElement("p");
  perfLegend.textContent =
    "Jeder Punkt repräsentiert ein Creative (ROAS vs. Spend). Dunklere Punkte = höhere ROAS.";
  perfSection.appendChild(perfLegend);

  const perfGrid = document.createElement("div");
  perfGrid.style.display = "grid";
  perfGrid.style.gridTemplateColumns =
    "repeat(auto-fit, minmax(8px, 1fr))";
  perfGrid.style.gap = "2px";

  perfMap.forEach((p) => {
    const dot = document.createElement("div");
    dot.style.height = "8px";
    dot.style.borderRadius = "999px";
    dot.style.opacity = "0.9";
    // einfache visuelle Kodierung
    const roasBucket = p.y >= 5 ? "high" : p.y >= 3 ? "mid" : "low";
    if (roasBucket === "high") {
      dot.style.backgroundColor = "#22c55e";
    } else if (roasBucket === "mid") {
      dot.style.backgroundColor = "#f59e0b";
    } else {
      dot.style.backgroundColor = "#ef4444";
    }
    dot.title = `ID ${p.id} – Spend €${p.x.toLocaleString(
      "de-DE"
    )}, ROAS ${p.y.toFixed(2)}x`;
    perfGrid.appendChild(dot);
  });

  perfSection.appendChild(perfGrid);

  // Hook Stats
  const hookSection = document.createElement("section");
  hookSection.innerHTML = "<h3>Hook-Analyse</h3>";
  hookStats.forEach((h) => {
    const p = document.createElement("p");
    p.textContent = `${h.hook}: Ø ROAS ${h.avgRoas.toFixed(
      2
    )}x (n=${h.count})`;
    hookSection.appendChild(p);
  });

  // Funnel Health
  const funnelSection = document.createElement("section");
  funnelSection.innerHTML = "<h3>Funnel Health</h3>";

  const ctr = (funnelScore.ctr * 100).toFixed(2);
  const cv = (funnelScore.cvRate * 100).toFixed(2);
  const score = (funnelScore.score * 100).toFixed(1);

  const fText = document.createElement("p");
  fText.textContent = `CTR: ${ctr} % · Conversion Rate: ${cv} % · Score: ${score}/100`;
  funnelSection.appendChild(fText);

  container.appendChild(perfSection);
  container.appendChild(hookSection);
  container.appendChild(funnelSection);
}
