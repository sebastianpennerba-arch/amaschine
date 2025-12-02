/* ============================================================
   SignalOne.app.js – Rebuild 2025
   High-Performance Vanilla SPA Engine
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
  },

  selectedBrandId: null,
  selectedCampaignId: null,

  settings: {
    demoMode: true,
  },

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
   3) VIEW REGISTRY (mapping module -> template section)
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

/* Human-friendly labels for header bar */
export const ModuleLabels = {
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

/* ------------------------------------------------------------
   4) DYNAMIC MODULE LOADER
   (Each module exposes render(container, AppState, api))
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
   6) DEMO DATA FALLBACK (if backend unavailable)
------------------------------------------------------------ */
export const DemoData = window.SignalOneDemo?.DemoData || {
  brands: [
    { id: "brand1", name: "ACME Fashion", ownerName: "ACME GmbH", vertical: "Fashion", campaignHealth: "good" },
  ],
  campaignsByBrand: {
    brand1: [
      { id: "c1", name: "ACME UGC", status: "ACTIVE" },
      { id: "c2", name: "Hook Battle", status: "TESTING" },
    ],
  },
};

/* ------------------------------------------------------------
   7) HELPER: CHECK IF WE USE DEMO MODE
------------------------------------------------------------ */
export function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}
/* ============================================================
   8) META CONNECT (DEMO + API READY)
   ============================================================ */

export async function toggleMetaConnection() {
  // DEMO MODE → nur lokaler Toggle
  if (useDemoMode()) {
    AppState.metaConnected = !AppState.metaConnected;

    if (AppState.metaConnected) {
      AppState.meta.token = "demo-token";
      AppState.meta.user = { name: "Demo Nutzer" };
      showToast("Meta Demo verbunden.", "success");
    } else {
      AppState.meta.token = null;
      AppState.meta.user = null;
      showToast("Meta Verbindung getrennt.", "warning");
    }

    updateMetaStatusUI();
    updateGreeting();
    updateSidebarCampaignHealth();
    return;
  }

  // LIVE MODE (API CALL) – falls Backend aktiv
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
  updateGreeting();
  updateSidebarCampaignHealth();
}

/* ============================================================
   9) META STATUS UI (Sidebar + Topbar)
   ============================================================ */

export function updateMetaStatusUI() {
  const dot = $("sidebarMetaDot");
  const label = $("sidebarMetaLabel");

  if (!dot || !label) return;

  if (AppState.metaConnected) {
    dot.style.background = "var(--color-success)";
    label.textContent = useDemoMode()
      ? "Meta Ads: Demo verbunden"
      : "Meta Ads: Live verbunden";
  } else {
    dot.style.background = "var(--color-danger)";
    label.textContent = "Meta Ads: Getrennt";
  }

  // Topbar Button
  const btn = $("metaConnectButton");
  if (btn) btn.textContent = AppState.metaConnected ? "META TRENNEN" : "META VERBINDEN";
}

/* ============================================================
   10) SIDEBAR RENDERER
   ============================================================ */

export function renderSidebar() {
  const nav = $("navbar");
  nav.innerHTML = "";

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
    "settings",
  ];

  order.forEach((moduleKey) => {
    const li = document.createElement("li");
    li.className = "sidebar-nav-item";
    li.dataset.module = moduleKey;

    li.innerHTML = `
      <button class="sidebar-nav-button">
        <svg class="icon-svg">
          <use href="#icon-${moduleKey}"></use>
        </svg>
        <span class="label">${ModuleLabels[moduleKey] || moduleKey}</span>
      </button>
    `;

    li.addEventListener("click", () => navigateTo(moduleKey));

    nav.appendChild(li);
  });

  updateSidebarActive(AppState.currentModule);
}

export function updateSidebarActive(activeKey) {
  qsa(".sidebar-nav-item").forEach((li) => {
    li.classList.toggle("is-active", li.dataset.module === activeKey);
  });
}

/* ============================================================
   11) GOLD BANNER (HeaderBar)
   ============================================================ */

export function updateHeaderBar(moduleKey) {
  const header = $("viewHeaderBar");
  if (!header) return;

  header.textContent = ModuleLabels[moduleKey] || "SignalOne";
}

/* ============================================================
   12) BRAND SUBHEADER (unter Goldbanner)
   ============================================================ */

export function updateBrandSubheader(container) {
  if (!container) return;

  const brand = getActiveBrand();
  if (!brand) return;

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const campaignText =
    campaigns.length === 1
      ? "1 Kampagne sichtbar"
      : `${campaigns.length} Kampagnen sichtbar`;

  let block = container.querySelector(".view-subheader");
  if (!block) {
    block = document.createElement("div");
    block.className = "view-subheader";
    container.prepend(block);
  }

  block.innerHTML = `
    <div class="subheader-line-1">
      <span class="subheader-brand-name">${brand.ownerName || brand.name}</span>
      <span class="subheader-role">— Aktives Werbekonto</span>
    </div>
    <div class="subheader-line-2">
      <span class="subheader-campaigns">${campaignText}</span>
      <span class="subheader-divider">•</span>
      <span class="subheader-industry">Industry: ${brand.vertical}</span>
    </div>
  `;
}

