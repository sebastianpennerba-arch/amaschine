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
    adAccounts: [],
    token: null,
  },
  settings: {
    demoMode: true, // Demo-Modus standardmäßig aktiv
  },
  selectedBrandId: null,
  selectedCampaignId: null,
  systemHealthy: true,
  notifications: [],
};

/* ----------------------------------------------------------
   DEMO DATA (WIRD SPÄTER DURCH LIVE-DATEN ERSETZT)
-----------------------------------------------------------*/

const DemoData = {
  brands: [
    {
      id: "acme_fashion",
      name: "ACME Fashion GmbH",
      ownerName: "ACME Fashion GmbH",
      vertical: "Fashion / Apparel",
      spend30d: 47892,
      roas30d: 4.8,
      campaignHealth: "good",
    },
    {
      id: "beautylux_cosmetics",
      name: "BeautyLux Cosmetics",
      ownerName: "BeautyLux Cosmetics",
      vertical: "Beauty / Cosmetics",
      spend30d: 32988,
      roas30d: 3.9,
      campaignHealth: "warning",
    },
    {
      id: "homehero_tools",
      name: "HomeHero Tools",
      ownerName: "HomeHero Tools",
      vertical: "Home Improvement",
      spend30d: 18942,
      roas30d: 2.7,
      campaignHealth: "critical",
    },
    {
      id: "techgadgets_pro",
      name: "TechGadgets Pro",
      ownerName: "TechGadgets Pro",
      vertical: "Electronics / Gadgets",
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
      ownerName: "HomeZen Living",
      vertical: "Home & Living",
      spend30d: 27890,
      roas30d: 3.2,
      campaignHealth: "warning",
    },
    {
      id: "urbanmove",
      name: "UrbanMove",
      ownerName: "UrbanMove",
      vertical: "Mobility / Lifestyle",
      spend30d: 19870,
      roas30d: 2.9,
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
      { id: "beauty_perf", name: "Beauty Performance Max", status: "ACTIVE" },
      { id: "beauty_ugc", name: "UGC Creators Wave 2", status: "TESTING" },
    ],
    homehero_tools: [
      { id: "homehero_static", name: "Static Winter Promo", status: "PAUSED" },
      { id: "homehero_video", name: "Video Funnel", status: "ACTIVE" },
    ],
    fitlife_supplements: [
      { id: "fitlife_retargeting", name: "Retargeting 30d", status: "ACTIVE" },
      { id: "fitlife_prospecting", name: "Prospecting Broad", status: "ACTIVE" },
    ],
    homezen_living: [
      { id: "homezen_ugc", name: "UGC Cozy Season", status: "TESTING" },
      { id: "homezen_dpa", name: "Dynamic Product Ads", status: "ACTIVE" },
    ],
    urbanmove: [
      { id: "urbanmove_top", name: "Top Funnel Awareness", status: "ACTIVE" },
      { id: "urbanmove_test", name: "Creative Testing", status: "TESTING" },
    ],
  },
};

// SOFORT GLOBAL VERFÜGBAR MACHEN
window.SignalOneDemo = window.SignalOneDemo || {};
window.SignalOneDemo.DemoData = DemoData;
window.SignalOneDemo.brands = DemoData.brands; // Für Kompatibilität

console.log("✅ DemoData geladen:", DemoData.brands.length, "Brands");

/* ----------------------------------------------------------
   DEMO MODE LOGIK
-----------------------------------------------------------*/
function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

import MetaAuth from "./packages/metaAuth/index.js";

/* ----------------------------------------------------------
   MODULE REGISTRY & LABELS
-----------------------------------------------------------*/
const modules = {
  dashboard: () => import("/packages/dashboard/index.js"),
  creativeLibrary: () => import("/packages/creativeLibrary/index.js"),
  campaigns: () => import("/packages/campaigns/index.js"),
  testingLog: () => import("/packages/testingLog/index.js"),
  sensei: () => import("/packages/sensei/index.js"),
  onboarding: () => import("/packages/onboarding/index.js"),
  team: () => import("/packages/team/index.js"),
  brands: () => import("/packages/brands/index.js"),
  reports: () => import("/packages/reports/index.js"),
  creatorInsights: () => import("/packages/creatorInsights/index.js"),
  analytics: () => import("/packages/analytics/index.js"),
  roast: () => import("/packages/roast/index.js"),
  shopify: () => import("/packages/shopify/index.js"),
  settings: () => import("/packages/settings/index.js"),
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
  reports: "reportsExportView",
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

/* ICON IDs MAPPING (SIDEBAR) */
const moduleIconMap = {
  dashboard: "icon-dashboard",
  creativeLibrary: "icon-creative-library",
  campaigns: "icon-campaigns",
  sensei: "icon-sensei",
  testingLog: "icon-testing-log",
  reports: "icon-reports",
  creatorInsights: "icon-creator-insights",
  analytics: "icon-analytics",
  team: "icon-team",
  brands: "icon-brands",
  shopify: "icon-shopify",
  roast: "icon-roast",
  onboarding: "icon-onboarding",
  settings: "icon-settings",
};

/* ----------------------------------------------------------
   SVG ICON HELPERS
-----------------------------------------------------------*/
function createSvgIconFromSymbol(symbolId, extraClass = "") {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("nav-icon-layered");
  if (extraClass) svg.classList.add(extraClass);

  const useBg = document.createElementNS(svgNS, "use");
  useBg.setAttributeNS("http://www.w3.org/1999/xlink", "href", "#icon-nav-bg");
  useBg.setAttribute("class", "nav-icon-bg");

  const usePrimary = document.createElementNS(svgNS, "use");
  usePrimary.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbolId}`);
  usePrimary.setAttribute("class", "nav-icon-primary");

  const useGlow = document.createElementNS(svgNS, "use");
  useGlow.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbolId}`);
  useGlow.setAttribute("class", "nav-icon-glow");

  svg.appendChild(useBg);
  svg.appendChild(usePrimary);
  svg.appendChild(useGlow);

  return svg;
}

