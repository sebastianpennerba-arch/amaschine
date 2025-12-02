/*
 * SignalOne.app.js – Rebuild 2025
 * - View Engine (ViewContainer + Gold Header)
 * - Meta Demo Connect
 * - Brand/Campaign Select
 * - Loader, Toast, Modal, Sidebar States
 * - Optional Module Loader (/packages/*)
 */

/* ============================================================
   1) GLOBAL APP STATE
   ============================================================ */

const AppState = {
  currentModule: "dashboard", // logical key, e.g. "dashboard", "campaigns", ...
  metaConnected: false,

  selectedBrandId: null,
  selectedCampaignId: null,

  settings: {
    demoMode: true,
  },

  notifications: [],
  systemHealthy: true,

  meta: {
    token: null,
    user: null,
  },
};

/* ============================================================
   2) DEMO DATA (Fallback, falls kein DataLayer vorhanden)
   ============================================================ */

// Falls bereits DemoData aus /packages/campaigns/demo.js kommt, nutze das.
const DemoData =
  (window.SignalOneDemo && window.SignalOneDemo.DemoData) || {
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
      fitlife_supplements: [
        { id: "fit_scale", name: "Scale Stack Q4", status: "ACTIVE" },
      ],
      homezen_living: [
        { id: "home_test", name: "Creative Testing", status: "TESTING" },
      ],
    },
  };

window.SignalOneDemo = window.SignalOneDemo || {};
window.SignalOneDemo.DemoData = DemoData;

/* ============================================================
   3) BASIC DOM HELPERS
   ============================================================ */

function $(id) {
  return document.getElementById(id);
}

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return document.querySelectorAll(selector);
}

/* ============================================================
   4) MODULE REGISTRY
   ============================================================ */

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
  sensei: "Sensei / AI",
  testingLog: "Testing Log",
  reports: "Reports & Export",
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

/* ============================================================
   5) DEMO / META CONNECT LOGIK
   ============================================================ */

function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

function toggleMetaConnectionDemo() {
  AppState.metaConnected = !AppState.metaConnected;

  if (AppState.metaConnected) {
    AppState.meta.token = "demo-token";
    AppState.meta.user = { name: "Meta Demo Account" };
    showToast("Meta Demo-Verbindung aktiviert.", "success");
  } else {
    AppState.meta.token = null;
    AppState.meta.user = null;
    showToast("Meta-Verbindung getrennt.", "warning");
  }

  updateMetaStatusUI();
  updateCampaignHealthUI();
  updateTopbarGreeting();
}

/* ============================================================
   6) TOPBAR – GREETING & DATETIME
   ============================================================ */

function getActiveBrand() {
  const id = AppState.selectedBrandId || DemoData.brands[0]?.id;
  if (!id) return null;
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0] || null;
}

function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function getEffectiveBrandOwnerName() {
  if (AppState.meta?.user?.name) return AppState.meta.user.name;
  const brand = getActiveBrand();
  if (brand?.ownerName) return brand.ownerName;
  return "SignalOne Nutzer";
}

function updateTopbarGreeting() {
  const el = $("topbarGreeting");
  if (!el) return;
  el.textContent = `${getGreetingPrefix()}, ${getEffectiveBrandOwnerName()}!`;
}

function updateTopbarDateTime() {
  const dateEl = $("topbarDate");
  const timeEl = $("topbarTime");
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

/* ============================================================
   7) GOLDENER BANNER + BRAND SUBHEADER
   ============================================================ */

function updateGoldHeader(moduleKey) {
  const headerBar = $("viewHeaderBar");
  if (!headerBar) return;
  const label = moduleLabels[moduleKey] || "SignalOne";
  headerBar.textContent = label;
}

function buildBrandContextSubheader(container) {
  if (!container) return;

  const brand = getActiveBrand();
  if (!brand) return;

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const count = campaigns.length;
  const campaignText =
    count === 1 ? "1 Kampagne sichtbar" : `${count} Kampagnen sichtbar`;

  let subheader = container.querySelector(".view-subheader");
  if (!subheader) {
    subheader = document.createElement("div");
    subheader.className = "view-subheader";
    container.prepend(subheader);
  }

  subheader.innerHTML = `
    <div class="subheader-line-1">
      <span class="subheader-brand-name">${brand.ownerName || brand.name}</span>
      <span class="subheader-role">— Aktives Werbekonto</span>
    </div>
    <div class="subheader-line-2">
      <span class="subheader-campaigns">${campaignText}</span>
      <span class="subheader-divider">•</span>
      <span class="subheader-industry">Industry: ${brand.vertical || "n/a"}</span>
    </div>
  `;
}

/* ============================================================
   8) BRAND & CAMPAIGN SELECT
   ============================================================ */

function populateBrandSelect() {
  const select = $("brandSelect");
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
}

function populateCampaignSelect() {
  const select = $("campaignSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Kampagne auswählen</option>';

  const brandId = AppState.selectedBrandId;
  if (!brandId) return;

  const campaigns = DemoData.campaignsByBrand[brandId] || [];
  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    const icon =
      c.status === "ACTIVE" ? "🟢" : c.status === "PAUSED" ? "⏸" : "🧪";
    opt.textContent = `${icon} ${c.name}`;
    select.appendChild(opt);
  });

  if (AppState.selectedCampaignId) {
    select.value = AppState.selectedCampaignId;
  }
}

