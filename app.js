/*
 * app.js – SignalOne Core Backbone
 * Navigation • View Handling • Meta Simulation • Toasts • Modal
 * + Gold-Icon Sidebar & Brand-Subheader
 */

/* ----------------------------------------------------------
   GLOBAL APP STATE
-----------------------------------------------------------*/
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

const DemoData = {
  brand: {
    id: "acme_fashion",
    name: "ACME Fashion",
    vertical: "D2C Apparel",
    country: "DE",
  },
  kpis: {
    spend30d: 47892,
    roas30d: 4.8,
    revenue30d: 229882,
    ctr: 0.032,
    cpm: 8.4,
  },
  alerts: [
    {
      id: "roas_drop",
      type: "critical",
      label: "ROAS -22% in den letzten 3 Tagen",
      description:
        "Deine Top-Kampagne hat einen deutlichen Performance-Drop. Sensei hat bereits eine Skalierungs-Empfehlung vorbereitet.",
    },
    {
      id: "creative_fatigue",
      type: "warning",
      label: "Creative C-47 verliert Performance",
      description:
        "Frequency steigt, CTR fällt. Zeit für frische Hooks – Sensei schlägt 3 neue Varianten vor.",
    },
    {
      id: "winner_scaling",
      type: "success",
      label: 'Kampagne "UGC Scale Test" übertrifft Benchmark +38%',
      description:
        "Sensei empfiehlt schrittweise Budget-Erhöhung bei stabiler Performance.",
    },
  ],
  topCreatives: [
    {
      id: "mia_hook_v3",
      name: "Mia_Hook_Problem_Solution_v3",
      roas: 6.8,
      spend: 12340,
      ctr: 0.041,
      score: 94,
      tag: "Winner",
      hook: "Problem/Solution",
      creator: "Mia",
      runningDays: 12,
    },
    {
      id: "tom_testimonial_v1",
      name: "Tom_Testimonial_ShortForm_v1",
      roas: 5.9,
      spend: 8400,
      ctr: 0.038,
      score: 91,
      tag: "Winner",
      hook: "Testimonial",
      creator: "Tom",
      runningDays: 9,
    },
    {
      id: "lisa_before_after_v2",
      name: "Lisa_BeforeAfter_Showcase_v2",
      roas: 5.2,
      spend: 6100,
      ctr: 0.035,
      score: 89,
      tag: "Winner",
      hook: "Before/After",
      creator: "Lisa",
      runningDays: 14,
    },
  ],
  loserCreative: {
    id: "generic_static_v12",
    name: "Generic_Product_Static_v12",
    roas: 1.2,
    wastedSpend: 3200,
    ctr: 0.009,
    recommendation:
      "Pausiere sofort. Ersetze durch Hook-Based UGC und teste eine Variante mit Creator Mia (+180% historisch).",
  },
  senseiPlan: {
    date: "2025-11-24",
    priorities: [
      {
        id: "budget_reallocation",
        label: "Budget Reallocation",
        level: "critical",
        description:
          'Reduziere "Brand Awareness Static" um 30% und erhöhe "UGC Scale Test" um 50%.',
        estimatedImpactPerDayRevenue: 2100,
        estimatedImpactRoasDelta: 0.6,
      },
      {
        id: "creative_rotation",
        label: "Creative Rotation",
        level: "focus",
        description:
          "Pausiere C-47, C-51, C-63 (<2x ROAS) und aktiviere 3 neue Varianten von Creator Mia.",
      },
      {
        id: "testing_opportunity",
        label: "Testing Opportunity",
        level: "testing",
        description:
          'Starte Hook-Test "Problem/Solution" vs "Testimonial" mit 150€/Tag für 3 Tage.',
      },
    ],
  },
  brands: [
    {
      id: "acme_fashion",
      name: "ACME Fashion",
      ownerName: "ACME GmbH",
      vertical: "Apparel",
      spend30d: 18400,
      roas30d: 4.8,
      campaignHealth: "good",
    },
    {
      id: "techgadgets_pro",
      name: "TechGadgets Pro",
      ownerName: "TechGadgets DACH",
      vertical: "Consumer Electronics",
      spend30d: 12100,
      roas30d: 3.2,
      campaignHealth: "attention",
    },
    {
      id: "beautylux",
      name: "BeautyLux",
      ownerName: "BeautyLux Labs",
      vertical: "Beauty / Skincare",
      spend30d: 8900,
      roas30d: 5.9,
      campaignHealth: "excellent",
    },
    {
      id: "global_wear",
      name: "Global Wear Collective",
      ownerName: "Global Wear GmbH",
      vertical: "Streetwear",
      spend30d: 9200,
      roas30d: 3.8,
      campaignHealth: "good",
    },
    {
      id: "fitlife_supplements",
      name: "FitLife Supplements",
      ownerName: "FitLife Labs",
      vertical: "Fitness / Nutrition",
      spend30d: 32101,
      roas30d: 4.1,
      campaignHealth: "warning",
    },
    {
      id: "homezen_living",
      name: "HomeZen Living",
      ownerName: "HomeZen Living GmbH",
      vertical: "Home & Living",
      spend30d: 15432,
      roas30d: 3.5,
      campaignHealth: "attention",
    },
  ],
};

