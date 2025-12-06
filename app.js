import DataLayer from "./packages/data/index.js";

/* ----------------------------------------------------------
   SignalOne.cloud – Frontend Core (MVP Backbone)
   - View Handling
   - MetaAuth Mock (P5 Demo)
   - Toast / Modal / Status
   - Module Loader (Packages)
   - TestingLog API (P2.5 Demo-Anbindung)
-----------------------------------------------------------*/

/* ----------------------------------------------------------
   META AUTH MOCK (P5 – Demo)
-----------------------------------------------------------*/
const MetaAuthMock = (() => {
  const STORAGE_KEY = "signalone_meta_mock_v1";

  let state = {
    connected: false,
    accessToken: null,
    user: null,
  };

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      state = {
        ...state,
        ...parsed,
        connected: !!parsed.connected,
      };
    } catch (err) {
      console.warn("[MetaAuthMock] Konnte State nicht laden:", err);
    }
  }

  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn("[MetaAuthMock] Konnte State nicht speichern:", err);
    }
  }

  function syncToAppState() {
    AppState.metaConnected = state.connected;
    AppState.meta.accessToken = state.accessToken;
    AppState.meta.user = state.user;
    updateMetaStatusUI();
    updateCampaignHealthUI();
    updateTopbarGreeting();
    updateViewSubheaders();
  }

  function init() {
    loadFromStorage();
    syncToAppState();
  }

  function connectWithPopup() {
    // Reine Demo-Simulation
    setTimeout(() => {
      state.connected = true;
      state.accessToken = "demo_access_token_123";
      state.user = {
        id: "1234567890",
        name: "SignalOne Demo User",
      };
      saveToStorage();
      syncToAppState();
      showToast("Meta Ads (Demo) erfolgreich verbunden.", "success");
    }, 600);
  }

  function disconnect() {
    state.connected = false;
    state.accessToken = null;
    state.user = null;
    saveToStorage();
    syncToAppState();
    showToast("Meta-Verbindung getrennt (Demo).", "info");
  }

  return {
    init,
    connectWithPopup,
    disconnect,
  };
})();

/* ----------------------------------------------------------
   APP STATE
-----------------------------------------------------------*/
const AppState = {
  currentModule: "dashboard",
  metaConnected: false,
  meta: {
    accessToken: null,
    user: null,
  },
  selectedBrandId: null,
  selectedCampaignId: null,
  licenseLevel: "free",
  systemHealthy: true,
  notifications: [],
  settings: {
    // Hybrid-Modus: DataLayer liest diese Werte
    demoMode: true, // Demo erzwingen (überschreibt Live)
    dataMode: "auto", // "auto" | "live" | "demo"
    theme: "titanium", // "light" | "titanium"
    currency: "EUR",
    defaultRange: "last_30_days",
    cacheTtl: 300,
    devMode: false,
  },
};

/* ----------------------------------------------------------
   DEMO DATA (Brands / Campaigns)
-----------------------------------------------------------*/
import { DemoData } from "./demoData.js";

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