/* ============================================================
   13) GREETING + DATETIME
   ============================================================ */

export function updateGreeting() {
  const el = $("topbarGreeting");
  if (!el) return;

  const name =
    AppState.meta?.user?.name ||
    DemoData.brands.find((b) => b.id === AppState.selectedBrandId)?.ownerName ||
    "Nutzer";

  const hour = new Date().getHours();
  let prefix = "Hallo";
  if (hour < 11) prefix = "Guten Morgen";
  else if (hour < 18) prefix = "Guten Tag";
  else prefix = "Guten Abend";

  el.textContent = `${prefix}, ${name}!`;
}

export function updateDateTime() {
  const d = $("topbarDate");
  const t = $("topbarTime");
  const now = new Date();

  if (d) {
    d.textContent = "Datum: " + now.toLocaleDateString("de-DE");
  }
  if (t) {
    t.textContent =
      "Zeit: " +
      now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
  }
}

setInterval(updateDateTime, 60000);

/* ============================================================
   14) ACTIVE-BRAND HELPERS
   ============================================================ */

export function getActiveBrand() {
  const id = AppState.selectedBrandId;
  if (!id) return DemoData.brands[0];
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0];
}

/* Sidebar Campaign Health Dot */
export function updateSidebarCampaignHealth() {
  const brand = getActiveBrand();
  const dot = $("sidebarCampaignDot");
  const label = $("sidebarCampaignLabel");

  if (!brand || !dot || !label) return;

  switch (brand.campaignHealth) {
    case "good":
      dot.style.background = "var(--color-success)";
      label.textContent = "Campaign Health: Stark";
      break;
    case "warning":
      dot.style.background = "var(--color-warning)";
      label.textContent = "Campaign Health: Beobachten";
      break;
    case "critical":
      dot.style.background = "var(--color-danger)";
      label.textContent = "Campaign Health: Kritisch";
      break;
    default:
      dot.style.background = "var(--color-text-soft)";
      label.textContent = "Campaign Health: n/a";
  }
}
/* ============================================================
   15) BRAND & CAMPAIGN SELECT – CORE LOGIC
   ============================================================ */

export function populateBrandSelect() {
  const select = $("brandSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Werbekonto auswählen</option>`;

  DemoData.brands.forEach((brand) => {
    const opt = document.createElement("option");
    opt.value = brand.id;
    opt.textContent = `${brand.name} (${brand.vertical})`;
    select.appendChild(opt);
  });

  // Auto-select first brand if none chosen
  if (!AppState.selectedBrandId && DemoData.brands.length > 0) {
    AppState.selectedBrandId = DemoData.brands[0].id;
  }

  select.value = AppState.selectedBrandId || "";
}

export function populateCampaignSelect() {
  const select = $("campaignSelect");
  if (!select) return;

  select.innerHTML = `<option value="">Kampagne auswählen</option>`;

  const brandId = AppState.selectedBrandId;
  if (!brandId) return;

  const campaigns = DemoData.campaignsByBrand[brandId] || [];

  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;

    const symbol =
      c.status === "ACTIVE" ? "🟢" : c.status === "PAUSED" ? "⏸" : "🧪";

    opt.textContent = `${symbol} ${c.name}`;
    select.appendChild(opt);
  });

  // Restore last selected
  if (AppState.selectedCampaignId) {
    select.value = AppState.selectedCampaignId;
  }
}

/* ============================================================
   16) SELECT EVENT WIRING
   ============================================================ */

export function wireSelects() {
  const brandSelect = $("brandSelect");
  const campSelect = $("campaignSelect");

  if (brandSelect) {
    brandSelect.addEventListener("change", () => {
      AppState.selectedBrandId = brandSelect.value || null;

      // Reset Campaign
      AppState.selectedCampaignId = null;
      populateCampaignSelect();

      updateSidebarCampaignHealth();
      updateGreeting();

      // Re-render current view
      navigateTo(AppState.currentModule);
    });
  }

  if (campSelect) {
    campSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campSelect.value || null;

      // Re-render current view
      navigateTo(AppState.currentModule);
    });
  }
}

/* ============================================================
   17) SUBHEADER + HEALTH UPDATES ON SELECT CHANGE
   ============================================================ */

export function triggerBrandContextUpdates(container) {
  updateSidebarCampaignHealth();
  updateGreeting();
  updateBrandSubheader(container);
}
/* ============================================================
   18) VIEW RENDERER – TEMPLATE SYSTEM
   ============================================================ */

