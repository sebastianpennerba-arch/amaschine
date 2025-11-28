// Simple global app state
const appState = {
  currentView: "dashboardView",
  demoMode: true,
  metaConnected: false,
  selectedAccount: "demo-small",
  timeRange: "30d",
  notifications: 0,
  tests: [],
};

// --- Demo data -------------------------------------------------------------

const demoKpiByRange = {
  "7d": {
    spend: 950,
    revenue: 3450,
    roas: 3.63,
    impressions: 89000,
    clicks: 2200,
  },
  "30d": {
    spend: 2450,
    revenue: 8500,
    roas: 2.69,
    impressions: 350000,
    clicks: 9200,
  },
  mtd: {
    spend: 1800,
    revenue: 6300,
    roas: 3.5,
    impressions: 270000,
    clicks: 7200,
  },
  prev_month: {
    spend: 2100,
    revenue: 7300,
    roas: 3.2,
    impressions: 290000,
    clicks: 8100,
  },
};

const demoCampaigns = [
  {
    id: "camp_ugc_scale",
    name: "UGC Scale Test",
    objective: "Sales",
    dailyBudget: 680,
    spend: 18420,
    roas: 5.8,
    ctr: 3.9,
    impressions: 210000,
    status: "active",
    sensei: "+50% Budget empfohlen",
  },
  {
    id: "camp_brand_static",
    name: "Brand Awareness Static",
    objective: "Awareness",
    dailyBudget: 420,
    spend: 12890,
    roas: 2.1,
    ctr: 1.4,
    impressions: 180000,
    status: "active",
    sensei: "-30% Budget, auf UGC umstellen",
  },
  {
    id: "camp_ret_cold",
    name: "Retargeting Cold",
    objective: "Sales",
    dailyBudget: 260,
    spend: 8340,
    roas: 1.3,
    ctr: 0.9,
    impressions: 99000,
    status: "paused",
    sensei: "9 Loser pausieren, 6 Winner behalten",
  },
  {
    id: "camp_hook_battle",
    name: "Testing: Hook Battle",
    objective: "Test",
    dailyBudget: 150,
    spend: 2100,
    roas: 4.2,
    ctr: 3.1,
    impressions: 46000,
    status: "active",
    sensei: "Ergebnis in 24h auswerten",
  },
];

const demoCreatives = [
  {
    id: "cr_mia_v3",
    name: "Mia_Hook_Problem_Solution_v3",
    format: "video",
    status: "winner",
    roas: 6.8,
    ctr: 4.1,
    spend: 12340,
    creator: "Mia",
    tags: ["#Winner", "#UGC", "#Problem/Solution"],
  },
  {
    id: "cr_tom_v1",
    name: "Tom_Testimonial_ShortForm_v1",
    format: "video",
    status: "winner",
    roas: 5.9,
    ctr: 3.8,
    spend: 8400,
    creator: "Tom",
    tags: ["#Winner", "#UGC", "#Testimonial"],
  },
  {
    id: "cr_lisa_v2",
    name: "Lisa_BeforeAfter_Showcase_v2",
    format: "video",
    status: "winner",
    roas: 5.2,
    ctr: 3.5,
    spend: 6100,
    creator: "Lisa",
    tags: ["#Testing", "#Before/After"],
  },
  {
    id: "cr_generic_static",
    name: "Generic_Product_Static_v12",
    format: "static",
    status: "loser",
    roas: 1.2,
    ctr: 0.9,
    spend: 3200,
    creator: "Stock",
    tags: ["#Loser", "#Static"],
  },
];

// --- Helpers ---------------------------------------------------------------

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function formatCurrency(amount) {
  const rounded = Math.round(amount * 100) / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rounded);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE").format(Math.round(value));
}

// --- Data Gatekeeper -------------------------------------------------------

function hasDataSource() {
  return appState.demoMode || appState.metaConnected;
}

// --- Toasts ----------------------------------------------------------------

function showToast(message, type = "info") {
  const container = qs("#toastContainer");
  if (!container) return;

  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = message;

  if (type === "success") {
    el.style.background = "#16a34a";
  } else if (type === "warning") {
    el.style.background = "#f59e0b";
  } else if (type === "error") {
    el.style.background = "#dc2626";
  }

  container.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 3200);
}

