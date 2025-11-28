// testingLog.js – FINAL VERSION (Testing Panel)

import { AppState } from "./state.js";
import { showToast, openModal } from "./uiCore.js";

/**
 * Entry Point (aufgerufen durch app.js)
 */
export function updateTestingLogView(hasData) {
    const box = document.getElementById("testingLogContainer");
    if (!box) return;

    if (!hasData) {
        box.innerHTML = `
            <div class="card hero-empty">
                <p>Keine Daten geladen. Aktiviere Demo Mode oder verbinde Meta Ads.</p>
            </div>
        `;
        return;
    }

    renderTestingLog();
}

/* ============================================================
   RENDER VIEW
============================================================ */

export function renderTestingLog() {
    const box = document.getElementById("testingLogContainer");
    if (!box) return;

    const log = loadTestingLog();
    const empty = log.length === 0;

    box.innerHTML = `
        <section class="card">
            <div class="testing-log-header">
                <div>
                    <h2 class="elite-title">Testing Log</h2>
                    <div class="testing-log-meta">
                        Experimente, Optimierungen & Strukturtests für deinen Account.
                    </div>
                </div>
                <button class="action-button" id="addTestingLog">
                    <i class="fas fa-plus"></i> Neuer Eintrag
                </button>
            </div>

            ${
                empty
                    ? `<div class="hero-empty">Noch keine Testing-Einträge vorhanden.</div>`
                    : `
                <table class="campaigns-table testing-log-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Kampagne</th>
                            <th>Hypothese</th>
                            <th>Maßnahme</th>
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

    document.getElementById("addTestingLog")?.addEventListener("click", openAddModal);
}

function renderLogRow(e) {
    return `
        <tr>
            <td>${escapeHtml(e.date)}</td>
            <td>${escapeHtml(e.campaign)}</td>
            <td>${escapeHtml(e.hypothesis)}</td>
            <td>${escapeHtml(e.action)}</td>
            <td>${escapeHtml(e.result)}</td>
        </tr>
    `;
}

/* ============================================================
   MODAL FÜR NEUEN EINTRAG
============================================================ */

function openAddModal() {
    openModal(`
        <div class="modal-title">Neuen Testing-Eintrag hinzufügen</div>

        <div class="modal-form">
            <label>Kampagne</label>
            <input id="tlog-campaign" placeholder="z.B. Scaling Store 1" />

            <label>Hypothese</label>
            <textarea id="tlog-hypothesis" placeholder="Welche Annahme wird getestet?"></textarea>

            <label>Maßnahme</label>
            <textarea id="tlog-action" placeholder="Was wurde geändert?"></textarea>

            <label>Ergebnis</label>
            <textarea id="tlog-result" placeholder="Wie ist der Effekt?"></textarea>
        </div>

        <button class="btn-primary" id="tlog-save">Speichern</button>
    `);

    document.getElementById("tlog-save")?.addEventListener("click", saveTestingLogEntry);
}

function saveTestingLogEntry() {
    const c = document.getElementById("tlog-campaign").value.trim();
    const h = document.getElementById("tlog-hypothesis").value.trim();
    const a = document.getElementById("tlog-action").value.trim();
    const r = document.getElementById("tlog-result").value.trim();

    if (!c || !h || !a || !r) {
        showToast("Bitte alle Felder ausfüllen.", "error");
        return;
    }

    const entry = {
        date: new Date().toLocaleDateString("de-DE"),
        campaign: c,
        hypothesis: h,
        action: a,
        result: r
    };

    const log = loadTestingLog();
    log.push(entry);
    saveTestingLog(log);

    showToast("Testing-Eintrag gespeichert.", "success");

    renderTestingLog();
}

/* ============================================================
   LOCAL STORAGE (persistente Logs)
============================================================ */

function loadTestingLog() {
    try {
        const raw = localStorage.getItem("signalone_testing_log");
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) return arr;
    } catch {}
    return AppState.testingLog || [];
}

function saveTestingLog(list) {
    AppState.testingLog = list;
    localStorage.setItem("signalone_testing_log", JSON.stringify(list));
}

/* ============================================================
   HELPERS
============================================================ */

function escapeHtml(str) {
    return String(str || "").replace(/[&<>"']/g, (s) =>
        ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[s])
    );
}
