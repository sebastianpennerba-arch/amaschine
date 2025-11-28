// packages/dashboard/dashboard.render.js
// Rendert das Dashboard in #dashboardKpiContainer (Phase 1 Final)

import { renderAlertsBox } from "./dashboard.alerts.js";
import {
    renderKpiMiniCards,
    renderTopFlopCreatives,
    renderHeroBar,
    renderFunnelMiniBlock
} from "./dashboard.blocks.js";

export function renderDashboard(state) {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) {
        console.warn("[DashboardRender] #dashboardKpiContainer missing");
        return;
    }

    const { connected, demoMode, metrics, alerts, creatives, funnel } = state;

    let html = "";

    // Hero Bar (Meta verbunden / Demo / offline)
    html += renderHeroBar(connected, demoMode);

    // KPI Cards
    html += renderKpiMiniCards(metrics || {});

    // Alerts
    html += renderAlertsBox(alerts);

    // Funnel Snapshot (Mini-Block)
    html += renderFunnelMiniBlock(funnel || {});

    // Top / Flop Creatives, falls Creatives vorhanden
    if (Array.isArray(creatives) && creatives.length) {
        html += renderTopFlopCreatives(creatives);
    }

    container.innerHTML = html;

    // Hero Connect Button → globalen Connect-Button triggern
    const heroBtn = document.getElementById("heroConnectButton");
    if (heroBtn) {
        const connectBtn = document.getElementById("connectMetaButton");
        if (connectBtn) {
            heroBtn.addEventListener("click", () => connectBtn.click());
        }
    }
}
