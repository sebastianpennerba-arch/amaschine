/*
 * app.js – SignalOne Core Backbone
 * Navigation • View Handling • Meta Simulation • Toasts • Modal
 * + Gold-Icon Sidebar & Brand-Subheader
 *
 * Phase-S Erweiterung:
 * - SenseiEngine (Demo-Intelligenz auf Basis DemoData)
 * - Sensei View: Daily Briefing, Alerts, KPIs, Actions
 * - Leichte Integration in Creative Library & Campaigns (DOM-Hooks)
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
  licenseLevel: "free",
  notifications: [],
  systemHealthy: true,
};

/* ----------------------------------------------------------
   DEMO-DATA (DIREKT HIER DEFINIEREN!)
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
      {
        id: "acme_brand_static",
        name: "Brand Awareness Static",
        status: "PAUSED",
      },
      { id: "acme_hook_battle", name: "Hook Battle Q4", status: "TESTING" },
    ],
    techgadgets_pro: [
      { id: "tech_launch", name: "Launch Funnel EU", status: "ACTIVE" },
      { id: "tech_retarg", name: "Retargeting Core", status: "ACTIVE" },
    ],
    beautylux_cosmetics: [
      { id: "beauty_creators", name: "Creator Evergreen", status: "ACTIVE" },
      {
        id: "beauty_ba",
        name: "Brand Awareness Beauty",
        status: "PAUSED",
      },
    ],
    fitlife_supplements: [
      { id: "fit_scale", name: "Scale Stack Q4", status: "ACTIVE" },
    ],
    homezen_living: [
      { id: "home_test", name: "Creative Testing", status: "TESTING" },
    ],
  },
};

/**
 * Phase-S: Sensei Demo Snapshot (basierend auf OPERATION OVERTHROW)
 * Diese Werte werden als "Account-Summary" in Sensei genutzt.
 * (Später ersetzt durch echte Aggregation aus Meta + DataLayer.)
 */
const SenseiDemo = {
  timeRange: "Letzte 30 Tage",
  spend: 47892,
  roas: 4.8,
  revenue: 229882,
  ctr: 0.032,
  cpm: 8.4,
  alerts: [
    {
      level: "critical",
      title: "ROAS -22% in den letzten 3 Tagen",
      desc: "Account-weit sinkt der ROAS spürbar. Prüfe Budget- und Creative-Verteilung.",
    },
    {
      level: "warning",
      title: "Creative C-47 verliert Performance",
      desc: "CTR & ROAS fallen unter den Account-Durchschnitt. Creative-Fatigue wahrscheinlich.",
    },
    {
      level: "positive",
      title: 'Kampagne "UGC Scale Test" übertrifft Benchmark +38%',
      desc: "Dein Top-Performer aktuell. Skalierung möglich.",
    },
  ],
  topCreatives: [
    {
      id: "mia_v3",
      name: "Mia_Hook_Problem_Solution_v3",
      roas: 6.8,
      spend: 12000,
      ctr: 0.041,
      cpm: 7.2,
      score: 94,
      tag: "WINNER",
      hook: "Problem/Solution",
      creator: "Mia",
    },
    {
      id: "tom_v1",
      name: "Tom_Testimonial_ShortForm_v1",
      roas: 5.9,
      spend: 8400,
      ctr: 0.038,
      cpm: 7.8,
      score: 90,
      tag: "WINNER",
      hook: "Testimonial",
      creator: "Tom",
    },
    {
      id: "lisa_v2",
      name: "Lisa_BeforeAfter_Showcase_v2",
      roas: 5.2,
      spend: 6100,
      ctr: 0.035,
      cpm: 7.9,
      score: 88,
      tag: "WINNER",
      hook: "Before/After",
      creator: "Lisa",
    },
  ],
  loserCreatives: [
    {
      id: "generic_static_v12",
      name: "Generic_Product_Static_v12",
      roas: 1.2,
      spend: 3200,
      ctr: 0.009,
      cpm: 11.3,
      score: 41,
      tag: "LOSER",
      hook: "Static",
      creator: "n/a",
    },
  ],
  dailyBriefing: {
    date: "Heute",
    priorities: [
      {
        label: "PRIORITÄT 1: BUDGET REALLOCATION",
        severity: "critical",
        summary:
          'Reduziere "Brand Awareness Static" um 30% und erhöhe "UGC Scale Test" um 50%.',
        impact: "+0.6x ROAS in ~7 Tagen",
      },
      {
        label: "PRIORITÄT 2: CREATIVE ROTATION",
        severity: "warning",
        summary:
          "Pausiere 3 unterperformende Creatives und aktiviere 3 neue Mia-Varianten.",
        impact: "+42% Creative-Effizienz im Prospecting",
      },
      {
        label: "PRIORITÄT 3: TESTING OPPORTUNITY",
        severity: "info",
        summary:
          'Starte Hook-Test "Problem/Solution vs Testimonial" mit 150 € / Tag für 3 Tage.',
        impact: "Erwarteter Uplift: +0.8x ROAS",
      },
    ],
    estimatedImpact: {
      revenuePerDay: 2100,
      roasDelta: 0.6,
    },
  },
};

