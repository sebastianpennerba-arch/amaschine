/*
 * app.js
 * Zentrales Backbone von SignalOne.
 * Verantwortlich für:
 *  - Navigation & View-Handling
 *  - MetaAuth-Demo-Simulation
 *  - Demo-Mode-Toggle
 *  - Toast- & Modal-System
 *  - Delegation an modulare Packages (dashboard, creatives, sensei, ...)
 *
 * WICHTIG:
 *  - Keine Business-Logik hier; die liegt in den Packages.
 *  - Diese Datei bleibt möglichst schlank und stabil.
 */

// ---- Globaler AppState ----------------------------------------------------

const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    user: null,
    ads: [],
    campaigns: [],
    accounts: [],
    insights: [],
    token: null,
  },
  settings: {
    theme: "light",
    currency: "EUR",
    demoMode: true,
    cacheTtl: 300,
    defaultRange: "last_30_days",
  },
  onboardingStep: 0,
  tutorialMode: false,
  selectedBrandId: null,
  teamMembers: [],
  licenseLevel: "free", // mögliche Werte: free, pro, agency
  notifications: [],
};

// ---- Module-Registry (Dynamic Imports) ------------------------------------

const modules = {
  dashboard: () => import("./packages/dashboard/index.js"),
  creativeLibrary: () => import("./packages/creativeLibrary/index.js"),
  campaigns: () => import("./packages/campaigns/index.js"),
  testingLog: () => import("./packages/testingLog/index.js"),
  sensei: () => import("./packages/sensei/index.js"),
  onboarding: () => import("./packages/onboarding/index.js"),
  team: () => import("./packages/team/index.js"),
  brands: () => import("./packages/brands/index.js"),
  reports: () => import("./packages/reports/index.js"),
  creatorInsights: () => import("./packages/creatorInsights/index.js"),
  analytics: () => import("./packages/analytics/index.js"),
  roast: () => import("./packages/roast/index.js"),
  shopify: () => import("./packages/shopify/index.js"),
};

const moduleLabels = {
  dashboard: "Dashboard",
  creativeLibrary: "Creative Library",
  campaigns: "Kampagnen",
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
};

const viewIdMap = {
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
};

// Module, die einen Meta-Connect oder Demo-Mode benötigen
const modulesRequiringMeta = [
  "dashboard",
  "creativeLibrary",
  "campaigns",
  "testingLog",
  "sensei",
  "creatorInsights",
  "analytics",
  "reports",
];

// ---- UI-Helfer ------------------------------------------------------------

function getLabelForModule(key) {
  return moduleLabels[key] || key;
}

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function setActiveView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach((v) => {
    if (v.id === viewId) {
      v.classList.add("active");
    } else {
      v.classList.remove("active");
    }
  });
}

function updateTopbarTitle(key) {
  const el = document.getElementById("topbarViewTitle");
  if (!el) return;
  el.textContent = getLabelForModule(key);
}

function updateMetaStatusUI() {
  const badge = document.getElementById("metaStatusBadge");
  const button = document.getElementById("metaConnectButton");
  if (!badge || !button) return;

  if (AppState.metaConnected) {
    badge.textContent = "Meta verbunden (Demo)";
    badge.classList.remove("badge-offline");
    badge.classList.add("badge-online");
    button.textContent = "Meta trennen";
  } else {
    badge.textContent = "Meta nicht verbunden";
    badge.classList.remove("badge-online");
    badge.classList.add("badge-offline");
    button.textContent = "Meta verbinden";
  }
}

function updateDemoToggleUI() {
  const btn = document.getElementById("demoToggle");
  if (!btn) return;
  const isOn = AppState.settings.demoMode;
  btn.textContent = `Demo-Modus: ${isOn ? "AN" : "AUS"}`;
}

// ---- Toast-System ---------------------------------------------------------

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "success") toast.classList.add("toast-success");
  if (type === "warning") toast.classList.add("toast-warning");
  if (type === "error") toast.classList.add("toast-error");

  toast.textContent = message;
  container.appendChild(toast);

  // Einblenden
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  // Nach 3s wieder entfernen
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 200);
  }, 3000);
}

// ---- Modal-System ---------------------------------------------------------

function openSystemModal(title, bodyHtml) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = bodyHtml || "";
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");
}

function closeSystemModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");
}

// ---- Navigation -----------------------------------------------------------

function renderNav() {
  const navbar = document.getElementById("navbar");
  if (!navbar) return;
  navbar.innerHTML = "";

  const license = AppState.licenseLevel;
  const restrictedForFree = [
    "reports",
    "team",
    "brands",
    "creatorInsights",
    "analytics",
    "shopify",
  ];

  Object.keys(modules).forEach((key) => {
    if (license === "free" && restrictedForFree.includes(key)) {
      return;
    }

    const li = document.createElement("li");
    li.className = "sidebar-nav-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-nav-button";
    if (AppState.currentModule === key) {
      btn.classList.add("active");
    }

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = getLabelForModule(key);

    btn.appendChild(labelSpan);
    btn.addEventListener("click", () => navigateTo(key));

    li.appendChild(btn);
    navbar.appendChild(li);
  });
}

// ---- Module-Loading -------------------------------------------------------

async function loadModule(key) {
  const loader = modules[key];
  const viewId = getViewIdForModule(key);
  const section = document.getElementById(viewId);

  if (!loader || !section) {
    console.warn("[SignalOne] Modul oder View nicht gefunden:", key, viewId);
    return;
  }

  // Meta-Guard: ohne Meta und ohne Demo keine Daten
  if (
    modulesRequiringMeta.includes(key) &&
    !AppState.metaConnected &&
    !AppState.settings.demoMode
  ) {
    section.innerHTML =
      "<p>Dieses Modul benötigt eine Meta-Verbindung oder den Demo-Modus.</p>";
    showToast("Bitte Meta verbinden oder Demo-Modus aktivieren.", "warning");
    return;
  }

  section.innerHTML = "";

  try {
    const module = await loader();
    if (module && typeof module.render === "function") {
      module.render(section, AppState);
    } else {
      section.textContent = `Das Modul "${key}" ist noch nicht implementiert.`;
    }
  } catch (err) {
    console.error("[SignalOne] Fehler beim Laden des Moduls", key, err);
    section.textContent = `Fehler beim Laden des Moduls "${key}".`;
    showToast(`Fehler beim Laden von ${getLabelForModule(key)}`, "error");
  }
}

async function navigateTo(key) {
  if (!modules[key]) return;
  AppState.currentModule = key;

  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  updateTopbarTitle(key);
  renderNav();
  await loadModule(key);
}

// ---- Meta-Demo-Connect ----------------------------------------------------

function toggleMetaConnection() {
  AppState.metaConnected = !AppState.metaConnected;
  if (AppState.metaConnected) {
    AppState.meta.token = "demo-token";
    showToast("Meta Demo-Verbindung aktiviert.", "success");
  } else {
    AppState.meta.token = null;
    showToast("Meta-Verbindung getrennt.", "warning");
  }
  updateMetaStatusUI();
  // Nach Meta-Statuswechsel aktuelle View neu laden
  loadModule(AppState.currentModule);
}

// ---- Event-Wiring & Bootstrap ---------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar-Navigation initial rendern
  renderNav();

  // View initial aktiv setzen
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  updateTopbarTitle(AppState.currentModule);

  // Meta-Button
  const metaBtn = document.getElementById("metaConnectButton");
  if (metaBtn) {
    metaBtn.addEventListener("click", toggleMetaConnection);
  }
  updateMetaStatusUI();

  // Demo-Toggle
  const demoBtn = document.getElementById("demoToggle");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      AppState.settings.demoMode = !AppState.settings.demoMode;
      updateDemoToggleUI();
      const state = AppState.settings.demoMode ? "aktiviert" : "deaktiviert";
      showToast(`Demo-Modus ${state}.`, "success");
      loadModule(AppState.currentModule);
    });
    updateDemoToggleUI();
  }

  // Modal Close
  const modalCloseBtn = document.getElementById("modalCloseButton");
  const modalOverlay = document.getElementById("modalOverlay");
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeSystemModal);
  }
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (evt) => {
      if (evt.target === modalOverlay) {
        closeSystemModal();
      }
    });
  }

  // Erste View laden
  loadModule(AppState.currentModule);
});

// ---- Globale API exponieren (optional für Packages / Debugging) ----------

window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
};
