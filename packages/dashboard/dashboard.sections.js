// packages/dashboard/dashboard.sections.js
// Einzelne Dashboard-Sektionen: Alerts, Sensei, Top/Bottom Performer, Hero-Kampagnen

import { AppState } from "../../state.js";
import { demoAlerts, demoCreatives, demoCampaigns } from "./dashboard.demo.js";

function getEl(id) {
    return document.getElementById(id);
}

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

/* -----------------------------------------------------------
    🚨 ALERTS SYSTEM
----------------------------------------------------------- */
export function renderAlerts() {
    const container = getEl("dashboardAlertsContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    const alerts = demoAlerts || [];

    if (!alerts.length) {
        container.innerHTML = "";
        return;
    }

    const alertsHtml = alerts
        .map((alert) => {
            const icon =
                alert.severity === "Hoch"
                    ? "🔴"
                    : alert.severity === "Mittel"
                    ? "🟡"
                    : "🟢";
            const className =
                alert.severity === "Hoch"
                    ? "alert-critical"
                    : alert.severity === "Mittel"
                    ? "alert-warning"
                    : "alert-success";

            return `
                <div class="alert-card ${className}">
                    <div class="alert-icon">${icon}</div>
                    <div class="alert-content">
                        <div class="alert-title">${alert.title}</div>
                        <div class="alert-message">${alert.message}</div>
                        <div class="alert-meta">${alert.timestamp}</div>
                    </div>
                </div>
            `;
        })
        .join("");

    container.innerHTML = `
        <div class="alerts-section">
            <h3 class="section-title">⚡ Aktive Alerts</h3>
            <div class="alerts-grid">
                ${alertsHtml}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    🏆 TOP PERFORMERS
----------------------------------------------------------- */
export function renderTopPerformers() {
    const container = getEl("dashboardTopPerformersContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    let topCreatives = [];

    if (isDemo) {
        topCreatives = [...demoCreatives]
            .sort((a, b) => b.roas - a.roas)
            .slice(0, 3);
    } else {
        // Live: später aus AppState.meta.ads / creatives ableitbar
        topCreatives = [];
    }

    if (!topCreatives.length) {
        container.innerHTML = "";
        return;
    }

    const html = topCreatives
        .map(
            (c, idx) => `
        <div class="top-performer-card">
            <div class="performer-rank">${["🥇", "🥈", "🥉"][idx]}</div>
            <div class="performer-thumbnail">
                <img src="${c.thumbnail}" alt="${c.name}" />
            </div>
            <div class="performer-content">
                <div class="performer-name">${c.name}</div>
                <div class="performer-metrics">
                    <span class="metric-badge roas">ROAS ${c.roas.toFixed(
                        2
                    )}x</span>
                    <span class="metric-badge spend">${fEuro(c.spend)}</span>
                    <span class="metric-badge ctr">CTR ${fPct(c.ctr)}</span>
                </div>
            </div>
        </div>
    `
        )
        .join("");

    container.innerHTML = `
        <div class="top-performers-section">
            <h3 class="section-title">🏆 Top Performers (letzte 7 Tage)</h3>
            <div class="top-performers-grid">
                ${html}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    💀 BOTTOM PERFORMERS
----------------------------------------------------------- */
export function renderBottomPerformers() {
    const container = getEl("dashboardBottomPerformersContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    const bottomCreatives = [...demoCreatives]
        .filter((c) => c.performance === "Schwach")
        .slice(0, 2);

    if (!bottomCreatives.length) {
        container.innerHTML = "";
        return;
    }

    const html = bottomCreatives
        .map(
            (c) => `
        <div class="bottom-performer-card">
            <div class="loser-badge">❌ LOSER</div>
            <div class="performer-name">${c.name}</div>
            <div class="performer-metrics danger">
                ROAS ${c.roas.toFixed(2)}x | ${fEuro(c.spend)} verschwendet | CTR ${fPct(
                c.ctr
            )}
            </div>
            <div class="sensei-recommendation">
                <strong>🧠 SENSEI EMPFEHLUNG:</strong><br>
                "Pausiere sofort. Ersetze durch Hook-Based UGC. Teste Variante mit Creator Mia (historisch +180% besser)."
            </div>
            <div class="action-buttons">
                <button class="btn-danger btn-pause-creative" data-creative-id="${
                    c.id
                }">
                    Jetzt pausieren
                </button>
            </div>
        </div>
    `
        )
        .join("");

    container.innerHTML = `
        <div class="bottom-performers-section">
            <h3 class="section-title danger">💀 Bottom Performers – Sofortiger Handlungsbedarf</h3>
            <div class="bottom-performers-grid">
                ${html}
            </div>
        </div>
    `;

    document.querySelectorAll(".btn-pause-creative").forEach((btn) => {
        btn.addEventListener("click", function () {
            const creativeId = this.getAttribute("data-creative-id");
            alert(
                `Creative ${creativeId} wird pausiert... (Demo-Modus – keine echte Aktion)`
            );
            this.disabled = true;
            this.textContent = "✓ Pausiert";
        });
    });
}

/* -----------------------------------------------------------
    🧠 SENSEI DAILY BRIEFING
----------------------------------------------------------- */
export function renderSenseiDailyBriefing() {
    const container = getEl("dashboardSenseiBriefingContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    const topCampaign = [...demoCampaigns].sort((a, b) => b.roas - a.roas)[0];
    const worstCampaign = [...demoCampaigns].sort((a, b) => a.roas - b.roas)[0];

    const budgetReallocation = Math.round(worstCampaign.spend * 0.3);
    const budgetIncrease = Math.round(topCampaign.spend * 0.5);

    container.innerHTML = `
        <div class="sensei-briefing-section">
            <h3 class="section-title">🧠 Sensei Strategie für Heute (${new Date().toLocaleDateString(
                "de-DE"
            )})</h3>
            
            <div class="briefing-card priority-1">
                <div class="priority-badge critical">PRIORITÄT 1: BUDGET REALLOCATION 🔴</div>
                <div class="briefing-content">
                    <div class="action-line">
                        ├─ Reduziere "${worstCampaign.name}" um 30% (-${fEuro(
        budgetReallocation
    )}/Tag)
                    </div>
                    <div class="action-line">
                        └─ Erhöhe "${topCampaign.name}" um 50% (+${fEuro(
        budgetIncrease
    )}/Tag)
                    </div>
                    <div class="action-reason">
                        <strong>Grund:</strong> ROAS Differenz von ${worstCampaign.roas.toFixed(
                            1
                        )}x → ${topCampaign.roas.toFixed(
        1
    )}x. Sparst ca. ${fEuro(budgetReallocation * 7)}/Woche
                    </div>
                    <button class="btn-primary btn-apply-action" data-action="budget-reallocation">
                        Jetzt umsetzen
                    </button>
                </div>
            </div>

            <div class="briefing-card priority-2">
                <div class="priority-badge warning">PRIORITÄT 2: CREATIVE ROTATION ⚡</div>
                <div class="briefing-content">
                    <div class="action-line">
                        ├─ Pausiere: Creatives mit ROAS <2x
                    </div>
                    <div class="action-line">
                        └─ Aktiviere: 3 neue Varianten von Creator "Mia"
                    </div>
                    <div class="action-reason">
                        <strong>Grund:</strong> Mia's Creatives performen 42% über Durchschnitt
                    </div>
                    <button class="btn-primary btn-apply-action" data-action="creative-rotation">
                        Rotation starten
                    </button>
                </div>
            </div>

            <div class="briefing-card priority-3">
                <div class="priority-badge info">PRIORITÄT 3: TESTING OPPORTUNITY 🎯</div>
                <div class="briefing-content">
                    <div class="action-line">
                        ├─ Hook Test starten: "Problem/Solution" vs "Testimonial"
                    </div>
                    <div class="action-line">
                        └─ Budget: €150/Tag für 3 Tage
                    </div>
                    <div class="action-reason">
                        <strong>Erwartung:</strong> +0.8x ROAS Uplift basierend auf Historie
                    </div>
                    <button class="btn-secondary btn-apply-action" data-action="testing">
                        Test erstellen
                    </button>
                </div>
            </div>

            <div class="impact-summary">
                <h4>💰 Geschätzter Impact:</h4>
                <div class="impact-metrics">
                    <span>+€2,100 Revenue/Tag</span>
                    <span>+0.6x ROAS in 7 Tagen</span>
                </div>
            </div>
        </div>
    `;

    document.querySelectorAll(".btn-apply-action").forEach((btn) => {
        btn.addEventListener("click", function () {
            const action = this.getAttribute("data-action");
            handleSenseiAction(action, this);
        });
    });
}

function handleSenseiAction(action, buttonEl) {
    const actions = {
        "budget-reallocation": "Budget-Umschichtung wird angewendet...",
        "creative-rotation": "Creative Rotation wird gestartet...",
        testing: "Test wird erstellt..."
    };

    alert(
        `${actions[action]}\n\n(Demo-Modus – keine echte API-Aktion. Im Live-Modus würde hier die Meta API aufgerufen.)`
    );

    buttonEl.disabled = true;
    buttonEl.textContent = "✓ Umgesetzt";
    buttonEl.classList.remove("btn-primary", "btn-secondary");
    buttonEl.classList.add("btn-success");
}

/* -----------------------------------------------------------
    HERO TOP-KAMPAGNEN
----------------------------------------------------------- */
function getTopCampaigns() {
    const isDemo = !!AppState.settings?.demoMode;

    if (isDemo) {
        return [...demoCampaigns].sort((a, b) => b.roas - a.roas).slice(0, 3);
    }

    const map = AppState.meta?.insightsByCampaign || {};
    const campaigns = AppState.meta?.campaigns || [];

    const list = Object.entries(map).map(([id, m]) => {
        const c = campaigns.find((x) => x.id === id);
        return {
            id,
            name: c?.name || "Kampagne",
            spend: Number(m.spend || 0),
            roas: Number(m.roas || 0),
            ctr: Number(m.ctr || 0),
            impressions: Number(m.impressions || 0),
            clicks: Number(m.clicks || 0)
        };
    });

    list.sort((a, b) => b.roas - a.roas);
    return list.slice(0, 3);
}

export function renderTopCampaigns() {
    const container = getEl("dashboardHeroCreativesContainer");
    if (!container) return;

    const top = getTopCampaigns();

    if (!top.length) {
        container.innerHTML = `
            <div class="hero-empty">
                <p style="font-size:13px;color:var(--text-secondary);">
                    Noch keine Top-Kampagnen verfügbar.
                </p>
            </div>
        `;
        return;
    }

    const html = top
        .map(
            (c) => `
                <div class="hero-card">
                    <div class="hero-title">${c.name}</div>
                    <div class="hero-metric-row">
                        <span>ROAS</span>
                        <span class="hero-metric-value">${c.roas.toFixed(
                            2
                        )}x</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>Spend</span>
                        <span class="hero-metric-value">${fEuro(c.spend)}</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>CTR</span>
                        <span class="hero-metric-value">${fPct(c.ctr)}</span>
                    </div>
                </div>
            `
        )
        .join("");

    container.innerHTML = `
        <div class="hero-grid">
            ${html}
        </div>
    `;
}