/* ----------------------------------------------------------
   SIDEBAR / NAVIGATION
-----------------------------------------------------------*/
function getLabelForModule(key) {
  return moduleLabels[key] || key;
}

function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function setActiveView(viewId) {
  document.querySelectorAll(".view").forEach((v) => {
    if (v.id === viewId) {
      v.classList.add("is-active");
    } else {
      v.classList.remove("is-active");
    }
  });
}

function clearSidebarActive() {
  document
    .querySelectorAll(".sidebar-nav button")
    .forEach((btn) => btn.classList.remove("is-active"));
}

function updateSidebarActiveIcon(moduleKey) {
  const buttons = document.querySelectorAll(".sidebar-nav button");
  buttons.forEach((btn) => {
    const isActive = btn.dataset.moduleKey === moduleKey;
    if (isActive) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });
}

/**
 * Baut die Sidebar-Navigation gemäß der finalen Struktur.
 * Kein Inline-HTML im index.html – alles generiert hier.
 */
function renderNav() {
  const navbar = document.getElementById("sidebarNav");
  if (!navbar) return;

  navbar.innerHTML = "";

  const groups = [
    {
      label: "Core",
      items: ["dashboard", "creativeLibrary", "campaigns", "testingLog"],
    },
    {
      label: "Intelligence",
      items: ["sensei", "creatorInsights", "analytics"],
    },
    {
      label: "Workspace",
      items: ["brands", "team", "reports", "shopify"],
    },
    {
      label: "Workflow",
      items: ["onboarding", "roast", "settings"],
    },
  ];

  groups.forEach((group) => {
    const header = document.createElement("li");
    header.className = "sidebar-group-label";
    header.textContent = group.label;
    navbar.appendChild(header);

    group.items.forEach((key) => {
      const li = document.createElement("li");

      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.moduleKey = key;
      btn.className = "sidebar-nav-button";

      const iconSpan = document.createElement("span");
      iconSpan.className = "sidebar-nav-icon";
      const symbolId = moduleIconMap[key] || "icon-dashboard";
      const svg = createSvgIconFromSymbol(symbolId);
      iconSpan.appendChild(svg);

      const labelSpan = document.createElement("span");
      labelSpan.className = "sidebar-nav-label";
      labelSpan.textContent = getLabelForModule(key);

      btn.appendChild(iconSpan);
      btn.appendChild(labelSpan);

      btn.addEventListener("click", () => navigateTo(key));

      li.appendChild(btn);
      navbar.appendChild(li);
    });
  });

  updateSidebarActiveIcon(AppState.currentModule);
}

/* ----------------------------------------------------------
   META DEMO CONNECT
-----------------------------------------------------------*/
function toggleMetaConnection() {
  AppState.metaConnected = !AppState.metaConnected;
  if (AppState.metaConnected) {
    AppState.meta.user = {
      name: "Sebastian (Meta Demo)",
      email: "sebastian@signalone.cloud",
    };
    AppState.meta.token = "demo-token-meta-123";
  } else {
    AppState.meta.user = null;
    AppState.meta.token = null;
  }
  updateMetaStatusUI();
  updateCampaignHealthUI();
  updateTopbarGreeting();
  updateViewSubheaders();
}

/* ----------------------------------------------------------
   BRAND / CAMPAIGN HELPERS
-----------------------------------------------------------*/
function getActiveBrand() {
  const id = AppState.selectedBrandId || DemoData.brands[0]?.id;
  if (!id) return null;
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0] || null;
}

function getEffectiveBrandOwnerName() {
  if (AppState.meta?.user?.name) return AppState.meta.user.name;
  const brand = getActiveBrand();
  if (brand?.ownerName) return brand.ownerName;
  return "SignalOne User";
}

function updateViewSubheaders() {
  const brand = getActiveBrand();

  const target = document.querySelector("[data-brand-context]");
  if (!target) return;

  if (!brand) {
    target.textContent = "Kein Brand ausgewählt";
    return;
  }

  const campaignId = AppState.selectedCampaignId;
  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const campaign = campaigns.find((c) => c.id === campaignId) || null;

  if (!campaign) {
    target.textContent = `${brand.name} — Aktives Werbekonto`;
  } else {
    target.textContent = `${brand.name} — ${campaign.name}`;
  }
}

