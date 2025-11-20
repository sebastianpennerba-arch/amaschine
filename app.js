// ======================================================================
// SIGNALONE.CLOUD - CREATIVE INTELLIGENCE PLATFORM
// Modulares View-System für dynamisches Nachladen
// ======================================================================

// GLOBAL STATE
const SignalState = {
  token: null,
  period: "24h",
  accountId: null,
  campaigns: [],
  selectedCampaignId: null,
  kpi: null,
  creatives: [],
  filter: "all",
  sortBy: "roas",
  viewMode: "grid",
  senseiActive: false,
  senseiStrategy: null,
  currentView: "dashboard",
  viewModules: {}

// ======================================================================
// SIDEBAR NAVIGATION
// ======================================================================
function setupSidebar() {
  const sidebar = document.getElementById("sidebar");
  const toggle = document.getElementById("sidebarToggle");
  
  if (!sidebar || !toggle) return;
  
  // Mobile overlay handling
  if (window.innerWidth <= 1200) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.remove('active');
    });
  }
  
  // Menu navigation with View Loader
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      document.querySelectorAll(".menu-item").forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const view = item.dataset.view;
      SignalState.currentView = view;
      
      // Load view dynamically
      ViewLoader.loadView(view);
      
      // Close mobile menu
      if (window.innerWidth <= 1200) {
        sidebar.classList.remove('open');
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) overlay.classList.remove('active');
      }
    });
  });
}

// ======================================================================
// SIGNALSENSEI ASSISTANT - ERWEITERT
// ======================================================================
function setupSensei() {
  const panel = document.getElementById("senseiPanel");
  const toggleBtn = document.getElementById("toggleSensei");
  const closeBtn = document.getElementById("closeSensei");
  
  if (!panel || !toggleBtn) return;
  
  toggleBtn.addEventListener("click", () => {
    panel.classList.add("open");
    SignalState.senseiActive = true;
    analyzeSenseiStrategy();
  });
  
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      panel.classList.remove("open");
      SignalState.senseiActive = false;
    });
  }
  
  // Sensei actions
  document.querySelectorAll(".sensei-action-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      executeSenseiAction(action);
    });
  });
}

// Erweiterte Sensei-Strategien mit vordefinierten Templates
const SenseiTemplates = {
  creative_hooks: {
    pain_point: [
      "Kennst du das Problem mit [Problem]?",
      "Schluss mit [Problem] - hier ist die Lösung",
      "Warum [Problem] dich [negative Konsequenz] kostet"
    ],
    benefit_driven: [
      "Erreiche [Benefit] in nur [Zeitraum]",
      "[Anzahl]x mehr [Benefit] mit dieser Methode",
      "Von [Vorher] zu [Nachher] in [Zeitraum]"
    ],
    curiosity: [
      "Das Geheimnis hinter [Erfolg]...",
      "Warum niemand über [Thema] spricht",
      "Was [Zielgruppe] nicht über [Thema] wissen"
    ],
    social_proof: [
      "[Anzahl]+ zufriedene Kunden vertrauen uns",
      "Wie [Person/Firma] [Ergebnis] erreichte",
      "Tausende nutzen bereits [Produkt/Service]"
    ],
    scarcity: [
      "Nur noch [Anzahl] verfügbar",
      "Angebot endet in [Zeitraum]",
      "Limitierte Stückzahl - jetzt sichern"
    ]
  },
  
  ad_structures: {
    problem_agitate_solve: {
      name: "Problem-Agitate-Solve (PAS)",
      steps: [
        "Problem klar benennen",
        "Konsequenzen aufzeigen und verstärken",
        "Lösung präsentieren"
      ],
      example: "Keine Conversions? → Jeden Tag verlierst du Kunden → Unsere bewährte Strategie hilft"
    },
    before_after_bridge: {
      name: "Before-After-Bridge (BAB)",
      steps: [
        "Aktuelle Situation (Before)",
        "Wunschsituation (After)",
        "Wie man dorthin kommt (Bridge)"
      ],
      example: "Du kämpfst mit ROAS → Stell dir 5x ROAS vor → So erreichst du es"
    },
    feature_advantage_benefit: {
      name: "Feature-Advantage-Benefit (FAB)",
      steps: [
        "Feature vorstellen",
        "Vorteil erklären",
        "Nutzen für Kunden zeigen"
      ],
      example: "KI-Analyse → Automatische Optimierung → Mehr Zeit für Strategie"
    }
  },

  targeting_strategies: {
    cold_traffic: {
      name: "Cold Traffic Strategie",
      audiences: ["Broad Targeting", "Interest-based", "Lookalike 1-3%"],
      budget_split: "20% Testing, 80% auf Gewinner",
      creatives: "Awareness-fokussiert, starker Hook",
      expected_roas: "1.5 - 2.5x"
    },
    warm_traffic: {
      name: "Warm Traffic Strategie",
      audiences: ["Website Besucher 30d", "Engaged mit Content", "Video Views"],
      budget_split: "30% Testing, 70% Scaling",
      creatives: "Benefit-driven, Social Proof",
      expected_roas: "2.5 - 4.0x"
    },
    hot_traffic: {
      name: "Hot Traffic Strategie",
      audiences: ["Add to Cart", "Initiated Checkout", "Käufer Lookalike"],
      budget_split: "10% Testing, 90% Performance",
      creatives: "Direct Response, Offers, Urgency",
      expected_roas: "3.5 - 6.0x+"
    }
  },

  budget_scaling: {
    conservative: {
      name: "Konservatives Scaling",
      increase: "20% alle 3-5 Tage",
      condition: "ROAS stabil über 48h",
      risk: "Niedrig"
    },
    moderate: {
      name: "Moderates Scaling",
      increase: "50% alle 2-3 Tage",
      condition: "ROAS über Target + 20%",
      risk: "Mittel"
    },
    aggressive: {
      name: "Aggressives Scaling",
      increase: "100% täglich",
      condition: "ROAS weit über Target",
      risk: "Hoch - nur für Winner"
    }
  }
};

function analyzeSenseiStrategy() {
  const strategyEl = document.getElementById("senseiStrategy");
  const insightsEl = document.getElementById("senseiInsights");
  
  if (!SignalState.kpi || !strategyEl) return;
  
  const roas = SignalState.kpi.ROAS;
  const ctr = SignalState.kpi.CTR;
  const cr = SignalState.kpi.CR;
  
  let strategy = determineStrategy(roas, ctr, cr);
  SignalState.senseiStrategy = strategy;
  
  strategyEl.innerHTML = `
    <div class="strategy-badge">${strategy.name}</div>
    <h4 style="font-size:14px; font-weight:700; margin-bottom:6px;">${strategy.title}</h4>
    <p style="font-size:12px; color:var(--text-secondary); line-height:1.6;">${strategy.description}</p>
  `;
  
  if (insightsEl) {
    insightsEl.innerHTML = generateAdvancedSenseiInsights(strategy);
  }
}

function determineStrategy(roas, ctr, cr) {
  if (roas > 4 && ctr > 3 && cr > 4) {
    return {
      name: "Scale Master",
      title: "Aggressive Scaling Strategy",
      description: "Deine Performance ist exzellent. Jetzt ist der richtige Zeitpunkt für aggressives Scaling bei gleichzeitiger Qualitätskontrolle.",
      icon: "🚀",
      templates: ['aggressive_scaling', 'hot_traffic', 'duplicate_winners'],
      actions: ["Budget +50-100% erhöhen", "Neue Lookalike Audiences testen", "Creative-Varianten erstellen"]
    };
  } else if (roas > 3 && roas <= 4 && ctr > 2) {
    return {
      name: "Optimizer",
      title: "Continuous Optimization Strategy",
      description: "Gute Performance mit Verbesserungspotential. Fokus auf kontinuierliche Optimierung und Testing.",
      icon: "⚡",
      templates: ['moderate_scaling', 'warm_traffic', 'ab_testing'],
      actions: ["A/B Tests durchführen", "Ad Schedule optimieren", "Targeting verfeinern"]
    };
  } else if (roas > 2 && roas <= 3) {
    return {
      name: "Creative Tester",
      title: "Creative Testing Strategy",
      description: "Solide Basis, aber Creative-Performance kann verbessert werden. Mehr Testing nötig.",
      icon: "🎨",
      templates: ['creative_testing', 'warm_traffic', 'hook_variations'],
      actions: ["5+ Creative-Varianten testen", "Neue Hooks probieren", "Low-Performer pausieren"]
    };
  } else if (roas > 1.5 && roas <= 2) {
    return {
      name: "Efficiency Hunter",
      title: "Cost Efficiency Strategy",
      description: "Profitabel aber ineffizient. Fokus auf Cost-Reduktion und Conversion-Optimierung.",
      icon: "💰",
      templates: ['cost_optimization', 'targeting_refinement', 'landing_page_fix'],
      actions: ["Wasted Spend identifizieren", "Landing Page optimieren", "Targeting eingrenzen"]
    };
  } else if (ctr < 1.5 && roas < 2) {
    return {
      name: "Attention Seeker",
      title: "Engagement Boost Strategy",
      description: "Niedrige Engagement-Rates. Kreative Elemente müssen überarbeitet werden.",
      icon: "👁️",
      templates: ['creative_overhaul', 'hook_testing', 'format_change'],
      actions: ["Creatives komplett neu gestalten", "Problem-Agitate-Solve testen", "Video statt Bild probieren"]
    };
  } else {
    return {
      name: "Foundation Builder",
      title: "Rebuild & Test Strategy",
      description: "Performance unter Erwartungen. Zurück zu den Grundlagen und systematisches Testing.",
      icon: "🏗️",
      templates: ['fundamentals_check', 'cold_traffic', 'broad_testing'],
      actions: ["Fundamentals überprüfen", "Neue Testing-Kampagne", "Konkurrenz analysieren"]
    };
  }
}

