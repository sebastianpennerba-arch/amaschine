/*
 * app.js – SignalOne Core Backbone
 * Navigation • View Handling • Meta Simulation • Toasts • Modal
 * + Punch-Mode: Gold SVG Icon Activation
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
  licenseLevel: "free", // free | pro | agency
  notifications: [],
  systemHealthy: true,
};

/* ----------------------------------------------------------
   DEMO-DATA (unchanged)
-----------------------------------------------------------*/
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
      { id: "acme_ugc_scale", name: "UGC Scale Test", status: "ACTIVE" },
      { id: "acme_brand_static", name: "Brand Awareness Static", status: "PAUSED" },
      { id: "acme_hook_battle", name: "Hook Battle Q4", status: "TESTING" },
    ],
    techgadgets_pro: [
      { id: "tech_launch", name: "Launch Funnel EU", status: "ACTIVE" },
      { id: "tech_retarg", name: "Retargeting Core", status: "ACTIVE" },
    ],
    beautylux_cosmetics: [
      { id: "beauty_creators", name: "Creator Evergreen", status: "ACTIVE" },
      { id: "beauty_ba", name: "Brand Awareness Beauty", status: "PAUSED" },
    ],
    fitlife_supplements: [{ id: "fit_scale", name: "Scale Stack Q4", status: "ACTIVE" }],
    homezen_living: [{ id: "home_test", name: "Creative Testing", status: "TESTING" }],
  },
};

function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

/* ----------------------------------------------------------
   MODULE REGISTRY & LABELS
-----------------------------------------------------------*/
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

/* ----------------------------------------------------------
   ICON MAPPING (SVG IDs in index.html)
-----------------------------------------------------------*/
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
   VIEW CONTROL
-----------------------------------------------------------*/
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
      v.style.display = "block";
    } else {
      v.classList.remove("active");
      v.style.display = "none";
    }
  });
}

/* ----------------------------------------------------------
   TOPBAR LOGIC
-----------------------------------------------------------*/
function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function getEffectiveBrandOwnerName() {
  if (AppState.meta?.user?.name) return AppState.meta.user.name;

  if (AppState.selectedBrandId) {
    const b = DemoData.brands.find((br) => br.id === AppState.selectedBrandId);
    if (b?.ownerName) return b.ownerName;
  }

  return "SignalOne Nutzer";
}

function updateTopbarGreeting() {
  const el = document.getElementById("topbarGreeting");
  if (!el) return;
  el.textContent = `${getGreetingPrefix()}, ${getEffectiveBrandOwnerName()}!`;
}

