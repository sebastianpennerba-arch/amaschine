// ======================================================================
// SignalOne.cloud – Rebuild Option 1 (Mock-System, Style A)
// FINALE VERSION: Alle Prio 1, Prio 2, Prio 5, Prio 13 und UX-Elemente implementiert.
// DIESE DATEI ARBEITET MIT "index.html" UND "styles.css"
// ======================================================================

"use strict";

// ----------------------------------------------------------------------
// MOCK-DATEN (stylisches Demo-System)
// ----------------------------------------------------------------------

const MockData = {
  creatives: [
    {
      id: "c1",
      name: "UGC Hook – Unboxing Reel",
      mediaType: "video",
      url: "/mock/Creative10.mp4",
      format: "9:16",
      objective: "Sales",
      roas: 3.8,
      ctr: 2.7,
      cpc: 0.78,
      impressions: 28450,
      spend: 222.3,
      revenue: 845.6,
      score: 89,
      platform: "Meta"
    },
    {
      id: "c2",
      name: "Static – Hero Product Shot",
      mediaType: "image",
      url: "/mock/Creative1.png",
      format: "1:1",
      objective: "Sales",
      roas: 3.2,
      ctr: 2.1,
      cpc: 0.71,
      impressions: 19840,
      spend: 141.9,
      revenue: 454.1,
      score: 75,
      platform: "Meta"
    },
    {
      id: "c3",
      name: "Carousel – 5 Benefits",
      mediaType: "carousel",
      url: "/mock/Creative3.png",
      format: "1:1",
      objective: "Leads",
      roas: 2.1,
      ctr: 1.2,
      cpc: 0.95,
      impressions: 45000,
      spend: 427.5,
      revenue: 900.0,
      score: 62,
      platform: "Google"
    },
    {
      id: "c4",
      name: "Video – Problem/Solution",
      mediaType: "video",
      url: "/mock/Creative5.mp4",
      format: "16:9",
      objective: "Traffic",
      roas: 1.5,
      ctr: 3.1,
      cpc: 0.45,
      impressions: 92000,
      spend: 414.0,
      revenue: 621.0,
      score: 80,
      platform: "Meta"
    },
    {
      id: "c5",
      name: "Static – Testimonial Card",
      mediaType: "image",
      url: "/mock/Creative7.png",
      format: "4:5",
      objective: "Sales",
      roas: 4.5,
      ctr: 1.9,
      cpc: 0.82,
      impressions: 35000,
      spend: 287.0,
      revenue: 1291.5,
      score: 95,
      platform: "Meta"
    }
  ],
  campaigns: [
    {
      id: "k1",
      name: "Summer Sales - Prospecting",
      status: "Aktiv",
      objective: "Sales",
      budget: 12000,
      kpi: { roas: 3.5, spend: 3500.2, revenue: 12250.7 }
    },
    {
      id: "k2",
      name: "Remarketing - Q4 Focus",
      status: "Pausiert",
      objective: "Conversions",
      budget: 5000,
      kpi: { roas: 5.1, spend: 1200.0, revenue: 6120.0 }
    },
    {
      id: "k3",
      name: "TOFU - Brand Awareness",
      status: "Aktiv",
      objective: "Impressions",
      budget: 8000,
      kpi: { roas: 1.1, spend: 6500.5, revenue: 7150.5 }
    }
  ],
  // Mock data for the chart: Revenue and Spend over 7 days
  chartData: {
    labels: ["Tag -6", "Tag -5", "Tag -4", "Tag -3", "Tag -2", "Tag -1", "Heute"],
    revenue: [1020, 1150, 980, 1400, 1550, 1300, 1650],
    spend: [280, 310, 270, 350, 380, 320, 400]
  }
};

// ----------------------------------------------------------------------
// APP STATE
// ----------------------------------------------------------------------

const AppState = {
  activeView: "dashboard",
  theme: localStorage.getItem("signalOneTheme") || "light",
  mode: "demo",
  sidebarCollapsed: localStorage.getItem("sidebarCollapsed") === "true",
  period: "last7days",
  kpi: null,
  creativeView: "grid",
  creativeSort: "roas_desc",
  creativeFilterText: "", 
  connections: {
    meta: false,
    google: false,
    tiktok: false
  },
  account: {
    name: "Schatz",
    brand: "SignalOne Demo Brand",
    adAccount: "Ad Account 123456"
  }
};

