// sensei-demo-engine.js – Demo-Modus Analyse Engine

export function runSenseiDemoAnalysis() {
  return {
    summary: "Demo-Analyse abgeschlossen. Basierend auf 47.892€ Spend in den letzten 30 Tagen.",
    
    actions: [
      {
        title: "Budget-Reallocation empfohlen",
        message: "Erhöhe Budget für 'UGC Scale Test' um 50% (+680€/Tag). Reduziere 'Brand Static' um 30%.",
        priority: "Hoch"
      },
      {
        title: "Creative Rotation notwendig",
        message: "8 Creatives zeigen Fatigue-Zeichen. Pausiere Ads mit <2x ROAS.",
        priority: "Mittel"
      },
      {
        title: "Testing Opportunity",
        message: "Starte Hook-Test 'Problem/Solution' vs 'Testimonial' mit 150€/Tag Budget.",
        priority: "Niedrig"
      }
    ],
    
    risks: [
      {
        title: "ROAS-Drop erkannt",
        message: "Kampagne 'Brand Awareness Static' zeigt -22% ROAS in den letzten 3 Tagen.",
        priority: "Kritisch"
      },
      {
        title: "CPM-Anstieg",
        message: "Durchschnittlicher CPM ist um 12% gestiegen. Prüfe Audience Overlap.",
        priority: "Mittel"
      }
    ],
    
    opportunities: [
      {
        title: "Scaling-Chance",
        message: "UGC Creator 'Mia' performt 42% über Durchschnitt. Produziere 3 weitere Varianten.",
        priority: "Hoch"
      },
      {
        title: "Hidden Gem Creative",
        message: "Creative 'Tom_Testimonial_v1' zeigt starkes ROAS bei niedrigem Spend. Erhöhe Budget.",
        priority: "Mittel"
      }
    ],
    
    testing: [
      {
        title: "Hook Battle Test #47",
        status: "Laufend (Tag 2/3)",
        findings: "Problem/Solution Hook führt mit +35% ROAS vs Testimonial.",
        next: "Skaliere Gewinner-Variante ab morgen."
      }
    ],
    
    forecast: {
      roas: 5.1,
      revenue: 57120,
      spend: 11200,
      confidence: 0.85,
      message: "Bei Umsetzung der Empfehlungen: +10.080€ zusätzlicher Revenue in 7 Tagen."
    },
    
    funnel: {
      tof: {
        score: 85,
        issues: ["CTR leicht unter Benchmark"],
        opportunities: ["Mehr Broad-Testing möglich"]
      },
      mof: {
        score: 72,
        issues: ["Video View Rate verbesserungswürdig"],
        opportunities: ["Retargeting-Creatives refreshen"]
      },
      bof: {
        score: 68,
        issues: ["Cart Abandonment 75%"],
        opportunities: ["Checkout-Prozess optimieren", "Trust Badges hinzufügen"]
      }
    }
  };
}
