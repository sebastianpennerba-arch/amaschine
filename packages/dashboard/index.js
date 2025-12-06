// packages/dashboard/index.js
// -----------------------------------------------------------------------------
// 🚀 SignalOne Dashboard – VisionOS Tabs (Overview • Deep Dive • Academy)
// Nutzt DataLayer.fetchDashboardSummary({ accountId, preferLive })
// und rendert eine Premium-Übersicht über Spend, ROAS, CTR, CPM,
// Top/Worst Campaign & Creative – aufgeteilt in drei Tabs.
// -----------------------------------------------------------------------------

import DataLayer from "../data/index.js";

/**
 * Entry-Point für app.js
 * Wird von loadModule("dashboard") aufgerufen.
 *
 * @param {HTMLElement} section  #dashboardView
 * @param {object} AppState      globaler AppState aus app.js
 * @param {object} options       { useDemoMode: boolean }
 */
export function render(section, AppState, { useDemoMode } = {}) {
  if (!section) return;
  const isDemoMode = !!useDemoMode;
  void renderDashboardView(section, AppState, isDemoMode);
}

/* ---------------------------------------------------------------------------
 *  Core Render Flow (async)
 * ------------------------------------------------------------------------ */

async function renderDashboardView(section, AppState, isDemoMode) {
  const accountId = resolveAccountId(AppState);

  // 1) Sofortiger, leichter Placeholder (ohne hässlichen Button-Spam)
  section.innerHTML = renderShellSkeleton(AppState, isDemoMode);

  // 2) Daten laden
  try {
    const summary = await DataLayer.fetchDashboardSummary({
      accountId,
      preferLive: !isDemoMode,
    });

    renderShellWithData(section, summary, AppState, isDemoMode);
  } catch (err) {
    console.error("[SignalOne Dashboard] fetchDashboardSummary failed:", err);
    renderErrorState(section, err);
  }
}

/* ---------------------------------------------------------------------------
 *  Shell + Layout
 * ------------------------------------------------------------------------ */

