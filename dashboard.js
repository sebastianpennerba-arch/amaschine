// dashboard.js – KPI-System + DEMO MODE PERFEKT INTEGRIERT + EVENT LISTENERS FIXED

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";
import {
    demoCampaigns,
    demoCreatives,
    demoAlerts,
    demoForecast
} from "./demoData.js";

/* -----------------------------------------------------------
    Formatter
----------------------------------------------------------- */

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fInt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

/* -----------------------------------------------------------
    DOM Helper
----------------------------------------------------------- */

function getEl(id) {
    return document.getElementById(id);
}

/* -----------------------------------------------------------
    🎯 DEMO MODE: BERECHNE METRIKEN AUS DEMO-DATEN
----------------------------------------------------------- */

function calculateDemoMetrics() {
    const totalSpend = demoCampaigns.reduce((sum, c) => sum + c.spend, 0);
    const totalRevenue = demoCampaigns.reduce((sum, c) => sum + c.revenue, 0);
    const totalImpressions = demoCampaigns.reduce(
        (sum, c) => sum + c.impressions,
        0
    );
    const totalClicks = demoCampaigns.reduce((sum, c) => sum + c.clicks, 0);

    const weightedRoas =
        totalSpend > 0
            ? demoCampaigns.reduce((sum, c) => sum + c.roas * c.spend, 0) /
              totalSpend
            : 0;

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const cpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

    return {
        spend: totalSpend,
        revenue: totalRevenue,
        roas: weightedRoas,
        ctr,
        cpm,
        impressions: totalImpressions,
        clicks: totalClicks,
        scopeLabel: "Demo Account – Alle Kampagnen",
        timeRangeLabel: "Letzte 30 Tage"
    };
}

/* -----------------------------------------------------------
    🎨 RENDER: KPI CARDS mit ALERTS
----------------------------------------------------------- */

