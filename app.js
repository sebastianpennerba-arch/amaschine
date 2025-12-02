/* ============================================================
   SignalOne.app.js – SPA Backbone 2025
   High-Performance Vanilla JS (ohne Frameworks)
   ============================================================ */

/* ------------------------------------------------------------
   1) GLOBAL APP STATE
------------------------------------------------------------ */

export const AppState = {
  currentModule: "dashboard",

  metaConnected: false,
  meta: {
    token: null,
    user: null,
    ads: null,
    campaigns: null,
    accounts: null,
    insights: null,
  },

  selectedBrandId: null,
  selectedCampaignId: null,

  settings: {
    theme: "dark",
    currency: "EUR",
    demoMode: true,
    cacheTtl: 5 * 60 * 1000,
    defaultRange: "last_30_days",
  },

  onboardingStep: 1,
  tutorialMode: false,

  teamMembers: [],
  licenseLevel: "BETA",
  notifications: [],
  systemHealthy: true,
};

/* ------------------------------------------------------------
   2) DOM HELPERS
------------------------------------------------------------ */

export const $ = (id) => document.getElementById(id);
export const qs = (sel) => document.querySelector(sel);
export const qsa = (sel) => document.querySelectorAll(sel);

/* ------------------------------------------------------------
   3) VIEW REGISTRY (moduleKey -> section#id)
------------------------------------------------------------ */

export const ViewMap = {
  dashboard: "dashboardView",
  creativeLibrary: "creativeLibraryView",
  campaigns: "campaignsView",
  sensei: "senseiView",
  testingLog: "testingLogView",
  reports: "reportsView",
  creatorInsights: "creatorInsightsView",
  analytics: "analyticsView",

  team: "teamView",
  brands: "brandsView",
  shopify: "shopifyView",
  roast: "roastView",
  onboarding: "onboardingView",
  settings: "settingsView",
};

/* Menschlich lesbare Labels für Sidebar / Context */
export const ModuleLabels = {
  dashboard: "Dashboard",
  creativeLibrary: "Creative Library",
  campaigns: "Campaigns",
  sensei: "Sensei",
  testingLog: "Testing Log",
  reports: "Reports",
  creatorInsights: "Creator Insights",
  analytics: "Analytics",
  team: "Team",
  brands: "Brands",
  shopify: "Shopify",
  roast: "Roast",
  onboarding: "Onboarding",
  settings: "Settings",
};

/* ------------------------------------------------------------
   4) DYNAMIC MODULE LOADER
   (Jedes Modul exportiert: render(section, AppState, api))
------------------------------------------------------------ */

export const ModuleLoader = {
  dashboard: () => import("/packages/dashboard/index.js"),
  creativeLibrary: () => import("/packages/creativeLibrary/index.js"),
  campaigns: () => import("/packages/campaigns/index.js"),
  sensei: () => import("/packages/sensei/index.js"),
  testingLog: () => import("/packages/testingLog/index.js"),
  reports: () => import("/packages/reports/index.js"),
  creatorInsights: () => import("/packages/creatorInsights/index.js"),
  analytics: () => import("/packages/analytics/index.js"),
  team: () => import("/packages/team/index.js"),
  brands: () => import("/packages/brands/index.js"),
  shopify: () => import("/packages/shopify/index.js"),
  roast: () => import("/packages/roast/index.js"),
  onboarding: () => import("/packages/onboarding/index.js"),
  settings: () => import("/packages/settings/index.js"),
};

/* ------------------------------------------------------------
   5) MODULES THAT REQUIRE META CONNECTION
------------------------------------------------------------ */

export const RequiresMeta = [
  "dashboard",
  "creativeLibrary",
  "campaigns",
  "testingLog",
  "sensei",
  "reports",
  "analytics",
  "creatorInsights",
];

/* ------------------------------------------------------------
   6) DEMO DATA FALLBACK (wenn DataLayer / backend fehlt)
------------------------------------------------------------ */

export const DemoData =
  window.SignalOneDemo?.DemoData || {
    brands: [
      {
        id: "brand1",
        name: "ACME Fashion",
        ownerName: "ACME GmbH",
        vertical: "Fashion",
        campaignHealth: "good",
      },
    ],
    campaignsByBrand: {
      brand1: [
        { id: "c1", name: "ACME UGC Scale Test", status: "ACTIVE" },
        { id: "c2", name: "Hook Battle Q4", status: "TESTING" },
      ],
    },
  };

/* ------------------------------------------------------------
   7) DEMO MODE HELPER
------------------------------------------------------------ */

export function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

/* ============================================================
   8) META CONNECT (Demo + Live-API)
   ============================================================ */