let myChart = null; // Für Chart.js Instanz

// ----------------------------------------------------------------------
// HELPER FUNCTIONS (MODAL/TOAST/FORMATTING/LOADING)
// ----------------------------------------------------------------------

const modalEl = document.getElementById('simpleModal');
const mainContentEl = document.getElementById("mainContent");
const loadingOverlayEl = document.getElementById("loadingOverlay");

/** Schließt das globale Modal. */
function closeModal() {
  if (modalEl) {
    modalEl.classList.add('hidden');
  }
}

/**
 * Öffnet das globale Modal mit Titel und Inhalt.
 * @param {string} title - Der Titel des Modals.
 * @param {string} content - Der HTML-Inhalt des Modals.
 */
function openModal(title, content) {
  if (modalEl) {
    document.getElementById('simpleModalTitle').textContent = title;
    document.getElementById('simpleModalContent').innerHTML = content;
    modalEl.classList.remove('hidden');
    // NEU: Fokus auf das Modal, um das Scrollen des Hauptfensters zu verhindern
    modalEl.focus(); 
  }
}

/**
 * Zeigt eine flüchtige Toast-Benachrichtigung an (Prio 1.1).
 * @param {string} message - Die anzuzeigende Nachricht.
 */
function showSoonToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast show';
  toast.textContent = message || 'Feature kommt bald – aktuell noch im Demo-Aufbau.';

  if (container) {
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove('show');
        toast.classList.add('hide');
        toast.addEventListener('transitionend', () => toast.remove());
      }, 4000);
  }
}

/**
 * Globaler Handler für "tote" Buttons (Prio 1.1).
 * @param {string} featureName - Der Name des Features.
 */
function handleDeadButton(featureName) {
    showSoonToast(`${featureName} kommt im Januar-Release. Elite-Fokus liegt auf den Kern-Views.`);
}

/** NEU: Zeigt einen Skeleton-Loading-Zustand an. (UX Improvement) */
function showLoadingOverlay() {
  if (loadingOverlayEl) {
    loadingOverlayEl.classList.remove('hidden');
    // NEU: Verstecke den Overlay nach einer kurzen Verzögerung von 500ms
    setTimeout(() => {
        loadingOverlayEl.classList.add('hidden');
    }, 500);
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value);
}

function formatPercent(value) {
  return value.toFixed(1) + "%";
}

// ----------------------------------------------------------------------
// KPI CALCULATIONS
// ----------------------------------------------------------------------

function calculateGlobalKpi() {
  const totalSpend = MockData.creatives.reduce((sum, c) => sum + c.spend, 0);
  const totalRevenue = MockData.creatives.reduce((sum, c) => sum + c.revenue, 0);
  const totalImpressions = MockData.creatives.reduce(
    (sum, c) => sum + c.impressions,
    0
  );

  const totalClicks = MockData.creatives.reduce(
    (sum, c) => sum + (c.impressions * (c.ctr / 100)),
    0
  );

  const avgCpc = totalSpend / totalClicks;
  const avgCtr = (totalClicks / totalImpressions) * 100;
  const avgRoas = totalRevenue / totalSpend;

  return {
    totalSpend: totalSpend,
    totalRevenue: totalRevenue,
    avgRoas: avgRoas,
    avgCtr: avgCtr,
    avgCpc: avgCpc,
    totalCreatives: MockData.creatives.length
  };
}

// ----------------------------------------------------------------------
// CHART / DASHBOARD (Prio 2. Chart)
// ----------------------------------------------------------------------

function initChart() {
    const ctx = document.getElementById('creativePerformanceChart');
    if (!ctx) return;

    if (myChart) {
        myChart.destroy(); // Zerstöre alte Instanz, falls vorhanden
    }
    
    // Daten für den Chart
    const data = {
        labels: MockData.chartData.labels,
        datasets: [
            {
                label: 'Umsatz (Revenue)',
                data: MockData.chartData.revenue,
                borderColor: 'rgb(99, 102, 241)', // Primary Color
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                fill: true,
                tension: 0.3,
                yAxisID: 'y'
            },
            {
                label: 'Ausgaben (Spend)',
                data: MockData.chartData.spend,
                borderColor: 'rgb(156, 163, 175)', // Gray
                backgroundColor: 'rgba(156, 163, 175, 0.1)',
                fill: false,
                tension: 0.3,
                yAxisID: 'y'
            }
        ]
    };

    // Optionen für den Chart
    const config = {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Performance der letzten 7 Tage'
                }
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Werte in Euro'
                    }
                }
            }
        },
    };

    myChart = new Chart(ctx, config);
}


