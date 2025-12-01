// packages/sensei/render.js
// --------------------------------------------------------
// Visuelle Sensei-Ansicht (VisionOS-inspiriert)
// - Nutzt normalisierte Analyse aus compute.js
// - Kein Daten-Fetch hier, nur reines Rendern
// --------------------------------------------------------

import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "./compute.js";

/**
 * Kleinere Badge-Komponente je nach Tonalität.
 */
function toneBadge(tone, label) {
  const baseLabel = label || "";
  const toneClass = {
    good: "sensei-badge sensei-badge--good",
    warning: "sensei-badge sensei-badge--warning",
    critical: "sensei-badge sensei-badge--critical",
  }[tone || "warning"];

  return `<span class="${toneClass}">${baseLabel || tone.toUpperCase()}</span>`;
}

/**
 * Render der KPI-Header-Zeile (oben).
 */
function renderHeader(summary, source) {
  const modeLabel = source === "meta" ? "Meta Live" : "Demo";
  return `
    <header class="view-header sensei-header">
      <div>
        <div class="view-kicker">AdSensei • AI Suite (${modeLabel})</div>
        <h2 class="view-headline">Sensei – AI Recommendations</h2>
        <p class="view-subline">
          Performance-Summary & Creative-Empfehlungen auf Basis deiner aktuellen Daten.
        </p>
        <div class="view-meta-row">
          <span class="view-meta-pill">
            ${summary.totalCreatives || 0} Creatives im Check
          </span>
          <span class="view-meta-pill">
            Ø Score ${summary.avgScore ? summary.avgScore.toFixed(1) : "0.0"}
          </span>
          <span class="view-meta-pill">
            Spend ${formatCurrency(summary.totalSpend)}
          </span>
          <span class="view-meta-pill subtle">
            ROAS ${summary.avgRoas.toFixed(2)} • CTR ${formatPercent(
    summary.avgCtr
  )} • CPM ${summary.avgCpm.toFixed(2)}€
          </span>
        </div>
      </div>
    </header>
  `;
}

/**
 * Render eines einzelnen Creative-Cards.
 */
function renderCreativeCard(item) {
  const m = item.metrics || {};
  const scoreLabel = `${item.score.toFixed(1)}/100`;

  return `
    <article class="sensei-creative-card">
      <header class="sensei-creative-header">
        <div>
          <div class="sensei-creative-name">${item.name}</div>
          ${
            item.creator
              ? `<div class="sensei-creative-meta">Creator: ${item.creator}</div>`
              : ""
          }
        </div>
        <div class="sensei-creative-score">
          <span class="sensei-score">${scoreLabel}</span>
          ${toneBadge(item.tone, item.label)}
        </div>
      </header>

      <section class="sensei-creative-body">
        ${
          item.hookLabel
            ? `<p class="sensei-hook">Hook: <strong>${item.hookLabel}</strong></p>`
            : ""
        }

        <div class="sensei-kpi-row">
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">ROAS</span>
            <span class="sensei-kpi-value">${m.roas.toFixed(2)}</span>
          </div>
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">Spend</span>
            <span class="sensei-kpi-value">${formatCurrency(m.spend)}</span>
          </div>
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">Revenue</span>
            <span class="sensei-kpi-value">${formatCurrency(
              m.revenue
            )}</span>
          </div>
        </div>

        <div class="sensei-kpi-row">
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">CTR</span>
            <span class="sensei-kpi-value">${formatPercent(m.ctr)}</span>
          </div>
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">CPM</span>
            <span class="sensei-kpi-value">${m.cpm.toFixed(2)} €</span>
          </div>
          <div class="sensei-kpi">
            <span class="sensei-kpi-label">Purchases</span>
            <span class="sensei-kpi-value">${formatNumber(
              m.purchases
            )}</span>
          </div>
        </div>

        ${
          item.reasoning
            ? `<p class="sensei-reasoning">${item.reasoning}</p>`
            : ""
        }
      </section>

      <footer class="sensei-creative-footer">
        ${
          item.isTesting
            ? `<span class="sensei-chip sensei-chip--testing">Testing</span>`
            : ""
        }
        ${
          item.fatigue === "high"
            ? `<span class="sensei-chip sensei-chip--fatigue">Fatigue</span>`
            : ""
        }
      </footer>
    </article>
  `;
}