export async function toggleMetaConnection() {
  // DEMO: nur lokaler Toggle
  if (useDemoMode()) {
    AppState.metaConnected = !AppState.metaConnected;

    if (AppState.metaConnected) {
      AppState.meta.token = "demo-token";
      AppState.meta.user = { name: "Demo User" };
      showToast("Meta Demo verbunden.", "success");
    } else {
      AppState.meta.token = null;
      AppState.meta.user = null;
      showToast("Meta Demo getrennt.", "warning");
    }

    updateMetaStatusUI();
    updateTopbarGreeting();
    updateCampaignHealthUI();
    return;
  }

  // LIVE MODE → gegen Backend (/meta/connect)
  try {
    const res = await fetch("/meta/connect", { method: "POST" });
    const data = await res.json();

    if (data?.success) {
      AppState.metaConnected = true;
      AppState.meta.token = data.token;
      AppState.meta.user = data.user;
      showToast("Meta Live verbunden!", "success");
    } else {
      throw new Error("Meta Connect fehlgeschlagen");
    }
  } catch (err) {
    console.error(err);
    showToast("Meta Verbindung fehlgeschlagen.", "error");
  }

  updateMetaStatusUI();
  updateTopbarGreeting();
  updateCampaignHealthUI();
}

/* ============================================================
   9) GLOBAL LOADER & SKELETON
   ============================================================ */

function showGlobalLoader() {
  const loader = $("globalLoader");
  if (loader) loader.classList.add("visible");
}

function hideGlobalLoader() {
  const loader = $("globalLoader");
  if (loader) loader.classList.remove("visible");
}

function applySkeleton(section) {
  if (!section) return;
  section.innerHTML = `
    <div class="skeleton-block" style="height: 180px; margin-bottom: 18px;"></div>
    <div class="skeleton-block" style="height: 260px; margin-bottom: 18px;"></div>
    <div class="skeleton-block" style="height: 220px;"></div>
  `;
}

/* ============================================================
   10) TOAST & MODAL SYSTEM
   ============================================================ */

let toastTimeoutHandle = null;

export function showToast(message, type = "info") {
  const container = $("toastContainer");
  if (!container) return;

  container.textContent = message;
  container.className = "";
  container.classList.add("toast", `toast-${type}`, "visible");

  if (toastTimeoutHandle) clearTimeout(toastTimeoutHandle);
  toastTimeoutHandle = setTimeout(() => {
    container.classList.remove("visible");
  }, 3500);
}

export function openSystemModal(title, bodyHtml) {
  const overlay = $("modalOverlay");
  const titleEl = $("modalTitle");
  const bodyEl = $("modalBody");

  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;
  overlay.classList.add("visible");
}

export function closeSystemModal() {
  const overlay = $("modalOverlay");
  if (overlay) overlay.classList.remove("visible");
}

/* ============================================================
   11) TOPBAR & SIDEBAR STATUS
   ============================================================ */

function getEffectiveBrand() {
  const brandId =
    AppState.selectedBrandId || DemoData.brands?.[0]?.id || null;
  return DemoData.brands?.find((b) => b.id === brandId) || null;
}

function getEffectiveBrandOwnerName() {
  const brand = getEffectiveBrand();
  return brand?.ownerName || brand?.name || "SignalOne User";
}

function updateTopbarGreeting() {
  const now = new Date();
  const hour = now.getHours();
  let greeting = "Hallo";

  if (hour < 11) greeting = "Guten Morgen";
  else if (hour < 18) greeting = "Guten Tag";
  else greeting = "Guten Abend";

  const brandOwner = getEffectiveBrandOwnerName();
  const el = $("topbarGreeting");
  if (el) el.textContent = `${greeting}, ${brandOwner}`;
}