function updateTopbarDateTime() {
  const dateEl = document.getElementById("topbarDate");
  const timeEl = document.getElementById("topbarTime");
  const now = new Date();

  if (dateEl) {
    dateEl.textContent = `Datum: ${now.toLocaleDateString("de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })}`;
  }
  if (timeEl) {
    timeEl.textContent = `Zeit: ${now.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  }
}

function updateTopbarTitle() {
  updateTopbarGreeting();
}

/* ----------------------------------------------------------
   SIDEBAR ICON STATE LOGIC (Punch-Mode)
-----------------------------------------------------------*/
function updateSidebarActiveIcon(activeKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button");

  buttons.forEach((btn) => {
    const module = btn.dataset.module;

    const svg = btn.querySelector(".icon-svg");
    if (!svg) return;

    const fillLayer = svg.querySelector(".icon-layer-fill");
    const strokeLayer = svg.querySelector(".icon-layer-stroke");

    if (module === activeKey) {
      btn.classList.add("active");

      fillLayer.style.fill = "var(--sidebar-icon-active-fill)";
      fillLayer.style.opacity = "1";

      strokeLayer.style.stroke = "var(--sidebar-icon-active-stroke)";
    } else {
      btn.classList.remove("active");

      fillLayer.style.fill = "var(--sidebar-icon-inactive-fill)";
      fillLayer.style.opacity = "0.85";

      strokeLayer.style.stroke = "var(--sidebar-icon-inactive-stroke)";
    }
  });
}

/* ----------------------------------------------------------
   NAVIGATION RENDER
-----------------------------------------------------------*/
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
    if (key === "settings") return;

    if (license === "free" && restrictedForFree.includes(key)) return;

    const li = document.createElement("li");
    li.className = "sidebar-nav-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-nav-button";
    btn.dataset.module = key;

    /* ICON (Will be replaced via index.html) */
    const iconSvg = document.getElementById(moduleIconIds[key])?.cloneNode(true);
    if (iconSvg) {
      iconSvg.classList.add("icon-svg");
      btn.appendChild(iconSvg);
    }

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = getLabelForModule(key);

    btn.appendChild(labelSpan);

    btn.addEventListener("click", () => navigateTo(key));

    li.appendChild(btn);
    navbar.appendChild(li);
  });

  updateSidebarActiveIcon(AppState.currentModule);
}

/* ----------------------------------------------------------
   MODULE LOADING
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
    section.textContent = `Fehler beim Laden des Moduls "${key}".`;
    showToast(`Fehler beim Laden von ${getLabelForModule(key)}`, "error");
    pushNotification("error", `Modulfehler: ${getLabelForModule(key)}`, {
      module: key,
      error: String(err),
    });
    AppState.systemHealthy = false;
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
  }
}

/* ----------------------------------------------------------
   NAVIGATION
-----------------------------------------------------------*/
async function navigateTo(key) {
  if (!modules[key]) return;

  AppState.currentModule = key;

  const viewId = getViewIdForModule(key);
  setActiveView(viewId);
  updateTopbarTitle();
  renderNav();
  updateSidebarActiveIcon(key);

  await loadModule(key);
}

/* ----------------------------------------------------------
   META DEMO CONNECT
-----------------------------------------------------------*/
function toggleMetaConnection() {
  AppState.metaConnected = !AppState.metaConnected;

  if (AppState.metaConnected) {
    AppState.meta.token = "demo-token";
    AppState.meta.user = { name: "Sebastian (Meta Demo)" };
    showToast("Meta Demo-Verbindung aktiviert.", "success");
  } else {
    AppState.meta.token = null;
    AppState.meta.user = null;
    showToast("Meta-Verbindung getrennt.", "warning");
  }

  updateMetaStatusUI();
  updateCampaignHealthUI();
  updateTopbarGreeting();

  loadModule(AppState.currentModule);
}

/* ----------------------------------------------------------
   BRAND & CAMPAIGN SELECT
-----------------------------------------------------------*/
function populateBrandSelect() {
  const select = document.getElementById("brandSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Werbekonto auswählen</option>';

  DemoData.brands.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = b.id;
    opt.textContent = `${b.name} (${b.vertical})`;
    select.appendChild(opt);
  });

  if (!AppState.selectedBrandId) {
    AppState.selectedBrandId = DemoData.brands[0].id;
    select.value = DemoData.brands[0].id;
  } else {
    select.value = AppState.selectedBrandId;
  }
}

function populateCampaignSelect() {
  const select = document.getElementById("campaignSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Kampagne auswählen</option>';

  const brandId = AppState.selectedBrandId;
  if (!brandId) return;

  DemoData.campaignsByBrand[brandId]?.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    const icon = c.status === "ACTIVE" ? "🟢" : c.status === "PAUSED" ? "⏸" : "🧪";
    opt.textContent = `${icon} ${c.name}`;
    select.appendChild(opt);
  });

  if (AppState.selectedCampaignId) select.value = AppState.selectedCampaignId;
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
      loadModule(AppState.currentModule);
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      loadModule(AppState.currentModule);
    });
  }
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

function pushNotification(type, message, meta = {}) {
  if (!["error", "warning"].includes(type)) return;

  AppState.notifications.push({
    id: Date.now(),
    type,
    message,
    meta,
  });

  document.getElementById("notificationsDot")?.classList.remove("hidden");
}

function clearNotifications() {
  AppState.notifications = [];
  document.getElementById("notificationsDot")?.classList.add("hidden");
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
   SYSTEM HEALTH & META STATUS
-----------------------------------------------------------*/
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
      badge.classList.remove("badge-offline");
    }
    if (button) button.textContent = "Meta trennen";

    if (sidebarDot) sidebarDot.style.backgroundColor = "var(--color-success)";
    if (sidebarLabel)
      sidebarLabel.textContent = useDemoMode()
        ? "Meta Ads: Demo verbunden"
        : "Meta Ads: Live verbunden";
  } else {
    if (badgeLabel) badgeLabel.textContent = "Meta: Nicht verbunden";
    if (badge) {
      badge.classList.remove("connected");
      badge.classList.add("badge-offline");
    }
    if (button) button.textContent = "Meta verbinden";

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

  const brand = DemoData.brands.find(
    (b) => b.id === AppState.selectedBrandId
  );

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
   LOADER / FADE / SKELETON
-----------------------------------------------------------*/
function showGlobalLoader() {
  document.getElementById("globalLoader")?.classList.remove("hidden");
}

function hideGlobalLoader() {
  document.getElementById("globalLoader")?.classList.add("hidden");
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

function fadeOut(el, cb) {
  if (!el) return;
  el.style.opacity = 1;
  el.style.transition = "opacity 0.18s ease";
  requestAnimationFrame(() => {
    el.style.opacity = 0;
    setTimeout(() => cb && cb(), 180);
  });
}

/* ----------------------------------------------------------
   BOOTSTRAP
-----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  renderNav();

  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);
  updateTopbarTitle();

  document
    .getElementById("metaConnectButton")
    ?.addEventListener("click", toggleMetaConnection);

  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();

  const settingsBtn = document.getElementById("settingsButton");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => navigateTo("settings"));
  }

  // Modal Close
  const modalCloseBtn = document.getElementById("modalCloseButton");
  const modalOverlay = document.getElementById("modalOverlay");
  modalCloseBtn?.addEventListener("click", closeSystemModal);
  modalOverlay?.addEventListener("click", (evt) => {
    if (evt.target === modalOverlay) closeSystemModal();
  });

  // Profile Modal
  const profileBtn = document.getElementById("profileButton");
  profileBtn?.addEventListener("click", () => {
    openSystemModal(
      "Profil",
      `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>
       <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">Später: echtes User- & Team-Management.</p>`
    );
  });

  // Notifications
  const notificationsBtn = document.getElementById("notificationsButton");
  notificationsBtn?.addEventListener("click", () => {
    if (!AppState.notifications.length) {
      openSystemModal(
        "Benachrichtigungen",
        "<p>Keine Fehler oder kritischen Warnungen vorhanden.</p>"
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
        `<p>Fehler & Warnungen:</p><ul>${items}</ul>`
      );
    }
    clearNotifications();
  });

  // Logout
  const logoutBtn = document.getElementById("logoutButton");
  logoutBtn?.addEventListener("click", () => {
    AppState.metaConnected = false;
    AppState.meta.token = null;
    AppState.meta.user = null;
    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    showToast("Session zurückgesetzt (Demo-Logout).", "success");
  });

  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  loadModule(AppState.currentModule);
});

/* ----------------------------------------------------------
   EXPOSED GLOBAL API
-----------------------------------------------------------*/
window.SignalOneDemo = { DemoData };
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