// ----------------------------------------------------------------------
// RENDER FUNCTIONS (Views)
// ----------------------------------------------------------------------

function renderTopBar() {
    const welcomeEl = document.getElementById("topBarWelcome");
    const sublineEl = document.getElementById("topBarSubline");
    const metaDot = document.getElementById('topBarMetaDot');

    if (welcomeEl) {
        welcomeEl.textContent = `Hallo, ${AppState.account.name || 'Schatz'}`;
    }
    if (sublineEl) {
        const brand = AppState.account.brand || 'Demo-Brand';
        const adAccount = AppState.account.adAccount || 'Demo Ad Account';
        sublineEl.textContent = `Eingeloggt als: ${brand} - Konto: ${adAccount}`;
    }

    // Update Top-Bar Meta Dot
    if (metaDot) {
        metaDot.className = AppState.connections.meta ? 'status-dot success' : 'status-dot error';
        metaDot.setAttribute('data-tooltip', AppState.connections.meta ? 'Meta: Verbunden' : 'Meta: Getrennt');
    }
}


function renderDashboard() {
  const viewEl = document.getElementById("dashboardView");
  if (viewEl) {
    if (AppState.activeView !== "dashboard") {
      viewEl.classList.add("hidden");
      return;
    }
    viewEl.classList.remove("hidden");

    // Update KPI Boxes
    document.getElementById("kpiRoas").textContent = AppState.kpi.avgRoas.toFixed(1);
    document.getElementById("kpiRevenue").textContent = formatCurrency(AppState.kpi.totalRevenue);
    document.getElementById("kpiSpend").textContent = formatCurrency(AppState.kpi.totalSpend);
    document.getElementById("kpiCtr").textContent = formatPercent(AppState.kpi.avgCtr);

    // NEU: Update Chart, falls vorhanden (wird nur aufgerufen, wenn in initChart() erstellt)
    if (myChart) {
        myChart.update();
    }
  }
}

