// packages/dashboard/index.js
// -----------------------------------------------------------------------------
// 🚀 SignalOne Dashboard – Hybrid C (Demo + Live via DataLayer)
// Nutzt DataLayer.fetchDashboardSummary({ accountId, preferLive })
// und rendert eine Premium-Übersicht über Spend, ROAS, CTR, CPM,
// Top/Worst Campaign & Creative.
// -----------------------------------------------------------------------------

import DataLayer from "../data/index.js";

/**
 * Entry-Point für app.js
 * Wird von loadModule("dashboard") aufgerufen.
 */
export function render(section, AppState, { useDemoMode } = {}) {
  // Wir starten synchron mit einem leichten Platzhalter
  // und lassen die eigentliche Logik in einem async Helper laufen.
  void renderDashboardView(section, AppState, !!useDemoMode);
}

/* ---------------------------------------------------------------------------
 *  Core Render Flow (async)
 * ------------------------------------------------------------------------ */

async function renderDashboardView(section, AppState, isDemoMode) {
  const accountId = resolveAccountId(AppState);

  // Initialer Placeholder (nachdem app.js das Skeleton entfernt hat)
  section.innerHTML = `
    <div class="creative-view-root" data-dashboard-root="true">
      <div class="creative-library-header">
        <div>
          <div class="view-kicker">SignalOne Dashboard • Hybrid C</div>
          <h2 class="view-headline">Account Performance Overview</h2>
          <p class="view-subline">
            Lade Spend, ROAS, CTR, CPM und deine stärksten sowie schwächsten Kampagnen & Creatives
            über den zentralen SignalOne DataLayer. ${
              isDemoMode
                ? "Der Demo-Modus ist aktiv – perfekte Verkaufs- und Präsentationsdaten."
                : "Je nach Einstellung nutzen wir Live- oder Demo-Daten."
            }
          </p>
          <div class="view-meta-row">
            <span class="kpi-badge warning">Status: Daten werden geladen …</span>
          </div>
        </div>
        <div class="creative-view-kpis">
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Brand</div>
            <div class="creative-mini-kpi-value">
              ${escapeHtml(getBrandName(AppState) || "Aktuelle Brand")}
            </div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Modus</div>
            <div class="creative-mini-kpi-value">
              ${isDemoMode ? "Demo / Showroom" : "Live / Hybrid"}
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-grid">
        <div class="metric-card">
          <div class="card-header">
            <div>
              <div class="card-title">Performance</div>
              <div class="card-subtitle">Spend, Revenue, ROAS, CTR & CPM</div>
            </div>
          </div>
          <p style="font-size:0.8rem;color:#64748b;margin:0;">
            Bitte kurz warten, wir aggregieren Kampagnen & Creatives …
          </p>
        </div>
      </div>
    </div>
  `;

  try {
    const summary = await DataLayer.fetchDashboardSummary({
      accountId,
      // Im Demo-Mode nie Live erzwingen, sonst versuchen wir live zu bevorzugen.
      preferLive: !isDemoMode,
    });

    renderSummaryIntoSection(section, summary, AppState, isDemoMode);
  } catch (err) {
    console.error("[SignalOne Dashboard] fetchDashboardSummary failed:", err);

    renderErrorState(section, err);

    try {
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          "Dashboard-Daten konnten nicht geladen werden. Es werden nur Demo-Infos angezeigt.",
          "error"
        );
      }
    } catch {
      // ignore toast errors
    }
  }
}

/* ---------------------------------------------------------------------------
 *  Rendering Helpers
 * ------------------------------------------------------------------------ */

