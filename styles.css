/*
 * SignalOne – Vision Pro Titanium Light
 * Full UI: Sidebar, Topbar, Dashboard, Creatives, Campaigns, Sensei, Reports, Logs
 * HTML & JS bleiben unverändert – nur Optik.
 */

/* ==============================
   1) DESIGN TOKENS
   ============================== */

:root {
  /* ----------------------------------------------- */
  /* HASE PREMIUM THEME – GRAPHITE LUX + METAL CLOUD */
  /* ----------------------------------------------- */

  /* --- PRIMARY (Accent Color) --- */
  --color-primary: #3b6af8;          /* Ice Blue Tech */
  --color-primary-hover: #315bd6;
  --color-primary-soft: #e8efff;

  /* --- NEUTRAL BACKGROUND STACK --- */
  --color-bg: #e5e7f2;               /* App Hintergrund */
  --color-bg-panel: #ffffff;         /* Clean White Panel (sehr edel) */
  --color-bg-soft: #f1f5f9;          /* Soft Neutral */
  --color-bg-hover: #e7e9ed;         /* Touch Highlight */

  /* --- GRAPHITE TEXT (kein hartes Schwarz) --- */
  --color-text-main: #0f172a;        /* Heavy Graphite */
  --color-text-soft: #4f535a;        /* Medium Graphite */
  --color-text-muted: #6b7280;       /* Light Graphite */

  /* --- BORDERS --- */
  --color-border-subtle: #e2e8f0;    /* Neutral Steel */
  --color-border-strong: #c4c7cd;

  /* --- STATUS COLORS --- */
  --color-success: #16a34a;
  --color-success-soft: rgba(22, 163, 74, 0.08);
  --color-warning: #ea980c;
  --color-warning-soft: rgba(234, 152, 12, 0.1);
  --color-danger: #e11d48;
  --color-danger-soft: rgba(225, 29, 72, 0.08);

  /* --- SURFACES --- */
  --color-sidebar-bg: #020617;       /* Dark Sidebar */
  --color-topbar-bg: rgba(248, 250, 252, 0.96);
  --color-surface: #ffffff;          /* Kartenflächen */
  --color-surface-soft: #f8fafc;

  /* --- ULTRA MODERN SHADOWS --- */
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.08);
  --shadow-md: 0 4px 16px rgba(15, 23, 42, 0.12);
  --shadow-lg: 0 16px 40px rgba(15, 23, 42, 0.18);
  --shadow-card: 0 18px 45px rgba(15, 23, 42, 0.22);
  --shadow-soft: var(--shadow-md);

  /* --- RADIUS --- */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;

  /* --- INPUTS --- */
  --input-bg: #ffffff;             /* Clean Panel White */
  --input-border: #cfd2d8;
  --input-focus: #3b6af8;

  /* --- DERIVED TOKENS --- */
  --color-background: var(--color-bg);
  --color-sidebar: var(--color-sidebar-bg);
  --color-topbar: var(--color-topbar-bg);
  --color-card: var(--color-surface);

  --surface: var(--color-surface);
  --surface-alt: var(--color-surface-soft);

  --text-primary: var(--color-text-main);
  --text-secondary: var(--color-text-muted);

  --border: var(--color-border-subtle);

  --success: var(--color-success);
  --warning: var(--color-warning);
  --danger: var(--color-danger);

  --accent: var(--color-primary);
}

/* ==============================
   2) RESET & BASE
   ============================== */

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

