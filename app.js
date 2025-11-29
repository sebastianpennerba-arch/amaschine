/* ============================================================
   SIGNALONE FRONTEND – APP KERNEL (VANILLA JS)
   ============================================================ */

/* ----------------------------------------------------------
   APP STATE
-----------------------------------------------------------*/

const AppState = {
  activeModule: "dashboard",
  metaConnected: false,
  demoMode: true,
  systemHealthy: true,
  notifications: [],
  brands: [],
  activeBrandId: null,
  activeCampaignId: null,
};

/* ----------------------------------------------------------
   MODULE LOADER & LABELS
-----------------------------------------------------------*/

const moduleLoaders = {
  dashboard: () => import("./packages/dashboard/index.js"),
  creativeLibrary: () => import("./packages/creativeLibrary/index.js"),
  campaigns: () => import("./packages/campaigns/index.js"),
  sensei: () => import("./packages/sensei/index.js"),
  testingLog: () => import("./packages/testingLog/index.js"),
  reports: () => import("./packages/reports/index.js"),
  creatorInsights: () => import("./packages/creatorInsights/index.js"),
  analytics: () => import("./packages/analytics/index.js"),
  team: () => import("./packages/team/index.js"),
  brands: () => import("./packages/brands/index.js"),
  shopify: () => import("./packages/shopify/index.js"),
  roast: () => import("./packages/roast/index.js"),
  onboarding: () => import("./packages/onboarding/index.js"),
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

/* ICON IDs for Sidebar / Subheader (legacy keys) */

const moduleIconIds = {
  dashboard: "icon-dashboard",
  creativeLibrary: "icon-library",
  campaigns: "icon-campaigns",
  sensei: "icon-sensei",
  testingLog: "icon-testing",
  reports: "icon-reports",
  creatorInsights: "icon-creators",
  analytics: "icon-analytics",
  team: "icon-team",
  brands: "icon-brands",
  shopify: "icon-shopify",
  roast: "icon-roast",
  onboarding: "icon-onboarding",
  settings: "icon-settings",
};

/* ----------------------------------------------------------
   MATERIAL ICON MAP (statt SVG-Symbolen)
-----------------------------------------------------------*/

const materialIconMap = {
  "icon-dashboard": "space_dashboard",
  "icon-library": "collections_bookmark",
  "icon-campaigns": "campaign",
  "icon-sensei": "auto_awesome",
  "icon-testing": "science",
  "icon-reports": "summarize",
  "icon-creators": "groups_3",
  "icon-analytics": "monitoring",
  "icon-team": "group",
  "icon-brands": "storefront",
  "icon-shopify": "shopping_bag",
  "icon-roast": "local_fire_department",
  "icon-onboarding": "explore",
  "icon-settings": "settings",
  "icon-workspace": "workspaces",
};

/* ----------------------------------------------------------
   HELPERS – VIEWS & LABELS
-----------------------------------------------------------*/

function getLabelForModule(key) {
  return moduleLabels[key] || key;
}

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

/* ----------------------------------------------------------
   ICON HELPER – jetzt Material Symbols
-----------------------------------------------------------*/

/**
 * Achtung: Der Name bleibt "createSvgIconFromSymbol",
 * damit bestehender Code unverändert weiterläuft.
 * Intern wird jetzt aber ein <span> mit Material-Icon
 * zurückgegeben, kein <svg> mehr.
 */
function createSvgIconFromSymbol(symbolId, extraClass = "") {
  const iconName =
    materialIconMap[symbolId] || "radio_button_unchecked";

  const span = document.createElement("span");
  span.classList.add("material-symbols-rounded");
  if (extraClass) {
    span.classList.add(extraClass);
  } else {
    span.classList.add("icon");
  }
  span.textContent = iconName;
  return span;
}

/* ----------------------------------------------------------
   TOASTS
-----------------------------------------------------------*/

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

  requestAnimationFrame(() => toast.classList.add("visible"));

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

/* Notifications für Fehler / Warnings */

function pushNotification(type, message, meta = {}) {
  if (!["error", "warning"].includes(type)) return;

  AppState.notifications.push({
    id: Date.now(),
    type,
    message,
    meta,
  });

  document
    .getElementById("notificationsDot")
    ?.classList.remove("hidden");
}

function clearNotifications() {
  AppState.notifications = [];
  document
    .getElementById("notificationsDot")
    ?.classList.add("hidden");
}

/* ----------------------------------------------------------
   MODAL
-----------------------------------------------------------*/

function openSystemModal(title, bodyHtml) {
  const overlay = document.getElementById("modalOverlay");
  const titleEl = document.getElementById("modalTitle");
  const bodyEl = document.getElementById("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = bodyHtml || "";
  overlay.classList.remove("hidden");
}

function closeSystemModal() {
  document.getElementById("modalOverlay")?.classList.add("hidden");
}

/* ----------------------------------------------------------
   META / SYSTEM HEALTH
-----------------------------------------------------------*/

function useDemoMode() {
  return AppState.demoMode;
}

function updateMetaStatusUI() {
  const badge = document.getElementById("metaStatusBadge");
  const badgeLabel = document.getElementById("metaStatusLabel");
  const button = document.getElementById("metaConnectButton");
  const sidebarDot = document.getElementById("sidebarMetaDot");
  const sidebarLabel = document.getElementById("sidebarMetaLabel");

  const isConnected = AppState.metaConnected;

  if (isConnected) {
    if (badgeLabel) {
      badgeLabel.textContent = useDemoMode()
        ? "Meta: Verbunden (Demo)"
        : "Meta: Verbunden (Live)";
    }
    if (badge) {
      badge.classList.add("connected");
    }
    if (button) button.textContent = "Meta trennen";

    if (sidebarDot)
      sidebarDot.style.backgroundColor = "var(--color-success)";
    if (sidebarLabel)
      sidebarLabel.textContent = useDemoMode()
        ? "Meta Ads: Demo verbunden"
        : "Meta Ads: Live verbunden";
  } else {
    if (badgeLabel) badgeLabel.textContent = "Meta: Nicht verbunden";
    if (badge) {
      badge.classList.remove("connected");
    }
    if (button) button.textContent = "Meta verbinden";

    if (sidebarDot)
      sidebarDot.style.backgroundColor = "var(--color-danger)";
    if (sidebarLabel)
      sidebarLabel.textContent = "Meta Ads: Getrennt";
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

function getActiveBrand() {
  return AppState.brands.find(
    (b) => b.id === AppState.activeBrandId
  );
}

function updateCampaignHealthUI() {
  const dot = document.getElementById("sidebarCampaignDot");
  const label = document.getElementById("sidebarCampaignLabel");
  if (!dot || !label) return;

  const brand = getActiveBrand();

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

/* ----------------------------------------------------------
   LOADER & SKELETON
-----------------------------------------------------------*/

function showGlobalLoader() {
  document
    .getElementById("globalLoader")
    ?.classList.remove("hidden");
}

function hideGlobalLoader() {
  document.getElementById("globalLoader")?.classList.add("hidden");
}

function applySectionSkeleton(section) {
  if (!section) return;
  section.innerHTML = `
    <div class="skeleton-block" style="height: 82px"></div>
    <div class="skeleton-block" style="height: 220px"></div>
    <div class="skeleton-block" style="height: 140px"></div>
  `;
}

/* ----------------------------------------------------------
   VIEW SUBHEADER (WO BIN ICH?)
-----------------------------------------------------------*/

function updateViewSubheader(moduleKey) {
  const iconEl = document.getElementById("viewSubtitleIcon");
  const titleEl = document.getElementById("viewSubtitleTitle");
  const metaEl = document.getElementById("viewSubtitleMeta");

  if (titleEl) titleEl.textContent = getLabelForModule(moduleKey);

  if (iconEl && iconEl.parentElement) {
    const parent = iconEl.parentElement;
    iconEl.remove();
    const symbolId =
      moduleIconIds[moduleKey] || "icon-dashboard";
    const newIcon = createSvgIconFromSymbol(
      symbolId,
      "subheader-icon"
    );
    parent.insertBefore(newIcon, parent.firstChild);
  }

  const brand = getActiveBrand();
  if (metaEl) {
    if (!brand) {
      metaEl.textContent = "Kein Brand ausgewählt";
    } else {
      metaEl.textContent = `${brand.name} • ROAS ${
        brand.demoRoas || "–"
      } • Spend 30 Tage: ${brand.demoSpend || "–"}`;
    }
  }
}

/* ----------------------------------------------------------
   SIDEBAR NAVIGATION
-----------------------------------------------------------*/

function renderSidebarNav() {
  const nav = document.getElementById("navbar");
  if (!nav) return;

  const order = [
    "dashboard",
    "creativeLibrary",
    "campaigns",
    "testingLog",
    "sensei",
    "onboarding",
    "roast",
    "reports",
    "creatorInsights",
    "analytics",
    "team",
    "brands",
    "shopify",
    "settings",
  ];

  nav.innerHTML = "";

  order.forEach((key) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.className = "sidebar-nav-button";
    btn.dataset.module = key;

    const symbolId = moduleIconIds[key] || "icon-dashboard";
    const icon = createSvgIconFromSymbol(symbolId, "icon");

    const labelSpan = document.createElement("span");
    labelSpan.textContent = getLabelForModule(key);
    labelSpan.className = "label";

    btn.appendChild(icon);
    btn.appendChild(labelSpan);

    btn.addEventListener("click", () => handleModuleChange(key));

    li.appendChild(btn);
    nav.appendChild(li);
  });

  updateSidebarActiveState(AppState.activeModule);
}

function updateSidebarActiveState(activeKey) {
  document
    .querySelectorAll(".sidebar-nav-button")
    .forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.dataset.module === activeKey
      );
    });
}

/* ----------------------------------------------------------
   BRANDS & CAMPAIGNS – DEMO DATA
-----------------------------------------------------------*/

const DEMO_BRANDS = [
  {
    id: "acme-fashion",
    name: "ACME Fashion GmbH",
    industry: "Fashion / Apparel",
    demoRoas: "4.8x",
    demoSpend: "47.892 €",
    campaignHealth: "good",
    campaigns: [
      { id: "hook-battle-q4", name: "Hook Battle Q4" },
      { id: "ugc-scale-test", name: "UGC Scale Test" },
      { id: "brand-awareness-static", name: "Brand Awareness Static" },
    ],
  },
  {
    id: "techgadgets-pro",
    name: "TechGadgets Pro",
    industry: "Electronics / Tech",
    demoRoas: "3.9x",
    demoSpend: "31.204 €",
    campaignHealth: "warning",
    campaigns: [
      { id: "scale-main-eu", name: "Scale EU" },
      { id: "remarketing-q4", name: "Remarketing Q4" },
    ],
  },
];

function initBrands() {
  AppState.brands = DEMO_BRANDS;
  const brandSelect = document.getElementById("brandSelect");
  if (!brandSelect) return;

  brandSelect.innerHTML = "";

  DEMO_BRANDS.forEach((brand) => {
    const opt = document.createElement("option");
    opt.value = brand.id;
    opt.textContent = `${brand.name} (${brand.industry})`;
    brandSelect.appendChild(opt);
  });

  AppState.activeBrandId = DEMO_BRANDS[0]?.id || null;
  brandSelect.value = AppState.activeBrandId || "";

  updateCampaignSelect();
  updateCampaignHealthUI();
}

function updateCampaignSelect() {
  const brand = getActiveBrand();
  const select = document.getElementById("campaignSelect");
  if (!select) return;

  select.innerHTML = "";

  if (!brand) return;

  const defaultOpt = document.createElement("option");
  defaultOpt.value = "";
  defaultOpt.textContent = "Kampagne auswählen";
  select.appendChild(defaultOpt);

  brand.campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });

  AppState.activeCampaignId = "";
}