// --- Modal -----------------------------------------------------------------

function openModal(title, html) {
  const overlay = qs("#modalOverlay");
  qs("#modalTitle").textContent = title;
  qs("#modalBody").innerHTML = html;
  overlay.classList.remove("hidden");
}

function closeModal() {
  qs("#modalOverlay").classList.add("hidden");
}

// --- View handling ---------------------------------------------------------

function switchView(viewId) {
  appState.currentView = viewId;

  qsa(".view").forEach((v) => {
    if (v.id === viewId) {
      v.classList.add("is-active");
    } else {
      v.classList.remove("is-active");
    }
  });

  qsa(".sidebar-item").forEach((btn) => {
    const target = btn.getAttribute("data-view");
    if (!target) return;
    if (target === viewId) {
      btn.classList.add("is-active");
    } else {
      btn.classList.remove("is-active");
    }
  });

  renderCurrentView();
}

// --- Rendering -------------------------------------------------------------

function renderTopbar() {
  // datetime
  const now = new Date();
  const formatted = now.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  qs("#topbarDateTime").textContent = formatted;

  // demo toggle labels
  qs("#demoModeLabel").textContent = appState.demoMode ? "Aktiv" : "Aus";
  const settingsToggle = qs("#settingsDemoToggle");
  if (settingsToggle) {
    settingsToggle.checked = appState.demoMode;
  }

  // meta status
  const metaPill = qs("#metaStatusPill");
  const indicator = metaPill.querySelector(".status-indicator");
  const labelSpan = metaPill.querySelector("span:nth-child(2)");
  const metaConnectLabel = qs("#metaConnectLabel");

  if (appState.metaConnected) {
    indicator.className = "status-indicator status-indicator-ok";
    labelSpan.textContent = "Meta Ads (Live)";
    metaConnectLabel.textContent = "Meta verbunden";
  } else {
    indicator.className = "status-indicator status-indicator-offline";
    labelSpan.textContent = appState.demoMode
      ? "Meta Ads (Demo Modus)"
      : "Meta Ads (Offline)";
    metaConnectLabel.textContent = "Mit Meta verbinden";
  }

  // campaign health simple heuristic
  const campaignHealthPill = qs("#campaignHealthPill");
  const campIndicator = campaignHealthPill.querySelector(".status-indicator");
  const campLabel = campaignHealthPill.querySelector("span:nth-child(2)");

  if (!hasDataSource()) {
    campIndicator.className = "status-indicator status-indicator-na";
    campLabel.textContent = "Campaign Health (n/a)";
  } else {
    const avgRoas =
      demoCampaigns.reduce((sum, c) => sum + c.roas, 0) / demoCampaigns.length;
    if (avgRoas >= 3) {
      campIndicator.className = "status-indicator status-indicator-ok";
      campLabel.textContent = "Campaign Health (stabil)";
    } else {
      campIndicator.className = "status-indicator status-indicator-offline";
      campLabel.textContent = "Campaign Health (Risiko)";
    }
  }

  // notifications
  qs("#notificationCount").textContent = appState.notifications.toString();
}