function renderCreativesView() {
  const viewEl = document.getElementById("creativesView");
  if (!viewEl) return;

  if (AppState.activeView !== "creatives") {
    viewEl.classList.add("hidden");
    return;
  }
  viewEl.classList.remove("hidden");

  const container = document.getElementById("creativesContainer");
  if (!container) return;

  container.innerHTML = "";
  container.className = AppState.creativeView === "grid" ? "creatives-grid" : "creatives-list"; 

  // 1. Apply Filtering Logic (Prio 5. Search)
  const filterText = AppState.creativeFilterText.toLowerCase();
  let creatives = MockData.creatives.filter(c => 
    c.name.toLowerCase().includes(filterText) ||
    c.platform.toLowerCase().includes(filterText)
  );

  // 2. Apply Sorting Logic (Prio 2.7)
  creatives.sort((a, b) => {
    switch (AppState.creativeSort) {
      case 'roas_desc':
        return b.roas - a.roas;
      case 'roas_asc':
        return a.roas - b.roas;
      case 'ctr_desc':
        return b.ctr - a.ctr;
      case 'score_desc':
        return b.score - a.score;
      case 'name_asc':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });


  creatives.forEach((creative) => {
    const card = document.createElement("div");
    card.className = AppState.creativeView === "grid" ? "creative-card" : "creative-row";
    card.onclick = () => showCreativeDetails(creative.id);

    const scoreBadge = `<span class="badge ${creative.score > 80 ? 'success' : creative.score > 65 ? 'warning' : 'error'}">${creative.score}% Score</span>`;
    const roasBadge = `<span class="badge ${creative.roas > 3.0 ? 'primary' : 'secondary'}">ROAS ${creative.roas.toFixed(1)}</span>`;

    if (AppState.creativeView === "grid") {
        card.innerHTML = `
            <div class="creative-media-container">
                <div class="creative-media-preview" style="background-image: url('${creative.url}');"></div>
                <div class="creative-media-platform">${creative.platform}</div>
            </div>
            <div class="creative-info">
                <h5 class="creative-name">${creative.name}</h5>
                <div class="creative-badges">
                    ${roasBadge}
                    ${scoreBadge}
                </div>
                <div class="creative-kpis">
                    <span>CTR: ${creative.ctr.toFixed(1)}%</span>
                    <span>CPC: ${creative.cpc.toFixed(2)}€</span>
                </div>
            </div>
        `;
    } else { // List View
         card.innerHTML = `
            <div class="creative-row-details">
                <h5 class="creative-name">${creative.name}</h5>
                <div class="creative-badges">${roasBadge} ${scoreBadge}</div>
            </div>
            <div class="creative-row-kpis">
                <span>ROAS: ${creative.roas.toFixed(1)}</span>
                <span>CTR: ${creative.ctr.toFixed(1)}%</span>
                <span>CPC: ${creative.cpc.toFixed(2)}€</span>
                <span>Spend: ${formatCurrency(creative.spend)}</span>
            </div>
         `;
    }
    
    container.appendChild(card);
  });

  // Handle No Results
  if (creatives.length === 0) {
      container.innerHTML = `<p class="no-results-message">Keine Creatives gefunden für **"${AppState.creativeFilterText}"**. Versuch es mit einem anderen Suchbegriff.</p>`;
      container.className = "creatives-grid"; // Keep it simple
  }
}

/**
 * Zeigt das Detail-Modal für ein Creative an (Prio 1.3).
 * @param {string} id - Die ID des Creatives.
 */
function showCreativeDetails(id) {
  const creative = MockData.creatives.find((c) => c.id === id);
  if (!creative) {
    return showSoonToast("Creative-Details nicht gefunden.");
  }

  const title = `Creative-Details: ${creative.name}`;
  const content = `
    <div class="creative-details-modal">
        <p><strong>ID:</strong> ${creative.id}</p>
        <p><strong>Typ:</strong> ${creative.mediaType} (${creative.format})</p>
        <p><strong>Ziel:</strong> ${creative.objective} (via ${creative.platform})</p>
        <hr/>
        <p><strong>ROAS:</strong> <span class="badge ${creative.roas > 3.0 ? 'success' : 'warning'}">${creative.roas.toFixed(2)}</span></p>
        <p><strong>CTR:</strong> ${creative.ctr.toFixed(2)}%</p>
        <p><strong>CPC:</strong> ${creative.cpc.toFixed(2)}€</p>
        <p><strong>Score:</strong> ${creative.score}%</p>
        <hr/>
        <button class="button primary small" onclick="handleDeadButton('Creative Insights'); closeModal();">Insights anzeigen</button>
        <button class="button secondary small" onclick="handleDeadButton('Creative Library öffnen'); closeModal();">In Creative Library öffnen</button>
    </div>
  `;

  openModal(title, content);
}


function renderCampaignsView() {
  const viewEl = document.getElementById("campaignsView");
  if (!viewEl) return;

  if (AppState.activeView !== "campaigns") {
    viewEl.classList.add("hidden");
    return;
  }
  viewEl.classList.remove("hidden");

  const tbody = viewEl.querySelector("tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  MockData.campaigns.forEach((campaign) => {
    const row = tbody.insertRow();
    row.className = "campaign-row";
    // Prio 1.2: Campaigns Row-Click -> Modal
    row.onclick = () => {
        const title = `Kampagnen-Details: ${campaign.name}`;
        const statusClass = campaign.status === 'Aktiv' ? 'success' : 'error';
        const content = `
            <p><strong>ID:</strong> ${campaign.id}</p>
            <p><strong>Status:</strong> <span class="badge ${statusClass}">${campaign.status}</span></p>
            <p><strong>Ziel:</strong> ${campaign.objective}</p>
            <p><strong>Budget:</strong> ${formatCurrency(campaign.budget)}</p>
            <hr/>
            <p>Dies ist das Detail-Modal für die Kampagne. Hier würden später alle Performance-Metriken, die Ad Sets und die zugeordneten Creatives angezeigt werden.</p>
            <p>Aktueller ROAS: ${campaign.kpi.roas.toFixed(1)} | Ausgaben: ${formatCurrency(campaign.kpi.spend)}</p>
            <button class="button primary small" onclick="handleDeadButton('Kampagnen-Struktur'); closeModal();">Ad Sets anzeigen</button>
        `;
        openModal(title, content);
    };

    const statusClass = campaign.status === "Aktiv" ? "success" : "error";
    row.innerHTML = `
        <td><div class="status-dot ${statusClass}"></div> ${campaign.name}</td>
        <td>${campaign.objective}</td>
        <td>${formatCurrency(campaign.budget)}</td>
        <td>${campaign.kpi.roas.toFixed(1)}</td>
        <td>${formatCurrency(campaign.kpi.spend)}</td>
    `;
  });
}

