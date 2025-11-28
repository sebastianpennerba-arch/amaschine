// testingLog.js – SignalOne Premium Testing Log (P6 Final)
// --------------------------------------------------------
// Neu: 
// – Meta-Integration (Account, Campaign, Creative Auswahl)
// – Sensei-Hooks (Hypothesen, Erfolgsmetriken, Empfehlungen)
// – Erweiterte Tabelle mit Status & Ergebnissen
// – Schöne Modale & strukturierter Workflow
// – Persistenz im Browser, spätere API-ready Struktur

import { AppState } from "./state.js";
import { openModal, showToast } from "./uiCore.js";

/* -------------------------------------------------------
   Helper Functions
---------------------------------------------------------*/

function formatDate(d) {
    if (!d) return "-";
    const dt = new Date(d);
    return dt.toLocaleDateString("de-DE") + " " +
           dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function getCampaignList() {
    return AppState.meta?.campaigns || [];
}

function getCreativeList() {
    // robust: creatives kann in AppState.meta.ads oder .creatives stehen
    const meta = AppState.meta || {};
    if (Array.isArray(meta.creatives)) return meta.creatives;
    if (Array.isArray(meta.creatives?.data)) return meta.creatives.data;
    if (Array.isArray(meta.ads)) return meta.ads;
    if (Array.isArray(meta.ads?.data)) return meta.ads.data;
    return [];
}

/* -------------------------------------------------------
   UI Rendering – Testing Log Table
---------------------------------------------------------*/

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
        .map((e) => `
            <tr data-test-id="${e.id}" class="testing-row">
                <td><strong>${e.name}</strong></td>
                <td>${e.scope || "-"}</td>
                <td>${e.refName || "-"}</td>
                <td>${e.hypothesis || "-"}</td>
                <td>${e.metric || "-"}</td>
                <td>${e.status}</td>
                <td>${e.resultValue || "-"}</td>
                <td>${formatDate(e.createdAt)}</td>
                <td>
                    <button class="action-button-secondary" data-action="view">Details</button>
                </td>
            </tr>
        `)
        .join("");

    container.innerHTML = `
        <table class="campaigns-table">
            <thead>
                <tr>
                    <th>Testname</th>
                    <th>Scope</th>
                    <th>Referenz</th>
                    <th>Hypothese</th>
                    <th>Primäre Metrik</th>
                    <th>Status</th>
                    <th>Ergebnis</th>
                    <th>Angelegt</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    `;

    container.querySelectorAll("[data-action='view']").forEach((btn) => {
        btn.addEventListener("click", () => {
            const row = btn.closest("tr");
            const id = row.getAttribute("data-test-id");
            const entry = entries.find((x) => x.id === id);
            if (entry) openTestDetailsModal(entry);
        });
    });
}

/* -------------------------------------------------------
   Modal: New Test
---------------------------------------------------------*/

