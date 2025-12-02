/* ============================================================
   SignalOne.app.js – SPA Backbone (stabile Version)
   ============================================================ */

/* -------------------------------
   1) GLOBAL STATE & CONFIG
   ------------------------------- */

const AppState = {
  currentModule: "dashboard", // default view
  demoMode: true,             // Demo = true, Live = false (kann später über Settings geändert werden)
  metaConnected: false,
  systemHealthy: true,

  meta: {
    token: null,
    user: null,
  },

  selectedBrandId: null,
  selectedCampaignId: null,

  notifications: [],
};

const DemoData =
  (window.SignalOneDemo && window.SignalOneDemo.DemoData) ||
  window.DemoData ||
  {};

/**
 * Map der logischen Module auf ihre View-Section-IDs in index.html
 * → IDs müssen mit dem Markup übereinstimmen.
 */
const ViewMap = {
  dashboard: "dashboardView",
  creativeLibrary: "creativeLibraryView",
  campaigns: "campaignsView",
  testingLog: "testingLogView",
  sensei: "senseiView",
  roast: "roastView",
  reports: "reportsView",
  creatorInsights: "creatorInsightsView",
  analytics: "analyticsView",
  team: "teamView",
  brands: "brandsView",
  shopify: "shopifyView",
  onboarding: "onboardingView",
  settings: "settingsView",
};

/**
 * User-freundliche Modul-Bezeichnungen (für Fehlermeldungen & Logs)
 */
const ModuleLabels = {
  dashboard: "Dashboard",
  creativeLibrary: "Creative Library",
  campaigns: "Kampagnen",
  testingLog: "Testing Log",
  sensei: "Sensei / AI Suite",
  roast: "Roast",
  reports: "Reports",
  creatorInsights: "Creator Insights",
  analytics: "Analytics",
  team: "Team",
  brands: "Brands",
  shopify: "Shopify",
};

/**
 * ES-Module Loader – jedes Modul hat /packages/<key>/index.js
 * und exportiert eine render(section, appState, helpers) Funktion.
 */
const ModuleLoader = {
  dashboard: () => import("/packages/dashboard/index.js"),
  creativeLibrary: () => import("/packages/creativeLibrary/index.js"),
  campaigns: () => import("/packages/campaigns/index.js"),
  testingLog: () => import("/packages/testingLog/index.js"),
  sensei: () => import("/packages/sensei/index.js"),
  roast: () => import("/packages/roast/index.js"),
  reports: () => import("/packages/reports/index.js"),
  creatorInsights: () => import("/packages/creatorInsights/index.js"),
  analytics: () => import("/packages/analytics/index.js"),
  team: () => import("/packages/team/index.js"),
  brands: () => import("/packages/brands/index.js"),
  shopify: () => import("/packages/shopify/index.js"),
};

/**
 * Views, die im Live-Modus eine Meta-Verbindung benötigen.
 * Im Demo-Modus sind sie trotzdem nutzbar.
 */
const ModulesRequiringMeta = new Set([
  "creativeLibrary",
  "campaigns",
  "testingLog",
  "sensei",
  "roast",
  "reports",
]);

function useDemoMode() {
  return !!AppState.demoMode;
}

/* -------------------------------
   2) DOM HELPERS
   ------------------------------- */

function $(id) {
  return document.getElementById(id);
}

function $qs(selector, root = document) {
  return root.querySelector(selector);
}