/**
 * Kopiert den HTML-Inhalt eines <section id="XxxView"> Templates
 * in den zentralen #viewContainer.
 */
export function renderTemplate(viewId) {
  const template = $(viewId);
  const container = $("viewContainer");

  if (!container) return;
  if (!template) {
    container.innerHTML = `<p>Template "${viewId}" nicht gefunden.</p>`;
    return;
  }

  // Template HTML in Container setzen
  container.innerHTML = template.innerHTML;
}

/* ============================================================
   19) MODULE LOADING (DYNAMIC)
   ============================================================ */

async function loadModule(moduleKey) {
  const container = $("viewContainer");
  const viewId = ViewMap[moduleKey];

  if (!container) return;

  // Check Meta Requirement
  if (RequiresMeta.includes(moduleKey) && !useDemoMode()) {
    if (!AppState.metaConnected) {
      container.innerHTML = `
        <div class="module-locked">
          <p>Dieses Modul benötigt eine Meta Ads Verbindung.</p>
          <button class="primary-button" onclick="window.SignalOne.toggleMetaConnection()">
            Meta verbinden
          </button>
        </div>`;
      return;
    }
  }

  // Show Skeleton Loader
  applySkeleton(container);

  try {
    const loader = ModuleLoader[moduleKey];
    if (!loader) {
      // Fallback: purely template-based
      renderTemplate(viewId);
      return;
    }

    const module = await loader();

    if (module && typeof module.render === "function") {
      container.innerHTML = "";
      await module.render(container, AppState, {
        demo: useDemoMode(),
        navigateTo,
        showToast,
        openSystemModal,
      });
    } else {
      // fallback to template
      renderTemplate(viewId);
    }
  } catch (err) {
    console.error("[SignalOne] Fehler im Modul:", moduleKey, err);
    showToast(`Fehler in ${ModuleLabels[moduleKey]}`, "error");

    container.innerHTML = `
      <div class="module-error">
        <h3>Fehler im Modul "${ModuleLabels[moduleKey]}"</h3>
        <p>${err}</p>
      </div>
    `;

    AppState.systemHealthy = false;
    updateSystemHealthUI();
  }

  // Always update subheader after any load
  updateBrandSubheader(container);
}

/* ============================================================
   20) NAVIGATION ENGINE
   ============================================================ */

export async function navigateTo(moduleKey) {
  if (!ViewMap[moduleKey]) {
    console.warn("Unbekanntes Modul:", moduleKey);
    return;
  }

  AppState.currentModule = moduleKey;

  // Update UI States
  updateHeaderBar(moduleKey);
  updateSidebarActive(moduleKey);
  updateGreeting();

  // Actual Load
  await loadModule(moduleKey);
}

/* ============================================================
   21) SKELETON LOADER
   ============================================================ */