// SOFORT GLOBAL VERFÜGBAR MACHEN
window.SignalOneDemo = window.SignalOneDemo || {};
window.SignalOneDemo.DemoData = DemoData;
window.SignalOneDemo.brands = DemoData.brands; // Für Kompatibilität
window.SignalOneDemo.SenseiDemo = SenseiDemo;

console.log("✅ DemoData geladen:", DemoData.brands.length, "Brands");

function useDemoMode() {
  if (AppState.settings.demoMode) return true;
  if (!AppState.metaConnected) return true;
  return false;
}

/**
 * Format-Helfer für Währungen (wird in TestingLog + Sensei genutzt)
 */
function formatCurrency(value, currency) {
  const cur = currency || AppState.settings.currency || "EUR";
  const n = Number(value);
  if (!Number.isFinite(n)) return "–";
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toFixed(0)} ${cur}`;
  }
}

import MetaAuth from "./packages/metaAuth/index.js";

/* ----------------------------------------------------------
   MODULE REGISTRY & LABELS
-----------------------------------------------------------*/
/**
 * Phase-S: Sensei wird direkt aus app.js gerendert.
 * Alle anderen Module bleiben als /packages-Module erhalten.
 */
function renderSenseiRoot(section, appState, ctx) {
  SenseiEngine.renderSenseiDashboard(section, appState, ctx);
}

const modules = {
  dashboard: () => import("/packages/dashboard/index.js"),
  creativeLibrary: () => import("/packages/creativeLibrary/index.js"),
  campaigns: () => import("/packages/campaigns/index.js"),
  testingLog: () => import("/packages/testingLog/index.js"),
  // Phase-S Override: Sensei kommt aus app.js
  sensei: () => Promise.resolve({ render: renderSenseiRoot }),
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

/* ICON IDs MAPPING (SIDEBAR) */
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
   SVG ICON HELPERS
-----------------------------------------------------------*/
function createSvgIconFromSymbol(symbolId, extraClass = "") {
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");

  if (extraClass) {
    svg.classList.add(extraClass);
  } else {
    svg.classList.add("icon-svg");
  }

  const symbol = document.getElementById(symbolId);
  if (symbol) {
    Array.from(symbol.childNodes).forEach((node) => {
      if (node.nodeType === 1) {
        svg.appendChild(node.cloneNode(true));
      }
    });
  } else {
    const use = document.createElementNS(svgNS, "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `#${symbolId}`);
    svg.appendChild(use);
  }

  return svg;
}