html,
body {
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: flex;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text",
    "Segoe UI", system-ui, sans-serif;
  line-height: 1.45;
  letter-spacing: 0.01em;
  color: var(--color-text-main);
  background:
    radial-gradient(circle at 0% 0%, #ffffff 92%, rgba(226, 232, 240, 0.8)),
    radial-gradient(circle at 100% 0%, #e0e7ff 86%, transparent),
    linear-gradient(145deg, #eef1f6, #e5e7f2);
  -webkit-font-smoothing: antialiased;
}

.hidden {
  display: none !important;
}

a {
  color: inherit;
  text-decoration: none;
}

button {
  font-family: inherit;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
}

/* ==============================
   3) SIDEBAR – VISION PRO PANEL
   ============================== */

nav.sidebar {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 220px;

  background: radial-gradient(
      circle at 0% 0%,
      rgba(15, 23, 42, 0.96),
      rgba(15, 23, 42, 0.92)
    ),
    linear-gradient(145deg, #020617, #020617);
  border-right: 1px solid rgba(15, 23, 42, 0.9);
  box-shadow: var(--shadow-soft);

  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 20px 18px 16px;
  z-index: 40;
  backdrop-filter: blur(26px);
  color: #e5e7eb;
}

/* Logo / Header */
.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid rgba(51, 65, 85, 0.9);
}

.sidebar-logo {
  width: 100%;
  max-width: 184px;
  height: 46px;
  border-radius: 14px;
  background:
    #020617 url("Logo_re_Sc.png") center center / contain no-repeat;
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.6),
    0 18px 40px rgba(15, 23, 42, 0.8);
  text-indent: -9999px;
  overflow: hidden;
}

/* Footer System-Status */
.sidebar-footer {
  margin-top: auto;
  padding-top: 18px;
  border-top: 1px solid rgba(51, 65, 85, 0.9);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-status-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: rgba(148, 163, 184, 0.9);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.7);
}

/* Navigation */
.sidebar-nav {
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid rgba(51, 65, 85, 0.9);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow-y: auto;
}

/* Scrollbar dezent */
.sidebar-nav::-webkit-scrollbar {
  width: 6px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.6);
  border-radius: 999px;
}

/* Nav-Buttons */
.sidebar-nav-item {
  list-style: none;
}

.sidebar-nav-button {
  width: 100%;
  padding: 9px 10px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: rgba(209, 213, 219, 0.9);
  font-size: 0.84rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 9px;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    border-color 0.16s ease,
    transform 0.06s ease;
}

.sidebar-nav-icon {
  font-size: 0.9rem;
  width: 18px;
  text-align: center;
}

/* Normaler Hover */
.sidebar-nav-button:hover {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.26),
    rgba(15, 23, 42, 1)
  );
  border-color: rgba(59, 130, 246, 0.9);
  color: #e5e7eb;
  transform: translateY(-1px);
}

/* Aktiver Eintrag */
.sidebar-nav-button.active {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.4),
    rgba(15, 23, 42, 1)
  );
  border-color: rgba(59, 130, 246, 1);
  color: #f9fafb;
  box-shadow:
    0 18px 38px rgba(15, 23, 42, 0.8),
    0 0 0 0.6px rgba(255, 255, 255, 0.1) inset;
}

/* Footer in Sidebar */
.sidebar-footer-button {
  width: 100%;
  padding: 9px 10px;
  border-radius: 999px;
  border: 1px dashed rgba(148, 163, 184, 0.9);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(15, 23, 42, 0.98),
    rgba(30, 64, 175, 0.96)
  );
  color: #e5e7eb;
  font-size: 0.76rem;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.06s ease,
    border-color 0.16s ease;
}

.sidebar-footer-button:hover {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.85),
    rgba(30, 64, 175, 0.95)
  );
  border-color: rgba(129, 140, 248, 0.95);
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.9);
  transform: translateY(-1px);
}

/* ==============================
   4) APP-SHELL & TOPBAR
   ============================== */

.app-shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  margin-left: 220px;
}

#topbar {
  position: fixed;
  top: 0;
  left: 220px;
  right: 0;
  height: 96px;
  padding: 18px 32px;
  z-index: 50;

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;

  background: linear-gradient(
    135deg,
    rgba(249, 250, 251, 0.98),
    rgba(229, 231, 235, 0.98)
  );
  border-bottom: 1px solid rgba(148, 163, 184, 0.9);
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.16);
  backdrop-filter: blur(28px);
}

.topbar-left,
.topbar-center,
.topbar-right {
  display: flex;
  align-items: center;
  gap: 14px;
}

.topbar-left {
  min-width: 280px;
}

.topbar-center {
  flex: 1;
  justify-content: center;
}

.topbar-right {
  justify-content: flex-end;
  gap: 10px;
}

.topbar-greeting {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.topbar-greeting-title,
#topbarGreeting {
  font-size: 0.96rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-main);
}

.topbar-greeting-meta {
  font-size: 0.78rem;
  color: var(--color-text-muted);
  display: flex;
  gap: 10px;
  opacity: 0.9;
}

/* Topbar Controls – Brand/Campaign Select */
.topbar-select-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-select-group label {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-soft);
}