/**
 * Render der rechtsseitigen Zusammenfassung / Empfehlungen.
 */
function renderSidebar(normalized) {
  const t = normalized.totals;
  const recs = normalized.recommendations || [];
  const offer = normalized.offer || {};
  const hook = normalized.hook || {};

  const trafficSummary = `
    <ul class="sensei-summary-list">
      <li><strong>Spend:</strong> ${formatCurrency(t.totalSpend)}</li>
      <li><strong>Revenue:</strong> ${formatCurrency(t.totalRevenue)}</li>
      <li><strong>Ø ROAS:</strong> ${t.avgRoas.toFixed(2)}</li>
      <li><strong>Ø CTR:</strong> ${formatPercent(t.avgCtr)}</li>
      <li><strong>Ø CPM:</strong> ${t.avgCpm.toFixed(2)} €</li>
    </ul>
  `;

  const distribution = `
    <ul class="sensei-summary-list">
      <li><span class="sensei-dot good"></span>${t.goodCount} starke Creatives</li>
      <li><span class="sensei-dot warning"></span>${t.warningCount} Beobachten</li>
      <li><span class="sensei-dot critical"></span>${t.criticalCount} kritisch</li>
    </ul>
  `;

  const recList = recs
    .slice(0, 6)
    .map((r) => `<li>${r}</li>`)
    .join("");

  const offerText = offer.summary || "";
  const hookText = hook.summary || "";

  return `
    <aside class="sensei-sidebar">
      <section class="sensei-sidebar-card">
        <h3>Account Summary</h3>
        ${trafficSummary}
      </section>

      <section class="sensei-sidebar-card">
        <h3>Creative Landscape</h3>
        ${distribution}
      </section>

      ${
        offerText || hookText
          ? `
      <section class="sensei-sidebar-card">
        <h3>Offer & Hook</h3>
        ${
          offerText
            ? `<p class="sensei-sidebar-text">${offerText}</p>`
            : ""
        }
        ${
          hookText
            ? `<p class="sensei-sidebar-text">${hookText}</p>`
            : ""
        }
      </section>
      `
          : ""
      }

      ${
        recList
          ? `
      <section class="sensei-sidebar-card">
        <h3>Sensei – Nächste Schritte</h3>
        <ul class="sensei-summary-list">${recList}</ul>
      </section>
      `
          : ""
      }
    </aside>
  `;
}

/**
 * Main Render-Funktion für das Sensei-View.
 * - `analysis` ist das normalisierte Objekt aus compute.normalizeSenseiAnalysis
 * - Falls kein analysis → zeigt eine leere / freundliche leere State
 */
export function renderSenseiView(section, normalized) {
  if (!normalized) {
    section.innerHTML = `
      <div class="sensei-root">
        <header class="view-header sensei-header">
          <div>
            <div class="view-kicker">AdSensei • AI Suite</div>
            <h2 class="view-headline">Sensei – AI Recommendations</h2>
            <p class="view-subline">
              Starte eine Analyse, sobald Creatives verfügbar sind.
            </p>
          </div>
        </header>
        <p style="padding:16px;font-size:0.9rem;color:#6b7280;">
          Noch keine Daten verfügbar. Bitte Meta verbinden oder Demo-Daten aktivieren.
        </p>
      </div>
    `;
    return;
  }

  const headerHTML = renderHeader(
    normalized.totals,
    normalized.source || "demo"
  );
  const listHTML = normalized.creatives
    .slice(0, 30) // Hard-Cap fürs UI
    .map(renderCreativeCard)
    .join("");
  const sidebarHTML = renderSidebar(normalized);

  section.innerHTML = `
    <div class="sensei-root">
      ${headerHTML}

      <section class="sensei-layout">
        <div class="sensei-main">
          ${listHTML}
        </div>
        ${sidebarHTML}
      </section>
    </div>
  `;
}