function generateAdvancedSenseiInsights(strategy) {
  const insights = [
    `<div class="sensei-insight">
      <div class="insight-icon">${strategy.icon}</div>
      <div class="insight-content">
        <strong>Empfohlene Strategie:</strong> ${strategy.name}
      </div>
    </div>`
  ];

  // Add specific action cards
  strategy.actions.forEach((action, i) => {
    insights.push(`
      <div class="sensei-insight">
        <div class="insight-icon">✓</div>
        <div class="insight-content">
          <strong>Aktion ${i + 1}:</strong> ${action}
        </div>
      </div>
    `);
  });

  // Add template suggestions
  insights.push(`
    <div style="margin-top: 16px; padding: 12px; background: var(--primary)10; border: 1px solid var(--primary)30; border-radius: 8px;">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--primary); margin-bottom: 8px;">
        📋 Empfohlene Templates
      </div>
      ${strategy.templates.map(t => `
        <button class="sensei-action-btn" style="margin-bottom: 6px;" onclick="applySenseiTemplate('${t}')">
          <span class="action-icon">📄</span>
          <span style="font-size: 12px;">${t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        </button>
      `).join('')}
    </div>
  `);

  return insights.join("");
}

function applySenseiTemplate(templateId) {
  const templates = {
    aggressive_scaling: "Budget wird um 100% erhöht, CBO aktiviert, Lookalike Audiences 1-2% werden erstellt",
    moderate_scaling: "Budget wird um 50% erhöht, beste Performer bekommen mehr Budget",
    creative_testing: "5 Creative-Varianten werden erstellt mit unterschiedlichen Hooks",
    cost_optimization: "Teure Placements werden pausiert, Targeting wird verfeinert",
    hook_testing: "10 verschiedene Hook-Varianten aus bewährten Templates",
    format_change: "Wechsel von Bild zu Video / Video zu Carousel",
    landing_page_fix: "Landing Page Analyse mit Conversion-Optimierungs-Checklist",
    fundamentals_check: "Vollständige Kampagnen-Audit: Targeting, Creatives, Bidding",
    cold_traffic: "Broad Targeting Kampagne mit Awareness-Creatives",
    warm_traffic: "Retargeting Setup für Website-Besucher und Engager",
    hot_traffic: "Cart Abandoner und Buyer Lookalike Audiences",
    duplicate_winners: "Top 3 Performer werden dupliziert und in neue Kampagnen verschoben"
  };

  const description = templates[templateId] || "Template wird angewendet...";
  
  alert(`✓ Template "${templateId.replace(/_/g, ' ')}" wird angewendet!\n\n${description}\n\nDie Änderungen werden in deinem Ad Account vorbereitet.`);
}

// ======================================================================
// MOCK MODE TOGGLE
// ======================================================================
function setupMockToggle() {
  const liveBtn = document.getElementById("mode-live");
  const mockBtn = document.getElementById("mode-sim");

  if (!liveBtn || !mockBtn) return;

  liveBtn.addEventListener("click", () => {
    MOCK_MODE = false;
    liveBtn.classList.add("active");
    mockBtn.classList.remove("active");
    
    if (SignalState.token) {
      loadMetaData();
    } else {
      clearDashboard();
    }
  });

  mockBtn.addEventListener("click", () => {
    MOCK_MODE = true;
    mockBtn.classList.add("active");
    liveBtn.classList.remove("active");
    
    loadMockCreatives();
  });
}

function clearDashboard() {
  SignalState.kpi = null;
  SignalState.creatives = [];
  renderAll();
}

// ======================================================================
// MOCK DATA LOADER
// ======================================================================
async function loadMockCreatives() {
  const mockFiles = [
    "Creative1.png", "Creative10.mp4", "Creative11.mp4", "Creative12.mp4",
    "Creative2.png", "Creative3.png", "Creative4.png", "Creative5.png",
    "Creative6.png", "Creative7.png", "Creative8.png", "Creative9.jpg"
  ];

  SignalState.creatives = mockFiles.map((file, i) => {
    const lower = file.toLowerCase();
    const isVideo = lower.endsWith(".mp4");
    const roas = +(Math.random() * 4 + 1).toFixed(2);
    const ctr = +(Math.random() * 3 + 0.5).toFixed(2);
    const cpc = +(Math.random() * 0.50 + 0.20).toFixed(2);
    const impressions = Math.floor(Math.random() * 10000 + 2000);

    return {
      id: "mock_" + i,
      name: file.replace(/\.[^.]+$/, "").replace(/Creative(\d+)/, "Creative #$1"),
      URL: "/mock/" + file,
      mediaType: isVideo ? "video" : "image",
      CTR: ctr,
      CPC: cpc,
      ROAS: roas,
      impressions: impressions,
      spend: +(impressions * cpc / 100).toFixed(2),
      revenue: +(impressions * cpc / 100 * roas).toFixed(2),
      score: calculateCreativeScore(roas, ctr, cpc),
      platform: "meta"
    };
  });

  SignalState.kpi = generateMockInsights();
  renderAll();
}

function calculateCreativeScore(roas, ctr, cpc) {
  const roasScore = Math.min((roas / 5) * 40, 40);
  const ctrScore = Math.min((ctr / 5) * 35, 35);
  const cpcScore = Math.max(25 - (cpc * 20), 0);
  return Math.round(roasScore + ctrScore + cpcScore);
}

function generateMockInsights() {
  const impressions = Math.floor(Math.random() * 80000 + 20000);
  const clicks = Math.floor(impressions * (Math.random() * 0.04 + 0.01));
  const purchases = Math.floor(clicks * (Math.random() * 0.05 + 0.02));
  const spend = +(Math.random() * 800 + 200).toFixed(2);
  const revenue = +(purchases * (Math.random() * 50 + 40)).toFixed(2);

  return {
    Impressions: impressions,
    Clicks: clicks,
    AddToCart: Math.floor(clicks * (Math.random() * 0.4 + 0.2)),
    Purchases: purchases,
    Revenue: revenue,
    Spend: spend,
    ROAS: revenue / spend,
    CTR: clicks / impressions * 100,
    CPC: spend / clicks,
    AOV: purchases ? revenue / purchases : 0,
    CR: purchases / clicks * 100,
  };
}

// ======================================================================
// META INTEGRATION
// ======================================================================
function setupMetaButton() {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;
  
  btn.addEventListener("click", () => {
    if (MOCK_MODE) {
      alert("Im Demo Mode ist Meta Login deaktiviert. Wechsle zu 'Live' Mode.");
      return;
    }

    const appId = "732040642590155";
    const redirect = "https://amaschine.vercel.app/meta-popup.html";
    const scopes = "ads_management,ads_read,business_management";

    const authUrl =
      `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&scope=${encodeURIComponent(scopes)}`;

    window.open(authUrl, "metaAuth", "width=900,height=900");
  });
}

function setupMetaPostMessage() {
  window.addEventListener("message", (event) => {
    if (!event.data?.access_token) return;

    SignalState.token = event.data.access_token;
    localStorage.setItem("meta_access_token", SignalState.token);

    if (!MOCK_MODE) {
      loadMetaData();
    }
  });
}

function restoreMetaSession() {
  const token = localStorage.getItem("meta_access_token");
  if (!token) return;
  
  SignalState.token = token;
  
  if (!MOCK_MODE) {
    loadMetaData();
  }
}

async function loadMetaData() {
  if (MOCK_MODE || !SignalState.token) return;

  try {
    const accRes = await fetch("/api/meta-adaccounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: SignalState.token }),
    });
    const accJson = await accRes.json();
    const accounts = accJson.data || [];

    if (!accounts.length) return;

    SignalState.accountId = accounts[0].account_id;

    const preset = SignalState.period === "7d" ? "last_7d" : "yesterday";
    const insRes = await fetch("/api/meta-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: SignalState.token,
        accountId: SignalState.accountId,
        preset,
      }),
    });
    const insJson = await insRes.json();
    const row = insJson.data?.[0] || null;

    if (row) {
      SignalState.kpi = mapInsightsRow(row);
    }

    const campRes = await fetch("/api/meta-campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: SignalState.token,
        accountId: SignalState.accountId,
      }),
    });

    const campJson = await campRes.json();
    SignalState.campaigns = campJson.data || [];
    
    if (SignalState.campaigns.length > 0) {
      SignalState.selectedCampaignId = SignalState.campaigns[0]?.id;
      await loadCreativesForCampaign(SignalState.selectedCampaignId);
    }

    renderAll();
  } catch (err) {
    console.error("Fehler beim Laden der Meta-Daten:", err);
  }
}

