// packages/creativeLibrary/index.js
import DataLayer from "../data/index.js";

/* ==========================================
   CREATIVE LIBRARY MODULE - FIXED VERSION
========================================== */

export async function init(ctx = {}) {
  const section = document.getElementById("creativeLibraryView");
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
  
  // Simuliere Lade-Verzögerung
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Daten laden
  let creatives = [];
  try {
    if (isDemo) {
      creatives = DemoData.creatives || [];
    } else {
      const accountId = AppState?.selectedBrandId || AppState?.meta?.accountId || "demo";
      const result = await DataLayer.fetchCreativesForAccount({ accountId, preferLive: !isDemo });
      creatives = result.items || [];
    }
  } catch (err) {
    console.error("[CreativeLibrary] Error:", err);
    section.innerHTML = renderError();
    return;
  }
  
  // Render Grid
  section.innerHTML = renderCreativeGrid(creatives, isDemo);
  wireCreativeCards();
}

function renderSkeleton() {
  return `
    <div class="view-header">
      <h2>CREATIVE LIBRARY</h2>
      <p class="view-subline">Lade Creatives...</p>
    </div>
    <div class="view-body">
      <div class="skeleton-grid">
        ${Array(6).fill(`
          <div class="skeleton-card">
            <div class="skeleton-loader" style="height:200px;"></div>
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderError() {
  return `
    <div class="view-header">
      <h2>CREATIVE LIBRARY</h2>
    </div>
    <div class="view-body">
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Creatives konnten nicht geladen werden</div>
        <button class="btn-retry" onclick="window.SignalOne.navigateTo('creativeLibrary')">🔄 Erneut versuchen</button>
      </div>
    </div>
  `;
}

function renderCreativeGrid(creatives, isDemo) {
  if (!creatives || !creatives.length) {
    return `
      <div class="view-header">
        <h2>CREATIVE LIBRARY</h2>
        <p class="view-subline">${isDemo ? 'Demo Mode' : 'Live Mode'}</p>
      </div>
      <div class="view-body">
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <div class="empty-message">Noch keine Creatives vorhanden</div>
          <button class="btn-primary" onclick="window.SignalOne.navigateTo('sensei')">Creative erstellen</button>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="view-header">
      <h2>CREATIVE LIBRARY</h2>
      <p class="view-subline">${creatives.length} Creatives • ${isDemo ? 'Demo Mode' : 'Live Mode'}</p>
    </div>
    
    <div class="view-body">
      <div class="creative-filter-bar">
        <button class="filter-btn active" data-filter="all">Alle</button>
        <button class="filter-btn" data-filter="winner">Winner</button>
        <button class="filter-btn" data-filter="testing">Testing</button>
        <button class="filter-btn" data-filter="loser">Loser</button>
      </div>
      
      <div class="creative-grid">
        ${creatives.map(c => renderCreativeCard(c)).join('')}
      </div>
    </div>
  `;
}

function renderCreativeCard(creative) {
  const performanceColor = {
    'Winner': '#22c55e',
    'Testing': '#f59e0b',
    'Loser': '#ef4444'
  }[creative.performance] || '#6b7280';
  
  return `
    <div class="creative-card" data-creative-id="${creative.id}" data-performance="${creative.performance?.toLowerCase() || 'all'}">
      <div class="creative-thumbnail">
        <img 
          src="${creative.thumbnail || 'data:image/svg+xml,%3Csvg width=\'280\' height=\'350\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'%23e2e8f0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' fill=\'%236b7280\' font-size=\'14\' font-family=\'system-ui\'%3E🎬 ${creative.type || 'Creative'}%3C/text%3E%3C/svg%3E'}"
          alt="${creative.name}"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,%3Csvg width=\\'280\\' height=\\'350\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' fill=\\'%23e2e8f0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' text-anchor=\\'middle\\' fill=\\'%236b7280\\' font-size=\\'14\\'%3E❌ Fehler%3C/text%3E%3C/svg%3E';"
        />
        <div class="creative-badge" style="background:${performanceColor};">
          ${creative.performance || 'Testing'}
        </div>
      </div>
      
      <div class="creative-meta">
        <h4 class="creative-name">${escapeHtml(creative.name)}</h4>
        <p class="creative-hook">${escapeHtml(creative.hook || 'Kein Hook')}</p>
        
        <div class="creative-metrics">
          <div class="metric-item">
            <span class="metric-label">ROAS:</span>
            <span class="metric-value">${formatNumber(creative.roas, 1)}x</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Spend:</span>
            <span class="metric-value">${formatCurrency(creative.spend)}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">CTR:</span>
            <span class="metric-value">${formatPercent(creative.ctr * 100, 2)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function wireCreativeCards() {
  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter cards
      document.querySelectorAll('.creative-card').forEach(card => {
        if (filter === 'all' || card.dataset.performance === filter) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
  
  // Card Clicks
  document.querySelectorAll('.creative-card').forEach(card => {
    card.addEventListener('click', () => {
      const id = card.dataset.creativeId;
      console.log('[CreativeLibrary] Clicked:', id);
      // TODO: Open detail modal
    });
  });
}

// Helper Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

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