.topbar-select {
  min-width: 240px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.9),
    rgba(226, 232, 240, 0.88)
  );
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  padding: 9px 34px 9px 14px;
  font-size: 0.84rem;
  color: var(--color-text-main);
  outline: none;
  appearance: none;
  background-image: linear-gradient(to bottom, transparent, transparent),
    url("data:image/svg+xml,%3Csvg width='9' height='5' viewBox='0 0 9 5' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L4.5 4L8 1' stroke='%236b7280' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat, no-repeat;
  background-position: right 11px center, right 11px center;
  background-size: 9px 5px, 9px 5px;
}

.topbar-select:hover {
  border-color: rgba(37, 99, 235, 0.9);
  box-shadow:
    0 16px 40px rgba(15, 23, 42, 0.35),
    0 0 0 0.6px rgba(255, 255, 255, 1) inset;
}

/* Topbar Buttons (Icons) */
.icon-button {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.95),
    rgba(226, 232, 240, 0.9)
  );
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  font-size: 0.95rem;
  position: relative;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.06s ease,
    border-color 0.16s ease;
}

.icon-button:hover {
  border-color: rgba(37, 99, 235, 0.95);
  color: #1d4ed8;
  box-shadow:
    0 22px 60px rgba(15, 23, 42, 0.4),
    0 0 0 0.6px rgba(255, 255, 255, 1) inset;
  transform: translateY(-1px);
}

/* Notifications Dot */
.notification-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #f97316;
  box-shadow: 0 0 0 2px rgba(248, 250, 252, 1);
}

/* ==============================
   5) MAIN CONTENT & VIEWS
   ============================== */

.main-content {
  flex: 1;
  padding: 112px 32px 32px;
}

/* Alle Views: zentriert, nur eine sichtbar */
.view {
  display: none;
  max-width: 1320px;
  margin: 0 auto;
  padding: 26px 22px 40px;
  border-radius: 24px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.94)
  );
  box-shadow:
    0 24px 75px rgba(15, 23, 42, 0.36),
    0 0 0 0.8px rgba(255, 255, 255, 0.9) inset;
  border: 1px solid rgba(148, 163, 184, 0.45);
  backdrop-filter: blur(26px);
}

/* Globale View-Überschrift ("Wo bin ich?") */
.view::before {
  content: attr(data-view-title);
  display: block;
  margin-bottom: 20px;
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.view.active {
  display: block;
}

/* View-Header */
.view-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.view-header h2 {
  font-size: 1.32rem;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}

.view-subtitle {
  font-size: 0.9rem;
  color: var(--color-text-muted);
}

/* ==============================
   6) GENERISCHE CARDS & KPI
   ============================== */

/* Card-Grundlayout */
.card {
  background: var(--color-surface);
  border-radius: 18px;
  padding: 16px 16px 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.18),
    0 0 0 0.4px rgba(255, 255, 255, 0.9) inset;
}

/* Headline-Row in Card */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 0.84rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-main);
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

/* KPI-Gitter */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.metric-card {
  border-radius: 14px;
  padding: 10px 12px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.95)
  );
  border: 1px solid rgba(226, 232, 240, 1);
  box-shadow:
    0 16px 48px rgba(15, 23, 42, 0.22),
    0 0 0 0.6px rgba(255, 255, 255, 0.92) inset;
}

.metric-label {
  font-size: 0.74rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--color-text-soft);
  margin-bottom: 4px;
}

.metric-value {
  font-size: 1.02rem;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.metric-subtext {
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

/* KPI Badge */
.kpi-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  font-size: 0.72rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #4b5563;
}

/* Status Colors */
.kpi-badge.good {
  background: rgba(22, 163, 74, 0.08);
  border-color: rgba(22, 163, 74, 0.5);
  color: #166534;
}

.kpi-badge.warning {
  background: rgba(245, 158, 11, 0.1);
  border-color: rgba(245, 158, 11, 0.55);
  color: #92400e;
}

.kpi-badge.critical {
  background: rgba(220, 38, 38, 0.08);
  border-color: rgba(220, 38, 38, 0.55);
  color: #b91c1c;
}

/* ==============================
   7) DASHBOARD SPEZIFISCH
   ============================== */

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.1fr);
  gap: 16px;
  margin-bottom: 16px;
}

/* Performance-Sektion (links) */
.performance-section {
  display: grid;
  grid-template-columns: 2fr 1.2fr;
  gap: 12px;
}

/* Kleine Charts / Sektionen (rechts) */
.dashboard-section {
  display: grid;
  grid-template-columns: 1.1fr 1.1fr;
  gap: 12px;
}