function renderInsightsView() {
  const viewEl = document.getElementById("insightsView");
  if (viewEl) {
    viewEl.classList.toggle("hidden", AppState.activeView !== "insights");
  }
}

/**
 * NEU: Sensei View Renderer (Prio 13)
 */
function renderSenseiView() {
  const viewEl = document.getElementById("senseiView");
  if (viewEl) {
    viewEl.classList.toggle("hidden", AppState.activeView !== "sensei");

    // NEU: Setup workflow buttons
    viewEl.querySelectorAll('.workflow-card').forEach(card => {
        card.onclick = () => openWorkflowModal(card.getAttribute('data-workflow'));
    });
  }
}

/**
 * NEU: Öffnet das simulierte AI Workflow Modal (Prio 13).
 * @param {string} workflowName 
 */
function openWorkflowModal(workflowName) {
    const title = `AI Workflow: ${workflowName}`;
    const output = workflowName === 'Generate New Hooks' ? 
        `
        <div class="form-group">
            <label>Zielgruppe</label>
            <input type="text" class="form-input" value="Performance Marketer (Mittelstand)" />
        </div>
        <div class="form-group">
            <label>Tone of Voice</label>
            <select class="form-select"><option>Elite / Kompetent</option></select>
        </div>
        <button class="button primary" style="margin-top: 16px;" onclick="simulateAiOutput(this, 'hook');">Hooks generieren</button>
        <div class="ai-output hidden" id="aiOutput">
            <hr/>
            <strong>Sensei Output:</strong>
            <p>#1: Stop losing money on bad creatives. Sensei guarantees your next hook performs.</p>
            <p>#2: The 3 seconds that matter: This is how top brands scale profitably (Watch Now).</p>
        </div>
        ` :
        `
        <p>Dies ist das Formular für den <strong>${workflowName}</strong> Workflow.</p>
        <div class="form-group">
            <label>Creative ID zum Iterieren</label>
            <input type="text" class="form-input" value="c5 - Static – Testimonial Card" />
        </div>
        <button class="button primary" style="margin-top: 16px;" onclick="simulateAiOutput(this, 'default');">Workflow starten</button>
        <div class="ai-output hidden" id="aiOutput">
            <hr/>
            <strong>Sensei Output:</strong>
            <p>Die Analyse zeigt: Der Testimonial-Hook funktioniert gut. Sensei empfiehlt, eine "Problem-Solution" Variante mit dem gleichen Testimonial zu testen.</p>
        </div>
        `;

    openModal(title, output);
}

/**
 * Simuliert die AI-Antwort nach Klick auf den Button im Modal.
 * @param {HTMLElement} button - Der geklickte Button.
 * @param {string} type - Typ des Outputs.
 */
function simulateAiOutput(button, type) {
    button.textContent = "Sensei arbeitet...";
    button.classList.add("disabled");

    setTimeout(() => {
        document.getElementById('aiOutput')?.classList.remove('hidden');
        button.textContent = "Neu generieren";
        button.classList.remove("disabled");
        showSoonToast(`Sensei hat den Output generiert! (${type}-Modus)`);
    }, 1500);
}


function renderLibraryView() {
  const viewEl = document.getElementById("libraryView");
  if (viewEl) {
    viewEl.classList.toggle("hidden", AppState.activeView !== "library");
  }
}

function renderReportsView() {
  const viewEl = document.getElementById("reportsView");
  if (viewEl) {
    viewEl.classList.toggle("hidden", AppState.activeView !== "reports");
  }
}

function renderConnectionsView() {
  const viewEl = document.getElementById("connectionsView");
  if (viewEl) {
    viewEl.classList.toggle("hidden", AppState.activeView !== "connections");
    updateConnectionsView();
  }
}