function openNewTestModal() {
    const campaigns = getCampaignList();
    const creatives = getCreativeList();
    const isConnected = AppState.metaConnected;

    const campaignOptions = campaigns
        .map((c) => `<option value="${c.id}">${c.name}</option>`)
        .join("");
    const creativeOptions = creatives
        .map((c) => `<option value="${c.id}">${c.name || c.id}</option>`)
        .join("");

    const html = `
        <form id="testingLogForm" style="display:flex; flex-direction:column; gap:16px;">
            
            <!-- Testname -->
            <div>
                <label style="font-size:13px;">Testname</label>
                <input id="testName" type="text" required
                    style="width:100%; padding:8px; border-radius:6px; border:1px solid var(--border);" />
            </div>
            
            <!-- Scope -->
            <div>
                <label style="font-size:13px;">Scope / Bezug</label>
                <select id="testScope" style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);">
                    <option value="account">Werbekonto</option>
                    ${
                        isConnected
                            ? `
                    <option value="campaign">Kampagne</option>
                    <option value="creative">Creative</option>`
                            : ""
                    }
                </select>
            </div>

            <!-- Campaign Reference (hidden until selected) -->
            <div id="testCampaignContainer" style="display:none;">
                <label style="font-size:13px;">Kampagne wählen</label>
                <select id="testCampaignRef" 
                    style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);">
                    ${campaignOptions}
                </select>
            </div>

            <!-- Creative Reference (hidden until selected) -->
            <div id="testCreativeContainer" style="display:none;">
                <label style="font-size:13px;">Creative wählen</label>
                <select id="testCreativeRef"
                    style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);">
                    ${creativeOptions}
                </select>
            </div>

            <!-- Hypothese -->
            <div>
                <label style="font-size:13px;">Hypothese</label>
                <textarea id="testHypothesis" rows="3"
                    placeholder="z.B. 'Ein stärkerer Hook erhöht die CTR um 20 %'"
                    style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);"></textarea>
            </div>

            <!-- Sensei Recommendations -->
            <button id="senseiSuggestBtn" type="button" class="action-button-secondary" style="width: fit-content;">
                Sensei Vorschlag holen
            </button>

            <!-- Metric -->
            <div>
                <label style="font-size:13px;">Primäre Metrik</label>
                <input id="testMetric" type="text" placeholder="z.B. ROAS, CTR, CPC"
                    style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);" />
            </div>

            <!-- Status -->
            <div>
                <label style="font-size:13px;">Status</label>
                <select id="testStatus" style="padding:8px; width:100%; border-radius:6px; border:1px solid var(--border);">
                    <option value="Geplant">Geplant</option>
                    <option value="Live">Live</option>
                    <option value="Auswertung">Auswertung</option>
                    <option value="Abgeschlossen">Abgeschlossen</option>
                </select>
            </div>

            <!-- Submit -->
            <div style="display:flex; justify-content:flex-end; gap:12px;">
                <button type="button" class="action-button-secondary" id="cancelTestButton">Abbrechen</button>
                <button type="submit" class="action-button">Speichern</button>
            </div>
        </form>
    `;

    openModal("Neuen Test anlegen", html, {
        onOpen(modal) {
            const scopeEl = modal.querySelector("#testScope");
            const campWrap = modal.querySelector("#testCampaignContainer");
            const creativeWrap = modal.querySelector("#testCreativeContainer");

            if (scopeEl) {
                scopeEl.addEventListener("change", () => {
                    const v = scopeEl.value;
                    campWrap.style.display = v === "campaign" ? "block" : "none";
                    creativeWrap.style.display = v === "creative" ? "block" : "none";
                });
            }

            modal.querySelector("#senseiSuggestBtn")?.addEventListener("click", () => {
                const suggestion = getSenseiSuggestion();
                modal.querySelector("#testHypothesis").value = suggestion.hypothesis;
                modal.querySelector("#testMetric").value = suggestion.metric;
                showToast("Sensei Vorschlag angewendet", "success");
            });

            modal.querySelector("#cancelTestButton")?.addEventListener("click", () => {
                modal.classList.remove("visible");
            });

            modal.querySelector("#testingLogForm")?.addEventListener("submit", (e) => {
                e.preventDefault();
                saveNewTest(modal);
            });
        }
    });
}

/* -------------------------------------------------------
   Sensei: Simple Suggestions Based on Metrics
---------------------------------------------------------*/

function getSenseiSuggestion() {
    const m = AppState.dashboardMetrics || {};
    const roas = Number(m.roas || 0);
    const ctr = Number(m.ctr || 0);

    if (roas < 1.5) {
        return {
            hypothesis: "Ein stärkerer Hook oder ein anderer Angle kann ROAS verbessern.",
            metric: "ROAS"
        };
    }

    if (ctr < 1) {
        return {
            hypothesis: "Ein neues Thumbnail oder UGC-Angle kann CTR steigern.",
            metric: "CTR"
        };
    }

    return {
        hypothesis: "Neue Creative-Varianten testen, um Winner schneller zu identifizieren.",
        metric: "CTR"
    };
}

/* -------------------------------------------------------
   Save New Test
---------------------------------------------------------*/

function saveNewTest(modal) {
    const f = modal.querySelector("#testingLogForm");
    const scope = f.querySelector("#testScope").value;

    let refId = null;
    let refName = null;

    if (scope === "campaign") {
        refId = f.querySelector("#testCampaignRef").value;
        const camp = getCampaignList().find((c) => c.id === refId);
        refName = camp?.name || refId;
    } else if (scope === "creative") {
        refId = f.querySelector("#testCreativeRef").value;
        const cr = getCreativeList().find((c) => c.id === refId);
        refName = cr?.name || refId;
    }

    const entry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: f.querySelector("#testName").value.trim(),
        scope,
        refId,
        refName,
        hypothesis: f.querySelector("#testHypothesis").value.trim(),
        metric: f.querySelector("#testMetric").value.trim(),
        status: f.querySelector("#testStatus").value,
        createdAt: new Date().toISOString(),
        resultValue: null,
        resultNote: null
    };

    AppState.testingLog.push(entry);

    renderTestingLogTable();
    modal.classList.remove("visible");
    showToast("Test gespeichert", "success");
}

