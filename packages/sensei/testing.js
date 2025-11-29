// packages/sensei/testing.js
// Submodul 3 – Creative / A/B Testing Empfehlungen

export function renderSenseiTesting(root, AppState, DemoData, ctx) {
  const brand = ctx.brand || null;

  const section = document.createElement("section");
  section.className = "sensei-card";

  section.innerHTML = `
    <div class="sensei-card-header">
      <div>
        <div class="sensei-card-title">Sensei · Testing Blueprint</div>
        <div class="sensei-card-subtitle">
          Nächste Creative-Experimente und Test-Setups für ${
            brand ? brand.name : "dein Konto"
          }.
        </div>
      </div>
      <span class="sensei-ai-pill">
        <i class="fa-solid fa-flask"></i>
        Testing Plan
      </span>
    </div>

    <div class="metric-grid" style="margin-top:10px;">
      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:6px;">
          Hook Battle (Top-of-Funnel)
        </div>
        <ul style="margin-left:16px;">
          <li>Teste <strong>3–5 Hooks</strong> parallel (Problem, Desire, Social Proof).</li>
          <li>Format: 15–30s UGC / Creator Ads.</li>
          <li>KPIs: 3-Sek.-Viewrate, CPC, CTR, Thumbstop-Rate.</li>
        </ul>
      </div>

      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:6px;">
          Offer Variants (Mid-Funnel)
        </div>
        <ul style="margin-left:16px;">
          <li>2–3 Angebotstypen: Prozent-Rabatt, Bundles, Free Shipping.</li>
          <li>A/B Test via Kampagnen-Duplikate oder Asset Customization.</li>
          <li>KPIs: CVR, ROAS, Add-to-Cart Rate.</li>
        </ul>
      </div>

      <div class="dashboard-card">
        <div class="section-title" style="font-size:0.9rem;margin-bottom:6px;">
          Landingpage / Funnel
        </div>
        <ul style="margin-left:16px;">
          <li>2 Varianten: <strong>Hero-Fokus vs. Offer-Fokus</strong>.</li>
          <li>Tracking über UTM & Shop-Daten.</li>
          <li>KPIs: Bounce, Time-on-Site, Funnel-Drop-Off.</li>
        </ul>
      </div>
    </div>

    <p style="margin-top:14px;font-size:0.85rem;color:#6b7280;">
      Hinweis: In einem späteren Schritt liest Sensei deinen <strong>Testing Log</strong>
      und schlägt konkrete Experimente inkl. Creatives vor.
    </p>
  `;

  root.appendChild(section);
}
