// sensei.js – Sensei Strategy Layer (P4 – Regelbasiertes MVP)
// -----------------------------------------------------------
// Nutzt vorhandene Kampagnen-Metriken, um einfache, aber
// handlungsorientierte Empfehlungen abzuleiten.

import { AppState } from "./state.js";
import { fetchMetaCampaignInsights } from "./metaApi.js";

const nf = new Intl.NumberFormat("de-DE");

const fEuro = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "€ 0" : `€ ${nf.format(n)}`;
};

const fPct = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0%" : `${n.toFixed(2)}%`;
};

const fRoas = (v) => {
    const n = Number(v);
    return !isFinite(n) || n === 0 ? "0x" : `${n.toFixed(2)}x`;
};

function getCampaignsWithMetrics() {
    const campaigns = AppState.meta.campaigns || [];
    return campaigns.map((c) => {
        const m = c.metrics || {};
        const roas =
            m.purchase_roas ||
            (Array.isArray(m.website_purchase_roas) && m.website_purchase_roas.length
                ? Number(m.website_purchase_roas[0].value || 0)
                : m.roas || 0);
        return {
            ...c,
            _metrics: {
                spend: Number(m.spend || 0),
                impressions: Number(m.impressions || 0),
                clicks: Number(m.clicks || 0),
                ctr: Number(m.ctr || 0),
                cpm: Number(m.cpm || 0),
                roas: Number(roas || 0)
            }
        };
    });
}

async function ensureCampaignMetrics() {
    const campaigns = AppState.meta.campaigns || [];
    if (!campaigns.length) return;

    const needsFetch = campaigns.some((c) => !c.metrics);
    if (!needsFetch) return;

    const preset = AppState.timeRangePreset || "last_30d";

    for (const camp of campaigns) {
        try {
            const ir = await fetchMetaCampaignInsights(camp.id, preset);
            const d = ir?.success ? ir.data?.data?.[0] || {} : {};
            camp.metrics = d;
        } catch (e) {
            console.warn("Sensei metrics fetch error", camp.id, e);
        }
    }
}

function buildSenseiCard(title, description, items, type = "neutral") {
    const typeClass =
        type === "positive"
            ? "recommendation-card"
            : type === "negative"
            ? "warning-card"
            : "alert-card";

    return `
        <div class="card strategy-card ${typeClass}">
            <div>
                <h3 class="strategy-title">${title}</h3>
                <p style="color:var(--text-secondary); font-size:13px; margin-bottom:10px;">
                    ${description}
                </p>
                <ul style="margin:0; padding-left:18px; font-size:13px; color:var(--text-secondary); display:flex; flex-direction:column; gap:4px;">
                    ${
                        items.length
                            ? items
                                  .map(
                                      (t) =>
                                          `<li>${t}</li>`
                                  )
                                  .join("")
                            : '<li>Keine spezifischen Empfehlungen für den aktuellen Zeitraum.</li>'
                    }
                </ul>
            </div>
        </div>
    `;
}

/* -------------------------------------------------------
   Public API
---------------------------------------------------------*/

export async function updateSenseiView(connected) {
    const root = document.getElementById("senseiContent");
    if (!root) return;

    if (!connected) {
        root.innerHTML = `
            <div class="card">
                <p style="font-size:14px; color:var(--text-secondary);">
                    Verbinde dein Meta Werbekonto, damit Sensei echte Daten analysieren kann.
                    Anschließend siehst du hier tägliche Empfehlungen für Scaling, Risiko-Alerts
                    und Creative-Optimierung.
                </p>
            </div>
        `;
        return;
    }

    if (!AppState.meta.campaigns.length) {
        root.innerHTML = `
            <div class="card">
                <p style="font-size:14px; color:var(--text-secondary);">
                    Für das ausgewählte Werbekonto wurden keine Kampagnen gefunden.
                    Lege Kampagnen im Meta Ads Manager an oder wechsle das Werbekonto in der Topbar.
                </p>
            </div>
        `;
        return;
    }

    // Metriken sicherstellen (einmalig)
    await ensureCampaignMetrics();

    const withMetrics = getCampaignsWithMetrics();
    if (!withMetrics.length) {
        root.innerHTML = `
            <div class="card">
                <p style="font-size:14px; color:var(--text-secondary);">
                    Es liegen noch keine Insights für deine Kampagnen vor.
                    Prüfe den ausgewählten Zeitraum oder versuche es später erneut.
                </p>
            </div>
        `;
        return;
    }

    // einfache Regel-Engine
    const topByImpact = [...withMetrics]
        .filter((c) => c._metrics.spend > 0 && c._metrics.roas > 0)
        .sort((a, b) => b._metrics.spend * b._metrics.roas - a._metrics.spend * a._metrics.roas)
        .slice(0, 3);

    const underperformers = [...withMetrics]
        .filter(
            (c) =>
                c._metrics.spend > 0 &&
                c._metrics.roas > 0 &&
                c._metrics.roas < 2
        )
        .sort((a, b) => a._metrics.roas - b._metrics.roas)
        .slice(0, 5);

    const lowSpend = [...withMetrics]
        .filter(
            (c) =>
                c._metrics.spend > 0 &&
                c._metrics.spend < 50 &&
                c._metrics.roas >= 2
        )
        .slice(0, 5);

    const scalingItems = topByImpact.map((c) => {
        return `<strong>${c.name || c.id}</strong> – ROAS ${fRoas(
            c._metrics.roas
        )}, Spend ${fEuro(c._metrics.spend)}. Empfehlung: 
        Budget behutsam um 20–30% erhöhen und Creative Library prüfen, welche Ads diese Kampagne treiben.`;
    });

    const riskItems = underperformers.map((c) => {
        return `<strong>${c.name || c.id}</strong> – ROAS ${fRoas(
            c._metrics.roas
        )}, Spend ${fEuro(c._metrics.spend)}. Empfehlung:
        Creatives überprüfen, Platzierungen testen und ggf. Kampagne pausieren, falls Trend anhält.`;
    });

    const testingItems = lowSpend.map((c) => {
        return `<strong>${c.name || c.id}</strong> – solider ROAS bei niedrigem Spend (${fEuro(
            c._metrics.spend
        )}). Empfehlung: in den nächsten Tests höher priorisieren und zusätzliche Variationen planen.`;
    });

    root.innerHTML = `
        <div class="card" style="margin-bottom:24px;">
            <p style="font-size:14px; color:var(--text-secondary);">
                Sensei analysiert deine Kampagnen basierend auf den letzten Insights und
                schlägt dir handlungsorientierte Schritte vor. 
                Die aktuelle Version ist regelbasiert; ein KI-Layer kann später nahtlos
                an diese Struktur andocken.
            </p>
        </div>

        <div class="strategy-grid">
            ${buildSenseiCard(
                "Scaling-Empfehlungen",
                "Nutze dein Budget dort, wo ROAS und Spend bereits stark sind.",
                scalingItems,
                "positive"
            )}
            ${buildSenseiCard(
                "Risiko-Alerts & Underperformer",
                "Kampagnen mit niedrigem ROAS und relevantem Spend – hier droht Budgetverschwendung.",
                riskItems,
                "negative"
            )}
            ${buildSenseiCard(
                "Testing-Potenzial",
                "Kampagnen mit gutem ROAS aber niedrigem Spend: ideale Kandidaten für strukturierte Tests.",
                testingItems,
                "neutral"
            )}
        </div>
    `;
}