const moduleIconIds = {
  dashboard: "icon-dashboard",
  creativeLibrary: "icon-library",
  campaigns: "icon-campaigns",
  testingLog: "icon-testing",
  sensei: "icon-sensei",
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
   VIEW HELPERS
-----------------------------------------------------------*/
function getViewIdForModule(key) {
  return viewIdMap[key] || "dashboardView";
}

function getLabelForModule(key) {
  return moduleLabels[key] || key;
}

function createSvgIconFromSymbol(symbolId, className = "") {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("class", className || "icon-svg");
  const use = document.createElementNS(svgNS, "use");
  use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbolId}`);
  svg.appendChild(use);
  return svg;
}

// ⭐ FIX: Views wirklich sichtbar machen (.is-active + .hidden)
function setActiveView(viewId) {
  const views = document.querySelectorAll(".view");
  views.forEach((v) => {
    const isActive = v.id === viewId;
    v.classList.toggle("is-active", isActive);
    v.classList.toggle("hidden", !isActive);
  });
}

/* ----------------------------------------------------------
   BRAND & CAMPAIGN CONTEXT
-----------------------------------------------------------*/
function getActiveBrand() {
  if (!AppState.selectedBrandId) return null;
  return DemoData.brands.find((b) => b.id === AppState.selectedBrandId) || null;
}

function getEffectiveBrandOwnerName() {
  const brand = getActiveBrand();
  if (brand?.ownerName) return brand.ownerName;
  return AppState.meta?.user?.name || "SignalOne User";
}

/* ----------------------------------------------------------
   TOPBAR / TIME / GREETING
-----------------------------------------------------------*/
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

function updateTopbarGreeting() {
  const el = document.getElementById("topbarGreeting");
  if (!el) return;

  const hour = new Date().getHours();
  let base = "Hello";
  if (hour < 11) base = "Guten Morgen";
  else if (hour < 18) base = "Guten Tag";
  else base = "Guten Abend";

  const brand = getActiveBrand();
  const name = brand?.ownerName || brand?.name || "Operator";

  const mode = useDemoMode() ? "Demo-Modus" : "Live-Daten";
  el.textContent = `${base}, ${name} – ${mode}`;
}

/* ----------------------------------------------------------
   SUBHEADER
-----------------------------------------------------------*/
function getActiveBrandContext() {
  const brand = getActiveBrand();
  if (!brand) return null;

  const campaigns = DemoData.campaignsByBrand[brand.id] || [];
  const count = campaigns.length;
  const campaignText =
    count === 1 ? "1 Kampagne sichtbar" : `${count} Kampagnen sichtbar`;

  return {
    name: brand.ownerName || brand.name || "Unbekanntes Werbekonto",
    vertical: brand.vertical || "n/a",
    campaignText,
  };
}

function updateViewSubheaders() {
  const views = document.querySelectorAll(".view");
  if (!views.length) return;

  const ctx = getActiveBrandContext();
  if (!ctx) return;

  views.forEach((section) => {
    if (!section) return;
    let header = section.querySelector(".view-subheader");
    if (!header) {
      header = document.createElement("div");
      header.className = "view-subheader";
      section.insertBefore(header, section.firstChild || null);
    }

    header.innerHTML = `
      <div class="subheader-line-1">
        <span class="subheader-icon-slot"></span>
        <span class="subheader-brand-name">${ctx.name}</span>
        <span class="subheader-role">— Aktives Werbekonto</span>
      </div>
      <div class="subheader-line-2">
        <span class="subheader-campaigns">${ctx.campaignText}</span>
        <span class="subheader-divider">•</span>
        <span class="subheader-industry">Industry: ${ctx.vertical}</span>
      </div>
    `;

    const slot = header.querySelector(".subheader-icon-slot");
    if (slot) {
      const icon = createSvgIconFromSymbol("icon-workspace", "subheader-icon");
      slot.replaceWith(icon);
    }
  });
}

/* ----------------------------------------------------------
   SIDEBAR ICON STATE
-----------------------------------------------------------*/
function updateSidebarActiveIcon(activeKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button");

  buttons.forEach((btn) => {
    const module = btn.dataset.module;
    if (module === activeKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

/* ----------------------------------------------------------
   NAVIGATION
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

    const symbolId = moduleIconIds[key];
    if (symbolId) {
      const iconSvg = createSvgIconFromSymbol(symbolId, "icon-svg");
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
   STATUS DOTS
-----------------------------------------------------------*/
function updateMetaStatusUI() {
  const dot = document.getElementById("sidebarMetaDot");
  const label = document.getElementById("sidebarMetaLabel");

  if (!dot || !label) return;

  if (AppState.metaConnected) {
    dot.style.backgroundColor = "var(--color-success)";
    label.textContent = "Meta Ads: Verbunden (Demo)";
  } else {
    dot.style.backgroundColor = "var(--color-text-soft)";
    label.textContent = "Meta Ads: Getrennt";
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
   LOADER / SKELETON
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

/* ----------------------------------------------------------
   TOAST
-----------------------------------------------------------*/
function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) {
    alert(message);
    return;
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.classList.add("visible");
  });

  setTimeout(() => {
    toast.classList.remove("visible");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
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
  overlay.classList.add("open");
}

function closeSystemModal() {
  const overlay = document.getElementById("modalOverlay");
  if (!overlay) return;
  overlay.classList.remove("open");
}

/* ----------------------------------------------------------
   NOTIFICATIONS
-----------------------------------------------------------*/
function pushNotification(type, message, meta = {}) {
  AppState.notifications.push({ type, message, meta, ts: Date.now() });
}

function clearNotifications() {
  AppState.notifications = [];
}

/* ----------------------------------------------------------
   META DEMO CONNECT
-----------------------------------------------------------*/
function toggleMetaConnection() {
  if (AppState.metaConnected) {
    MetaAuthMock.disconnect();
  } else {
    MetaAuthMock.connectWithPopup();
  }
}

/* ----------------------------------------------------------
   DEMO / LIVE MODE
-----------------------------------------------------------*/
function useDemoMode() {
  if (AppState.settings.dataMode === "demo") return true;
  if (AppState.settings.dataMode === "live") return false;
  // auto:
  return !AppState.metaConnected || AppState.settings.demoMode;
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

  const campaigns = DemoData.campaignsByBrand[brandId] || [];
  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name} (${c.status})`;
    select.appendChild(opt);
  });

  if (!AppState.selectedCampaignId && campaigns[0]) {
    AppState.selectedCampaignId = campaigns[0].id;
    select.value = campaigns[0].id;
  } else {
    select.value = AppState.selectedCampaignId || "";
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
      updateViewSubheaders();
      updateCampaignHealthUI();
      loadModule(AppState.currentModule);
    });
  }

  if (campaignSelect) {
    campaignSelect.addEventListener("change", () => {
      AppState.selectedCampaignId = campaignSelect.value || null;
      updateViewSubheaders();
      loadModule(AppState.currentModule);
    });
  }
}

