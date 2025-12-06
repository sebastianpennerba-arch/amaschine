// packages/dashboard/index.js
// -----------------------------------------------------------------------------
// SignalOne â€“ Dashboard (Upgrade C)
// Tabs: Overview â€¢ Deep Dive â€¢ Academy
// - Nutzt DataLayer.fetchDashboardSummary(accountId) falls vorhanden
// - Zeigt Launch-Status (0â€“100 %) permanent im Header
// - VisionOS Tabs via .dashboard-tabs / .dashboard-tab / .dashboard-panel
// -----------------------------------------------------------------------------

import DataLayer from "../data/index.js";

/**
 * Entry-Point â€“ wird von app.js via loadModule("dashboard") aufgerufen.
 *
 * @param {HTMLElement} section   #dashboardView
 * @param {object}       AppState globaler AppState aus app.js
 * @param {object}       opts     { useDemoMode: boolean }
 */
export async function render(section, AppState, opts = {}) {
  if (!section) return;
  const isDemo = !!opts.useDemoMode;

  // Skeleton initial anzeigen
  section.innerHTML = renderSkeleton(AppState, isDemo);

  // Daten laden (versuche DataLayer, fallback auf Fake-Daten)
  let summary = null;
  try {
    summary = await loadSummary(AppState, isDemo);
  } catch (err) {
    console.error("[Dashboard] Fehler beim Laden des Summaries:", err);
  }

  // Finales Dashboard rendern
  section.innerHTML = renderDashboard(AppState, isDemo, summary);

  // Interaktionen (Tabs + Buttons) verdrahten
  wireTabs(section);
  wireCTAs(section, AppState);
}

/* ---------------------------------------------------------------------------
 *  DATA LOADING
 * ------------------------------------------------------------------------ */

async function loadSummary(AppState, isDemo) {
  const accountId =
    AppState?.meta?.activeAccountId ||
    AppState?.meta?.selectedAccountId ||
    AppState?.meta?.accountId ||
    "DEMO_ACCOUNT";

  if (DataLayer && typeof DataLayer.fetchDashboardSummary === "function") {
    return DataLayer.fetchDashboardSummary({
      accountId,
      preferLive: !isDemo,
    });
  }

  // Fallback â€“ minimale Demo-Struktur
  return {
    metrics: {
      spend30d: 120000,
      revenue30d: 420000,
      roas30d: 3.5,
      ctr30d: 0.028,
      cpm30d: 12.5,
      purchases30d: 2800,
    },
    alerts: {
      level: "warning",
      items: [
        {
          severity: "warning",
          title: "Scaling-Phase aktiv",
          message: "Ein Teil deines Budgets lÃ¤uft auf Kampagnen mit sinkendem ROAS.",
        },
        {
          severity: "info",
          title: "Creatives im Testing",
          message: "3 neue UGC-Creatives laufen erst seit < 3 Tagen.",
        },
      ],
    },
    bestCampaign: {
      name: "SC â€“ Evergreen UGC â€“ Main GEO",
      roas: 4.8,
      spend: 34000,
    },
    worstCampaign: {
      name: "TOF â€“ Broad Prospecting â€“ US",
      roas: 1.2,
      spend: 22000,
    },
    bestCreative: {
      name: "UGC: â€žProblem â†’ LÃ¶sungâ€œ Hook",
      roas: 6.1,
      spend: 16000,
    },
    worstCreative: {
      name: "Static â€“ Rabattbanner 15%",
      roas: 0.9,
      spend: 8000,
    },
  };
}

/* ---------------------------------------------------------------------------
 *  RENDERING
 * ------------------------------------------------------------------------ */

