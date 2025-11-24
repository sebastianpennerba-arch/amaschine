// sensei.js – Sensei Strategy (AI Layer über Live-Daten, Advanced)
// ---------------------------------------------------------------
// Nutzt AppState (Dashboard-Metriken, Kampagnen, Creatives) und
// gibt konkrete Empfehlungen zu:
// - Scaling
// - Risiko
// - Creative-Fatigue
//
// Neu in dieser Version:
// - Sensei bezieht sich explizit auf das aktuell gewählte Werbekonto / Kampagne
// - Kleine Scope-Auswahl (Auto / Account / Campaign)
// - Die 3 Buttons öffnen echte Detail-Overlays (Modals) statt nur Textplatzhalter
// - showToast Signature gefixt (msg, type)

import { AppState } from "./state.js";
import { showToast, openModal } from "./uiCore.js";

function formatEuro(value) {
    const num = Number(value || 0);
    return `€ ${num.toLocaleString("de-DE", { maximumFractionDigits: 0 })}`;
}

function formatPct(value) {
    const num = Number(value || 0);
    return `${num.toFixed(2)}%`;
}

function formatRoas(value) {
    const num = Number(value || 0);
    if (!num) return "0,00x";
    return `${num.toFixed(2)}x`;
}

function getSenseiScope() {
    const sel = document.getElementById("senseiScopeSelect");
    const val = (sel?.value || "auto").toLowerCase();
    if (val !== "account" && val !== "campaign" && val !== "auto") return "auto";
    return val;
}

function buildSenseiLayout() {
    const view = document.getElementById("senseiView");
    if (!view) return null;

    view.innerHTML = `
        <div style="
            display:flex;
            justify-content:space-between;
            align-items:flex-start;
            gap:12px;
            margin-bottom:12px;
        ">
            <h2 class="elite-title" style="margin:0;">
                Sensei Strategy (AI Layer)
            </h2>
            <div class="sensei-toolbar" style="
                display:flex;
                gap:8px;
                align-items:center;
                font-size:12px;
                color:var(--text-secondary);
            ">
                <label style="display:flex; align-items:center; gap:6px;">
                    Quelle:
                    <select id="senseiScopeSelect" style="
                        padding:4px 8px;
                        border-radius:999px;
                        border:1px solid var(--border);
                        background:var(--surface-elevated);
                        font-size:12px;
                    ">
                        <option value="auto">Auto (Werbekonto / Kampagne)</option>
                        <option value="account">Werbekonto</option>
                        <option value="campaign">Ausgewählte Kampagne</option>
                    </select>
                </label>
            </div>
        </div>

        <div class="card" id="senseiSummaryCard">
            <p id="senseiSummaryText" style="color: var(--text-secondary); font-size: 14px;">
                Sensei analysiert deine Meta-Daten und gibt dir konkrete Hinweise
                zu Skalierung, Risiken und Creative-Fatigue.
            </p>
        </div>

        <div class="strategy-grid" id="senseiRecommendationList">
            <!-- Dynamic Cards kommen hier rein -->
        </div>
    `;

    const summaryCard = document.getElementById("senseiSummaryCard");
    const recList = document.getElementById("senseiRecommendationList");
    return { summaryCard, recList };
}