/* Tables im Dashboard (Mini-Version) */
.table-mini {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.table-mini th,
.table-mini td {
  padding: 6px 6px;
  border-bottom: 1px dashed rgba(148, 163, 184, 0.4);
  text-align: left;
}

.table-mini th {
  text-transform: uppercase;
  letter-spacing: 0.14em;
  font-size: 0.7rem;
  color: var(--color-text-soft);
}

/* ==============================
   8) CREATIVE LIBRARY
   ============================== */

.creative-library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.creative-library-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* Searchbar / Filter */
.meta-input {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  padding: 7px 10px;
  font-size: 0.8rem;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.96)
  );
  color: var(--color-text-main);
  outline: none;
  min-width: 160px;
}

.meta-input::placeholder {
  color: var(--color-text-soft);
}

/* Primary Button (z. B. "Neues Creative") */
.meta-button {
  border-radius: 999px;
  border: 1px solid rgba(37, 99, 235, 0.9);
  padding: 7px 12px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.96),
    rgba(147, 197, 253, 0.95)
  );
  color: #f9fafb;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  transition:
    box-shadow 0.16s ease,
    transform 0.06s ease,
    background 0.16s ease,
    border-color 0.16s ease;
}

.meta-button:hover {
  box-shadow:
    0 24px 70px rgba(30, 64, 175, 0.6),
    0 0 0 0.6px rgba(255, 255, 255, 0.9) inset;
  transform: translateY(-1px);
}

/* Topbar CTA Variante (immer rot) */
#topbar .meta-button {
  border-color: rgba(248, 113, 113, 0.95);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 113, 113, 0.98),
    rgba(239, 68, 68, 0.98)
  );
  color: #fef2f2;
  min-width: 150px;
  font-size: 0.78rem;
  letter-spacing: 0.18em;
}

#topbar .meta-button:hover {
  border-color: rgba(248, 113, 113, 1);
  box-shadow:
    0 24px 72px rgba(127, 29, 29, 0.8),
    0 0 0 0.7px rgba(255, 255, 255, 1) inset;
  transform: translateY(-1px);
}

/* Creative Grid */
.creative-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.creative-card {
  border-radius: 16px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.96)
  );
  border: 1px solid rgba(226, 232, 240, 1);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.25),
    0 0 0 0.6px rgba(255, 255, 255, 0.9) inset;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Thumbnail */
.creative-thumb {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(148, 163, 184, 0.8);
  height: 110px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.96),
    rgba(226, 232, 240, 0.9)
  );
}

/* Tags / Meta-Info */
.creative-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-size: 0.76rem;
  color: var(--color-text-muted);
}

/* ==============================
   9) CAMPAIGNS VIEW
   ============================== */

.campaigns-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.campaigns-kpi-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

/* Tabelle für Kampagnen */
.campaign-table-wrapper {
  margin-top: 12px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 1);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.96),
    rgba(226, 232, 240, 0.9)
  );
  box-shadow:
    0 18px 50px rgba(15, 23, 42, 0.26),
    0 0 0 0.6px rgba(255, 255, 255, 0.9) inset;
}

.campaign-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.campaign-table thead {
  background: rgba(248, 250, 252, 0.98);
}

.campaign-table th,
.campaign-table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
  text-align: left;
  white-space: nowrap;
}

.campaign-table th {
  font-size: 0.7rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--color-text-soft);
}

.campaign-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(248, 250, 252, 0.96);
}

/* ==============================
   10) TESTING LOG VIEW
   ============================== */

.testing-log-grid {
  display: grid;
  grid-template-columns: 2.3fr 1.1fr;
  gap: 12px;
}

/* Left: Table */
.testing-table-wrapper {
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 1);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.96),
    rgba(226, 232, 240, 0.9)
  );
  box-shadow:
    0 18px 50px rgba(15, 23, 42, 0.26),
    0 0 0 0.6px rgba(255, 255, 255, 0.9) inset;
  padding-bottom: 4px;
}

.testing-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.78rem;
}

.testing-table th,
.testing-table td {
  padding: 7px 9px;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
}

.testing-table th {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: var(--color-text-soft);
}

/* Right: Detail Card */
.testing-detail-card {
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 1);
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.96),
    rgba(226, 232, 240, 0.9)
  );
  box-shadow:
    0 18px 50px rgba(15, 23, 42, 0.26),
    0 0 0 0.6px rgba(255, 255, 255, 0.9) inset;
  padding: 12px 12px 10px;
}

/* ==============================
   11) SENSEI – AI SUITE
   ============================== */