function updateTopbarDateTime() {
  const now = new Date();
  const dateEl = $("topbarDate");
  const timeEl = $("topbarTime");
  if (!dateEl || !timeEl) return;

  dateEl.textContent = now.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  timeEl.textContent = now.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function updateMetaStatusUI() {
  const dot = $("sidebarMetaDot");
  const label = $("sidebarMetaLabel");
  const button = $("metaConnectButton");

  const connected = AppState.metaConnected;
  const demo = useDemoMode();

  if (dot) {
    dot.classList.toggle("status-ok", connected);
    dot.classList.toggle("status-bad", !connected);
  }

  if (label) {
    if (!connected) label.textContent = "Meta: nicht verbunden";
    else label.textContent = demo ? "Meta: Demo verbunden" : "Meta: Live verbunden";
  }

  if (button) {
    if (!connected) {
      button.textContent = "Mit Meta verbinden";
      button.classList.remove("meta-connected");
    } else {
      button.textContent = demo ? "Meta Demo trennen" : "Meta trennen";
      button.classList.add("meta-connected");
    }
  }
}

function updateSystemHealthUI() {
  const dot = $("sidebarSystemDot");
  const label = $("sidebarSystemLabel");
  if (!dot || !label) return;

  const healthy = AppState.systemHealthy;
  dot.classList.toggle("status-ok", healthy);
  dot.classList.toggle("status-bad", !healthy);

  label.textContent = healthy ? "System: OK" : "System: Issues";
}

function updateCampaignHealthUI() {
  const dot = $("sidebarCampaignDot");
  const label = $("sidebarCampaignLabel");
  if (!dot || !label) return;

  const brand = getEffectiveBrand();
  const health = brand?.campaignHealth || "unknown";

  dot.classList.remove("status-ok", "status-warn", "status-bad");

  if (health === "good") {
    dot.classList.add("status-ok");
    label.textContent = "Campaigns: gesund";
  } else if (health === "warning") {
    dot.classList.add("status-warn");
    label.textContent = "Campaigns: prüfen";
  } else if (health === "critical") {
    dot.classList.add("status-bad");
    label.textContent = "Campaigns: kritisch";
  } else {
    label.textContent = "Campaigns: n/a";
  }
}

/* ============================================================
   12) VIEW HANDLING (SECTIONS DIREKT, KEIN viewContainer!)
   ============================================================ */

function setActiveView(viewId) {
  const sections = qsa(".view");
  sections.forEach((section) => {
    if (section.id === viewId) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }
  });
}

/* Sidebar-Buttons aktiv setzen */
function setActiveNav(moduleKey) {
  const items = qsa(".sidebar-nav-button");
  items.forEach((btn) => {
    const key = btn.getAttribute("data-module");
    btn.classList.toggle("active", key === moduleKey);
  });
}

/* Navigation im Sidebar rendern (#navbar laut Doku) */
function renderNav() {
  const navbar = $("navbar");
  if (!navbar) return;

  const order = [
    "dashboard",
    "creativeLibrary",
    "campaigns",
    "sensei",
    "testingLog",
    "reports",
    "creatorInsights",
    "analytics",
    "team",
    "brands",
    "shopify",
    "roast",
    "onboarding",
    "settings",
  ];

  navbar.innerHTML = "";

  order.forEach((key) => {
    if (!ViewMap[key]) return;

    const li = document.createElement("li");
    li.className = "sidebar-nav-item";

    const btn = document.createElement("button");
    btn.className = "sidebar-nav-button";
    btn.setAttribute("data-module", key);
    btn.type = "button";

    // Icon via <use xlink:href="#icon-..."> aus index.html
    const iconWrapper = document.createElement("span");
    iconWrapper.className = "icon-wrapper";
    iconWrapper.innerHTML = `
      <svg class="icon-svg" aria-hidden="true">
        <use href="#icon-${key}" />
      </svg>
    `;

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = ModuleLabels[key] || key;

    btn.appendChild(iconWrapper);
    btn.appendChild(labelSpan);

    btn.addEventListener("click", () => {
      navigateTo(key);
    });

    li.appendChild(btn);
    navbar.appendChild(li);
  });
}

/* ============================================================
   13) MODULE LOAD + NAVIGATION
   ============================================================ */

async function loadModule(moduleKey) {
  const viewId = ViewMap[moduleKey];
  const section = viewId ? $(viewId) : null;

  if (!section) {
    console.warn("[SignalOne] View section nicht gefunden für", moduleKey);
    return;
  }

  // Meta-Gatekeeper: Views, die Live/Demo-Daten brauchen
  if (RequiresMeta.includes(moduleKey) && !AppState.metaConnected && !useDemoMode()) {
    section.innerHTML = `
      <div class="so-card" style="max-width: 520px;">
        <h2 class="so-card-title">Meta Verbindung benötigt</h2>
        <p class="so-card-subtitle">
          Diese View benötigt Daten aus deinem Meta Ads Account.
        </p>
        <p style="font-size:0.9rem; color:var(--color-text-muted); margin-bottom:14px;">
          Verbinde zuerst dein Meta-Konto oder aktiviere den Demo-Modus, um Beispiel-Daten
          zu sehen.
        </p>
        <button class="meta-button" id="metaConnectInline">
          Mit Meta verbinden
        </button>
      </div>
    `;
    const inlineBtn = $("metaConnectInline");
    if (inlineBtn) {
      inlineBtn.addEventListener("click", () => {
        $("metaConnectButton")?.click();
      });
    }
    return;
  }

  showGlobalLoader();
  applySkeleton(section);

  try {
    const loaderFn = ModuleLoader[moduleKey];
    if (!loaderFn) {
      throw new Error(`Kein ModuleLoader für "${moduleKey}" definiert.`);
    }

    const module = await loaderFn();
    if (typeof module.render !== "function") {
      throw new Error(`Modul "${moduleKey}" exportiert keine render(section, AppState, api) Funktion.`);
    }

    // Section vorher leeren, damit Modul eigenes Layout rendern kann
    section.innerHTML = "";

    await module.render(section, AppState, {
      useDemoMode: useDemoMode(),
      showToast,
      openSystemModal,
      closeSystemModal,
    });
  } catch (err) {
    console.error("Fehler beim Laden des Moduls", moduleKey, err);
    section.innerHTML = `
      <div class="so-card">
        <h2 class="so-card-title">Fehler beim Laden der View</h2>
        <p class="so-card-subtitle">
          Modul <code>${moduleKey}</code> konnte nicht geladen werden.
        </p>
        <p style="font-size:0.9rem; color:var(--color-text-muted);">
          Bitte überprüfe, ob <code>/packages/${moduleKey}/index.js</code> existiert
          und eine <code>render(...)</code>-Funktion exportiert.
        </p>
      </div>
    `;
    showToast(`Fehler beim Laden von "${ModuleLabels[moduleKey] || moduleKey}".`, "error");
  } finally {
    hideGlobalLoader();
  }
}