/* ----------------------------------------------------------
   VIEW & TOPBAR HELPERS
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

function getGreetingPrefix() {
  const h = new Date().getHours();
  if (h < 5) return "Gute Nacht";
  if (h < 11) return "Guten Morgen";
  if (h < 18) return "Guten Tag";
  return "Guten Abend";
}

function getActiveBrand() {
  const id = AppState.selectedBrandId || DemoData.brands[0]?.id;
  if (!id) return null;
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0] || null;
}

function getEffectiveBrandOwnerName() {
  if (AppState.meta?.user?.name) return AppState.meta.user.name;
  const brand = getActiveBrand();
  if (brand?.ownerName) return brand.ownerName;
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

/* ----------------------------------------------------------
   SUBHEADER (AKTIVES WERBEKONTO)
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
   SIDEBAR ICON STATE LOGIC
-----------------------------------------------------------*/
function updateSidebarActiveIcon(activeKey) {
  const buttons = document.querySelectorAll(".sidebar-nav-button");

  buttons.forEach((btn) => {
    const module = btn.dataset.module;
    const svg = btn.querySelector(".icon-svg");
    const fillLayerId = moduleIconIds[module];
    const symbol = document.getElementById(fillLayerId);

    const use = svg?.querySelector("use");
    if (!use || !symbol) {
      if (module === activeKey) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
      return;
    }

    if (module === activeKey) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
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
  updateViewSubheaders();

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
    const icon =
      c.status === "ACTIVE" ? "🟢" : c.status === "PAUSED" ? "⏸" : "🧪";
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
   SENSEI ENGINE – PHASE-S INTELLIGENCE LAYER
   (arbeitet mit DemoData & SenseiDemo, später DataLayer)
-----------------------------------------------------------*/
const SenseiEngine = (() => {
  function getAccountSnapshot() {
    const brand = getActiveBrand();
    const demo = SenseiDemo;
    const currentCampaignId = AppState.selectedCampaignId;
    let selectedCampaignName = null;

    if (brand && currentCampaignId) {
      const list = DemoData.campaignsByBrand[brand.id] || [];
      const c = list.find((x) => x.id === currentCampaignId);
      selectedCampaignName = c?.name || null;
    }

    const baseRoas = demo.roas;
    const healthScore = Math.max(
      0,
      Math.min(100, Math.round(baseRoas * 15 + (demo.ctr * 100) * 2)),
    );

    return {
      timeRange: demo.timeRange,
      spend: demo.spend,
      roas: demo.roas,
      revenue: demo.revenue,
      ctr: demo.ctr,
      cpm: demo.cpm,
      brandName: brand?.name || "Demo Account",
      vertical: brand?.vertical || "n/a",
      healthScore,
      selectedCampaignName,
    };
  }

  function getAlerts() {
    return SenseiDemo.alerts || [];
  }

  function getTopCreatives() {
    return SenseiDemo.topCreatives || [];
  }

  function getLoserCreatives() {
    return SenseiDemo.loserCreatives || [];
  }

  function getDailyBriefing() {
    return SenseiDemo.dailyBriefing;
  }

  function classifyRoas(roas) {
    if (roas == null) return { label: "n/a", tone: "critical" };
    if (roas >= 5.5) return { label: "Außergewöhnlich", tone: "good" };
    if (roas >= 3.5) return { label: "Gut", tone: "warning" };
    if (roas >= 2.0) return { label: "Okay", tone: "warning" };
    return { label: "Kritisch", tone: "critical" };
  }

  function mapSeverityToBadgeClass(level) {
    switch (level) {
      case "critical":
        return "kpi-badge critical";
      case "warning":
        return "kpi-badge warning";
      case "positive":
        return "kpi-badge good";
      default:
        return "kpi-badge warning";
    }
  }

  function formatPercent(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "–";
    return `${(n * 100).toFixed(1)}%`;
  }

  function renderSenseiDashboard(section, appState, ctx) {
    const snapshot = getAccountSnapshot();
    const alerts = getAlerts();
    const tops = getTopCreatives();
    const losers = getLoserCreatives();
    const briefing = getDailyBriefing();
    const roasClass = classifyRoas(snapshot.roas);

    section.innerHTML = `
      <div class="view-header">
        <div>
          <h2>Sensei Strategy Center</h2>
          <p style="font-size:0.84rem;color:#4b5563;margin:4px 0 0;">
            Dein AI-Strategie-Layer für Meta Ads. Fokus: ${snapshot.brandName}${
              snapshot.selectedCampaignName
                ? ` — Kampagne: ${snapshot.selectedCampaignName}`
                : ""
            }.
          </p>
        </div>
        <div>
          <span class="kpi-badge ${
            roasClass.tone
          }">Account Health: ${snapshot.healthScore}/100 • ${
              roasClass.label
            }</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <!-- LEFT COLUMN: KPIs + Alerts -->
        <div class="dashboard-section">
          <div class="card">
            <div class="card-header">
              <div>
                <div class="card-title">Account KPIs (${snapshot.timeRange})</div>
                <div class="card-subtitle">
                  Brand: ${snapshot.brandName} • Vertical: ${snapshot.vertical}
                </div>
              </div>
            </div>
            <div class="kpi-grid">
              <div class="kpi-item">
                <div class="kpi-label">Spend</div>
                <div class="kpi-value">${formatCurrency(snapshot.spend)}</div>
                <span class="kpi-badge warning">Budget aktiv</span>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">ROAS</div>
                <div class="kpi-value">${snapshot.roas.toFixed(1)}x</div>
                <span class="kpi-badge ${roasClass.tone}">${roasClass.label}</span>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">Revenue</div>
                <div class="kpi-value">${formatCurrency(snapshot.revenue)}</div>
                <span class="kpi-badge good">Skalierbar</span>
              </div>
              <div class="kpi-item">
                <div class="kpi-label">CTR</div>
                <div class="kpi-value">${formatPercent(snapshot.ctr)}</div>
                <span class="kpi-badge warning">Hook-Qualität</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Sensei Alerts</div>
              <div class="card-subtitle">
                Kritische Änderungen & Chancen in deinem Account.
              </div>
            </div>
            ${
              alerts.length === 0
                ? `<p style="font-size:0.84rem;color:#6b7280;margin:0;">
                     Keine aktiven Alerts. Sensei ist zufrieden. 🧠
                   </p>`
                : `
              <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:10px;">
                ${alerts
                  .map(
                    (a) => `
                  <li style="padding:8px 10px;border-radius:10px;border:1px solid rgba(148,163,184,0.45);background:#f8fafc;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                      <span style="font-size:0.82rem;font-weight:600;">${a.title}</span>
                      <span class="${mapSeverityToBadgeClass(
                        a.level,
                      )}" style="font-size:0.68rem;">
                        ${a.level === "critical" ? "KRITISCH" : a.level === "warning" ? "WARNUNG" : "CHANCE"}
                      </span>
                    </div>
                    <p style="font-size:0.8rem;color:#4b5563;margin:0;">${a.desc}</p>
                  </li>
                `,
                  )
                  .join("")}
              </ul>
            `
            }
          </div>
        </div>

        <!-- RIGHT COLUMN: Daily Briefing + Top/Loser -->
        <div class="dashboard-section">
          <div class="card">
            <div class="card-header">
              <div class="card-title">Sensei Daily Briefing</div>
              <div class="card-subtitle">
                3 konkrete Aktionen für heute – direkt aus deinen Daten.
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${
                briefing?.priorities
                  ?.map(
                    (p) => `
                <div style="border-radius:12px;padding:8px 10px;background:#f8fafc;border:1px solid rgba(148,163,184,0.35);">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:0.8rem;font-weight:600;">${p.label}</span>
                    <span class="${
                      p.severity === "critical"
                        ? "kpi-badge critical"
                        : p.severity === "warning"
                        ? "kpi-badge warning"
                        : "kpi-badge good"
                    }" style="font-size:0.68rem;">
                      ${
                        p.severity === "critical"
                          ? "DRINGEND"
                          : p.severity === "warning"
                          ? "HEUTE"
                          : "OPPORTUNITY"
                      }
                    </span>
                  </div>
                  <p style="font-size:0.8rem;color:#4b5563;margin:0 0 3px;">${p.summary}</p>
                  <p style="font-size:0.75rem;color:#6b7280;margin:0;"><strong>Impact:</strong> ${
                    p.impact
                  }</p>
                </div>
              `,
                  )
                  .join("")
                  || ""
              }
            </div>
            ${
              briefing
                ? `
              <div style="margin-top:10px;font-size:0.78rem;color:#4b5563;">
                Geschätzter Impact heute:
                <strong>${formatCurrency(
                  briefing.estimatedImpact.revenuePerDay,
                )} zusätzlicher Revenue / Tag</strong>,
                ca. <strong>+${briefing.estimatedImpact.roasDelta.toFixed(
                  1,
                )}x ROAS</strong> in den nächsten Tagen.
              </div>
            `
                : ""
            }
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
              <button type="button" class="meta-button" data-sensei-action="apply-plan">
                Empfehlungen anwenden
              </button>
              <button type="button" class="meta-button" data-sensei-action="open-testing-log">
                Testing Log öffnen
              </button>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Top & Loser Creatives</div>
              <div class="card-subtitle">
                Sensei fokussiert deine größten Hebel auf Creative-Ebene.
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1.4fr 1fr;gap:12px;">
              <div>
                <div style="font-size:0.78rem;color:#6b7280;margin-bottom:4px;">
                  Top 3 Creatives (letzte 7 Tage)
                </div>
                <ul style="list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:6px;">
                  ${tops
                    .map(
                      (c) => `
                    <li style="border-radius:10px;padding:7px 9px;background:#f8fafc;border:1px solid rgba(148,163,184,0.3);">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                        <span style="font-size:0.8rem;font-weight:600;">${c.name}</span>
                        <span class="badge badge-good" style="font-size:0.7rem;">Score ${c.score}/100</span>
                      </div>
                      <div style="font-size:0.78rem;color:#4b5563;">
                        ROAS <strong>${c.roas.toFixed(
                          1,
                        )}x</strong> • Spend ${formatCurrency(
                          c.spend,
                        )} • CTR ${(c.ctr * 100).toFixed(1)}%
                      </div>
                      <div style="font-size:0.74rem;color:#6b7280;margin-top:2px;">
                        🎬 Hook: ${c.hook} • 👤 ${c.creator}
                      </div>
                    </li>
                  `,
                    )
                    .join("")}
                </ul>
              </div>
              <div>
                <div style="font-size:0.78rem;color:#6b7280;margin-bottom:4px;">
                  Loser Alert
                </div>
                ${
                  losers[0]
                    ? `
                  <div style="border-radius:10px;padding:8px 10px;background:#fef2f2;border:1px solid rgba(220,38,38,0.6);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                      <span style="font-size:0.8rem;font-weight:600;">${losers[0].name}</span>
                      <span class="badge badge-critical" style="font-size:0.7rem;">LOSER</span>
                    </div>
                    <div style="font-size:0.78rem;color:#b91c1c;">
                      ROAS ${losers[0].roas.toFixed(
                        1,
                      )}x • Spend ${formatCurrency(
                        losers[0].spend,
                      )} • CTR ${(losers[0].ctr * 100).toFixed(1)}%
                    </div>
                    <p style="font-size:0.76rem;color:#7f1d1d;margin:6px 0 0;">
                      Sensei Empfehlung: <br />
                      <strong> Sofort pausieren.</strong> Ersetze durch Hook-basiertes UGC
                      (z.B. Mia). Starte 3 Varianten mit Problem/Solution-Hook.
                    </p>
                    <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
                      <button type="button" class="meta-button" data-sensei-action="pause-loser">
                        Loser pausieren
                      </button>
                      <button type="button" class="meta-button" data-sensei-action="open-creatives">
                        Alternativen anzeigen
                      </button>
                    </div>
                  </div>
                `
                    : `<p style="font-size:0.8rem;color:#6b7280;margin:0;">Keine klaren Loser erkannt.</p>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wire Sensei Action Buttons (nur UI-Feedback for now)
    const actions = section.querySelectorAll("[data-sensei-action]");
    actions.forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-sensei-action");
        handleSenseiAction(action);
      });
    });
  }

  function handleSenseiAction(action) {
    switch (action) {
      case "apply-plan":
        showToast(
          "Sensei Plan angewendet (Demo). Später: Direkte Budget-Updates via Meta API.",
          "success",
        );
        break;
      case "open-testing-log":
        navigateTo("testingLog");
        break;
      case "pause-loser":
        showToast(
          "Loser-Creative wird pausiert (Demo). Später: Automatischer Pause-Call.",
          "warning",
        );
        break;
      case "open-creatives":
        navigateTo("creativeLibrary");
        break;
      default:
        showToast("Sensei Aktion (Demo).", "info");
    }
  }

  /**
   * Leichte Heuristik: Creative-Score, wenn kein explizites Mapping existiert.
   * Nutzt Namen + ROAS-Schätzung, um einen Score 0-100 zu schätzen.
   */
  function estimateCreativeScoreByName(name) {
    if (!name) return 60;
    const known = SenseiDemo.topCreatives.find((c) => c.name === name);
    if (known) return known.score;

    const lower = name.toLowerCase();
    let base = 60;
    if (lower.includes("mia") || lower.includes("problem")) base += 20;
    if (lower.includes("before") || lower.includes("after")) base += 10;
    if (lower.includes("static")) base -= 18;
    return Math.max(30, Math.min(95, base));
  }

  function getCampaignSenseiSummaryByName(name) {
    if (!name) {
      return {
        healthLabel: "Neutral",
        healthClass: "campaign-health-badge warning",
        summary: "Standard-Performance. Sensei sieht Potential nach oben.",
      };
    }
    const lower = name.toLowerCase();
    if (lower.includes("scale")) {
      return {
        healthLabel: "Top Performer",
        healthClass: "campaign-health-badge good",
        summary:
          "Stabile Performance über Benchmark. Sensei empfiehlt kontrollierte Budget-Erhöhung.",
      };
    }
    if (lower.includes("brand") || lower.includes("awareness")) {
      return {
        healthLabel: "Budget Leak Risiko",
        healthClass: "campaign-health-badge warning",
        summary:
          "Brand-Kampagnen verbrennen oft Budget. Prüfe ROAS und CPM genau.",
      };
    }
    if (lower.includes("retarget")) {
      return {
        healthLabel: "Kritisch",
        healthClass: "campaign-health-badge critical",
        summary:
          "Retargeting muss stark performen. Sensei vermutet Creative- oder Audience-Fatigue.",
      };
    }
    if (lower.includes("test") || lower.includes("hook")) {
      return {
        healthLabel: "Testing",
        healthClass: "campaign-health-badge warning",
        summary:
          "Lass Tests ausreichend laufen, aber definiere klare Entscheidungsregeln.",
      };
    }
    return {
      healthLabel: "Neutral",
      healthClass: "campaign-health-badge warning",
      summary: "Sensei beobachtet diese Kampagne – keine akute Aktion nötig.",
    };
  }

  return {
    getAccountSnapshot,
    getAlerts,
    getTopCreatives,
    getLoserCreatives,
    getDailyBriefing,
    renderSenseiDashboard,
    estimateCreativeScoreByName,
    getCampaignSenseiSummaryByName,
    formatPercent,
  };
})();

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