/* ----------------------------------------------------------
   META CONNECT – MOCK
-----------------------------------------------------------*/

function toggleMetaConnection() {
  AppState.metaConnected = !AppState.metaConnected;
  updateMetaStatusUI();

  if (AppState.metaConnected) {
    showToast("Meta Demo-Verbindung hergestellt.", "success");
  } else {
    showToast("Meta Verbindung getrennt.", "warning");
  }

  // Gatekeeper: wenn Modul Meta braucht & nicht verbunden -> zurück zum Dashboard
  if (
    !AppState.metaConnected &&
    modulesRequiringMeta.includes(AppState.activeModule)
  ) {
    handleModuleChange("dashboard");
    pushNotification(
      "warning",
      "Meta ist nicht verbunden. Dashboard wurde geöffnet."
    );
  }
}

/* ----------------------------------------------------------
   MODULE / VIEW HANDLING
-----------------------------------------------------------*/

async function handleModuleChange(moduleKey) {
  if (moduleKey === AppState.activeModule) return;

  if (
    modulesRequiringMeta.includes(moduleKey) &&
    !AppState.metaConnected
  ) {
    showToast(
      "Dieses Modul benötigt eine aktive Meta-Verbindung.",
      "error"
    );
    pushNotification(
      "error",
      "Modul erfordert Meta-Daten – bitte zuerst Meta verbinden."
    );
    return;
  }

  const oldViewId = getViewIdForModule(AppState.activeModule);
  const newViewId = getViewIdForModule(moduleKey);

  const oldView = document.getElementById(oldViewId);
  const newView = document.getElementById(newViewId);

  if (oldView) oldView.classList.remove("active");
  if (newView) {
    newView.classList.add("active");
    applySectionSkeleton(newView.querySelector(".view-body"));
  }

  AppState.activeModule = moduleKey;
  updateSidebarActiveState(moduleKey);
  updateViewSubheader(moduleKey);

  try {
    showGlobalLoader();
    const loader = moduleLoaders[moduleKey];
    if (loader) {
      const pkg = await loader();
      if (pkg && typeof pkg.render === "function") {
        const viewBody = newView?.querySelector(".view-body");
        if (viewBody) {
          await pkg.render({
            root: viewBody,
            useDemoMode,
            getActiveBrand,
          });
        }
      }
    }
  } catch (err) {
    console.error(err);
    showToast(
      "Beim Laden des Moduls ist ein Fehler aufgetreten.",
      "error"
    );
  } finally {
    hideGlobalLoader();
  }
}