function deriveInsightsFromState(scope) {
    const metrics = AppState.dashboardMetrics || {};
    const campaigns = Array.isArray(AppState.meta?.campaigns)
        ? AppState.meta.campaigns
        : [];
    const creatives = Array.isArray(AppState.meta?.creatives)
        ? AppState.meta.creatives
        : [];

    const spend = Number(metrics.spend || 0);
    const roas = Number(metrics.roas || 0);
    const ctr = Number(metrics.ctr || 0);
    const cpm = Number(metrics.cpm || 0);

    // Scope-Label: was genau analysiert Sensei?
    let scopeLabel = metrics.scopeLabel;
    if (!scopeLabel) {
        if (scope === "campaign" && AppState.selectedCampaignId) {
            scopeLabel = "Ausgewählte Kampagne";
        } else if (scope === "account" || AppState.selectedAccountId) {
            scopeLabel = "Werbekonto";
        } else {
            scopeLabel = "Gesamtübersicht";
        }
    }

    const timeRangeLabel =
        metrics.timeRangeLabel || AppState.timeRangePreset || "letzte 30 Tage";

    // Baseline für einfache „Ampel“-Logik
    const thresholds = {
        lowSpend: 50,
        highSpend: 2000,
        greatRoas: 3,
        okRoas: 2,
        lowRoas: 1.5,
        greatCtr: 3,
        lowCtr: 1,
        highCpm: 25
    };

    // 1) Scaling / Budget
    let scalingMood = "neutral";
    let scalingText = "Stabile Performance – Fokus auf konsistentes Testing.";
    let scalingAction = "Plane 1–2 neue Tests für diese Woche ein.";

    if (spend > thresholds.highSpend && roas >= thresholds.okRoas) {
        scalingMood = "bullish";
        scalingText =
            "Starke Performance bei relevantem Spend – hier kannst du skalieren.";
        scalingAction =
            "Erhöhe das Budget der Top-Kampagnen schrittweise (z.B. +15–20 %) und beobachte ROAS & CTR.";
    } else if (spend > thresholds.lowSpend && roas < thresholds.lowRoas) {
        scalingMood = "bearish";
        scalingText =
            "Du gibst bereits Budget aus, aber ROAS ist schwach – hier verlierst du Effizienz.";
        scalingAction =
            "Reduziere Budgets schwacher Kampagnen und verlagere Spend in die Top-Performer.";
    } else if (spend <= thresholds.lowSpend) {
        scalingMood = "testing";
        scalingText =
            "Wenig Spend – perfekter Zeitpunkt für strukturiertes Creative-Testing.";
        scalingAction =
            "Definiere 3–5 neue Creatives und teste klare Hooks/Angles, bevor du das Budget hochziehst.";
    }

    // 2) Risiko / Anomalien
    let riskLevel = "low";
    let riskTitle = "Alles im grünen Bereich.";
    let riskText =
        "Keine offensichtlichen Anomalien – Monitoring reicht aktuell aus.";
    let riskAction =
        "Behalte ROAS, CPM und CTR im Blick, aber es besteht kein akuter Handlungsbedarf.";

    if (cpm > thresholds.highCpm && ctr < thresholds.lowCtr) {
        riskLevel = "critical";
        riskTitle = "Hoher CPM und schwache CTR.";
        riskText =
            "Du zahlst viel für Impressionen, aber kaum jemand klickt – Anzeigen wirken nicht relevant.";
        riskAction =
            "Überarbeite Hooks, Thumbnails und Zielgruppen. Teste neue Angles oder breitere Zielgruppen.";
    } else if (roas < thresholds.lowRoas && spend > thresholds.lowSpend) {
        riskLevel = "medium";
        riskTitle = "ROAS unter deinem Sweet-Spot.";
        riskText =
            "Deine Kampagnen arbeiten aktuell nicht effizient genug. Hier entsteht Risiko für Profitabilität.";
        riskAction =
            "Identifiziere Bottom-20 % Kampagnen und pausiere/verändere diese zuerst.";
    }

    // 3) Creative-Fatigue (sehr grobe Heuristik)
    let fatigueLevel = "ok";
    let fatigueTitle = "Creative-Frequenz wirkt solide.";
    let fatigueText =
        "Du hast eine gesunde Anzahl an Creatives – kein direkter Fatigue-Alarm, aber weiter testen.";
    let fatigueAction =
        "Plane jede Woche 1–2 neue Varianten für deine Gewinner-Kampagnen ein.";

    if (creatives.length <= 5 && spend > thresholds.lowSpend) {
        fatigueLevel = "risk";
        fatigueTitle = "Zu wenige Creatives für dein aktuelles Budget.";
        fatigueText =
            "Mit wenigen Creatives steigt das Risiko, dass deine Zielgruppe „blind“ wird und CTR fällt.";
        fatigueAction =
            "Erstelle mindestens 3–5 neue Varianten (neue Hooks, Thumbnails, UGC-Angles) und teste diese.";
    } else if (ctr < thresholds.lowCtr && creatives.length > 0) {
        fatigueLevel = "medium";
        fatigueTitle = "CTR flacht ab – Hinweise auf Fatigue.";
        fatigueText =
            "CTR ist eher schwach – das kann auf Creative-Fatigue hinweisen, besonders bei hoher Frequency.";
        fatigueAction =
            "Analysiere deine Top-Creatives und erneuere Aufbau, Hook und visuelle Elemente.";
    }

    return {
        summary: {
            spend,
            roas,
            ctr,
            cpm,
            campaignsCount: campaigns.length,
            creativesCount: creatives.length,
            scopeLabel,
            timeRangeLabel
        },
        scaling: { mood: scalingMood, text: scalingText, action: scalingAction },
        risk: { level: riskLevel, title: riskTitle, text: riskText, action: riskAction },
        fatigue: {
            level: fatigueLevel,
            title: fatigueTitle,
            text: fatigueText,
            action: fatigueAction
        }
    };
}

