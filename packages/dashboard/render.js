/*
 * packages/dashboard/render.js
 * Rendert das Dashboard HTML basierend auf dem berechneten Model.
 * Nutzt bewusst die existierenden CSS-Klassen (card, kpi-grid, kpi-item, kpi-badge, dashboard-grid, dashboard-section),
 * damit styles.css NICHT angepasst werden muss.
 */

import { computeDashboardModel } from "./compute.js";

/* Format-Helper */

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value, fractionDigits = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + suffix
  );
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + " %"
  );
}

/* HERO KPIs */

function renderHeroKpis(heroKpis) {
  if (!heroKpis || !heroKpis.length) return "";

  return `
    <div class="card dashboard-card" style="margin-bottom:18px;">
      <div class="card-header" style="align-items:flex-end;">
        <div>
          <h3 class="card-title">Account Mission Control</h3>
          <p class="card-subtitle">
            Auf einen Blick: Läuft alles? Wo brennt's? Was musst du HEUTE tun?
          </p>
        </div>
      </div>
      <div class="kpi-grid">
        ${heroKpis
          .map((kpi) => {
            const badgeClass =
              kpi.status === "good"
                ? "kpi-badge good"
                : kpi.status === "critical"
                ? "kpi-badge critical"
                : kpi.status === "warning"
                ? "kpi-badge warning"
                : "kpi-badge";

            const value =
              kpi.unit === "currency"
                ? formatCurrency(kpi.value)
                : kpi.unit === "multiplier"
                ? formatNumber(kpi.value, 1, "x")
                : formatNumber(kpi.value, 0, "");

            const trendIcon =
              kpi.trendDirection === "up"
                ? "▲"
                : kpi.trendDirection === "down"
                ? "▼"
                : "•";

            return `
              <div class="kpi-item">
                <div class="kpi-label">${kpi.label}</div>
                <div style="display:flex;align-items:baseline;justify-content:space-between;gap:10px;">
                  <div class="kpi-value" style="font-size:1.4rem;">
                    ${value}
                  </div>
                  <div class="${badgeClass}" style="gap:4px;display:inline-flex;align-items:center;">
                    <span style="font-size:0.8rem;">${trendIcon}</span>
                    <span>${kpi.trendLabel}</span>
                  </div>
                </div>
                <div class="kpi-meta" style="font-size:0.76rem;color:var(--color-text-muted);margin-top:2px;">
                  ${kpi.description}
                </div>
              </div>
            `;
          })
          .join("")}
      </div>
    </div>
  `;
}

/* PERFORMANCE TREND */