function renderDashboard() {
  const noDataEl = qs("#dashboardNoData");
  const contentEl = qs("#dashboardContent");
  const subtitleEl = qs("#dashboardSubtitle");

  if (!hasDataSource()) {
    noDataEl.classList.remove("hidden");
    contentEl.classList.add("hidden");
    subtitleEl.textContent =
      "Keine Datenquelle aktiv. Demo Mode: AUS · Meta: nicht verbunden.";
    return;
  }

  noDataEl.classList.add("hidden");
  contentEl.classList.remove("hidden");

  subtitleEl.textContent = appState.demoMode
    ? "Demo Modus aktiv – Daten werden simuliert."
    : "Live-Daten über Meta Marketing API.";

  const kpiKey = appState.timeRange;
  const kpi = demoKpiByRange[kpiKey] || demoKpiByRange["30d"];

  qs("#kpiSpend").textContent = formatCurrency(kpi.spend);
  qs("#kpiRevenue").textContent = formatCurrency(kpi.revenue);
  qs("#kpiRoas").textContent = kpi.roas.toFixed(2) + "x";
  qs("#kpiImpressions").textContent = formatNumber(kpi.impressions) + "k";
  qs("#kpiClicksMeta").textContent = "Clicks: " + formatNumber(kpi.clicks / 1000) + "k";

  // Spend distribution
  const container = qs("#spendBars");
  container.innerHTML = "";
  const totalSpend = demoCampaigns.reduce((sum, c) => sum + c.spend, 0);

  demoCampaigns.forEach((c) => {
    const row = document.createElement("div");
    row.className = "spend-row";

    const label = document.createElement("div");
    label.className = "spend-row-label";
    label.textContent = c.name;

    const value = document.createElement("div");
    value.className = "spend-row-value";
    value.textContent = formatCurrency(c.spend);

    const barWrap = document.createElement("div");
    barWrap.className = "spend-row-bar-wrap";

    const bar = document.createElement("div");
    bar.className = "spend-row-bar";
    const pct = totalSpend ? (c.spend / totalSpend) * 100 : 0;
    bar.style.width = pct.toFixed(1) + "%";

    barWrap.appendChild(bar);
    row.append(label, value, barWrap);
    container.appendChild(row);
  });

  // Sensei briefing
  const s = demoKpiByRange["30d"];
  const briefingLines = [
    `Deine Ergebnisse sind stabil, aber du verschenkst Potenzial.`,
    `Fokus: Kampagnen „UGC Scale Test“ und „Testing: Hook Battle“.`,
    `Empfehlung: Budget von „Brand Awareness Static“ (ROAS 2.1x) Richtung UGC-Kampagnen verschieben.`,
    `Dieses Briefing basiert auf aggregierten Kampagnen-Insights der letzten ${
      appState.timeRange === "7d" ? "7 Tage" : "30 Tage"
    }.`,
  ];
  const senseiText = qs("#senseiBriefingText");
  senseiText.innerHTML = briefingLines.map((l) => `<p>${l}</p>`).join("");
}

function renderCreativeLibrary() {
  const noDataEl = qs("#creativeLibraryNoData");
  const container = qs("#creativeLibraryContent");

  if (!hasDataSource()) {
    noDataEl.classList.add("hidden");
    container.innerHTML = "";
    noDataEl.classList.remove("hidden");
    return;
  }

  noDataEl.classList.add("hidden");

  const searchValue = qs("#creativeSearchInput").value.trim().toLowerCase();
  const formatFilter = qs("#creativeFormatFilter").value;
  const sortValue = qs("#creativeSortSelect").value;

  let list = [...demoCreatives];

  if (formatFilter !== "all") {
    list = list.filter((c) => c.format === formatFilter);
  }

  if (searchValue) {
    list = list.filter((c) =>
      c.name.toLowerCase().includes(searchValue) ||
      c.creator.toLowerCase().includes(searchValue)
    );
  }

  list.sort((a, b) => {
    if (sortValue === "roas_desc") return b.roas - a.roas;
    if (sortValue === "spend_desc") return b.spend - a.spend;
    if (sortValue === "spend_asc") return a.spend - b.spend;
    return 0;
  });

  container.innerHTML = "";

  list.forEach((c) => {
    const card = document.createElement("article");
    card.className = "creative-card";
    card.setAttribute("data-id", c.id);

    card.innerHTML = `
      <div class="creative-thumb"></div>
      <div class="creative-name">${c.name}</div>
      <div class="creative-meta-row">
        <span>${c.format.toUpperCase()}</span>
        <span>ROAS ${c.roas.toFixed(1)}x</span>
      </div>
      <div class="creative-meta-row">
        <span>CTR ${c.ctr.toFixed(1)}%</span>
        <span>${formatCurrency(c.spend)}</span>
      </div>
      <div class="creative-tags">
        ${c.tags.map((t) => `<span class="tag-pill">${t}</span>`).join("")}
      </div>
    `;

    card.addEventListener("click", () => {
      openCreativeModal(c);
    });

    container.appendChild(card);
  });
}

