/*
 * packages/dashboard/render.js
 * ELITE DASHBOARD - Teil 1/2
 * Rendert das Dashboard HTML basierend auf dem berechneten Model.
 * Stil: Premium Finance × Performance Hybrid mit Money-Glow
 */

import { computeDashboardModel } from "./compute.js";

/* =========================
   FORMAT-HELPER
   ========================= */

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value, fractionDigits = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) return "—";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + suffix
  );
}

function formatPercent(value, fractionDigits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + " %"
  );
}

/* =========================
   HERO KPIs - Money Engine
   ========================= */

function renderHeroKpis(heroKpis) {
  if (!heroKpis || !heroKpis.length) return "";

  return `
    <div
      class="card dashboard-card"
      style="
        margin-bottom:28px;
        padding:24px 28px;
        background:
          radial-gradient(ellipse at top left, rgba(249,250,251,1) 0%, rgba(241,245,249,0.98) 50%),
          linear-gradient(135deg, rgba(15,23,42,0.04) 0%, rgba(30,41,59,0.06) 100%);
        border:1px solid rgba(148,163,184,0.25);
        box-shadow:
          0 32px 88px -12px rgba(15,23,42,0.42),
          0 8px 22px -6px rgba(15,23,42,0.18),
          0 0 0 1px rgba(255,255,255,0.92) inset,
          0 1px 3px 0 rgba(15,23,42,0.08) inset;
        border-radius:20px;
        position:relative;
        overflow:hidden;
      "
    >
      <!-- Subtle Glow Overlay -->
      <div style="
        position:absolute;
        top:-50%;
        right:-30%;
        width:60%;
        height:200%;
        background:radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 70%);
        pointer-events:none;
      "></div>

      <div
        class="card-header"
        style="
          align-items:flex-end;
          margin-bottom:20px;
          padding-bottom:14px;
          border-bottom:1.5px solid rgba(148,163,184,0.22);
          position:relative;
          z-index:1;
        "
      >
        <div>
          <div
            style="
              font-size:0.68rem;
              letter-spacing:0.22em;
              text-transform:uppercase;
              color:#64748b;
              font-weight:600;
              margin-bottom:6px;
            "
          >
            🎯 Mission Control
          </div>
          <h3
            class="card-title"
            style="
              font-size:1.35rem;
              letter-spacing:0.04em;
              text-transform:uppercase;
              font-weight:800;
              background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
              -webkit-background-clip:text;
              -webkit-text-fill-color:transparent;
              background-clip:text;
            "
          >
            Profit · Spend · ROAS · Performance
          </h3>
        </div>
        <div
          style="
            text-align:right;
            font-size:0.7rem;
            color:#94a3b8;
            line-height:1.6;
          "
        >
          <div><strong>Zeitraum:</strong> Letzte 30 Tage</div>
          <div><strong>Währung:</strong> EUR · <strong>TZ:</strong> Europe/Berlin</div>
        </div>
      </div>

      <div class="kpi-grid" style="position:relative; z-index:1;">
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

            // Dynamic accent based on KPI type & status
            let accentGradient, borderGlow, statusGlow;
            if (kpi.status === "good") {
              accentGradient = "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)";
              borderGlow = "0 0 18px rgba(16,185,129,0.15)";
              statusGlow = "rgba(16,185,129,0.12)";
            } else if (kpi.status === "critical") {
              accentGradient = "linear-gradient(135deg, rgba(239,68,68,0.08) 0%, rgba(220,38,38,0.04) 100%)";
              borderGlow = "0 0 18px rgba(239,68,68,0.18)";
              statusGlow = "rgba(239,68,68,0.14)";
            } else if (kpi.status === "warning") {
              accentGradient = "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)";
              borderGlow = "0 0 18px rgba(245,158,11,0.16)";
              statusGlow = "rgba(245,158,11,0.12)";
            } else {
              accentGradient = "linear-gradient(135deg, rgba(100,116,139,0.06) 0%, rgba(71,85,105,0.03) 100%)";
              borderGlow = "0 0 0 rgba(100,116,139,0)";
              statusGlow = "rgba(100,116,139,0.08)";
            }

            return `
              <div
                class="kpi-item"
                style="
                  position:relative;
                  padding:18px 20px;
                  border-radius:18px;
                  background:
                    ${accentGradient},
                    linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.92) 100%);
                  border:1.5px solid rgba(148,163,184,0.25);
                  box-shadow:
                    ${borderGlow},
                    0 4px 12px rgba(15,23,42,0.08),
                    0 0 0 1px rgba(255,255,255,0.8) inset;
                  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                "
                onmouseover="this.style.transform='translateY(-3px)'; this.style.boxShadow='${borderGlow}, 0 8px 24px rgba(15,23,42,0.14), 0 0 0 1px rgba(255,255,255,0.9) inset';"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='${borderGlow}, 0 4px 12px rgba(15,23,42,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset';"
              >
                <!-- Status Indicator Dot -->
                <div style="
                  position:absolute;
                  top:14px;
                  right:14px;
                  width:8px;
                  height:8px;
                  border-radius:50%;
                  background:${statusGlow};
                  box-shadow:0 0 12px ${statusGlow}, 0 0 6px ${statusGlow};
                  animation: pulse-glow 2s ease-in-out infinite;
                "></div>

                <div
                  style="
                    font-size:0.72rem;
                    letter-spacing:0.18em;
                    text-transform:uppercase;
                    color:#64748b;
                    font-weight:700;
                    margin-bottom:10px;
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
                    gap:14px;
                    margin-bottom:12px;
                  "
                >
                  <div
                    class="kpi-value"
                    style="
                      font-size:2.1rem;
                      font-weight:800;
                      letter-spacing:-0.02em;
                      font-variant-numeric:tabular-nums;
                      background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
                      -webkit-background-clip:text;
                      -webkit-text-fill-color:transparent;
                      background-clip:text;
                      line-height:1;
                    "
                  >
                    ${value}
                  </div>

                  <div
                    style="
                      display:flex;
                      flex-direction:column;
                      align-items:flex-end;
                      gap:5px;
                      min-width:88px;
                    "
                  >
                    <div
                      class="${badgeClass}"
                      style="
                        gap:5px;
                        display:inline-flex;
                        align-items:center;
                        padding:5px 11px;
                        font-size:0.78rem;
                        font-weight:700;
                        border-radius:999px;
                        box-shadow:0 2px 8px rgba(15,23,42,0.12);
                      "
                    >
                      <span style="font-size:0.85rem;">${trendIcon}</span>
                      <span>${kpi.trendLabel}</span>
                    </div>
                    <div
                      style="
                        font-size:0.68rem;
                        color:#94a3b8;
                        text-transform:uppercase;
                        letter-spacing:0.16em;
                        font-weight:600;
                      "
                    >
                      vs. Vormonat
                    </div>
                  </div>
                </div>

                <div
                  class="kpi-meta"
                  style="
                    font-size:0.8rem;
                    color:#64748b;
                    line-height:1.5;
                    padding-top:10px;
                    border-top:1px solid rgba(148,163,184,0.15);
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

    <style>
      @keyframes pulse-glow {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.1); }
      }
    </style>
  `;
}

/* =========================
   ALERT-STRIP OBEN
   ========================= */

function renderAlertsStrip(alerts) {
  if (!alerts) return "";

  let bg, border, textColor, icon, label, glow, pulseAnimation;
  if (alerts.overall === "critical") {
    bg = "linear-gradient(135deg, rgba(248,113,113,0.15) 0%, rgba(239,68,68,0.08) 50%, rgba(220,38,38,0.05) 100%)";
    border = "rgba(239,68,68,0.45)";
    textColor = "#991b1b";
    icon = "🚨";
    label = "Kritischer Zustand";
    glow = "0 0 48px rgba(239,68,68,0.35), 0 8px 24px rgba(239,68,68,0.2)";
    pulseAnimation = "pulse-critical 2s ease-in-out infinite";
  } else if (alerts.overall === "warning") {
    bg = "linear-gradient(135deg, rgba(250,204,21,0.15) 0%, rgba(245,158,11,0.08) 50%, rgba(217,119,6,0.05) 100%)";
    border = "rgba(245,158,11,0.45)";
    textColor = "#92400e";
    icon = "⚠️";
    label = "Warnsignale aktiv";
    glow = "0 0 42px rgba(245,158,11,0.32), 0 8px 24px rgba(245,158,11,0.18)";
    pulseAnimation = "pulse-warning 2.5s ease-in-out infinite";
  } else {
    bg = "linear-gradient(135deg, rgba(74,222,128,0.15) 0%, rgba(34,197,94,0.08) 50%, rgba(22,163,74,0.05) 100%)";
    border = "rgba(34,197,94,0.4)";
    textColor = "#14532d";
    icon = "🟢";
    label = "Alles stabil";
    glow = "0 0 38px rgba(34,197,94,0.28), 0 8px 24px rgba(34,197,94,0.16)";
    pulseAnimation = "pulse-good 3s ease-in-out infinite";
  }

  const detailLine = alerts.items
    .map((a) => `${a.label}: ${a.message}`)
    .slice(0, 2)
    .join(" • ");

  return `
    <div
      style="
        margin-bottom:24px;
        padding:12px 22px;
        border-radius:999px;
        border:2px solid ${border};
        background:${bg};
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
        font-size:0.84rem;
        box-shadow:
          ${glow},
          0 0 0 1px rgba(255,255,255,0.6) inset;
        animation: ${pulseAnimation};
        backdrop-filter: blur(8px);
        position:relative;
        overflow:hidden;
      "
    >
      <!-- Animated Background Shimmer -->
      <div style="
        position:absolute;
        top:0;
        left:-100%;
        width:200%;
        height:100%;
        background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%);
        animation: shimmer 3s linear infinite;
      "></div>

      <div
        style="
          display:flex;
          align-items:center;
          gap:12px;
          color:${textColor};
          position:relative;
          z-index:1;
        "
      >
        <span style="
          font-size:1.3rem;
          animation: icon-bounce 1.5s ease-in-out infinite;
        ">${icon}</span>
        <span
          style="
            text-transform:uppercase;
            letter-spacing:0.18em;
            font-size:0.76rem;
            font-weight:800;
          "
        >
          ${label}
        </span>
      </div>
      <div
        style="
          flex:1;
          text-align:right;
          color:${textColor};
          font-size:0.82rem;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          font-weight:500;
          position:relative;
          z-index:1;
        "
      >
        ${detailLine || "Keine aktiven Warnungen."}
      </div>
    </div>

    <style>
      @keyframes pulse-critical {
        0%, 100% { 
          box-shadow: ${glow};
          transform: scale(1);
        }
        50% { 
          box-shadow: 0 0 58px rgba(239,68,68,0.45), 0 12px 32px rgba(239,68,68,0.28);
          transform: scale(1.008);
        }
      }
      @keyframes pulse-warning {
        0%, 100% { 
          box-shadow: ${glow};
        }
        50% { 
          box-shadow: 0 0 52px rgba(245,158,11,0.42), 0 12px 32px rgba(245,158,11,0.25);
        }
      }
      @keyframes pulse-good {
        0%, 100% { 
          box-shadow: ${glow};
        }
        50% { 
          box-shadow: 0 0 48px rgba(34,197,94,0.36), 0 12px 32px rgba(34,197,94,0.22);
        }
      }
      @keyframes shimmer {
        0% { left: -100%; }
        100% { left: 100%; }
      }
      @keyframes icon-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
    </style>
  `;
}
/* =========================
   PERFORMANCE - 7d Pulse
   ========================= */

function renderPerformance(performance) {
  if (!performance || !performance.items || !performance.items.length) return "";

  const maxRoas = performance.items.reduce(
    (m, d) => (d.roas > m ? d.roas : m),
    0
  );

  const rows = performance.items
    .map((d, idx) => {
      const width = maxRoas ? Math.max(8, Math.round((d.roas / maxRoas) * 100)) : 50;
      
      // Gradient based on performance
      let barGradient;
      if (d.roas >= maxRoas * 0.9) {
        barGradient = "linear-gradient(90deg, #10b981 0%, #059669 100%)";
      } else if (d.roas >= maxRoas * 0.7) {
        barGradient = "linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)";
      } else {
        barGradient = "linear-gradient(90deg, #f59e0b 0%, #d97706 100%)";
      }

      return `
        <div
          style="
            display:flex;
            align-items:center;
            gap:12px;
            margin:8px 0;
            transition: all 0.2s ease;
          "
          onmouseover="this.style.transform='translateX(4px)';"
          onmouseout="this.style.transform='translateX(0)';"
        >
          <div
            style="
              width:28px;
              font-size:0.82rem;
              font-weight:700;
              color:#475569;
              text-align:center;
            "
          >
            ${d.label}
          </div>

          <div style="flex:1; position:relative;">
            <!-- Background Track -->
            <div
              style="
                height:14px;
                border-radius:999px;
                background:linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
                overflow:hidden;
                box-shadow:
                  0 0 0 1px rgba(148,163,184,0.2) inset,
                  0 2px 4px rgba(15,23,42,0.04);
              "
            >
              <!-- Animated Fill Bar -->
              <div
                style="
                  width:${width}%;
                  height:100%;
                  border-radius:inherit;
                  background:${barGradient};
                  box-shadow:
                    0 0 24px rgba(59,130,246,0.4),
                    0 2px 8px rgba(59,130,246,0.3) inset;
                  animation: bar-fill 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${idx * 0.08}s backwards;
                  position:relative;
                  overflow:hidden;
                "
              >
                <!-- Shimmer Effect -->
                <div style="
                  position:absolute;
                  top:0;
                  left:-100%;
                  width:100%;
                  height:100%;
                  background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
                  animation: bar-shimmer 2s linear infinite;
                  animation-delay:${idx * 0.1}s;
                "></div>
              </div>
            </div>
          </div>

          <div
            style="
              min-width:58px;
              text-align:right;
              font-size:0.88rem;
              font-weight:700;
              font-variant-numeric:tabular-nums;
              color:#0f172a;
            "
          >
            ${formatNumber(d.roas, 1, "x")}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card" style="
      border:1.5px solid rgba(148,163,184,0.25);
      box-shadow:
        0 8px 24px rgba(15,23,42,0.1),
        0 0 0 1px rgba(255,255,255,0.8) inset;
      border-radius:18px;
    ">
      <div class="card-header" style="
        padding-bottom:14px;
        border-bottom:1.5px solid rgba(148,163,184,0.18);
      ">
        <div>
          <h3 class="card-title" style="
            font-size:1.15rem;
            font-weight:800;
            background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
          ">📊 Performance-Tendenz (7 Tage)</h3>
          <p class="card-subtitle" style="
            color:#64748b;
            font-size:0.82rem;
            margin-top:4px;
          ">
            ROAS-Bewegung über die Woche — erkenne Muster & Trends
          </p>
        </div>
        <div
          style="
            font-size:0.72rem;
            color:#94a3b8;
            text-align:right;
            line-height:1.6;
          "
        >
          <div><strong>Fokus:</strong> E-Commerce ROAS</div>
          <div><strong>Basis:</strong> 30d-Performance</div>
        </div>
      </div>

      <div style="margin-top:12px; padding:0 4px;">
        ${rows}
      </div>

      <div
        style="
          display:flex;
          justify-content:space-between;
          margin-top:18px;
          padding-top:14px;
          border-top:1.5px solid rgba(148,163,184,0.15);
          font-size:0.82rem;
          color:#475569;
        "
      >
        <span>
          <strong style="color:#0f172a;">Spend (7d):</strong>
          <span style="font-weight:700; color:#0f172a; margin-left:4px;">
            ${formatCurrency(performance.summary.spend7d)}
          </span>
        </span>
        <span>
          <strong style="color:#0f172a;">Conversions (7d):</strong>
          <span style="font-weight:700; color:#0f172a; margin-left:4px;">
            ${Math.round(performance.summary.conversions7d).toLocaleString("de-DE")}
          </span>
        </span>
      </div>
    </div>

    <style>
      @keyframes bar-fill {
        0% {
          width: 0;
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }
      @keyframes bar-shimmer {
        0% { left: -100%; }
        100% { left: 200%; }
      }
    </style>
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
            gap:10px;
            margin-bottom:12px;
            padding:10px;
            border-radius:10px;
            background:rgba(248,250,252,0.5);
            transition: all 0.2s ease;
          "
          onmouseover="this.style.background='rgba(241,245,249,0.8)'; this.style.transform='translateX(3px)';"
          onmouseout="this.style.background='rgba(248,250,252,0.5)'; this.style.transform='translateX(0)';"
        >
          <div
            style="
              width:22px;
              height:22px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-size:1rem;
              flex-shrink:0;
            "
          >
            ${icon}
          </div>
          <div style="flex:1;">
            <div
              style="
                font-size:0.84rem;
                font-weight:700;
                color:${color};
                margin-bottom:3px;
              "
            >
              ${a.label}
            </div>
            <div
              style="
                font-size:0.8rem;
                color:#64748b;
                line-height:1.5;
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
    <div class="card dashboard-card" style="
      border:1.5px solid rgba(148,163,184,0.25);
      box-shadow:
        0 8px 24px rgba(15,23,42,0.1),
        0 0 0 1px rgba(255,255,255,0.8) inset;
      border-radius:18px;
    ">
      <div class="card-header" style="
        padding-bottom:14px;
        border-bottom:1.5px solid rgba(148,163,184,0.18);
      ">
        <div>
          <h3 class="card-title" style="
            font-size:1.15rem;
            font-weight:800;
            background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
          ">🚨 Alerts & Checks</h3>
          <p class="card-subtitle" style="
            color:#64748b;
            font-size:0.82rem;
            margin-top:4px;
          ">
            Safety-Layer über deine Kampagnen — automatisch aus Account-Signalen
          </p>
        </div>
      </div>
      <ul style="list-style:none;margin:12px 0 0 0;padding:0;">
        ${itemsHtml}
      </ul>
      <div
        style="
          margin-top:12px;
          padding-top:12px;
          border-top:1px solid rgba(148,163,184,0.15);
          font-size:0.76rem;
          color:#94a3b8;
          font-style:italic;
        "
      >
        💡 Später: echte Alert-Engine mit Webhooks, Slack & E-Mail
      </div>
    </div>
  `;
}

/* =========================
   TOP CREATIVES - Winner Board
   ========================= */

function renderTopCreatives(topCreatives) {
  if (!topCreatives || !topCreatives.length) return "";

  const rows = topCreatives
    .map((c, idx) => {
      const rank = idx + 1;
      const isTop = rank === 1;
      const rankColor = isTop ? "#16a34a" : "#64748b";
      const rankBg = isTop ? "rgba(16,185,129,0.12)" : "rgba(100,116,139,0.08)";

      return `
        <tr style="
          transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(241,245,249,0.6)';" onmouseout="this.style.background='transparent';">
          <td style="padding:12px 8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span
                style="
                  min-width:32px;
                  height:32px;
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  text-align:center;
                  font-size:0.82rem;
                  font-weight:800;
                  color:${rankColor};
                  background:${rankBg};
                  border-radius:8px;
                "
              >
                #${rank}
              </span>
              <div>
                <div style="font-size:0.88rem;font-weight:700;color:#0f172a;">
                  ${c.name}
                </div>
                <div
                  style="
                    font-size:0.76rem;
                    color:#64748b;
                    margin-top:2px;
                  "
                >
                  ${c.type}
                </div>
              </div>
            </div>
          </td>
          <td style="padding:12px 8px; font-weight:700; color:#0f172a; font-variant-numeric:tabular-nums;">
            ${formatNumber(c.roas, 1, "x")}
          </td>
          <td style="padding:12px 8px; font-weight:700; color:#0f172a; font-variant-numeric:tabular-nums;">
            ${formatCurrency(c.spend)}
          </td>
          <td style="padding:12px 8px; font-weight:700; color:#0f172a; font-variant-numeric:tabular-nums;">
            ${formatPercent(c.ctr * 100, 1)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card" style="
      border:1.5px solid rgba(148,163,184,0.25);
      box-shadow:
        0 8px 24px rgba(15,23,42,0.1),
        0 0 0 1px rgba(255,255,255,0.8) inset;
      border-radius:18px;
    ">
      <div class="card-header" style="
        padding-bottom:14px;
        border-bottom:1.5px solid rgba(148,163,184,0.18);
      ">
        <div>
          <h3 class="card-title" style="
            font-size:1.15rem;
            font-weight:800;
            background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
          ">🏆 Top 5 Creatives (30 Tage)</h3>
          <p class="card-subtitle" style="
            color:#64748b;
            font-size:0.82rem;
            margin-top:4px;
          ">
            Deine Winner — welche Assets aktuell am meisten Geld zurückspülen
          </p>
        </div>
      </div>
      <table class="table-mini" style="
        width:100%;
        border-collapse:collapse;
        margin-top:8px;
      ">
        <thead>
          <tr style="
            border-bottom:1.5px solid rgba(148,163,184,0.15);
          ">
            <th style="
              padding:10px 8px;
              text-align:left;
              font-size:0.72rem;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.1em;
              color:#64748b;
            ">Creative</th>
            <th style="
              padding:10px 8px;
              text-align:left;
              font-size:0.72rem;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.1em;
              color:#64748b;
            ">ROAS</th>
            <th style="
              padding:10px 8px;
              text-align:left;
              font-size:0.72rem;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.1em;
              color:#64748b;
            ">Spend</th>
            <th style="
              padding:10px 8px;
              text-align:left;
              font-size:0.72rem;
              font-weight:700;
              text-transform:uppercase;
              letter-spacing:0.1em;
              color:#64748b;
            ">CTR</th>
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
   BUDGET STATUS - Finance Bars
   ========================= */

function renderBudgetStatus(budgetRows) {
  if (!budgetRows || !budgetRows.length) return "";

  const rows = budgetRows
    .map((row) => {
      const pct = Math.round(row.ratio * 100);
      const width = Math.max(5, Math.min(100, pct));
      let barColor, barGlow;
      if (row.status === "warning") {
        barColor = "linear-gradient(90deg,#fbbf24,#f59e0b)";
        barGlow = "0 0 16px rgba(245,158,11,0.4)";
      } else if (row.status === "critical") {
        barColor = "linear-gradient(90deg,#fb7185,#f43f5e)";
        barGlow = "0 0 16px rgba(244,63,94,0.5)";
      } else {
        barColor = "linear-gradient(90deg,#34d399,#10b981)";
        barGlow = "0 0 16px rgba(16,185,129,0.3)";
      }

      return `
        <div style="
          margin-bottom:16px;
          padding:12px;
          border-radius:12px;
          background:rgba(248,250,252,0.5);
          transition: all 0.2s ease;
        " onmouseover="this.style.background='rgba(241,245,249,0.8)';" onmouseout="this.style.background='rgba(248,250,252,0.5)';">
          <div
            style="
              display:flex;
              justify-content:space-between;
              font-size:0.84rem;
              margin-bottom:8px;
            "
          >
            <span style="font-weight:700; color:#0f172a;">${row.name}</span>
            <span style="font-weight:700; color:#475569; font-variant-numeric:tabular-nums;">
              ${formatCurrency(row.spend)} / ${formatCurrency(row.monthlyBudget)}
              <span style="color:#94a3b8; margin-left:4px;">(${pct}%)</span>
            </span>
          </div>
          <div
            style="
              width:100%;
              height:10px;
              border-radius:999px;
              background:linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
              overflow:hidden;
              box-shadow:0 0 0 1px rgba(148,163,184,0.2) inset;
            "
          >
            <div
              style="
                width:${width}%;
                height:100%;
                border-radius:inherit;
                background:${barColor};
                box-shadow:${barGlow};
                transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
              "
            ></div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="card dashboard-card" style="
      border:1.5px solid rgba(148,163,184,0.25);
      box-shadow:
        0 8px 24px rgba(15,23,42,0.1),
        0 0 0 1px rgba(255,255,255,0.8) inset;
      border-radius:18px;
    ">
      <div class="card-header" style="
        padding-bottom:14px;
        border-bottom:1.5px solid rgba(148,163,184,0.18);
      ">
        <div>
          <h3 class="card-title" style="
            font-size:1.15rem;
            font-weight:800;
            background:linear-gradient(135deg, #0f172a 0%, #334155 100%);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
          ">💳 Budget-Status (Monat)</h3>
          <p class="card-subtitle" style="
            color:#64748b;
            font-size:0.82rem;
            margin-top:4px;
          ">
            Tank-Anzeige pro Brand — bevor Kampagnen ins Leere laufen
          </p>
        </div>
      </div>
      <div style="margin-top:12px;">
        ${rows}
      </div>
    </div>
  `;
}

/* =========================
   SENSEI BOX - Nächster Schritt
   ========================= */

function renderSenseiBox(sensei, brandName) {
  if (!sensei) return "";

  const label = brandName ? `🧠 Sensei Insight für ${brandName}` : "🧠 Sensei Insight";

  return `
    <div
      class="card dashboard-card"
      style="
        margin-top:28px;
        padding:24px 28px;
        border:2px solid rgba(129,140,248,0.35);
        background:
          radial-gradient(ellipse at top left, rgba(239,246,255,1) 0%, rgba(224,231,255,0.95) 100%),
          linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(79,70,229,0.06) 100%);
        box-shadow:
          0 24px 72px rgba(79,70,229,0.25),
          0 8px 24px rgba(79,70,229,0.15),
          0 0 0 1px rgba(255,255,255,0.95) inset;
        border-radius:20px;
        position:relative;
        overflow:hidden;
      "
    >
      <!-- Animated Gradient Orbs -->
      <div style="
        position:absolute;
        top:-40%;
        left:-10%;
        width:50%;
        height:150%;
        background:radial-gradient(circle, rgba(129,140,248,0.12) 0%, transparent 70%);
        animation: float-orb 8s ease-in-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        bottom:-30%;
        right:-15%;
        width:60%;
        height:140%;
        background:radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%);
        animation: float-orb 10s ease-in-out infinite reverse;
        pointer-events:none;
      "></div>

      <div class="card-header" style="
        border:none;
        padding-bottom:16px;
        position:relative;
        z-index:1;
      ">
        <h3 class="card-title" style="
          font-size:1.25rem;
          font-weight:800;
          background:linear-gradient(135deg, #4338ca 0%, #6366f1 100%);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          display:flex;
          align-items:center;
          gap:10px;
        ">
          ${label}
          <span style="
            font-size:0.75rem;
            background:rgba(99,102,241,0.15);
            color:#4338ca;
            padding:4px 10px;
            border-radius:999px;
            font-weight:700;
            letter-spacing:0.08em;
          ">KI-EMPFEHLUNG</span>
        </h3>
      </div>

      <div
        style="
          font-size:0.92rem;
          color:#1e293b;
          line-height:1.8;
          position:relative;
          z-index:1;
          background:rgba(255,255,255,0.5);
          padding:18px;
          border-radius:14px;
          border:1px solid rgba(129,140,248,0.2);
          box-shadow:0 4px 12px rgba(79,70,229,0.08);
        "
      >
        <p style="margin:0; font-weight:500;">${sensei.text}</p>
      </div>

      <div
        style="
          margin-top:18px;
          display:flex;
          justify-content:flex-end;
          gap:12px;
          position:relative;
          z-index:1;
        "
      >
        <button
          type="button"
          class="meta-button"
          style="
            background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color:white;
            border:none;
            padding:12px 24px;
            border-radius:12px;
            font-weight:700;
            font-size:0.88rem;
            cursor:pointer;
            box-shadow:
              0 8px 24px rgba(99,102,241,0.35),
              0 0 0 1px rgba(255,255,255,0.2) inset;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            letter-spacing:0.04em;
            text-transform:uppercase;
          "
          data-target="${sensei.ctaTarget || "testingLog"}"
          id="senseiCtaButton"
          onmouseover="this.style.transform='translateY(-2px) scale(1.02)'; this.style.boxShadow='0 12px 32px rgba(99,102,241,0.45), 0 0 0 1px rgba(255,255,255,0.3) inset';"
          onmouseout="this.style.transform='translateY(0) scale(1)'; this.style.boxShadow='0 8px 24px rgba(99,102,241,0.35), 0 0 0 1px rgba(255,255,255,0.2) inset';"
        >
          ${sensei.ctaLabel || "Nächsten Schritt öffnen"} →
        </button>
      </div>
    </div>

    <style>
      @keyframes float-orb {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(20px, -30px) scale(1.05);
        }
        66% {
          transform: translate(-15px, 20px) scale(0.95);
        }
      }
    </style>
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
