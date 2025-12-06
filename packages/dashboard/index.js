// packages/dashboard/index.js
import DataLayer from "../data/index.js";

/* ==========================================
   DASHBOARD MODULE - FIXED VERSION
========================================== */

export async function init(ctx = {}) {
  const section = document.getElementById("dashboardView");
  if (!section) return;
  
  const { AppState, DemoData, useDemoMode } = ctx;
  const isDemo = typeof useDemoMode === "function" ? useDemoMode() : true;
  
  await render(section, AppState, { useDemoMode: isDemo, DemoData });
}

async function render(section, AppState, opts = {}) {
  if (!section) return;
  
  const isDemo = !!opts.useDemoMode;
  const DemoData = opts.DemoData || {};
  
  // Skeleton anzeigen
  section.innerHTML = renderSkeleton();
  
  // Daten laden
  let summary = null;
  try {
    if (isDemo) {
      summary = buildDemoSummary(DemoData);
    } else {
      const accountId = AppState?.selectedBrandId || AppState?.meta?.accountId || "demo";
      summary = await DataLayer.fetchDashboardSummary({ accountId, preferLive: !isDemo });
    }
  } catch (err) {
    console.error("[Dashboard] Error:", err);
    section.innerHTML = renderError();
    return;
  }
  
  // Dashboard rendern
  section.innerHTML = renderDashboard(summary, isDemo);
  wireTabs();
}

function buildDemoSummary(DemoData) {
  // Wenn DemoData mit Brands kommt, nimm echte Aggregation
  const brands = DemoData?.brands || [];

  if (brands.length > 0) {
    const totalSpend = brands.reduce((sum, b) => sum + (b.spend30d || 0), 0);
    const totalRevenue = brands.reduce((sum, b) => sum + (b.revenue30d || 0), 0);
    const totalPurchases = brands.reduce((sum, b) => sum + (b.purchases30d || 0), 0);

    const avgRoas =
      brands.reduce((sum, b) => sum + (b.roas30d || 0), 0) /
      Math.max(brands.length, 1);

    const avgCtr =
      brands.reduce((sum, b) => sum + (b.ctr30d || 0), 0) /
      Math.max(brands.length, 1);

    const avgCpm =
      brands.reduce((sum, b) => sum + (b.cpm30d || 0), 0) /
      Math.max(brands.length, 1);

    const sortedByRoas = [...brands].sort(
      (a, b) => (b.roas30d || 0) - (a.roas30d || 0)
    );

    return {
      metrics: {
        spend30d: totalSpend,
        revenue30d: totalRevenue,
        roas30d: avgRoas,
        ctr30d: avgCtr,
        cpm30d: avgCpm,
        purchases30d: totalPurchases,
      },
      alerts: {
        level: "good",
        items: [
          {
            severity: "info",
            title: "Demo-Modus aktiv",
            message:
              "Du siehst konsolidierte Demo-Daten aus mehreren DTC-Brands.",
          },
        ],
      },
      bestCampaign: sortedByRoas[0]
        ? {
            name: sortedByRoas[0].name,
            roas: sortedByRoas[0].roas30d,
            spend: sortedByRoas[0].spend30d,
          }
        : null,
      worstCampaign: sortedByRoas[sortedByRoas.length - 1]
        ? {
            name: sortedByRoas[sortedByRoas.length - 1].name,
            roas: sortedByRoas[sortedByRoas.length - 1].roas30d,
            spend: sortedByRoas[sortedByRoas.length - 1].spend30d,
          }
        : null,
      bestCreative: DemoData?.creatives?.[0] || null,
      worstCreative:
        DemoData?.creatives?.[DemoData.creatives.length - 1] || null,
    };
  }

  // Fallback: HARDCODED DEMO-ZAHLEN, falls irgendwas mit DemoData schiefgeht
  return {
    metrics: {
      spend30d: 36500,
      revenue30d: 124750,
      roas30d: 3.42,
      ctr30d: 1.8,
      cpm30d: 8.5,
      purchases30d: 2570,
    },
    alerts: {
      level: "good",
      items: [
        {
          severity: "info",
          title: "Demo-Modus aktiv",
          message:
            "Fallback-Demo-Zahlen werden angezeigt, weil DemoData leer ist.",
        },
      ],
    },
    bestCampaign: {
      name: "FrischNova Scale",
      roas: 4.1,
      spend: 18000,
    },
    worstCampaign: {
      name: "Hotel Prospector",
      roas: 2.3,
      spend: 8000,
    },
    bestCreative: {
      name: "Hook V5 Kitchen",
      roas: 5.2,
    },
    worstCreative: {
      name: "UGC Test A",
      roas: 3.0,
    },
  };
}