function renderProfileView() {
    const viewEl = document.getElementById("profileView");
    if (viewEl) {
        viewEl.classList.toggle("hidden", AppState.activeView !== "profile");

        // Load current state into form
        document.getElementById("accountName").value = AppState.account.name;
        document.getElementById("accountBrand").value = AppState.account.brand;
        document.getElementById("adAccountName").value = AppState.account.adAccount;
    }
}
function renderSettingsView() {
    const viewEl = document.getElementById("settingsView");
    if (viewEl) {
        viewEl.classList.toggle("hidden", AppState.activeView !== "settings");
    }
}


// ----------------------------------------------------------------------
// STATE MANIPULATION / SETUP
// ----------------------------------------------------------------------

function setActiveView(viewName) {
  if (AppState.activeView !== viewName) {
      // NEU: Show loading overlay before switching view
      showLoadingOverlay();
      AppState.activeView = viewName;
      // Kurze Verzögerung, um den Loading-Effekt zu zeigen
      setTimeout(() => {
        renderAll();
      }, 500);
  } else {
    // Wenn die Ansicht die gleiche ist, einfach neu rendern, ohne Loading
    AppState.activeView = viewName;
    renderAll();
  }
  

  // Update Sidebar active state
  document.querySelectorAll(".sidebar-menu .menu-item").forEach((item) => {
    item.classList.toggle("active", item.getAttribute("data-view") === viewName);
  });
}

function initTheme() {
  document.documentElement.setAttribute("data-theme", AppState.theme);
}

function toggleTheme() {
  AppState.theme = AppState.theme === "light" ? "dark" : "light";
  localStorage.setItem("signalOneTheme", AppState.theme);
  document.documentElement.setAttribute("data-theme", AppState.theme);
}

function initDate() {
  document.getElementById("currentDate").textContent = new Date().toLocaleDateString(
    "de-DE",
    {
      year: "numeric",
      month: "long",
      day: "numeric"
    }
  );
}

function toggleSidebar() {
  AppState.sidebarCollapsed = !AppState.sidebarCollapsed;
  localStorage.setItem("sidebarCollapsed", AppState.sidebarCollapsed);
  document.getElementById("sidebar").classList.toggle("collapsed", AppState.sidebarCollapsed);
  mainContentEl.classList.toggle("sidebar-collapsed", AppState.sidebarCollapsed);
}

// ----------------------------------------------------------------------
// ACCOUNT & PROFILE (Prio 1.5)
// ----------------------------------------------------------------------

function loadAccount() {
  const savedAccount = localStorage.getItem("signalOneAccount");
  if (savedAccount) {
    const { name, brand, adAccount } = JSON.parse(savedAccount);
    AppState.account = { name, brand, adAccount };
  }
}

function saveAccount() {
    const name = document.getElementById("accountName").value;
    const brand = document.getElementById("accountBrand").value;
    const adAccount = document.getElementById("adAccountName").value;

    AppState.account.name = name;
    AppState.account.brand = brand;
    AppState.account.adAccount = adAccount;

    localStorage.setItem(
        "signalOneAccount",
        JSON.stringify(AppState.account)
    );

    renderTopBar();
    showSoonToast("Account-Einstellungen gespeichert.");
}


// ----------------------------------------------------------------------
// SETUP EVENT HANDLERS
// ----------------------------------------------------------------------

function setupThemeToggle() {
  document.getElementById("themeToggle")?.addEventListener("click", toggleTheme);
}

function setupModeToggle() {
  const toggleEl = document.getElementById("modeToggle");
  if (toggleEl) {
    toggleEl.addEventListener("click", () => {
      AppState.mode = AppState.mode === "demo" ? "live" : "demo";
      toggleEl.textContent = AppState.mode === "live" ? "Live-Sync (Beta)" : "Demo-Daten";
      renderAll();
      showSoonToast(AppState.mode === "live" ? 'Live-Sync ist in Vorbereitung (nur Optik).' : 'Zurück zu Demo-Daten.');
    });
  }
}

function setupSidebar() {
  document.getElementById("sidebarToggle")?.addEventListener("click", toggleSidebar);
  document.getElementById("sidebar").classList.toggle("collapsed", AppState.sidebarCollapsed);
  mainContentEl.classList.toggle("sidebar-collapsed", AppState.sidebarCollapsed);


  document.querySelectorAll(".sidebar-menu a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const viewName = e.currentTarget.getAttribute("data-view");
      if (viewName) {
        setActiveView(viewName);
      }
    });
  });

  document.getElementById("sidebarProfileBtn")?.addEventListener("click", () => setActiveView('profile'));
}


