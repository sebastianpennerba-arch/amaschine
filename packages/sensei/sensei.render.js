// packages/sensei/sensei.render.js
// Rendert alle Sections im Output-Container

import {
    renderListSection,
    renderTestingSection,
    renderForecastSection,
    renderFunnelSection
} from "./sensei.sections.js";

export function renderSenseiOutput(data) {
    return `
        <div class="sensei-section">
            <h3>Zusammenfassung</h3>
            <p>${escapeHtml(data.summary)}</p>
        </div>

        ${renderListSection("Aktionen", data.actions)}
        ${renderListSection("Risiken", data.risks)}
        ${renderListSection("Chancen", data.opportunities)}
        ${renderTestingSection(data.testing)}
        ${renderForecastSection(data.forecast)}
        ${renderFunnelSection(data.funnel)}
    `;
}

function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
