// packages/dashboard/dashboard.render.js
// Rendert das Dashboard in #dashboardKpiContainer und nutzt Alerts + Blocks.

import { renderAlertsBox } from "./dashboard.alerts.js";
import {
    renderKpiMiniCards,
    renderTopFlopCreatives,
    renderHeroBar
} from "./dashboard.blocks.js";

export function renderDashboard(state) {
    const container = document.getElementById("dashboardKpiContainer");
    if (!container) return;

    const { connected, demoMode, metrics, alerts, creatives } = state;

    let html = "";

    // Hero Bar (Meta verbunden / Demo / nicht verbunden)
    html += renderHeroBar(connected, demoMode);

    // KPI Mini Cards
    html += renderKpiMiniCards(metrics || {});

    // Alerts-Box
    html += renderAlertsBox(alerts);

    // Top/Flop Creatives, wenn vorhanden
    if (Array.isArray(creatives) && creatives.length) {
        html += renderTopFlopCreatives(creatives);
    }

    container.innerHTML = html;

    // Optional: Hero-Button mit globalem Connect-Button verbinden
    const heroBtn = document.getElementById("heroConnectButton");
    if (heroBtn) {
        const connectBtn = document.getElementById("connectMetaButton");
        if (connectBtn) {
            heroBtn.addEventListener("click", () => connectBtn.click());
        }
    }
}