function renderSenseiSummary(summary) {
    const el = document.getElementById("senseiSummaryText");
    if (!el) return;

    const {
        spend,
        roas,
        ctr,
        cpm,
        campaignsCount,
        creativesCount,
        scopeLabel,
        timeRangeLabel
    } = summary;

    if (!campaignsCount && !creativesCount) {
        el.innerHTML = `
            Noch keine Meta-Daten geladen.<br />
            <strong>Check:</strong> Verbinde dein Meta-Konto über den roten Stripe im Dashboard.
            Danach lädt Sensei automatisch deine Kampagnen & Creatives.
        `;
        return;
    }

    el.innerHTML = `
        Sensei arbeitet auf Basis deiner aktuellen Meta-Daten.<br />
        <br />
        <strong>Fokus:</strong> ${scopeLabel || "Gesamt"}<br />
        <strong>Zeitraum:</strong> ${timeRangeLabel}<br />
        <br />
        <strong>Überblick:</strong><br />
        • Kampagnen: <strong>${campaignsCount}</strong><br />
        • Creatives: <strong>${creativesCount}</strong><br />
        • Spend (Zeitraum): <strong>${formatEuro(spend)}</strong><br />
        • ROAS (gewichtet): <strong>${formatRoas(roas)}</strong><br />
        • CTR: <strong>${formatPct(ctr)}</strong> &nbsp; | &nbsp;
          CPM: <strong>${formatEuro(cpm)}</strong>
    `;
}

function renderRecommendationCards(recList, insights) {
    if (!recList) return;

    const { scaling, risk, fatigue } = insights;

    recList.innerHTML = `
        <div class="card strategy-card recommendation-card">
            <div>
                <h3 class="strategy-title">Scaling-Empfehlung</h3>
                <p style="color: var(--text-secondary); font-size:14px;">
                    ${scaling.text}
                </p>
            </div>
            <button class="action-button-secondary" data-sensei-action="scaling">
                Nächster Schritt anzeigen
            </button>
        </div>

        <div class="card strategy-card alert-card">
            <div>
                <h3 class="strategy-title">Risiko-Alert</h3>
                <p style="color: var(--text-secondary); font-size:14px;">
                    ${risk.title}<br />
                    <span style="font-size:13px;">${risk.text}</span>
                </p>
            </div>
            <button class="action-button-secondary" data-sensei-action="risk">
                Handlungsempfehlung
            </button>
        </div>

        <div class="card strategy-card warning-card">
            <div>
                <h3 class="strategy-title">Creative-Fatigue</h3>
                <p style="color: var(--text-secondary); font-size:14px;">
                    ${fatigue.title}<br />
                    <span style="font-size:13px;">${fatigue.text}</span>
                </p>
            </div>
            <button class="action-button-secondary" data-sensei-action="fatigue">
                Creative-Plan anzeigen
            </button>
        </div>
    `;

    recList
        .querySelectorAll("[data-sensei-action]")
        .forEach((btn) => {
            btn.addEventListener("click", () => {
                const type = btn.getAttribute("data-sensei-action");
                if (type === "scaling") {
                    openScalingModal(insights);
                } else if (type === "risk") {
                    openRiskModal(insights);
                } else if (type === "fatigue") {
                    openFatigueModal(insights);
                }
            });
        });

    const scopeSelect = document.getElementById("senseiScopeSelect");
    if (scopeSelect) {
        scopeSelect.addEventListener("change", () => {
            // Scope-Wechsel → UI neu berechnen
            updateSenseiView(AppState.metaConnected);
            showToast("Sensei hat die Analyse Quelle aktualisiert.", "info");
        });
    }
}

/* -------------------------------------------------------
   Detail-Overlays für die 3 Sensei-Aktionen
---------------------------------------------------------*/

