/*
 * Brands Render
 * Multi-Brand Management:
 *  - Brand Selector
 *  - KPI-Übersicht (Dummy)
 *  - Cross-Brand Insight Text
 */

import { selectBrand, getBrandSummary } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Brands";
  container.appendChild(heading);

  const description = document.createElement("p");
  description.textContent =
    "Verwalte mehrere Brands und erkenne Muster über alle Brands hinweg.";
  container.appendChild(description);

  const brands = [
    { id: "brandA", name: "ACME Fashion" },
    { id: "brandB", name: "TechGadgets Pro" },
    { id: "brandC", name: "BeautyLux" },
  ];

  if (!AppState.selectedBrandId) {
    AppState.selectedBrandId = brands[0].id;
  }

  const selector = document.createElement("select");
  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = b.name;
    if (AppState.selectedBrandId === b.id) opt.selected = true;
    selector.appendChild(opt);
  });
  selector.onchange = () => {
    selectBrand(AppState, selector.value);
    render(container, AppState);
  };
  container.appendChild(selector);

  // Brand-KPI-Dummy
  const summary = getBrandSummary(AppState.selectedBrandId);

  const kpiGrid = document.createElement("div");
  kpiGrid.className = "kpi-grid";

  [
    ["Spend", `€${summary.spend.toLocaleString("de-DE")}`],
    ["ROAS", `${summary.roas.toFixed(1)}x`],
    ["Revenue", `€${summary.revenue.toLocaleString("de-DE")}`],
  ].forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "kpi-card";
    card.innerHTML = `<strong>${label}</strong><div>${value}</div>`;
    kpiGrid.appendChild(card);
  });

  container.appendChild(kpiGrid);

  // Cross-Brand Insight
  const insight = document.createElement("p");
  insight.textContent =
    "Cross-Brand Insight: Problem/Solution Hooks performen in allen drei Brands überdurchschnittlich gut. Rolle dieses Format über weitere Kampagnen hinweg aus.";
  container.appendChild(insight);
}