function renderPerformance(performance) {
  if (!performance || !performance.items || !performance.items.length) return "";

  const maxRoas = performance.items.reduce(
    (m, d) => (d.roas > m ? d.roas : m),
    0
  );

  const rows = performance.items
    .map((d) => {
      const width = maxRoas ? Math.max(10, Math.round((d.roas / maxRoas) * 100)) : 50;
      return `
        <div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
          <div style="width:20px;font-size:0.78rem;color:var(--color-text-soft);">
            ${d.label}
          </div>
          <div style="flex:1;">
            <div
              style="
                height:8px;
                border-radius:999px;
                background:linear-gradient(90deg,#e5e7eb,#cbd5f5);
                overflow:hidden;
              "
            >
              <div
                style="
                  width:${width}%;
                  height:100%;
                  border-radius:inherit;
                  background:linear-gradient(90deg,#22c55e,#4f46e5);
                "
              ></div>
            </div>
          </div>
          <div style="width:44px;text-align:right;font-size:0.8rem;font-variant-numeric:tabular-nums;">
            ${formatNumber(d.roas, 1, "x")}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Performance-Tendenz (letzte 7 Tage)</h3>
          <p class="card-subtitle">
            Zeigt, ob dein ROAS Momentum gewinnt oder verliert.
          </p>
        </div>
      </div>
      <div style="margin-top:6px;">
        ${rows}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:10px;font-size:0.78rem;color:var(--color-text-soft);">
        <span>Spend (7d): <strong>${formatCurrency(
          performance.summary.spend7d
        )}</strong></span>
        <span>Conversions (7d): <strong>${performance.summary.conversions7d.toLocaleString(
          "de-DE"
        )}</strong></span>
      </div>
    </div>
  `;
}

/* ALERT-STRIP GANZ OBEN */

function renderAlertsStrip(alerts) {
  if (!alerts) return "";

  let bg, border, textColor, icon, label;
  if (alerts.overall === "critical") {
    bg = "rgba(248,113,113,0.12)";
    border = "rgba(248,113,113,0.8)";
    textColor = "#991b1b";
    icon = "🚨";
    label = "Kritischer Zustand";
  } else if (alerts.overall === "warning") {
    bg = "rgba(234,179,8,0.14)";
    border = "rgba(234,179,8,0.8)";
    textColor = "#92400e";
    icon = "⚠️";
    label = "Warnsignale aktiv";
  } else {
    bg = "rgba(22,163,74,0.08)";
    border = "rgba(22,163,74,0.7)";
    textColor = "#166534";
    icon = "🟢";
    label = "Alles stabil";
  }

  const detailLine = alerts.items
    .map((a) => `${a.label}: ${a.message}`)
    .slice(0, 2)
    .join(" • ");

  return `
    <div
      style="
        margin-bottom:14px;
        padding:8px 14px;
        border-radius:999px;
        border:1px solid ${border};
        background:${bg};
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        font-size:0.8rem;
      "
    >
      <div style="display:flex;align-items:center;gap:6px;color:${textColor};font-weight:600;">
        <span>${icon}</span>
        <span style="text-transform:uppercase;letter-spacing:0.12em;font-size:0.74rem;">
          ${label}
        </span>
      </div>
      <div style="flex:1;text-align:right;color:var(--color-text-soft);font-size:0.78rem;">
        ${detailLine || "Keine aktiven Warnungen."}
      </div>
    </div>
  `;
}

/* ALERTS CARD */

function renderAlertsCard(alerts) {
  if (!alerts || !alerts.items || !alerts.items.length) return "";

  const itemsHtml = alerts.items
    .map((a) => {
      const icon =
        a.severity === "critical"
          ? "🚨"
          : a.severity === "warning"
          ? "⚠️"
          : "🟢";
      const color =
        a.severity === "critical"
          ? "#b91c1c"
          : a.severity === "warning"
          ? "#92400e"
          : "#15803d";

      return `
        <li style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">
          <div style="width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:0.9rem;">
            ${icon}
          </div>
          <div>
            <div style="font-size:0.8rem;font-weight:600;color:${color};">
              ${a.label}
            </div>
            <div style="font-size:0.78rem;color:var(--color-text-soft);">
              ${a.message}
            </div>
          </div>
        </li>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card">
      <div class="card-header">
        <div>
          <h3 class="card-title">Alerts & Checks</h3>
          <p class="card-subtitle">
            Automatische SignalOne-Checks über alle Kampagnen.
          </p>
        </div>
      </div>
      <ul style="list-style:none;margin:0;padding:0;">
        ${itemsHtml}
      </ul>
      <div style="margin-top:8px;font-size:0.76rem;color:var(--color-text-muted);">
        Später: echte Alert-Engine mit Webhooks, Slack & E-Mail.
      </div>
    </div>
  `;
}

/* TOP CREATIVES */

function renderTopCreatives(topCreatives) {
  if (!topCreatives || !topCreatives.length) return "";

  return `
    <div class="card dashboard-card">
      <div class="card-header">
        <h3 class="card-title">Top 5 Creatives (30 Tage)</h3>
        <p class="card-subtitle">
          Zeigt, was gerade wirklich funktioniert – Demo verhält sich wie echte Library.
        </p>
      </div>
      <table class="table-mini">
        <thead>
          <tr>
            <th>Creative</th>
            <th>Typ</th>
            <th>ROAS</th>
            <th>Spend</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          ${topCreatives
            .map(
              (c) => `
            <tr>
              <td>${c.name}</td>
              <td>${c.type}</td>
              <td>${formatNumber(c.roas, 1, "x")}</td>
              <td>${formatCurrency(c.spend)}</td>
              <td>${formatPercent(c.ctr * 100, 1)}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* BUDGET STATUS */

function renderBudgetStatus(budgetRows) {
  if (!budgetRows || !budgetRows.length) return "";

  const rows = budgetRows
    .map((row) => {
      const pct = Math.round(row.ratio * 100);
      const width = Math.max(5, Math.min(100, pct));
      let barColor = "linear-gradient(90deg,#22c55e,#16a34a)";
      if (row.status === "warning") {
        barColor = "linear-gradient(90deg,#facc15,#eab308)";
      } else if (row.status === "critical") {
        barColor = "linear-gradient(90deg,#fb7185,#e11d48)";
      }

      return `
        <div style="margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px;">
            <span>${row.name}</span>
            <span>
              ${formatCurrency(row.spend)} /
              ${formatCurrency(row.monthlyBudget)}
              (${pct}%)
            </span>
          </div>
          <div
            style="
              width:100%;
              height:8px;
              border-radius:999px;
              background:#e5e7eb;
              overflow:hidden;
            "
          >
            <div
              style="
                width:${width}%;
                height:100%;
                border-radius:inherit;
                background:${barColor};
              "
            ></div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card">
      <div class="card-header">
        <h3 class="card-title">Budget-Status (Monat)</h3>
        <p class="card-subtitle">
          Verhindert Budget-Überläufe und zeigt, wo nachgeladen werden muss.
        </p>
      </div>
      <div>
        ${rows}
      </div>
    </div>
  `;
}

/* SENSEI BOX */

function renderSenseiBox(sensei, brandName) {
  if (!sensei) return "";

  const label = brandName ? `Sensei Insight für ${brandName}` : "Sensei Insight";

  return `
    <div class="card dashboard-card" style="margin-top:16px;">
      <div class="card-header">
        <h3 class="card-title">${label}</h3>
      </div>
      <div style="font-size:0.86rem;color:var(--color-text-main);line-height:1.6;">
        <p>${sensei.text}</p>
      </div>
      <div style="margin-top:10px;display:flex;justify-content:flex-end;">
        <button
          type="button"
          class="meta-button"
          data-target="${sensei.ctaTarget || "testingLog"}"
          id="senseiCtaButton"
        >
          ${sensei.ctaLabel || "Nächsten Schritt öffnen"}
        </button>
      </div>
    </div>
  `;
}

/* HAUPT-RENDERFUNKTION */

export function renderDashboard(section, appState, demoModeActive) {
  const model = computeDashboardModel(appState, demoModeActive);
  const {
    brand,
    heroKpis,
    performance,
    alerts,
    topCreatives,
    budgetStatus,
    senseiInsight,
  } = model;

  const brandLine = brand
    ? `${brand.name} • ${brand.vertical}`
    : "SignalOne Demo-Workspace";

  const statusStripHtml = renderAlertsStrip(alerts);
  const heroHtml = renderHeroKpis(heroKpis);
  const perfHtml = renderPerformance(performance);
  const alertsCardHtml = renderAlertsCard(alerts);
  const topCreativesHtml = renderTopCreatives(topCreatives);
  const budgetHtml = renderBudgetStatus(budgetStatus);
  const senseiHtml = renderSenseiBox(senseiInsight, brand?.name || null);

  section.innerHTML = `
    <div class="view-header">
      <div>
        <h2>SignalOne Performance Dashboard</h2>
        <p class="view-header-sub">
          ${brandLine}
        </p>
      </div>
    </div>

    ${statusStripHtml}

    ${heroHtml}

    <div class="dashboard-grid">
      ${perfHtml}
      ${alertsCardHtml}
    </div>

    <div class="dashboard-section">
      ${topCreativesHtml}
      ${budgetHtml}
    </div>

    ${senseiHtml}
  `;

  // Sensei CTA → Navigation
  const senseiBtn = section.querySelector("#senseiCtaButton");
  if (
    senseiBtn &&
    window.SignalOne &&
    typeof window.SignalOne.navigateTo === "function"
  ) {
    senseiBtn.addEventListener("click", () => {
      const target = senseiBtn.getAttribute("data-target") || "testingLog";
      window.SignalOne.navigateTo(target);
    });
  }
}
