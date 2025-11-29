// packages/sensei/budget.js
// Submodul 5 – Budgetempfehlungen & Verteilung

function computeBudgetSplit(brand) {
  if (!brand) {
    return [
      { bucket: "Prospecting", share: 0.6, comment: "Standard-Empfehlung ohne Daten." },
      { bucket: "Retargeting", share: 0.25, comment: "Standard-Empfehlung ohne Daten." },
      { bucket: "LTV / Bestandskunden", share: 0.15, comment: "Standard-Empfehlung ohne Daten." },
    ];
  }

  // Kleine Demo-Logik: je nach ROAS etwas andere Verteilung
  const roas = brand.roas30d || 0;

  if (roas >= 5) {
    return [
      {
        bucket: "Prospecting",
        share: 0.55,
        comment: "ROAS sehr stark – Prospecting hochfahren und neue Märkte testen.",
      },
      {
        bucket: "Retargeting",
        share: 0.25,
        comment: "Retargeting stabil halten, Frequenz kontrollieren.",
      },
      {
        bucket: "LTV / Bestandskunden",
        share: 0.20,
        comment: "Mehr Budget in LTV-Strecken (Bundles, Upsell, E-Mail Sync).",
      },
    ];
  }

  if (roas >= 3) {
    return [
      {
        bucket: "Prospecting",
        share: 0.5,
        comment: "Solider ROAS – Fokus auf stabile Skalierung der Top-Setups.",
      },
      {
        bucket: "Retargeting",
        share: 0.3,
        comment: "Retargeting leicht stärken, um Effizienz zu sichern.",
      },
      {
        bucket: "LTV / Bestandskunden",
        share: 0.2,
        comment: "LTV-Strecken parallel aufbauen.",
      },
    ];
  }

  return [
    {
      bucket: "Prospecting",
      share: 0.45,
      comment: "ROAS unter Druck – Testing & Struktur-Optimierung in Prospecting.",
    },
    {
      bucket: "Retargeting",
      share: 0.35,
      comment: "Retargeting nutzen, um ROAS kurzfristig zu stabilisieren.",
    },
    {
      bucket: "LTV / Bestandskunden",
      share: 0.2,
      comment: "LTV nicht ignorieren, aber Fokus auf kurzfristige Effizienz.",
    },
  ];
}

export function renderSenseiBudget(root, AppState, DemoData, ctx) {
  const brand = ctx.brand || null;
  const split = computeBudgetSplit(brand);

  const section = document.createElement("section");
  section.className = "sensei-card";

  const total = brand ? brand.spend30d || 0 : 0;

  section.innerHTML = `
    <div class="sensei-card-header">
      <div>
        <div class="sensei-card-title">Sensei · Budget Allocation</div>
        <div class="sensei-card-subtitle">
          Empfohlene Verteilung des Ad Spends für ${
            brand ? brand.name : "dein Konto"
          }.
        </div>
      </div>
      <span class="sensei-ai-pill">
        <i class="fa-solid fa-euro-sign"></i>
        Budget Plan
      </span>
    </div>

    <p style="margin-bottom:8px;">
      Basierend auf deinem aktuellen Spend von ${
        total
          ? total.toLocaleString("de-DE", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            })
          : "–"
      } (letzte 30 Tage) schlägt Sensei folgende Verteilung vor:
    </p>

    <div class="campaign-table-wrapper" style="margin-top:10px;">
      <table class="campaign-table">
        <thead>
          <tr>
            <th>Bucket</th>
            <th>Share</th>
            <th>Empfohlenes Budget</th>
            <th>Kommentar</th>
          </tr>
        </thead>
        <tbody>
          ${split
            .map((row) => {
              const euro =
                total > 0
                  ? (total * row.share).toLocaleString("de-DE", {
                      style: "currency",
                      currency: "EUR",
                      maximumFractionDigits: 0,
                    })
                  : "–";

              const pillClass =
                row.bucket === "Prospecting"
                  ? "active"
                  : row.bucket === "Retargeting"
                  ? "paused"
                  : "off";

              return `
                <tr>
                  <td>
                    <span class="campaign-status-pill ${pillClass}">
                      ${row.bucket}
                    </span>
                  </td>
                  <td>${(row.share * 100).toFixed(0)}%</td>
                  <td>${euro}</td>
                  <td>${row.comment}</td>
                </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <p style="margin-top:10px;font-size:0.82rem;color:#6b7280;">
      Später kann Sensei diese Verteilung automatisiert an deine echten Meta-Daten
      koppeln und z.&nbsp;B. bei starken ROAS-Verschiebungen automatische Vorschläge
      zum Rebalancing machen.
    </p>
  `;

  root.appendChild(section);
}