function renderSummaryIntoSection(section, summary, AppState, isDemoMode) {
  const currencyCode = (AppState.settings && AppState.settings.currency) || "EUR";
  const dataSource = classifySource(summary && summary._source, isDemoMode);

  const spend = toNumber(summary && summary.spend);
  const revenue = toNumber(summary && summary.revenue);
  const roas = toNumber(summary && summary.roas);
  const ctr = toNumber(summary && summary.ctr);
  const cpm = toNumber(summary && summary.cpm);

  const roasTone = toneForRoas(roas);
  const ctrTone = toneForCtr(ctr);
  const cpmTone = toneForCpm(cpm);

  const topCamp = summary && summary.topCampaign;
  const worstCamp = summary && summary.worstCampaign;
  const topCreative = summary && summary.topCreative;
  const worstCreative = summary && summary.worstCreative;

  const brandName = getBrandName(AppState) || "Aktuelle Brand";
  const timeRange = (AppState.settings && AppState.settings.defaultRange) || "letzte 7 Tage";

  section.innerHTML = `
    <div class="creative-view-root" data-dashboard-root="true">
      <!-- HEADER -->
      <div class="creative-library-header">
        <div>
          <div class="view-kicker">SignalOne Dashboard • Hybrid C</div>
          <h2 class="view-headline">Account Performance Overview</h2>
          <p class="view-subline">
            Vollständige Übersicht über dein Konto – basierend auf ${
              dataSource.label
            }. Spend & Revenue kommen aus Kampagnen, ROAS, CTR und CPM sind
            Durchschnittswerte über alle aktiven Kampagnen. Top & Worst zeigen dir direkt
            die größten Hebel für Performance.
          </p>
          <div class="view-meta-row">
            <span class="kpi-badge ${dataSource.badgeClass}">
              Datenmodus: ${dataSource.label}
            </span>
            <span class="kpi-badge ${isDemoMode ? "warning" : "good"}">
              Demo-Switch: ${isDemoMode ? "DEMO AKTIV" : "LIVE / AUTO"}
            </span>
            <span class="kpi-badge">
              Range: ${escapeHtml(timeRange)}
            </span>
          </div>
        </div>
        <div class="creative-view-kpis">
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Brand</div>
            <div class="creative-mini-kpi-value">
              ${escapeHtml(brandName)}
            </div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Spend</div>
            <div class="creative-mini-kpi-value">
              ${formatCurrency(spend, currencyCode)}
            </div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">ROAS</div>
            <div class="creative-mini-kpi-value">
              ${isFinite(roas) ? roas.toFixed(2) + "×" : "–"}
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN GRID -->
      <div class="dashboard-grid">
        <!-- LEFT: PERFORMANCE & CREATIVE IMPACT -->
        <div class="performance-section">
          <div class="dashboard-card">
            <div class="card-header">
              <div>
                <div class="card-title">Account KPIs</div>
                <div class="card-subtitle">
                  Aggregierte Metriken aus allen Kampagnen
                </div>
              </div>
              <span class="kpi-badge ${roasTone}">ROAS ${
                isFinite(roas) ? roas.toFixed(2) + "×" : "–"
              }</span>
            </div>

            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${formatCurrency(spend, currencyCode)}</div>
                <div class="kpi-subtext">Gesamtbudget</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Revenue</div>
                <div class="kpi-value">${formatCurrency(revenue, currencyCode)}</div>
                <div class="kpi-subtext">Umsatz (geschätzt)</div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">CTR</div>
                <div class="kpi-value">
                  ${formatPercent(ctr)}
                </div>
                <div class="kpi-subtext">
                  <span class="kpi-badge ${ctrTone}">Traffic-Qualität</span>
                </div>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">CPM</div>
                <div class="kpi-value">
                  ${isFinite(cpm) ? formatCurrency(cpm, currencyCode) : "–"}
                </div>
                <div class="kpi-subtext">
                  <span class="kpi-badge ${cpmTone}">Media-Kosten</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dashboard-card">
            <div class="card-header">
              <div>
                <div class="card-title">Creative Impact</div>
                <div class="card-subtitle">Stärkstes & schwächstes Creative</div>
              </div>
            </div>

            ${
              !topCreative && !worstCreative
                ? `<p style="font-size:0.8rem;color:#64748b;margin:0;">
                     Noch keine Creatives vorhanden oder keine Daten für diesen Account.
                   </p>`
                : `
              <table class="table-mini">
                <thead>
                  <tr>
                    <th>Creative</th>
                    <th>ROAS</th>
                    <th>CTR</th>
                    <th>CPM</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    topCreative
                      ? `
                    <tr>
                      <td>⭐ ${escapeHtml(topCreative.name || topCreative.id || "Top Creative")}</td>
                      <td>${formatRoas(topCreative.metrics && topCreative.metrics.roas)}</td>
                      <td>${formatPercent(
                        topCreative.metrics && topCreative.metrics.ctr
                      )}</td>
                      <td>${formatCurrency(
                        topCreative.metrics && topCreative.metrics.cpm,
                        currencyCode
                      )}</td>
                    </tr>`
                      : ""
                  }
                  ${
                    worstCreative
                      ? `
                    <tr>
                      <td>⚠️ ${escapeHtml(
                        worstCreative.name || worstCreative.id || "Lowest Creative"
                      )}</td>
                      <td>${formatRoas(worstCreative.metrics && worstCreative.metrics.roas)}</td>
                      <td>${formatPercent(
                        worstCreative.metrics && worstCreative.metrics.ctr
                      )}</td>
                      <td>${formatCurrency(
                        worstCreative.metrics && worstCreative.metrics.cpm,
                        currencyCode
                      )}</td>
                    </tr>`
                      : ""
                  }
                </tbody>
              </table>
              `
            }
          </div>
        </div>

        <!-- RIGHT: CAMPAIGN SNAPSHOT & ACTION CENTER -->
        <div class="dashboard-section">
          <div class="dashboard-card">
            <div class="card-header">
              <div>
                <div class="card-title">Campaign Snapshot</div>
                <div class="card-subtitle">Top vs. Worst Kampagne</div>
              </div>
            </div>

            ${
              !topCamp && !worstCamp
                ? `<p style="font-size:0.8rem;color:#64748b;margin:0;">
                     Keine Kampagnen für diesen Account verfügbar.
                   </p>`
                : `
              <table class="table-mini">
                <thead>
                  <tr>
                    <th>Kampagne</th>
                    <th>Status</th>
                    <th>ROAS</th>
                    <th>Spend</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    topCamp
                      ? `
                    <tr>
                      <td>🏆 ${escapeHtml(topCamp.name || topCamp.id || "Top Kampagne")}</td>
                      <td>${escapeHtml(topCamp.status || "ACTIVE")}</td>
                      <td>${formatRoas(topCamp.metrics && topCamp.metrics.roas)}</td>
                      <td>${formatCurrency(
                        topCamp.metrics && topCamp.metrics.spend,
                        currencyCode
                      )}</td>
                    </tr>`
                      : ""
                  }
                  ${
                    worstCamp
                      ? `
                    <tr>
                      <td>🧯 ${escapeHtml(
                        worstCamp.name || worstCamp.id || "Worst Kampagne"
                      )}</td>
                      <td>${escapeHtml(worstCamp.status || "ACTIVE")}</td>
                      <td>${formatRoas(worstCamp.metrics && worstCamp.metrics.roas)}</td>
                      <td>${formatCurrency(
                        worstCamp.metrics && worstCamp.metrics.spend,
                        currencyCode
                      )}</td>
                    </tr>`
                      : ""
                  }
                </tbody>
              </table>
              `
            }
          </div>

          <div class="dashboard-card">
            <div class="card-header">
              <div>
                <div class="card-title">Action Center</div>
                <div class="card-subtitle">
                  Nächste Schritte auf Basis deiner Daten
                </div>
              </div>
            </div>

            <ul style="list-style:none;padding-left:0;margin:0;display:flex;flex-direction:column;gap:8px;font-size:0.83rem;color:#475569;">
              <li>
                <button
                  type="button"
                  class="meta-button"
                  data-dashboard-nav="creativeLibrary"
                  style="font-size:0.8rem;padding:6px 10px;border-radius:999px;margin-bottom:4px;"
                >
                  Creative Library öffnen
                </button>
                <div style="font-size:0.78rem;color:#6b7280;">
                  Sieh dir die Top-Creatives im Detail an und starte direkt neue Tests.
                </div>
              </li>
              <li>
                <button
                  type="button"
                  class="meta-button"
                  data-dashboard-nav="testingLog"
                  style="font-size:0.8rem;padding:6px 10px;border-radius:999px;margin-bottom:4px;"
                >
                  Testing Log
                </button>
                <div style="font-size:0.78rem;color:#6b7280;">
                  Dokumentiere deine Winning-Varianten & Hook-Battles strukturiert.
                </div>
              </li>
              <li>
                <button
                  type="button"
                  class="meta-button"
                  data-dashboard-nav="sensei"
                  style="font-size:0.8rem;padding:6px 10px;border-radius:999px;margin-bottom:4px;"
                >
                  Sensei Analyse starten
                </button>
                <div style="font-size:0.78rem;color:#6b7280;">
                  Lass die AI Suite dein Konto scannen und konkrete Handlungsempfehlungen geben.
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;

  // Navigation-Shortcuts aus dem Action Center
  wireDashboardNavigation(section);
}

function renderErrorState(section, err) {
  section.innerHTML = `
    <div class="creative-view-root" data-dashboard-root="true">
      <div class="metric-card" style="text-align:center;padding:32px 24px;">
        <div style="font-size:2.4rem;margin-bottom:10px;">🛠️</div>
        <h2 style="margin:0 0 6px;font-size:1.1rem;color:#0f172a;">
          Dashboard aktuell nicht verfügbar
        </h2>
        <p style="margin:0 0 4px;font-size:0.88rem;color:#6b7280;">
          Es gab ein Problem beim Laden der Dashboard-Daten.
        </p>
        <p style="margin:0;font-size:0.78rem;color:#9ca3af;">
          ${
            err && err.message
              ? escapeHtml(err.message)
              : "Bitte prüfe Meta-Connect oder aktiviere den Demo-Modus."
          }
        </p>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  Navigation aus dem Dashboard heraus
 * ------------------------------------------------------------------------ */