.sensei-layout {
  display: grid;
  grid-template-columns: 1.7fr 1.1fr;
  gap: 14px;
}

/* Sensei Hauptkarte */
.sensei-card {
  border-radius: 18px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.96)
  );
  border: 1px solid rgba(226, 232, 240, 1);
  box-shadow:
    0 22px 65px rgba(15, 23, 42, 0.28),
    0 0 0 0.7px rgba(255, 255, 255, 0.98) inset;
  padding: 14px 14px 12px;
}

/* Headline und Icon */
.sensei-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.sensei-card-title {
  font-size: 0.9rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.sensei-card-subtitle {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}

/* Sensei Avatare / Icon */
.sensei-avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.98),
    rgba(147, 197, 253, 0.96)
  );
  box-shadow:
    0 18px 45px rgba(30, 64, 175, 0.6),
    0 0 0 0.6px rgba(255, 255, 255, 1) inset;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #eff6ff;
}

/* Sensei Tabs */
.sensei-tabs {
  display: inline-flex;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.9);
  padding: 2px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.96),
    rgba(226, 232, 240, 0.9)
  );
  margin-top: 10px;
  margin-bottom: 10px;
}

.sensei-tab {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 0.74rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: none;
  background: transparent;
  color: var(--color-text-soft);
  min-width: 90px;
  text-align: center;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    box-shadow 0.16s ease;
}

.sensei-tab.active {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(59, 130, 246, 0.98),
    rgba(147, 197, 253, 0.96)
  );
  color: #f9fafb;
  box-shadow:
    0 20px 60px rgba(30, 64, 175, 0.6),
    0 0 0 0.7px rgba(255, 255, 255, 1) inset;
}

/* Sensei Output Panel */
.sensei-output {
  margin-top: 10px;
  padding: 10px 11px;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 1);
  background: rgba(248, 250, 252, 0.98);
  font-size: 0.8rem;
  color: #111827;
}

/* Sensei Bullet-Listen */
.sensei-output ul {
  margin: 6px 0 4px 18px;
  padding: 0;
}

/* ==============================
   12) REPORTS VIEW
   ============================== */

.reports-layout {
  display: grid;
  grid-template-columns: minmax(0, 2.1fr) minmax(0, 1.2fr);
  gap: 14px;
}

.reports-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reports-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.report-card {
  border-radius: 16px;
  padding: 14px 14px 12px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(248, 250, 252, 0.98),
    rgba(226, 232, 240, 0.96)
  );
  border: 1px solid rgba(226, 232, 240, 1);
  box-shadow:
    0 20px 60px rgba(15, 23, 42, 0.3),
    0 0 0 0.7px rgba(255, 255, 255, 0.95) inset;
}

/* Reports Table */
.reports-table-wrapper {
  margin-top: 10px;
}

.reports-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8rem;
}

.reports-table th,
.reports-table td {
  padding: 7px 8px;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
  text-align: left;
}

.reports-table th {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--color-text-soft);
}

/* Pill / Badge in Reports */
.badge-pill {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  border: 1px solid rgba(148, 163, 184, 0.8);
  background: rgba(248, 250, 252, 0.96);
}

/* ==============================
   13) TEAM VIEW (NEU)
   ============================== */

.team-avatar {
  width: 36px;
  height: 36px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight:600;
  font-size:0.9rem;
}

