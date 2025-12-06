// packages/academy/index.js
// -----------------------------------------------------------------------------
// SignalOne Academy – Eigenständiges Lern-Modul
// Wird von app.js via loadModule("academy") oder ähnlich geladen.
// -----------------------------------------------------------------------------

/**
 * Render-Funktion für die Academy View
 * @param {HTMLElement} section  - DOM-Node (#academyView)
 * @param {object} AppState      - globaler AppState
 * @param {object} options       - { useDemoMode: boolean }
 */
export function render(section, AppState, options = {}) {
  if (!section) return;

  section.innerHTML = buildAcademyHtml(AppState);
}

function buildAcademyHtml(AppState) {
  const brandName =
    AppState?.currentBrand?.name ||
    AppState?.brand?.name ||
    AppState?.meta?.accountName ||
    "Deine Brand";

  return `
    <div class="academy-root">
      <header class="academy-header">
        <div class="academy-header-main">
          <div class="academy-kicker">SignalOne • Academy</div>
          <h2 class="academy-title">Performance Marketing & Creative Strategy lernen</h2>
          <p class="academy-subtitle">
            Die Academy ist dein Lern-Hub für Meta Ads, Creatives, Testing & Scaling.
            Kurze, umsetzbare Module – direkt mit deinem SignalOne Setup verknüpft.
          </p>
        </div>

        <aside class="academy-header-side">
          <div style="font-weight:600;margin-bottom:4px;">Academy Status</div>
          <div style="margin-bottom:6px;">
            Aktive Brand: <strong>${escapeHtml(brandName)}</strong>
          </div>
          <div style="margin-bottom:4px;">
            Lernpfade für Media Buyer, Founder & Creator-Teams.
          </div>
          <div style="font-size:0.76rem;color:#6b7280;">
            In Zukunft kannst du hier deinen Fortschritt, Zertifizierungen
            und empfohlene Module auf Basis deiner Account-Daten sehen.
          </div>
        </aside>
      </header>

      <section class="academy-filters">
        <div class="academy-chip-row">
          <button class="academy-chip active" data-academy-filter="all">Alle</button>
          <button class="academy-chip" data-academy-filter="foundation">Fundament</button>
          <button class="academy-chip" data-academy-filter="creatives">Creatives</button>
          <button class="academy-chip" data-academy-filter="testing">Testing</button>
          <button class="academy-chip" data-academy-filter="scaling">Scaling</button>
        </div>
        <input
          type="search"
          class="academy-search"
          placeholder="Suche nach Modulen, z. B. „UGC Hooks“"
          data-academy-search
        />
      </section>

      <section class="academy-grid" data-academy-grid>
        ${academyCards
          .map((c) => renderAcademyCard(c))
          .join("")}
      </section>
    </div>
  `;
}

/* ------------------------------------------------------------------------- */
/*  Static Module Definition – V1 (Demo / Showroom)                          */
/* ------------------------------------------------------------------------- */

const academyCards = [
  {
    id: "fundamentals-media-buying",
    track: "foundation",
    tag: "Foundation",
    level: "beginner",
    title: "Meta Media Buying Fundamentals",
    text: "Lerne die Basis von ROAS, CTR, CPM und Budget-Logik, damit du dein Dashboard sauber lesen kannst.",
    length: "45 Min",
    format: "Video + Cheatsheet",
  },
  {
    id: "creative-strategy-hooks",
    track: "creatives",
    tag: "Creatives",
    level: "intermediate",
    title: "Creative Strategy & Hook Frameworks",
    text: "Wie du Winning-Hooks entwickelst, UGC-Strukturen baust und deine Creative Library systematisch nutzt.",
    length: "60 Min",
    format: "Video + Templates",
  },
  {
    id: "testing-blueprint",
    track: "testing",
    tag: "Testing",
    level: "intermediate",
    title: "Testing Blueprint",
    text: "Sauber geplante Tests: Laufzeit, Samplesize, Kriterien und wann du Creatives oder Adsets killst.",
    length: "40 Min",
    format: "Workshop",
  },
  {
    id: "scaling-playbooks",
    track: "scaling",
    tag: "Scaling",
    level: "advanced",
    title: "Scaling Playbooks",
    text: "Vertical vs. Horizontal Scaling, Budget Shifts, Warm-Audience-Strategien – ohne den Account zu sprengen.",
    length: "50 Min",
    format: "Playbook + Beispiele",
  },
];

function renderAcademyCard(c) {
  const levelClass = c.level === "advanced" ? "advanced" : "";
  const levelLabel =
    c.level === "beginner"
      ? "Einsteiger"
      : c.level === "advanced"
      ? "Advanced"
      : "Intermediate";

  return `
    <article 
      class="academy-card" 
      data-academy-track="${escapeHtml(c.track)}"
      data-academy-id="${escapeHtml(c.id)}"
    >
      <div class="academy-tag">${escapeHtml(c.tag)}</div>
      <div class="academy-badge-level ${levelClass}">${levelLabel}</div>
      <h3 class="academy-card-title">${escapeHtml(c.title)}</h3>
      <p class="academy-card-text">
        ${escapeHtml(c.text)}
      </p>
      <div class="academy-meta-row">
        <span>${escapeHtml(c.length)}</span>
        <span class="academy-meta-chip">${escapeHtml(c.format)}</span>
      </div>
      <button 
        class="meta-button" 
        data-academy-open="${escapeHtml(c.id)}"
      >
        Modul öffnen (Demo)
      </button>
    </article>
  `;
}

/* ------------------------------------------------------------------------- */
/*  Utils                                                                    */
/* ------------------------------------------------------------------------- */

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