function wireDashboardNavigation(section) {
  section.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-dashboard-nav]");
    if (!btn) return;

    const targetModule = btn.getAttribute("data-dashboard-nav");
    if (!targetModule) return;

    try {
      if (window.SignalOne && typeof window.SignalOne.navigateTo === "function") {
        window.SignalOne.navigateTo(targetModule);
      }
    } catch (err) {
      console.warn("[SignalOne Dashboard] navigateTo failed:", err);
    }
  });
}

/* ---------------------------------------------------------------------------
 *  Helper: Account, Brand, Source Classification
 * ------------------------------------------------------------------------ */

function resolveAccountId(AppState) {
  if (!AppState) return null;

  const meta = AppState.meta || {};
  return (
    meta.selectedAdAccountId ||
    meta.adAccountId ||
    AppState.selectedAdAccountId ||
    AppState.selectedAccountId ||
    null
  );
}

function getBrandName(AppState) {
  if (!AppState) return null;
  if (AppState.brandName) return AppState.brandName;
  if (AppState.selectedBrandName) return AppState.selectedBrandName;
  if (AppState.currentBrand && AppState.currentBrand.name) {
    return AppState.currentBrand.name;
  }
  return null;
}

/**
 * Klassifiziert die Datenquelle anhand von summary._source
 */