function wireBrandAndCampaignSelects() {
  const brandSelect = $("brandSelect");
  const campaignSelect = $("campaignSelect");

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      AppState.selectedBrandId = brandSelect.value || null;
      AppState.selectedCampaignId = null;

      populateCampaignSelect();
      updateCampaignHealthUI();
      updateTopbarGreeting();

      navigateTo(AppState.currentModule);
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      navigateTo(AppState.currentModule);
    });
  }
}

/* ============================================================
   9) SIDEBAR – RENDER & ACTIVE STATE
   ============================================================ */

function renderSidebar() {
  const navbar = $("navbar");
  if (!navbar) return;

  navbar.innerHTML = "";

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
    // "onboarding", // nicht im normalen Flow
  ];

  order.forEach((key) => {
    if (!modules[key] && key !== "roast" && key !== "testingLog") return;

    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.dataset.module = key;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sidebar-nav-button";

    const iconSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    iconSvg.setAttribute("viewBox", "0 0 24 24");
    iconSvg.classList.add("icon-svg");

    const use = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "use"
    );
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#icon-${key}`);
    iconSvg.appendChild(use);

    const labelSpan = document.createElement("span");
    labelSpan.className = "label";
    labelSpan.textContent = moduleLabels[key] || key;

    btn.appendChild(iconSvg);
    btn.appendChild(labelSpan);

    btn.addEventListener("click", () => navigateTo(key));

    li.appendChild(btn);
    navbar.appendChild(li);
  });

  updateSidebarActiveIcon(AppState.currentModule);
}

function updateSidebarActiveIcon(activeKey) {
  qsa(".sidebar-nav-button").forEach((btn) => {
    const li = btn.closest("li");
    const mod = li?.dataset.module;
    if (!mod) return;

    if (mod === activeKey) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });
}

/* ============================================================
   10) SYSTEM HEALTH & META STATUS
   ============================================================ */

function updateMetaStatusUI() {
  const badgeLabel = $("metaStatusLabel"); // optional
  const button = $("metaConnectButton");
  const sidebarDot = $("sidebarMetaDot");
  const sidebarLabel = $("sidebarMetaLabel");

  const isConnected = AppState.metaConnected;

  if (badgeLabel) {
    badgeLabel.textContent = isConnected
      ? useDemoMode()
        ? "Meta: Verbunden (Demo)"
        : "Meta: Verbunden (Live)"
      : "Meta: Nicht verbunden";
  }

  if (button) {
    button.textContent = isConnected ? "META TRENNEN" : "META VERBINDEN";
  }

  if (sidebarDot) {
    sidebarDot.style.backgroundColor = isConnected
      ? "var(--color-success)"
      : "var(--color-danger)";
  }

  if (sidebarLabel) {
    sidebarLabel.textContent = isConnected
      ? useDemoMode()
        ? "Meta Ads: Demo verbunden"
        : "Meta Ads: Live verbunden"
      : "Meta Ads: Getrennt";
  }
}

