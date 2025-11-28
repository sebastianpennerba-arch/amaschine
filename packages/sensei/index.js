// packages/sensei/index.js
// Sensei Strategy Center – Vision Pro Titanium
// Render-Funktion wird von app.js via dynamic import aufgerufen.

export function render(root, AppState, { useDemoMode }) {
  const DemoData = window.SignalOneDemo?.DemoData || null;

  const brand = getCurrentBrand(AppState, DemoData);
  const brandName = brand?.name || "Deine Brand";
  const modeLabel = useDemoMode ? "Demo-Modus" : "Live-Modus";

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Sensei Strategy Center</h2>
        <p class="view-subtitle">
          Tägliche Account-Entscheidungen für <strong>${escapeHtml(
            brandName
          )}</strong> im ${modeLabel}.
        </p>
      </div>
    </div>

    <div class="sensei-layout">
      <!-- Linke Seite: Prompt + Output -->
      <div class="sensei-card">
        <div class="sensei-card-header">
          <div>
            <div class="sensei-card-title">Täglicher Action Plan</div>
            <div class="sensei-card-subtitle">
              Sensei analysiert Spend, ROAS und Tests und priorisiert deine nächsten Schritte.
            </div>
          </div>
          <div class="sensei-ai-pill">AI Sensei</div>
        </div>

        <div class="sensei-prompt-area">
          <label class="sensei-prompt-label">
            Was möchtest du optimieren?
          </label>
          <textarea
            id="senseiPrompt"
            class="sensei-prompt-textarea"
            placeholder="z.B. „Fokus auf Profit in Q4, mehr UGC + weniger Broad Spend“"
          ></textarea>

          <button id="senseiGenerateButton" class="sensei-generate-button" type="button">
            Action Plan generieren
          </button>

          <div id="senseiOutput" class="sensei-output">
            <h4>Empfohlene Actions für heute</h4>
            ${initialPlanHtml(brand)}
          </div>
        </div>
      </div>

      <!-- Rechte Seite: Insight Stack -->
      <div class="sensei-sidebar-stack">
        <div class="sensei-insight-card">
          <div class="sensei-insight-title">Account Pulse</div>
          <div class="sensei-insight-meta">
            ${brand
              ? `Brand: ${escapeHtml(brand.name)} · Vertikal: ${
                  brand.vertical
                }`
              : "Brand nicht gewählt – oben im Topbar Werbekonto wählen."}
          </div>
          <div class="sensei-tag-row" style="margin-top:6px;">
            <span class="sensei-tag">ROAS 30d: ${
              brand?.roas30d != null ? brand.roas30d.toFixed(1) : "n/a"
            }</span>
            <span class="sensei-tag">Spend 30d: ${
              brand ? formatCurrency(brand.spend30d) : "n/a"
            }</span>
            <span class="sensei-tag">Health: ${formatHealth(
              brand?.campaignHealth
            )}</span>
          </div>
        </div>

        <div class="sensei-insight-card">
          <div class="sensei-insight-title">Prioritäten heute</div>
          <ul style="padding-left:16px;margin:6px 0 0 0;font-size:0.82rem;">
            <li>1–2 Kampagnen skalieren, 1–2 pausieren – kein Mikromanagement.</li>
            <li>1 neues Test-Szenario statt 10 kleine Änderungen.</li>
            <li>Creator mit beständigem ROAS bevorzugen.</li>
          </ul>
        </div>

        <div class="sensei-insight-card">
          <div class="sensei-insight-title">Sensei-Status</div>
          <div class="sensei-insight-meta">
            Quelle: ${useDemoMode ? "Demo-Daten" : "Meta + interne Insights"}
          </div>
          <div class="sensei-tag-row">
            <span class="sensei-tag">Daily Plan</span>
            <span class="sensei-tag">Budget Sim</span>
            <span class="sensei-tag">Testing</span>
          </div>
        </div>
      </div>
    </div>

    <div class="sensei-card" style="margin-top:20px;">
      <div class="sensei-card-header">
        <div class="sensei-card-title">Testing & Budget Roadmap</div>
        <div class="sensei-card-subtitle">Nächste 7 Tage – Fokus & Struktur</div>
      </div>
      <ul style="font-size:0.86rem; margin:0 0 4px 18px; padding:0;">
        <li><strong>Tag 1–2:</strong> Creative Hooks testen, Winner isolieren, Budget neutral halten.</li>
        <li><strong>Tag 3–4:</strong> Winner konsolidieren, schwache Adsets abschalten, Top 3 Creatives skalieren.</li>
        <li><strong>Tag 5–6:</strong> neue Audience-Hypothese testen (Broad, LAL, Interest Stack).</li>
        <li><strong>Tag 7:</strong> Sensei Review → ROAS-Delta & Budget-Reallocation für neue Woche.</li>
      </ul>
    </div>
  `;

  const promptEl = root.querySelector("#senseiPrompt");
  const outputEl = root.querySelector("#senseiOutput");
  const buttonEl = root.querySelector("#senseiGenerateButton");

  if (buttonEl && outputEl && promptEl) {
    buttonEl.addEventListener("click", () => {
      const text = (promptEl.value || "").trim();
      const plan = generatePlan(text, brand, useDemoMode);
      outputEl.innerHTML = plan;
    });
  }
}

function getCurrentBrand(AppState, DemoData) {
  if (!DemoData || !DemoData.brands) return null;
  const id = AppState.selectedBrandId;
  if (!id) return DemoData.brands[0] || null;
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0] || null;
}

function initialPlanHtml(brand) {
  const health = formatHealth(brand?.campaignHealth);
  return `
    <p style="margin:0 0 6px 0;">
      Basierend auf deinem aktuellen Setup (Health: <strong>${health}</strong>) schlägt Sensei folgende Schritte vor:
    </p>
    <ul style="margin:0; padding-left:16px;">
      <li>1–2 kampagnen mit schlechtem ROAS einfrieren und Budget auf Top-Kampagnen verlagern.</li>
      <li>neue UGC-Variante mit starkem Hook testen (vertikal: ${
        brand?.vertical || "Standard"
      }).</li>
      <li>Testing Slot für morgen reservieren, statt 24/7 alles anzufassen.</li>
    </ul>
  `;
}

function generatePlan(promptText, brand, useDemoMode) {
  const label = brand?.name || "dein Account";
  const roas = brand?.roas30d != null ? brand.roas30d.toFixed(1) : "n/a";
  const spend = brand ? formatCurrency(brand.spend30d) : "n/a";

  const baseIntro = `
    <h4>Sensei Action Plan für ${escapeHtml(label)}</h4>
    <p style="margin:0 0 8px 0;font-size:0.86rem;">
      Ausgangslage: ROAS 30 Tage <strong>${roas}</strong>, Spend <strong>${spend}</strong>.
      Quelle: ${useDemoMode ? "Demo-Daten" : "Meta + interne Engine"}.
    </p>
  `;

  const normalizedPrompt = promptText.toLowerCase();

  const blocks = [];

  if (!normalizedPrompt) {
    blocks.push(`
      <p style="margin:0 0 6px 0;">Du hast keinen Fokus angegeben – Sensei nutzt den Default-Plan:</p>
      <ul style="margin:0 0 8px 0; padding-left:16px;">
        <li><strong>Budget:</strong> schwache Adsets (unter Ziel-ROAS) um 20–30% senken, Top-Adsets um 10–15% erhöhen.</li>
        <li><strong>Creatives:</strong> 2 neue Hooks testen, 1 bewährtes Creative duplizieren mit neuem Angle.</li>
        <li><strong>Testing:</strong> maximal 1–2 parallele Tests gleichzeitig – kein „alles auf einmal“.</li>
      </ul>
    `);
  } else {
    if (normalizedPrompt.includes("profit") || normalizedPrompt.includes("roas")) {
      blocks.push(`
        <p style="margin:0 0 4px 0;"><strong>1. Profit-Sicherung</strong></p>
        <ul style="margin:0 0 8px 0; padding-left:16px;">
          <li>alle kampagnen mit ROAS &lt; Zielwert um 30–40% senken oder pausieren.</li>
          <li>Top 2–3 Kampagnen mit stabilen Ergebnissen leicht skalieren (max. +15%).</li>
          <li>Kein Broad-Experiment über Nacht – Tests tagsüber kontrolliert ausspielen.</li>
        </ul>
      `);
    }

    if (normalizedPrompt.includes("ugc") || normalizedPrompt.includes("creative")) {
      blocks.push(`
        <p style="margin:0 0 4px 0;"><strong>2. Creative-Fokus (UGC)</strong></p>
        <ul style="margin:0 0 8px 0; padding-left:16px;">
          <li>mindestens 1 Hook-basierten UGC-Spot mit hartem Pattern Interrupt testen.</li>
          <li>Winning Creative aus den letzten 14 Tagen duplizieren mit neuem Intro (1–3 Sekunden).</li>
          <li>Sensei empfiehlt: 70% Budget auf etablierte Creatives, 30% auf neue Tests.</li>
        </ul>
      `);
    }

    if (normalizedPrompt.includes("scale") || normalizedPrompt.includes("skalieren")) {
      blocks.push(`
        <p style="margin:0 0 4px 0;"><strong>3. Skaliertaktik</strong></p>
        <ul style="margin:0 0 8px 0; padding-left:16px;">
          <li>Skalierung in 10–20% Schritten alle 48 Stunden bei stabilen KPIs.</li>
          <li>Keine simultane Budget- + Bid-Änderung – immer nur eine Variable.</li>
          <li>Bei ROAS-Drop &gt; 20%: Budget-Rollback &amp; Sensei Review im Testing Log.</li>
        </ul>
      `);
    }

    if (!blocks.length) {
      blocks.push(`
        <p style="margin:0 0 6px 0;">
          Fokus erkannt: <strong>${escapeHtml(promptText)}</strong>.  
          Sensei mappt das auf ein balanciertes Vorgehen:
        </p>
        <ul style="margin:0 0 8px 0; padding-left:16px;">
          <li>1 Bereich aggressiv optimieren (z.B. Creatives oder Budget), alles andere nur monitoren.</li>
          <li>Testing Log nutzen, um Hypothesen sauber zu dokumentieren.</li>
          <li>Sensei nach 48 Stunden erneut ausführen und deltas auswerten.</li>
        </ul>
      `);
    }
  }

  blocks.push(`
    <p style="margin:8px 0 0 0;font-size:0.8rem;color:#6b7280;">
      Hinweis: Dies ist eine strategische Empfehlung. Feintuning erfolgt über Testing Log & Creator Insights.
    </p>
  `);

  return baseIntro + blocks.join("");
}

function formatCurrency(value) {
  if (typeof value !== "number") return "n/a";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatHealth(health) {
  if (!health) return "n/a";
  if (health === "good") return "Stark";
  if (health === "warning") return "Beobachten";
  if (health === "critical") return "Kritisch";
  return health;
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