function $qsa(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

/* -------------------------------
   3) VIEW HANDLING
   ------------------------------- */

function setActiveView(viewId) {
  const views = $qsa(".view");
  views.forEach((view) => {
    if (view.id === viewId) {
      view.classList.add("active");
    } else {
      view.classList.remove("active");
    }
  });

  // Goldener Banner basiert auf data-view-title im Markup.
  const active = document.getElementById(viewId);
  if (active) {
    const title = active.getAttribute("data-view-title") || "";
    const headerTitle = $("viewTitle");
    if (headerTitle) {
      headerTitle.textContent = title;
    }
  }
}

function setActiveNav(moduleKey) {
  const navButtons = $qsa("[data-nav-module]");
  navButtons.forEach((btn) => {
    if (btn.dataset.navModule === moduleKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/* -------------------------------
   4) GLOBAL LOADER
   ------------------------------- */

function showGlobalLoader() {
  const loader = $("globalLoader");
  if (loader) loader.classList.remove("hidden");
}

function hideGlobalLoader() {
  const loader = $("globalLoader");
  if (loader) loader.classList.add("hidden");
}

/* -------------------------------
   5) TOAST SYSTEM
   ------------------------------- */

function showToast(message, type = "info") {
  const container = $("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Reflow für kleine Fade-In Animation
  // eslint-disable-next-line no-unused-expressions
  toast.offsetHeight;
  toast.classList.add("visible");

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

/* -------------------------------
   6) MODAL SYSTEM
   ------------------------------- */

function openSystemModal(title, bodyHtml) {
  const overlay = $("modalOverlay");
  const titleEl = $("modalTitle");
  const bodyEl = $("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = bodyHtml;

  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeSystemModal() {
  const overlay = $("modalOverlay");
  if (!overlay) return;

  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

/* -------------------------------
   7) SIDEBAR NAVIGATION
   ------------------------------- */

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: "dashboard" },
  { key: "creativeLibrary", label: "Creative Library", icon: "library" },
  { key: "campaigns", label: "Kampagnen", icon: "campaigns" },
  { key: "testingLog", label: "Testing Log", icon: "testing" },
  { key: "sensei", label: "Sensei", icon: "sensei" },
  { key: "roast", label: "Roast", icon: "roast" },
  { key: "creatorInsights", label: "Creator Insights", icon: "insights" },
  { key: "analytics", label: "Analytics", icon: "analytics" },
  { key: "team", label: "Team", icon: "team" },
  { key: "brands", label: "Brand", icon: "brand" },
  { key: "shopify", label: "Shopify", icon: "shopify" },
  { key: "reports", label: "Reports", icon: "reports" },
  { key: "onboarding", label: "Onboarding", icon: "onboarding" },
];

function renderNav() {
  const navContainer = $("navbar");
  if (!navContainer) return;

  navContainer.innerHTML = "";

  NAV_ITEMS.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "nav-item";
    btn.dataset.navModule = item.key;

    btn.innerHTML = `
      <span class="nav-icon">
        <svg aria-hidden="true" focusable="false">
          <use href="#icon-${item.icon}"></use>
        </svg>
      </span>
      <span class="nav-label">${item.label}</span>
    `;

    btn.addEventListener("click", () => {
      navigateTo(item.key);
    });

    navContainer.appendChild(btn);
  });
}

/* -------------------------------
   8) TOPBAR – DATUM & GREETING
   ------------------------------- */

function updateTopbarDateTime() {
  const now = new Date();

  const dateEl = $("topbarDate");
  const timeEl = $("topbarTime");

  if (dateEl) {
    const dateFormatter = new Intl.DateTimeFormat("de-DE", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    dateEl.textContent = dateFormatter.format(now);
  }

  if (timeEl) {
    const timeFormatter = new Intl.DateTimeFormat("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeEl.textContent = timeFormatter.format(now);
  }
}

function getEffectiveBrandOwnerName() {
  const brandId = AppState.selectedBrandId;
  const brand =
    (DemoData.brands || []).find((b) => b.id === brandId) || DemoData.brands?.[0];
  return brand?.ownerName || "ACME Fashion GmbH";
}

function updateTopbarGreeting() {
  const greetingEl = $("topbarGreeting");
  if (!greetingEl) return;

  const now = new Date();
  const hour = now.getHours();

  let greet;
  if (hour < 11) greet = "Guten Morgen";
  else if (hour < 18) greet = "Guten Tag";
  else greet = "Guten Abend";

  greetingEl.textContent = `${greet}, ${getEffectiveBrandOwnerName()}!`;
}

/* -------------------------------
   9) STATUS DOTS (Sidebar + Topbar)
   ------------------------------- */

function updateMetaStatusUI() {
  const dot = $("sidebarMetaDot");
  const label = $("sidebarMetaLabel");
  const topButton = $("metaConnectButton");

  const connected = AppState.metaConnected;

  if (dot) {
    dot.classList.toggle("status-dot-ok", connected);
    dot.classList.toggle("status-dot-bad", !connected);
  }

  if (label) {
    label.textContent = connected ? "Meta Ads: Verbunden" : "Meta Ads: Getrennt";
  }

  if (topButton) {
    topButton.textContent = connected ? "META TRENNEN" : "MIT META VERBINDEN";
  }
}

function updateSystemHealthUI() {
  const dot = $("sidebarSystemDot");
  const label = $("sidebarSystemLabel");

  const ok = AppState.systemHealthy;

  if (dot) {
    dot.classList.toggle("status-dot-ok", ok);
    dot.classList.toggle("status-dot-bad", !ok);
  }

  if (label) {
    label.textContent = ok ? "System: OK" : "System: Problem";
  }
}

function updateCampaignHealthUI() {
  const dot = $("sidebarCampaignDot");
  const label = $("sidebarCampaignLabel");

  // Für jetzt: immer "stark" im Demo
  const healthy = true;

  if (dot) {
    dot.classList.toggle("status-dot-ok", healthy);
    dot.classList.toggle("status-dot-bad", !healthy);
  }

  if (label) {
    label.textContent = healthy
      ? "Campaigns: Stark"
      : "Campaigns: Bitte prüfen";
  }
}

/* -------------------------------
   10) BRAND & CAMPAIGN SELECTS
   ------------------------------- */

function populateBrandSelect() {
  const select = $("brandSelect");
  if (!select) return;

  const brands = DemoData.brands || [];

  select.innerHTML = "";

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

/* -------------------------------
   11) META CONNECT (Front-Gate)
   ------------------------------- */

async function toggleMetaConnection() {
  // Live-Pfad über MetaAuth, wenn vorhanden und kein DemoMode
  if (!useDemoMode() && !AppState.metaConnected && window.MetaAuth) {
    try {
      showGlobalLoader();
      if (typeof window.MetaAuth.connectWithPopup === "function") {
        const result = await window.MetaAuth.connectWithPopup();
        AppState.metaConnected = !!(result && result.success !== false);
        AppState.meta.user = result?.user || null;
      } else {
        // Fallback: simple Toggle
        AppState.metaConnected = true;
      }
      showToast("Meta erfolgreich verbunden.", "success");
    } catch (err) {
      console.error("Meta Connect Fehler:", err);
      showToast("Meta-Verbindung fehlgeschlagen.", "error");
      AppState.metaConnected = false;
    } finally {
      hideGlobalLoader();
      updateMetaStatusUI();
      updateCampaignHealthUI();
    }
    return;
  }

  // Demo-Toggle oder Disconnect
  if (AppState.metaConnected) {
    // Disconnect
    try {
      if (window.MetaAuth && typeof window.MetaAuth.disconnect === "function") {
        await window.MetaAuth.disconnect();
      }
    } catch (err) {
      console.warn("MetaAuth.disconnect() Fehler (ignoriere):", err);
    }

    AppState.metaConnected = false;
    AppState.meta.user = null;
    AppState.meta.token = null;
    showToast("Meta-Verbindung getrennt.", "info");
  } else {
    // Im reinen Demo-Modus einfach nur togglen
    AppState.metaConnected = true;
    showToast("Meta-Demo-Verbindung aktiv.", "success");
  }

  updateMetaStatusUI();
  updateCampaignHealthUI();
}

/* -------------------------------
   12) MODULE LOADING
   ------------------------------- */

async function loadModule(moduleKey) {
  const viewId = ViewMap[moduleKey];
  if (!viewId) {
    console.warn("[SignalOne] Kein View für Modul:", moduleKey);
    return;
  }

  const section = document.getElementById(viewId);
  if (!section) {
    console.warn("[SignalOne] Section nicht gefunden:", viewId);
    return;
  }

  // Views ohne eigenes Modul (Onboarding, Settings) bleiben statisch
  if (!ModuleLoader[moduleKey]) return;

  // Meta-Gate nur im Live-Modus
  if (
    ModulesRequiringMeta.has(moduleKey) &&
    !useDemoMode() &&
    !AppState.metaConnected
  ) {
    section.innerHTML = `
      <div class="so-card">
        <h2 class="so-card-title">Meta-Verbindung erforderlich</h2>
        <p class="so-card-subtitle">
          Verbinde zuerst dein Meta-Konto oder aktiviere den Demo-Modus, um Daten zu sehen.
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

  // optional: kleines Skeleton
  section.innerHTML = `
    <div class="view-skeleton">
      <div class="view-skeleton-header"></div>
      <div class="view-skeleton-row"></div>
      <div class="view-skeleton-row"></div>
      <div class="view-skeleton-row"></div>
    </div>
  `;

  try {
    const loaderFn = ModuleLoader[moduleKey];
    const module = await loaderFn();

    if (typeof module.render !== "function") {
      throw new Error(
        `Modul "${moduleKey}" exportiert keine render(section, appState, helpers) Funktion.`
      );
    }

    section.innerHTML = "";

    await module.render(section, AppState, {
      useDemoMode: useDemoMode(),
      showToast,
      openSystemModal,
      closeSystemModal,
    });
  } catch (err) {
    console.error("Fehler beim Laden des Moduls", moduleKey, err);
    AppState.systemHealthy = false;

    section.innerHTML = `
      <div class="so-card">
        <h2 class="so-card-title">Fehler beim Laden der View</h2>
        <p class="so-card-subtitle">
          Modul <code>${moduleKey}</code> konnte nicht geladen werden.
        </p>
        <p style="font-size:0.9rem; color:var(--color-text-muted);">
          Bitte prüfe, ob <code>/packages/${moduleKey}/index.js</code> existiert
          und eine <code>render(...)</code>-Funktion exportiert.
        </p>
      </div>
    `;

    const label = ModuleLabels[moduleKey] || moduleKey;
    showToast(`Fehler beim Laden von "${label}".`, "error");
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
  }
}

/* -------------------------------
   13) NAVIGATE
   ------------------------------- */

async function navigateTo(moduleKey) {
  if (!ViewMap[moduleKey]) {
    console.warn("[SignalOne] Unbekanntes Modul:", moduleKey);
    return;
  }

  AppState.currentModule = moduleKey;

  const viewId = ViewMap[moduleKey];
  setActiveView(viewId);
  setActiveNav(moduleKey);

  await loadModule(moduleKey);
}

/* -------------------------------
   14) BOOTSTRAP
   ------------------------------- */

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

  // Initiale View / Modul
  const initialViewId = ViewMap[AppState.currentModule];
  if (initialViewId) {
    setActiveView(initialViewId);
    setActiveNav(AppState.currentModule);
  }

  // Erstes Modul laden (Dashboard)
  navigateTo(AppState.currentModule);

  console.log("✅ SignalOne Bootstrap abgeschlossen.");
});

/* -------------------------------
   15) GLOBAL DEBUG API
   ------------------------------- */

window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
  useDemoMode,
};