/* ----------------------------------------------------------
   TOPBAR (DATUM / ZEIT / GREETING)
-----------------------------------------------------------*/
function getGreetingPrefix() {
  const hour = new Date().getHours();
  if (hour < 5) return "GUTE NACHT";
  if (hour < 11) return "GUTEN MORGEN";
  if (hour < 17) return "GUTEN TAG";
  if (hour < 22) return "GUTEN ABEND";
  return "GUTE NACHT";
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

/* ----------------------------------------------------------
   BRAND / CAMPAIGN SELECTS (TOPBAR)
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

  if (!AppState.selectedBrandId && DemoData.brands[0]) {
    AppState.selectedBrandId = DemoData.brands[0].id;
    select.value = DemoData.brands[0].id;
  } else {
    select.value = AppState.selectedBrandId || "";
  }

  updateViewSubheaders();
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
      updateViewSubheaders();
      loadModule(AppState.currentModule);
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      loadModule(AppState.currentModule);
      updateViewSubheaders();
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
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Reflow, damit Animation sicher getriggert wird
  void toast.offsetWidth;

  // CSS nutzt .toast.visible – hier entsprechend angleichen
  toast.classList.add("visible");

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3200);
}

/* ----------------------------------------------------------
   NOTIFICATIONS
-----------------------------------------------------------*/
function pushNotification(type, message, meta = {}) {
  AppState.notifications.push({ type, message, meta, ts: Date.now() });
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
  const dot = document.querySelector('[data-system-indicator="meta"]');
  const label = document.querySelector('[data-system-label="meta"]');
  if (!dot || !label) return;

  if (AppState.metaConnected) {
    dot.style.backgroundColor = "var(--color-success)";
    label.textContent = "Meta: Verbunden";
  } else if (useDemoMode()) {
    dot.style.backgroundColor = "var(--color-warning-soft)";
    label.textContent = "Meta: Demo-Modus";
  } else {
    dot.style.backgroundColor = "var(--color-danger)";
    label.textContent = "Meta: Getrennt";
  }
}

function updateSystemHealthUI() {
  const dot = document.querySelector('[data-system-indicator="system"]');
  const label = document.querySelector('[data-system-label="system"]');
  if (!dot || !label) return;

  if (AppState.systemHealthy) {
    dot.style.backgroundColor = "var(--color-success)";
    label.textContent = "System Health: Stable";
  } else {
    dot.style.backgroundColor = "var(--color-warning)";
    label.textContent = "System Health: Hinweise aktiv";
  }
}

function updateCampaignHealthUI() {
  const dot = document.querySelector('[data-system-indicator="campaign"]');
  const label = document.querySelector('[data-system-label="campaign"]');
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
      dot.style.backgroundColor = "var(--color-warning-soft)";
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
  requestAnimationFrame(() => {
    el.style.opacity = 1;
  });
}

/* ----------------------------------------------------------
   MODULE LOADING
-----------------------------------------------------------*/
async function loadModule(key, options = {}) {
  const retryCount = options.retryCount ?? 0;
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

    // Safety-Net: Wenn der erste Load direkt nach dem Bootstrap fehlschlägt,
    // versuchen wir es einmal automatisch erneut. In der Praxis entspricht das
    // dem Verhalten, wenn der User oben die Brand wechselt (manueller Reload).
    if (retryCount < 1) {
      console.warn("[SignalOne] Erneuter Ladeversuch für Modul", key);
      setTimeout(() => {
        loadModule(key, { retryCount: retryCount + 1 });
      }, 400);
    }
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
    updateViewSubheaders();
  }
}

async function navigateTo(key) {
  if (!modules[key]) return;

  AppState.currentModule = key;

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
  console.log("🚀 SignalOne Bootstrap startet...");
  console.log("✅ DemoData verfügbar:", DemoData.brands.length, "Brands");

  renderNav();

  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);

  document
    .getElementById("metaConnectButton")
    ?.addEventListener("click", () => {
      MetaAuth.connectWithPopup();
    });

  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();
  updateViewSubheaders();

  const settingsBtn = document.getElementById("settingsButton");
  settingsBtn?.addEventListener("click", () => navigateTo("settings"));

  const modalCloseBtn = document.getElementById("modalCloseButton");
  const modalOverlay = document.getElementById("modalOverlay");
  modalCloseBtn?.addEventListener("click", closeSystemModal);
  modalOverlay?.addEventListener("click", (evt) => {
    if (evt.target === modalOverlay) closeSystemModal();
  });

  const profileBtn = document.getElementById("profileButton");
  profileBtn?.addEventListener("click", () => {
    openSystemModal(
      "Profil",
      `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>
       <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">Später: echtes User- & Team-Management.</p>`
    );
  });

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

  const logoutBtn = document.getElementById("logoutButton");
  logoutBtn?.addEventListener("click", () => {
    AppState.metaConnected = false;
    AppState.meta.token = null;
    AppState.meta.user = null;
    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    updateViewSubheaders();
    showToast("Session zurückgesetzt (Demo-Logout).", "success");
  });

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
  },
};
