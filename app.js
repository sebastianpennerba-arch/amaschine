/*
 * app.js
 * Zentrales Backbone von SignalOne.
 * Verantwortlich für:
 *  - Navigation & View-Handling
 *  - MetaAuth-Demo-Simulation
 *  - Demo-Mode-Toggle (Demo/Live Switch)
 *  - Toast- & Modal-System
 *  - Topbar-Konsole (Greeting, Datum, Status)
 *  - Sidebar-Status
 *  - UI-Helpers (Loader, Skeleton etc.)
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
  selectedCampaignId: null,
  teamMembers: [],
  licenseLevel: "free", // mögliche Werte: free, pro, agency
  notifications: [],
  systemHealthy: true,
};

// ---- DEMO-DATENENGINE (5 Brands, Meta-kompatible Struktur) ----------------

const DemoData = {
  brands: [
    {
      id: "acme_fashion",
      name: "ACME Fashion",
      ownerName: "ACME Fashion GmbH",
      vertical: "Fashion / Apparel",
      spend30d: 47892,
      roas30d: 4.8,
      campaignHealth: "good",
    },
    {
      id: "techgadgets_pro",
      name: "TechGadgets Pro",
      ownerName: "TechGadgets Pro GmbH",
      vertical: "Electronics / Tech",
      spend30d: 28310,
      roas30d: 3.2,
      campaignHealth: "warning",
    },
    {
      id: "beautylux_cosmetics",
      name: "BeautyLux Cosmetics",
      ownerName: "BeautyLux Cosmetics AG",
      vertical: "Beauty / Skin Care",
      spend30d: 58442,
      roas30d: 5.9,
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
      vertical: "Home / Living / Deko",
      spend30d: 19883,
      roas30d: 3.6,
      campaignHealth: "critical",
    },
  ],
  campaignsByBrand: {
    acme_fashion: [
      {
        id: "acme_ugc_scale",
        name: "UGC Scale Test",
        status: "ACTIVE",
      },
      {
        id: "acme_brand_static",
        name: "Brand Awareness Static",
        status: "PAUSED",
      },
      {
        id: "acme_hook_battle",
        name: "Hook Battle Q4",
        status: "TESTING",
      },
    ],
    techgadgets_pro: [
      {
        id: "tech_launch",
        name: "Launch Funnel EU",
        status: "ACTIVE",
      },
      {
        id: "tech_retarg",
        name: "Retargeting Core",
        status: "ACTIVE",
      },
    ],
    beautylux_cosmetics: [
      {
        id: "beauty_creators",
        name: "Creator Evergreen",
        status: "ACTIVE",
      },
      {
        id: "beauty_ba",
        name: "Brand Awareness Beauty",
        status: "PAUSED",
      },
    ],
    fitlife_supplements: [
      {
        id: "fit_scale",
        name: "Scale Stack Q4",
        status: "ACTIVE",
      },
    ],
    homezen_living: [
      {
        id: "home_test",
        name: "Creative Testing",
        status: "TESTING",
      },
    ],
  },
};

function useDemoMode() {
  // Demo ist aktiv, wenn explizit eingeschaltet ODER keine Meta-Verbindung
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

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
  settings: () => import("./packages/settings/index.js"),
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
  settings: "Settings",
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
  settings: "settingsView",
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

// ---- UI-Helfer / Loader / Skeleton ----------------------------------------

function showGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  // Loader wirklich anzeigen: hidden weg, active an (CSS arbeitet mit #globalLoader und .active)
  el.classList.remove("hidden");
  el.classList.add("active");
}

function hideGlobalLoader() {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  el.classList.remove("active");
  el.classList.add("hidden");
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
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });
}

function fadeOut(el, cb) {
  if (!el) return;
  el.style.opacity = 1;
  el.style.transition = "opacity 0.18s ease";
  requestAnimationFrame(() => {
    el.style.opacity = 0;
    setTimeout(() => cb && cb(), 180);
  });
}

// ---- UI Status-Greeter & Topbar -------------------------------------------

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
      v.style.display = "block"; // <<< WICHTIG: nur eine View sichtbar
    } else {
      v.classList.remove("active");
      v.style.display = "none";
    }
  });
}

function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function getEffectiveBrandOwnerName() {
  // Wenn Meta User existiert: Meta Name
  if (AppState.meta && AppState.meta.user && AppState.meta.user.name) {
    return AppState.meta.user.name;
  }

  // Wenn Brand gewählt
  if (AppState.selectedBrandId && DemoData.brands) {
    const b = DemoData.brands.find((br) => br.id === AppState.selectedBrandId);
    if (b && b.ownerName) return b.ownerName;
  }

  return "SignalOne Nutzer";
}

function updateTopbarGreeting() {
  const greetingEl = document.getElementById("topbarGreeting");
  if (!greetingEl) return;
  const prefix = getGreetingPrefix();
  const ownerName = getEffectiveBrandOwnerName();
  greetingEl.textContent = `${prefix}, ${ownerName}!`;
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
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
}

function updateTopbarTitle() {
  // Titel steckt in der Greeting – ggf. später ergänzen
  updateTopbarGreeting();
}

function updateMetaStatusUI() {
  const badge = document.getElementById("metaStatusBadge");
  const badgeLabel = document.getElementById("metaStatusLabel");
  const button = document.getElementById("metaConnectButton");
  const sidebarDot = document.getElementById("sidebarMetaDot");
  const sidebarLabel = document.getElementById("sidebarMetaLabel");

  if (!badge || !badgeLabel || !button) return;

  if (AppState.metaConnected) {
    badgeLabel.textContent = useDemoMode()
      ? "Meta: Verbunden (Demo)"
      : "Meta: Verbunden (Live)";
    badge.classList.add("connected");
    badge.classList.remove("badge-offline");
    button.textContent = "Meta trennen";
    if (sidebarDot) sidebarDot.style.backgroundColor = "var(--color-success)";
    if (sidebarLabel)
      sidebarLabel.textContent = useDemoMode()
        ? "Meta Ads: Demo verbunden"
        : "Meta Ads: Live verbunden";
  } else {
    badgeLabel.textContent = "Meta: Nicht verbunden";
    badge.classList.remove("connected");
    badge.classList.add("badge-offline");
    button.textContent = "Meta verbinden";
    if (sidebarDot) sidebarDot.style.backgroundColor = "var(--color-danger)";
    if (sidebarLabel) sidebarLabel.textContent = "Meta Ads: Getrennt";
  }
}

function updateSystemHealthUI() {
  const dot = document.getElementById("sidebarSystemDot");
  const label = document.getElementById("sidebarSystemLabel");
  if (!dot || !label) return;

  if (AppState.systemHealthy) {
    dot.style.backgroundColor = "var(--color-success)";
    label.textContent = "System Health: OK";
  } else {
    dot.style.backgroundColor = "var(--color-warning)";
    label.textContent = "System Health: Check Logs";
  }
}

function updateCampaignHealthUI() {
  const dot = document.getElementById("sidebarCampaignDot");
  const label = document.getElementById("sidebarCampaignLabel");
  if (!dot || !label) return;

  const brandId = AppState.selectedBrandId;
  if (!brandId) {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Campaign Health: n/a";
    return;
  }

  const brand = DemoData.brands.find((b) => b.id === brandId);
  if (!brand) {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Campaign Health: n/a";
    return;
  }

  switch (brand.campaignHealth) {
    case "good":
      dot.style.backgroundColor = "var(--color-success)";
      label.textContent = "Campaign Health: Stark";
      break;
    case "warning":
      dot.style.backgroundColor = "var(--color-warning)";
      label.textContent = "Campaign Health: Beobachten";
      break;
    case "critical":
      dot.style.backgroundColor = "var(--color-danger)";
      label.textContent = "Campaign Health: Kritisch";
      break;
    default:
      dot.style.backgroundColor = "var(--color-text-soft)";
      label.textContent = "Campaign Health: n/a";
  }
}

function updateDemoToggleUI() {
  const btn = document.getElementById("demoToggle");
  const modeBadge = document.getElementById("modeBadge");
  if (!btn) return;
  const isOn = AppState.settings.demoMode;
  btn.classList.add("demo-toggle-button");
  btn.textContent = `Demo: ${isOn ? "AN" : "AUS"}`;
  if (modeBadge) {
    modeBadge.textContent = `Modus: ${useDemoMode() ? "Demo" : "Live"}`;
  }
}

// ---- Brand & Campaign Selectors (Demo-kompatibel, Meta-kompatibel) -------

function populateBrandSelect() {
  const select = document.getElementById("brandSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Werbekonto auswählen</option>';

  const brands = DemoData.brands || [];
  brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.vertical})`;
    select.appendChild(opt);
  });

  // Default: erste Brand wählen
  if (!AppState.selectedBrandId && brands.length > 0) {
    AppState.selectedBrandId = brands[0].id;
    select.value = brands[0].id;
  } else if (AppState.selectedBrandId) {
    select.value = AppState.selectedBrandId;
  }
}

function populateCampaignSelect() {
  const select = document.getElementById("campaignSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Kampagne auswählen</option>';

  const brandId = AppState.selectedBrandId;
  if (!brandId) return;

  const list = DemoData.campaignsByBrand[brandId] || [];
  list.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    const statusIcon =
      c.status === "ACTIVE"
        ? "🟢"
        : c.status === "PAUSED"
        ? "⏸"
        : "🧪";
    opt.textContent = `${statusIcon} ${c.name}`;
    select.appendChild(opt);
  });

  if (AppState.selectedCampaignId) {
    select.value = AppState.selectedCampaignId;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = document.getElementById("brandSelect");
  const campaignSelect = document.getElementById("campaignSelect");

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      AppState.selectedBrandId = brandSelect.value || null;
      AppState.selectedCampaignId = null;
      populateCampaignSelect();
      updateCampaignHealthUI();
      updateTopbarGreeting();
      // Bei Brand-Wechsel aktuelle View neu laden
      loadModule(AppState.currentModule);
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      // Module können selectedCampaignId nutzen
      loadModule(AppState.currentModule);
    });
  }
}

// ---- Toast & Notifications ------------------------------------------------

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

function pushNotification(type, message, meta = {}) {
  // Nur echte Fehler/Warnungen kommen in die Glocke
  if (!["error", "warning"].includes(type)) return;
  AppState.notifications.push({
    id: Date.now(),
    type,
    message,
    meta,
  });
  const dot = document.getElementById("notificationsDot");
  if (dot) dot.classList.remove("hidden");
}

function clearNotifications() {
  AppState.notifications = [];
  const dot = document.getElementById("notificationsDot");
  if (dot) dot.classList.add("hidden");
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
    // Settings-View nicht in der Sidebar anzeigen (nur Footer-Button)
    if (key === "settings") return;

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
    !useDemoMode()
  ) {
    section.innerHTML =
      "<p>Dieses Modul benötigt eine Meta-Verbindung oder den Demo-Modus.</p>";
    showToast("Bitte Meta verbinden oder Demo-Modus aktivieren.", "warning");
    updateCampaignHealthUI();
    return;
  }

  showGlobalLoader();
  applySectionSkeleton(section);

  try {
    const module = await loader();
    // Module bekommen AppState mit Demo/Live Informationen
    if (module && typeof module.render === "function") {
      section.innerHTML = "";
      module.render(section, AppState, {
        useDemoMode: useDemoMode(),
      });
      fadeIn(section);
    } else {
      section.textContent = `Das Modul "${key}" ist noch nicht implementiert.`;
    }
    AppState.systemHealthy = true;
  } catch (err) {
    console.error("[SignalOne] Fehler beim Laden des Moduls", key, err);
    section.textContent = `Fehler beim Laden des Moduls "${key}".`;
    showToast(`Fehler beim Laden von ${getLabelForModule(key)}`, "error");
    pushNotification("error", `Modul-Ladefehler: ${getLabelForModule(key)}`, {
      module: key,
      error: String(err),
    });
    AppState.systemHealthy = false;
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
  }
}

async function navigateTo(key) {
  if (!modules[key]) return;
  AppState.currentModule = key;

  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  updateTopbarTitle();
  renderNav();
  await loadModule(key);
}

// ---- Meta-Demo-Connect ----------------------------------------------------

function toggleMetaConnection() {
  // Simulierte Meta-OAuth – hier nur Token/Status
  AppState.metaConnected = !AppState.metaConnected;
  if (AppState.metaConnected) {
    AppState.meta.token = "demo-token";
    AppState.meta.user = {
      name: "Sebastian (Meta Demo)",
    };
    showToast("Meta Demo-Verbindung aktiviert.", "success");
  } else {
    AppState.meta.token = null;
    AppState.meta.user = null;
    showToast("Meta-Verbindung getrennt.", "warning");
  }
  updateMetaStatusUI();
  updateCampaignHealthUI();
  updateTopbarGreeting();
  // Nach Meta-Statuswechsel aktuelle View neu laden
  loadModule(AppState.currentModule);
}

// ---- Event-Wiring & Bootstrap ---------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Sidebar-Navigation initial rendern
  renderNav();

  // Demo / Brand / Campaign Selects
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  // View initial aktiv setzen
  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  updateTopbarTitle();

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
      const state = useDemoMode() ? "aktiviert" : "deaktiviert";
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
            Demo-Modus aktivieren (wenn aus, werden Live-Daten von Meta genutzt – sobald Meta verbunden ist).
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
        `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>
         <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">Später: echtes User- & Team-Management (Lizenz, Rollen, Rechte).</p>`
      );
    });
  }

  const notificationsBtn = document.getElementById("notificationsButton");
  if (notificationsBtn) {
    notificationsBtn.addEventListener("click", () => {
      if (!AppState.notifications.length) {
        openSystemModal(
          "Benachrichtigungen",
          "<p>Derzeit liegen keine Fehler oder kritischen Warnungen vor.</p>"
        );
      } else {
        const items = AppState.notifications
          .map(
            (n) =>
              `<li><strong>[${n.type.toUpperCase()}]</strong> ${n.message}</li>`
          )
          .join("");
        openSystemModal(
          "Benachrichtigungen",
          `<p>Fehler & Warnungen der aktuellen Session:</p><ul>${items}</ul>`
        );
      }
      clearNotifications();
    });
  }

  const logoutBtn = document.getElementById("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AppState.metaConnected = false;
      AppState.meta.token = null;
      AppState.meta.user = null;
      updateMetaStatusUI();
      updateCampaignHealthUI();
      updateTopbarGreeting();
      showToast("Session zurückgesetzt (Demo-Logout).", "success");
    });
  }

  // Datum / Zeit & Greeting aktualisieren
  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  // Erste View laden
  loadModule(AppState.currentModule);
});

// ---- Globale API exponieren (optional für Packages / Debugging) ----------

window.SignalOneDemo = {
  DemoData,
};

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
    fadeOut,
    useDemoMode,
  },
};
