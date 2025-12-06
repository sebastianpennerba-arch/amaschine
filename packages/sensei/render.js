// packages/sensei/render.js
// -----------------------------------------------------------------------------
// Sensei Render Layer
// - Baut die komplette Sensei View (AdSensei • AI Suite)
// - Nutzt das normalisierte Modell aus compute.js
// -----------------------------------------------------------------------------

/**
 * Render Entry
 * @param {HTMLElement} section
 * @param {Object|null} model - normalisierte Sensei-Analyse
 * @param {Object} [opts]
 */
export function renderSenseiView(section, model, opts = {}) {
  if (!section) return;

  const hasData = !!model && Array.isArray(model.creatives) && model.creatives.length;

  if (!hasData) {
    renderEmptyState(section, opts.error);
    return;
  }

  const { totals, creatives, meta, offer, hook, recommendations } = model;

  const headerSubtitle = buildHeaderSubtitle(meta, totals);

  const html = `
    <div class="view-inner">
      <header class="view-header">
        <div>
          <div class="view-kicker">AdSensei • AI Suite</div>
          <h2 class="view-title">Daily Action Plan</h2>
          <p class="view-subtitle">${escapeHtml(headerSubtitle)}</p>
        </div>
        <div class="view-header-meta">
          ${renderModeBadge(meta)}
          ${meta && meta.createdAt ? `<span class="meta-pill">${escapeHtml(formatDate(meta.createdAt))}</span>` : ""}
        </div>
      </header>

      <div class="dashboard-grid">
        <!-- Linke Spalte: Creative Landscape -->
        <section>
          <div class="card">
            <h3 class="card-title">Creative Landscape</h3>
            <p class="card-subtitle">
              Überblick über deine wichtigsten Creatives – inkl. ROAS, CTR, CPM & Fatigue.
            </p>

            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-label">Creatives</div>
                <div class="kpi-value">${totals.totalCreatives}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${formatCurrency(totals.totalSpend)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Ø ROAS</div>
                <div class="kpi-value">${formatRoas(totals.avgRoas)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Ø CTR</div>
                <div class="kpi-value">${formatPercent(totals.avgCtr)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Ø CPM</div>
                <div class="kpi-value">${formatCurrency(totals.avgCpm)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Sensei Score</div>
                <div class="kpi-value">${formatScore(totals.avgScore)}</div>
              </div>
            </div>
          </div>

          <div class="card" style="margin-top:16px;">
            <h3 class="card-title">Creatives mit höchstem Impact</h3>
            <p class="card-subtitle">
              Sortiert nach Sensei Score – oben siehst du deine größten Hebel.
            </p>

            <div class="creative-grid">
              ${creatives.map(renderCreativeCard).join("")}
            </div>
          </div>
        </section>

        <!-- Rechte Spalte: Offer / Hook / Recommendations -->
        <aside>
          <div class="card">
            <h3 class="card-title">Account Summary</h3>
            <p class="card-subtitle">
              Zusammenfassung der gesamten Performance, basierend auf der Sensei-Analyse.
            </p>

            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-label">Revenue (ca.)</div>
                <div class="kpi-value">${formatCurrency(totals.totalRevenue)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${formatCurrency(totals.totalSpend)}</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Profit Ratio</div>
                <div class="kpi-value">${formatProfitRatio(totals)}</div>
              </div>
            </div>
          </div>

          ${offer ? renderOfferCard(offer) : ""}
          ${hook ? renderHookCard(hook) : ""}
          ${renderRecommendationsCard(recommendations)}
        </aside>
      </div>
    </div>
  `;

  section.innerHTML = html;
  wireInteractions(section, model);
}

// -----------------------------------------------------------------------------
// Empty State
// -----------------------------------------------------------------------------