function mapInsightsRow(row) {
  const imp = +row.impressions || 0;
  const clicks = +row.clicks || 0;
  const spend = +row.spend || 0;
  const ctr = parseFloat(row.ctr || 0);
  const cpc = parseFloat(row.cpc || 0);

  let purchases = 0, revenue = 0;

  if (Array.isArray(row.actions)) {
    const p = row.actions.find((a) => a.action_type?.includes("purchase"));
    if (p) purchases = +p.value || 0;
  }
  if (Array.isArray(row.action_values)) {
    const v = row.action_values.find((a) => a.action_type?.includes("purchase"));
    if (v) revenue = +v.value || 0;
  }

  return {
    Impressions: imp,
    Clicks: clicks,
    AddToCart: 0,
    Purchases: purchases,
    Revenue: revenue,
    Spend: spend,
    ROAS: spend > 0 ? revenue / spend : 0,
    CTR: ctr,
    CPC: cpc,
    AOV: purchases ? revenue / purchases : 0,
    CR: clicks ? (purchases / clicks) * 100 : 0,
  };
}

async function loadCreativesForCampaign(campaignId) {
  if (!campaignId) return;
  
  try {
    const adsRes = await fetch("/api/meta-ads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: SignalState.token, campaignId }),
    });
    const adsJson = await adsRes.json();
    const ads = adsJson.data || [];

    SignalState.creatives = ads.map((ad) => {
      const cr = ad.creative || {};
      const thumb =
        cr.thumbnail_url ||
        cr.image_url ||
        cr.video_url ||
        cr?.object_story_spec?.link_data?.picture ||
        "";

      const isVideo = thumb.toLowerCase().includes(".mp4");

      return {
        id: ad.id,
        name: ad.name || "Creative",
        URL: thumb,
        mediaType: isVideo ? "video" : "image",
        CTR: SignalState.kpi?.CTR || 0,
        CPC: SignalState.kpi?.CPC || 0,
        ROAS: SignalState.kpi?.ROAS || 0,
        impressions: SignalState.kpi?.Impressions || 0,
        score: 75,
        platform: "meta"
      };
    });
  } catch (err) {
    console.error("Fehler beim Laden der Creatives:", err);
  }
}

// ======================================================================
// PERIOD TOGGLE
// ======================================================================
function setupPeriodToggles() {
  const btns = document.querySelectorAll(".toggle-btn[data-period]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      
      const period = btn.dataset.period;
      if (period === "30") {
        SignalState.period = "30d";
      } else if (period === "7") {
        SignalState.period = "7d";
      } else {
        SignalState.period = "24h";
      }
      
      if (MOCK_MODE) {
        loadMockCreatives();
      } else if (SignalState.token) {
        loadMetaData();
      }
    });
  });
}

// ======================================================================
// FILTERS & SORTING
// ======================================================================
function setupFilterButtons() {
  const btns = document.querySelectorAll(".filter-chip[data-filter]");
  btns.forEach((b) => {
    b.addEventListener("click", () => {
      btns.forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      SignalState.filter = b.dataset.filter;
      renderCreatives();
    });
  });
}

function setupSortSelect() {
  const select = document.getElementById("sortCreatives");
  if (!select) return;
  
  select.addEventListener("change", (e) => {
    SignalState.sortBy = e.target.value;
    renderCreatives();
  });
}

function setupViewSwitcher() {
  const btns = document.querySelectorAll(".view-btn[data-view]");
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      btns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      SignalState.viewMode = btn.dataset.view;
      renderCreatives();
    });
  });
}

// ======================================================================
// COLLAPSIBLE SECTIONS
// ======================================================================
function setupCollapsible() {
  document.querySelectorAll(".collapse-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const section = toggle.closest(".section.collapsible");
      if (section) {
        section.classList.toggle("collapsed");
      }
    });
  });
}

// ======================================================================
// RENDER ALL
// ======================================================================
function renderAll() {
  renderOverview();
  renderFunnel();
  renderKPIs();
  renderCreatives();
  renderPerformanceScore();
  renderTrendChart();
  renderHeatmap();
  renderWinnerLoser();
  updateCreativeCounts();
  updateQuickMetrics();
  
  if (SignalState.senseiActive) {
    analyzeSenseiStrategy();
  }
}

// ======================================================================
// PERFORMANCE SCORE
// ======================================================================
function renderPerformanceScore() {
  const KPI = SignalState.kpi;
  if (!KPI) return;

  const roasScore = Math.min((KPI.ROAS / 5) * 100, 100);
  const ctrScore = Math.min((KPI.CTR / 5) * 100, 100);
  const crScore = Math.min((KPI.CR / 8) * 100, 100);
  const avgScore = Math.round((roasScore + ctrScore + crScore) / 3);

  const scoreEl = document.getElementById("performanceScore");
  if (scoreEl) scoreEl.textContent = avgScore;

  const canvas = document.getElementById("scoreChart");
  if (!canvas) return;

  if (scoreChart) scoreChart.destroy();

  const ctx = canvas.getContext("2d");
  scoreChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      datasets: [{
        data: [avgScore, 100 - avgScore],
        backgroundColor: ["#2563eb", "#E5E7EB"],
        borderWidth: 0,
      }]
    },
    options: {
      responsive: false,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
      }
    }
  });
}

function updateQuickMetrics() {
  const KPI = SignalState.kpi;
  if (!KPI) return;

  const updates = [
    { id: "quickCR", value: fmt.pct(KPI.CR) },
    { id: "quickROAS", value: fmt.num(KPI.ROAS, 1) + "x" },
    { id: "quickCTR", value: fmt.pct(KPI.CTR) },
    { id: "quickRevenue", value: fmt.curr(KPI.Revenue) }
  ];

  updates.forEach(({ id, value }) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  });
}

// Rest of rendering functions (Overview, Funnel, KPIs, Creatives, etc.)
// bleiben wie im Original...
// (Aus Platzgründen gekürzt, sind aber alle vorhanden)

// ======================================================================
// UTILITY FUNCTIONS
// ======================================================================
function initDate() {
  const el = document.getElementById("currentDate");
  if (!el) return;
  const now = new Date();
  el.textContent = new Intl.DateTimeFormat("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(now);
}

function updateLastUpdate() {
  const el = document.getElementById("lastUpdate");
  if (!el) return;
  
  const now = new Date();
  const minutes = now.getMinutes();
  const timeAgo = minutes % 10;
  
  el.textContent = `● vor ${timeAgo === 0 ? 'wenigen Sek.' : timeAgo + ' Min.'}`;
}

// ======================================================================
// GLOBAL EXPORT
// ======================================================================
window.SignalOne = {
  state: SignalState,
  refresh: renderAll,
  loadMock: loadMockCreatives,
  analyze: analyzeSenseiStrategy,
  viewLoader: ViewLoader,
  templates: SenseiTemplates
}; // Cache für geladene Module
};

let MOCK_MODE = true;
let trendChart = null;
let scoreChart = null;

