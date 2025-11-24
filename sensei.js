// sensei.js – Sensei Strategy (AI Layer über Live-Daten)
// ------------------------------------------------------
// Liest NUR aus AppState (Meta-Daten, Dashboard-Metrics) und
// baut daraus einfache, aber echte Empfehlungen.
// Kein extra API-Call, kein Mock, alles basiert auf den
// bereits geladenen Kampagnen / Creatives / KPIs.

import { AppState } from "./state.js";
import { showToast } from "./uiCore.js";

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

function buildSenseiLayout() {
    const view = document.getElementById("senseiView");
    if (!view) return null;

    // Wir überschreiben bewusst den Platzhalter-Content,
    // behalten aber die Titel- und Card-Struktur bei.
    view.innerHTML = `
        <h2 class="elite-title">Sensei Strategy (AI Layer)</h2>

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

function deriveInsightsFromState() {
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

    // Baseline für einfache „Ampel“-Logik
    const thresholds = {
        lowSpend: 50,
        highSpend: 2000,
        greatRoas: 3,
        okRoas: 2,
        lowRoas: 1.5,
        greatCtr: 3,
        lowCtr: 1,
        highCpm: 25,
    };

    // 1) Scaling / Budget
    let scalingMood = "neutral";
    let scalingText = "Stabile Performance – Fokus auf konsistentes Testing.";
    let scalingAction = "Plane 1–2 neue Tests für diese Woche ein.";

    if (spend > thresholds.highSpend && roas >= thresholds.okRoas) {
        scalingMood = "bullish";
        scalingText = "Starke Performance bei relevantem Spend – hier kannst du skalieren.";
        scalingAction =
            "Erhöhe das Budget der Top-Kampagnen schrittweise (z.B. +15–20 %) und beobachte ROAS & CTR.";
    } else if (spend > thresholds.lowSpend && roas < thresholds.lowRoas) {
        scalingMood = "bearish";
        scalingText = "Du gibst bereits Budget aus, aber ROAS ist schwach.";
        scalingAction =
            "Reduziere Budgets schwacher Kampagnen und verlagere Spend in die Top-Performer.";
    } else if (spend <= thresholds.lowSpend) {
        scalingMood = "testing";
        scalingText = "Wenig Spend – perfekter Zeitpunkt für strukturiertes Creative-Testing.";
        scalingAction =
            "Definiere 3–5 neue Creatives und teste klare Hooks/Angles, bevor du das Budget hochziehst.";
    }

    // 2) Risiko / Anomalien
    let riskLevel = "low";
    let riskTitle = "Alles im grünen Bereich.";
    let riskText = "Keine offensichtlichen Anomalien – Monitoring reicht aktuell aus.";
    let riskAction = "Behalte ROAS, CPM und CTR im Blick, aber es besteht kein akuter Handlungsbedarf.";

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
    // Wir schauen nur, ob genügend Creatives existieren und ob CTR ok ist.
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
        },
        scaling: { mood: scalingMood, text: scalingText, action: scalingAction },
        risk: { level: riskLevel, title: riskTitle, text: riskText, action: riskAction },
        fatigue: {
            level: fatigueLevel,
            title: fatigueTitle,
            text: fatigueText,
            action: fatigueAction,
        },
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
                let msg = "";

                if (type === "scaling") {
                    msg = insights.scaling.action;
                } else if (type === "risk") {
                    msg = insights.risk.action;
                } else if (type === "fatigue") {
                    msg = insights.fatigue.action;
                }

                showToast("info", msg || "Sensei-Hinweis noch in Arbeit.");
            });
        });
}

// Public API – wird aus app.js aufgerufen
// --------------------------------------
export function updateSenseiView(connected) {
    const view = document.getElementById("senseiView");
    if (!view) return;

    const { summaryCard, recList } = buildSenseiLayout() || {};
    if (!summaryCard || !recList) return;

    if (!connected || !AppState.metaConnected) {
        // Wenn Meta nicht verbunden ist, bleiben wir soft.
        const summary = {
            spend: 0,
            roas: 0,
            ctr: 0,
            cpm: 0,
            campaignsCount: 0,
            creativesCount: 0,
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

    const insights = deriveInsightsFromState();
    renderSenseiSummary(insights.summary);
    renderRecommendationCards(recList, insights);
}