function setupPeriodToggles() {
  document.querySelectorAll(".period-toggle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      AppState.period = e.currentTarget.getAttribute("data-period");
      document.querySelectorAll(".period-toggle").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      showSoonToast(`Zeitraum auf '${e.currentTarget.textContent}' geändert.`);
      // Nur KPI-Rendern, nicht alles
      renderDashboard(); 
    });
  });
}

function setupCreativesControls() {
    // Prio 2.6: View Toggle
    const gridBtn = document.getElementById('creativeViewGrid');
    const listBtn = document.getElementById('creativeViewList');

    if (gridBtn && listBtn) {
        gridBtn.addEventListener('click', () => {
            AppState.creativeView = 'grid';
            listBtn.classList.remove('active');
            gridBtn.classList.add('active');
            renderCreativesView();
        });
        listBtn.addEventListener('click', () => {
            AppState.creativeView = 'list';
            gridBtn.classList.remove('active');
            listBtn.classList.add('active');
            renderCreativesView();
        });
    }

    // Prio 2.7: Sortierung
    const sortSelect = document.getElementById('creativeSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            AppState.creativeSort = e.target.value;
            renderCreativesView();
        });
        sortSelect.value = AppState.creativeSort;
    }
    
    // NEU: Prio 5. Search / Filter
    const searchInput = document.getElementById('creativeSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            // Trimmen und in State speichern
            AppState.creativeFilterText = e.target.value.trim();
            renderCreativesView();
        });
    }

    // Prio 1.1: New Creative Button
    document.getElementById("createNewCreativeBtn")?.addEventListener("click", () => handleDeadButton('Neues Creative erstellen'));
}

function setupReportsControls() {
    // Prio 2.8: JSON Export Function
    const exportBtn = document.getElementById("exportJsonBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportDataAsJson);
    }
    // Prio 1.1: Create Report Button
    document.getElementById("createReportBtn")?.addEventListener("click", () => handleDeadButton('Neuen Report erstellen'));
}


/**
 * Prio 2.8: JSON Export Function
 */