/* ----------------------------------------------------------
   MODULE REGISTRY & VIEW MAP
-----------------------------------------------------------*/
const modules = {
  dashboard: () => import("/packages/dashboard/index.js"),
  creatives: () => import("/packages/creatives/index.js"),
  campaigns: () => import("/packages/campaigns/index.js"),
  sensei: () => import("/packages/sensei/index.js"),
  reports: () => import("/packages/reports/index.js"),
  logs: () => import("/packages/logs/index.js"),
  settings: () => import("/packages/settings/index.js"),
  onboarding: () => import("/packages/onboarding/index.js"),
};

const viewIdMap = {
  dashboard: "dashboardView",
  creatives: "creativesView",
  campaigns: "campaignsView",
  sensei: "senseiView",
  reports: "reportsExportView",
  logs: "testingLogView",
  settings: "settingsView",
  onboarding: "onboardingView",
};

const modulesRequiringMeta = [
  "dashboard",
  "creatives",
  "campaigns",
  "sensei",
  "reports",
  "logs",
];

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function getLabelForModule(key) {
  switch (key) {
    case "dashboard":
      return "Dashboard";
    case "creatives":
      return "Creative Library";
    case "campaigns":
      return "Kampagnen";
    case "sensei":
      return "Sensei / AI Suite";
    case "reports":
      return "Reports & Export";
    case "logs":
      return "Testing Log";
    case "settings":
      return "Settings";
    case "onboarding":
      return "Onboarding";
    default:
      return key || "Modul";
  }
}

/* ----------------------------------------------------------
   META AUTH GATEWAY INTEGRATION
-----------------------------------------------------------*/
import MetaAuth from "/packages/metaAuth/index.js";

/* ----------------------------------------------------------
   UTILS
-----------------------------------------------------------*/
function showGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.add("visible");
}

function hideGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.remove("visible");
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

function openSystemModal(title, body) {
  const modal = document.getElementById("systemModal");
  if (!modal) return;
  modal.querySelector(".modal-title").textContent = title;
  modal.querySelector(".modal-body").textContent = body;
  modal.classList.add("open");
}

function closeSystemModal() {
  const modal = document.getElementById("systemModal");
  if (!modal) return;
  modal.classList.remove("open");
}

function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

/* ----------------------------------------------------------
   SIDEBAR & NAV
-----------------------------------------------------------*/
function renderNav() {
  const links = document.querySelectorAll(".nav-link");
  links.forEach((link) => {
    const moduleKey = link.dataset.module;
    if (!moduleKey) return;
    link.classList.toggle("active", moduleKey === AppState.currentModule);
  });

  updateNavMetaBadge();
}

