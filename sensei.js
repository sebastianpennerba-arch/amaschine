// sensei.js – SignalOne.cloud – Sensei Strategy (Demo + Live-ready)

import { AppState } from "./state.js";
import { demoCampaigns, demoCreatives, demoAlerts, demoForecast } from "./demoData.js";

function fEuro(v) {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    }).format(v || 0);
}
function fPct(v) {
    return `${(Number(v || 0)).toFixed(2)}%`;
}
function fInt(v) {
    return (Number(v || 0)).toLocaleString("de-DE");
}

function getDemoMetrics() {
    if (!Array.isArray(demoCampaigns) || !demoCampaigns.length) {
        return {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            revenue: 0
        };
    }

    let spend = 0;
    let revenue = 0;
    let impressions = 0;
    let clicks = 0;

    demoCampaigns.forEach((c) => {
        spend += Number(c.spend || 0);
        revenue += Number(c.revenue || 0);
        impressions += Number(c.impressions || 0);
        clicks += Number(c.clicks || 0);
    });

    const roas = spend ? revenue / spend : 0;
    const ctr = impressions ? (clicks / impressions) * 100 : 0;
    const cpm = impressions ? (spend / impressions) * 1000 : 0;

    return { spend, revenue, impressions, clicks, roas, ctr, cpm };
}

function getLiveMetricsFallback() {
    // Falls Dashboard-Metriken bereits berechnet wurden, nutze sie:
    if (AppState.dashboardMetrics) return AppState.dashboardMetrics;

    // Minimaler Fallback, bis Live-Engine voll implementiert ist.
    return {
        spend: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        roas: 0,
        ctr: 0,
        cpm: 0
    };
}

