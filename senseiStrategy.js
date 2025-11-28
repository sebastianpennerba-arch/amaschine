// senseiStrategy.js – SignalOne.cloud
// Premium Strategy Center (DatAds-Killer Feature)
// ---------------------------------------------------------

import { AppState } from "./state.js";
import { runSenseiDemoAnalysis } from "./sensei-demo-engine.js";
import { runSenseiLiveAnalysis } from "./sensei.js"; // nutzt bereits Backend
import { showToast } from "./uiCore.js";

/* ============================================================
   PUBLIC ENTRYPOINT
============================================================ */

export async function updateSenseiStrategyView() {
    const container = document.getElementById("senseiStrategyContainer");
    if (!container) return;

    container.innerHTML = `
        <p style="text-align:center;color:var(--text-secondary);margin-top:20px;">
            Sensei analysiert deine Daten ...
        </p>
    `;

    let analysis = null;

    try {
        const isDemo = !!AppState.settings?.demoMode;

        if (isDemo) {
            await delay(400);
            analysis = runSenseiDemoAnalysis();
        } else {
            analysis = await runSenseiLiveAnalysis();
        }

        AppState.sensei = analysis;
    } catch (err) {
        console.error("Sensei Strategy Error:", err);
        container.innerHTML = `
            <p style="color:var(--danger);">Fehler beim Laden der Sensei-Strategien.</p>
        `;
        return;
    }

    container.innerHTML = renderStrategyCenter(analysis);
}

/* ============================================================
   BASE RENDER LAYOUT
============================================================ */

function renderStrategyCenter(data) {
    return `
        ${renderSummary(data)}
        ${renderPriorityActions(data)}
        ${renderRisks(data)}
        ${renderOpportunities(data)}
        ${renderTesting(data)}
        ${renderForecast(data)}
        ${renderFunnel(data)}
    `;
}

/* ============================================================
   SUMMARY
============================================================ */

function renderSummary(d) {
    return `
        <div class="sensei-card summary">
            <h3>🧠 Sensei Tageszusammenfassung</h3>
            <p>${d.summary}</p>
        </div>
    `;
}

/* ============================================================
   PRIORITY ACTIONS
============================================================ */

function renderPriorityActions(d) {
    if (!d.actions?.length) return "";

    const html = d.actions
        .map((a) => {
            const cls =
                a.priority === "Hoch"
                    ? "critical"
                    : a.priority === "Mittel"
                    ? "warning"
                    : "neutral";

            return `
            <div class="sensei-card ${cls}">
                <div class="sensei-card-badge">${badge(a.priority)}</div>
                <div class="sensei-card-title">${a.title}</div>
                <div class="sensei-card-body">${a.message}</div>
            </div>
            `;
        })
        .join("");

    return `
        <h3 class="sensei-section-title">🔥 Prioritäten für heute</h3>
        ${html}
    `;
}

/* ============================================================
   RISKS
============================================================ */

function renderRisks(d) {
    if (!d.risks?.length) return "";

    const html = d.risks
        .map(
            (r) => `
        <div class="sensei-card danger">
            <div class="sensei-card-badge">RISIKO</div>
            <div class="sensei-card-title">${r.title}</div>
            <div class="sensei-card-body">${r.message}</div>
        </div>
    `
        )
        .join("");

    return `
        <h3 class="sensei-section-title">⚠️ Kritische Risiken</h3>
        ${html}
    `;
}

/* ============================================================
   OPPORTUNITIES
============================================================ */

function renderOpportunities(d) {
    if (!d.opportunities?.length) return "";

    const html = d.opportunities
        .map(
            (o) => `
        <div class="sensei-card opportunity">
            <div class="sensei-card-badge">Chance</div>
            <div class="sensei-card-title">${o.title}</div>
            <div class="sensei-card-body">${o.message}</div>
        </div>
    `
        )
        .join("");

    return `
        <h3 class="sensei-section-title">🟢 Chancen</h3>
        ${html}
    `;
}

/* ============================================================
   TESTING
============================================================ */

function renderTesting(d) {
    if (!d.testing?.length) return "";

    const html = d.testing
        .map(
            (t) => `
        <div class="sensei-card testing">
            <div class="sensei-card-badge">Test</div>
            <div class="sensei-card-title">${t.title}</div>
            <div class="sensei-card-body">
                Status: <strong>${t.status}</strong><br><br>
                ${t.findings}<br><br>
                <em>${t.next}</em>
            </div>
        </div>
    `
        )
        .join("");

    return `
        <h3 class="sensei-section-title">🧪 Tests & Entscheidungen</h3>
        ${html}
    `;
}

/* ============================================================
   FORECAST
============================================================ */

function renderForecast(d) {
    if (!d.forecast) return "";

    return `
        <h3 class="sensei-section-title">📈 Forecast</h3>
        <div class="sensei-card forecast">
            <div class="sensei-card-title">Nächste 7 Tage</div>
            <div class="sensei-card-body">
                Erwarteter ROAS: <strong>${d.forecast.roas.toFixed(2)}x</strong><br>
                Umsatz-Prognose: <strong>€${format(d.forecast.revenue)}</strong><br>
                Geplanter Spend: <strong>€${format(d.forecast.spend)}</strong><br>
                Sicherheit: ${(d.forecast.confidence * 100).toFixed(0)}%<br><br>
                ${d.forecast.message}
            </div>
        </div>
    `;
}

/* ============================================================
   FUNNEL
============================================================ */

function renderFunnel(d) {
    if (!d.funnel) return "";

    return `
        <h3 class="sensei-section-title">🔻 Funnel Health</h3>
        <div class="sensei-card funnel">
            <div><strong>TOF:</strong> ${d.funnel.tof.score} – ${d.funnel.tof.issues.join(", ")}</div>
            <div><strong>MOF:</strong> ${d.funnel.mof.score} – ${d.funnel.mof.issues.join(", ")}</div>
            <div><strong>BOF:</strong> ${d.funnel.bof.score} – ${d.funnel.bof.issues.join(", ")}</div>
        </div>
    `;
}

/* ============================================================
   HELPERS
============================================================ */

function badge(priority) {
    if (priority === "Hoch") return "🔴 PRIORITÄT 1";
    if (priority === "Mittel") return "🟡 PRIORITÄT 2";
    return "🟢 Empfehlung";
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function format(num) {
    return Number(num || 0).toLocaleString("de-DE");
}
