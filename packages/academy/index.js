// packages/academy/index.js
// ---------------------------------------------------------
// SignalOne Academy – MVP View
// Fokus: Demo-taugliche Übersicht, ohne Backend-Abhängigkeiten
// ---------------------------------------------------------

export async function render(section, AppState, { useDemoMode } = {}) {
  if (!section) return;

  section.innerHTML = `
    <div class="creative-view-root">
      <header class="creative-library-header">
        <div>
          <div class="view-kicker">SignalOne Academy</div>
          <h2 class="view-headline">Lerne Meta Ads direkt im Tool</h2>
          <p class="view-subline">
            Die Academy macht aus SignalOne nicht nur ein Tool, sondern ein komplettes Performance-OS.
            Free Mini-Kurse für Leads, Premium-Masterclasses für Umsatz – alles direkt hier drin.
          </p>
          <div class="view-meta-row">
            <span class="view-meta-pill">
              <span class="dot-live"></span>
              Demo-Inhalte aktiviert
            </span>
            <span class="view-meta-pill">
              🎯 Fokus: Creative Performance & Testing
            </span>
          </div>
        </div>

        <div class="creative-view-kpis">
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Mini-Kurse</div>
            <div class="creative-mini-kpi-value">6</div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Masterclasses</div>
            <div class="creative-mini-kpi-value">5</div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Status</div>
            <div class="creative-mini-kpi-value">
              ${useDemoMode ? "Demo / Showroom" : "Live + Demo"}
            </div>
          </div>
        </div>
      </header>

      <div style="display:grid;grid-template-columns:2fr 1.6fr;gap:20px;margin-top:8px;">
        <!-- LEFT: Course buckets -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="dashboard-card" style="padding:18px 18px 16px;">
            <h3 style="margin:0 0 6px;font-size:1.02rem;font-weight:700;">Free Mini-Kurse</h3>
            <p style="margin:0 0 10px;font-size:0.87rem;color:#64748b;">
              Perfekt für Einsteiger, Lead-Gen und Ads-Setup – alles kostenlos als Einstieg.
            </p>
            <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:#111827;line-height:1.5;">
              <li>Meta Ads Essentials</li>
              <li>ROAS verstehen (ohne Mathe-Trauma)</li>
              <li>How to create a Hook</li>
              <li>Die größten Creative-Fehler</li>
              <li>CTR &amp; CPM erklärt</li>
              <li>Scaling Basics</li>
            </ul>
          </div>

          <div class="dashboard-card" style="padding:18px 18px 16px;">
            <h3 style="margin:0 0 6px;font-size:1.02rem;font-weight:700;">Premium Masterclasses</h3>
            <p style="margin:0 0 10px;font-size:0.87rem;color:#64748b;">
              Hochwertige Video-Trainings, die du später 1:1 verkaufen kannst.
            </p>
            <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:#111827;line-height:1.5;">
              <li>7-Figure Meta Ads Strategy Masterclass</li>
              <li>Creative Winner System</li>
              <li>UGC Bootcamp</li>
              <li>Testing Bible</li>
              <li>Scaling Blueprint &amp; Agency Accelerator</li>
            </ul>
          </div>
        </div>

        <!-- RIGHT: Context & Sensei tie-in -->
        <div style="display:flex;flex-direction:column;gap:14px;">
          <div class="dashboard-card" style="padding:18px 18px 16px;">
            <h3 style="margin:0 0 6px;font-size:1.02rem;font-weight:700;">Kontextuelle Empfehlungen</h3>
            <p style="margin:0 0 10px;font-size:0.87rem;color:#64748b;">
              Sensei verknüpft deine Daten mit passenden Kursen – so wird aus Fehlern direkt ein Learning.
            </p>
            <ul style="margin:0;padding-left:18px;font-size:0.86rem;color:#111827;line-height:1.5;">
              <li>ROAS Problem → <strong>„ROAS retten“</strong> Kurs</li>
              <li>CTR schwach → <strong>Hook &amp; Scrollstop Training</strong></li>
              <li>Creative Fatigue → <strong>Creative Refresh Framework</strong></li>
              <li>Testing Chaos → <strong>Testing Playbook &amp; Checklisten</strong></li>
            </ul>
          </div>

          <div class="dashboard-card" style="padding:18px 18px 16px;">
            <h3 style="margin:0 0 6px;font-size:1.02rem;font-weight:700;">Launch-Plan (MVP &amp; Pro)</h3>
            <p style="margin:0 0 8px;font-size:0.87rem;color:#64748b;">
              Für Live-Betrieb kannst du einfach echte Kurs-Links hinterlegen (Loom, Kajabi, Skool, etc.).
            </p>
            <ol style="margin:0;padding-left:18px;font-size:0.84rem;color:#111827;line-height:1.5;">
              <li>Demo-Kurse mit Loom &amp; Notion aufbauen</li>
              <li>Upsell-Strecke: Free → Masterclass → Subscription</li>
              <li>Aktionen im Dashboard, Creative Library &amp; Testing Log verlinken</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  `;
}