function renderSkeleton(AppState, isDemo) {
  const brandName = getBrandName(AppState) || "Aktuelle Brand";
  const modeLabel = isDemo ? "Demo / Showroom" : "Live / Hybrid";
  const launchScore = computeLaunchScore(AppState);

  return `
    <div class="dashboard-root">
      ${renderHeader(brandName, modeLabel, launchScore, AppState, isDemo, null)}
      ${renderTabs()}
      <div class="dashboard-panel-group">
        <section class="dashboard-panel active" data-panel="overview">
          <div class="dashboard-overview-grid">
            <div class="dashboard-overview-card">
              <h3 class="card-title">Kern-KPIs (30 Tage)</h3>
              <p class="card-subtitle">Lade Spend, Umsatz, ROAS, CTR & CPM â€¦</p>
              <div class="kpi-grid" style="margin-top:10px;">
                ${skeletonLine()}
                ${skeletonLine()}
                ${skeletonLine()}
                ${skeletonLine()}
              </div>
            </div>
            <div class="dashboard-overview-card">
              <h3 class="card-title">Health & Alerts</h3>
              <p class="card-subtitle">Analysiere kritische Signale im Account â€¦</p>
              ${skeletonPill()}
              ${skeletonPill()}
              ${skeletonPill()}
            </div>
            <div class="dashboard-overview-card">
              <h3 class="card-title">Top & Low Performer</h3>
              <p class="card-subtitle">Identifiziere deine stÃ¤rksten & schwÃ¤chsten Assets â€¦</p>
              ${skeletonLine()}
              ${skeletonLine()}
            </div>
          </div>
        </section>
        <section class="dashboard-panel" data-panel="deepdive">
          <div class="dashboard-deepdive-box">
            <h3 class="card-title">Performance Deep Dive</h3>
            <p class="card-subtitle">Detaildaten werden geladen â€¦</p>
          </div>
        </section>
        <section class="dashboard-panel" data-panel="academy">
          ${renderAcademyPanel()}
        </section>
      </div>
    </div>
  `;
}