function openScalingModal(insights) {
    const { summary, scaling } = insights;
    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-width:640px;">
            <p style="font-size:13px; color:var(--text-secondary); margin:0;">
                Basierend auf <strong>${summary.scopeLabel}</strong> im Zeitraum
                <strong>${summary.timeRangeLabel}</strong>:
            </p>

            <div class="metric-chip">
                <div class="metric-label">Spend</div>
                <div class="metric-value">${formatEuro(summary.spend)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">ROAS (gewichtet)</div>
                <div class="metric-value">${formatRoas(summary.roas)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">CTR</div>
                <div class="metric-value">${formatPct(summary.ctr)}</div>
            </div>

            <div style="font-size:13px; color:var(--text-secondary);">
                <strong>Scaling-Interpretation:</strong><br />
                ${scaling.text}
            </div>

            <div style="font-size:13px; color:var(--text-primary);">
                <strong>Konkreter nächster Schritt:</strong><br />
                ${scaling.action}
            </div>
        </div>
    `;
    openModal("Sensei – Scaling-Empfehlung", html);
}

function openRiskModal(insights) {
    const { summary, risk } = insights;
    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-width:640px;">
            <p style="font-size:13px; color:var(--text-secondary); margin:0;">
                Sensei prüft deine Risiken für <strong>${summary.scopeLabel}</strong>.
            </p>

            <div class="metric-chip">
                <div class="metric-label">CPM</div>
                <div class="metric-value">${formatEuro(summary.cpm)}</div>
            </div>
            <div class="metric-chip">
                <div class="metric-label">CTR</div>
                <div class="metric-value">${formatPct(summary.ctr)}</div>
            </div>

            <div style="font-size:13px; color:var(--text-primary);">
                <strong>Risiko-Einschätzung:</strong><br />
                ${risk.title}<br/>
                <span style="font-size:13px; color:var(--text-secondary);">
                    ${risk.text}
                </span>
            </div>

            <div style="font-size:13px; color:var(--text-primary);">
                <strong>Handlungsempfehlung:</strong><br />
                ${risk.action}
            </div>
        </div>
    `;
    openModal("Sensei – Risiko-Alert", html);
}

function openFatigueModal(insights) {
    const { summary, fatigue } = insights;
    const html = `
        <div style="display:flex; flex-direction:column; gap:16px; max-width:640px;">
            <p style="font-size:13px; color:var(--text-secondary); margin:0;">
                Creative-Fatigue Analyse auf Basis von <strong>${summary.creativesCount}</strong> Creatives
                und einem Spend von <strong>${formatEuro(summary.spend)}</strong>.
            </p>

            <div class="metric-chip">
                <div class="metric-label">Creatives im Account</div>
                <div class="metric-value">${summary.creativesCount}</div>
            </div>

            <div style="font-size:13px; color:var(--text-primary);">
                <strong>Bewertung:</strong><br />
                ${fatigue.title}<br/>
                <span style="font-size:13px; color:var(--text-secondary);">
                    ${fatigue.text}
                </span>
            </div>

            <div style="font-size:13px; color:var(--text-primary);">
                <strong>Sensei-Plan:</strong><br />
                ${fatigue.action}
            </div>
        </div>
    `;
    openModal("Sensei – Creative-Fatigue", html);
}

/* -------------------------------------------------------
   Public API – wird aus app.js aufgerufen
---------------------------------------------------------*/

export function updateSenseiView(connected) {
    const view = document.getElementById("senseiView");
    if (!view) return;

    const layout = buildSenseiLayout();
    if (!layout) return;

    const { summaryCard, recList } = layout;

    if (!connected || !AppState.metaConnected) {
        const summary = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            campaignsCount: 0,
            creativesCount: 0,
            scopeLabel: "Keine Verbindung",
            timeRangeLabel: "-"
        };
        renderSenseiSummary(summary);
        recList.innerHTML = `
            <div class="card strategy-card warning-card" style="grid-column:span 3; text-align:center;">
                <h3 class="strategy-title">Noch keine Verbindung zu Meta.</h3>
                <p style="color: var(--text-secondary); font-size:14px;">
                    Verbinde dein Meta-Konto, damit Sensei echte Empfehlungen auf Basis deiner
                    Kampagnen & Creatives geben kann.
                </p>
            </div>
        `;
        return;
    }

    const scope = getSenseiScope();
    const insights = deriveInsightsFromState(scope);
    renderSenseiSummary(insights.summary);
    renderRecommendationCards(recList, insights);
}