function updateNavMetaBadge() {
  const badge = document.querySelector(".meta-status");
  if (!badge) return;

  if (useDemoMode()) {
    badge.textContent = "Demo-Daten aktiv";
    badge.className = "meta-status demo";
  } else if (AppState.metaConnected) {
    badge.textContent = "Meta verbunden";
    badge.className = "meta-status live";
  } else {
    badge.textContent = "Meta nicht verbunden";
    badge.className = "meta-status";
  }
}

function updateSidebarActiveIcon(moduleKey) {
  const items = document.querySelectorAll(".sidebar-nav-item");
  items.forEach((item) => {
    const key = item.dataset.module;
    if (!key) return;
    item.classList.toggle("active", key === moduleKey);
  });
}

/* ----------------------------------------------------------
   SECTION & VIEW HELPERS
-----------------------------------------------------------*/
function setActiveView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });
}

function applySectionSkeleton(section) {
  if (!section) return;
  section.innerHTML = `
    <div class="skeleton-block" style="height: 20px; width: 40%; margin-bottom: 16px;"></div>
    <div class="skeleton-block" style="height: 120px; margin-bottom: 14px;"></div>
    <div class="skeleton-block" style="height: 200px;"></div>
  `;
}

function fadeIn(el) {
  if (!el) return;
  el.style.opacity = 0;
  el.style.transition = "opacity 0.18s ease";
  requestAnimationFrame(() => (el.style.opacity = 1));
}