/* ----------------------------------------------------------
   MODULE LOADING & NAVIGATION
-----------------------------------------------------------*/

/**
 * Nach dem Rendern eines Moduls werden leichte Sensei-Hooks
 * für Creative Library & Campaigns injiziert.
 */
function postRenderEnhance(moduleKey, section) {
  if (!section) return;
  if (moduleKey === "creativeLibrary") {
    enhanceCreativeLibrarySection(section);
  } else if (moduleKey === "campaigns") {
    enhanceCampaignsSection(section);
  }
}

function enhanceCreativeLibrarySection(root) {
  const cards = root.querySelectorAll(".creative-library-item");
  if (!cards.length) return;

  cards.forEach((card) => {
    const info = card.querySelector(".creative-info");
    if (!info) return;
    if (info.querySelector("[data-sensei-tag='score-badge']")) return;

    const titleEl = info.querySelector(".creative-title");
    const name = titleEl?.textContent?.trim() || "";
    const score = SenseiEngine.estimateCreativeScoreByName(name);

    const pill = document.createElement("div");
    pill.dataset.senseiTag = "score-badge";
    pill.style.marginTop = "6px";
    pill.innerHTML = `
      <span class="badge badge-soft" style="font-size:0.72rem;">
        🧠 Sensei Score: <strong>${score}/100</strong>
      </span>
    `;
    info.appendChild(pill);

    // Optional: Klick öffnet Sensei View mit Fokus auf Creatives
    card.addEventListener("dblclick", () => {
      navigateTo("sensei");
      showToast(
        `Sensei fokussiert jetzt die Creative-Strategie für "${name || "Creative"}" (Demo).`,
        "info",
      );
    });
  });
}

