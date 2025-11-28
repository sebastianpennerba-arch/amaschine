// testingLog.js
import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

/**
 * Testing Log – simplestes Log der vorgenommenen Optimierungen
 * (Demo + zukünftig echte Events).
 */
export function renderTestingLog() {
    const container = document.getElementById("testingLogContent");
    if (!container) return;

    const log = AppState.testingLog || [];

    container.innerHTML = `
        <section class="card">
            <div class="testing-log-header">
                <div>
                    <h2 class="elite-title">Testing Log</h2>
                    <div class="testing-log-meta">
                        Experimente & Optimierungen im Account.
                    </div>
                </div>
                <button class="action-button-secondary" id="addTestLogEntry">
                    <i class="ri-add-line"></i> Demo-Entry
                </button>
            </div>

            ${
                log.length === 0
                    ? `<div class="hero-empty">Noch keine Einträge vorhanden.</div>`
                    : `
                <table class="testing-log-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Betroffene Kampagne</th>
                            <th>Maßnahme</th>
                            <th>Hypothese</th>
                            <th>Ergebnis</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${log.map(renderLogRow).join("")}
                    </tbody>
                </table>
                `
            }
        </section>
    `;

    const addBtn = document.getElementById("addTestLogEntry");
    if (addBtn) {
        addBtn.addEventListener("click", () => {
            addDemoEntry();
            renderTestingLog();
            showToast("Demo-Testing-Eintrag wurde hinzugefügt.", "success");
        });
    }
}

function renderLogRow(entry) {
    return `
        <tr>
            <td>${entry.date || "-"}</td>
            <td>${entry.campaign || "-"}</td>
            <td>${entry.action || "-"}</td>
            <td>${entry.hypothesis || "-"}</td>
            <td>${entry.result || "-"}</td>
        </tr>
    `;
}

function addDemoEntry() {
    const now = new Date();
    const dateStr = now.toLocaleDateString("de-DE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    });

    AppState.testingLog.push({
        date: dateStr,
        campaign: "Demo Kampagne – Scaling Store",
        action: "Budget +20% erhöht",
        hypothesis: "ROAS bleibt stabil zwischen 3–4x",
        result: "In Auswertung (Demo)"
    });
}