function renderSkeleton() {
  return `
    <div class="view-header">
      <h2>DASHBOARD OVERVIEW</h2>
      <p class="view-subline">Lädt Dashboard-Daten...</p>
    </div>
    <div class="view-body">
      <div class="skeleton-grid" style="grid-template-columns: repeat(4, 1fr);">
        ${Array(4).fill('<div class="skeleton-card"><div class="skeleton-loader" style="height:100px;"></div></div>').join('')}
      </div>
    </div>
  `;
}

function renderError() {
  return `
    <div class="view-header">
      <h2>DASHBOARD OVERVIEW</h2>
    </div>
    <div class="view-body">
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Dashboard konnte nicht geladen werden</div>
        <button class="btn-retry" onclick="window.location.reload()">🔄 Erneut versuchen</button>
      </div>
    </div>
  `;
}

function renderDashboard(summary, isDemo) {
  const m = summary.metrics || {};
  
  return `
    <div class="view-header">
      <h2>DASHBOARD OVERVIEW</h2>
      <p class="view-subline">
        <strong>Brand:</strong> ${summary.brandName || 'Demo Brand'} • 
        <strong>Account:</strong> ${summary.accountName || 'Demo User'} • 
        ${isDemo ? '<span style="color:#f59e0b;">Demo Mode</span>' : '<span style="color:#22c55e;">Live Mode</span>'}
      </p>
    </div>
    
    <div class="view-body">
      ${renderLaunchStatus()}
      ${renderKPIs(m)}
      ${renderAlerts(summary.alerts)}
      ${renderTopPerformers(summary)}
    </div>
  `;
}

function renderLaunchStatus() {
  return `
    <div class="dashboard-section">
      <h3>Launch-Status</h3>
      <div class="launch-status-bar">
        <div class="launch-status-fill" style="width: 80%;">80%</div>
      </div>
      <p style="font-size:0.85rem;color:#6b7280;margin-top:8px;">Launch-ready • 80% • 4 von 5 Modulen aktiv</p>
    </div>
  `;
}

function renderKPIs(metrics) {
  return `
    <div class="dashboard-section">
      <h3>Kern-KPIs (30 Tage)</h3>
      <div class="kpi-grid">
        ${renderKPI('Spend', formatCurrency(metrics.spend30d), 'primary')}
        ${renderKPI('Umsatz', formatCurrency(metrics.revenue30d), 'success')}
        ${renderKPI('ROAS', formatNumber(metrics.roas30d, 1) + 'x', metrics.roas30d >= 3 ? 'success' : 'warning')}
        ${renderKPI('CTR', formatPercent(metrics.ctr30d * 100, 2), 'primary')}
      </div>
    </div>
  `;
}

function renderKPI(label, value, tone = 'primary') {
  const colors = {
    primary: '#3b82f6',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444'
  };
  
  return `
    <div class="kpi-card">
      <div class="kpi-label">${label}</div>
      <div class="kpi-value" style="color:${colors[tone]};">${value}</div>
    </div>
  `;
}

function renderAlerts(alerts) {
  if (!alerts || !alerts.items || !alerts.items.length) {
    return `
      <div class="dashboard-section">
        <h3>Health & Alerts</h3>
        <div class="empty-state" style="padding:40px;">
          <div class="empty-icon" style="font-size:2rem;">✓</div>
          <div class="empty-message">Aktuell keine kritischen Warnsignale – dein Account läuft stabil.</div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="dashboard-section">
      <h3>Health & Alerts</h3>
      ${alerts.items.map(a => `
        <div class="alert-card alert-${a.severity}">
          <strong>${a.title}</strong>
          <p>${a.message}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTopPerformers(summary) {
  return `
    <div class="dashboard-section">
      <h3>Top & Bottom Performers</h3>
      <div class="performers-grid">
        <div class="performer-card">
          <div class="performer-label">🏆 Beste Kampagne</div>
          <div class="performer-name">${summary.bestCampaign?.name || '–'}</div>
          <div class="performer-metric">ROAS: ${formatNumber(summary.bestCampaign?.roas, 1) || '–'}x</div>
        </div>
        <div class="performer-card">
          <div class="performer-label">⚠️ Schwächste Kampagne</div>
          <div class="performer-name">${summary.worstCampaign?.name || '–'}</div>
          <div class="performer-metric">ROAS: ${formatNumber(summary.worstCampaign?.roas, 1) || '–'}x</div>
        </div>
      </div>
    </div>
  `;
}

function wireTabs() {
  // Tab-Logik hier wenn nötig
}

// Helper Functions
function formatCurrency(value) {
  if (value == null || isNaN(value)) return '–';
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatNumber(value, decimals = 0) {
  if (value == null || isNaN(value)) return '–';
  return value.toFixed(decimals);
}

function formatPercent(value, decimals = 1) {
  if (value == null || isNaN(value)) return '–';
  return `${value.toFixed(decimals)}%`;
}