function enhanceCampaignsSection(root) {
  const cards = root.querySelectorAll(".campaign-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    const header =
      card.querySelector(".campaign-card-header") || card.querySelector("header");
    if (!header) return;

    const titleEl =
      header.querySelector(".campaign-card-title") ||
      header.querySelector("h3") ||
      header.querySelector("h4");
    const name = titleEl?.textContent?.trim() || "";

    let badge = card.querySelector(".campaign-health-badge");
    const summary = card.querySelector("[data-sensei-tag='campaign-summary']");

    const info = SenseiEngine.getCampaignSenseiSummaryByName(name);

    if (!badge) {
      badge = document.createElement("span");
      badge.className = info.healthClass;
      badge.textContent = info.healthLabel;
      header.appendChild(badge);
    } else {
      badge.className = info.healthClass;
      badge.textContent = info.healthLabel;
    }

    if (!summary) {
      const p = document.createElement("p");
      p.dataset.senseiTag = "campaign-summary";
      p.style.fontSize = "0.78rem";
      p.style.color = "#4b5563";
      p.style.margin = "6px 0 0";
      p.textContent = info.summary;
      card.appendChild(p);
    }

    card.addEventListener("click", (evt) => {
      if (evt.target.closest("button")) return;
      showToast(
        `Sensei analysiert Kampagne "${name || "Kampagne"}" (Demo).`,
        "info",
      );
    });
  });
}

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
      postRenderEnhance(key, section);
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
       <p style="margin-top:6px;font-size:0.85rem;color:#6b7280;">Später: echtes User- & Team-Management.</p>`,
    );
  });

  const notificationsBtn = document.getElementById("notificationsButton");
  notificationsBtn?.addEventListener("click", () => {
    if (!AppState.notifications.length) {
      openSystemModal(
        "Benachrichtigungen",
        "<p>Keine Fehler oder kritischen Warnungen vorhanden.</p>",
      );
    } else {
      const items = AppState.notifications
        .map(
          (n) =>
            `<li><strong>[${n.type.toUpperCase()}]</strong> ${n.message}</li>`,
        )
        .join("");
      openSystemModal(
        "Benachrichtigungen",
        `<p>Fehler & Warnungen:</p><ul>${items}</ul>`,
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
   TESTING LOG API (P2.4 – Test-Slot / Algorithmus A)
-----------------------------------------------------------*/

const TestingLog = (() => {
  const entries = [];

  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  function getMetric(c, key) {
    if (!c || !c.metrics) return 0;
    return safeNum(c.metrics[key]);
  }

  /**
   * Winner-Entscheidung (Option A)
   * - 1. ROAS (Delta >= 0.3)
   * - 2. CTR (Delta >= 0.5pp = 0.005)
   * - sonst: unentschieden (tie)
   */
  function computeWinner(creativeA, creativeB) {
    if (!creativeA || !creativeB) {
      return {
        winner: null,
        reason: "Mindestens ein Creative fehlt für den Vergleich.",
        roasA: 0,
        roasB: 0,
        ctrA: 0,
        ctrB: 0,
      };
    }

    const roasA = getMetric(creativeA, "roas");
    const roasB = getMetric(creativeB, "roas");
    const ctrA = getMetric(creativeA, "ctr");
    const ctrB = getMetric(creativeB, "ctr");

    const roasDiff = roasA - roasB;
    const ctrDiff = ctrA - ctrB;

    let winner = null;
    let reason = "Kein klarer Winner – Ergebnisse sind zu nah beieinander.";

    if (roasDiff >= 0.3) {
      winner = "A";
      reason = `Creative A gewinnt klar über ROAS (${roasA.toFixed(
        2,
      )}x vs. ${roasB.toFixed(2)}x).`;
    } else if (roasDiff <= -0.3) {
      winner = "B";
      reason = `Creative B gewinnt klar über ROAS (${roasB.toFixed(
        2,
      )}x vs. ${roasA.toFixed(2)}x).`;
    } else if (ctrDiff >= 0.005) {
      winner = "A";
      reason = `ROAS ähnlich – Creative A gewinnt über CTR (${(ctrA * 100).toFixed(
        2,
      )}% vs. ${(ctrB * 100).toFixed(2)}%).`;
    } else if (ctrDiff <= -0.005) {
      winner = "B";
      reason = `ROAS ähnlich – Creative B gewinnt über CTR (${(ctrB * 100).toFixed(
        2,
      )}% vs. ${(ctrA * 100).toFixed(2)}%).`;
    }

    return { winner, reason, roasA, roasB, ctrA, ctrB };
  }

  function snapshotCreative(c) {
    const m = c?.metrics || {};
    return {
      id: c?.id || null,
      name: c?.name || "",
      hook: c?.hook || "",
      creator: c?.creator || "",
      bucket: c?.bucket || "",
      score: c?.score ?? null,
      metrics: {
        roas: getMetric(c, "roas"),
        spend: getMetric(c, "spend"),
        ctr: getMetric(c, "ctr"),
        cpm: getMetric(c, "cpm"),
        cpa: getMetric(c, "cpa"),
        purchases: getMetric(c, "purchases"),
      },
    };
  }

  function addEntry(creativeA, creativeB, meta = {}) {
    const decision = computeWinner(creativeA, creativeB);

    const entry = {
      id: `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      brandId: AppState.selectedBrandId,
      campaignId: AppState.selectedCampaignId,
      creativeA: snapshotCreative(creativeA),
      creativeB: snapshotCreative(creativeB),
      decision,
      meta,
    };

    entries.push(entry);

    if (window.SignalOne?.showToast) {
      const label =
        decision.winner === "A"
          ? "A gewinnt den Test."
          : decision.winner === "B"
          ? "B gewinnt den Test."
          : "Kein klarer Winner.";
      window.SignalOne.showToast(
        `Testing Log: Eintrag erstellt. ${label}`,
        "success",
      );
    }

    return entry;
  }

  function openTestSlot(primaryCreative, variants = []) {
    const base = primaryCreative;
    if (!base) {
      showToast("Test-Slot: Creative konnte nicht geladen werden.", "error");
      return;
    }

    const others = Array.isArray(variants)
      ? variants.filter((v) => v && v.id && v.id !== base.id)
      : [];

    const candidateB =
      others.length > 0
        ? others.slice().sort((a, b) => (b.score || 0) - (a.score || 0))[0]
        : null;

    if (!candidateB) {
      showToast(
        "Für diesen Test-Slot werden mindestens zwei Varianten benötigt.",
        "warning",
      );
    }

    const creativeA = base;
    const creativeB = candidateB;

    const bodyHtml = `
      <div class="testslot-modal" style="display:flex;flex-direction:column;gap:16px;">
        <p class="testslot-intro">
          Test-Slot für <strong>${escapeHtml(
            creativeA.name || "Creative",
          )}</strong>.
          Algorithmus: <strong>ROAS first, CTR als Tiebreaker</strong>.
        </p>

        <div class="testslot-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
          <div class="testslot-card" data-slot="A" style="border-radius:16px;padding:12px;border:1px solid rgba(148,163,184,0.5);">
            <h3 style="font-size:0.9rem;margin:0 0 4px;">Creative A (Basis)</h3>
            <p style="font-size:0.8rem;margin:0 0 8px;color:#6b7280;">
              ${escapeHtml(creativeA.name || "")}
            </p>
            ${renderTestSlotMetrics(creativeA)}
          </div>

          <div class="testslot-card" data-slot="B" style="border-radius:16px;padding:12px;border:1px solid rgba(148,163,184,0.5);">
            <h3 style="font-size:0.9rem;margin:0 0 4px;">Creative B (Variante)</h3>
            <p style="font-size:0.8rem;margin:0 0 8px;color:#6b7280;">
              ${
                creativeB
                  ? escapeHtml(creativeB.name || "")
                  : "Keine zweite Variante automatisch gefunden."
              }
            </p>
            ${
              creativeB
                ? renderTestSlotMetrics(creativeB)
                : '<p style="font-size:0.8rem;color:#9ca3af;">Wähle im Grid eine weitere Variante aus und starte den Test-Slot erneut.</p>'
            }
          </div>
        </div>

        <div class="testslot-actions" style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:4px;">
          <button
            type="button"
            class="meta-button"
            data-role="testslot-autoeval"
            ${creativeB ? "" : "disabled"}
          >
            Automatisch Winner bestimmen
          </button>

          <div style="display:flex;gap:8px;align-items:center;">
            <button
              type="button"
              class="meta-button meta-button-primary"
              data-role="testslot-save"
              ${creativeB ? "" : "disabled"}
            >
              In Testing Log speichern
            </button>
            <button
              type="button"
              class="meta-button"
              data-role="testslot-open-log"
            >
              Testing Log öffnen
            </button>
          </div>
        </div>

        <p class="testslot-note" style="font-size:0.75rem;color:#9ca3af;margin-top:4px;">
          Hinweis: Der Test-Slot speichert nur eine kompakte Zusammenfassung im Testing Log.
          Die vollständigen Creatives bleiben in der Creative Library.
        </p>
      </div>
    ";

    openSystemModal("Test-Slot: Creative A vs. B", bodyHtml);

    const body = document.getElementById("modalBody");
    if (!body) return;

    const btnAuto = body.querySelector('[data-role="testslot-autoeval"]');
    const btnSave = body.querySelector('[data-role="testslot-save"]');
    const btnOpenLog = body.querySelector('[data-role="testslot-open-log"]');

    let lastDecision = null;

    if (btnAuto && creativeB) {
      btnAuto.addEventListener("click", () => {
        lastDecision = computeWinner(creativeA, creativeB);
        highlightWinner(lastDecision);
        showToast(lastDecision.reason, "info");
      });
    }

    if (btnSave && creativeB) {
      btnSave.addEventListener("click", () => {
        const decision = lastDecision || computeWinner(creativeA, creativeB);
        addEntry(creativeA, creativeB, {
          source: "testslot",
          autoWinner: decision.winner,
        });
      });
    }

    if (btnOpenLog) {
      btnOpenLog.addEventListener("click", () => {
        navigateTo("testingLog");
      });
    }

    function highlightWinner(decision) {
      const slotA = body.querySelector('[data-slot="A"]');
      const slotB = body.querySelector('[data-slot="B"]');
      if (!slotA || !slotB) return;

      slotA.style.boxShadow = "none";
      slotB.style.boxShadow = "none";
      slotA.style.borderColor = "rgba(148,163,184,0.7)";
      slotB.style.borderColor = "rgba(148,163,184,0.7)";

      if (decision.winner === "A") {
        slotA.style.boxShadow = "0 0 0 2px rgba(16,185,129,0.6)";
        slotA.style.borderColor = "rgba(16,185,129,0.8)";
      } else if (decision.winner === "B") {
        slotB.style.boxShadow = "0 0 0 2px rgba(16,185,129,0.6)";
        slotB.style.borderColor = "rgba(16,185,129,0.8)";
      }
    }
  }

  function renderTestSlotMetrics(c) {
    const m = c?.metrics || {};
    const roas = getMetric(c, "roas");
    const spend = getMetric(c, "spend");
    const ctr = getMetric(c, "ctr");
    const cpm = getMetric(c, "cpm");
    const purchases = getMetric(c, "purchases");

    return `
      <div class="creative-modal-kpis" style="margin-top:4px;">
        <div>
          <span class="creative-kpi-label">ROAS</span>
          <span class="creative-kpi-value">${roas ? `${roas.toFixed(1)}x` : "–"}</span>
        </div>
        <div>
          <span class="creative-kpi-label">Spend</span>
          <span class="creative-kpi-value">${formatCurrency(spend)}</span>
        </div>
        <div>
          <span class="creative-kpi-label">CTR</span>
          <span class="creative-kpi-value">${
            ctr ? `${(ctr * 100).toFixed(1)}%` : "–"
          }</span>
        </div>
        <div>
          <span class="creative-kpi-label">CPM</span>
          <span class="creative-kpi-value">${formatCurrency(cpm)}</span>
        </div>
        <div>
          <span class="creative-kpi-label">Purchases</span>
          <span class="creative-kpi-value">${
            purchases ? purchases : "–"
          }</span>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    if (str == null) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return {
    entries,
    addEntry,
    computeWinner,
    openTestSlot,
  };
})();

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
  TestingLog,
  Sensei: SenseiEngine,
  formatCurrency,
};
