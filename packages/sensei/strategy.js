// packages/sensei/strategy.js
// Submodul 2 â€“ Strategische Empfehlungen (Struktur & Funnel)

export function renderSenseiStrategy(root, AppState, DemoData, ctx) {
  const brand = ctx.brand || null;
  const campaign = ctx.campaign || null;

  const section = document.createElement("section");
  section.className = "sensei-card";

  section.innerHTML = `
    <div class="sensei-card-header">
      <div>
        <div class="sensei-card-title">Sensei Â· Funnel-Strategie</div>
        <div class="sensei-card-subtitle">
          Struktur-Vorschlag fÃ¼r Prospecting, Retargeting & LTV.
        </div>
      </div>
      <span class="sensei-ai-pill">
        <i class="fa-solid fa-diagram-project"></i>
        Strukturvorschlag
      </span>
    </div>

    <p style="margin-bottom:10px;">
      FÃ¼r <strong>${brand ? brand.name : "dein Konto"}</strong>${
    campaign ? ` (Fokus: <strong>${campaign.name}</strong>)` : ""
  } empfiehlt Sensei folgende Funnel-Aufteilung:
    </p>

    <div class="kpi-grid" style="margin-top:12px;">
      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:4px;">
          1 Â· Prospecting / Neukunden
        </div>
        <ul style="margin-left:16px;">
          <li>2â€“3 Broad / Advantage+ Anzeigengruppen mit weiten Zielgruppen.</li>
          <li>PrimÃ¤r <strong>UGC Videos</strong> mit klaren Hooks & Social Proof.</li>
          <li>Budget: <strong>50â€“60% des Gesamtspends</strong>.</li>
        </ul>
      </div>

      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:4px;">
          2 Â· Retargeting / Warm Traffic
        </div>
        <ul style="margin-left:16px;">
          <li>1 Stack mit Website Visitors + ATC / VC (7â€“30 Tage).</li>
          <li>Mix aus <strong>Product Demos</strong> und klaren Offer-Creatives.</li>
          <li>Budget: <strong>20â€“30%</strong>, Frequenz <strong>&lt; 6</strong> halten.</li>
        </ul>
      </div>

      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:4px;">
          3 Â· LTV / Bestandskunden
        </div>
        <ul style="margin-left:16px;">
          <li>Custom Audiences: KÃ¤ufer 90/180 Tage, Newsletter, Loyalty.</li>
          <li>Creatives mit <strong>Bundles, Up- & Cross-Sell</strong>.</li>
          <li>Budget: <strong>10â€“20%</strong>, Ziel: ROAS-Maximierung.</li>
        </ul>
      </div>
    </div>

    <p style="margin-top:14px;font-size:0.85rem;color:#6b7280;">
      Sobald Meta Live-Daten angebunden sind, passt Sensei diese Struktur auf Basis
      deines tatsÃ¤chlichen Spend-/ROAS-Profils automatisiert an.
    </p>
  `;

  root.appendChild(section);
}
