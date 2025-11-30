/*
 * packages/dashboard/render.js
 * Rendert das Dashboard HTML basierend auf dem berechneten Model.
 * Stil: D3 – Finance × Performance Hybrid mit leichtem „Money-Glow“.
 *
 * computeDashboardModel liefert:
 * { brand, financials, heroKpis, performance, alerts, topCreatives, budgetStatus, senseiInsight }
 */

import { computeDashboardModel } from "./compute.js";

/* =========================
   Format-Helper
   ========================= */

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

/* =========================
   HERO KPIs – Money Engine
   ========================= */

function renderHeroKpis(heroKpis) {
  if (!heroKpis || !heroKpis.length) return "";

  return `
    <div
      class="card dashboard-card"
      style="
        margin-bottom:22px;
        padding-top:18px;
        padding-bottom:18px;
        background:
          radial-gradient(circle at 0% 0%, rgba(255,255,255,0.98), rgba(241,245,249,0.98)),
          linear-gradient(135deg, rgba(55,65,81,0.08), rgba(15,23,42,0.04));
        box-shadow:
          0 26px 70px rgba(15,23,42,0.35),
          0 0 0 1px rgba(148,163,184,0.55),
          0 0 0 1px rgba(255,255,255,0.85) inset;
      "
    >
      <div
        class="card-header"
        style="
          align-items:flex-end;
          margin-bottom:12px;
          padding-bottom:8px;
          border-bottom:1px solid rgba(148,163,184,0.35);
        "
      >
        <div>
          <div
            style="
              font-size:0.76rem;
              letter-spacing:0.16em;
              text-transform:uppercase;
              color:var(--color-text-soft);
              margin-bottom:4px;
            "
          >
            Account Mission Control
          </div>
          <h3
            class="card-title"
            style="
              font-size:1.1rem;
              letter-spacing:0.08em;
              text-transform:uppercase;
            "
          >
            Profit · Spend · ROAS · Risiko
          </h3>
        </div>
        <div
          style="
            text-align:right;
            font-size:0.76rem;
            color:var(--color-text-soft);
          "
        >
          <div>Standard-Range: Letzte 30 Tage</div>
          <div>Währung: EUR · Zeitzone: Europe/Berlin</div>
        </div>
      </div>

      <div class="kpi-grid">
        ${heroKpis
          .map((kpi, idx) => {
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

            const accent =
              idx === 2 || idx === 3
                ? "rgba(15,118,110,0.1)"
                : "rgba(15,23,42,0.02)";

            return `
              <div
                class="kpi-item"
                style="
                  position:relative;
                  padding-top:10px;
                  padding-bottom:10px;
                  border-radius:16px;
                  background:radial-gradient(
                    circle at 0% 0%,
                    ${accent},
                    transparent 60%
                  );
                  box-shadow:0 0 0 1px rgba(148,163,184,0.18);
                "
              >
                <div
                  style="
                    font-size:0.75rem;
                    letter-spacing:0.16em;
                    text-transform:uppercase;
                    color:var(--color-text-soft);
                    margin-bottom:4px;
                  "
                  class="kpi-label"
                >
                  ${kpi.label}
                </div>

                <div
                  style="
                    display:flex;
                    align-items:flex-end;
                    justify-content:space-between;
                    gap:12px;
                  "
                >
                  <div
                    class="kpi-value"
                    style="
                      font-size:1.7rem;
                      font-weight:700;
                      letter-spacing:0.02em;
                      font-variant-numeric:tabular-nums;
                    "
                  >
                    ${value}
                  </div>

                  <div
                    style="
                      display:flex;
                      flex-direction:column;
                      align-items:flex-end;
                      gap:4px;
                      min-width:82px;
                    "
                  >
                    <div
                      class="${badgeClass}"
                      style="
                        gap:4px;
                        display:inline-flex;
                        align-items:center;
                        padding-inline:8px;
                        padding-block:3px;
                        font-size:0.76rem;
                        border-radius:999px;
                      "
                    >
                      <span style="font-size:0.8rem;">${trendIcon}</span>
                      <span>${kpi.trendLabel}</span>
                    </div>
                    <div
                      style="
                        font-size:0.7rem;
                        color:var(--color-text-muted);
                        text-transform:uppercase;
                        letter-spacing:0.14em;
                      "
                    >
                      vs. Vormonat
                    </div>
                  </div>
                </div>

                <div
                  class="kpi-meta"
                  style="
                    margin-top:6px;
                    font-size:0.78rem;
                    color:var(--color-text-muted);
                  "
                >
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

/* =========================
   PERFORMANCE – 7d Pulse
   ========================= */

function renderPerformance(performance) {
  if (!performance || !performance.items || !performance.items.length) return "";

  const maxRoas = performance.items.reduce(
    (m, d) => (d.roas > m ? d.roas : m),
    0
  );

  const rows = performance.items
    .map((d) => {
      const width = maxRoas ? Math.max(12, Math.round((d.roas / maxRoas) * 100)) : 50;
      return `
        <div
          style="
            display:flex;
            align-items:center;
            gap:10px;
            margin:5px 0;
          "
        >
          <div
            style="
              width:22px;
              font-size:0.8rem;
              color:var(--color-text-soft);
            "
          >
            ${d.label}
          </div>

          <div style="flex:1;">
            <div
              style="
                height:10px;
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
                  box-shadow:0 0 18px rgba(34,197,94,0.5);
                "
              ></div>
            </div>
          </div>

          <div
            style="
              width:52px;
              text-align:right;
              font-size:0.82rem;
              font-variant-numeric:tabular-nums;
            "
          >
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
          <h3 class="card-title">Performance-Tendenz (7 Tage)</h3>
          <p class="card-subtitle">
            Puls deines Accounts – ROAS-Bewegung über die letzten Tage.
          </p>
        </div>
        <div
          style="
            font-size:0.74rem;
            color:var(--color-text-soft);
            text-align:right;
          "
        >
          <div>ROAS-Balken · E-Com Fokus</div>
          <div>Spend & Conversions in Summe unten</div>
        </div>
      </div>

      <div style="margin-top:4px;">
        ${rows}
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          margin-top:12px;
          font-size:0.78rem;
          color:var(--color-text-soft);
        "
      >
        <span>
          Spend (7d):
          <strong>${formatCurrency(performance.summary.spend7d)}</strong>
        </span>
        <span>
          Conversions (7d):
          <strong>${performance.summary.conversions7d.toLocaleString(
            "de-DE"
          )}</strong>
        </span>
      </div>
    </div>
  `;
}

/* =========================
   ALERT-STRIP OBEN
   ========================= */

function renderAlertsStrip(alerts) {
  if (!alerts) return "";

  let bg, border, textColor, icon, label, glow;
  if (alerts.overall === "critical") {
    bg = "linear-gradient(90deg, rgba(248,113,113,0.18), rgba(248,113,113,0.06))";
    border = "rgba(248,113,113,0.9)";
    textColor = "#7f1d1d";
    icon = "🚨";
    label = "Kritischer Zustand";
    glow = "0 0 32px rgba(248,113,113,0.65)";
  } else if (alerts.overall === "warning") {
    bg = "linear-gradient(90deg, rgba(234,179,8,0.18), rgba(234,179,8,0.05))";
    border = "rgba(234,179,8,0.9)";
    textColor = "#78350f";
    icon = "⚠️";
    label = "Warnsignale aktiv";
    glow = "0 0 28px rgba(234,179,8,0.6)";
  } else {
    bg = "linear-gradient(90deg, rgba(34,197,94,0.18), rgba(34,197,94,0.05))";
    border = "rgba(34,197,94,0.85)";
    textColor = "#14532d";
    icon = "🟢";
    label = "Alles stabil";
    glow = "0 0 28px rgba(34,197,94,0.55)";
  }

  const detailLine = alerts.items
    .map((a) => `${a.label}: ${a.message}`)
    .slice(0, 2)
    .join(" • ");

  return `
    <div
      style="
        margin-bottom:18px;
        padding:9px 16px;
        border-radius:999px;
        border:1px solid ${border};
        background:${bg};
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        font-size:0.82rem;
        box-shadow:${glow};
      "
    >
      <div
        style="
          display:flex;
          align-items:center;
          gap:8px;
          color:${textColor};
        "
      >
        <span style="font-size:1.1rem;">${icon}</span>
        <span
          style="
            text-transform:uppercase;
            letter-spacing:0.16em;
            font-size:0.75rem;
            font-weight:600;
          "
        >
          ${label}
        </span>
      </div>
      <div
        style="
          flex:1;
          text-align:right;
          color:var(--color-text-soft);
          font-size:0.8rem;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        "
      >
        ${detailLine || "Keine aktiven Warnungen."}
      </div>
    </div>
  `;
}

/* =========================
   ALERTS CARD
   ========================= */

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
        <li
          style="
            display:flex;
            align-items:flex-start;
            gap:8px;
            margin-bottom:8px;
          "
        >
          <div
            style="
              width:18px;
              height:18px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:0.9rem;
            "
          >
            ${icon}
          </div>
          <div>
            <div
              style="
                font-size:0.8rem;
                font-weight:600;
                color:${color};
              "
            >
              ${a.label}
            </div>
            <div
              style="
                font-size:0.78rem;
                color:var(--color-text-soft);
              "
            >
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
            Safety-Layer über deine Kampagnen – automatisch aus Account-Signalen generiert.
          </p>
        </div>
      </div>
      <ul style="list-style:none;margin:0;padding:0;">
        ${itemsHtml}
      </ul>
      <div
        style="
          margin-top:8px;
          font-size:0.76rem;
          color:var(--color-text-muted);
        "
      >
        Später: echte Alert-Engine mit Webhooks, Slack & E-Mail.
      </div>
    </div>
  `;
}

/* =========================
   TOP CREATIVES – Winner Board
   ========================= */

function renderTopCreatives(topCreatives) {
  if (!topCreatives || !topCreatives.length) return "";

  const rows = topCreatives
    .map((c, idx) => {
      const rank = idx + 1;
      const isTop = rank === 1;
      const rankColor = isTop ? "#16a34a" : "#4b5563";

      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:8px;">
              <span
                style="
                  min-width:22px;
                  text-align:center;
                  font-size:0.78rem;
                  font-weight:600;
                  color:${rankColor};
                "
              >
                #${rank}
              </span>
              <div>
                <div style="font-size:0.84rem;font-weight:600;">
                  ${c.name}
                </div>
                <div
                  style="
                    font-size:0.76rem;
                    color:var(--color-text-soft);
                  "
                >
                  ${c.type}
                </div>
              </div>
            </div>
          </td>
          <td>${formatNumber(c.roas, 1, "x")}</td>
          <td>${formatCurrency(c.spend)}</td>
          <td>${formatPercent(c.ctr * 100, 1)}</td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card">
      <div class="card-header">
        <h3 class="card-title">Top 5 Creatives (30 Tage)</h3>
        <p class="card-subtitle">
          Deine Gewinner – welche Assets aktuell am meisten Geld zurückspülen.
        </p>
      </div>
      <table class="table-mini">
        <thead>
          <tr>
            <th>Creative</th>
            <th>ROAS</th>
            <th>Spend</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}

/* =========================
   BUDGET STATUS – Finance Bars
   ========================= */

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
        <div style="margin-bottom:10px;">
          <div
            style="
              display:flex;
              justify-content:space-between;
              font-size:0.8rem;
              margin-bottom:3px;
            "
          >
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
          Zeigt, wie voll der Tank ist – bevor Kampagnen ins Leere laufen.
        </p>
      </div>
      <div>
        ${rows}
      </div>
    </div>
  `;
}

/* =========================
   SENSEI BOX – Nächster Schritt
   ========================= */

function renderSenseiBox(sensei, brandName) {
  if (!sensei) return "";

  const label = brandName ? `Sensei Insight für ${brandName}` : "Sensei Insight";

  return `
    <div
      class="card dashboard-card"
      style="
        margin-top:18px;
        border:1px solid rgba(129,140,248,0.5);
        background:radial-gradient(circle at 0% 0%, rgba(239,246,255,0.98), #ffffff);
        box-shadow:
          0 18px 52px rgba(79,70,229,0.28),
          0 0 0 1px rgba(255,255,255,0.9) inset;
      "
    >
      <div class="card-header">
        <h3 class="card-title">${label}</h3>
      </div>
      <div
        style="
          font-size:0.88rem;
          color:var(--color-text-main);
          line-height:1.7;
        "
      >
        <p>${sensei.text}</p>
      </div>
      <div
        style="
          margin-top:10px;
          display:flex;
          justify-content:flex-end;
        "
      >
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

/* =========================
   HAUPT-RENDERFUNKTION
   ========================= */

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
    ? `${brand.name} · ${brand.vertical}`
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