/* -------------------------------------------------------
   Modal: Test Details
---------------------------------------------------------*/

function openTestDetailsModal(entry) {
    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-width:620px;">
            
            <h3 style="margin:0;">${entry.name}</h3>
            <p style="margin:0; color:var(--text-secondary);">Scope: <strong>${entry.scope}</strong></p>
            <p style="margin:0; color:var(--text-secondary);">Referenz: <strong>${entry.refName}</strong></p>

            <div class="metric-chip">
                <div class="metric-label">Hypothese</div>
                <div class="metric-value">${entry.hypothesis || "-"}</div>
            </div>

            <div class="metric-chip">
                <div class="metric-label">Primäre Metrik</div>
                <div class="metric-value">${entry.metric || "-"}</div>
            </div>

            <div style="display:flex; gap:8px; margin-top:8px;">
                <label style="flex:1;">
                    Ergebniswert
                    <input id="testResultValue" type="text" value="${
                        entry.resultValue || ""
                    }" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border);" />
                </label>
                <label style="flex:2;">
                    Ergebnis-Notiz
                    <textarea id="testResultNote" rows="2" style="width:100%; padding:6px; border-radius:6px; border:1px solid var(--border);">${
                        entry.resultNote || ""
                    }</textarea>
                </label>
            </div>

            <label>
                Status:
                <select id="testResultStatus" style="padding:6px; border-radius:6px; border:1px solid var(--border);">
                    <option value="Geplant" ${
                        entry.status === "Geplant" ? "selected" : ""
                    }>Geplant</option>
                    <option value="Live" ${
                        entry.status === "Live" ? "selected" : ""
                    }>Live</option>
                    <option value="Auswertung" ${
                        entry.status === "Auswertung" ? "selected" : ""
                    }>Auswertung</option>
                    <option value="Abgeschlossen" ${
                        entry.status === "Abgeschlossen" ? "selected" : ""
                    }>Abgeschlossen</option>
                </select>
            </label>

            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:12px;">
                <button class="action-button-secondary" data-action="close">Schließen</button>
                <button class="action-button" data-action="save">Speichern</button>
            </div>

        </div>
    `;

    openModal("Testdetails", html, {
        onOpen(modal) {
            modal.querySelector("[data-action='close']")?.addEventListener("click", () => {
                modal.classList.remove("visible");
            });

            modal.querySelector("[data-action='save']")?.addEventListener("click", () => {
                entry.resultValue = modal.querySelector("#testResultValue").value.trim();
                entry.resultNote = modal.querySelector("#testResultNote").value.trim();
                entry.status = modal.querySelector("#testResultStatus").value;

                renderTestingLogTable();
                modal.classList.remove("visible");
                showToast("Test aktualisiert", "success");
            });
        }
    });
}

/* -------------------------------------------------------
   PUBLIC API
---------------------------------------------------------*/

export function updateTestingLogView(connected) {
    const root = document.getElementById("testingLogContent");
    if (!root) return;

    root.innerHTML = `
        <div class="card">
            <div class="testing-log-header">
                <div>
                    <p class="testing-log-meta">
                        Dokumentiere Creative- & Kampagnentests strukturiert an einem Ort.
                        Aktuell werden Tests lokal gespeichert – spätere Backend-Persistenz ist vorbereitet.
                    </p>
                    ${
                        !connected
                            ? `
                        <p class="testing-log-meta"><strong>Meta nicht verbunden.</strong> 
                        Du kannst trotzdem Tests anlegen – später können sie automatisch mit Kampagnen-Insights verknüpft werden.
                        </p>`
                            : ""
                    }
                </div>

                <button id="btnNewTest" class="action-button">
                    <i class="fas fa-plus"></i> Neuer Test
                </button>
            </div>

            <div id="testingLogTableContainer"></div>
        </div>
    `;

    document.getElementById("btnNewTest")?.addEventListener("click", () => openNewTestModal());

    renderTestingLogTable();
}