function openCreativeModal(creative) {
  const html = `
    <p><strong>Format:</strong> ${creative.format.toUpperCase()}</p>
    <p><strong>Creator:</strong> ${creative.creator}</p>
    <p><strong>ROAS:</strong> ${creative.roas.toFixed(1)}x</p>
    <p><strong>CTR:</strong> ${creative.ctr.toFixed(1)}%</p>
    <p><strong>Spend:</strong> ${formatCurrency(creative.spend)}</p>
    <p style="margin-top:8px;">
      🧠 <strong>Sensei Insight:</strong><br/>
      Dieses Creative gehört zu deinen Top-Performern. Produziere 2–3 Varianten mit ähnlichem Hook-Aufbau.
    </p>
  `;
  openModal(creative.name, html);
}

function renderCampaigns() {
  const noDataEl = qs("#campaignsNoData");
  const tbody = qs("#campaignsTableBody");

  if (!hasDataSource()) {
    noDataEl.classList.remove("hidden");
    tbody.innerHTML = "";
    return;
  }

  noDataEl.classList.add("hidden");

  const statusFilter = qs("#campaignStatusFilter").value;
  let list = [...demoCampaigns];

  if (statusFilter !== "all") {
    list = list.filter((c) => c.status === statusFilter);
  }

  tbody.innerHTML = "";

  list.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <span class="status-chip ${
          c.status === "active"
            ? "status-live"
            : c.status === "paused"
            ? "status-geplant"
            : "status-done"
        }">
          ${c.status === "active" ? "Running" : c.status === "paused" ? "Paused" : "Deleted"}
        </span>
      </td>
      <td>${c.name}</td>
      <td>${c.objective}</td>
      <td>${formatCurrency(c.dailyBudget)}</td>
      <td>${formatCurrency(c.spend)}</td>
      <td>${c.roas.toFixed(1)}x</td>
      <td>${c.ctr.toFixed(1)}%</td>
      <td>${formatNumber(c.impressions / 1000)}k</td>
      <td>${c.sensei}</td>
    `;

    tr.addEventListener("click", () => openCampaignModal(c));
    tbody.appendChild(tr);
  });
}

function openCampaignModal(c) {
  const html = `
    <p><strong>Objective:</strong> ${c.objective}</p>
    <p><strong>Spend:</strong> ${formatCurrency(c.spend)}</p>
    <p><strong>ROAS:</strong> ${c.roas.toFixed(1)}x</p>
    <p><strong>CTR:</strong> ${c.ctr.toFixed(1)}%</p>
    <p><strong>Impressions:</strong> ${formatNumber(c.impressions)}</p>
    <p style="margin-top:8px;"><strong>Sensei Empfehlung:</strong> ${c.sensei}</p>
  `;
  openModal(c.name, html);
}

function renderSensei() {
  const noDataEl = qs("#senseiNoData");
  const container = qs("#senseiContent");

  if (!hasDataSource()) {
    noDataEl.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }

  noDataEl.classList.add("hidden");

  container.innerHTML = "";

  const cards = [
    {
      title: "Budget Leak detected",
      body: 'Kampagne "Brand Awareness Static" verbrennt Budget. Reduziere um 30% und verlagere auf UGC-Kampagnen.',
    },
    {
      title: "Scaling Opportunity",
      body: 'Kampagne "UGC Scale Test" ist Top-Performer. Erhöhe Budget um 50% für die nächsten 7 Tage.',
    },
    {
      title: "Creative Fatigue",
      body: "15 Creatives laufen >21 Tage. Plane Refresh-Varianten mit gleichen Hooks, aber neuen Visuals.",
    },
    {
      title: "Testing Decision",
      body: '"Hook Battle" Test ist entscheidungsreif. Winner: Problem/Solution (+35% ROAS). Skalieren empfohlen.',
    },
  ];

  cards.forEach((card) => {
    const el = document.createElement("article");
    el.className = "sensei-card";
    el.innerHTML = `
      <div class="sensei-card-title">${card.title}</div>
      <div class="sensei-card-body">${card.body}</div>
    `;
    container.appendChild(el);
  });
}

function renderReports() {
  // nothing dynamic until user clicks buttons
}

function renderTestingLog() {
  const tbody = qs("#testingLogTableBody");
  tbody.innerHTML = "";

  if (!appState.tests.length) {
    // seed with a few demo tests
    appState.tests = [
      {
        id: 47,
        name: "Hook Battle – Problem vs. Testimonial",
        hyp: "Problem/Solution Hooks performen besser als Testimonials.",
        kpi: "ROAS",
        status: "live",
      },
      {
        id: 46,
        name: "Creator Battle – Mia vs. Sarah",
        hyp: "Authentische UGC Creator schlagen Influencer.",
        kpi: "ROAS",
        status: "done",
      },
    ];
  }

  appState.tests.forEach((t) => {
    const tr = document.createElement("tr");
    const statusClass =
      t.status === "planned"
        ? "status-geplant"
        : t.status === "live"
        ? "status-live"
        : "status-done";

    const statusLabel =
      t.status === "planned" ? "Geplant" : t.status === "live" ? "Laufend" : "Abgeschlossen";

    tr.innerHTML = `
      <td>#${t.id}</td>
      <td>${t.name}</td>
      <td>${t.hyp}</td>
      <td>${t.kpi}</td>
      <td><span class="status-chip ${statusClass}">${statusLabel}</span></td>
    `;

    tbody.appendChild(tr);
  });
}

function renderSettings() {
  // settings toggle is handled in renderTopbar()
}

function renderCurrentView() {
  renderTopbar();

  switch (appState.currentView) {
    case "dashboardView":
      renderDashboard();
      break;
    case "creativeLibraryView":
      renderCreativeLibrary();
      break;
    case "campaignsView":
      renderCampaigns();
      break;
    case "senseiView":
      renderSensei();
      break;
    case "reportsView":
      renderReports();
      break;
    case "testingLogView":
      renderTestingLog();
      break;
    case "settingsView":
      renderSettings();
      break;
    default:
      break;
  }
}

// --- Meta Connect Simulation ----------------------------------------------

function handleMetaConnectClick() {
  if (appState.metaConnected) {
    showToast("Meta-Verbindung bereits aktiv (Demo Simulation).", "info");
    return;
  }

  // Simple mock: instant connect in Phase 1
  appState.metaConnected = true;
  appState.demoMode = false;
  appState.notifications += 1;

  showToast("Meta-Demo-Verbindung hergestellt. Live-Modus vorbereitet.", "success");
  renderCurrentView();
}

// --- Reports Export -------------------------------------------------------

function createSnapshot(scope) {
  const base = {
    account: appState.selectedAccount,
    timeRange: appState.timeRange,
    demoMode: appState.demoMode,
    metaConnected: appState.metaConnected,
  };

  if (scope === "account") {
    return {
      ...base,
      kpi: demoKpiByRange[appState.timeRange] || demoKpiByRange["30d"],
    };
  }

  if (scope === "campaigns") {
    return {
      ...base,
      campaigns: demoCampaigns,
    };
  }

  if (scope === "creatives") {
    return {
      ...base,
      creatives: demoCreatives,
    };
  }

  return base;
}

function handleExportClick(scope) {
  if (!hasDataSource()) {
    showToast("Keine Datenquelle aktiv. Demo oder Meta verbinden.", "warning");
    return;
  }

  const snapshot = createSnapshot(scope);
  const preview = qs("#reportsPreview");
  preview.textContent = JSON.stringify(snapshot, null, 2);

  showToast("JSON Snapshot im Preview angezeigt.", "success");
}

// --- Testing Log Modal ----------------------------------------------------

function handleAddTest() {
  const id = appState.tests.length ? appState.tests[appState.tests.length - 1].id + 1 : 1;
  const name = prompt("Testname:");
  if (!name) return;
  const hyp = prompt("Hypothese:");
  if (!hyp) return;

  appState.tests.push({
    id,
    name,
    hyp,
    kpi: "ROAS",
    status: "planned",
  });

  showToast("Test hinzugefügt.", "success");
  renderTestingLog();
}

// --- Event wiring ---------------------------------------------------------

function wireSidebarNavigation() {
  qsa(".sidebar-item").forEach((btn) => {
    const viewId = btn.getAttribute("data-view");
    if (!viewId) return;
    btn.addEventListener("click", () => switchView(viewId));
  });
}

function wireTopbarControls() {
  qs("#demoModeToggle").addEventListener("click", () => {
    appState.demoMode = !appState.demoMode;
    if (!appState.demoMode && !appState.metaConnected) {
      showToast("Demo deaktiviert. Bitte Meta verbinden, um Daten zu sehen.", "warning");
    }
    renderCurrentView();
  });

  qs("#metaConnectButton").addEventListener("click", handleMetaConnectClick);

  qs("#accountSelect").addEventListener("change", (e) => {
    appState.selectedAccount = e.target.value;
    showToast("Account gewechselt (Demo).", "info");
    renderCurrentView();
  });

  const mainTime = qs("#timeRangeSelect");
  const dashTime = qs("#dashboardTimeRangeSelect");

  mainTime.addEventListener("change", (e) => {
    appState.timeRange = e.target.value;
    dashTime.value = appState.timeRange;
    renderCurrentView();
  });

  dashTime.addEventListener("change", (e) => {
    appState.timeRange = e.target.value;
    mainTime.value = appState.timeRange;
    renderCurrentView();
  });

  qs("#notificationButton").addEventListener("click", () => {
    showToast("Keine neuen Benachrichtigungen.", "info");
  });

  qs("#profileButton").addEventListener("click", () => {
    openModal(
      "Profil",
      `<p><strong>Name:</strong> Sebastian</p>
       <p><strong>Rolle:</strong> Owner</p>
       <p><strong>Demo-Modus:</strong> ${
         appState.demoMode ? "Aktiv" : "Inaktiv"
       }</p>`
    );
  });
}

function wireDashboardEmptyActions() {
  qs("#emptyEnableDemo").addEventListener("click", () => {
    appState.demoMode = true;
    showToast("Demo Mode aktiviert.", "success");
    renderCurrentView();
  });

  qs("#emptyConnectMeta").addEventListener("click", () => {
    handleMetaConnectClick();
  });
}

function wireCreativeLibraryControls() {
  const fields = [
    "#creativeSearchInput",
    "#creativeFormatFilter",
    "#creativeSortSelect",
  ];
  fields.forEach((sel) => {
    const el = qs(sel);
    if (el) {
      el.addEventListener("input", renderCreativeLibrary);
      el.addEventListener("change", renderCreativeLibrary);
    }
  });
}

function wireCampaignControls() {
  qs("#campaignStatusFilter").addEventListener("change", renderCampaigns);
}

function wireReportsControls() {
  qsa("[data-export]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scope = btn.getAttribute("data-export");
      handleExportClick(scope);
    });
  });
}

function wireTestingLogControls() {
  qs("#addTestButton").addEventListener("click", handleAddTest);
}

function wireSettingsControls() {
  qs("#settingsDemoToggle").addEventListener("change", (e) => {
    appState.demoMode = e.target.checked;
    renderCurrentView();
  });
}

function wireModal() {
  qs("#modalCloseButton").addEventListener("click", closeModal);
  qs("#modalCancelButton").addEventListener("click", closeModal);
  qs("#modalOverlay").addEventListener("click", (e) => {
    if (e.target.id === "modalOverlay") {
      closeModal();
    }
  });
}

// --- Init ------------------------------------------------------------------

function init() {
  // Initial range sync
  qs("#timeRangeSelect").value = appState.timeRange;
  qs("#dashboardTimeRangeSelect").value = appState.timeRange;

  wireSidebarNavigation();
  wireTopbarControls();
  wireDashboardEmptyActions();
  wireCreativeLibraryControls();
  wireCampaignControls();
  wireReportsControls();
  wireTestingLogControls();
  wireSettingsControls();
  wireModal();

  renderCurrentView();
}

document.addEventListener("DOMContentLoaded", init);
