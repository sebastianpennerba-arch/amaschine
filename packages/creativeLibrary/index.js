// packages/creativeLibrary/index.js - PREMIUM FULL VERSION

import DataLayer from "../data/index.js";

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
  
  // Progressive Loading
  section.innerHTML = renderSkeleton();
  
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Load creatives
  let creatives = [];
  try {
    if (isDemo) {
      creatives = DemoData.creatives || [];
    } else {
      const accountId = AppState?.selectedBrandId || "demo";
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
  wireCreativeLibrary();
}

function renderSkeleton() {
  return `
    <div class="view-header">
      <h2>CREATIVE LIBRARY</h2>
      <p class="view-subline">Lade Creatives...</p>
    </div>
    <div class="view-body">
      <div class="skeleton-filter-bar">
        ${Array(5).fill('<div class="skeleton-pill"></div>').join('')}
      </div>
      <div class="skeleton-grid">
        ${Array(6).fill(`
          <div class="skeleton-card">
            <div class="skeleton-loader" style="height:240px;"></div>
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
          <p class="empty-hint">${isDemo ? 'Demo-Daten konnten nicht geladen werden' : 'Verbinde Meta oder aktiviere Demo-Modus'}</p>
          <button class="btn-primary" onclick="window.SignalOne.navigateTo('sensei')">Creative analysieren</button>
        </div>
      </div>
    `;
  }
  
  // Stats berechnen
  const stats = {
    total: creatives.length,
    winners: creatives.filter(c => c.performance === 'Winner').length,
    testing: creatives.filter(c => c.performance === 'Testing').length,
    losers: creatives.filter(c => c.performance === 'Loser').length,
    totalSpend: creatives.reduce((sum, c) => sum + (c.spend || 0), 0),
    avgRoas: creatives.reduce((sum, c) => sum + (c.roas || 0), 0) / creatives.length
  };
  
  return `
    <div class="view-header">
      <h2>🎬 CREATIVE LIBRARY</h2>
      <p class="view-subline">
        ${stats.total} Creatives • 
        ${stats.winners} Winner • 
        ${stats.testing} Testing • 
        Ø ROAS ${stats.avgRoas.toFixed(1)}x • 
        ${isDemo ? '<span style="color:#f59e0b;">Demo Mode</span>' : '<span style="color:#22c55e;">Live Mode</span>'}
      </p>
    </div>
    
    <div class="view-body">
      ${renderFilterBar(stats)}
      ${renderSortBar()}
      ${renderCreativeCardsGrid(creatives)}
    </div>
  `;
}

function renderFilterBar(stats) {
  return `
    <div class="creative-filter-bar">
      <button class="filter-btn active" data-filter="all">
        <span class="filter-icon">📊</span>
        <span class="filter-label">Alle</span>
        <span class="filter-count">${stats.total}</span>
      </button>
      <button class="filter-btn" data-filter="winner">
        <span class="filter-icon">🏆</span>
        <span class="filter-label">Winner</span>
        <span class="filter-count">${stats.winners}</span>
      </button>
      <button class="filter-btn" data-filter="testing">
        <span class="filter-icon">🧪</span>
        <span class="filter-label">Testing</span>
        <span class="filter-count">${stats.testing}</span>
      </button>
      <button class="filter-btn" data-filter="loser">
        <span class="filter-icon">📉</span>
        <span class="filter-label">Loser</span>
        <span class="filter-count">${stats.losers}</span>
      </button>
    </div>
  `;
}

function renderSortBar() {
  return `
    <div class="creative-sort-bar">
      <label>Sortieren:</label>
      <select class="sort-select" id="creativeSortSelect">
        <option value="roas-desc">ROAS (höchste zuerst)</option>
        <option value="roas-asc">ROAS (niedrigste zuerst)</option>
        <option value="spend-desc">Spend (höchste zuerst)</option>
        <option value="spend-asc">Spend (niedrigste zuerst)</option>
        <option value="ctr-desc">CTR (höchste zuerst)</option>
        <option value="date-desc">Neueste zuerst</option>
      </select>
    </div>
  `;
}

function renderCreativeCardsGrid(creatives) {
  return `
    <div class="creative-grid" id="creativeGrid">
      ${creatives.map(c => renderCreativeCard(c)).join('')}
    </div>
  `;
}

function renderCreativeCard(creative) {
  const performanceColor = {
    'Winner': '#22c55e',
    'Testing': '#f59e0b',
    'Loser': '#ef4444'
  }[creative.performance] || '#6b7280';
  
  const performanceIcon = {
    'Winner': '🏆',
    'Testing': '🧪',
    'Loser': '📉'
  }[creative.performance] || '📊';
  
  return `
    <div class="creative-card" 
         data-creative-id="${creative.id}" 
         data-performance="${(creative.performance || 'testing').toLowerCase()}"
         data-roas="${creative.roas || 0}"
         data-spend="${creative.spend || 0}"
         data-ctr="${creative.ctr || 0}">
      
      <div class="creative-thumbnail">
        <img 
          src="${creative.thumbnail || generatePlaceholder(creative)}"
          alt="${creative.name}"
          loading="lazy"
          onerror="this.src='${generatePlaceholder(creative)}';"
        />
        <div class="creative-overlay">
          <button class="btn-overlay" onclick="viewCreativeDetails('${creative.id}')">
            <span>👁️ Details</span>
          </button>
          <button class="btn-overlay" onclick="analyzeCreative('${creative.id}')">
            <span>🤖 Sensei</span>
          </button>
        </div>
        <div class="creative-badge" style="background:${performanceColor};">
          ${performanceIcon} ${creative.performance || 'Testing'}
        </div>
      </div>
      
      <div class="creative-meta">
        <h4 class="creative-name" title="${escapeHtml(creative.name)}">${escapeHtml(creative.name)}</h4>
        
        <div class="creative-tags">
          <span class="tag tag-hook">${escapeHtml(creative.hook || 'Kein Hook')}</span>
          <span class="tag tag-type">${escapeHtml(creative.type || 'Unknown')}</span>
        </div>
        
        <div class="creative-creator">
          <span class="creator-icon">👤</span>
          <span class="creator-name">${escapeHtml(creative.creator || 'Unknown')}</span>
        </div>
        
        <div class="creative-metrics">
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">ROAS</span>
              <span class="metric-value ${creative.roas >= 4 ? 'success' : creative.roas >= 3 ? 'warning' : 'danger'}">
                ${formatNumber(creative.roas, 1)}x
              </span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Spend</span>
              <span class="metric-value">${formatCurrency(creative.spend)}</span>
            </div>
          </div>
          <div class="metric-row">
            <div class="metric-item">
              <span class="metric-label">CTR</span>
              <span class="metric-value">${formatPercent(creative.ctr * 100, 2)}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">CPM</span>
              <span class="metric-value">${formatCurrency(creative.cpm)}</span>
            </div>
          </div>
        </div>
        
        ${creative.daysActive ? `<div class="creative-days">📅 ${creative.daysActive} Tage aktiv</div>` : ''}
      </div>
    </div>
  `;
}

function wireCreativeLibrary() {
  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      
      // Update active state
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter cards
      filterCreatives(filter);
    });
  });
  
  // Sort Select
  const sortSelect = document.getElementById('creativeSortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortCreatives(e.target.value);
    });
  }
  
  // Card hover effects
  document.querySelectorAll('.creative-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.querySelector('.creative-overlay')?.classList.add('visible');
    });
    card.addEventListener('mouseleave', () => {
      card.querySelector('.creative-overlay')?.classList.remove('visible');
    });
  });
}

function filterCreatives(filter) {
  const cards = document.querySelectorAll('.creative-card');
  cards.forEach(card => {
    const performance = card.dataset.performance;
    if (filter === 'all' || performance === filter) {
      card.style.display = 'flex';
      setTimeout(() => card.classList.add('visible'), 10);
    } else {
      card.classList.remove('visible');
      setTimeout(() => card.style.display = 'none', 200);
    }
  });
}

function sortCreatives(sortBy) {
  const grid = document.getElementById('creativeGrid');
  if (!grid) return;
  
  const cards = Array.from(grid.querySelectorAll('.creative-card'));
  
  cards.sort((a, b) => {
    const [field, direction] = sortBy.split('-');
    const aVal = parseFloat(a.dataset[field]) || 0;
    const bVal = parseFloat(b.dataset[field]) || 0;
    
    return direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
  
  // Re-append in new order
  cards.forEach(card => grid.appendChild(card));
}

function generatePlaceholder(creative) {
  const colors = {
    'Winner': '22c55e',
    'Testing': 'f59e0b',
    'Loser': 'ef4444'
  };
  const color = colors[creative.performance] || '6b7280';
  const text = encodeURIComponent(creative.type || 'Creative');
  return `data:image/svg+xml,%3Csvg width='280' height='350' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23${color}' opacity='0.1'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='%23${color}' font-size='14' font-family='system-ui'%3E🎬 ${text}%3C/text%3E%3C/svg%3E`;
}

// Global functions for onclick handlers
window.viewCreativeDetails = function(id) {
  console.log('[CreativeLibrary] View details:', id);
  // TODO: Open modal
  alert(`Details für Creative ${id} - Coming soon!`);
};

window.analyzeCreative = function(id) {
  console.log('[CreativeLibrary] Analyze:', id);
  window.SignalOne?.navigateTo('sensei');
};

// Helper functions
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
