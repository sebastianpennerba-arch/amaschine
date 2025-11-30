/*
 * packages/dashboard/render.js
 * 💎 ULTIMATE ELITE DASHBOARD - Teil 1/3
 * Design-Level: Bloomberg Terminal × Tesla Cybertruck × Diablo IV
 * 
 * Philosophie: Jedes Pixel erzählt eine Geschichte.
 * Jede Animation hat einen Grund. Jede Farbe trägt Bedeutung.
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
   HERO KPIs - ULTIMATE MONEY ENGINE
   Bloomberg Terminal × Porsche Design
   ========================= */

function renderHeroKpis(heroKpis) {
  if (!heroKpis || !heroKpis.length) return "";

  return `
    <div
      class="hero-kpis-container"
      style="
        margin-bottom:32px;
        padding:32px;
        background:
          radial-gradient(circle at 20% 10%, rgba(249,250,251,1) 0%, rgba(241,245,249,0.98) 60%),
          radial-gradient(circle at 80% 90%, rgba(226,232,240,0.6) 0%, transparent 50%),
          linear-gradient(135deg, rgba(15,23,42,0.02) 0%, rgba(30,41,59,0.04) 100%);
        border:1.5px solid rgba(148,163,184,0.18);
        box-shadow:
          0 40px 120px -20px rgba(15,23,42,0.25),
          0 20px 60px -15px rgba(15,23,42,0.15),
          0 8px 28px -8px rgba(15,23,42,0.1),
          0 0 0 1px rgba(255,255,255,0.95) inset,
          0 2px 4px 0 rgba(255,255,255,0.8) inset;
        border-radius:24px;
        position:relative;
        overflow:hidden;
      "
    >
      <!-- Neural Network Pattern Background -->
      <div style="
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background-image:
          radial-gradient(circle at 2px 2px, rgba(148,163,184,0.08) 1px, transparent 1px);
        background-size: 40px 40px;
        opacity:0.4;
        pointer-events:none;
      "></div>

      <!-- Animated Gradient Orbs - Physics-Based Movement -->
      <div style="
        position:absolute;
        top:-60%;
        right:-20%;
        width:70%;
        height:180%;
        background:radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 65%);
        filter:blur(60px);
        animation: orb-float-1 18s ease-in-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        bottom:-50%;
        left:-15%;
        width:60%;
        height:160%;
        background:radial-gradient(ellipse at center, rgba(16,185,129,0.04) 0%, transparent 65%);
        filter:blur(50px);
        animation: orb-float-2 22s ease-in-out infinite;
        pointer-events:none;
      "></div>

      <!-- Header Section -->
      <div
        class="card-header"
        style="
          display:flex;
          align-items:flex-end;
          justify-content:space-between;
          margin-bottom:28px;
          padding-bottom:20px;
          border-bottom:2px solid;
          border-image: linear-gradient(90deg, rgba(148,163,184,0.4) 0%, rgba(148,163,184,0.15) 50%, rgba(148,163,184,0.4) 100%) 1;
          position:relative;
          z-index:1;
        "
      >
        <div>
          <div
            style="
              font-size:0.64rem;
              letter-spacing:0.28em;
              text-transform:uppercase;
              color:#64748b;
              font-weight:800;
              margin-bottom:8px;
              display:flex;
              align-items:center;
              gap:8px;
            "
          >
            <span style="
              display:inline-block;
              width:6px;
              height:6px;
              border-radius:50%;
              background:linear-gradient(135deg, #10b981 0%, #059669 100%);
              box-shadow:0 0 12px rgba(16,185,129,0.6), 0 0 6px rgba(16,185,129,0.4);
              animation: status-pulse 2s ease-in-out infinite;
            "></span>
            LIVE MISSION CONTROL
          </div>
          <h3
            style="
              font-size:1.5rem;
              letter-spacing:0.02em;
              text-transform:uppercase;
              font-weight:900;
              background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
              -webkit-background-clip:text;
              -webkit-text-fill-color:transparent;
              background-clip:text;
              line-height:1.2;
              font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', sans-serif;
              text-shadow:0 1px 2px rgba(15,23,42,0.1);
            "
          >
            Profit · Spend · ROAS · Momentum
          </h3>
        </div>
        <div
          style="
            text-align:right;
            font-size:0.68rem;
            color:#94a3b8;
            line-height:1.7;
            font-weight:600;
            letter-spacing:0.02em;
          "
        >
          <div style="margin-bottom:3px;">
            <span style="color:#64748b; font-weight:700;">Zeitraum:</span> 
            <span style="color:#475569;">Letzte 30 Tage</span>
          </div>
          <div style="margin-bottom:3px;">
            <span style="color:#64748b; font-weight:700;">Währung:</span> 
            <span style="color:#475569;">EUR</span>
          </div>
          <div>
            <span style="color:#64748b; font-weight:700;">TZ:</span> 
            <span style="color:#475569;">Europe/Berlin</span>
          </div>
        </div>
      </div>

      <!-- KPI Grid -->
      <div style="
        display:grid;
        grid-template-columns:repeat(4, 1fr);
        gap:20px;
        position:relative;
        z-index:1;
      ">
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
                : "●";

            // Premium Status-Based Design System
            let statusConfig;
            if (kpi.status === "good") {
              statusConfig = {
                gradient: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(5,150,105,0.06) 50%, rgba(4,120,87,0.03) 100%)",
                borderGlow: "0 0 24px rgba(16,185,129,0.2), 0 0 12px rgba(16,185,129,0.15)",
                dotGlow: "rgba(16,185,129,1)",
                dotShadow: "0 0 16px rgba(16,185,129,0.8), 0 0 8px rgba(16,185,129,0.6), 0 0 4px rgba(16,185,129,0.4)",
                shimmerColor: "rgba(16,185,129,0.15)",
                valueGradient: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
              };
            } else if (kpi.status === "critical") {
              statusConfig = {
                gradient: "linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0.03) 100%)",
                borderGlow: "0 0 28px rgba(239,68,68,0.25), 0 0 14px rgba(239,68,68,0.18)",
                dotGlow: "rgba(239,68,68,1)",
                dotShadow: "0 0 20px rgba(239,68,68,0.9), 0 0 10px rgba(239,68,68,0.7), 0 0 5px rgba(239,68,68,0.5)",
                shimmerColor: "rgba(239,68,68,0.15)",
                valueGradient: "linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #dc2626 100%)",
              };
            } else if (kpi.status === "warning") {
              statusConfig = {
                gradient: "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(217,119,6,0.06) 50%, rgba(180,83,9,0.03) 100%)",
                borderGlow: "0 0 26px rgba(245,158,11,0.22), 0 0 13px rgba(245,158,11,0.16)",
                dotGlow: "rgba(245,158,11,1)",
                dotShadow: "0 0 18px rgba(245,158,11,0.85), 0 0 9px rgba(245,158,11,0.65), 0 0 4px rgba(245,158,11,0.45)",
                shimmerColor: "rgba(245,158,11,0.15)",
                valueGradient: "linear-gradient(135deg, #92400e 0%, #b45309 50%, #d97706 100%)",
              };
            } else {
              statusConfig = {
                gradient: "linear-gradient(135deg, rgba(100,116,139,0.08) 0%, rgba(71,85,105,0.04) 50%, rgba(51,65,85,0.02) 100%)",
                borderGlow: "0 0 0 transparent",
                dotGlow: "rgba(100,116,139,1)",
                dotShadow: "0 0 12px rgba(100,116,139,0.5), 0 0 6px rgba(100,116,139,0.3)",
                shimmerColor: "rgba(100,116,139,0.1)",
                valueGradient: "linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)",
              };
            }

            return `
              <div
                class="kpi-card-ultimate"
                style="
                  position:relative;
                  padding:22px 24px;
                  border-radius:20px;
                  background:
                    ${statusConfig.gradient},
                    linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%);
                  border:1.5px solid rgba(148,163,184,0.2);
                  box-shadow:
                    ${statusConfig.borderGlow},
                    0 6px 20px rgba(15,23,42,0.08),
                    0 2px 8px rgba(15,23,42,0.04),
                    0 0 0 1px rgba(255,255,255,0.9) inset;
                  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                  cursor:pointer;
                  overflow:hidden;
                "
                data-kpi-index="${idx}"
                onmouseover="
                  this.style.transform='translateY(-6px) scale(1.02)';
                  this.style.boxShadow='${statusConfig.borderGlow}, 0 12px 40px rgba(15,23,42,0.15), 0 4px 16px rgba(15,23,42,0.08), 0 0 0 1.5px rgba(255,255,255,1) inset';
                "
                onmouseout="
                  this.style.transform='translateY(0) scale(1)';
                  this.style.boxShadow='${statusConfig.borderGlow}, 0 6px 20px rgba(15,23,42,0.08), 0 2px 8px rgba(15,23,42,0.04), 0 0 0 1px rgba(255,255,255,0.9) inset';
                "
              >
                <!-- Shimmer Overlay -->
                <div style="
                  position:absolute;
                  top:0;
                  left:-100%;
                  width:100%;
                  height:100%;
                  background:linear-gradient(90deg, transparent 0%, ${statusConfig.shimmerColor} 50%, transparent 100%);
                  animation: card-shimmer 4s ease-in-out infinite;
                  animation-delay:${idx * 0.3}s;
                  pointer-events:none;
                "></div>

                <!-- Status Indicator Dot - Diablo IV Style -->
                <div style="
                  position:absolute;
                  top:18px;
                  right:18px;
                  width:10px;
                  height:10px;
                  border-radius:50%;
                  background:${statusConfig.dotGlow};
                  box-shadow:${statusConfig.dotShadow};
                  animation: status-pulse 2.5s ease-in-out infinite;
                  animation-delay:${idx * 0.2}s;
                "></div>

                <!-- KPI Label -->
                <div
                  style="
                    font-size:0.7rem;
                    letter-spacing:0.22em;
                    text-transform:uppercase;
                    color:#64748b;
                    font-weight:800;
                    margin-bottom:14px;
                    display:flex;
                    align-items:center;
                    gap:6px;
                  "
                >
                  ${kpi.label}
                </div>

                <!-- Value & Trend Section -->
                <div
                  style="
                    display:flex;
                    align-items:flex-end;
                    justify-content:space-between;
                    gap:16px;
                    margin-bottom:16px;
                  "
                >
                  <!-- Main Value -->
                  <div
                    class="kpi-value-ultimate"
                    style="
                      font-size:2.4rem;
                      font-weight:900;
                      letter-spacing:-0.03em;
                      font-variant-numeric:tabular-nums;
                      background:${statusConfig.valueGradient};
                      -webkit-background-clip:text;
                      -webkit-text-fill-color:transparent;
                      background-clip:text;
                      line-height:0.95;
                      font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
                      text-shadow:0 2px 4px rgba(15,23,42,0.1);
                      animation: value-glow 3s ease-in-out infinite;
                      animation-delay:${idx * 0.25}s;
                    "
                  >
                    ${value}
                  </div>

                  <!-- Trend Badge -->
                  <div
                    style="
                      display:flex;
                      flex-direction:column;
                      align-items:flex-end;
                      gap:6px;
                      min-width:92px;
                    "
                  >
                    <div
                      class="${badgeClass}"
                      style="
                        gap:6px;
                        display:inline-flex;
                        align-items:center;
                        padding:6px 13px;
                        font-size:0.8rem;
                        font-weight:800;
                        border-radius:999px;
                        box-shadow:
                          0 4px 12px rgba(15,23,42,0.15),
                          0 0 0 1px rgba(255,255,255,0.5) inset;
                        letter-spacing:0.02em;
                      "
                    >
                      <span style="font-size:0.9rem; line-height:1;">${trendIcon}</span>
                      <span>${kpi.trendLabel}</span>
                    </div>
                    <div
                      style="
                        font-size:0.66rem;
                        color:#94a3b8;
                        text-transform:uppercase;
                        letter-spacing:0.18em;
                        font-weight:700;
                      "
                    >
                      vs. Vormonat
                    </div>
                  </div>
                </div>

                <!-- Description -->
                <div
                  style="
                    font-size:0.82rem;
                    color:#64748b;
                    line-height:1.6;
                    padding-top:14px;
                    border-top:1.5px solid rgba(148,163,184,0.12);
                    font-weight:500;
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
      /* Physics-Based Animations */
      @keyframes orb-float-1 {
        0%, 100% { 
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        25% {
          transform: translate(30px, -40px) rotate(90deg) scale(1.05);
        }
        50% {
          transform: translate(-20px, -60px) rotate(180deg) scale(0.95);
        }
        75% {
          transform: translate(40px, -30px) rotate(270deg) scale(1.03);
        }
      }

      @keyframes orb-float-2 {
        0%, 100% { 
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        33% {
          transform: translate(-35px, 45px) rotate(120deg) scale(1.04);
        }
        66% {
          transform: translate(25px, 55px) rotate(240deg) scale(0.96);
        }
      }

      @keyframes status-pulse {
        0%, 100% { 
          opacity: 1; 
          transform: scale(1);
        }
        50% { 
          opacity: 0.7; 
          transform: scale(1.15);
        }
      }

      @keyframes card-shimmer {
        0% { 
          left: -100%; 
          opacity: 0;
        }
        50% {
          opacity: 1;
        }
        100% { 
          left: 200%;
          opacity: 0;
        }
      }

      @keyframes value-glow {
        0%, 100% {
          filter: brightness(1) contrast(1);
        }
        50% {
          filter: brightness(1.1) contrast(1.05);
        }
      }
    </style>
  `;
}
/* =========================
   ALERT-STRIP ULTIMATE
   Tesla Cybertruck UI × SpaceX Mission Control
   ========================= */

function renderAlertsStrip(alerts) {
  if (!alerts) return "";

  let statusConfig;
  if (alerts.overall === "critical") {
    statusConfig = {
      bg: "linear-gradient(135deg, rgba(248,113,113,0.18) 0%, rgba(239,68,68,0.12) 25%, rgba(220,38,38,0.08) 50%, rgba(185,28,28,0.04) 100%)",
      border: "rgba(239,68,68,0.5)",
      textColor: "#991b1b",
      icon: "🚨",
      label: "KRITISCHER ZUSTAND",
      glow: "0 0 60px rgba(239,68,68,0.4), 0 12px 40px rgba(239,68,68,0.25), 0 0 0 1px rgba(239,68,68,0.3)",
      pulseAnimation: "alert-pulse-critical 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      scanlineColor: "rgba(239,68,68,0.15)",
    };
  } else if (alerts.overall === "warning") {
    statusConfig = {
      bg: "linear-gradient(135deg, rgba(250,204,21,0.18) 0%, rgba(245,158,11,0.12) 25%, rgba(217,119,6,0.08) 50%, rgba(180,83,9,0.04) 100%)",
      border: "rgba(245,158,11,0.5)",
      textColor: "#92400e",
      icon: "⚠️",
      label: "WARNSIGNALE AKTIV",
      glow: "0 0 54px rgba(245,158,11,0.38), 0 12px 38px rgba(245,158,11,0.22), 0 0 0 1px rgba(245,158,11,0.28)",
      pulseAnimation: "alert-pulse-warning 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      scanlineColor: "rgba(245,158,11,0.15)",
    };
  } else {
    statusConfig = {
      bg: "linear-gradient(135deg, rgba(74,222,128,0.18) 0%, rgba(34,197,94,0.12) 25%, rgba(22,163,74,0.08) 50%, rgba(5,150,105,0.04) 100%)",
      border: "rgba(34,197,94,0.45)",
      textColor: "#14532d",
      icon: "🟢",
      label: "SYSTEM OPTIMAL",
      glow: "0 0 50px rgba(34,197,94,0.35), 0 12px 36px rgba(34,197,94,0.2), 0 0 0 1px rgba(34,197,94,0.25)",
      pulseAnimation: "alert-pulse-good 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      scanlineColor: "rgba(34,197,94,0.12)",
    };
  }

  const detailLine = alerts.items
    .map((a) => `${a.label}: ${a.message}`)
    .slice(0, 2)
    .join(" • ");

  return `
    <div
      class="alert-strip-ultimate"
      style="
        margin-bottom:28px;
        padding:14px 28px;
        border-radius:16px;
        border:2px solid ${statusConfig.border};
        background:${statusConfig.bg};
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:18px;
        font-size:0.86rem;
        box-shadow:
          ${statusConfig.glow},
          0 4px 16px rgba(15,23,42,0.08),
          0 0 0 1px rgba(255,255,255,0.7) inset;
        animation: ${statusConfig.pulseAnimation};
        backdrop-filter: blur(12px) saturate(120%);
        position:relative;
        overflow:hidden;
      "
    >
      <!-- CRT Scanline Effect -->
      <div style="
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background:repeating-linear-gradient(
          0deg,
          transparent,
          transparent 2px,
          ${statusConfig.scanlineColor} 2px,
          ${statusConfig.scanlineColor} 4px
        );
        opacity:0.3;
        pointer-events:none;
        animation: scanline-move 8s linear infinite;
      "></div>

      <!-- Holographic Shimmer -->
      <div style="
        position:absolute;
        top:-50%;
        left:-100%;
        width:200%;
        height:200%;
        background:linear-gradient(
          90deg, 
          transparent 0%, 
          rgba(255,255,255,0.2) 48%, 
          rgba(255,255,255,0.4) 50%, 
          rgba(255,255,255,0.2) 52%, 
          transparent 100%
        );
        animation: holographic-sweep 4s ease-in-out infinite;
        transform:skewX(-20deg);
        pointer-events:none;
      "></div>

      <!-- Left Section: Status -->
      <div
        style="
          display:flex;
          align-items:center;
          gap:14px;
          color:${statusConfig.textColor};
          position:relative;
          z-index:1;
        "
      >
        <!-- Icon with Pulsing Ring -->
        <div style="position:relative;">
          <div style="
            position:absolute;
            top:50%;
            left:50%;
            transform:translate(-50%, -50%);
            width:44px;
            height:44px;
            border-radius:50%;
            border:2px solid ${statusConfig.border};
            animation: icon-ring-pulse 2s ease-out infinite;
          "></div>
          <span style="
            font-size:1.5rem;
            animation: icon-bounce-3d 2s ease-in-out infinite;
            display:inline-block;
            position:relative;
            z-index:2;
            filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));
          ">${statusConfig.icon}</span>
        </div>

        <!-- Label -->
        <div style="
          display:flex;
          flex-direction:column;
          gap:2px;
        ">
          <span
            style="
              text-transform:uppercase;
              letter-spacing:0.22em;
              font-size:0.78rem;
              font-weight:900;
              line-height:1;
            "
          >
            ${statusConfig.label}
          </span>
          <span style="
            font-size:0.68rem;
            opacity:0.7;
            letter-spacing:0.08em;
            font-weight:600;
          ">
            ${alerts.items.length} ${alerts.items.length === 1 ? 'Signal' : 'Signale'} detektiert
          </span>
        </div>
      </div>

      <!-- Right Section: Details -->
      <div
        style="
          flex:1;
          text-align:right;
          color:${statusConfig.textColor};
          font-size:0.84rem;
          font-weight:600;
          letter-spacing:0.01em;
          position:relative;
          z-index:1;
          padding-right:12px;
        "
      >
        <div style="
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          max-width:100%;
        ">
          ${detailLine || "Keine aktiven Warnungen"}
        </div>
      </div>

      <!-- Data Stream Indicator -->
      <div style="
        position:absolute;
        right:8px;
        top:8px;
        display:flex;
        gap:3px;
        z-index:1;
      ">
        ${[0,1,2].map(i => `
          <div style="
            width:3px;
            height:12px;
            background:${statusConfig.border};
            border-radius:2px;
            animation: data-stream 1.2s ease-in-out infinite;
            animation-delay:${i * 0.15}s;
            opacity:0.6;
          "></div>
        `).join('')}
      </div>
    </div>

    <style>
      @keyframes alert-pulse-critical {
        0%, 100% { 
          box-shadow: ${statusConfig.glow};
          transform: scale(1) translateZ(0);
        }
        50% { 
          box-shadow: 0 0 70px rgba(239,68,68,0.5), 0 16px 48px rgba(239,68,68,0.32), 0 0 0 1.5px rgba(239,68,68,0.4);
          transform: scale(1.01) translateZ(0);
        }
      }

      @keyframes alert-pulse-warning {
        0%, 100% { 
          box-shadow: ${statusConfig.glow};
        }
        50% { 
          box-shadow: 0 0 64px rgba(245,158,11,0.46), 0 16px 46px rgba(245,158,11,0.28), 0 0 0 1.5px rgba(245,158,11,0.35);
        }
      }

      @keyframes alert-pulse-good {
        0%, 100% { 
          box-shadow: ${statusConfig.glow};
        }
        50% { 
          box-shadow: 0 0 60px rgba(34,197,94,0.42), 0 16px 44px rgba(34,197,94,0.25), 0 0 0 1.5px rgba(34,197,94,0.32);
        }
      }

      @keyframes holographic-sweep {
        0% { 
          left: -100%; 
        }
        100% { 
          left: 100%;
        }
      }

      @keyframes scanline-move {
        0% { 
          transform: translateY(0);
        }
        100% { 
          transform: translateY(4px);
        }
      }

      @keyframes icon-bounce-3d {
        0%, 100% { 
          transform: translateY(0) rotateZ(0deg);
        }
        50% { 
          transform: translateY(-4px) rotateZ(5deg);
        }
      }

      @keyframes icon-ring-pulse {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0.8;
        }
        50% {
          transform: translate(-50%, -50%) scale(1.2);
          opacity: 0;
        }
        100% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
        }
      }

      @keyframes data-stream {
        0%, 100% {
          height: 4px;
          opacity: 0.3;
        }
        50% {
          height: 16px;
          opacity: 1;
        }
      }
    </style>
  `;
}

/* =========================
   PERFORMANCE CHART ULTIMATE
   Bloomberg Terminal × Apple Vision Pro
   ========================= */

function renderPerformance(performance) {
  if (!performance || !performance.items || !performance.items.length) return "";

  const maxRoas = performance.items.reduce((m, d) => (d.roas > m ? d.roas : m), 0);
  const minRoas = performance.items.reduce((m, d) => (d.roas < m ? d.roas : m), maxRoas);
  const avgRoas = performance.items.reduce((sum, d) => sum + d.roas, 0) / performance.items.length;

  const rows = performance.items
    .map((d, idx) => {
      const width = maxRoas ? Math.max(8, Math.round((d.roas / maxRoas) * 100)) : 50;
      const normalizedValue = (d.roas - minRoas) / (maxRoas - minRoas);
      
      // Advanced Color Gradient based on performance
      let barGradient, barGlow, performanceLevel;
      if (d.roas >= avgRoas * 1.1) {
        performanceLevel = "excellent";
        barGradient = "linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%)";
        barGlow = "0 0 28px rgba(16,185,129,0.5), 0 4px 12px rgba(16,185,129,0.35) inset";
      } else if (d.roas >= avgRoas * 0.95) {
        performanceLevel = "good";
        barGradient = "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)";
        barGlow = "0 0 24px rgba(59,130,246,0.45), 0 4px 12px rgba(59,130,246,0.3) inset";
      } else if (d.roas >= avgRoas * 0.8) {
        performanceLevel = "medium";
        barGradient = "linear-gradient(90deg, #f59e0b 0%, #d97706 50%, #b45309 100%)";
        barGlow = "0 0 20px rgba(245,158,11,0.4), 0 4px 12px rgba(245,158,11,0.25) inset";
      } else {
        performanceLevel = "low";
        barGradient = "linear-gradient(90deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)";
        barGlow = "0 0 22px rgba(239,68,68,0.42), 0 4px 12px rgba(239,68,68,0.28) inset";
      }

      return `
        <div
          class="performance-row"
          style="
            display:flex;
            align-items:center;
            gap:14px;
            margin:10px 0;
            padding:4px 0;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            position:relative;
          "
          onmouseover="
            this.style.transform='translateX(6px)';
            this.style.background='rgba(241,245,249,0.5)';
            this.style.borderRadius='12px';
            this.style.padding='8px 12px';
          "
          onmouseout="
            this.style.transform='translateX(0)';
            this.style.background='transparent';
            this.style.padding='4px 0';
          "
        >
          <!-- Day Label -->
          <div
            style="
              width:32px;
              font-size:0.84rem;
              font-weight:800;
              color:#475569;
              text-align:center;
              font-variant-numeric:tabular-nums;
            "
          >
            ${d.label}
          </div>

          <!-- Chart Bar Container -->
          <div style="flex:1; position:relative;">
            <!-- Background Track with Grid -->
            <div
              style="
                height:18px;
                border-radius:10px;
                background:
                  repeating-linear-gradient(
                    90deg,
                    rgba(226,232,240,0.4) 0px,
                    rgba(226,232,240,0.4) 1px,
                    transparent 1px,
                    transparent 20px
                  ),
                  linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 100%);
                overflow:hidden;
                box-shadow:
                  0 0 0 1.5px rgba(148,163,184,0.2) inset,
                  0 2px 6px rgba(15,23,42,0.04);
                position:relative;
              "
            >
              <!-- Liquid Metal Bar -->
              <div
                style="
                  width:${width}%;
                  height:100%;
                  border-radius:inherit;
                  background:${barGradient};
                  box-shadow:${barGlow};
                  animation: 
                    bar-fill-ultimate 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${idx * 0.1}s backwards,
                    bar-pulse-${performanceLevel} 3s ease-in-out infinite;
                  animation-delay: ${idx * 0.1}s, ${idx * 0.1 + 0.8}s;
                  position:relative;
                  overflow:hidden;
                "
                data-performance="${performanceLevel}"
              >
                <!-- Metallic Shine -->
                <div style="
                  position:absolute;
                  top:0;
                  left:0;
                  right:0;
                  height:50%;
                  background:linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%);
                  border-radius:10px 10px 0 0;
                "></div>

                <!-- Flowing Shimmer -->
                <div style="
                  position:absolute;
                  top:0;
                  left:-100%;
                  width:50%;
                  height:100%;
                  background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%);
                  animation: liquid-flow 2.5s linear infinite;
                  animation-delay:${idx * 0.15}s;
                  transform:skewX(-20deg);
                "></div>

                <!-- Particle Trail -->
                <div style="
                  position:absolute;
                  right:0;
                  top:50%;
                  transform:translateY(-50%);
                  width:4px;
                  height:4px;
                  border-radius:50%;
                  background:rgba(255,255,255,0.9);
                  box-shadow:
                    0 0 8px rgba(255,255,255,0.8),
                    -4px 0 4px rgba(255,255,255,0.4),
                    -8px 0 2px rgba(255,255,255,0.2);
                  animation: particle-glow 2s ease-in-out infinite;
                "></div>
              </div>
            </div>
          </div>

          <!-- ROAS Value -->
          <div
            style="
              min-width:64px;
              text-align:right;
              font-size:0.92rem;
              font-weight:800;
              font-variant-numeric:tabular-nums;
              color:#0f172a;
              background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
              -webkit-background-clip:text;
              -webkit-text-fill-color:transparent;
              background-clip:text;
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
      border:1.5px solid rgba(148,163,184,0.2);
      box-shadow:
        0 12px 32px rgba(15,23,42,0.12),
        0 4px 12px rgba(15,23,42,0.06),
        0 0 0 1px rgba(255,255,255,0.9) inset;
      border-radius:20px;
      background:
        radial-gradient(circle at 10% 20%, rgba(255,255,255,1) 0%, rgba(249,250,251,0.98) 100%);
      overflow:hidden;
      position:relative;
    ">
      <!-- Subtle Grid Background -->
      <div style="
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background-image:
          linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px);
        background-size: 20px 20px;
        opacity:0.5;
        pointer-events:none;
      "></div>

      <div class="card-header" style="
        padding:20px 24px 16px;
        border-bottom:2px solid;
        border-image: linear-gradient(90deg, rgba(148,163,184,0.3) 0%, rgba(148,163,184,0.1) 50%, rgba(148,163,184,0.3) 100%) 1;
        position:relative;
        z-index:1;
      ">
        <div>
          <h3 class="card-title" style="
            font-size:1.2rem;
            font-weight:900;
            background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
            margin-bottom:6px;
            font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          ">📊 Performance-Tendenz (7 Tage)</h3>
          <p class="card-subtitle" style="
            color:#64748b;
            font-size:0.84rem;
            font-weight:500;
            line-height:1.5;
          ">
            ROAS-Bewegung über die Woche — Live-Monitoring deiner Account-Performance
          </p>
        </div>
        <div style="
          position:absolute;
          top:20px;
          right:24px;
          display:flex;
          flex-direction:column;
          align-items:flex-end;
          gap:4px;
          font-size:0.7rem;
          color:#94a3b8;
          font-weight:600;
        ">
          <div>
            <span style="color:#64748b;">Ø ROAS:</span>
            <span style="color:#0f172a; font-weight:800; margin-left:4px;">${formatNumber(avgRoas, 1, "x")}</span>
          </div>
          <div>
            <span style="color:#64748b;">Peak:</span>
            <span style="color:#059669; font-weight:800; margin-left:4px;">${formatNumber(maxRoas, 1, "x")}</span>
          </div>
        </div>
      </div>

      <div style="
        margin-top:16px;
        padding:8px 24px 20px;
        position:relative;
        z-index:1;
      ">
        ${rows}
      </div>

      <!-- Summary Stats -->
      <div style="
        display:flex;
        justify-content:space-between;
        padding:16px 24px;
        border-top:2px solid;
        border-image: linear-gradient(90deg, rgba(148,163,184,0.3) 0%, rgba(148,163,184,0.1) 50%, rgba(148,163,184,0.3) 100%) 1;
        font-size:0.84rem;
        color:#475569;
        font-weight:600;
        background:rgba(248,250,252,0.5);
        position:relative;
        z-index:1;
      ">
        <span>
          <strong style="color:#0f172a; font-weight:800;">Spend (7d):</strong>
          <span style="
            font-weight:800;
            color:#0f172a;
            margin-left:6px;
            font-variant-numeric:tabular-nums;
          ">
            ${formatCurrency(performance.summary.spend7d)}
          </span>
        </span>
        <span>
          <strong style="color:#0f172a; font-weight:800;">Conversions (7d):</strong>
          <span style="
            font-weight:800;
            color:#0f172a;
            margin-left:6px;
            font-variant-numeric:tabular-nums;
          ">
            ${Math.round(performance.summary.conversions7d).toLocaleString("de-DE")}
          </span>
        </span>
      </div>
    </div>

    <style>
      @keyframes bar-fill-ultimate {
        0% {
          width: 0;
          opacity: 0;
          transform: scaleX(0);
        }
        100% {
          opacity: 1;
          transform: scaleX(1);
        }
      }

      @keyframes liquid-flow {
        0% { 
          left: -100%; 
        }
        100% { 
          left: 150%;
        }
      }

      @keyframes bar-pulse-excellent {
        0%, 100% {
          filter: brightness(1) saturate(1);
        }
        50% {
          filter: brightness(1.15) saturate(1.2);
        }
      }

      @keyframes bar-pulse-good {
        0%, 100% {
          filter: brightness(1) saturate(1);
        }
        50% {
          filter: brightness(1.1) saturate(1.1);
        }
      }

      @keyframes bar-pulse-medium {
        0%, 100% {
          filter: brightness(1) saturate(1);
        }
        50% {
          filter: brightness(1.05) saturate(1.05);
        }
      }

      @keyframes bar-pulse-low {
        0%, 100% {
          filter: brightness(1) saturate(1);
        }
        50% {
          filter: brightness(0.95) saturate(0.95);
        }
      }

      @keyframes particle-glow {
        0%, 100% {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        50% {
          opacity: 0.6;
          transform: translateY(-50%) scale(1.3);
        }
      }
    </style>
  `;
}
/* =========================
   SENSEI BOX ULTIMATE
   Aurora Borealis × AI Neural Network × Holographic UI
   ========================= */

function renderSenseiBox(sensei, brandName) {
  if (!sensei) return "";

  const label = brandName ? `🧠 Sensei Insight für ${brandName}` : "🧠 Sensei Insight";

  return `
    <div
      class="sensei-box-ultimate"
      style="
        margin-top:32px;
        padding:32px 36px;
        border:2px solid rgba(129,140,248,0.4);
        background:
          radial-gradient(ellipse at top left, rgba(239,246,255,1) 0%, rgba(224,231,255,0.98) 50%, rgba(199,210,254,0.95) 100%),
          linear-gradient(135deg, rgba(99,102,241,0.03) 0%, rgba(79,70,229,0.05) 100%);
        box-shadow:
          0 36px 108px rgba(79,70,229,0.3),
          0 18px 54px rgba(79,70,229,0.2),
          0 8px 28px rgba(79,70,229,0.14),
          0 0 0 1px rgba(255,255,255,0.98) inset,
          0 2px 6px 0 rgba(255,255,255,0.92) inset;
        border-radius:24px;
        position:relative;
        overflow:hidden;
      "
    >
      <!-- Aurora Borealis Background -->
      <div style="
        position:absolute;
        top:-60%;
        left:-20%;
        width:80%;
        height:200%;
        background:
          radial-gradient(ellipse at center, rgba(129,140,248,0.18) 0%, transparent 60%);
        filter:blur(80px);
        animation: aurora-wave-1 12s ease-in-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        bottom:-50%;
        right:-15%;
        width:70%;
        height:180%;
        background:
          radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 60%);
        filter:blur(70px);
        animation: aurora-wave-2 15s ease-in-out infinite;
        pointer-events:none;
      "></div>
      <div style="
        position:absolute;
        top:30%;
        left:40%;
        width:50%;
        height:120%;
        background:
          radial-gradient(ellipse at center, rgba(139,92,246,0.12) 0%, transparent 55%);
        filter:blur(60px);
        animation: aurora-wave-3 18s ease-in-out infinite;
        pointer-events:none;
      "></div>

      <!-- Neural Network Grid -->
      <div style="
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background-image:
          radial-gradient(circle at 2px 2px, rgba(99,102,241,0.12) 1.5px, transparent 1.5px);
        background-size: 48px 48px;
        opacity:0.4;
        pointer-events:none;
      "></div>

      <!-- Holographic Scan Lines -->
      <div style="
        position:absolute;
        top:0;
        left:0;
        right:0;
        bottom:0;
        background:repeating-linear-gradient(
          0deg,
          transparent,
          transparent 3px,
          rgba(129,140,248,0.08) 3px,
          rgba(129,140,248,0.08) 6px
        );
        opacity:0.25;
        pointer-events:none;
        animation: scanline-drift 10s linear infinite;
      "></div>

      <!-- Header -->
      <div style="
        border:none;
        padding-bottom:20px;
        position:relative;
        z-index:1;
        display:flex;
        align-items:center;
        justify-content:space-between;
      ">
        <h3 style="
          font-size:1.35rem;
          font-weight:900;
          background:linear-gradient(135deg, #4338ca 0%, #6366f1 50%, #818cf8 100%);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          display:flex;
          align-items:center;
          gap:12px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          letter-spacing:0.01em;
        ">
          ${label}
        </h3>
        
        <div style="display:flex; align-items:center; gap:8px;">
          <!-- AI Processing Indicator -->
          <div style="
            display:flex;
            gap:4px;
            align-items:center;
            padding:6px 12px;
            background:rgba(99,102,241,0.12);
            border-radius:999px;
            border:1.5px solid rgba(99,102,241,0.3);
          ">
            ${[0,1,2].map(i => `
              <div style="
                width:4px;
                height:4px;
                border-radius:50%;
                background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                animation: ai-pulse 1.5s ease-in-out infinite;
                animation-delay:${i * 0.2}s;
                box-shadow:0 0 8px rgba(99,102,241,0.6);
              "></div>
            `).join('')}
          </div>
          
          <!-- KI Badge -->
          <span style="
            font-size:0.74rem;
            background:linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(79,70,229,0.15) 100%);
            color:#4338ca;
            padding:6px 14px;
            border-radius:999px;
            font-weight:800;
            letter-spacing:0.1em;
            text-transform:uppercase;
            border:1.5px solid rgba(99,102,241,0.3);
            box-shadow:
              0 4px 12px rgba(99,102,241,0.15),
              0 0 0 1px rgba(255,255,255,0.5) inset;
          ">AI-POWERED</span>
        </div>
      </div>

      <!-- Insight Content -->
      <div style="
        font-size:0.96rem;
        color:#1e293b;
        line-height:1.85;
        position:relative;
        z-index:1;
        background:
          linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(248,250,252,0.6) 100%);
        padding:22px 24px;
        border-radius:16px;
        border:1.5px solid rgba(129,140,248,0.25);
        box-shadow:
          0 8px 24px rgba(79,70,229,0.1),
          0 0 0 1px rgba(255,255,255,0.8) inset;
        backdrop-filter: blur(8px);
      ">
        <p style="margin:0; font-weight:600; letter-spacing:0.01em;">
          ${sensei.text}
        </p>
      </div>

      <!-- CTA Section -->
      <div style="
        margin-top:22px;
        display:flex;
        justify-content:flex-end;
        align-items:center;
        gap:14px;
        position:relative;
        z-index:1;
      ">
        <button
          type="button"
          class="sensei-cta-button"
          style="
            background:linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
            color:white;
            border:none;
            padding:14px 28px;
            border-radius:14px;
            font-weight:800;
            font-size:0.92rem;
            cursor:pointer;
            box-shadow:
              0 12px 32px rgba(99,102,241,0.4),
              0 4px 12px rgba(99,102,241,0.3),
              0 0 0 1px rgba(255,255,255,0.3) inset;
            transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
            letter-spacing:0.06em;
            text-transform:uppercase;
            position:relative;
            overflow:hidden;
          "
          data-target="${sensei.ctaTarget || "testingLog"}"
          id="senseiCtaButton"
          onmouseover="
            this.style.transform='translateY(-3px) scale(1.03)';
            this.style.boxShadow='0 16px 48px rgba(99,102,241,0.5), 0 8px 20px rgba(99,102,241,0.4), 0 0 0 1.5px rgba(255,255,255,0.4) inset';
          "
          onmouseout="
            this.style.transform='translateY(0) scale(1)';
            this.style.boxShadow='0 12px 32px rgba(99,102,241,0.4), 0 4px 12px rgba(99,102,241,0.3), 0 0 0 1px rgba(255,255,255,0.3) inset';
          "
        >
          <!-- Button Shimmer -->
          <div style="
            position:absolute;
            top:0;
            left:-100%;
            width:100%;
            height:100%;
            background:linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
            animation: button-shimmer 3s ease-in-out infinite;
          "></div>
          
          <span style="position:relative; z-index:1;">
            ${sensei.ctaLabel || "Nächsten Schritt öffnen"} →
          </span>
        </button>
      </div>
    </div>

    <style>
      @keyframes aurora-wave-1 {
        0%, 100% {
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        33% {
          transform: translate(30px, -50px) rotate(5deg) scale(1.1);
        }
        66% {
          transform: translate(-25px, -30px) rotate(-5deg) scale(0.95);
        }
      }

      @keyframes aurora-wave-2 {
        0%, 100% {
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        40% {
          transform: translate(-35px, 40px) rotate(-8deg) scale(1.08);
        }
        80% {
          transform: translate(30px, 50px) rotate(8deg) scale(0.92);
        }
      }

      @keyframes aurora-wave-3 {
        0%, 100% {
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        50% {
          transform: translate(20px, -40px) rotate(10deg) scale(1.05);
        }
      }

      @keyframes scanline-drift {
        0% { transform: translateY(0); }
        100% { transform: translateY(6px); }
      }

      @keyframes ai-pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.5);
          opacity: 0.5;
        }
      }

      @keyframes button-shimmer {
        0% { 
          left: -100%; 
        }
        100% { 
          left: 200%;
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
    <div class="view-header" style="
      margin-bottom:24px;
      padding-bottom:20px;
      border-bottom:2px solid;
      border-image: linear-gradient(90deg, rgba(148,163,184,0.3) 0%, rgba(148,163,184,0.15) 50%, rgba(148,163,184,0.3) 100%) 1;
    ">
      <div>
        <h2 style="
          font-size:1.75rem;
          font-weight:900;
          background:linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          background-clip:text;
          margin-bottom:6px;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
          letter-spacing:0.01em;
        ">SignalOne Performance Dashboard</h2>
        <p class="view-header-sub" style="
          color:#64748b;
          font-size:0.92rem;
          font-weight:600;
          letter-spacing:0.01em;
        ">
          ${brandLine}
        </p>
      </div>
    </div>

    ${statusStripHtml}

    ${heroHtml}

    <div class="dashboard-grid" style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:24px;
      margin-bottom:24px;
    ">
      ${perfHtml}
      ${alertsCardHtml}
    </div>

    <div class="dashboard-section" style="
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:24px;
    ">
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
