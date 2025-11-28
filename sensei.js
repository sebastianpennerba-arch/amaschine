// sensei.js – Sensei v1 (Demo) + v2 (KI via API)

import { runSenseiDemoAnalysis } from "./sensei-demo-engine.js";
import { AppState } from "./state.js";

/**
 * URL deines Sensei-Backends.
 * Wenn du auf Render/Hetzner hostest:
 * - lokal:        http://localhost:3000/api/sensei/analyze
 * - Produktion:   https://signalone-backend.onrender.com/api/sensei/analyze
 */
const SENSEI_API_URL = "https://signalone-backend.onrender.com/api/sensei/analyze";

/* ----------------------------------------------------------
   PUBLIC ENTRYPOINT
----------------------------------------------------------- */

export function updateSenseiView(isConnected) {
    const runBtn = document.getElementById("runSenseiBtn");
    const output = document.getElementById("senseiOutput");
    const loading = document.getElementById("senseiLoading");

    if (!runBtn || !output || !loading) return;

    runBtn.onclick = async () => {
        // Reset / Loading
        loading.classList.remove("hidden");
        output.classList.add("hidden");
        output.innerHTML = "";

        try {
            let result;

            const isDemo = !!AppState.settings?.demoMode;

            if (isDemo) {
                // DEMO-MODUS → Regelbasierte Analyse
                await fakeDelay(800);
                result = runSenseiDemoAnalysis();
            } else {
                // LIVE-MODUS → Backend + KI
                result = await runSenseiLiveAnalysis();
            }

            loading.classList.add("hidden");
            output.classList.remove("hidden");
            output.innerHTML = renderSenseiOutput(result);
        } catch (err) {
            console.error("Sensei Fehler:", err);
            loading.classList.add("hidden");
            output.classList.remove("hidden");
            output.innerHTML = `
                <div class="sensei-section">
                    <h3>Fehler</h3>
                    <p style="color:var(--danger);">
                        Sensei konnte die Analyse nicht abschließen.
                        Bitte überprüfe die Verbindung oder versuche es später erneut.
                    </p>
                </div>
            `;
        }
    };
}

/* ----------------------------------------------------------
   LIVE-MODUS: Aufruf Backend / KI
----------------------------------------------------------- */

async function runSenseiLiveAnalysis() {
    const payload = buildSenseiPayloadFromAppState();

    const res = await fetch(SENSEI_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error("Sensei API Antwort war nicht OK: " + res.status);
    }

    const data = await res.json();

    // Erwartete Struktur:
    // {
    //   summary, actions, risks, opportunities, testing, forecast, funnel
    // }
    // Wenn das Backend was anderes liefert, fallbacken wir hart.
    return normalizeSenseiResult(data);
}

/**
 * Aggregiert die wichtigsten Daten aus dem AppState für die KI.
 * Diese Struktur wird an das Backend geschickt.
 */
function buildSenseiPayloadFromAppState() {
    const account = {
        id: AppState.selectedAccountId || "live_account",
        name:
            (AppState.meta?.adAccounts || []).find(
                (a) => a.id === AppState.selectedAccountId
            )?.name || "Live Meta Account",
        currency:
            (AppState.meta?.adAccounts || [])[0]?.currency || "EUR"
    };

    const dashboard = AppState.dashboardMetrics || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        roas: 0,
        scopeLabel: "Keine Auswahl",
        timeRangeLabel: "Unbekannt"
    };

    const campaigns = (AppState.meta?.campaigns || []).map((c) => {
        const insight = AppState.meta?.insightsByCampaign?.[c.id] || {};
        return {
            id: c.id,
            name: c.name,
            status: c.status || c.effective_status || "UNKNOWN",
            objective: c.objective || "UNKNOWN",
            spend: Number(insight.spend || 0),
            impressions: Number(insight.impressions || 0),
            clicks: Number(insight.clicks || 0),
            ctr: Number(insight.ctr || 0),
            roas: Number(insight.roas || 0)
        };
    });

    const creatives = (AppState.meta?.ads || []).map((ad) => {
        let thumb =
            ad.creative?.object_story_spec?.video_data?.thumbnail_url ||
            ad.creative?.object_story_spec?.link_data?.picture ||
            null;

        return {
            id: ad.id,
            name: ad.name || "Anzeige",
            campaign_id: ad.campaign_id || null,
            configured_status: ad.configured_status,
            effective_status: ad.effective_status,
            thumbnail: thumb
        };
    });

    // Platzhalter – später können wir echte Logs / Alerts / Tests aus DB ziehen
    const alerts = [];
    const testing = [];

    // Funnel ist im Live-Modus noch nicht implementiert → Backend kann aus KPIs ableiten
    const funnel = null;

    return {
        mode: "live",
        account,
        dashboard,
        campaigns,
        creatives,
        alerts,
        testing,
        funnel
    };
}

/**
 * Stellt sicher, dass das Ergebnis ein sinnvolles Objekt für das UI ist.
 */