function renderEmptyState(section, error) {
  const message = error
    ? "Sensei Analyse konnte nicht geladen werden."
    : "Verbinde deinen Meta Account oder aktiviere den Demo-Modus, um eine Sensei Analyse zu erhalten.";

  section.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <div>
          <div class="view-kicker">AdSensei • AI Suite</div>
          <h2 class="view-title">Noch keine Analyse verfügbar</h2>
          <p class="view-subtitle">${escapeHtml(message)}</p>
        </div>
      </header>

      <div class="card">
        <p>
          Du kannst jederzeit im <strong>Settings</strong>-Modul den <strong>Demo-Modus</strong> aktivieren
          und bekommst ein vollständiges Sensei-Beispielbriefing mit hochwertigen Demo-Daten.
        </p>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// UI Building Blocks
// -----------------------------------------------------------------------------

function renderModeBadge(meta) {
  if (!meta) return "";
  const mode = (meta.mode || "demo").toLowerCase();
  const isDemo = mode === "demo";

  const label = isDemo ? "Demo-Analyse" : "Live-Analyse";
  const icon = isDemo ? "✨" : "🔴";
  return `<span class="meta-pill">${icon} ${label}</span>`;
}

function renderCreativeCard(c) {
  const m = c.metrics || {};
  const toneEmoji = toneToEmoji(c.tone);
  const fatigueLabel = c.fatigue ? ` • Fatigue: ${escapeHtml(c.fatigue)}` : "";

  return `
    <article class="creative-library-item" data-id="${escapeHtml(c.id)}">
      <div class="creative-info">
        <div class="creative-title-row">
          <span class="creative-title">${escapeHtml(c.name)}</span>
        </div>
        <div class="creative-kpi">
          ${toneEmoji} ${escapeHtml(c.label || "Neutral")} • Score: ${formatScore(c.score)}
        </div>
        <div class="creative-kpi">
          ROAS: ${formatRoas(m.roas)} · Spend: ${formatCurrency(m.spend)} · CTR: ${formatPercent(m.ctr)}
        </div>
        <div class="creative-kpi">
          CPM: ${formatCurrency(m.cpm)} · Purchases: ${formatNumber(m.purchases)}${fatigueLabel}
        </div>
        <div class="creative-kpi">
          🎬 Hook: ${c.hookLabel ? escapeHtml(c.hookLabel) : "Kein Hook hinterlegt."}
        </div>
        <div class="creative-kpi">
          👤 Creator: ${escapeHtml(c.creator || "Unknown")}
        </div>
      </div>
    </article>
  `;
}

function renderOfferCard(offer) {
  const issues = Array.isArray(offer.issues) ? offer.issues : [];
  const recs = Array.isArray(offer.recommendations) ? offer.recommendations : [];

  return `
    <div class="card" style="margin-top:16px;">
      <h3 class="card-title">${escapeHtml(offer.headline || "Offer & Funnel Diagnose")}</h3>
      <p class="card-subtitle">${escapeHtml(offer.summary || "")}</p>

      ${
        offer.primaryIssue
          ? `<p class="card-subtitle"><strong>Hauptproblem:</strong> ${escapeHtml(
              offer.primaryIssue,
            )}</p>`
          : ""
      }

      ${
        issues.length
          ? `
        <div style="margin-top:8px;">
          <div class="card-section-title">Auffälligkeiten</div>
          <ul class="card-list">
            ${issues
              .map((i) => `<li>${escapeHtml(i.text || i)}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      ${
        recs.length
          ? `
        <div style="margin-top:12px;">
          <div class="card-section-title">Konkrete Offer-Steps</div>
          <ul class="card-list">
            ${recs
              .map((r) => `<li>${escapeHtml(r.text || r)}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderHookCard(hook) {
  const patterns = Array.isArray(hook.patterns) ? hook.patterns : [];
  const recs = Array.isArray(hook.recommendations) ? hook.recommendations : [];

  return `
    <div class="card" style="margin-top:16px;">
      <h3 class="card-title">${escapeHtml(hook.headline || "Hook & Story Analyse")}</h3>
      <p class="card-subtitle">${escapeHtml(hook.summary || "")}</p>

      ${
        patterns.length
          ? `
        <div style="margin-top:8px;">
          <div class="card-section-title">Hook-Patterns</div>
          <ul class="card-list">
            ${patterns
              .map((p) => `<li>${escapeHtml(p.text || p)}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }

      ${
        recs.length
          ? `
        <div style="margin-top:12px;">
          <div class="card-section-title">Empfohlene Hooks & Tests</div>
          <ul class="card-list">
            ${recs
              .map((r) => `<li>${escapeHtml(r.text || r)}</li>`)
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
    </div>
  `;
}

function renderRecommendationsCard(recommendations) {
  const list = Array.isArray(recommendations) ? recommendations : [];
  if (!list.length) {
    return `
      <div class="card" style="margin-top:16px;">
        <h3 class="card-title">Sensei Empfehlungen</h3>
        <p class="card-subtitle">
          Keine spezifischen Empfehlungen – dein Account wirkt im Moment stabil.
        </p>
      </div>
    `;
  }

  const top = list.slice(0, 6);

  return `
    <div class="card" style="margin-top:16px;">
      <h3 class="card-title">Sensei Empfehlungen</h3>
      <p class="card-subtitle">
        Priorisierte Handlungsempfehlungen für heute. Setz 1–3 Punkte direkt um.
      </p>

      <ol class="card-list numbered">
        ${top
          .map((r) => {
            const text = typeof r === "string" ? r : r.text || r.description || "";
            return `<li>${escapeHtml(text)}</li>`;
          })
          .join("")}
      </ol>

      <div style="margin-top:12px; display:flex; gap:8px; flex-wrap:wrap;">
        <button class="meta-button" data-role="sensei-refresh">
          Neu analysieren
        </button>
        <button class="meta-button meta-button-secondary" data-role="sensei-demo-hint">
          Demo-Usecase anzeigen
        </button>
      </div>
    </div>
  `;
}

// -----------------------------------------------------------------------------
// Interactions
// -----------------------------------------------------------------------------

function wireInteractions(section, model) {
  const refreshBtn = section.querySelector('[data-role="sensei-refresh"]');
  const demoHintBtn = section.querySelector('[data-role="sensei-demo-hint"]');

  const SignalOne = window.SignalOne || {};
  const showToast =
    SignalOne.showToast || (window.showToast ? window.showToast.bind(window) : null);

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      showToast?.("Sensei wird beim nächsten Aufruf neu berechnet.", "info");
    });
  }

  if (demoHintBtn) {
    demoHintBtn.addEventListener("click", () => {
      showToast?.(
        "Im Demo-Modus siehst du einen vollständigen Beispiel-Account mit Sensei Analyse.",
        "success",
      );
    });
  }
}

// -----------------------------------------------------------------------------
// Formatting Helpers
// -----------------------------------------------------------------------------

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "€0";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRoas(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "–";
  return `${n.toFixed(1)}x`;
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "–";
  const perc = n > 1 ? n : n * 100;
  return `${perc.toFixed(1)}%`;
}

function formatScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "–";
  return `${Math.round(n)}/100`;
}

function formatNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "–";
  return new Intl.NumberFormat("de-DE").format(n);
}

function formatProfitRatio(totals) {
  const spend = Number(totals.totalSpend) || 0;
  const rev = Number(totals.totalRevenue) || 0;
  if (!spend || !rev) return "–";
  const ratio = (rev - spend) / spend;
  return `${(ratio * 100).toFixed(1)}%`;
}

function formatDate(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneToEmoji(tone) {
  switch (tone) {
    case "good":
      return "🟢";
    case "critical":
      return "🔴";
    case "warning":
    default:
      return "🟡";
  }
}

function buildHeaderSubtitle(meta, totals) {
  const mode =
    meta && meta.mode === "live"
      ? "Live-Analyse deines Accounts"
      : "Demo-Analyse eines Beispiel-Accounts";

  const spend = formatCurrency(totals.totalSpend);
  const roas = formatRoas(totals.avgRoas);

  return `${mode} – ${spend} Spend • Ø ROAS ${roas}`;
}
