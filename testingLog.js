// testingLog.js – Testing Log (P6 – Frontend-MVP)
// ------------------------------------------------
// Einfaches, clientseitiges Testprotokoll. Dient als UI-Grundlage
// für spätere persistente Umsetzung im Backend.

import { AppState } from "./state.js";
import { openModal } from "./uiCore.js";

function renderTestingLogTable() {
    const container = document.getElementById("testingLogTableContainer");
    if (!container) return;

    const entries = AppState.testingLog || [];

    if (!entries.length) {
        container.innerHTML = `
            <p style="font-size:14px; color:var(--text-secondary);">
                Noch keine Tests angelegt. Lege deinen ersten strukturierten Creative- oder Kampagnentest an.
            </p>
        `;
        return;
    }

    const rows = entries
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((e) => {
            const created = new Date(e.createdAt);
            return `
                <tr>
                    <td>${e.name}</td>
                    <td>${e.hypothesis || "-"}</td>
                    <td>${e.metric || "-"}</td>
                    <td>${e.status}</td>
                    <td>${created.toLocaleDateString("de-DE")} ${created.toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit"
                    })}</td>
                </tr>
            `;
        })
        .join("");

    container.innerHTML = `
        <table class="campaigns-table">
            <thead>
                <tr>
                    <th>Testname</th>
                    <th>Hypothese</th>
                    <th>Primäre Metrik</th>
                    <th>Status</th>
                    <th>Angelegt</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}

function openNewTestModal() {
    const html = `
        <form id="testingLogForm" style="display:flex; flex-direction:column; gap:12px;">
            <div>
                <label for="testName" style="display:block; font-size:13px; margin-bottom:4px;">Testname</label>
                <input id="testName" type="text" required
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </div>
            <div>
                <label for="testHypothesis" style="display:block; font-size:13px; margin-bottom:4px;">Hypothese</label>
                <textarea id="testHypothesis" rows="3"
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);"></textarea>
            </div>
            <div>
                <label for="testMetric" style="display:block; font-size:13px; margin-bottom:4px;">Primäre Metrik (z.B. ROAS, CPA, CTR)</label>
                <input id="testMetric" type="text"
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </div>
            <div>
                <label for="testStatus" style="display:block; font-size:13px; margin-bottom:4px;">Status</label>
                <select id="testStatus"
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);">
                    <option value="Geplant">Geplant</option>
                    <option value="Laufend">Laufend</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                </select>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
                <button type="button" id="cancelTestButton" class="action-button-secondary">Abbrechen</button>
                <button type="submit" class="action-button">Speichern</button>
            </div>
        </form>
    `;

    openModal("Neuen Test anlegen", html, {
        onOpen(overlay) {
            const form = overlay.querySelector("#testingLogForm");
            const cancelBtn = overlay.querySelector("#cancelTestButton");

            const close = () => {
                overlay.classList.remove("visible");
            };

            if (cancelBtn) {
                cancelBtn.addEventListener("click", (e) => {
                    e.preventDefault();
                    close();
                });
            }

            if (form) {
                form.addEventListener("submit", (e) => {
                    e.preventDefault();

                    const name = form.querySelector("#testName").value.trim();
                    const hypothesis = form.querySelector("#testHypothesis").value.trim();
                    const metric = form.querySelector("#testMetric").value.trim();
                    const status = form.querySelector("#testStatus").value;

                    if (!name) return;

                    AppState.testingLog.push({
                        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        name,
                        hypothesis,
                        metric,
                        status,
                        createdAt: new Date().toISOString()
                    });

                    renderTestingLogTable();
                    close();
                });
            }
        }
    });
}

/* -------------------------------------------------------
   Public API
---------------------------------------------------------*/

export function updateTestingLogView(connected) {
    const root = document.getElementById("testingLogContent");
    if (!root) return;

    root.innerHTML = `
        <div class="card">
            <div class="testing-log-header">
                <div>
                    <p class="testing-log-meta">
                        Dokumentiere deine wichtigsten Creative- und Kampagnentests an einem Ort.
                        Die aktuelle Version speichert Tests nur im Browser – später kann dies über
                        das Backend mandantenfähig persistiert werden.
                    </p>
                    ${
                        !connected
                            ? `<p class="testing-log-meta">
                                <strong>Hinweis:</strong> Auch ohne Meta-Verbindung kannst du Tests planen
                                und dokumentieren. Live-Ergebnisse kommen später aus den Kampagnen-Insights.
                            </p>`
                            : ""
                    }
                </div>
                <button id="btnNewTest" class="action-button">
                    <i class="fas fa-plus"></i> Neuen Test anlegen
                </button>
            </div>
            <div id="testingLogTableContainer"></div>
        </div>
    `;

    const btn = document.getElementById("btnNewTest");
    if (btn) {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openNewTestModal();
        });
    }

    renderTestingLogTable();
}
