// PHASE 1 – UPDATED app.js (Option 1 Basis, Variant B IDs)
import MetaAuth from "/packages/metaAuth/index.js";
// Vorbereitung: Struktur, State, View-Map Fix, Module-Map Fix

/* ==========================================
   0) GLOBAL APP STATE
========================================== */
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    user: null,
    ads: [],
    campaigns: [],
    adsets: [],
    accounts: [],
    lastSync: null,
  },
  systemHealthy: true,
  notifications: [],
  settings: {
    theme: "light",
    currency: "EUR",
    demoMode: true,
    dateRange: "last_30_days",
  },
  ui: {
    sidebarCollapsed: false,
    lastViewChange: null,
  },
};

/* ==========================================
   1) MODULE REGISTRY (FIXED for Variant B)
========================================== */
const modules = {
  dashboard: () => import("./packages/dashboard/index.js"),
  creatives: () => import("./packages/creatives/index.js"),
  campaigns: () => import("./packages/campaigns/index.js"),
  sensei: () => import("./packages/sensei/index.js"),
  reports: () => import("./packages/reports/index.js"),
  logs: () => import("./packages/logs/index.js"),
  settings: () => import("./packages/settings/index.js"),
  onboarding: () => import("./packages/onboarding/index.js"),
};

/* ==========================================
   2) VIEW ID MAP (FIXED for Variant B)
========================================== */
const viewIdMap = {
  dashboard: "dashboardView",
  creatives: "creativesView",       // FIXED
  campaigns: "campaignsView",
  sensei: "senseiView",
  reports: "reportsExportView",      // FIXED
  logs: "testingLogView",
  settings: "settingsView",
  onboarding: "onboardingView",
};

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

/* ==========================================
   3) NECESSARY META REQUIREMENTS
========================================== */
const modulesRequiringMeta = [
  "dashboard",
  "creatives",
  "campaigns",
  "sensei",
  "reports",
  "logs",
];

// ==========================================
// PART 2/6 – Utility Functions, Loaders, Toasts
// ==========================================

/* ==========================================
   4) UTILITY FUNCTIONS
========================================== */
function showGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.remove("hidden");
}

function hideGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.add("hidden");
}