function exportDataAsJson() {
    const dataToExport = {
        meta: AppState.kpi,
        creatives: MockData.creatives,
        campaigns: MockData.campaigns,
        timestamp: new Date().toISOString(),
    };

    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `SignalOne_Report_${new Date().toLocaleDateString('de-DE').replace(/\./g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSoonToast("Daten erfolgreich als JSON exportiert.");
}

function setupProfileView() {
    // Prio 1.5: Save Account Settings
    document.getElementById("saveAccountSettings")?.addEventListener("click", saveAccount); 
}

function setupSettingsView() {
    // NEU: Prio 8. Save Settings Button
    document.getElementById("saveAppSettings")?.addEventListener("click", () => handleDeadButton('App-Einstellungen speichern'));
}


function setupConnections() {
    // Prio 1.4: Fake-Connect for Meta
    const connectMetaBtn = document.getElementById("connectMetaBtn");
    if (connectMetaBtn) {
        connectMetaBtn.addEventListener("click", () => {
            if (AppState.connections.meta === false) {
                connectMetaBtn.textContent = "Verbinde...";
                connectMetaBtn.classList.add("disabled");
                setTimeout(() => {
                    AppState.connections.meta = true;
                    updateConnectionsView();
                    renderTopBar();
                    showSoonToast("Erfolgreich mit Meta verbunden! (Demo-Modus)");
                }, 1500);
            } else {
                showSoonToast("Meta ist bereits verbunden.");
            }
        });
    }

    // Prio 1.1: Handlers for other platform buttons
    document.getElementById("connectGoogleBtn")?.addEventListener("click", () => handleDeadButton('Google Ads Verbindung'));
    document.getElementById("connectTikTokBtn")?.addEventListener("click", () => handleDeadButton('TikTok Ads Verbindung'));
    document.getElementById("connectAmazonBtn")?.addEventListener("click", () => handleDeadButton('Amazon Ads Verbindung'));
    document.getElementById("connectOtherBtn")?.addEventListener("click", () => handleDeadButton('Weitere Verbindungen'));
}

/**
 * Prio 1.4: Aktualisiert den Status im Connections View und Top Bar.
 */
function updateConnectionsView() {
    const metaStatusText = document.getElementById("metaStatusText");
    const metaStatusDot = document.getElementById("metaStatusDot");
    const connectMetaBtn = document.getElementById("connectMetaBtn");

    if (metaStatusText && metaStatusDot && connectMetaBtn) {
        if (AppState.connections.meta) {
            metaStatusText.textContent = "Verbunden";
            metaStatusDot.className = "status-dot success"; 
            connectMetaBtn.textContent = "Verbunden";
            connectMetaBtn.classList.add("disabled");
        } else {
            metaStatusText.textContent = "Getrennt";
            metaStatusDot.className = "status-dot error";
            connectMetaBtn.textContent = "Verbinden";
            connectMetaBtn.classList.remove("disabled");
        }
    }
    // Google status update (for dot aesthetics)
    document.getElementById("googleStatusDot")?.classList.toggle("success", AppState.connections.google);
}

function setupTopBarDeadButtons() {
    // Prio 1.1: Top bar icons
    document.getElementById("notificationIcon")?.addEventListener("click", () => handleDeadButton('Benachrichtigungen'));
    document.getElementById("topBarMetaIcon")?.addEventListener("click", () => handleDeadButton('Meta Account Quick-Link'));
    document.getElementById("topBarGoogleIcon")?.addEventListener("click", () => handleDeadButton('Google Account Quick-Link'));
    document.getElementById("topBarSpotifyIcon")?.addEventListener("click", () => handleDeadButton('Spotify Quick-Link'));
    document.getElementById("settingsIcon")?.addEventListener("click", () => setActiveView('settings'));
}


// ----------------------------------------------------------------------
// RENDER ALL
// ----------------------------------------------------------------------

function renderAll() {
  // Globale KPI einmal aus den Mock-Daten berechnen
  AppState.kpi = calculateGlobalKpi();

  // Top-Bar / Account / Datum
  renderTopBar?.();
  initDate();

  // Views mit den Mock-Daten neu zeichnen
  renderDashboard();        // Hero-Creatives + KPI-Kacheln Style A
  renderCreativesView();    // Creatives-Grid
  renderCampaignsView();    // Kampagnen-Tabelle
  renderInsightsView();     // Insights-Liste
  renderSenseiView();       // SignalSensei Strategie
  renderLibraryView();      // Creative Library
  renderReportsView();      // Reports + JSON
  renderConnectionsView();  // Verbindungen
  loadProfileSettings?.();  // Profil-Felder befüllen
}

// ----------------------------------------------------------------------
// INIT (Inspector / General Setup)
// ----------------------------------------------------------------------

function setupInspector() {
  const inspectorToggle = document.getElementById("inspectorToggle");
  const inspector = document.getElementById("stateInspector");
  const inspectorClose = document.getElementById("inspectorClose");
  
  if(inspectorToggle) {
    inspectorToggle.addEventListener("click", () => {
      inspector?.classList.toggle("hidden");
    });
  }

  if(inspectorClose) {
    inspectorClose.addEventListener("click", () => {
      inspector?.classList.add("hidden");
    });
  }
}

function updateStateInspector() {
  const stateEl = document.getElementById("inspectorState");
  const eventsEl = document.getElementById("inspectorEvents");
  if (stateEl) {
    stateEl.textContent = JSON.stringify(
      {
        mode: AppState.mode,
        theme: AppState.theme,
        period: AppState.period,
        connections: AppState.connections,
        kpi: AppState.kpi,
        account: AppState.account,
        creativeView: AppState.creativeView,
        creativeSort: AppState.creativeSort,
        creativeFilterText: AppState.creativeFilterText // NEU
      },
      null,
      2
    );
  }
  if (eventsEl) {
    eventsEl.textContent = "Event Log (Noch leer)"; // Vereinfachte Ausgabe
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Theme & Account laden
  AppState.theme = localStorage.getItem("signalOneTheme") || "light";
  initTheme();
  loadAccount?.();

  // UI-Controls
  setupThemeToggle();
  setupModeToggle();
  setupSidebar();
  setupProfileButtons?.();
  setupConnections?.();

  // Startview = Dashboard
  AppState.activeView = "dashboard";
  setActiveView("dashboard");
});

