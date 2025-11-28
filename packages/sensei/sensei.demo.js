// packages/sensei/sensei.demo.js
// Demo Engine ersetzt sensei-demo-engine.js (regelbasiert)

export function runSenseiDemo() {
    return {
        summary:
            "Im Demo-Modus nutzt Sensei heuristische Regeln basierend auf Beispielkampagnen.",
        actions: [
            {
                title: "Budget erhöhen",
                message:
                    "Deine stärksten Kampagnen haben Potenzial für +20% Skalierung.",
                priority: "hoch"
            }
        ],
        risks: [
            {
                title: "Instabile CTR",
                message:
                    "Einige Creatives verlieren stark an CTR — Refresh empfohlen."
            }
        ],
        opportunities: [
            {
                title: "UGC testen",
                message:
                    "UGC-Content in der BOF-Phase könnte Conversions effizienter machen."
            }
        ],
        testing: [
            {
                title: "Hook-A/B Test",
                findings:
                    "Hook B performt bei TOF besser, aber in BOF schlechter.",
                next: "Hook B in BOF pausieren."
            }
        ],
        forecast: {
            roas: 2.4,
            spend: 700,
            revenue: 1800,
            confidence: 0.79,
            message: "Prognose basiert auf Demo-Regeln."
        },
        funnel: {
            tof: { score: 7, issues: [], opportunities: ["Top Hook stärken"] },
            mof: {
                score: 4,
                issues: ["CTR flach"],
                opportunities: ["Optimieren Sie die Anzeigengestaltung."]
            },
            bof: {
                score: 6,
                issues: [],
                opportunities: ["UGC testen"]
            }
        }
    };
}