function showToast(message, variant = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${variant}`;
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 220);
  }, 3800);
}

function fadeIn(el) {
  if (!el) return;
  el.style.opacity = 0;
  el.style.transition = "opacity 0.18s ease";
  requestAnimationFrame(() => (el.style.opacity = 1));
}

/* ==========================================
   5) USE DEMO MODE
========================================== */
function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

/* ==========================================
   6) EMPTY STATE HERO
========================================== */
function createEmptyStateMarkup(variant, ctx = {}) {
  const label = ctx.label || "diesem Bereich";

  let title = "";
  let body = "";
  let primaryLabel = "";
  let secondaryLabel = "";
  let eyebrow = "";
  let hint = "";

  if (variant === "requires-connection") {
    eyebrow = "Keine Live-Daten";
    title = "Verbinde Meta oder aktiviere den Demo-Modus";
    body = `Für ${label} benötigen wir Live-Daten oder den Demo-Datensatz.`;
    primaryLabel = "Meta verbinden";
    secondaryLabel = "Demo-Modus aktivieren";
    hint = "Deine echten Daten bleiben immer read-only.";
  } else if (variant === "error") {
    eyebrow = "Fehler";
    title = "Modul konnte nicht geladen werden";
    body = "Die Verbindung war kurz gestört. Versuch es erneut.";
    primaryLabel = "Erneut versuchen";
    hint = "Bleibt der Fehler bestehen, melde dich beim Support.";
  } else {
    eyebrow = "Keine Daten";
    title = "Dieser Bereich ist leer";
    body = `Für ${label} liegen aktuell keine Daten vor.`;
    primaryLabel = ctx.primaryLabel || "Zeitraum anpassen";
    hint = "Prüfe Filter & Zeitraum oben.";
  }

  return `
    <div class="empty-state">
      <div class="empty-state-illustration">
        <div class="empty-state-orbit outer"></div>
        <div class="empty-state-orbit inner"></div>
        <div class="empty-state-logo-dot"></div>
      </div>
      <div class="empty-state-content">
        <p class="empty-state-eyebrow">${eyebrow}</p>
        <h2 class="empty-state-title">${title}</h2>
        <p class="empty-state-body">${body}</p>
        <div class="empty-state-actions">
          ${primaryLabel ? `<button class="btn primary empty-state-primary">${primaryLabel}</button>` : ""}
          ${secondaryLabel ? `<button class="btn ghost empty-state-secondary">${secondaryLabel}</button>` : ""}
        </div>
        <p class="empty-state-hint">${hint}</p>
      </div>
    </div>`;
}

function renderEmptyState(section, variant, ctx = {}) {
  if (!section) return;
  const html = createEmptyStateMarkup(variant, ctx);
  section.innerHTML = html;
  fadeIn(section);
}

// ==========================================
// PART 3/6 – NAVIGATION, SIDEBAR, STATUS UI
// ==========================================

/* ==========================================
   7) SIDEBAR NAVIGATION RENDERING
========================================== */
function renderNav() {
  const nav = document.getElementById("navbar");
  if (!nav) return;

  nav.innerHTML = "";

  const items = [
    { key: "dashboard", label: "Dashboard", icon: "#icon-dashboard" },
    { key: "creatives", label: "Creatives", icon: "#icon-collection" },
    { key: "campaigns", label: "Campaigns", icon: "#icon-campaign" },
    { key: "sensei", label: "Sensei", icon: "#icon-brain" },
    { key: "reports", label: "Reports", icon: "#icon-report" },
    { key: "logs", label: "Logs", icon: "#icon-log" },
    { key: "settings", label: "Settings", icon: "#icon-settings" },
  ];

  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";

    const btn = document.createElement("button");
    btn.className = "sidebar-nav-button";
    btn.dataset.module = item.key;

    btn.innerHTML = `
      <svg class="icon-svg" aria-hidden="true">
        <use href="${item.icon}"></use>
      </svg>
      <span class="label">${item.label}</span>
    `;

    btn.addEventListener("click", () => navigateTo(item.key));

    li.appendChild(btn);
    nav.appendChild(li);
  });

  highlightActiveNav();
}

function highlightActiveNav() {
  const buttons = document.querySelectorAll(".sidebar-nav-button");
  buttons.forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.module === AppState.currentModule
    );
  });
}

/* ==========================================
   8) TOPBAR UPDATES
========================================== */
function updateTopbarGreeting() {
  const el = document.getElementById("topbarGreeting");
  if (!el) return;

  let hour = new Date().getHours();
  let greeting = "Willkommen";
  if (hour < 11) greeting = "Guten Morgen";
  else if (hour < 18) greeting = "Guten Tag";
  else greeting = "Guten Abend";

  const name = AppState.meta.user?.name || "Partner";
  el.textContent = `${greeting}, ${name}`;
}

function updateTopbarDateTime() {
  const elDate = document.getElementById("topbarDate");
  const elTime = document.getElementById("topbarTime");
  if (!elDate || !elTime) return;

  const now = new Date();
  elDate.textContent = now.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  elTime.textContent = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ==========================================
   9) STATUS DOTS
========================================== */
function updateStatusDots() {
  const systemDot = document.getElementById("sidebarSystemDot");
  const systemLabel = document.getElementById("sidebarSystemLabel");

  const campaignDot = document.getElementById("sidebarCampaignDot");
  const campaignLabel = document.getElementById("sidebarCampaignLabel");

  const metaDot = document.getElementById("sidebarMetaDot");
  const metaLabel = document.getElementById("sidebarMetaLabel");

  if (systemDot && systemLabel) {
    if (AppState.systemHealthy) {
      systemDot.style.background = "#22c55e";
      systemLabel.textContent = "System Health: OK";
    } else {
      systemDot.style.background = "#e11d48";
      systemLabel.textContent = "System Health: Fehler";
    }
  }

  if (campaignDot && campaignLabel) {
    if (useDemoMode()) {
      campaignDot.style.background = "#3b82f6";
      campaignLabel.textContent = "Campaign Health: Demo";
    } else {
      campaignDot.style.background = "#22c55e";
      campaignLabel.textContent = "Campaign Health: Live";
    }
  }

  if (metaDot && metaLabel) {
    if (!AppState.metaConnected) {
      metaDot.style.background = "#e11d48";
      metaLabel.textContent = "Meta Ads: Getrennt";
    } else if (useDemoMode()) {
      metaDot.style.background = "#3b82f6";
      metaLabel.textContent = "Meta Ads: Demo-Modus";
    } else {
      metaDot.style.background = "#22c55e";
      metaLabel.textContent = "Meta Ads: Live";
    }
  }
}

// ==========================================
// PART 4/6 – MODULE LOAD, META AUTH, DEMO/LIVE SYNC
// ==========================================

/* ==========================================
   10) LOAD MODULES (SAFE VERSION)
========================================== */
async function loadModule(key) {
  const loader = modules[key];
  const viewId = getViewIdForModule(key);
  const section = document.getElementById(viewId);

  if (!loader) {
    console.warn("[SignalOne] Modul nicht gefunden:", key);
    return;
  }

  if (!section) {
    console.warn("[SignalOne] View-Section fehlt für:", viewId);
    return;
  }

  // Meta required?
  if (
    modulesRequiringMeta.includes(key) &&
    !AppState.metaConnected &&
    !useDemoMode()
  ) {
    renderEmptyState(section, "requires-connection", { label: key });
    showToast("Meta verbinden oder Demo-Modus aktivieren.", "warning");
    return;
  }

  showGlobalLoader();
  section.innerHTML = "<div class='skeleton-block' style='height:180px;'></div>";

  try {
    const module = await loader();

    if (module?.render) {
      section.innerHTML = "";
      module.render(section, AppState, { useDemoMode: useDemoMode() });
      fadeIn(section);
    } else {
      section.textContent = `Modul "${key}" hat keine render()-Funktion.`;
    }

    AppState.systemHealthy = true;
  } catch (err) {
    console.error("[SignalOne] Modul-Ladefehler", key, err);
    renderEmptyState(section, "error", { label: key });
    showToast(`Fehler beim Laden von ${key}`, "error");
    AppState.systemHealthy = false;
  } finally {
    hideGlobalLoader();
    updateStatusDots();
    updateTopbarGreeting();
  }
}

/* ==========================================
   11) NAVIGATE TO VIEW
========================================== */
async function navigateTo(key) {
  if (!modules[key]) return;

  AppState.currentModule = key;
  AppState.ui.lastViewChange = new Date().toISOString();

  const viewId = getViewIdForModule(key);
  const views = document.querySelectorAll(".view");
  views.forEach((v) => v.classList.remove("active"));

  const target = document.getElementById(viewId);
  if (target) target.classList.add("active");

  highlightActiveNav();
  updateStatusDots();
  await loadModule(key);
}

/* ==========================================
   12) META AUTH FLOW (POPUP)
========================================== */
async function connectMeta() {
  try {
    if (window.MetaAuth?.connectWithPopup) {
      await window.MetaAuth.connectWithPopup();
      AppState.metaConnected = true;
      showToast("Meta erfolgreich verbunden.", "success");
      updateStatusDots();
    }
  } catch (err) {
    console.error("Meta Verbindung Fehler:", err);
    showToast("Meta-Verbindung fehlgeschlagen.", "error");
  }
}

/* ==========================================
   13) DEMO MODE TOGGLE
========================================== */
document.addEventListener("change", (e) => {
  if (e.target.id === "demoModeToggle") {
    AppState.settings.demoMode = e.target.checked;
    if (AppState.settings.demoMode) {
      showToast("Demo-Modus aktiv.", "info");
    } else {
      showToast("Demo-Modus deaktiviert.", "info");
    }
    navigateTo(AppState.currentModule);
  }
});

// ==========================================
// PART 5/6 – BOOTSTRAP, BINDINGS, INITIAL STATE
// ==========================================

/* ==========================================
   14) BOOTSTRAP / DOMContentLoaded
========================================== */

document.addEventListener("DOMContentLoaded", () => {
  // 1) Sidebar Navigation aufbauen
  renderNav();

  // 2) Default View aktivieren
  const initialViewId = getViewIdForModule(AppState.currentModule);
  const initialView = document.getElementById(initialViewId);
  if (initialView) {
    initialView.classList.add("active");
  }

  // 3) Topbar-Zeit & Greeting
  updateTopbarGreeting();
  updateTopbarDateTime();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  // 4) Status-Dots
  updateStatusDots();

  // 5) Buttons verdrahten
  const metaBtnTop = document.getElementById("metaConnectButton");
  if (metaBtnTop) {
    metaBtnTop.addEventListener("click", connectMeta);
  }

  const metaBtnSettings = document.getElementById("metaConnectButtonSettings");
  if (metaBtnSettings) {
    metaBtnSettings.addEventListener("click", connectMeta);
  }

  const settingsButton = document.getElementById("settingsButton");
  if (settingsButton) {
    settingsButton.addEventListener("click", () => navigateTo("settings"));
  }

  const logoutButton = document.getElementById("logoutButton");
  if (logoutButton) {
    logoutButton.addEventListener("click", () => {
      AppState.metaConnected = false;
      AppState.meta.user = null;
      AppState.meta.accounts = [];
      AppState.meta.campaigns = [];
      AppState.meta.ads = [];
      AppState.settings.demoMode = true;
      updateStatusDots();
      showToast("Session zurückgesetzt. Demo-Modus aktiv.", "success");
      navigateTo("dashboard");
    });
  }

  // 6) Demo-Toggle initial setzen
  const demoToggle = document.getElementById("demoModeToggle");
  if (demoToggle) {
    demoToggle.checked = !!AppState.settings.demoMode;
  }

  // 7) Erste Modul-Ladung
  loadModule(AppState.currentModule);

  console.log("✅ SignalOne Phase 1 Bootstrap abgeschlossen.");
});

// ==========================================
// PART 6/6 – GLOBAL EXPOSE (DEV HELPER)
// ==========================================

window.SignalOne = {
  AppState,
  navigateTo,
  useDemoMode,
  showToast,
  UI: {
    showGlobalLoader,
    hideGlobalLoader,
    renderEmptyState,
  },
};

// ==========================================
// ENDE app.js – PHASE 1 (Option 1 Basis)
// ==========================================