function renderDashboard(AppState, isDemo, summary) {
  const brandName = getBrandName(AppState) || "Aktuelle Brand";
  const modeLabel = isDemo ? "Demo / Showroom" : "Live / Hybrid";
  const launchScore = computeLaunchScore(AppState);
  const metrics = summary?.metrics || summary || {};
  const alerts = summary?.alerts || null;
  const bestCampaign = summary?.bestCampaign || null;
  const worstCampaign = summary?.worstCampaign || null;
  const bestCreative = summary?.bestCreative || null;
  const worstCreative = summary?.worstCreative || null;

  return `
    <div class="dashboard-root">
      ${renderHeader(brandName, modeLabel, launchScore, AppState, isDemo, alerts)}
      ${renderTabs()}
      <div class="dashboard-panel-group">
        <!-- OVERVIEW -->
        <section class="dashboard-panel active" data-panel="overview">
          ${renderOverviewPanel(metrics, alerts, bestCampaign, worstCampaign, bestCreative, worstCreative)}
        </section>

        <!-- DEEP DIVE -->
        <section class="dashboard-panel" data-panel="deepdive">
          ${renderDeepDivePanel(metrics, alerts)}
        </section>

        <!-- ACADEMY -->
        <section class="dashboard-panel" data-panel="academy">
          ${renderAcademyPanel()}
        </section>
      </div>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  HEADER, TABS & PANELS
 * ------------------------------------------------------------------------ */

function renderHeader(brandName, modeLabel, launchScore, AppState, isDemo, alerts) {
  const modeBadge =
    isDemo || !AppState?.metaConnected
      ? `<span class="view-meta-pill"><span class="dot-live" style="background:#0ea5e9;"></span> Demo Mode</span>`
      : `<span class="view-meta-pill"><span class="dot-live"></span> Live Daten</span>`;

  const accountName =
    AppState?.meta?.accountName ||
    AppState?.meta?.user?.name ||
    brandName;

  const alertsText =
    alerts?.level === "critical"
      ? "Kritische Signale im Account aktiv."
      : alerts?.level === "warning"
      ? "Es gibt Warnsignale, die du prÃ¼fen solltest."
      : "Aktuell keine kritischen Signals.";

  const launchLabel =
    launchScore >= 80
      ? "Launch-ready"
      : launchScore >= 60
      ? "Fast bereit"
      : "Setup ausstehend";

  return `
    <header class="view-header" style="align-items:flex-start;margin-bottom:20px;">
      <div>
        <h2>DASHBOARD OVERVIEW</h2>
        <div class="view-meta-row">
          <span class="view-meta-pill">
            Brand: <strong>${escapeHtml(brandName)}</strong>
          </span>
          <span class="view-meta-pill">
            Account: <strong>${escapeHtml(accountName)}</strong>
          </span>
          ${modeBadge}
        </div>
        <p class="view-subline">
          Zentraler Ãœberblick Ã¼ber Spend, ROAS, CTR & CPM â€“ plus deine wichtigsten Signale
          aus Kampagnen, Creatives und Tests.
        </p>
      </div>

      <div style="min-width:220px;max-width:260px;">
        <div class="settings-block">
          <div class="settings-block-header">
            <div>
              <div class="settings-title">Launch-Status</div>
              <div class="settings-subtitle">
                ${launchLabel} â€¢ ${launchScore}%
              </div>
            </div>
          </div>
          <div class="dashboard-launchbar" style="margin-top:10px;">
            <div
              class="dashboard-launchbar-fill"
              style="width:${Math.max(0, Math.min(100, launchScore))}%;"
            ></div>
          </div>
          <div style="font-size:0.76rem;color:#6b7280;margin-top:4px;">
            ${alertsText}
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderTabs() {
  return `
    <div class="dashboard-tabs">
      <button class="dashboard-tab active" data-tab="overview">Overview</button>
      <button class="dashboard-tab" data-tab="deepdive">Deep&nbsp;Dive</button>
      <button class="dashboard-tab" data-tab="academy">Academy</button>
    </div>
  `;
}

/* OVERVIEW PANEL */

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
  const purchases = metrics?.purchases30d ?? metrics?.purchases ?? 0;

  return `
    <div class="dashboard-overview-grid">
      <!-- KPIs -->
      <article class="dashboard-overview-card">
        <h3 class="card-title">Kern-KPIs (30 Tage)</h3>
        <p class="card-subtitle">
          Spend, Umsatz und ROAS bilden die Basis fÃ¼r deine Performance-Entscheidungen.
        </p>
        <div class="kpi-grid" style="margin-top:12px;">
          <div class="kpi-item">
            <div class="kpi-label">Spend</div>
            <div class="kpi-value">${formatCurrency(spend)}</div>
            <div class="kpi-badge good">Budget aktiv</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">Umsatz (geschÃ¤tzt)</div>
            <div class="kpi-value">${formatCurrency(revenue)}</div>
            <div class="kpi-badge">${formatRoas(roas)} ROAS</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">CTR</div>
            <div class="kpi-value">${formatPercent(ctr)}</div>
            <div class="kpi-badge">Traffic-QualitÃ¤t</div>
          </div>
          <div class="kpi-item">
            <div class="kpi-label">CPM</div>
            <div class="kpi-value">${formatCurrency(cpm)}</div>
            <div class="kpi-badge">Kostenniveau</div>
          </div>
        </div>
        <div style="margin-top:10px;font-size:0.8rem;color:#6b7280;">
          Purchases (30 Tage): <strong>${formatInt(purchases)}</strong>
        </div>
      </article>

      <!-- Health & Alerts -->
      <article class="dashboard-overview-card">
        <h3 class="card-title">Health & Alerts</h3>
        <p class="card-subtitle">
          Kritische Signale aus Kampagnen & Creatives, die du im Blick behalten solltest.
        </p>
        <div style="margin-top:8px;">
          ${renderAlertsList(alerts)}
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="meta-button" data-dashboard-cta="sensei">
            Sensei Analyse
          </button>
          <button class="meta-button" data-dashboard-cta="testing">
            Testing Log
          </button>
        </div>
      </article>

      <!-- Top & Low Performer -->
      <article class="dashboard-overview-card">
        <h3 class="card-title">Top & Low Performer</h3>
        <p class="card-subtitle">
          SchnellÃ¼berblick Ã¼ber deine stÃ¤rksten und schwÃ¤chsten Kampagnen & Creatives.
        </p>
        <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
          ${
            bestCampaign
              ? renderPerformerRow("ðŸ† Kampagne (Top)", bestCampaign, "good")
              : `<div class="kpi-item"><div class="kpi-label">Top-Kampagne</div><div class="kpi-value">â€“</div></div>`
          }
          ${
            bestCreative
              ? renderPerformerRow("â­ Creative (Top)", bestCreative, "good")
              : ""
          }
          ${
            worstCampaign
              ? renderPerformerRow("âš  Kampagne (Low)", worstCampaign, "bad")
              : ""
          }
          ${
            worstCreative
              ? renderPerformerRow("âŒ Creative (Low)", worstCreative, "bad")
              : ""
          }
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="meta-button" data-dashboard-cta="creatives">
            Creative Library
          </button>
          <button class="meta-button" data-dashboard-cta="campaigns">
            Kampagnen
          </button>
        </div>
      </article>
    </div>
  `;
}