export function updateSenseiView(connected) {
    const root = document.getElementById("senseiContent");
    if (!root) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!connected && !isDemo) {
        root.innerHTML = `
            <div class="card">
                <p style="font-size:14px; color:var(--text-secondary);">
                    Verbinde dein Meta Ads Konto oder aktiviere den Demo-Modus in den Settings, 
                    damit Sensei deine Daten analysieren kann.
                </p>
            </div>
        `;
        return;
    }

    const metrics = isDemo ? getDemoMetrics() : getLiveMetricsFallback();

    const topCampaign =
        isDemo && Array.isArray(demoCampaigns) && demoCampaigns.length
            ? [...demoCampaigns].sort((a, b) => b.roas - a.roas)[0]
            : null;

    const worstCampaign =
        isDemo && Array.isArray(demoCampaigns) && demoCampaigns.length
            ? [...demoCampaigns].sort((a, b) => a.roas - b.roas)[0]
            : null;

    const topCreativesDemo =
        isDemo && Array.isArray(demoCreatives)
            ? [...demoCreatives].sort((a, b) => b.roas - a.roas).slice(0, 3)
            : [];

    const riskAlerts = isDemo && Array.isArray(demoAlerts) ? demoAlerts.slice(0, 3) : [];
    const forecast = isDemo && demoForecast ? demoForecast : null;

    root.innerHTML = `
        <div class="sensei-briefing-section">
            <h3 class="section-title">🧠 Sensei Strategy Overview (${new Date().toLocaleDateString(
                "de-DE"
            )})</h3>
            
            <div class="briefing-card priority-1">
                <div class="priority-badge critical">Account Health</div>
                <div class="briefing-content">
                    <div class="impact-metrics">
                        <span>Spend: ${fEuro(metrics.spend)}</span>
                        <span>ROAS: ${metrics.roas.toFixed(2)}x</span>
                        <span>CTR: ${fPct(metrics.ctr)}</span>
                        <span>CPM: ${fEuro(metrics.cpm)}</span>
                    </div>
                </div>
            </div>

            <div class="briefing-card priority-2">
                <div class="priority-badge warning">Scaling Playbook</div>
                <div class="briefing-content">
                    ${
                        topCampaign && worstCampaign
                            ? `
                    <div class="action-line">
                        ├─ Reduziere "${worstCampaign.name}" um 30% (ca. ${fEuro(
                                  (worstCampaign.spend || 0) * 0.3
                              )}/Tag frei)
                    </div>
                    <div class="action-line">
                        └─ Erhöhe "${topCampaign.name}" um 50% (+${fEuro(
                                  (topCampaign.spend || 0) * 0.5
                              )}/Tag auf Gewinner)
                    </div>
                    <div class="action-reason">
                        <strong>Grund:</strong> ROAS-Spanne von ${worstCampaign.roas.toFixed(
                            1
                        )}x zu ${topCampaign.roas.toFixed(
                                  1
                              )}x – Budget-Umschichtung bringt direkten Uplift.
                    </div>
                    <button class="btn-primary sensei-action" data-action="apply-scaling">
                        Scaling-Empfehlung anwenden
                    </button>
                    `
                            : `<div class="action-line">Keine Kampagnendaten im Demo gefunden.</div>`
                    }
                </div>
            </div>

            <div class="briefing-card priority-3">
                <div class="priority-badge info">Creative Pipeline</div>
                <div class="briefing-content">
                    ${
                        topCreativesDemo.length
                            ? topCreativesDemo
                                  .map(
                                      (c, idx) => `
                            <div class="action-line">
                                ${idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} ${c.name}
                                – ${c.roas.toFixed(2)}x ROAS | ${fEuro(c.spend)} Spend | CTR ${fPct(
                                          c.ctr
                                      )}
                            </div>
                        `
                                  )
                                  .join("")
                            : `<div class="action-line">Noch keine Demo-Creatives definiert.</div>`
                    }
                    <div class="action-reason">
                        <strong>Testing-Idee:</strong> Dupliziere Top-Creatives in neue Hooks (Problem/Solution, Testimonial, UGC).
                    </div>
                    <button class="btn-secondary sensei-action" data-action="open-testing-log">
                        Test im Testing Log anlegen
                    </button>
                </div>
            </div>

            ${
                forecast
                    ? `
            <div class="impact-summary">
                <h4>📈 Forecast (Demo)</h4>
                <div class="impact-metrics">
                    <span>${forecast.roasUplift || "+0.6x ROAS möglich"}</span>
                    <span>${forecast.revenueUplift || "+€2.100 Revenue/Tag"}</span>
                </div>
            </div>
            `
                    : ""
            }
        </div>

        ${
            riskAlerts.length
                ? `
        <div class="card" style="margin-top:24px;">
            <h3 class="section-title">⚡ Risiko-Radar</h3>
            <div class="alerts-grid">
                ${riskAlerts
                    .map((a) => {
                        const icon =
                            a.severity === "Hoch"
                                ? "🔴"
                                : a.severity === "Mittel"
                                ? "🟡"
                                : "🟢";
                        const className =
                            a.severity === "Hoch"
                                ? "alert-critical"
                                : a.severity === "Mittel"
                                ? "alert-warning"
                                : "alert-success";
                        return `
                            <div class="alert-card ${className}">
                                <div class="alert-icon">${icon}</div>
                                <div class="alert-content">
                                    <div class="alert-title">${a.title}</div>
                                    <div class="alert-message">${a.message}</div>
                                    <div class="alert-meta">${a.timestamp}</div>
                                </div>
                            </div>
                        `;
                    })
                    .join("")}
            </div>
        </div>
        `
                : ""
        }
    `;

    // Simple Action-Handler (Demo, live-ready)
    root.querySelectorAll(".sensei-action").forEach((btn) => {
        btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            let msg = "";
            if (action === "apply-scaling") {
                msg =
                    "Scaling-Playbook wird angewendet...\n\n(Demo-Modus – im Live-Modus würde jetzt ein Meta-API-Call vorbereitet werden.)";
            } else if (action === "open-testing-log") {
                msg =
                    "Testing-Szenario wird im Testing Log vorbereitet...\n\n(Demo-Modus – im Live-Modus würdest du direkt in den Testing-View springen.)";
            } else {
                msg = "Sensei-Aktion wird vorbereitet (Demo).";
            }

            alert(msg);
            btn.disabled = true;
            btn.textContent = "✓ Geplant";
            btn.classList.remove("btn-primary", "btn-secondary");
            btn.classList.add("btn-success");
        });
    });
}