function renderKpis(metrics) {
    const container = getEl("dashboardKpiContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML =
            "<p style='color:var(--text-secondary);font-size:13px;'>Keine Daten verfügbar.</p>";
        return;
    }

    const { spend, revenue, roas, ctr, cpm, impressions, clicks } = metrics;

    // ROAS Trend (simuliert für Demo)
    const roasTrend = roas > 4.5 ? "🟢 +0.4x vs. Vorwoche" : "🟡 Stabil";
    const roasClass = roas > 4.5 ? "success" : "warning";

    container.innerHTML = `
        <div class="kpi-grid">
            <div class="kpi-card">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${fEuro(spend)}</div>
                <div class="kpi-sub">Gesamtausgaben</div>
            </div>
            
            <div class="kpi-card ${roasClass}">
                <div class="kpi-label">ROAS</div>
                <div class="kpi-value">${roas.toFixed(2)}x</div>
                <div class="kpi-sub">${roasTrend}</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Revenue</div>
                <div class="kpi-value">${fEuro(revenue || spend * roas)}</div>
                <div class="kpi-sub">Umsatz generiert</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">CTR</div>
                <div class="kpi-value">${fPct(ctr)}</div>
                <div class="kpi-sub">Click-Through-Rate</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">CPM</div>
                <div class="kpi-value">${fEuro(cpm)}</div>
                <div class="kpi-sub">Cost per Mille</div>
            </div>
            
            <div class="kpi-card">
                <div class="kpi-label">Impressions</div>
                <div class="kpi-value">${fInt(impressions)}</div>
                <div class="kpi-sub">${fInt(clicks)} Klicks</div>
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    🚨 ALERTS SYSTEM (NEU – aus PDF)
----------------------------------------------------------- */

function renderAlerts() {
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
    🏆 TOP PERFORMERS (NEU – aus PDF)
----------------------------------------------------------- */

function renderTopPerformers() {
    const container = getEl("dashboardTopPerformersContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    let topCreatives = [];

    if (isDemo) {
        // Demo: Nimm die besten 3 Creatives
        topCreatives = [...demoCreatives]
            .sort((a, b) => b.roas - a.roas)
            .slice(0, 3);
    } else {
        // Live: Aus AppState (später implementieren)
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
    💀 BOTTOM PERFORMERS (NEU – aus PDF)
----------------------------------------------------------- */

function renderBottomPerformers() {
    const container = getEl("dashboardBottomPerformersContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    // Finde die schlechtesten Creatives
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

    // EVENT LISTENER für Pause-Buttons
    document.querySelectorAll(".btn-pause-creative").forEach((btn) => {
        btn.addEventListener("click", function () {
            const creativeId = this.getAttribute("data-creative-id");
            alert(`Creative ${creativeId} wird pausiert... (Demo-Modus – keine echte Aktion)`);
            this.disabled = true;
            this.textContent = "✓ Pausiert";
        });
    });
}

/* -----------------------------------------------------------
    🧠 SENSEI DAILY BRIEFING (NEU – aus PDF)
----------------------------------------------------------- */

function renderSenseiDailyBriefing() {
    const container = getEl("dashboardSenseiBriefingContainer");
    if (!container) return;

    const isDemo = !!AppState.settings?.demoMode;

    if (!isDemo) {
        container.innerHTML = "";
        return;
    }

    // Berechne dynamische Werte aus Demo-Daten
    const topCampaign = [...demoCampaigns].sort((a, b) => b.roas - a.roas)[0];
    const worstCampaign = [...demoCampaigns].sort((a, b) => a.roas - b.roas)[0];
    
    const budgetReallocation = Math.round(worstCampaign.spend * 0.3);
    const budgetIncrease = Math.round(topCampaign.spend * 0.5);
    const weeklySavings = Math.round(budgetReallocation * 7);
    
    // Creative Fatigue Detection
    const fatigueCreatives = demoCreatives.filter(c => c.performance === "Schwach");
    
    // Top Creator
    const topCreator = demoCreators[0]; // Mia

    const today = new Date().toLocaleDateString("de-DE", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    container.innerHTML = `
        <div class="sensei-briefing-section">
            <!-- Header -->
            <div class="sensei-header">
                <div class="sensei-icon">🧠</div>
                <div class="sensei-header-content">
                    <h3 class="sensei-title">SENSEI STRATEGY CENTER</h3>
                    <p class="sensei-subtitle">Dein AI-gestützter Action Plan für Heute</p>
                </div>
            </div>

            <!-- Greeting -->
            <div class="sensei-greeting">
                <h4 class="greeting-text">Guten Morgen! 👋</h4>
                <p class="greeting-date">${today}</p>
                <p class="greeting-message">Hier sind deine priorisierten Empfehlungen:</p>
            </div>

            <!-- URGENT SECTION -->
            <div class="sensei-section urgent-section">
                <h4 class="section-header urgent-header">
                    ⚠️ DRINGEND (nächste 2 Stunden):
                </h4>

                <!-- Priority 1: Budget Leak -->
                <div class="briefing-card priority-critical">
                    <div class="priority-badge badge-critical">
                        🔴 PRIORITÄT 1: BUDGET LEAK DETECTED
                    </div>
                    <div class="briefing-content">
                        <p class="briefing-description">
                            Kampagne "${worstCampaign.name}" verbrennt Geld ineffizient.
                        </p>
                        <div class="action-tree">
                            <div class="action-line">
                                <span class="tree-connector">├─</span>
                                <span>Reduziere Budget um 30% (-${fEuro(budgetReallocation)}/Tag)</span>
                            </div>
                            <div class="action-line">
                                <span class="tree-connector">└─</span>
                                <span>Erhöhe "${topCampaign.name}" um 50% (+${fEuro(budgetIncrease)}/Tag)</span>
                            </div>
                        </div>
                        <div class="impact-box">
                            <div class="impact-label">💰 Grund:</div>
                            <div class="impact-text">
                                ROAS Differenz von ${worstCampaign.roas.toFixed(1)}x → ${topCampaign.roas.toFixed(1)}x
                                <br>
                                <strong>Sparst ${fEuro(weeklySavings)}/Woche</strong>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-action btn-primary" data-action="budget-reallocation">
                                💰 Jetzt umsetzen
                            </button>
                            <button class="btn-action btn-secondary" data-action="budget-simulation">
                                📊 Simulation ansehen
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Priority 2: Scaling Opportunity -->
                <div class="briefing-card priority-success">
                    <div class="priority-badge badge-success">
                        🟢 SCALING OPPORTUNITY
                    </div>
                    <div class="briefing-content">
                        <p class="briefing-description">
                            "${topCampaign.name}" läuft außergewöhnlich gut.
                        </p>
                        <div class="action-tree">
                            <div class="action-line">
                                <span class="tree-connector">├─</span>
                                <span>Budget erhöhen um ${fEuro(budgetIncrease)}/Tag</span>
                            </div>
                            <div class="action-line">
                                <span class="tree-connector">└─</span>
                                <span>Erwarteter zusätzlicher Revenue: ${fEuro(budgetIncrease * topCampaign.roas)}/Tag</span>
                            </div>
                        </div>
                        <div class="impact-box">
                            <div class="impact-label">📈 Details:</div>
                            <div class="impact-text">
                                ROI: 580% | Risiko: <strong class="text-success">Niedrig</strong>
                                <br>
                                Aktueller ROAS: ${topCampaign.roas.toFixed(1)}x (stabil)
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-action btn-success" data-action="scale-campaign">
                                🚀 Budget erhöhen
                            </button>
                            <button class="btn-action btn-secondary" data-action="show-simulation">
                                🔮 Simulation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RECOMMENDED SECTION -->
            <div class="sensei-section recommended-section">
                <h4 class="section-header recommended-header">
                    📋 HEUTE EMPFOHLEN:
                </h4>

                <!-- Priority 3: Creative Refresh -->
                <div class="briefing-card priority-warning">
                    <div class="priority-badge badge-warning">
                        🎬 CREATIVE REFRESH NEEDED
                    </div>
                    <div class="briefing-content">
                        <p class="briefing-description">
                            ${fatigueCreatives.length} Creatives zeigen Ermüdungszeichen (>21 Tage laufend).
                        </p>
                        <div class="action-tree">
                            <div class="action-line">
                                <span class="tree-connector">├─</span>
                                <span>Durchschnittlicher CTR Drop: -38%</span>
                            </div>
                            <div class="action-line">
                                <span class="tree-connector">└─</span>
                                <span>Neue Varianten mit Top-Performer ${topCreator.name} erstellen</span>
                            </div>
                        </div>
                        <div class="impact-box">
                            <div class="impact-label">💡 Empfehlung:</div>
                            <div class="impact-text">
                                Pausiere alte Creatives und teste 3 neue Varianten.
                                <br>
                                Erwarteter CTR Uplift: <strong>+42%</strong>
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-action btn-warning" data-action="creative-refresh">
                                🎨 Neue Varianten erstellen
                            </button>
                            <button class="btn-action btn-secondary" data-action="show-fatigue-list">
                                📋 Liste zeigen
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Priority 4: Testing Opportunity -->
                <div class="briefing-card priority-info">
                    <div class="priority-badge badge-info">
                        🧪 TESTING OPPORTUNITY
                    </div>
                    <div class="briefing-content">
                        <p class="briefing-description">
                            Hook-Test kann ausgewertet werden - klarer Winner erkennbar.
                        </p>
                        <div class="action-tree">
                            <div class="action-line">
                                <span class="tree-connector">├─</span>
                                <span>Winner: "Problem/Solution" Hook (+35% ROAS)</span>
                            </div>
                            <div class="action-line">
                                <span class="tree-connector">└─</span>
                                <span>Nächster Test: Budget €150/Tag für 3 Tage</span>
                            </div>
                        </div>
                        <div class="impact-box">
                            <div class="impact-label">🎯 Erwartung:</div>
                            <div class="impact-text">
                                +0.8x ROAS Uplift basierend auf historischen Daten
                            </div>
                        </div>
                        <div class="action-buttons">
                            <button class="btn-action btn-info" data-action="conclude-test">
                                ✅ Test abschließen
                            </button>
                            <button class="btn-action btn-success" data-action="scale-winner">
                                🚀 Winner skalieren
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STRATEGIC INSIGHT -->
            <div class="sensei-strategic-insight">
                <div class="insight-header">
                    <div class="insight-icon">💡</div>
                    <h4 class="insight-title">STRATEGISCHER HINWEIS</h4>
                </div>
                <div class="insight-content">
                    <p class="insight-text">
                        Deine <strong>Top 3 Creatives</strong> generieren 68% des Revenues, 
                        aber erhalten nur 42% des Budgets. Eine Umschichtung würde die 
                        Performance signifikant steigern.
                    </p>
                    <div class="impact-metrics-grid">
                        <div class="impact-metric">
                            <div class="metric-icon">💰</div>
                            <div class="metric-value">+€2,100</div>
                            <div class="metric-label">Revenue/Tag</div>
                        </div>
                        <div class="impact-metric">
                            <div class="metric-icon">📈</div>
                            <div class="metric-value">+0.6x</div>
                            <div class="metric-label">ROAS in 7 Tagen</div>
                        </div>
                        <div class="impact-metric">
                            <div class="metric-icon">⚡</div>
                            <div class="metric-value">4 Tage</div>
                            <div class="metric-label">Bis Break-Even</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FOOTER ACTIONS -->
            <div class="sensei-footer">
                <button class="sensei-footer-btn" data-action="show-all-recommendations">
                    📊 Alle Empfehlungen
                </button>
                <button class="sensei-footer-btn" data-action="weekly-report">
                    📈 Weekly Report
                </button>
                <button class="sensei-footer-btn" data-action="strategy-call">
                    🎯 Strategy Call
                </button>
            </div>
        </div>
    `;

    // EVENT LISTENERS für alle Action-Buttons
    attachSenseiActionListeners();
}

/* -----------------------------------------------------------
    EVENT HANDLERS für Sensei Actions
----------------------------------------------------------- */

function attachSenseiActionListeners() {
    document.querySelectorAll(".btn-action").forEach((btn) => {
        btn.addEventListener("click", function () {
            const action = this.getAttribute("data-action");
            handleSenseiAction(action, this);
        });
    });

    document.querySelectorAll(".sensei-footer-btn").forEach((btn) => {
        btn.addEventListener("click", function () {
            const action = this.getAttribute("data-action");
            handleSenseiFooterAction(action);
        });
    });
}

function handleSenseiAction(action, buttonEl) {
    const actions = {
        "budget-reallocation": {
            title: "Budget-Umschichtung",
            message:
                "Budget wird umgeschichtet:\n• -30% auf Low-Performer\n• +50% auf Top-Performer\n\nErwartete Savings: €2,940/Woche"
        },
        "budget-simulation": {
            title: "Budget-Simulation",
            message:
                "Öffne Budget-Simulator...\n(Feature kommt in Phase 2)"
        },
        "scale-campaign": {
            title: "Kampagne skalieren",
            message:
                "Budget wird erhöht um 50%.\n\nErwarteter zusätzlicher Revenue:\n€3,944/Tag bei 5.8x ROAS"
        },
        "show-simulation": {
            title: "Skalierungs-Simulation",
            message: "Öffne Simulator...\n(Feature kommt in Phase 2)"
        },
        "creative-refresh": {
            title: "Creative Refresh",
            message:
                "Neue Creative-Varianten werden vorbereitet.\n\n• 3x neue Hooks mit Mia\n• Pause alte Creatives\n• Test-Budget: €300/Tag"
        },
        "show-fatigue-list": {
            title: "Creative Fatigue Liste",
            message: "Öffne Liste der ermüdeten Creatives...\n(Wird zur Creative Library navigieren)"
        },
        "conclude-test": {
            title: "Test abschließen",
            message:
                "Hook-Test wird abgeschlossen.\n\nWinner: Problem/Solution (+35% ROAS)\nLoser werden pausiert."
        },
        "scale-winner": {
            title: "Winner skalieren",
            message:
                "Winner-Creative wird skaliert.\n\nBudget: +€680/Tag\nErwartung: +€3,944 Revenue/Tag"
        }
    };

    const actionData = actions[action] || {
        title: "Aktion",
        message: "Aktion wird ausgeführt..."
    };

    alert(
        `🧠 SENSEI: ${actionData.title}\n\n${actionData.message}\n\n(Demo-Modus – keine echte API-Aktion)`
    );

    // Button State ändern
    buttonEl.disabled = true;
    buttonEl.classList.remove("btn-primary", "btn-secondary", "btn-success", "btn-warning", "btn-info");
    buttonEl.classList.add("btn-completed");
    buttonEl.innerHTML = "✓ Umgesetzt";
}

function handleSenseiFooterAction(action) {
    const actions = {
        "show-all-recommendations": "Alle Empfehlungen werden geladen...",
        "weekly-report": "Weekly Report wird generiert...",
        "strategy-call": "Strategy Call wird vorbereitet..."
    };

    alert(
        `${actions[action]}\n\n(Demo-Modus – Feature kommt in Phase 2-3)`
    );
}

    // EVENT LISTENERS für Action-Buttons
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
    📊 Chart-Rendering (simpler Placeholder)
----------------------------------------------------------- */

function renderPerformanceChart(metrics) {
    const container = getEl("dashboardChartContainer");
    if (!container) return;

    if (!metrics) {
        container.innerHTML =
            "<div class='chart-placeholder'>Keine Daten für Chart.</div>";
        return;
    }

    container.innerHTML = `
        <div class="chart-placeholder">
            <div style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;">
                Performance-Übersicht
            </div>
            <div style="font-size:12px;">
                Spend: ${fEuro(metrics.spend)} •
                ROAS: ${metrics.roas.toFixed(2)}x •
                CTR: ${fPct(metrics.ctr)} •
                CPM: ${fEuro(metrics.cpm)}
            </div>
        </div>
    `;
}

/* -----------------------------------------------------------
    Hero Creatives / Top-Kampagnen (ALT – aber behalten)
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

function renderTopCampaigns() {
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

    container.innerHTML = `
        <div class="hero-grid">
            ${top
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
                        <span class="hero-metric-value">${fEuro(
                            c.spend
                        )}</span>
                    </div>
                    <div class="hero-metric-row">
                        <span>CTR</span>
                        <span class="hero-metric-value">${fPct(
                            c.ctr
                        )}</span>
                    </div>
                </div>
            `
                )
                .join("")}
        </div>
    `;
}

/* -----------------------------------------------------------
    Insights Aggregation (nur Live-Daten)
----------------------------------------------------------- */

async function aggregateCampaigns(ids, preset) {
    let spend = 0,
        impressions = 0,
        clicks = 0,
        roasWeighted = 0,
        weight = 0;

    let minStart = null,
        maxStop = null;

    for (const id of ids) {
        try {
            const insights = await fetchMetaCampaignInsights(id, preset);
            if (!insights?.success) continue;

            const d = insights.data?.data?.[0];
            if (!d) continue;

            const s = Number(d.spend || 0);
            const imp = Number(d.impressions || 0);
            const clk = Number(d.clicks || 0);

            let r = 0;
            if (
                Array.isArray(d.website_purchase_roas) &&
                d.website_purchase_roas.length
            ) {
                r = Number(d.website_purchase_roas[0].value) || 0;
            }

            spend += s;
            impressions += imp;
            clicks += clk;

            if (s > 0 && r > 0) {
                roasWeighted += r * s;
                weight += s;
            }

            const ds = d.date_start;
            const de = d.date_stop;

            if (ds) {
                const dsDate = new Date(ds);
                if (!minStart || dsDate < minStart) minStart = dsDate;
            }
            if (de) {
                const deDate = new Date(de);
                if (!maxStop || deDate > maxStop) maxStop = deDate;
            }

            AppState.meta.insightsByCampaign[id] = {
                spend: s,
                impressions: imp,
                clicks: clk,
                roas: r,
                ctr: imp > 0 ? (clk / imp) * 100 : 0
            };
        } catch (e) {
            console.warn("Insight Aggregation Error:", id, e);
        }
    }

    if (!spend && !impressions && !clicks) return null;

    return {
        spend,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
        roas: weight > 0 ? roasWeighted / weight : 0,
        dateStart: minStart,
        dateStop: maxStop
    };
}

/* -----------------------------------------------------------
    Dashboard Summary Text
----------------------------------------------------------- */

function updateDashboardSummary(text) {
    const sumEl = getEl("dashboardMetaSummary");
    if (!sumEl) return;
    sumEl.textContent = text;
}

function timeRangeLabel(from, to) {
    if (!from || !to) return "Zeitraum unbekannt";
    const df = new Date(from);
    const dt = new Date(to);
    return `${df.toLocaleDateString("de-DE")} – ${dt.toLocaleDateString(
        "de-DE"
    )}`;
}

/* -----------------------------------------------------------
    Public API: updateDashboardView (HAUPTFUNKTION)
----------------------------------------------------------- */

export async function updateDashboardView(connected) {
    const demoMode = !!AppState.settings?.demoMode;

    // 🎯 DEMO-MODE: Zeige alle Demo-Features
    if (demoMode) {
        const metrics = calculateDemoMetrics();

        // Speichere im AppState für andere Module
        AppState.dashboardMetrics = metrics;

        // Render alle Komponenten
        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderAlerts();
        renderSenseiDailyBriefing();
        renderTopPerformers();
        renderBottomPerformers();
        renderTopCampaigns();

        updateDashboardSummary(
            `${metrics.scopeLabel} • Demo-Modus – alle Features aktiv 🚀`
        );

        AppState.dashboardLoaded = true;
        return;
    }

    // Kein Demo-Mode & nicht verbunden
    if (!connected) {
        renderKpis(null);
        renderPerformanceChart(null);
        renderTopCampaigns();
        updateDashboardSummary(
            "Nicht mit Meta verbunden. Verbinde dein Meta Ads Konto oben über den Button."
        );
        return;
    }

    // Live-Mode (wie vorher)
    try {
        const preset = AppState.timeRangePreset || "last_7d";
        const campaigns = AppState.meta?.campaigns || [];

        let metrics;

        if (!AppState.selectedCampaignId) {
            const ids = campaigns.map((c) => c.id);
            const agg = await aggregateCampaigns(ids, preset);

            if (!agg) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: `Alle Kampagnen (${campaigns.length})`,
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                metrics = {
                    spend: agg.spend,
                    roas: agg.roas,
                    ctr: agg.ctr,
                    cpm: agg.cpm,
                    impressions: agg.impressions,
                    clicks: agg.clicks,
                    scopeLabel: `Alle Kampagnen (${campaigns.length})`,
                    timeRangeLabel: timeRangeLabel(
                        agg.dateStart,
                        agg.dateStop
                    )
                };
            }
        } else {
            const ir = await fetchMetaCampaignInsights(
                AppState.selectedCampaignId,
                preset
            );
            const d = ir?.data?.data?.[0];

            if (!d) {
                metrics = {
                    spend: 0,
                    roas: 0,
                    ctr: 0,
                    cpm: 0,
                    impressions: 0,
                    clicks: 0,
                    scopeLabel: "Keine Insights",
                    timeRangeLabel: "Keine Daten"
                };
            } else {
                const s = Number(d.spend || 0);
                const imp = Number(d.impressions || 0);
                const clk = Number(d.clicks || 0);
                const ctr = imp > 0 ? (clk / imp) * 100 : 0;
                const cpm = imp > 0 ? (s / imp) * 1000 : 0;

                let roas = 0;
                if (
                    Array.isArray(d.website_purchase_roas) &&
                    d.website_purchase_roas.length
                ) {
                    roas = Number(d.website_purchase_roas[0].value || 0);
                }

                const camp = campaigns.find(
                    (c) => c.id === AppState.selectedCampaignId
                );

                metrics = {
                    spend: s,
                    roas,
                    ctr,
                    cpm,
                    impressions: imp,
                    clicks: clk,
                    scopeLabel: camp ? camp.name : "Kampagne",
                    timeRangeLabel: timeRangeLabel(
                        d.date_start,
                        d.date_stop
                    )
                };
            }
        }

        renderKpis(metrics);
        renderPerformanceChart(metrics);
        renderTopCampaigns();
        updateDashboardSummary(
            `${metrics.scopeLabel} • Zeitraum: ${metrics.timeRangeLabel}`
        );

        AppState.dashboardMetrics = metrics;
        AppState.dashboardLoaded = true;
    } catch (err) {
        console.error("Dashboard Error:", err);

        const m = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            impressions: 0,
            clicks: 0,
            scopeLabel: "Fehler",
            timeRangeLabel: "Fehler"
        };

        renderKpis(m);
        renderPerformanceChart(m);
        renderTopCampaigns();
        updateDashboardSummary(
            "Fehler beim Laden der Dashboard-Daten. Bitte Verbindung und Berechtigungen prüfen."
        );
    }
}