/* DEEP DIVE PANEL */

function renderDeepDivePanel(metrics = {}, alerts) {
  const spend7 = metrics?.spend7d ?? null;
  const spend30 = metrics?.spend30d ?? metrics?.spend ?? null;
  const roas7 = metrics?.roas7d ?? null;
  const roas30 = metrics?.roas30d ?? metrics?.roas ?? null;
  const ctr = metrics?.ctr30d ?? metrics?.ctr ?? null;
  const cpm = metrics?.cpm30d ?? metrics?.cpm ?? null;
  const cpa = metrics?.cpa30d ?? metrics?.cpa ?? null;

  return `
    <div class="dashboard-deepdive">
      <div class="dashboard-deepdive-box">
        <h3 class="card-title">Performance Deep Dive</h3>
        <p class="card-subtitle">
          Kurzfristige vs. langfristige Performance. Ideal, um Scaling-Entscheidungen zu treffen.
        </p>
        <table class="table-mini" style="margin-top:10px;">
          <thead>
            <tr>
              <th>Fenster</th>
              <th>Spend</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>7 Tage</td>
              <td>${spend7 != null ? formatCurrency(spend7) : "â€“"}</td>
              <td>${roas7 != null ? formatRoas(roas7) : "â€“"}</td>
            </tr>
            <tr>
              <td>30 Tage</td>
              <td>${spend30 != null ? formatCurrency(spend30) : "â€“"}</td>
              <td>${roas30 != null ? formatRoas(roas30) : "â€“"}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:14px;font-size:0.8rem;color:#6b7280;">
          Nutze den Unterschied zwischen 7-Tage- und 30-Tage-ROAS, um zu erkennen, ob dein
          Account eher in eine positive oder negative Richtung driftet.
        </div>
      </div>

      <div class="dashboard-deepdive-box">
        <h3 class="card-title">Traffic & Kosten</h3>
        <p class="card-subtitle">
          CTR, CPM und CPA zeigen dir, ob dein Funnel-Einstieg sauber arbeitet.
        </p>
        <table class="table-mini" style="margin-top:10px;">
          <tbody>
            <tr>
              <td>CTR</td>
              <td>${formatPercent(ctr)}</td>
            </tr>
            <tr>
              <td>CPM</td>
              <td>${formatCurrency(cpm)}</td>
            </tr>
            <tr>
              <td>CPA (approx.)</td>
              <td>${formatCurrency(cpa)}</td>
            </tr>
          </tbody>
        </table>
        <div style="margin-top:14px;font-size:0.8rem;color:#6b7280;">
          Bei steigenden CPM und fallender CTR solltest du Creatives & Hook-Struktur priorisieren.
        </div>
        <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="meta-button" data-dashboard-cta="sensei">
            Sensei Ã¶ffnen
          </button>
          <button class="meta-button" data-dashboard-cta="testing">
            Testplan anlegen
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ACADEMY PANEL (Static Placeholder â€“ dein Academy-Einstieg) */

function renderAcademyPanel() {
  return `
    <div class="dashboard-academy">
      <article class="academy-card">
        <div class="view-kicker">Foundation</div>
        <h3 class="academy-card-title">Meta Media Buying Fundamentals</h3>
        <p class="academy-card-text">
          Die Basis: ROAS, CTR, CPM, CPA & Budgets verstehen. Nach diesem Modul liest du
          dein Dashboard wie eine Bilanz â€“ ohne RÃ¤tselraten.
        </p>
        <button class="meta-button" data-dashboard-cta="academy-meta">
          Modul (Demo) Ã¶ffnen
        </button>
      </article>

      <article class="academy-card">
        <div class="view-kicker">Creatives</div>
        <h3 class="academy-card-title">Creative Strategy & Hooks</h3>
        <p class="academy-card-text">
          Wie du Winner-Creatives baust, Hook-Patterns erkennst und deine Creative Library
          nutzt, um systematisch neue Tests zu fahren.
        </p>
        <button class="meta-button" data-dashboard-cta="academy-hooks">
          Hook Playbook
        </button>
      </article>

      <article class="academy-card">
        <div class="view-kicker">Testing</div>
        <h3 class="academy-card-title">Testing & Iteration Blueprint</h3>
        <p class="academy-card-text">
          Klarer Fahrplan fÃ¼r A/B-Tests: Setup, Laufzeit, Auswertung und wann du Creatives
          oder Kampagnen konsequent killen solltest.
        </p>
        <button class="meta-button" data-dashboard-cta="academy-testing">
          Testing Blueprint
        </button>
      </article>

      <article class="academy-card">
        <div class="view-kicker">Scaling</div>
        <h3 class="academy-card-title">Scaling Playbooks</h3>
        <p class="academy-card-text">
          FÃ¼r Accounts, die performen: Wann du Budget hochziehen kannst, welche Methoden
          (Vertical / Horizontal Scaling) Sinn machen und wie du Kontrolle behÃ¤ltst.
        </p>
        <button class="meta-button" data-dashboard-cta="academy-scaling">
          Scaling Playbook
        </button>
      </article>
    </div>
  `;
}

/* ---------------------------------------------------------------------------
 *  HELPERS â€“ Alerts, Performer, Skeleton
 * ------------------------------------------------------------------------ */

function renderAlertsList(alerts) {
  if (!alerts) {
    return `<p class="card-subtitle" style="margin-top:6px;color:#6b7280;">
      Aktuell keine kritischen Warnsignale â€“ dein Account lÃ¤uft stabil.
    </p>`;
  }

  const items = Array.isArray(alerts.items)
    ? alerts.items
    : [
        ...(alerts.red || []),
        ...(alerts.yellow || []),
        ...(alerts.green || []),
      ];

  if (!items.length) {
    return `<p class="card-subtitle" style="margin-top:6px;color:#6b7280;">
      Aktuell keine kritischen Warnsignale â€“ dein Account lÃ¤uft stabil.
    </p>`;
  }

  return `
    <ul style="margin:8px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;">
      ${items
        .slice(0, 3)
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
            sev === "critical" ? "ðŸš¨" : sev === "warning" ? "âš ï¸" : "â„¹ï¸";

          return `
            <li style="display:flex;gap:8px;align-items:flex-start;">
              <span style="font-size:0.9rem;">${emoji}</span>
              <div>
                <div style="font-size:0.8rem;font-weight:600;">
                  ${escapeHtml(a.title || a.label || "Signal")}
                </div>
                ${
                  a.message || a.text
                    ? `<div style="font-size:0.78rem;color:#6b7280;">
                        ${escapeHtml(a.message || a.text)}
                       </div>`
                    : ""
                }
              </div>
            </li>
          `;
        })
        .join("")}
    </ul>
  `;
}

function renderPerformerRow(label, entity, tone) {
  const name = entity?.name || entity?.title || "Unbenannt";
  const roas = entity?.roas ?? entity?.metrics?.roas ?? null;
  const spend = entity?.spend ?? entity?.metrics?.spend ?? null;
  const color =
    tone === "good" ? "#16a34a" : tone === "bad" ? "#b91c1c" : "#6b7280";

  return `
    <div style="display:flex;flex-direction:column;gap:2px;padding:6px 0;border-bottom:1px dashed rgba(148,163,184,0.35);">
      <div style="display:flex;justify-content:space-between;gap:8px;">
        <span style="font-size:0.78rem;color:${color};text-transform:uppercase;letter-spacing:0.12em;">
          ${escapeHtml(label)}
        </span>
        <span style="font-size:0.78rem;color:#6b7280;">
          ROAS ${formatRoas(roas)} â€¢ ${formatCurrency(spend)}
        </span>
      </div>
      <div style="font-size:0.86rem;font-weight:500;color:#0f172a;">
        ${escapeHtml(name)}
      </div>
    </div>
  `;
}

function skeletonLine() {
  return `
    <div style="
      height: 12px;
      border-radius: 999px;
      background: linear-gradient(90deg,#e5e7eb,#f1f5f9,#e5e7eb);
      background-size: 200% 100%;
      animation: dashboard-skeleton 1s ease-in-out infinite;
    "></div>
  `;
}

function skeletonPill() {
  return `
    <div style="
      height: 22px;
      width: 70%;
      border-radius: 999px;
      margin-top: 6px;
      background: linear-gradient(90deg,#e5e7eb,#f1f5f9,#e5e7eb);
      background-size: 200% 100%;
      animation: dashboard-skeleton 1s ease-in-out infinite;
    "></div>
  `;
}

/* ---------------------------------------------------------------------------
 *  INTERACTION â€“ Tabs & CTAs
 * ------------------------------------------------------------------------ */

function wireTabs(rootEl) {
  const tabs = Array.from(rootEl.querySelectorAll(".dashboard-tab"));
  const panels = Array.from(rootEl.querySelectorAll(".dashboard-panel"));

  if (!tabs.length || !panels.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      if (!target) return;

      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");

      panels.forEach((panel) => {
        const key = panel.getAttribute("data-panel");
        if (key === target) {
          panel.classList.add("active");
        } else {
          panel.classList.remove("active");
        }
      });
    });
  });
}

function wireCTAs(rootEl, AppState) {
  const navigateTo = window.SignalOne?.navigateTo;
  const showToast = window.SignalOne?.showToast;

  rootEl.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-dashboard-cta]");
    if (!btn) return;

    const action = btn.getAttribute("data-dashboard-cta");
    switch (action) {
      case "sensei":
        navigateTo?.("sensei");
        break;
      case "testing":
        navigateTo?.("testingLog");
        break;
      case "creatives":
        navigateTo?.("creativeLibrary");
        break;
      case "campaigns":
        navigateTo?.("campaigns");
        break;

      // Academy Platzhalter â€“ hier spÃ¤ter eigenes Modul anbinden
      case "academy-meta":
      case "academy-hooks":
      case "academy-testing":
      case "academy-scaling":
        if (showToast) {
          showToast(
            "Die SignalOne Academy wird als eigenes Modul ergÃ¤nzt â€“ dieses Tab ist der Einstieg.",
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
 *  SMALL HELPERS
 * ------------------------------------------------------------------------ */

function getBrandName(AppState) {
  return (
    AppState?.currentBrand?.name ||
    AppState?.brand?.name ||
    AppState?.meta?.accountName ||
    "Deine Brand"
  );
}

function computeLaunchScore(AppState) {
  let score = 60;

  if (AppState?.metaConnected) score += 20;
  if (AppState?.meta?.mode === "live") score += 10;
  if (AppState?.settings?.demoMode === false) score += 5;

  if (score > 100) score = 100;
  if (score < 10) score = 10;
  return Math.round(score);
}

function formatCurrency(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "â‚¬0";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRoas(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n <= 0) return "â€“";
  return `${n.toFixed(1)}x`;
}

function formatPercent(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "â€“";
  const perc = n > 1 ? n : n * 100;
  return `${perc.toFixed(1)}%`;
}

function formatInt(v) {
  const n = Number(v || 0);
  if (!Number.isFinite(n) || n === 0) return "â€“";
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

/* Skeleton Animation (re-uses existing fadeInUp keyframes) */
const skeletonStyleId = "dashboard-skeleton-style";
if (typeof document !== "undefined" && !document.getElementById(skeletonStyleId)) {
  const style = document.createElement("style");
  style.id = skeletonStyleId;
  style.textContent = `
    @keyframes dashboard-skeleton {
      0% { background-position: 0% 50%; }
      100% { background-position: 100% 50%; }
    }
  `;
  document.head.appendChild(style);
}
