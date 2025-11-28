/*
 * app.js
 * Zentrales Backbone von SignalOne.
 * Verantwortlich für:
 *  - Navigation & View-Handling
 *  - MetaAuth-Demo-Simulation
 *  - Demo-Mode-Toggle
 *  - Toast- & Modal-System
 *  - Topbar-Konsole (Greeting, Datum, Status)
 *  - Sidebar-Status
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

// Icon-Mapping für Sidebar (Font Awesome Klassen)
const moduleIcons = {
  dashboard: "fa-chart-line",
  creativeLibrary: "fa-images",
  campaigns: "fa-bullhorn",
  sensei: "fa-brain",
  testingLog: "fa-flask",
  reports: "fa-file-export",
  creatorInsights: "fa-user-astronaut",
  analytics: "fa-chart-pie",
  team: "fa-users",
  brands: "fa-building",
  shopify: "fa-bag-shopping",
  roast: "fa-fire",
  onboarding: "fa-compass",
};

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
  // Wird durch Greeting ersetzt – Titel bleibt in den Views selbst
  const greetingEl = document.getElementById("topbarGreeting");
  if (!greetingEl) return;

  const baseName = getUserName();
  const greetingPrefix = getGreetingPrefix();
  greetingEl.textContent = `${greetingPrefix}, ${baseName}!`;
}

function updateMetaStatusUI() {
  const badge = document.getElementById("metaStatusBadge");
  const badgeLabel = document.getElementById("metaStatusLabel");
  const button = document.getElementById("metaConnectButton");
  const sidebarDot = document.getElementById("sidebarMetaDot");
  const sidebarLabel = document.getElementById("sidebarMetaLabel");

  if (!badge || !badgeLabel || !button) return;

  if (AppState.metaConnected) {
    badgeLabel.textContent = "Meta: Verbunden (Demo)";
    badge.classList.add("connected");
    badge.classList.remove("badge-offline");
    button.textContent = "Meta trennen";
    if (sidebarDot) sidebarDot.style.backgroundColor = "var(--color-success)";
    if (sidebarLabel) sidebarLabel.textContent = "Meta Ads: Verbunden";
  } else {
    badgeLabel.textContent = "Meta: Nicht verbunden";
    badge.classList.remove("connected");
    button.textContent = "Meta verbinden";
    if (sidebarDot) sidebarDot.style.backgroundColor = "var(--color-danger)";
    if (sidebarLabel) sidebarLabel.textContent = "Meta Ads: Getrennt";
  }
}

function updateSystemHealthUI() {
  const dot = document.getElementById("sidebarSystemDot");
  const label = document.getElementById("sidebarSystemLabel");
  if (!dot || !label) return;

  // Einfacher Platzhalter: immer OK – kann später aus Sensei kommen
  dot.style.backgroundColor = "var(--color-success)";
  label.textContent = "System Health: OK";
}

function updateCampaignHealthUI() {
  const dot = document.getElementById("sidebarCampaignDot");
  const label = document.getElementById("sidebarCampaignLabel");
  if (!dot || !label) return;

  if (AppState.metaConnected || AppState.settings.demoMode) {
    dot.style.backgroundColor = "var(--color-warning)";
    label.textContent = "Campaign Health: Monitoring";
  } else {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Campaign Health: n/a";
  }
}

function updateDemoToggleUI() {
  const btn = document.getElementById("demoToggle");
  const modeBadge = document.getElementById("modeBadge");
  if (!btn) return;
  const isOn = AppState.settings.demoMode;
  btn.textContent = `Demo-Modus: ${isOn ? "AN" : "AUS"}`;
  if (modeBadge) {
    modeBadge.textContent = `Modus: ${isOn ? "Demo" : "Live"}`;
  }
}

// Datum, Uhrzeit, Greeting

function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function getUserName() {
  // Wenn Meta-User vorhanden, nimm dessen Namen
  if (AppState.meta && AppState.meta.user && AppState.meta.user.name) {
    return AppState.meta.user.name;
  }
  return "SignalOne Nutzer";
}

function updateTopbarDateTimeAndGreeting() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  const greetingEl = document.getElementById("topbarGreeting");

  const now = new Date();

  if (dateEl) {
    const d = now.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    dateEl.textContent = `Datum: ${d}`;
  }

  if (timeEl) {
    const t = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeEl.textContent = `Zeit: ${t}`;
  }

  if (greetingEl) {
    greetingEl.textContent = `${getGreetingPrefix()}, ${getUserName()}!`;
  }
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

    const iconClass = moduleIcons[key];
    if (iconClass) {
      const icon = document.createElement("i");
      icon.className = `fa-solid ${iconClass} sidebar-nav-icon`;
      btn.appendChild(icon);
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
    updateCampaignHealthUI();
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
  updateCampaignHealthUI();
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
  updateSystemHealthUI();
  updateCampaignHealthUI();

  // Demo-Toggle
  const demoBtn = document.getElementById("demoToggle");
  if (demoBtn) {
    demoBtn.addEventListener("click", () => {
      AppState.settings.demoMode = !AppState.settings.demoMode;
      updateDemoToggleUI();
      const state = AppState.settings.demoMode ? "aktiviert" : "deaktiviert";
      showToast(`Demo-Modus ${state}.`, "success");
      updateCampaignHealthUI();
      loadModule(AppState.currentModule);
    });
    updateDemoToggleUI();
  }

  // Settings Button
  const settingsBtn = document.getElementById("settingsButton");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      const demoChecked = AppState.settings.demoMode ? "checked" : "";
      const html = `
        <p>Basis-Einstellungen für diese Session.</p>
        <div style="margin-top:8px;">
          <label style="font-size:0.9rem;">
            <input type="checkbox" id="settingsDemoCheckbox" ${demoChecked} />
            Demo-Modus aktivieren
          </label>
        </div>
        <div style="margin-top:12px;font-size:0.8rem;color:#6b7280;">
          Erweiterte Settings (Theme, Cache, Zeiträume) folgen in P6.
        </div>
        <div style="margin-top:16px;display:flex;justify-content:flex-end;gap:8px;">
          <button id="settingsSaveBtn" type="button">Speichern</button>
        </div>
      `;
      openSystemModal("Settings", html);

      const overlay = document.getElementById("modalOverlay");
      if (overlay) {
        overlay.addEventListener(
          "click",
          (evt) => {
            if (evt.target === overlay) {
              closeSystemModal();
            }
          },
          { once: true }
        );
      }

      setTimeout(() => {
        const saveBtn = document.getElementById("settingsSaveBtn");
        const demoCheckbox = document.getElementById("settingsDemoCheckbox");
        if (saveBtn && demoCheckbox) {
          saveBtn.addEventListener("click", () => {
            AppState.settings.demoMode = demoCheckbox.checked;
            updateDemoToggleUI();
            updateCampaignHealthUI();
            loadModule(AppState.currentModule);
            showToast("Settings gespeichert.", "success");
            closeSystemModal();
          });
        }
      }, 0);
    });
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

  // Topbar Icons
  const profileBtn = document.getElementById("profileButton");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      openSystemModal(
        "Profil",
        `<p>Noch kein echtes Profil-System – aktuell bist du einfach <strong>${getUserName()}</strong>.</p>
         <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">User- & Team-Management kommt in der Team-Phase (P3/P6).</p>`
      );
    });
  }

  const notificationsBtn = document.getElementById("notificationsButton");
  if (notificationsBtn) {
    notificationsBtn.addEventListener("click", () => {
      openSystemModal(
        "Benachrichtigungen",
        "<p>Derzeit keine Benachrichtigungen. Sensei-Alerts & System-Warnungen folgen in der Sensei-Phase.</p>"
      );
      const dot = document.getElementById("notificationsDot");
      if (dot) dot.classList.add("hidden");
    });
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AppState.metaConnected = false;
      AppState.meta.token = null;
      updateMetaStatusUI();
      updateCampaignHealthUI();
      showToast("Session zurückgesetzt (Demo-Logout).", "success");
    });
  }

  // Datum / Zeit & Greeting aktualisieren
  updateTopbarDateTimeAndGreeting();
  setInterval(updateTopbarDateTimeAndGreeting, 60000);

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