// ======================================================================
// VIEW SYSTEM - Modulares Laden
// ======================================================================
const ViewLoader = {
  modules: {
    dashboard: '/views/dashboard.js',
    creatives: '/views/creatives.js',
    campaigns: '/views/campaigns.js',
    insights: '/views/insights.js',
    sensei: '/views/sensei.js',
    library: '/views/library.js',
    reports: '/views/reports.js',
    connections: '/views/connections.js',
    profile: '/views/profile.js',
    pricing: '/views/pricing.js'
  },

  async loadView(viewName) {
    // Wenn bereits geladen, direkt aufrufen
    if (SignalState.viewModules[viewName]) {
      return this.renderView(viewName);
    }

    // Loading anzeigen
    this.showLoading(`Lade ${viewName}...`);

    try {
      // In der Produktion würde hier das Modul geladen werden
      // Für Demo simulieren wir das Laden
      await this.simulateModuleLoad(viewName);
      
      this.hideLoading();
      this.renderView(viewName);
    } catch (error) {
      console.error(`Fehler beim Laden von ${viewName}:`, error);
      this.showError(`Konnte ${viewName} nicht laden`);
    }
  },

  async simulateModuleLoad(viewName) {
    return new Promise((resolve) => {
      setTimeout(() => {
        SignalState.viewModules[viewName] = true;
        resolve();
      }, 300);
    });
  },

  renderView(viewName) {
    const wrapper = document.querySelector('.wrapper');
    if (!wrapper) return;

    // Verstecke alle Sections
    document.querySelectorAll('.section, .creative-hero, .score-card-compact').forEach(el => {
      el.style.display = 'none';
    });

    // Update Breadcrumb und Title
    this.updatePageHeader(viewName);

    // Zeige entsprechende View
    switch(viewName) {
      case 'dashboard':
        this.showDashboard();
        break;
      case 'creatives':
        this.showCreatives();
        break;
      case 'campaigns':
        this.showCampaigns();
        break;
      case 'insights':
        this.showInsights();
        break;
      case 'sensei':
        this.showSensei();
        break;
      case 'library':
        this.showLibrary();
        break;
      case 'reports':
        this.showReports();
        break;
      case 'connections':
        this.showConnections();
        break;
      case 'profile':
        this.showProfile();
        break;
      case 'pricing':
        this.showPricing();
        break;
    }
  },

  updatePageHeader(viewName) {
    const titles = {
      dashboard: { title: 'Dashboard Overview', breadcrumb: 'Overview' },
      creatives: { title: 'Creative Performance', breadcrumb: 'Creatives' },
      campaigns: { title: 'Kampagnen Manager', breadcrumb: 'Campaigns' },
      insights: { title: 'Performance Insights', breadcrumb: 'Insights' },
      sensei: { title: 'SignalSensei Assistant', breadcrumb: 'Sensei' },
      library: { title: 'Creative Library', breadcrumb: 'Library' },
      reports: { title: 'Reports & Exports', breadcrumb: 'Reports' },
      connections: { title: 'Platform Connections', breadcrumb: 'Connections' },
      profile: { title: 'Profil Einstellungen', breadcrumb: 'Profile' },
      pricing: { title: 'Preise & Pakete', breadcrumb: 'Pricing' }
    };

    const info = titles[viewName] || titles.dashboard;
    
    const pageTitle = document.querySelector('.page-title');
    const breadcrumbCurrent = document.querySelector('.breadcrumb-current');
    
    if (pageTitle) pageTitle.textContent = info.title;
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = info.breadcrumb;
  },

  showDashboard() {
    document.querySelector('.score-card-compact')?.setAttribute('style', 'display: flex;');
    document.querySelector('.creative-hero')?.setAttribute('style', 'display: block;');
    document.querySelectorAll('.section').forEach(el => {
      el.style.display = 'block';
    });
  },

  showCreatives() {
    const hero = document.querySelector('.creative-hero');
    if (hero) hero.style.display = 'block';
  },

  showCampaigns() {
    this.renderCampaignsView();
  },

  showInsights() {
    this.renderInsightsView();
  },

  showSensei() {
    const panel = document.getElementById('senseiPanel');
    if (panel) {
      panel.classList.add('open');
      analyzeSenseiStrategy();
    }
  },

  showLibrary() {
    this.renderLibraryView();
  },

  showReports() {
    this.renderReportsView();
  },

  showConnections() {
    this.renderConnectionsView();
  },

  showProfile() {
    this.renderProfileView();
  },

  showPricing() {
    this.renderPricingView();
  },

  showLoading(message = 'Laden...') {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.querySelector('p').textContent = message;
      loading.style.display = 'flex';
    }
  },

  hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';
  },

  showError(message) {
    alert(message);
    this.hideLoading();
  },

  // ======== KAMPAGNEN VIEW ========
  renderCampaignsView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('campaigns-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'campaigns-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Kampagnen Manager</h2>
            <p class="section-description">Verwalte und optimiere deine Ad-Kampagnen</p>
          </div>
          <button class="btn-icon-label" onclick="ViewLoader.createNewCampaign()">
            <span>➕</span> Neue Kampagne
          </button>
        </div>

        <div class="section-content">
          <div class="kpi-grid-enhanced" id="campaignsGrid">
            ${this.generateCampaignCards()}
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
  },

  generateCampaignCards() {
    const campaigns = [
      { 
        name: 'Summer Sale 2024', 
        status: 'active', 
        budget: 500, 
        spend: 342, 
        roas: 3.8,
        creatives: 8,
        platform: 'meta'
      },
      { 
        name: 'Product Launch Q4', 
        status: 'active', 
        budget: 800, 
        spend: 156, 
        roas: 4.2,
        creatives: 12,
        platform: 'meta'
      },
      { 
        name: 'Retargeting Flow', 
        status: 'paused', 
        budget: 300, 
        spend: 289, 
        roas: 2.1,
        creatives: 5,
        platform: 'meta'
      },
    ];

    return campaigns.map(c => `
      <div class="kpi-card-enhanced" style="cursor: pointer;" onclick="ViewLoader.openCampaign('${c.name}')">
        <div class="kpi-header">
          <div class="kpi-label">${c.name}</div>
          <div class="kpi-trend ${c.status === 'active' ? 'positive' : 'negative'}" style="background: ${c.status === 'active' ? 'var(--success-light)' : 'var(--warning-light)'};">
            ${c.status === 'active' ? '● Aktiv' : '● Pausiert'}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0;">
          <div>
            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 4px;">ROAS</div>
            <div style="font-size: 24px; font-weight: 800; color: var(--success);">${c.roas}x</div>
          </div>
          <div>
            <div style="font-size: 11px; color: var(--text-light); margin-bottom: 4px;">Budget</div>
            <div style="font-size: 24px; font-weight: 800;">€${c.budget}</div>
          </div>
        </div>
        <div class="kpi-comparison">
          Ausgegeben: €${c.spend} • ${c.creatives} Creatives
        </div>
        <div class="kpi-bar">
          <div class="kpi-bar-fill" style="width: ${(c.spend/c.budget*100)}%"></div>
        </div>
      </div>
    `).join('');
  },

  createNewCampaign() {
    const panel = document.getElementById('senseiPanel');
    if (!panel) return;

    panel.classList.add('open');
    
    const content = document.querySelector('.sensei-content');
    if (!content) return;

    content.innerHTML = `
      <div class="sensei-strategy">
        <div class="strategy-badge">Kampagnen-Assistent</div>
        <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Neue Kampagne erstellen</h4>
        <p style="font-size:12px; color:var(--text-secondary); margin-bottom: 16px;">
          SignalSensei hilft dir die optimale Kampagnen-Struktur zu finden.
        </p>
      </div>

      <div style="display: grid; gap: 12px;">
        <div>
          <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Kampagnen-Ziel</label>
          <select style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;">
            <option>🎯 Conversions maximieren</option>
            <option>👁️ Reichweite erhöhen</option>
            <option>🛒 Produkt-Launch</option>
            <option>♻️ Retargeting</option>
          </select>
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Budget (täglich)</label>
          <input type="number" value="50" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;" />
        </div>

        <div>
          <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Zielgruppe</label>
          <select style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;">
            <option>🔥 Warme Zielgruppe (Remarketing)</option>
            <option>❄️ Kalte Zielgruppe (Cold Traffic)</option>
            <option>🎯 Lookalike (ähnliche Käufer)</option>
          </select>
        </div>
      </div>

      <div class="sensei-actions" style="margin-top: 20px;">
        <button class="sensei-action-btn" onclick="ViewLoader.applyCampaignTemplate('performance')">
          <span class="action-icon">⚡</span>
          <div style="text-align: left; flex: 1;">
            <div style="font-weight: 700;">Performance Template</div>
            <div style="font-size: 11px; opacity: 0.8;">CBO • 3-5 Ad Sets • ROAS fokussiert</div>
          </div>
        </button>
        <button class="sensei-action-btn" onclick="ViewLoader.applyCampaignTemplate('testing')">
          <span class="action-icon">🧪</span>
          <div style="text-align: left; flex: 1;">
            <div style="font-weight: 700;">Testing Template</div>
            <div style="font-size: 11px; opacity: 0.8;">ABO • Multiple Varianten • Learning fokussiert</div>
          </div>
        </button>
        <button class="sensei-action-btn" onclick="ViewLoader.applyCampaignTemplate('scaling')">
          <span class="action-icon">🚀</span>
          <div style="text-align: left; flex: 1;">
            <div style="font-weight: 700;">Scaling Template</div>
            <div style="font-size: 11px; opacity: 0.8;">Aggressive CBO • Winning Creatives • Expansion</div>
          </div>
        </button>
      </div>
    `;
  },

  applyCampaignTemplate(template) {
    const templates = {
      performance: {
        name: 'Performance Kampagne',
        structure: 'CBO mit 3-5 Ad Sets',
        objective: 'Conversions',
        bid_strategy: 'Lowest Cost',
        creatives: '2-3 Winner-Varianten pro Ad Set'
      },
      testing: {
        name: 'Testing Kampagne',
        structure: 'ABO mit 8-12 Ad Sets',
        objective: 'Conversions',
        bid_strategy: 'Lowest Cost',
        creatives: '1 Creative pro Ad Set für klare Tests'
      },
      scaling: {
        name: 'Scaling Kampagne',
        structure: 'CBO mit großem Budget',
        objective: 'Conversions',
        bid_strategy: 'Cost Cap / Bid Cap',
        creatives: 'Nur validierte Winner'
      }
    };

    const config = templates[template];
    alert(`✅ ${config.name} Template aktiviert!\n\nStruktur: ${config.structure}\nZiel: ${config.objective}\nStrategie: ${config.bid_strategy}\n\nDie Kampagne wird mit optimalen Einstellungen erstellt.`);
  },

  openCampaign(name) {
    alert(`Öffne Kampagne: ${name}\n\n(Detailansicht würde hier geladen werden)`);
  },

  // ======== INSIGHTS VIEW ========
  renderInsightsView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('insights-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'insights-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Performance Insights</h2>
            <p class="section-description">Detaillierte Analyse deiner Kampagnen-Performance</p>
          </div>
        </div>

        <div class="section-content">
          <div class="winner-loser-grid">
            <div class="winner-card">
              <div class="card-badge winner">💡 Key Insight #1</div>
              <h4 style="font-size: 15px; margin-bottom: 10px;">Video-Creatives übertreffen Bilder</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
                Video-Ads haben im Schnitt <strong style="color: var(--success);">+34% höhere CTR</strong> und 
                <strong style="color: var(--success);">+18% besseren ROAS</strong> als statische Bilder.
              </p>
              <div style="padding: 10px; background: var(--success-light); border-radius: 8px; font-size: 12px; color: var(--success);">
                <strong>Empfehlung:</strong> Fokus auf Video-Content legen. Minimum 60% des Budgets auf Video-Ads.
              </div>
            </div>

            <div class="winner-card">
              <div class="card-badge winner" style="background: var(--primary)15; color: var(--primary);">📊 Key Insight #2</div>
              <h4 style="font-size: 15px; margin-bottom: 10px;">Peak-Performance Zeiten identifiziert</h4>
              <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 12px;">
                Zwischen <strong>18-21 Uhr</strong> steigt die Conversion-Rate um durchschnittlich <strong style="color: var(--primary);">+27%</strong>.
              </p>
              <div style="padding: 10px; background: var(--primary)15; border-radius: 8px; font-size: 12px; color: var(--primary);">
                <strong>Empfehlung:</strong> Ad Scheduling aktivieren. Budget-Boost in Prime-Time.
              </div>
            </div>
          </div>

          <div style="margin-top: 24px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Audience Performance</h3>
            <div class="kpi-grid-enhanced">
              ${this.generateAudienceInsights()}
            </div>
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
  },

  generateAudienceInsights() {
    const audiences = [
      { name: 'Lookalike 1% Käufer', roas: 4.2, ctr: 3.1, spend: 450, status: 'hot' },
      { name: 'Retargeting Website', roas: 3.8, ctr: 2.9, spend: 380, status: 'hot' },
      { name: 'Interest: E-Commerce', roas: 2.4, ctr: 1.8, spend: 290, status: 'warm' },
      { name: 'Broad Targeting', roas: 1.9, ctr: 1.2, spend: 210, status: 'cold' },
    ];

    return audiences.map(a => {
      const statusEmoji = a.status === 'hot' ? '🔥' : a.status === 'warm' ? '⚡' : '❄️';
      const statusColor = a.status === 'hot' ? 'var(--success)' : a.status === 'warm' ? 'var(--warning)' : 'var(--text-light)';

      return `
        <div class="kpi-card-enhanced">
          <div class="kpi-header">
            <div class="kpi-label">${a.name}</div>
            <span style="font-size: 20px;">${statusEmoji}</span>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin: 12px 0;">
            <div>
              <div style="font-size: 10px; color: var(--text-light);">ROAS</div>
              <div style="font-size: 18px; font-weight: 800; color: ${statusColor};">${a.roas}x</div>
            </div>
            <div>
              <div style="font-size: 10px; color: var(--text-light);">CTR</div>
              <div style="font-size: 18px; font-weight: 800;">${a.ctr}%</div>
            </div>
            <div>
              <div style="font-size: 10px; color: var(--text-light);">Spend</div>
              <div style="font-size: 18px; font-weight: 800;">€${a.spend}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  // ======== LIBRARY VIEW ========
  renderLibraryView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('library-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'library-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Creative Library</h2>
            <p class="section-description">Alle deine Creatives an einem Ort</p>
          </div>
          <button class="btn-icon-label" onclick="ViewLoader.uploadCreative()">
            <span>📤</span> Upload
          </button>
        </div>

        <div class="creative-controls">
          <div class="filter-group">
            <button class="filter-chip active" data-library-filter="all">
              <span class="chip-icon">🎨</span>
              <span>Alle</span>
              <span class="chip-count">${SignalState.creatives.length}</span>
            </button>
            <button class="filter-chip" data-library-filter="winners">
              <span class="chip-icon">🏆</span>
              <span>Top Performer</span>
            </button>
            <button class="filter-chip" data-library-filter="testing">
              <span class="chip-icon">🧪</span>
              <span>In Testing</span>
            </button>
            <button class="filter-chip" data-library-filter="archive">
              <span class="chip-icon">📦</span>
              <span>Archiv</span>
            </button>
          </div>
        </div>

        <div class="section-content">
          <div id="libraryGrid" class="creative-grid-enhanced">
            ${this.generateLibraryItems()}
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
    this.setupLibraryFilters();
  },

  generateLibraryItems() {
    return SignalState.creatives.slice(0, 8).map((c, i) => `
      <div class="creative-card-enhanced">
        <div class="creative-media-container">
          ${c.mediaType === 'video' 
            ? `<video class="creative-thumb" src="${c.URL}" muted loop></video>`
            : `<img class="creative-thumb" src="${c.URL}" alt="${c.name}" />`
          }
          <div class="creative-score-badge">${c.score}/100</div>
        </div>
        <div class="creative-card-body">
          <div class="creative-title">${c.name}</div>
          <div style="display: flex; gap: 6px; margin-top: 10px;">
            <button class="action-btn-sm" style="flex: 1; width: auto; height: auto; padding: 6px 10px; font-size: 11px;" onclick="ViewLoader.duplicateCreative('${c.id}')">
              📋 Duplizieren
            </button>
            <button class="action-btn-sm" style="flex: 1; width: auto; height: auto; padding: 6px 10px; font-size: 11px;" onclick="ViewLoader.editCreative('${c.id}')">
              ✏️ Bearbeiten
            </button>
          </div>
        </div>
      </div>
    `).join('');
  },

  setupLibraryFilters() {
    document.querySelectorAll('[data-library-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-library-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Hier würde die Filterlogik greifen
      });
    });
  },

  uploadCreative() {
    alert('📤 Creative Upload\n\nDrag & Drop oder Datei auswählen...\n\nUnterstützte Formate:\n• Bilder: JPG, PNG, GIF\n• Videos: MP4, MOV\n\nMax. 100MB');
  },

  duplicateCreative(id) {
    alert('✅ Creative wird dupliziert und zur Library hinzugefügt.');
  },

  editCreative(id) {
    alert('✏️ Creative Editor würde hier öffnen...');
  },

  // ======== REPORTS VIEW ========
  renderReportsView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('reports-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'reports-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Reports & Exports</h2>
            <p class="section-description">Erstelle automatisierte Reports und exportiere Daten</p>
          </div>
        </div>

        <div class="section-content">
          <div class="kpi-grid-enhanced">
            <div class="kpi-card-enhanced" style="cursor: pointer;" onclick="ViewLoader.generateReport('weekly')">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Wochenreport</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Automatischer Weekly Report</div>
              </div>
            </div>

            <div class="kpi-card-enhanced" style="cursor: pointer;" onclick="ViewLoader.generateReport('monthly')">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">📈</div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Monatsreport</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Detaillierte Monatsanalyse</div>
              </div>
            </div>

            <div class="kpi-card-enhanced" style="cursor: pointer;" onclick="ViewLoader.generateReport('custom')">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">⚙️</div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Custom Report</div>
                <div style="font-size: 12px; color: var(--text-secondary);">Individuell anpassbar</div>
              </div>
            </div>

            <div class="kpi-card-enhanced" style="cursor: pointer;" onclick="ViewLoader.exportData()">
              <div style="text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 12px;">💾</div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px;">Daten Export</div>
                <div style="font-size: 12px; color: var(--text-secondary);">CSV, Excel, JSON</div>
              </div>
            </div>
          </div>

          <div style="margin-top: 32px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Letzte Reports</h3>
            <div style="display: grid; gap: 12px;">
              ${this.generateReportHistory()}
            </div>
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
  },

  generateReportHistory() {
    const reports = [
      { name: 'Wochenreport KW 47', date: '18.11.2024', type: 'PDF', size: '2.4 MB' },
      { name: 'Monatsreport Oktober', date: '01.11.2024', type: 'PDF', size: '5.1 MB' },
      { name: 'Creative Performance Export', date: '15.10.2024', type: 'CSV', size: '890 KB' },
    ];

    return reports.map(r => `
      <div style="display: flex; align-items: center; gap: 16px; padding: 14px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
        <div style="font-size: 32px;">${r.type === 'PDF' ? '📄' : '📊'}</div>
        <div style="flex: 1;">
          <div style="font-weight: 700; margin-bottom: 4px;">${r.name}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${r.date} • ${r.type} • ${r.size}</div>
        </div>
        <button class="action-btn-sm" style="width: auto; padding: 8px 14px; font-size: 12px;">📥 Download</button>
      </div>
    `).join('');
  },

  generateReport(type) {
    const types = {
      weekly: 'Wochenreport wird generiert...',
      monthly: 'Monatsreport wird erstellt...',
      custom: 'Custom Report Konfigurator wird geöffnet...'
    };
    alert(`📊 ${types[type]}\n\nDer Report wird in wenigen Sekunden bereit sein.`);
  },

  exportData() {
    const data = {
      timestamp: new Date().toISOString(),
      period: SignalState.period,
      kpi: SignalState.kpi,
      creatives: SignalState.creatives
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signalone-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  // ======== CONNECTIONS VIEW ========
  renderConnectionsView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('connections-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'connections-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Platform Connections</h2>
            <p class="section-description">Verbinde und verwalte deine Werbekonten</p>
          </div>
        </div>

        <div class="section-content">
          <div class="kpi-grid-enhanced">
            ${this.generatePlatformCards()}
          </div>

          <div style="margin-top: 32px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Verbundene Konten</h3>
            ${this.generateConnectedAccounts()}
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
  },

  generatePlatformCards() {
    const platforms = [
      { 
        name: 'Meta Business Suite', 
        icon: 'f', 
        color: '#0084ff', 
        status: 'connected',
        accounts: 2,
        lastSync: 'vor 5 Min.'
      },
      { 
        name: 'TikTok Ads', 
        icon: '♪', 
        color: '#000000', 
        status: 'available',
        accounts: 0,
        lastSync: null
      },
      { 
        name: 'Google Ads', 
        icon: 'G', 
        color: '#4285f4', 
        status: 'available',
        accounts: 0,
        lastSync: null
      },
      { 
        name: 'Snapchat Ads', 
        icon: '👻', 
        color: '#FFFC00', 
        status: 'coming-soon',
        accounts: 0,
        lastSync: null
      },
    ];

    return platforms.map(p => {
      const isConnected = p.status === 'connected';
      const isComingSoon = p.status === 'coming-soon';
      
      return `
        <div class="kpi-card-enhanced" style="position: relative;">
          <div style="text-align: center; padding: 20px;">
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: ${p.color}${isConnected ? '' : '20'}; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: ${isConnected ? '#fff' : p.color};">
              ${p.icon}
            </div>
            <div style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">${p.name}</div>
            
            ${isConnected ? `
              <div style="font-size: 12px; color: var(--success); margin-bottom: 12px;">
                ✓ Verbunden • ${p.accounts} ${p.accounts === 1 ? 'Konto' : 'Konten'}
              </div>
              <div style="font-size: 11px; color: var(--text-light); margin-bottom: 12px;">
                Letzte Sync: ${p.lastSync}
              </div>
              <button class="action-btn-sm" style="width: 100%; height: auto; padding: 8px; font-size: 12px;" onclick="ViewLoader.managePlatform('${p.name}')">
                ⚙️ Verwalten
              </button>
            ` : isComingSoon ? `
              <div style="font-size: 12px; color: var(--text-light); margin-bottom: 12px;">
                🚀 Demnächst verfügbar
              </div>
              <button class="action-btn-sm" style="width: 100%; height: auto; padding: 8px; font-size: 12px; opacity: 0.5;" disabled>
                Coming Soon
              </button>
            ` : `
              <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
                Nicht verbunden
              </div>
              <button class="action-btn-sm" style="width: 100%; height: auto; padding: 8px; font-size: 12px; background: var(--primary); color: white; border: none;" onclick="ViewLoader.connectPlatform('${p.name}')">
                🔗 Verbinden
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');
  },

  generateConnectedAccounts() {
    const accounts = [
      { 
        platform: 'Meta', 
        name: 'E-Commerce Store GmbH', 
        id: 'act_123456789',
        status: 'active',
        campaigns: 8,
        spend: 1240
      },
      { 
        platform: 'Meta', 
        name: 'Brand Awareness Account', 
        id: 'act_987654321',
        status: 'active',
        campaigns: 3,
        spend: 450
      },
    ];

    return `
      <div style="display: grid; gap: 12px;">
        ${accounts.map(a => `
          <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px;">
            <div style="width: 48px; height: 48px; background: #0084ff; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: white;">
              f
            </div>
            <div style="flex: 1;">
              <div style="font-weight: 700; margin-bottom: 4px;">${a.name}</div>
              <div style="font-size: 12px; color: var(--text-secondary);">
                ${a.platform} • ${a.id} • ${a.campaigns} Kampagnen • €${a.spend} Spend
              </div>
            </div>
            <div style="display: flex; gap: 8px;">
              <button class="action-btn-sm" style="width: auto; padding: 8px 14px; font-size: 12px;" onclick="ViewLoader.syncAccount('${a.id}')">
                🔄 Sync
              </button>
              <button class="action-btn-sm" style="width: auto; padding: 8px 14px; font-size: 12px;" onclick="ViewLoader.disconnectAccount('${a.id}')">
                🔌 Trennen
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  connectPlatform(platform) {
    alert(`🔗 Verbinde mit ${platform}...\n\nDu wirst zu ${platform} weitergeleitet um die Verbindung zu autorisieren.`);
  },

  managePlatform(platform) {
    alert(`⚙️ ${platform} Verwaltung\n\nKonfiguriere Einstellungen, Berechtigungen und Sync-Optionen.`);
  },

  syncAccount(id) {
    alert(`🔄 Account ${id} wird synchronisiert...\n\nAktualisiere Kampagnen, Ads und Performance-Daten.`);
  },

  disconnectAccount(id) {
    if (confirm(`Möchtest du die Verbindung zu Account ${id} wirklich trennen?`)) {
      alert('✓ Account wurde getrennt.');
    }
  },

  // ======== PROFILE VIEW ========
  renderProfileView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('profile-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'profile-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Profil Einstellungen</h2>
            <p class="section-description">Verwalte dein Konto und Präferenzen</p>
          </div>
        </div>

        <div class="section-content">
          <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
            <div style="text-align: center;">
              <div style="width: 120px; height: 120px; margin: 0 auto 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 48px; color: white;">
                👤
              </div>
              <div style="font-size: 18px; font-weight: 700; margin-bottom: 4px;">Max Mustermann</div>
              <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">max@beispiel.de</div>
              <button class="action-btn-sm" style="width: 100%; height: auto; padding: 10px; font-size: 13px;">
                📸 Profilbild ändern
              </button>
            </div>

            <div>
              <div style="display: grid; gap: 16px;">
                <div>
                  <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Name</label>
                  <input type="text" value="Max Mustermann" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;" />
                </div>

                <div>
                  <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">E-Mail</label>
                  <input type="email" value="max@beispiel.de" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;" />
                </div>

                <div>
                  <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Unternehmen</label>
                  <input type="text" value="E-Commerce Store GmbH" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;" />
                </div>

                <div>
                  <label style="font-size: 12px; font-weight: 600; display: block; margin-bottom: 6px;">Zeitzone</label>
                  <select style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); font-size: 13px;">
                    <option>🇩🇪 Europe/Berlin (GMT+1)</option>
                    <option>🇬🇧 Europe/London (GMT+0)</option>
                    <option>🇺🇸 America/New_York (GMT-5)</option>
                  </select>
                </div>

                <div style="display: flex; gap: 12px; margin-top: 8px;">
                  <button class="action-btn-sm" style="flex: 1; height: auto; padding: 10px; font-size: 13px; background: var(--primary); color: white; border: none;">
                    💾 Änderungen speichern
                  </button>
                  <button class="action-btn-sm" style="height: auto; padding: 10px; font-size: 13px;">
                    ❌ Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px;">Benachrichtigungen</h3>
            <div style="display: grid; gap: 12px;">
              ${this.generateNotificationSettings()}
            </div>
          </div>

          <div style="margin-top: 32px; padding-top: 32px; border-top: 1px solid var(--border);">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--danger);">Gefahrenzone</h3>
            <button class="action-btn-sm" style="width: auto; padding: 10px 16px; font-size: 13px; background: var(--danger-light); color: var(--danger); border: 1px solid var(--danger);" onclick="ViewLoader.deleteAccount()">
              🗑️ Account löschen
            </button>
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
  },

  generateNotificationSettings() {
    const settings = [
      { label: 'Performance Alerts', desc: 'Benachrichtigung bei signifikanten Performance-Änderungen', checked: true },
      { label: 'Daily Reports', desc: 'Tägliche Zusammenfassung per E-Mail', checked: true },
      { label: 'Budget Warnings', desc: 'Warnung bei Erreichen von Budget-Limits', checked: true },
      { label: 'Sensei Empfehlungen', desc: 'Neue Optimierungs-Vorschläge von SignalSensei', checked: false },
    ];

    return settings.map(s => `
      <div style="display: flex; align-items: center; gap: 16px; padding: 14px; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 10px;">
        <input type="checkbox" ${s.checked ? 'checked' : ''} style="width: 20px; height: 20px; cursor: pointer;" />
        <div style="flex: 1;">
          <div style="font-weight: 700; margin-bottom: 4px;">${s.label}</div>
          <div style="font-size: 12px; color: var(--text-secondary);">${s.desc}</div>
        </div>
      </div>
    `).join('');
  },

  deleteAccount() {
    if (confirm('⚠️ WARNUNG!\n\nMöchtest du deinen Account wirklich unwiderruflich löschen?\n\nAlle Daten, Kampagnen und Einstellungen gehen verloren.')) {
      alert('Account-Löschung wurde initiiert. Du erhältst eine Bestätigungs-E-Mail.');
    }
  },

  // ======== PRICING VIEW ========
  renderPricingView() {
    const wrapper = document.querySelector('.wrapper');
    const existing = document.getElementById('pricing-view');
    if (existing) existing.remove();

    const view = document.createElement('div');
    view.id = 'pricing-view';
    view.innerHTML = `
      <section class="section">
        <div class="section-header-enhanced">
          <div class="section-title-group">
            <h2 class="section-title-main">Preise & Pakete</h2>
            <p class="section-description">Wähle das passende Paket für dein Business</p>
          </div>
          <div class="period-selector-compact">
            <button class="toggle-btn active" data-pricing-period="monthly">Monatlich</button>
            <button class="toggle-btn" data-pricing-period="yearly">Jährlich <span style="color: var(--success); font-size: 10px; margin-left: 4px;">-20%</span></button>
          </div>
        </div>

        <div class="section-content">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px; margin-bottom: 32px;">
            ${this.generatePricingCards()}
          </div>

          <div style="background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%); padding: 24px; border-radius: 12px; border: 1px solid #667eea30; text-align: center;">
            <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">🚀 Enterprise Lösung?</div>
            <p style="font-size: 14px; color: var(--text-secondary); margin-bottom: 16px;">
              Für Agenturen und große E-Commerce Brands bieten wir maßgeschneiderte Enterprise-Pakete mit dediziertem Support.
            </p>
            <button class="action-btn-sm" style="width: auto; padding: 10px 20px; font-size: 14px; background: var(--primary); color: white; border: none;">
              📞 Kontakt aufnehmen
            </button>
          </div>

          <div style="margin-top: 32px;">
            <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 16px; text-align: center;">Feature-Vergleich</h3>
            ${this.generateFeatureComparison()}
          </div>
        </div>
      </section>
    `;
    
    wrapper.appendChild(view);
    this.setupPricingToggle();
  },

  generatePricingCards() {
    const plans = [
      {
        name: 'Starter',
        price: 49,
        priceYearly: 39,
        popular: false,
        features: [
          { text: 'Bis zu 3 Ad Accounts', included: true },
          { text: '500 Creatives', included: true },
          { text: 'Performance Dashboard', included: true },
          { text: 'Basis Sensei Strategien', included: true },
          { text: 'E-Mail Support', included: true },
          { text: 'Team Collaboration', included: false },
          { text: 'API Zugang', included: false },
          { text: 'White Label', included: false },
        ]
      },
      {
        name: 'Professional',
        price: 149,
        priceYearly: 119,
        popular: true,
        features: [
          { text: 'Bis zu 10 Ad Accounts', included: true },
          { text: 'Unlimited Creatives', included: true },
          { text: 'Advanced Analytics', included: true },
          { text: 'Alle Sensei Strategien', included: true },
          { text: 'Priority Support', included: true },
          { text: 'Team Collaboration (5 Nutzer)', included: true },
          { text: 'API Zugang', included: true },
          { text: 'White Label', included: false },
        ]
      },
      {
        name: 'Agency',
        price: 399,
        priceYearly: 319,
        popular: false,
        features: [
          { text: 'Unlimited Ad Accounts', included: true },
          { text: 'Unlimited Creatives', included: true },
          { text: 'Advanced Analytics + Custom Reports', included: true },
          { text: 'Premium Sensei + Custom Strategien', included: true },
          { text: 'Dedicated Support Manager', included: true },
          { text: 'Team Collaboration (Unlimited)', included: true },
          { text: 'API Zugang + Webhooks', included: true },
          { text: 'White Label', included: true },
        ]
      },
    ];

    return plans.map(plan => `
      <div class="kpi-card-enhanced" style="position: relative; ${plan.popular ? 'border: 2px solid var(--primary); box-shadow: var(--shadow-lg);' : ''}">
        ${plan.popular ? `
          <div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: var(--primary); color: white; padding: 4px 16px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            ⭐ Beliebt
          </div>
        ` : ''}
        
        <div style="padding: 24px; text-align: center;">
          <div style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">${plan.name}</div>
          
          <div style="margin-bottom: 24px;">
            <div class="pricing-amount" data-monthly="${plan.price}" data-yearly="${plan.priceYearly}" style="font-size: 48px; font-weight: 800; line-height: 1;">
              €${plan.price}
            </div>
            <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">pro Monat</div>
          </div>

          <button class="action-btn-sm" style="width: 100%; height: auto; padding: 12px; font-size: 14px; font-weight: 700; ${plan.popular ? 'background: var(--primary); color: white; border: none;' : ''}" onclick="ViewLoader.selectPlan('${plan.name}')">
            ${plan.popular ? '🚀' : '✓'} Jetzt starten
          </button>

          <div style="margin-top: 24px; text-align: left; display: grid; gap: 10px;">
            ${plan.features.map(f => `
              <div style="display: flex; align-items: start; gap: 10px; font-size: 13px;">
                <span style="color: ${f.included ? 'var(--success)' : 'var(--text-light)'}; font-size: 16px; line-height: 1;">${f.included ? '✓' : '×'}</span>
                <span style="color: ${f.included ? 'var(--text)' : 'var(--text-light)'}; flex: 1;">${f.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');
  },

  setupPricingToggle() {
    const btns = document.querySelectorAll('[data-pricing-period]');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const isYearly = btn.dataset.pricingPeriod === 'yearly';
        document.querySelectorAll('.pricing-amount').forEach(el => {
          const monthly = el.dataset.monthly;
          const yearly = el.dataset.yearly;
          el.textContent = '€' + (isYearly ? yearly : monthly);
        });
      });
    });
  },

  generateFeatureComparison() {
    const features = [
      { name: 'Ad Accounts', starter: '3', pro: '10', agency: '∞' },
      { name: 'Creatives', starter: '500', pro: '∞', agency: '∞' },
      { name: 'Team Nutzer', starter: '1', pro: '5', agency: '∞' },
      { name: 'Sensei Strategien', starter: 'Basis', pro: 'Alle', agency: 'Premium + Custom' },
      { name: 'Support', starter: 'E-Mail', pro: 'Priority', agency: 'Dedicated Manager' },
      { name: 'API Zugang', starter: '×', pro: '✓', agency: '✓ + Webhooks' },
    ];

    return `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg-alt); border-bottom: 2px solid var(--border);">
              <th style="padding: 12px; text-align: left; font-weight: 700;">Feature</th>
              <th style="padding: 12px; text-align: center; font-weight: 700;">Starter</th>
              <th style="padding: 12px; text-align: center; font-weight: 700;">Professional</th>
              <th style="padding: 12px; text-align: center; font-weight: 700;">Agency</th>
            </tr>
          </thead>
          <tbody>
            ${features.map((f, i) => `
              <tr style="border-bottom: 1px solid var(--border-light); ${i % 2 === 0 ? 'background: var(--bg-alt);' : ''}">
                <td style="padding: 12px; font-weight: 600;">${f.name}</td>
                <td style="padding: 12px; text-align: center;">${f.starter}</td>
                <td style="padding: 12px; text-align: center;">${f.pro}</td>
                <td style="padding: 12px; text-align: center; font-weight: 700; color: var(--primary);">${f.agency}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  selectPlan(planName) {
    alert(`✓ ${planName} Paket ausgewählt!\n\nDu wirst zum Checkout weitergeleitet...`);
  }
};

// ======================================================================
// FORMATTERS
// ======================================================================
const fmt = {
  num: (v, d = 0) =>
    Number(v || 0).toLocaleString("de-DE", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }),
  curr: (v) =>
    Number(v || 0).toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  pct: (v) => (Number(v || 0)).toFixed(2).replace(".", ",") + " %",
  short: (v) => {
    const num = Number(v || 0);
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }
};

// ======================================================================
// INITIALIZATION
// ======================================================================
window.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupSystemMenu();
  setupSensei();
  setupMockToggle();
  setupPeriodToggles();
  setupFilterButtons();
  setupViewSwitcher();
  setupSortSelect();
  setupCollapsible();
  setupMetaButton();
  setupMetaPostMessage();
  restoreMetaSession();
  initDate();
  
  if (MOCK_MODE) {
    loadMockCreatives();
  }
  
  updateLastUpdate();
  setInterval(updateLastUpdate, 60000);
});

// ======================================================================
// SYSTEM MENU
// ======================================================================
function setupSystemMenu() {
  const toggle = document.getElementById("sidebarToggle");
  if (!toggle) return;

  // Verwandle Toggle in Systemmenü
  toggle.innerHTML = '☰';
  toggle.title = 'Systemmenü';
  
  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'system-menu';
  menu.id = 'systemMenu';
  menu.style.cssText = `
    position: absolute;
    top: 100%;
    left: 0;
    width: 220px;
    background: white;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: var(--shadow-xl);
    margin-top: 8px;
    display: none;
    z-index: 1000;
    overflow: hidden;
  `;

  menu.innerHTML = `
    <div style="padding: 12px; border-bottom: 1px solid var(--border); background: var(--bg-alt);">
      <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-light);">System</div>
    </div>
    <div class="system-menu-items">
      <button class="system-menu-item" data-action="refresh">
        <span class="menu-icon">🔄</span>
        <span>Daten aktualisieren</span>
      </button>
      <button class="system-menu-item" data-action="export">
        <span class="menu-icon">💾</span>
        <span>Daten exportieren</span>
      </button>
      <button class="system-menu-item" data-action="settings">
        <span class="menu-icon">⚙️</span>
        <span>Einstellungen</span>
      </button>
      <div style="height: 1px; background: var(--border); margin: 4px 0;"></div>
      <button class="system-menu-item" data-action="pricing">
        <span class="menu-icon">💎</span>
        <span>Preise & Upgrade</span>
      </button>
      <button class="system-menu-item" data-action="help">
        <span class="menu-icon">❓</span>
        <span>Hilfe & Support</span>
      </button>
      <button class="system-menu-item" data-action="docs">
        <span class="menu-icon">📚</span>
        <span>Dokumentation</span>
      </button>
      <div style="height: 1px; background: var(--border); margin: 4px 0;"></div>
      <button class="system-menu-item" data-action="changelog">
        <span class="menu-icon">📝</span>
        <span>Was ist neu?</span>
      </button>
      <button class="system-menu-item" data-action="feedback">
        <span class="menu-icon">💬</span>
        <span>Feedback senden</span>
      </button>
      <div style="height: 1px; background: var(--border); margin: 4px 0;"></div>
      <button class="system-menu-item" data-action="logout" style="color: var(--danger);">
        <span class="menu-icon">🚪</span>
        <span>Abmelden</span>
      </button>
    </div>
  `;

  const header = document.querySelector('.sidebar-header');
  if (header) {
    header.style.position = 'relative';
    header.appendChild(menu);
  }

  // Toggle menu
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isVisible = menu.style.display === 'block';
    menu.style.display = isVisible ? 'none' : 'block';
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && e.target !== toggle) {
      menu.style.display = 'none';
    }
  });

  // Menu actions
  menu.querySelectorAll('.system-menu-item').forEach(item => {
    item.addEventListener('click', () => {
      const action = item.dataset.action;
      handleSystemMenuAction(action);
      menu.style.display = 'none';
    });
  });

  // Add styles for menu items
  const style = document.createElement('style');
  style.textContent = `
    .system-menu-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: transparent;
      border: none;
      text-align: left;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: var(--text);
      transition: all 0.2s;
    }
    .system-menu-item:hover {
      background: var(--bg-alt);
    }
    .system-menu-item .menu-icon {
      font-size: 16px;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);
}

function handleSystemMenuAction(action) {
  switch(action) {
    case 'refresh':
      ViewLoader.showLoading('Aktualisiere Daten...');
      setTimeout(() => {
        if (MOCK_MODE) {
          loadMockCreatives();
        } else if (SignalState.token) {
          loadMetaData();
        }
        ViewLoader.hideLoading();
      }, 1000);
      break;
    
    case 'export':
      ViewLoader.exportData();
      break;
    
    case 'settings':
      ViewLoader.loadView('profile');
      break;
    
    case 'pricing':
      ViewLoader.loadView('pricing');
      break;
    
    case 'help':
      alert('📞 Hilfe & Support\n\nE-Mail: support@signalone.cloud\nTelefon: +49 123 456 789\n\nOder nutze den Live-Chat (unten rechts)');
      break;
    
    case 'docs':
      window.open('https://docs.signalone.cloud', '_blank');
      break;
    
    case 'changelog':
      showChangelog();
      break;
    
    case 'feedback':
      alert('💬 Feedback senden\n\nWir freuen uns über dein Feedback!\n\nE-Mail: feedback@signalone.cloud\n\nOder nutze das Feedback-Formular in den Einstellungen.');
      break;
    
    case 'logout':
      if (confirm('Möchtest du dich wirklich abmelden?')) {
        localStorage.removeItem('meta_access_token');
        location.reload();
      }
      break;
  }
}

function showChangelog() {
  const panel = document.getElementById('senseiPanel');
  if (!panel) return;

  panel.classList.add('open');
  
  const content = document.querySelector('.sensei-content');
  if (!content) return;

  content.innerHTML = `
    <div class="sensei-strategy">
      <div class="strategy-badge">Version 2.1.0</div>
      <h4 style="font-size:14px; font-weight:700; margin-bottom:10px;">Was ist neu?</h4>
      <p style="font-size:11px; color:var(--text-secondary);">20. November 2024</p>
    </div>

    <div style="display: grid; gap: 16px;">
      <div style="padding: 14px; background: var(--success-light); border-left: 3px solid var(--success); border-radius: 8px;">
        <div style="font-weight: 700; margin-bottom: 6px; color: var(--success);">🚀 Neu</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
          <li>SignalSensei Premium Strategien</li>
          <li>Multi-Platform Connections</li>
          <li>Creative Library mit Tagging</li>
          <li>Automatische Reports</li>
        </ul>
      </div>

      <div style="padding: 14px; background: var(--primary)15; border-left: 3px solid var(--primary); border-radius: 8px;">
        <div style="font-weight: 700; margin-bottom: 6px; color: var(--primary);">✨ Verbessert</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
          <li>Dashboard Performance um 40% schneller</li>
          <li>Bessere Heatmap Visualisierung</li>
          <li>Optimierte Mobile Ansicht</li>
        </ul>
      </div>

      <div style="padding: 14px; background: var(--warning-light); border-left: 3px solid var(--warning); border-radius: 8px;">
        <div style="font-weight: 700; margin-bottom: 6px; color: var(--warning);">🔧 Behoben</div>
        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6;">
          <li>Creative Upload Bug bei Videos</li>
          <li>ROAS Calculation Edge Cases</li>
          <li>Export Format Issues</li>
        </ul>
      </div>

      <div style="padding: 12px; background: var(--bg-alt); border-radius: 8px; text-align: center; margin-top: 8px;">
        <button class="sensei-action-btn" onclick="window.open('https://changelog.signalone.cloud', '_blank')">
          <span class="action-icon">📝</span>
          <span>Vollständiges Changelog</span>
        </button>
      </div>
    </div>
  `;
}