export async function navigateTo(moduleKey) {
  if (!ViewMap[moduleKey]) {
    console.warn("[SignalOne] Unbekanntes Modul:", moduleKey);
    return;
  }

  AppState.currentModule = moduleKey;

  const viewId = ViewMap[moduleKey];
  setActiveView(viewId);
  setActiveNav(moduleKey);

  // Optional: Context-Text in einer Subheader-Komponente oder so
  // (CSS kann z. B. data-view-title auf dem Section nutzen)

  await loadModule(moduleKey);
}

/* ============================================================
   14) BRAND & CAMPAIGN SELECT INITIALISIEREN
   ============================================================ */

function populateBrandSelect() {
  const select = $("brandSelect");
  if (!select) return;

  select.innerHTML = "";

  const brands = DemoData.brands || [];
  brands.forEach((brand) => {
    const opt = document.createElement("option");
    opt.value = brand.id;
    opt.textContent = brand.name;
    select.appendChild(opt);
  });

  const firstId = brands[0]?.id || null;
  AppState.selectedBrandId = firstId;
  if (firstId) select.value = firstId;
}

function populateCampaignSelect() {
  const select = $("campaignSelect");
  if (!select) return;

  const brandId = AppState.selectedBrandId;
  const campaigns = DemoData.campaignsByBrand?.[brandId] || [];

  select.innerHTML = "";

  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });

  AppState.selectedCampaignId = campaigns[0]?.id || null;
  if (AppState.selectedCampaignId) {
    select.value = AppState.selectedCampaignId;
  }
}

/* ============================================================
   15) BOOTSTRAP (DOMContentLoaded)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 SignalOne Bootstrapping…");

  // Sidebar Navigation
  renderNav();

  // Brand & Campaign Select
  populateBrandSelect();
  populateCampaignSelect();

  $("brandSelect")?.addEventListener("change", (evt) => {
    AppState.selectedBrandId = evt.target.value || null;
    populateCampaignSelect();
    updateTopbarGreeting();
    updateCampaignHealthUI();
  });

  $("campaignSelect")?.addEventListener("change", (evt) => {
    AppState.selectedCampaignId = evt.target.value || null;
  });

  // Meta Connect Button
  $("metaConnectButton")?.addEventListener("click", () => {
    toggleMetaConnection();
  });

  // Info / Profile / Logout / Modal
  $("notificationsButton")?.addEventListener("click", () => {
    openSystemModal(
      "Benachrichtigungen",
      "<p>In der Beta zeigen wir hier noch keine echten Logs an.</p>"
    );
  });

  $("profileButton")?.addEventListener("click", () => {
    openSystemModal(
      "Profil",
      `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>`
    );
  });

  $("settingsButton")?.addEventListener("click", () => {
    navigateTo("settings");
  });

  $("logoutButton")?.addEventListener("click", () => {
    AppState.metaConnected = false;
    AppState.meta.token = null;
    AppState.meta.user = null;
    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    showToast("Session zurückgesetzt (Demo-Logout).", "success");
    navigateTo("dashboard");
  });

  $("modalCloseButton")?.addEventListener("click", closeSystemModal);
  $("modalOverlay")?.addEventListener("click", (evt) => {
    if (evt.target === $("modalOverlay")) closeSystemModal();
  });

  // Zeit / Datum
  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60_000);

  // Status-Anzeigen
  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();

  // Initiale View
  const initialViewId = ViewMap[AppState.currentModule];
  if (initialViewId) {
    setActiveView(initialViewId);
    setActiveNav(AppState.currentModule);
  }

  // Erstes Modul laden (Dashboard)
  navigateTo(AppState.currentModule);

  console.log("✅ SignalOne Bootstrap abgeschlossen.");
});

/* ============================================================
   16) GLOBAL DEBUG API (optional)
   ============================================================ */

window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
  useDemoMode,
};