/* ----------------------------------------------------------
   EMPTY STATE HERO – NO DATA / ERROR / NO CONNECTION
-----------------------------------------------------------*/
function createEmptyStateMarkup(variant, ctx = {}) {
  const label = ctx.label || "diesem Bereich";
  let title = "";
  let body = "";
  let primaryLabel = "";
  let secondaryLabel = "";
  let eyebrow = "";
  let hint = "";

  if (variant === "requires-connection") {
    eyebrow = "Keine Live-Daten (noch)";
    title = "Verbinde Meta oder nutze den Demo-Modus";
    body =
      "Für " +
      label +
      " brauchen wir entweder eine aktive Meta-Verbindung oder den kuratierten Demo-Datensatz.";
    primaryLabel = "Meta verbinden";
    secondaryLabel = "Demo-Modus aktivieren";
    hint =
      "Deine echten Daten bleiben natürlich read-only – wir fassen nichts im Ads Manager an.";
  } else if (variant === "error") {
    eyebrow = "Ups – hier hakt etwas";
    title = "Dieses Modul konnte gerade nicht geladen werden";
    body =
      "Das passiert selbst in elitären Setups. Meist hilft ein neuer Versuch – die Verbindung oder Antwort von Meta war wahrscheinlich kurzzeitig gestört.";
    primaryLabel = "Erneut versuchen";
    secondaryLabel = "";
    hint =
      "Wenn der Fehler bleibt, schreib uns einfach – Logs & Testing sind bereits mitgedacht.";
  } else {
    eyebrow = "Gerade keine Daten sichtbar";
    title = "Hier ist aktuell alles leer";
    body =
      "Entweder liegen für " +
      label +
      " noch keine Ergebnisse vor oder der gewählte Zeitraum ist zu kurz.";
    primaryLabel = ctx.primaryLabel || "Zeitraum anpassen";
    secondaryLabel = ctx.secondaryLabel || "";
    hint =
      "Tipp: Wähle einen längeren Zeitraum oder überprüfe die Filter oben in der Leiste.";
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
          ${primaryLabel ? `<button type="button" class="btn primary empty-state-primary">${primaryLabel}</button>` : ""}
          ${secondaryLabel ? `<button type="button" class="btn ghost empty-state-secondary">${secondaryLabel}</button>` : ""}
        </div>
        <p class="empty-state-hint">${hint}</p>
      </div>
    </div>
  `;
}

function renderEmptyState(section, variant, ctx = {}) {
  if (!section) return;

  const label =
    ctx.label ||
    (typeof getLabelForModule === "function" && ctx.moduleKey
      ? getLabelForModule(ctx.moduleKey)
      : "diesen Bereich");

  const html = createEmptyStateMarkup(variant, { ...ctx, label });

  section.innerHTML = html;
  fadeIn(section);

  const primaryBtn = section.querySelector(".empty-state-primary");
  const secondaryBtn = section.querySelector(".empty-state-secondary");
  const moduleKey = ctx.moduleKey;

  if (variant === "requires-connection") {
    if (primaryBtn) {
      primaryBtn.addEventListener("click", () => {
        primaryBtn.disabled = true;
        primaryBtn.textContent = "Verbinde Meta…";
        MetaAuth.connectWithPopup().finally(() => {
          primaryBtn.disabled = false;
          primaryBtn.textContent = "Meta verbinden";
        });
      });
    }
    if (secondaryBtn) {
      secondaryBtn.addEventListener("click", () => {
        if (!AppState.settings) AppState.settings = {};
        AppState.settings.demoMode = true;
        showToast(
          "Demo-Modus aktiviert – SignalOne zeigt jetzt kuratierte Beispieldaten.",
          "success"
        );
        if (moduleKey) {
          loadModule(moduleKey);
        }
      });
    }
  } else if (variant === "error") {
    if (primaryBtn) {
      primaryBtn.addEventListener("click", () => {
        if (moduleKey) loadModule(moduleKey);
      });
    }
  }
}

/* ----------------------------------------------------------
   META STATUS & SYSTEM HEALTH
-----------------------------------------------------------*/
function updateMetaStatusUI() {
  const chip = document.querySelector(".meta-chip");
  if (!chip) return;

  if (useDemoMode()) {
    chip.textContent = "Demo-Modus aktiv";
    chip.className = "meta-chip meta-chip-demo";
  } else if (AppState.metaConnected) {
    chip.textContent = "Meta Live · Verbunden";
    chip.className = "meta-chip meta-chip-live";
  } else {
    chip.textContent = "Meta nicht verbunden";
    chip.className = "meta-chip";
  }
}

function updateSystemHealthUI() {
  const pill = document.querySelector(".system-health-pill");
  if (!pill) return;

  if (AppState.systemHealthy) {
    pill.textContent = "System Health · OK";
    pill.className = "system-health-pill system-health-ok";
  } else {
    pill.textContent = "System Health · Check";
    pill.className = "system-health-pill system-health-warning";
  }
}

function updateTopbarGreeting() {
  const el = document.querySelector(".topbar-greeting");
  if (!el) return;
  const now = new Date();
  const hour = now.getHours();

  let greeting = "Willkommen zurück";
  if (hour < 11) greeting = "Guten Morgen";
  else if (hour < 18) greeting = "Guten Tag";
  else greeting = "Guten Abend";

  const name = AppState.meta.user?.name || "Sensei Partner";
  el.textContent = `${greeting}, ${name}`;
}

function updateTopbarDateTime() {
  const el = document.querySelector(".topbar-datetime");
  if (!el) return;

  const now = new Date();
  const date = now.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  el.textContent = `${date} · ${time}`;
}

function updateViewSubheaders() {
  const isDemo = useDemoMode();
  const pills = document.querySelectorAll("[data-pill='environment']");
  pills.forEach((pill) => {
    pill.textContent = isDemo ? "Demo-Daten" : "Live-Daten";
    pill.classList.toggle("pill-demo", isDemo);
    pill.classList.toggle("pill-live", !isDemo);
  });
}

function updateCampaignHealthUI() {
  const el = document.querySelector(".campaign-health-pill");
  if (!el) return;

  if (useDemoMode()) {
    el.textContent = "Demo Health · kuratierter Datensatz";
    el.className = "campaign-health-pill campaign-health-demo";
    return;
  }

  if (!AppState.metaConnected) {
    el.textContent = "Keine Live-Konten verbunden";
    el.className = "campaign-health-pill campaign-health-none";
    return;
  }

  el.textContent = "Account Health · Live";
  el.className = "campaign-health-pill campaign-health-live";
}

/* ----------------------------------------------------------
   NOTIFICATIONS
-----------------------------------------------------------*/
function pushNotification(level, title, meta = {}) {
  const id = `n_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
  const item = {
    id,
    level,
    title,
    meta,
    createdAt: new Date().toISOString(),
  };
  AppState.notifications.unshift(item);

  const bell = document.querySelector(".topbar-bell");
  if (bell) bell.classList.add("has-unread");
}

/* ----------------------------------------------------------
   MODULE LOADING & NAVIGATION
-----------------------------------------------------------*/
async function loadModule(key) {
  const loader = modules[key];
  const viewId = getViewIdForModule(key);
  const section = document.getElementById(viewId);

  if (!loader || !section) {
    console.warn("[SignalOne] Modul nicht gefunden:", key, viewId);
    return;
  }

  if (
    modulesRequiringMeta.includes(key) &&
    !AppState.metaConnected &&
    !useDemoMode()
  ) {
    if (key === "settings" || key === "onboarding") {
      section.innerHTML =
        "<p>Dieses Modul benötigt eine Meta-Verbindung oder den Demo-Modus.</p>";
    } else {
      renderEmptyState(section, "requires-connection", { moduleKey: key });
    }
    showToast("Bitte Meta verbinden oder Demo-Modus aktivieren.", "warning");
    updateCampaignHealthUI();
    return;
  }

  showGlobalLoader();
  applySectionSkeleton(section);

  try {
    const module = await loader();
    if (module?.render) {
      section.innerHTML = "";
      module.render(section, AppState, { useDemoMode: useDemoMode() });
      fadeIn(section);
    } else {
      section.textContent = `Das Modul "${key}" ist noch nicht implementiert.`;
    }
    AppState.systemHealthy = true;
  } catch (err) {
    console.error("[SignalOne] Fehler beim Laden", key, err);

    if (key === "settings" || key === "onboarding") {
      section.textContent = `Fehler beim Laden des Moduls "${key}".`;
    } else {
      renderEmptyState(section, "error", { moduleKey: key });
    }

    showToast(`Fehler beim Laden von ${getLabelForModule(key)}`, "error");
    pushNotification("error", `Modulfehler: ${getLabelForModule(key)}`, {
      module: key,
      error: String(err),
    });
    AppState.systemHealthy = false;
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
    updateViewSubheaders();
  }
}

async function navigateTo(key) {
  if (!modules[key]) return;

  AppState.currentModule = key;
  AppState.ui.lastViewChange = new Date().toISOString();

  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  renderNav();
  updateSidebarActiveIcon(key);
  updateTopbarGreeting();
  updateViewSubheaders();

  await loadModule(key);
}

/* ----------------------------------------------------------
   BOOTSTRAP
-----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll("[data-module]");
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const moduleKey = link.dataset.module;
      if (!moduleKey) return;
      navigateTo(moduleKey);
    });
  });

  const metaConnectButton = document.getElementById("metaConnectButton");
  if (metaConnectButton) {
    metaConnectButton.addEventListener("click", async () => {
      try {
        await MetaAuth.connectWithPopup();
      } catch (err) {
        console.error("[SignalOne] Meta Connect Fehler:", err);
        showToast("Meta-Verbindung fehlgeschlagen.", "error");
      }
    });
  }

  const metaDemoLogoutButton = document.getElementById("metaDemoLogoutButton");
  if (metaDemoLogoutButton) {
    metaDemoLogoutButton.addEventListener("click", () => {
      AppState.metaConnected = false;
      AppState.meta.lastSync = null;
      AppState.meta.user = null;
      updateMetaStatusUI();
      updateCampaignHealthUI();
      updateTopbarGreeting();
      updateViewSubheaders();
      showToast("Session zurückgesetzt (Demo-Logout).", "success");
    });
  }

  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  loadModule(AppState.currentModule);

  console.log("✅ SignalOne Bootstrap abgeschlossen!");
});

/* ----------------------------------------------------------
   EXPOSED GLOBAL API
-----------------------------------------------------------*/
window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
  UI: {
    showGlobalLoader,
    hideGlobalLoader,
    fadeIn,
    useDemoMode,
    renderEmptyState,
    applySectionSkeleton,
  },
};