function classifySource(source, isDemoMode) {
  const src = (source || "").toString().toLowerCase();

  if (src === "live" || src === "live-strict") {
    return { label: "Live-Daten (Meta)", badgeClass: "good" };
  }

  if (src === "demo-fallback" || src === "live-fallback") {
    return { label: "Demo (Fallback)", badgeClass: "warning" };
  }

  if (src === "demo") {
    return { label: "Demo-Daten", badgeClass: "warning" };
  }

  // Default / Unbekannt
  return {
    label: isDemoMode ? "Demo-Daten" : "Auto (Demo/Live)",
    badgeClass: isDemoMode ? "warning" : "good",
  };
}

/* ---------------------------------------------------------------------------
 *  Helper: Formatting & Tones
 * ------------------------------------------------------------------------ */

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatCurrency(value, currencyCode) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";

  let symbol = "€";
  if (currencyCode === "USD") symbol = "$";
  if (currencyCode === "GBP") symbol = "£";

  const abs = Math.abs(n);
  let formatted;
  if (abs >= 1_000_000) {
    formatted = (n / 1_000_000).toFixed(1) + "M";
  } else if (abs >= 1_000) {
    formatted = (n / 1_000).toFixed(1) + "k";
  } else {
    formatted = n.toFixed(0);
  }

  return `${symbol}${formatted}`;
}

function formatPercent(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";
  return n.toFixed(2) + " %";
}

function formatRoas(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";
  return n.toFixed(2) + "×";
}

function toneForRoas(roas) {
  const n = toNumber(roas);
  if (!Number.isFinite(n)) return "warning";
  if (n >= 4) return "good";
  if (n >= 2) return "warning";
  return "critical";
}

function toneForCtr(ctr) {
  const n = toNumber(ctr);
  if (!Number.isFinite(n)) return "warning";
  if (n >= 3) return "good";
  if (n >= 1.5) return "warning";
  return "critical";
}

function toneForCpm(cpm) {
  const n = toNumber(cpm);
  if (!Number.isFinite(n)) return "warning";
  if (n <= 8) return "good";
  if (n <= 15) return "warning";
  return "critical";
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