function renderShellSkeleton(AppState, isDemoMode) {
  const brandName = escapeHtml(getBrandName(AppState) || "Aktuelle Brand");
  const modeLabel = isDemoMode ? "Demo / Showroom" : "Live / Hybrid";
  const launchScore = computeLaunchReadiness(AppState);

  return `
    <div class="dashboard-root" data-dashboard-root="true">
      <header class="dashboard-header">
        <div class="dashboard-header-main">
          <div class="dashboard-kicker">SignalOne Dashboard • Hybrid C</div>
          <h2 class="dashboard-title">Account Performance – Overview</h2>
          <p class="dashboard-subtitle">
            Zentraler Überblick über Spend, ROAS, CTR, CPM sowie deine stärksten und schwächsten
            Kampagnen & Creatives. Datenquelle: SignalOne DataLayer
            (${modeLabel === "Demo / Showroom" ? "Demo-Modus aktiv." : "Live/Hybrid aktiv."})
          </p>

          <div class="dashboard-header-meta">
            <span class="dashboard-pill">
              Brand: <strong>${brandName}</strong>
            </span>
            <span class="dashboard-pill">
              Modus: <strong>${modeLabel}</strong>
            </span>
          </div>
        </div>

        <div class="dashboard-header-aside">
          ${renderLaunchStatus(launchScore)}
          ${renderMetaMiniStatus(AppState, isDemoMode)}
        </div>
      </header>

      <section class="dashboard-tabs-shell">
        <div class="dashboard-tabs">
          <button 
            class="dashboard-tab is-active" 
            data-dashboard-tab="overview"
          >
            Overview
          </button>
          <button 
            class="dashboard-tab" 
            data-dashboard-tab="deepdive"
          >
            Deep Dive
          </button>
          <button 
            class="dashboard-tab" 
            data-dashboard-tab="academy"
          >
            Academy
          </button>
        </div>

        <div class="dashboard-tab-panels">
          <!-- Overview Panel -->
          <div 
            class="dashboard-tab-panel is-active" 
            data-dashboard-tab-panel="overview"
          >
            <div class="dashboard-grid">
              <div class="dashboard-card dashboard-card-metrics skeleton-card">
                <div class="dashboard-card-header">
                  <h3 class="dashboard-card-title">Kern-KPIs (30 Tage)</h3>
                  <p class="dashboard-card-subtitle">Lade Spend, Revenue, ROAS, CTR & CPM …</p>
                </div>
                <div class="dashboard-card-body">
                  <div class="dashboard-skeleton-row"></div>
                  <div class="dashboard-skeleton-row"></div>
                  <div class="dashboard-skeleton-row"></div>
                </div>
              </div>

              <div class="dashboard-card dashboard-card-health skeleton-card">
                <div class="dashboard-card-header">
                  <h3 class="dashboard-card-title">Health & Alerts</h3>
                  <p class="dashboard-card-subtitle">Analysiere kritische Signale im Account …</p>
                </div>
                <div class="dashboard-card-body">
                  <div class="dashboard-skeleton-pill"></div>
                  <div class="dashboard-skeleton-pill"></div>
                  <div class="dashboard-skeleton-pill"></div>
                </div>
              </div>

              <div class="dashboard-card dashboard-card-topbottom skeleton-card">
                <div class="dashboard-card-header">
                  <h3 class="dashboard-card-title">Top & Low Performer</h3>
                  <p class="dashboard-card-subtitle">
                    Identifiziere deine stärksten und schwächsten Kampagnen …
                  </p>
                </div>
                <div class="dashboard-card-body">
                  <div class="dashboard-skeleton-row"></div>
                  <div class="dashboard-skeleton-row"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Deep Dive Panel (Placeholder) -->
          <div 
            class="dashboard-tab-panel" 
            data-dashboard-tab-panel="deepdive"
          >
            <div class="dashboard-placeholder">
              <p class="dashboard-placeholder-label">
                Performance-Deep-Dive wird geladen …
              </p>
            </div>
          </div>

          <!-- Academy Panel (Static/Configurable) -->
          <div 
            class="dashboard-tab-panel" 
            data-dashboard-tab-panel="academy"
          >
            ${renderAcademyStatic()}
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderShellWithData(section, summary, AppState, isDemoMode) {
  const brandName = escapeHtml(getBrandName(AppState) || "Aktuelle Brand");
  const modeLabel = isDemoMode ? "Demo / Showroom" : "Live / Hybrid";
  const launchScore = computeLaunchReadiness(AppState);

  const metrics = summary?.metrics || summary || {};
  const bestCampaign = summary?.bestCampaign || null;
  const worstCampaign = summary?.worstCampaign || null;
  const bestCreative = summary?.bestCreative || null;
  const worstCreative = summary?.worstCreative || null;
  const alerts = summary?.alerts || null;

  section.innerHTML = `
    <div class="dashboard-root" data-dashboard-root="true">
      <header class="dashboard-header">
        <div class="dashboard-header-main">
          <div class="dashboard-kicker">SignalOne Dashboard • Hybrid C</div>
          <h2 class="dashboard-title">Account Performance – Overview</h2>
          <p class="dashboard-subtitle">
            Spend, ROAS, CTR, CPM und deine wichtigsten Performance-Signale
            aus Kampagnen & Creatives – zentral verdichtet über den DataLayer.
          </p>

          <div class="dashboard-header-meta">
            <span class="dashboard-pill">
              Brand: <strong>${brandName}</strong>
            </span>
            <span class="dashboard-pill">
              Modus: <strong>${modeLabel}</strong>
            </span>
          </div>
        </div>

        <div class="dashboard-header-aside">
          ${renderLaunchStatus(launchScore)}
          ${renderMetaMiniStatus(AppState, isDemoMode, summary)}
        </div>
      </header>

      <section class="dashboard-tabs-shell">
        <div class="dashboard-tabs">
          <button 
            class="dashboard-tab is-active" 
            data-dashboard-tab="overview"
          >
            Overview
          </button>
          <button 
            class="dashboard-tab" 
            data-dashboard-tab="deepdive"
          >
            Deep Dive
          </button>
          <button 
            class="dashboard-tab" 
            data-dashboard-tab="academy"
          >
            Academy
          </button>
        </div>

        <div class="dashboard-tab-panels">
          <!-- Overview Panel -->
          <div 
            class="dashboard-tab-panel is-active" 
            data-dashboard-tab-panel="overview"
          >
            ${renderOverviewPanel(metrics, alerts, bestCampaign, worstCampaign, bestCreative, worstCreative)}
          </div>

          <!-- Deep Dive Panel -->
          <div 
            class="dashboard-tab-panel" 
            data-dashboard-tab-panel="deepdive"
          >
            ${renderDeepDivePanel(summary)}
          </div>

          <!-- Academy Panel -->
          <div 
            class="dashboard-tab-panel" 
            data-dashboard-tab-panel="academy"
          >
            ${renderAcademyStatic()}
          </div>
        </div>
      </section>
    </div>
  `;

  wireTabs(section);
  wireCTAs(section);
}

function renderErrorState(section, err) {
  const msg =
    (err && err.message) ||
    "Unbekannter Fehler beim Laden des Dashboards.";

  section.innerHTML = `
    <div class="dashboard-root" data-dashboard-root="true">
      <header class="dashboard-header">
        <div class="dashboard-header-main">
          <div class="dashboard-kicker">SignalOne Dashboard • Hybrid C</div>
          <h2 class="dashboard-title">Account Performance – Fehler</h2>
          <p class="dashboard-subtitle">
            Das Dashboard konnte nicht geladen werden. Prüfe deine Meta-Verbindung
            oder versuche es später erneut.
          </p>
        </div>
      </header>
      <section class="dashboard-error">
        <div class="dashboard-card dashboard-card-error">
          <h3 class="dashboard-card-title">Ladefehler</h3>
          <p class="dashboard-card-subtitle">${escapeHtml(msg)}</p>
          <pre class="dashboard-error-pre">${escapeHtml(String(err))}</pre>
        </div>
      </section>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Overview Panel
 * ------------------------------------------------------------------------ */

function renderOverviewPanel(
  metrics,
  alerts,
  bestCampaign,
  worstCampaign,
  bestCreative,
  worstCreative,
) {
  const spend = metrics?.spend30d ?? metrics?.spend ?? 0;
  const revenue = metrics?.revenue30d ?? metrics?.revenue ?? 0;
  const roas = metrics?.roas30d ?? metrics?.roas ?? 0;
  const ctr = metrics?.ctr30d ?? metrics?.ctr ?? 0;
  const cpm = metrics?.cpm30d ?? metrics?.cpm ?? 0;

  const hasAlerts =
    !!alerts &&
    (Array.isArray(alerts.items)
      ? alerts.items.length > 0
      : !!(alerts.red?.length || alerts.yellow?.length || alerts.green?.length));

  return `
    <div class="dashboard-grid">
      <!-- KPIs -->
      <article class="dashboard-card dashboard-card-metrics">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Kern-KPIs (30 Tage)</h3>
          <p class="dashboard-card-subtitle">
            Spend, Umsatz & ROAS-Basis deines Accounts – inklusive CTR & CPM.
          </p>
        </div>
        <div class="dashboard-card-body dashboard-kpi-grid">
          <div class="dashboard-kpi">
            <span class="dashboard-kpi-label">Spend</span>
            <span class="dashboard-kpi-value">${formatCurrency(spend)}</span>
            <span class="dashboard-kpi-meta">letzte 30 Tage</span>
          </div>
          <div class="dashboard-kpi">
            <span class="dashboard-kpi-label">Umsatz (geschätzt)</span>
            <span class="dashboard-kpi-value">${formatCurrency(revenue)}</span>
            <span class="dashboard-kpi-meta">basierend auf ROAS</span>
          </div>
          <div class="dashboard-kpi">
            <span class="dashboard-kpi-label">ROAS</span>
            <span class="dashboard-kpi-value">${formatRoas(roas)}</span>
            <span class="dashboard-kpi-meta">30-Tage-Schnitt</span>
          </div>
          <div class="dashboard-kpi">
            <span class="dashboard-kpi-label">CTR</span>
            <span class="dashboard-kpi-value">${formatPct(ctr)}</span>
            <span class="dashboard-kpi-meta">Traffic-Qualität</span>
          </div>
          <div class="dashboard-kpi">
            <span class="dashboard-kpi-label">CPM</span>
            <span class="dashboard-kpi-value">${formatCurrency(cpm)}</span>
            <span class="dashboard-kpi-meta">Kostenniveau</span>
          </div>
        </div>
      </article>

      <!-- Alerts & Health -->
      <article class="dashboard-card dashboard-card-health">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Health & Alerts</h3>
          <p class="dashboard-card-subtitle">
            Kritische Signale und Chancen aus Kampagnen & Creatives.
          </p>
        </div>
        <div class="dashboard-card-body">
          ${
            hasAlerts
              ? renderAlertSummaryInline(alerts)
              : `<p class="dashboard-muted">
                  Aktuell keine kritischen Warnsignale – dein Account läuft stabil.
                </p>`
          }
          <div class="dashboard-actions-row">
            <button 
              class="meta-button meta-button-ghost" 
              data-dashboard-cta="open-sensei"
            >
              Sensei Analyse öffnen
            </button>
            <button 
              class="meta-button meta-button-ghost" 
              data-dashboard-cta="open-testing"
            >
              Testing Log anzeigen
            </button>
          </div>
        </div>
      </article>

      <!-- Top / Low Performer -->
      <article class="dashboard-card dashboard-card-topbottom">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Top & Low Performer</h3>
          <p class="dashboard-card-subtitle">
            Schnellüberblick über stärkste & schwächste Kampagnen und Creatives.
          </p>
        </div>
        <div class="dashboard-card-body dashboard-topbottom-body">
          <div class="dashboard-topbottom-column">
            <h4 class="dashboard-topbottom-heading">🏆 Top</h4>
            ${
              bestCampaign
                ? renderPerformerLine("Kampagne", bestCampaign, "good")
                : '<p class="dashboard-muted">Noch keine Kampagnen-Daten.</p>'
            }
            ${
              bestCreative
                ? renderPerformerLine("Creative", bestCreative, "good")
                : ""
            }
          </div>
          <div class="dashboard-topbottom-column">
            <h4 class="dashboard-topbottom-heading">⚠ Low</h4>
            ${
              worstCampaign
                ? renderPerformerLine("Kampagne", worstCampaign, "bad")
                : '<p class="dashboard-muted">Keine schwachen Kampagnen erkannt.</p>'
            }
            ${
              worstCreative
                ? renderPerformerLine("Creative", worstCreative, "bad")
                : ""
            }
          </div>
        </div>
        <div class="dashboard-actions-row">
          <button 
            class="meta-button meta-button-primary" 
            data-dashboard-cta="open-creatives"
          >
            Creative Library öffnen
          </button>
          <button 
            class="meta-button" 
            data-dashboard-cta="open-campaigns"
          >
            Kampagnen-Ansicht öffnen
          </button>
        </div>
      </article>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Deep Dive Panel
 * ------------------------------------------------------------------------ */

function renderDeepDivePanel(summary) {
  const metrics = summary?.metrics || summary || {};
  const trends = summary?.trends || {};
  const breakdown = summary?.breakdown || {};
  const hasTrends =
    trends && (Array.isArray(trends.roas) ? trends.roas.length > 0 : false);

  return `
    <div class="dashboard-deepdive">
      <article class="dashboard-card">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Performance-Deep-Dive</h3>
          <p class="dashboard-card-subtitle">
            Detailansicht von ROAS, Spend & Traffic-Kennzahlen – ideal für Strategen & Media Buyer.
          </p>
        </div>
        <div class="dashboard-card-body dashboard-deepdive-grid">
          <section class="dashboard-deepdive-section">
            <h4 class="dashboard-deepdive-title">ROAS & Spend Struktur</h4>
            <ul class="dashboard-list">
              <li>
                <span>ROAS 7 Tage:</span>
                <strong>${formatRoas(metrics.roas7d ?? metrics.roas30d)}</strong>
              </li>
              <li>
                <span>ROAS 30 Tage:</span>
                <strong>${formatRoas(metrics.roas30d ?? metrics.roas)}</strong>
              </li>
              <li>
                <span>Spend 7 Tage:</span>
                <strong>${formatCurrency(metrics.spend7d ?? 0)}</strong>
              </li>
              <li>
                <span>Spend 30 Tage:</span>
                <strong>${formatCurrency(metrics.spend30d ?? metrics.spend)}</strong>
              </li>
            </ul>
          </section>

          <section class="dashboard-deepdive-section">
            <h4 class="dashboard-deepdive-title">Traffic & Costs</h4>
            <ul class="dashboard-list">
              <li>
                <span>CTR:</span>
                <strong>${formatPct(metrics.ctr30d ?? metrics.ctr)}</strong>
              </li>
              <li>
                <span>CPM:</span>
                <strong>${formatCurrency(metrics.cpm30d ?? metrics.cpm)}</strong>
              </li>
              <li>
                <span>CPA (approx):</span>
                <strong>${formatCurrency(metrics.cpa30d ?? metrics.cpa)}</strong>
              </li>
              <li>
                <span>Purchases (30 Tage):</span>
                <strong>${formatInt(metrics.purchases30d ?? metrics.purchases)}</strong>
              </li>
            </ul>
          </section>

          <section class="dashboard-deepdive-section">
            <h4 class="dashboard-deepdive-title">Kanal / Funnel-Breakdown</h4>
            ${
              breakdown?.byStage && Array.isArray(breakdown.byStage)
                ? `
              <ul class="dashboard-list">
                ${breakdown.byStage
                  .map(
                    (s) => `
                  <li>
                    <span>${escapeHtml(s.label || s.stage || "Stage")}:</span>
                    <strong>${formatRoas(s.roas)} • ${formatPct(s.ctr)}</strong>
                  </li>
                `,
                  )
                  .join("")}
              </ul>`
                : `<p class="dashboard-muted">Noch kein detaillierter Funnel-Breakdown verfügbar.</p>`
            }
          </section>
        </div>
      </article>

      <article class="dashboard-card">
        <div class="dashboard-card-header">
          <h3 class="dashboard-card-title">Trend-Signale</h3>
          <p class="dashboard-card-subtitle">
            Kurzfristige Bewegungen im Account – ideal, um Timing & Budget-Anpassungen zu planen.
          </p>
        </div>
        <div class="dashboard-card-body">
          ${
            hasTrends
              ? renderTrendList(trends)
              : `<p class="dashboard-muted">
                  Noch keine Trend-Zeitreihe vorhanden – dieser Bereich wird aktiv,
                  sobald genügend Verlaufsdaten vorliegen.
                </p>`
          }
        </div>
      </article>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Academy Panel (Static Placeholder)
 * ------------------------------------------------------------------------ */

function renderAcademyStatic() {
  return `
    <div class="dashboard-academy">
      <header class="dashboard-academy-header">
        <h3 class="dashboard-card-title">SignalOne Academy (Preview)</h3>
        <p class="dashboard-card-subtitle">
          Lerne Performance Marketing, Creative Strategy & Testing direkt im Tool.
          Diese Fläche ist dein zukünftiger Lern-Hub.
        </p>
      </header>

      <div class="dashboard-academy-grid">
        <article class="academy-card">
          <div class="academy-card-tag">Foundation</div>
          <h4 class="academy-card-title">Meta Fundamentals</h4>
          <p class="academy-card-text">
            Verstehe ROAS, CTR, CPM & Budget-Logik, damit du deine Zahlen im Dashboard
            sofort richtig einordnen kannst.
          </p>
          <button 
            class="meta-button meta-button-primary" 
            data-dashboard-cta="academy-meta"
          >
            Modul öffnen (Demo)
          </button>
        </article>

        <article class="academy-card">
          <div class="academy-card-tag">Creatives</div>
          <h4 class="academy-card-title">Creative Strategy & Hooks</h4>
          <p class="academy-card-text">
            Wie du Winner-Creatives baust, Hooks entwickelst und deine Creative Library
            strategisch nutzt.
          </p>
          <button 
            class="meta-button" 
            data-dashboard-cta="academy-hooks"
          >
            Hook-Playbook anzeigen
          </button>
        </article>

        <article class="academy-card">
          <div class="academy-card-tag">Testing</div>
          <h4 class="academy-card-title">Testing & Iteration</h4>
          <p class="academy-card-text">
            Saubere Testpläne, sinnvolle Varianten und wie du Verluste begrenzt,
            bevor sie das Konto killen.
          </p>
          <button 
            class="meta-button" 
            data-dashboard-cta="academy-testing"
          >
            Testing Blueprint öffnen
          </button>
        </article>
      </div>

      <p class="dashboard-muted" style="margin-top:12px;">
        Hinweis: Die Academy wird als eigenes Modul <code>packages/academy/</code>
        implementiert. Dieses Dashboard-Tab ist der Einstiegspunkt.
      </p>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Mini Components
 * ------------------------------------------------------------------------ */

function renderLaunchStatus(score) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  let tone = "ok";
  if (clamped < 50) tone = "low";
  else if (clamped < 80) tone = "mid";
  else tone = "high";

  const label =
    tone === "high"
      ? "Launch-ready"
      : tone === "mid"
      ? "Fast bereit"
      : "Setup ausstehend";

  return `
    <div class="launch-status">
      <div class="launch-status-label">
        <span>Launch-Status</span>
        <strong>${clamped}%</strong>
      </div>
      <div class="launch-status-bar">
        <div 
          class="launch-status-bar-fill launch-status-bar-${tone}" 
          style="width:${clamped}%;"
        ></div>
      </div>
      <div class="launch-status-meta">${label}</div>
    </div>
  `;
}

function renderMetaMiniStatus(AppState, isDemoMode, summary) {
  const isConnected = !!AppState.metaConnected;
  const mode = isDemoMode ? "demo" : AppState.meta?.mode || "live";
  const accountName =
    AppState.meta?.accountName || AppState.meta?.user?.name || "Meta Account";

  let dotClass = "status-dot-neutral";
  let label = "Meta: nicht verbunden";

  if (isConnected && mode === "live") {
    dotClass = "status-dot-live";
    label = `Meta Live: ${escapeHtml(accountName)}`;
  } else if (isConnected && mode === "demo") {
    dotClass = "status-dot-demo";
    label = "Meta Demo: Verbunden";
  } else if (!isConnected && isDemoMode) {
    dotClass = "status-dot-demo";
    label = "Demo-Daten aktiv";
  }

  const issues = summary?.alerts?.overall || null;
  const issuesLabel =
    issues === "critical"
      ? "Kritische Signale aktiv"
      : issues === "warning"
      ? "Warnsignale aktiv"
      : "Keine kritischen Signale";

  return `
    <div class="meta-mini-status">
      <div class="meta-mini-row">
        <span class="${dotClass}"></span>
        <span class="meta-mini-label">${label}</span>
      </div>
      <div class="meta-mini-sub">${issuesLabel}</div>
    </div>
  `;
}

function renderAlertSummaryInline(alerts) {
  const items = Array.isArray(alerts.items)
    ? alerts.items
    : [
        ...(alerts.red || []),
        ...(alerts.yellow || []),
        ...(alerts.green || []),
      ];

  const top = items.slice(0, 3);

  return `
    <ul class="dashboard-alert-list">
      ${top
        .map((a) => {
          const sev =
            a.severity ||
            a.level ||
            (alerts.red?.includes(a)
              ? "critical"
              : alerts.yellow?.includes(a)
              ? "warning"
              : "info");
          const emoji =
            sev === "critical" ? "🚨" : sev === "warning" ? "⚠️" : "✅";

          return `
          <li class="dashboard-alert-item">
            <span class="dashboard-alert-icon">${emoji}</span>
            <div class="dashboard-alert-content">
              <div class="dashboard-alert-title">${escapeHtml(
                a.title || a.label || "Signal",
              )}</div>
              <div class="dashboard-alert-message">${escapeHtml(
                a.message || a.text || "",
              )}</div>
            </div>
          </li>
        `;
        })
        .join("")}
    </ul>
  `;
}

function renderPerformerLine(kindLabel, entity, tone) {
  const name = entity.name || entity.title || "Unbenannte Einheit";
  const roas = entity.roas ?? entity.metrics?.roas ?? null;
  const spend = entity.spend ?? entity.metrics?.spend ?? null;

  const emoji = tone === "good" ? "⭐" : "❌";

  return `
    <div class="dashboard-performer-row dashboard-performer-${tone}">
      <div class="dashboard-performer-main">
        <span class="dashboard-performer-kind">${emoji} ${kindLabel}</span>
        <span class="dashboard-performer-name">${escapeHtml(name)}</span>
      </div>
      <div class="dashboard-performer-kpis">
        <span class="dashboard-performer-pill">
          ROAS: ${formatRoas(roas)}
        </span>
        <span class="dashboard-performer-pill">
          Spend: ${formatCurrency(spend)}
        </span>
      </div>
    </div>
  `;
}

function renderTrendList(trends) {
  const roasSeries = Array.isArray(trends.roas) ? trends.roas : [];
  const spendSeries = Array.isArray(trends.spend) ? trends.spend : [];

  const rows = roasSeries.map((row, idx) => {
    const label = row.label || row.day || `T-${idx}`;
    const r = row.value ?? row.roas ?? 0;
    const s = spendSeries[idx]?.value ?? spendSeries[idx]?.spend ?? null;
    return { label, roas: r, spend: s };
  });

  return `
    <div class="dashboard-trend-list">
      ${rows
        .map((r) => {
          const perf =
            r.roas >= 4 ? "high" : r.roas >= 2 ? "mid" : r.roas > 0 ? "low" : "na";
          return `
          <div class="dashboard-trend-row dashboard-trend-${perf}">
            <div class="dashboard-trend-label">${escapeHtml(r.label)}</div>
            <div class="dashboard-trend-bar">
              <div 
                class="dashboard-trend-bar-fill" 
                style="width:${Math.min(
                  100,
                  Math.max(0, (r.roas || 0) * 20),
                )}%;"
              ></div>
            </div>
            <div class="dashboard-trend-meta">
              <span>${formatRoas(r.roas)}</span>
              ${
                r.spend != null
                  ? `<span>${formatCurrency(r.spend)}</span>`
                  : ""
              }
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Wiring (Tabs + CTAs)
 * ------------------------------------------------------------------------ */

function wireTabs(root) {
  const tabButtons = Array.from(
    root.querySelectorAll("[data-dashboard-tab]"),
  );
  const panels = Array.from(
    root.querySelectorAll("[data-dashboard-tab-panel]"),
  );

  if (!tabButtons.length || !panels.length) return;

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-dashboard-tab");
      if (!target) return;

      tabButtons.forEach((b) => b.classList.remove("is-active"));
      btn.classList.add("is-active");

      panels.forEach((panel) => {
        if (panel.getAttribute("data-dashboard-tab-panel") === target) {
          panel.classList.add("is-active");
        } else {
          panel.classList.remove("is-active");
        }
      });
    });
  });
}

function wireCTAs(root) {
  const navigateTo = window.SignalOne?.navigateTo;
  const showToast = window.SignalOne?.showToast;

  root.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-dashboard-cta]");
    if (!btn) return;

    const action = btn.getAttribute("data-dashboard-cta");
    switch (action) {
      case "open-sensei":
        navigateTo?.("sensei");
        break;
      case "open-testing":
        navigateTo?.("testingLog");
        break;
      case "open-creatives":
        navigateTo?.("creativeLibrary");
        break;
      case "open-campaigns":
        navigateTo?.("campaigns");
        break;
      case "academy-meta":
      case "academy-hooks":
      case "academy-testing":
        if (showToast) {
          showToast(
            "SignalOne Academy wird als eigenes Modul ergänzt – dieses Tab ist der Startpunkt.",
            "info",
          );
        }
        break;
      default:
        break;
    }
  });
}

/* ---------------------------------------------------------------------------
 *  Helpers
 * ------------------------------------------------------------------------ */

function resolveAccountId(AppState) {
  return (
    AppState?.meta?.activeAccountId ||
    AppState?.meta?.selectedAccountId ||
    AppState?.meta?.accountId ||
    "DEMO_ACCOUNT"
  );
}

function getBrandName(AppState) {
  return (
    AppState?.currentBrand?.name ||
    AppState?.brand?.name ||
    AppState?.meta?.accountName ||
    null
  );
}

function computeLaunchReadiness(AppState) {
  let score = 60;

  if (AppState?.metaConnected) score += 15;
  if (AppState?.meta?.mode === "live") score += 15;
  if (AppState?.settings?.demoMode === false) score += 5;

  // Cap und Minimum
  if (score > 100) score = 100;
  if (score < 10) score = 10;

  return score;
}

function formatCurrency(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "€0";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRoas(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "–";
  return `${n.toFixed(1)}x`;
}

function formatPct(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "–";
  const perc = n > 1 ? n : n * 100;
  return `${perc.toFixed(1)}%`;
}

function formatInt(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "–";
  return n.toLocaleString("de-DE");
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