export function applySkeleton(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="skeleton-block" style="height:24px;width:40%;margin-bottom:18px;"></div>
    <div class="skeleton-block" style="height:120px;margin-bottom:14px;"></div>
    <div class="skeleton-block" style="height:200px;"></div>
  `;
}

/* ============================================================
   22) SYSTEM HEALTH
   ============================================================ */

export function updateSystemHealthUI() {
  const dot = $("sidebarSystemDot");
  const label = $("sidebarSystemLabel");

  if (!dot || !label) return;

  if (AppState.systemHealthy) {
    dot.style.background = "var(--color-success)";
    label.textContent = "System Health: OK";
  } else {
    dot.style.background = "var(--color-warning)";
    label.textContent = "System Health: Fehler erkannt";
  }
}
/* ============================================================
   23) GLOBAL LOADER
   ============================================================ */

export function showGlobalLoader() {
  const el = $("globalLoader");
  if (!el) return;
  el.classList.remove("hidden");
}

export function hideGlobalLoader() {
  const el = $("globalLoader");
  if (!el) return;
  el.classList.add("hidden");
}

/* ============================================================
   24) TOAST SYSTEM
   ============================================================ */

export function showToast(message, type = "info") {
  const container = $("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";

  if (type === "success") toast.classList.add("toast-success");
  if (type === "warning") toast.classList.add("toast-warning");
  if (type === "error") toast.classList.add("toast-error");

  toast.textContent = message;
  container.appendChild(toast);

  // Eintritt
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  // Exit
  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 240);
  }, 2800);
}

/* ============================================================
   25) MODAL SYSTEM
   ============================================================ */

export function openSystemModal(title, bodyHtml) {
  const overlay = $("modalOverlay");
  const titleEl = $("modalTitle");
  const bodyEl = $("modalBody");

  if (!overlay || !titleEl || !bodyEl) return;

  titleEl.textContent = title || "";
  bodyEl.innerHTML = bodyHtml || "";

  overlay.classList.remove("hidden");
}

export function closeSystemModal() {
  const overlay = $("modalOverlay");
  if (!overlay) return;
  overlay.classList.add("hidden");
}

/* Modal close wiring helper */
export function wireModalClose() {
  const overlay = $("modalOverlay");
  const closeBtn = $("modalCloseButton");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      closeSystemModal();
    });
  }

  if (overlay) {
    overlay.addEventListener("click", (evt) => {
      if (evt.target === overlay) {
        closeSystemModal();
      }
    });
  }
}
/* ============================================================
   26) BOOTSTRAP – THE STARTUP SEQUENCE
   ============================================================ */

export function bootstrapSignalOne() {
  console.log("🚀 SignalOne Bootstrapping…");

  /* -------------------------------
     1) SIDEBAR BUILD
     ------------------------------- */
  renderSidebar();

  /* -------------------------------
     2) SELECT SETUP (Brand/Campaign)
     ------------------------------- */
  populateBrandSelect();
  populateCampaignSelect();
  wireSelects();

  /* -------------------------------
     3) TOPBAR BUTTONS
     ------------------------------- */

  // META CONNECT
  const metaBtn = $("metaConnectButton");
  if (metaBtn) {
    metaBtn.addEventListener("click", () => {
      toggleMetaConnection();
      navigateTo(AppState.currentModule);
    });
  }

  // INFO BUTTON
  const infoBtn = $("infoButton");
  if (infoBtn) {
    infoBtn.addEventListener("click", () => {
      openSystemModal(
        "System-Informationen",
        `
        <p><strong>Mode:</strong> ${useDemoMode() ? "Demo" : "Live"}</p>
        <p><strong>Meta:</strong> ${
          AppState.metaConnected ? "Verbunden" : "Getrennt"
        }</p>
        <hr>
        <p>SignalOne.cloud UI Framework Version 2025</p>
        `
      );
    });
  }

  // PROFILE BUTTON
  const profileBtn = $("profileButton");
  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      openSystemModal(
        "Profil",
        `<p>Aktiver Nutzer:</p><p><strong>${
          AppState.meta?.user?.name ||
          DemoData.brands.find((b) => b.id === AppState.selectedBrandId)
            ?.ownerName ||
          "Nutzer"
        }</strong></p>`
      );
    });
  }

  // LOGOUT BUTTON
  const logoutBtn = $("logoutButton");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AppState.metaConnected = false;
      AppState.meta.user = null;
      AppState.meta.token = null;

      updateMetaStatusUI();
      updateGreeting();
      updateSidebarCampaignHealth();

      showToast("Demo-Logout ausgeführt.", "success");

      navigateTo("dashboard");
    });
  }

  /* -------------------------------
     4) MODAL CLOSE EVENTS
     ------------------------------- */
  wireModalClose();

  /* -------------------------------
     5) TOPBAR GREETING + TIME
     ------------------------------- */
  updateGreeting();
  updateDateTime();
  setInterval(updateDateTime, 60000);

  /* -------------------------------
     6) STATUS DOTS
     ------------------------------- */
  updateMetaStatusUI();
  updateSystemHealthUI();
  updateSidebarCampaignHealth();

  /* -------------------------------
     7) LOAD INITIAL MODULE
     ------------------------------- */
  navigateTo(AppState.currentModule);

  console.log("✅ SignalOne Bootstrap abgeschlossen.");
}

/* ============================================================
   27) AUTO-BOOT ON DOM READY
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  bootstrapSignalOne();
});
/* ============================================================
   28) GLOBAL SIGNALONE API (für Module & Debug)
   ============================================================ */

window.SignalOne = {
  AppState,

  // Navigation
  navigateTo,

  // Meta
  toggleMetaConnection,

  // Rendering
  renderTemplate,
  updateHeaderBar,
  updateBrandSubheader,

  // Status & UI
  showToast,
  openSystemModal,
  closeSystemModal,

  // Loader
  showGlobalLoader,
  hideGlobalLoader,

  // Select
  populateBrandSelect,
  populateCampaignSelect,

  // Subheader
  updateSidebarCampaignHealth,
  updateSystemHealthUI,
  updateMetaStatusUI,

  // Greeting
  updateGreeting,
  updateDateTime,

  // Re-render current view
  rerender: () => navigateTo(AppState.currentModule),
};

/* ============================================================
   29) DEBUG QUALITY OF LIFE HELPERS
   ============================================================ */

window.SignalOne.debug = {
  state: () => JSON.parse(JSON.stringify(AppState)),
  brands: () => DemoData.brands,
  campaigns: () =>
    DemoData.campaignsByBrand[AppState.selectedBrandId] || [],
  logState: () => console.log("APPSTATE:", AppState),
};

/* ============================================================
   END OF FILE
   ============================================================ */

console.log("🔥 SignalOne.app.js Rebuild geladen (7/7)");