.badge-owner { background:#1e3a8a; color:white; padding:3px 8px; border-radius:999px; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em;}
.badge-admin { background:#4f46e5; color:white; padding:3px 8px; border-radius:999px; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em;}
.badge-analyst { background:#6b7280; color:white; padding:3px 8px; border-radius:999px; font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em;}

/* ==============================
   14) GLOBAL TOASTS
   ============================== */

#toastContainer {
  position: fixed;
  right: 22px;
  bottom: 22px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 120;
}

.toast {
  min-width: 260px;
  background: radial-gradient(
    circle at 0% 0%,
    rgba(255, 255, 255, 0.98),
    rgba(241, 245, 255, 0.98)
  );
  border-radius: var(--radius-md);
  border: 1px solid rgba(148, 163, 184, 0.6);
  box-shadow:
    0 18px 45px rgba(15, 23, 42, 0.3),
    0 0 0 0.8px rgba(255, 255, 255, 1) inset;
  padding: 9px 11px;
  font-size: 0.8rem;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: 0;
  transform: translateY(6px);
  transition:
    opacity 0.16s ease-out,
    transform 0.2s ease-out;
}

.toast.visible {
  opacity: 1;
  transform: translateY(0);
}

.toast-success {
  border-color: var(--color-success);
  background: var(--color-success-soft);
}

.toast-warning {
  border-color: var(--color-warning);
  background: var(--color-warning-soft);
}

.toast-error {
  border-color: var(--color-danger);
  background: var(--color-danger-soft);
}

/* ==============================
   15) GLOBAL MODAL
   ============================== */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  backdrop-filter: blur(18px);
}

.modal-shell {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(255, 255, 255, 0.98),
    rgba(241, 245, 255, 0.98)
  );
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.5);
  box-shadow:
    0 30px 80px rgba(15, 23, 42, 0.5),
    0 0 0 0.6px rgba(255, 255, 255, 0.98) inset;
  width: min(720px, 94vw);
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(226, 232, 240, 1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.modal-close-button {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(248, 250, 252, 0.98);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  color: #4b5563;
}

.modal-body {
  padding: 14px 16px 16px;
  font-size: 0.86rem;
  color: #111827;
}

/* ==============================
   16) GLOBAL LOADER (ORBIT)
   ============================== */

.global-loader {
  position: fixed;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 200;
  backdrop-filter: blur(10px);
}

#globalLoader.active {
  display: flex;
}

.global-loader-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: var(--color-text-muted);
  font-size: 0.8rem;
}

.loader-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: #3b82f6;
  box-shadow:
    0 0 0 0 rgba(59, 130, 246, 0.5),
    0 0 0 0.8px rgba(255, 255, 255, 0.9) inset;
  animation: loader-pulse 1s infinite ease-in-out alternate;
}

.loader-dot:nth-child(2) {
  animation-delay: 0.1s;
}

.loader-dot:nth-child(3) {
  animation-delay: 0.2s;
}

@keyframes loader-pulse {
  0% {
    transform: translateY(0);
    opacity: 0.7;
  }
  100% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

/* ==============================
   17) SKELETON BLOCKS
   ============================== */

.skeleton-block {
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(226, 232, 240, 0.7),
    rgba(248, 250, 252, 0.95),
    rgba(226, 232, 240, 0.7)
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.1s infinite linear;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 0% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* ==============================
   18) MISC POLISH & OVERRIDES
   ============================== */

.metric-card,
.card,
.report-card,
.sensei-card,
.testing-detail-card,
.testing-table-wrapper,
.campaign-table-wrapper {
  transition:
    transform 0.12s ease,
    box-shadow 0.16s ease,
    border-color 0.16s ease;
}

.metric-card:hover,
.card:hover,
.report-card:hover,
.sensei-card:hover,
.testing-detail-card:hover,
.testing-table-wrapper:hover,
.campaign-table-wrapper:hover {
  transform: translateY(-2px);
  box-shadow:
    0 26px 80px rgba(15, 23, 42, 0.38),
    0 0 0 0.9px rgba(255, 255, 255, 0.95) inset;
  border-color: rgba(148, 163, 184, 0.9);
}

/* ICON BUTTONS */
.icon-button,
.creative-card-menu {
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: rgba(248, 250, 252, 0.98);
  width: 26px;
  height: 26px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
  color: #4b5563;
  transition:
    background 0.16s ease,
    box-shadow 0.16s ease,
    transform 0.06s ease,
    border-color 0.16s ease;
}

.icon-button:hover,
.creative-card-menu:hover {
  background: radial-gradient(
    circle at 0% 0%,
    rgba(191, 219, 254, 0.24),
    rgba(239, 246, 255, 0.98)
  );
  border-color: rgba(37, 99, 235, 0.95);
  box-shadow:
    0 20px 60px rgba(15, 23, 42, 0.35),
    0 0 0 0.7px rgba(255, 255, 255, 1) inset;
  transform: translateY(-1px);
}

/* TYPOGRAPHY POLISH — spacing + weight */
h1, h2, h3, h4 {
  font-weight: 600 !important;
  letter-spacing: 0.05em !important;
}

.view-subtitle,
.subtitle {
  letter-spacing: 0.01em;
  color: #64748b !important;
}

/* RESPONSIVE POLISH */
@media (max-width: 1024px) {
  .app-shell {
    margin-left: 0;
  }

  nav.sidebar {
    display: none;
  }

  #topbar {
    left: 0;
  }

  .main-content {
    padding: 112px 12px 24px;
  }

  .view {
    padding: 20px 18px 40px !important;
  }
}