/* ----------------------------------------------------------
   DATE / TIME
-----------------------------------------------------------*/

function updateTopbarDateTime() {
  const dateLabel = document.getElementById("todayDateLabel");
  const timeLabel = document.getElementById("currentTimeLabel");
  const now = new Date();

  if (dateLabel) {
    const d = now.toLocaleDateString("de-DE");
    dateLabel.textContent = `Datum: ${d}`;
  }
  if (timeLabel) {
    const t = now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    timeLabel.textContent = `Zeit: ${t}`;
  }
}

/* ----------------------------------------------------------
   EVENT BINDINGS
-----------------------------------------------------------*/

function bindCoreEvents() {
  const metaBtn = document.getElementById("metaConnectButton");
  metaBtn?.addEventListener("click", toggleMetaConnection);

  const brandSelect = document.getElementById("brandSelect");
  brandSelect?.addEventListener("change", (e) => {
    AppState.activeBrandId = e.target.value || null;
    updateCampaignSelect();
    updateCampaignHealthUI();
    updateViewSubheader(AppState.activeModule);
  });

  const campaignSelect = document.getElementById("campaignSelect");
  campaignSelect?.addEventListener("change", (e) => {
    AppState.activeCampaignId = e.target.value || "";
  });

  document
    .getElementById("notificationsButton")
    ?.addEventListener("click", () => {
      if (!AppState.notifications.length) {
        showToast("Keine offenen Alerts.", "info");
        return;
      }
      openSystemModal(
        "Alerts & Checks",
        `<p>Du hast ${
          AppState.notifications.length
        } ungelesene System-Hinweise.</p>`
      );
      clearNotifications();
    });

  document
    .getElementById("modalCloseButton")
    ?.addEventListener("click", closeSystemModal);

  document
    .getElementById("modalOverlay")
    ?.addEventListener("click", (e) => {
      if (e.target.id === "modalOverlay") closeSystemModal();
    });

  const sidebarSettingsBtn = document.getElementById(
    "openSettingsFromSidebar"
  );
  sidebarSettingsBtn?.addEventListener("click", () => {
    handleModuleChange("settings");
  });

  const demoToggle = document.getElementById("demoToggle");
  const demoIndicator = document.getElementById("demoIndicator");
  const demoLabel = document.getElementById("demoLabel");

  if (demoToggle) {
    demoToggle.checked = AppState.demoMode;
    demoToggle.addEventListener("change", () => {
      AppState.demoMode = demoToggle.checked;
      if (demoIndicator) {
        demoIndicator.style.backgroundColor = AppState.demoMode
          ? "#22c55e"
          : "#ef4444";
      }
      if (demoLabel) {
        demoLabel.textContent = AppState.demoMode
          ? "Demo-Modus aktiv"
          : "Live-Modus (Placeholder)";
      }
      updateMetaStatusUI();
    });
  }
}

/* ----------------------------------------------------------
   INIT
-----------------------------------------------------------*/

function initApp() {
  renderSidebarNav();
  initBrands();
  bindCoreEvents();
  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();
  updateViewSubheader(AppState.activeModule);
  updateTopbarDateTime();
  setInterval(updateTopbarDateTime, 30_000);
}

document.addEventListener("DOMContentLoaded", initApp);