/* ----------------------------------------------------------
   MODULE LOADING & NAVIGATION
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
    console.error("[SignalOne] Modul Load Error:", key, err);
    section.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:300px; color:#64748b; text-align:center;">
        <div style="font-size:3rem; margin-bottom:10px;">🏗️</div>
        <h3 style="margin:0; font-size:1.2rem; color:#475569;">Modul noch nicht verfügbar</h3>
        <p style="margin-top:8px;">Das Modul <strong>${getLabelForModule(
          key
        )}</strong> existiert in dieser Demo-Umgebung noch nicht als Datei.</p>
      </div>
    `;
    AppState.systemHealthy = true;
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
   TESTING LOG – GLOBAL API
-----------------------------------------------------------*/
const TESTING_LOG_STORAGE_KEY = "signalone_testing_log_v1";

function loadStoredTestingEntries() {
  try {
    const raw = localStorage.getItem(TESTING_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveTestingEntries(entries) {
  try {
    localStorage.setItem(TESTING_LOG_STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function createDefaultTestingEntries() {
  const now = Date.now();

  function baseMetrics(roas, spend, ctr, cpm, cpa, purchases) {
    return { roas, spend, ctr, cpm, cpa, purchases };
  }

  return [
    {
      id: "demo_test_1",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 2).toISOString(),
      creativeA: {
        name: "UGC – „Mein Freund hasst es…“",
        metrics: baseMetrics(3.6, 5400, 0.032, 8.9, 21, 94),
      },
      creativeB: {
        name: "Static – -30% Offer",
        metrics: baseMetrics(1.5, 1200, 0.018, 9.1, 42, 23),
      },
      decision: {
        winner: "A",
        reason:
          "A liefert deutlich höheren ROAS + bessere CTR bei relevantem Spend.",
      },
    },
    {
      id: "demo_test_2",
      createdAt: new Date(now - 1000 * 60 * 60 * 24 * 5).toISOString(),
      creativeA: {
        name: "Hook „Ich habe DAS ausprobiert…“",
        metrics: baseMetrics(4.3, 2100, 0.048, 7.2, 18, 87),
      },
      creativeB: {
        name: "Creator Review – 60s",
        metrics: baseMetrics(3.9, 1900, 0.041, 7.8, 20, 71),
      },
      decision: {
        winner: "A",
        reason:
          "A gewinnt knapp auf ROAS & CTR – Winner in Testing übernehmen.",
      },
    },
    {
      id: "demo_test_3",
      createdAt: new Date(now - 1000 * 60 * 60 * 6).toISOString(),
      creativeA: {
        name: "Offer Stacking „3 für 2“",
        metrics: baseMetrics(2.8, 3100, 0.029, 9.5, 28, 62),
      },
      creativeB: {
        name: "Evergreen UGC – „Routine“",
        metrics: baseMetrics(4.9, 4200, 0.045, 8.1, 17, 133),
      },
      decision: {
        winner: "B",
        reason:
          "B outperformt A deutlich – Scaling Budget von A zu B verschieben.",
      },
    },
  ];
}

function createTestingLogAPI() {
  let entries = loadStoredTestingEntries();
  if (!entries.length) {
    entries = createDefaultTestingEntries();
    saveTestingEntries(entries);
  }

  function add(entry) {
    const id =
      entry.id || `test_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const normalized = {
      id,
      createdAt: entry.createdAt || new Date().toISOString(),
      creativeA: entry.creativeA || { name: "Creative A", metrics: {} },
      creativeB: entry.creativeB || { name: "Creative B", metrics: {} },
      decision: entry.decision || { winner: "A", reason: "n/a" },
    };
    entries = [normalized, ...entries];
    saveTestingEntries(entries);
  }

  function clear() {
    entries = [];
    saveTestingEntries(entries);
  }

  function seedDemo() {
    entries = createDefaultTestingEntries();
    saveTestingEntries(entries);
    showToast("Demo-Testing-Log zurückgesetzt.", "info");
  }

  function openTestSlot(creativeA, candidates = []) {
    const name = creativeA?.name || "Creative A";
    const open = window.SignalOne?.openSystemModal || openSystemModal;

    const list =
      candidates && candidates.length
        ? `<ul>${candidates
            .map(
              (c) =>
                `<li>${c.name || "Creative"} – ROAS ${
                  c.metrics?.roas ?? "–"
                }x</li>`
            )
            .join("")}</ul>`
        : "<p>Keine weiteren Creatives übergeben.</p>";

    open(
      "Testing Slot (Demo)",
      `
      <p>In der finalen Version öffnest du hier direkt einen neuen A/B-Test-Slot.</p>
      <p><strong>Target:</strong> ${name}</p>
      <div style="margin-top:12px;">
        <strong>Kandidaten:</strong><br>
        ${list}
      </div>
      <p style="margin-top:12px;font-size:0.85rem;color:#64748b;">
        Aktuell ist dies ein Demo-Overlay. Die Tabelle im Testing Log ist aber bereits an die TestingLog-API angebunden.
      </p>
    `
    );
  }

  return {
    get entries() {
      return entries;
    },
    add,
    clear,
    seedDemo,
    openTestSlot,
  };
}

const TestingLogAPI = createTestingLogAPI();

/* ----------------------------------------------------------
   BOOTSTRAP
-----------------------------------------------------------*/
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 SignalOne Bootstrap startet...");

  MetaAuthMock.init();
  renderNav();
  populateBrandSelect();
  populateCampaignSelect();
  wireBrandAndCampaignSelects();

  const initialViewId = getViewIdForModule(AppState.currentModule);
  setActiveView(initialViewId);

  document
    .getElementById("metaConnectButton")
    ?.addEventListener("click", () => {
      toggleMetaConnection();
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
       <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">(Simulierter Nutzer)</p>`
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
    MetaAuthMock.disconnect();
    showToast("Session zurückgesetzt.", "success");
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
  TestingLog: TestingLogAPI,
  DataLayer,
  UI: {
    showGlobalLoader,
    hideGlobalLoader,
    fadeIn,
    useDemoMode,
  },
};