function updateSystemHealthUI() {
  const dot = $("sidebarSystemDot");
  const label = $("sidebarSystemLabel");

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
  const dot = $("sidebarCampaignDot");
  const label = $("sidebarCampaignLabel");
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

/* ============================================================
   11) LOADER, TOASTS, MODAL
   ============================================================ */

function showGlobalLoader() {
  $("globalLoader")?.classList.remove("hidden");
}

function hideGlobalLoader() {
  $("globalLoader")?.classList.add("hidden");
}

function applySectionSkeleton(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="skeleton-block" style="height: 20px; width: 40%; margin-bottom: 16px;"></div>
    <div class="skeleton-block" style="height: 120px; margin-bottom: 14px;"></div>
    <div class="skeleton-block" style="height: 200px;"></div>
  `;
}

function showToast(message, type = "info") {
  const container = $("toastContainer");
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

function openSystemModal(title, bodyHtml) {
  const overlay = $("modalOverlay");
  const titleEl = $("modalTitle");
  const bodyEl = $("modalBody");
  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = bodyHtml || "";
  overlay.classList.remove("hidden");
}

function closeSystemModal() {
  $("modalOverlay")?.classList.add("hidden");
}

/* ============================================================
   12) MODULE LOADING & NAVIGATION
   ============================================================ */

async function loadModule(key) {
  const loader = modules[key];
  const viewId = viewIdMap[key];
  const container = $("viewContainer");

  if (!container) return;

  // Gatekeeper
  if (modulesRequiringMeta.includes(key) && !useDemoMode()) {
    if (!AppState.metaConnected) {
      container.innerHTML =
        "<p>Dieses Modul benötigt eine Meta-Verbindung oder den Demo-Modus.</p>";
      showToast("Bitte Meta verbinden oder Demo-Modus aktivieren.", "warning");
      return;
    }
  }

  showGlobalLoader();
  applySectionSkeleton(container);
  AppState.systemHealthy = true;

  try {
    if (loader) {
      const module = await loader();
      if (module && typeof module.render === "function") {
        container.innerHTML = "";
        module.render(container, AppState, { useDemoMode: useDemoMode() });
      } else {
        const template = $(viewId);
        container.innerHTML =
          template?.innerHTML ||
          `<p>Das Modul "${moduleLabels[key] || key}" ist noch nicht implementiert.</p>`;
      }
    } else {
      const template = $(viewId);
      container.innerHTML =
        template?.innerHTML ||
        `<p>Das Modul "${moduleLabels[key] || key}" ist noch nicht implementiert.</p>`;
    }
  } catch (err) {
    console.error("[SignalOne] Fehler beim Laden von Modul:", key, err);
    container.innerHTML = `<p>Fehler beim Laden des Moduls "${moduleLabels[key] ||
      key}". Bitte später erneut versuchen.</p>`;
    showToast(`Fehler in ${moduleLabels[key] || key}`, "error");
    AppState.systemHealthy = false;
    AppState.notifications.push({
      id: Date.now(),
      type: "error",
      message: `Modulfehler: ${moduleLabels[key] || key}`,
      meta: { module: key, error: String(err) },
    });
  } finally {
    hideGlobalLoader();
    updateSystemHealthUI();
    updateCampaignHealthUI();
    buildBrandContextSubheader(container);
  }
}

async function navigateTo(key) {
  if (!modules[key] && !viewIdMap[key]) {
    console.warn("Unbekanntes Modul:", key);
    return;
  }

  AppState.currentModule = key;
  updateGoldHeader(key);
  updateSidebarActiveIcon(key);
  updateTopbarGreeting();

  await loadModule(key);
}

/* ============================================================
   13) BOOTSTRAP
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 SignalOne Bootstrap startet…");

  // Sidebar
  renderSidebar();

  // Brand / Campaign
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  // Meta Button
  const metaBtn = $("metaConnectButton");
  if (metaBtn) {
    metaBtn.addEventListener("click", () => {
      // Erstmal reiner Demo-Toggle, da echtes OAuth extern initialisiert wird
      toggleMetaConnectionDemo();
      navigateTo(AppState.currentModule);
    });
  }

  // Info / Profile / Logout / Modal
  $("infoButton")?.addEventListener("click", () => {
    openSystemModal(
      "System-Infos",
      `<p>SignalOne läuft im ${
        useDemoMode() ? "Demo-Modus" : "Live-Modus"
      }.</p><p>Meta: ${
        AppState.metaConnected ? "Verbunden" : "Nicht verbunden"
      }.</p>`
    );
  });

  $("profileButton")?.addEventListener("click", () => {
    openSystemModal(
      "Profil",
      `<p>Aktuell angemeldet als <strong>${getEffectiveBrandOwnerName()}</strong>.</p>`
    );
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

  // Time + Greeting
  updateTopbarDateTime();
  updateTopbarGreeting();
  setInterval(() => {
    updateTopbarDateTime();
    updateTopbarGreeting();
  }, 60000);

  // Status
  updateMetaStatusUI();
  updateSystemHealthUI();
  updateCampaignHealthUI();

  // Initial View
  navigateTo(AppState.currentModule);

  console.log("✅ SignalOne Bootstrap abgeschlossen.");
});

/* ============================================================
   14) GLOBAL API (optional für Debug)
   ============================================================ */

window.SignalOne = {
  AppState,
  navigateTo,
  showToast,
  openSystemModal,
  closeSystemModal,
  useDemoMode,
};
