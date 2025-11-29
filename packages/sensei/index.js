// packages/sensei/index.js
// Einstiegsmodul für die Sensei / AI Suite.
// Orchestriert die Submodule: Overview, Strategy, Testing, Alerts, Budget.

import { renderSenseiOverview } from "./dashboard.js";
import { renderSenseiStrategy } from "./strategy.js";
import { renderSenseiTesting } from "./testing.js";
import { renderSenseiAlerts } from "./alerts.js";
import { renderSenseiBudget } from "./budget.js";

function getDemoData() {
  if (window.SignalOneDemo && window.SignalOneDemo.DemoData) {
    return window.SignalOneDemo.DemoData;
  }
  return {
    brands: [],
    campaignsByBrand: {},
  };
}

function getActiveBrand(AppState, DemoData) {
  if (!DemoData || !Array.isArray(DemoData.brands)) return null;

  const id = AppState.selectedBrandId;
  if (!id) {
    return DemoData.brands[0] || null;
  }
  return (
    DemoData.brands.find((b) => b.id === id) ||
    DemoData.brands[0] ||
    null
  );
}

function getActiveCampaign(AppState, DemoData) {
  const brand = getActiveBrand(AppState, DemoData);
  if (!brand || !DemoData.campaignsByBrand) return null;

  const list = DemoData.campaignsByBrand[brand.id] || [];
  if (!list.length) return null;

  const id = AppState.selectedCampaignId;
  if (!id) {
    return list[0] || null;
  }
  return list.find((c) => c.id === id) || list[0] || null;
}

// Wird von app.js via dynamic import aufgerufen
export function render(root, AppState, ctx = {}) {
  const DemoData = getDemoData();
  const brand = getActiveBrand(AppState, DemoData);
  const campaign = getActiveCampaign(AppState, DemoData);
  const isDemo = !!ctx.useDemoMode;

  const brandLabel = brand ? brand.name : "Kein Werbekonto";
  const campaignLabel = campaign ? campaign.name : "Kein Kampagnen-Fokus";

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Sensei / AI Suite</h2>
        <p class="view-subtitle">
          KI-Layer für Strategie, Budget & Testing –
          <strong>${brandLabel}</strong>${campaign ? ` · ${campaignLabel}` : ""}
        </p>
      </div>
      <div class="topbar-status-group">
        <span class="mode-badge">
          <i class="fa-solid fa-robot"></i>
          Mode: ${isDemo ? "Demo-Insights" : "Live-Insights"}
        </span>
        <span class="badge">
          <i class="fa-solid fa-bullseye"></i>
          Fokus: ${campaignLabel}
        </span>
      </div>
    </div>
    <div id="senseiInner"></div>
  `;

  const inner = root.querySelector("#senseiInner");
  if (!inner) return;

  const context = { brand, campaign, isDemo };

  // Reihenfolge: 1) Overview, 2) Strategy, 3) Testing, 4) Alerts, 5) Budget
  renderSenseiOverview(inner, AppState, DemoData, context);
  renderSenseiStrategy(inner, AppState, DemoData, context);
  renderSenseiTesting(inner, AppState, DemoData, context);
  renderSenseiAlerts(inner, AppState, DemoData, context);
  renderSenseiBudget(inner, AppState, DemoData, context);
}