function normalizeSenseiResult(raw) {
    if (!raw || typeof raw !== "object") {
        return {
            summary: "Sensei hat keine verwertbare Antwort geliefert.",
            actions: [],
            risks: [],
            opportunities: [],
            testing: [],
            forecast: null,
            funnel: null
        };
    }

    return {
        summary: raw.summary || "Sensei-Analyse abgeschlossen.",
        actions: Array.isArray(raw.actions) ? raw.actions : [],
        risks: Array.isArray(raw.risks) ? raw.risks : [],
        opportunities: Array.isArray(raw.opportunities)
            ? raw.opportunities
            : [],
        testing: Array.isArray(raw.testing) ? raw.testing : [],
        forecast: raw.forecast || null,
        funnel: raw.funnel || null
    };
}

/* ----------------------------------------------------------
   UI-Rendering
----------------------------------------------------------- */

function renderSenseiOutput(data) {
    return `
        <div class="sensei-section">
            <h3>Zusammenfassung</h3>
            <p>${escapeHtml(data.summary)}</p>
        </div>

        ${renderList("Aktionen", data.actions)}
        ${renderList("Risiken", data.risks)}
        ${renderList("Chancen", data.opportunities)}
        ${renderTesting(data.testing)}
        ${renderForecast(data.forecast)}
        ${renderFunnel(data.funnel)}
    `;
}

function renderList(title, items = []) {
    if (!items.length) return "";
    return `
        <div class="sensei-section">
            <h3>${title}</h3>
            <ul>
                ${items
                    .map(
                        (i) => `
                    <li>
                        <strong>${escapeHtml(i.title || "")}</strong><br>
                        <span>${escapeHtml(i.message || "")}</span><br>
                        ${
                            i.priority
                                ? `<small>Priorität: ${escapeHtml(
                                      i.priority
                                  )}</small>`
                                : ""
                        }
                    </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;
}

function renderTesting(tests = []) {
    if (!tests.length) return "";
    return `
        <div class="sensei-section">
            <h3>Testing</h3>
            <ul>
                ${tests
                    .map(
                        (t) => `
                <li>
                    <strong>${escapeHtml(t.title || "")}</strong><br>
                    ${
                        t.status
                            ? `<small>Status: ${escapeHtml(
                                  t.status
                              )}</small><br>`
                            : ""
                    }
                    <div>${escapeHtml(t.findings || "")}</div>
                    ${
                        t.next
                            ? `<em>Nächster Schritt: ${escapeHtml(
                                  t.next
                              )}</em>`
                            : ""
                    }
                </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;
}

function renderForecast(fc) {
    if (!fc) return "";
    return `
        <div class="sensei-section">
            <h3>Prognose (7 Tage)</h3>
            ${
                fc.roas != null
                    ? `<p><strong>ROAS:</strong> ${Number(
                          fc.roas
                      ).toFixed(2)}x</p>`
                    : ""
            }
            ${
                fc.revenue != null
                    ? `<p><strong>Umsatz:</strong> ${Number(
                          fc.revenue
                      ).toLocaleString("de-DE")} €</p>`
                    : ""
            }
            ${
                fc.spend != null
                    ? `<p><strong>Ausgaben:</strong> ${Number(
                          fc.spend
                      ).toLocaleString("de-DE")} €</p>`
                    : ""
            }
            ${
                fc.confidence != null
                    ? `<p><strong>Konfidenz:</strong> ${(
                          Number(fc.confidence) * 100
                      ).toFixed(1)}%</p>`
                    : ""
            }
            ${
                fc.message
                    ? `<small>${escapeHtml(fc.message)}</small>`
                    : ""
            }
        </div>
    `;
}

function renderFunnel(f) {
    if (!f) return "";
    const stages = ["tof", "mof", "bof"];

    return `
        <div class="sensei-section">
            <h3>Funnel-Analyse</h3>
            ${stages
                .filter((s) => f[s])
                .map((stage) => {
                    const data = f[stage];
                    const label =
                        stage === "tof"
                            ? "Top Funnel"
                            : stage === "mof"
                            ? "Middle Funnel"
                            : "Bottom Funnel";
                    return `
                    <div class="funnel-block">
                        <strong>${label}</strong><br>
                        ${
                            data.score != null
                                ? `Score: ${data.score}<br>`
                                : ""
                        }
                        ${
                            data.issues?.length
                                ? `Probleme: ${data.issues
                                      .map(escapeHtml)
                                      .join(", ")}<br>`
                                : ""
                        }
                        ${
                            data.opportunities?.length
                                ? `Chancen: ${data.opportunities
                                      .map(escapeHtml)
                                      .join(", ")}`
                                : ""
                        }
                    </div>`;
                })
                .join("")}
        </div>
    `;
}

/* ----------------------------------------------------------
   Helper
----------------------------------------------------------- */

function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function fakeDelay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
