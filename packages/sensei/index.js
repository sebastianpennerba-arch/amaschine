// packages/sensei/index.js - PREMIUM VERSION

import DataLayer from "../data/index.js";

export async function init(ctx = {}) {
  const section = document.getElementById("senseiView");
  if (!section) return;
  
  const { AppState, DemoData, useDemoMode } = ctx;
  const isDemo = typeof useDemoMode === "function" ? useDemoMode() : true;
  
  await render(section, AppState, { useDemoMode: isDemo, DemoData });
}

async function render(section, AppState, opts = {}) {
  if (!section) return;
  
  const isDemo = !!opts.useDemoMode;
  const DemoData = opts.DemoData || {};
  
  // Skeleton
  section.innerHTML = renderSkeleton();
  
  // Simulate AI analysis delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  // Load data
  let analysis = null;
  try {
    if (isDemo) {
      analysis = DemoData.senseiAnalysis || buildDemoAnalysis(DemoData);
    } else {
      analysis = await DataLayer.fetchSenseiAnalysis({ preferLive: !isDemo });
    }
  } catch (err) {
    console.error("[Sensei] Error:", err);
    section.innerHTML = renderError();
    return;
  }
  
  // Render
  section.innerHTML = renderSenseiDashboard(analysis, isDemo);
  wireSenseiInteractions();
}

function renderSkeleton() {
  return `
    <div class="view-header">
      <h2>SENSEI AI SUITE</h2>
      <p class="view-subline">🤖 KI analysiert deine Creatives...</p>
    </div>
    <div class="view-body">
      <div class="sensei-loading">
        <div class="ai-avatar">
          <div class="ai-pulse"></div>
          <span class="ai-icon">🤖</span>
        </div>
        <div class="loading-steps">
          <div class="step active">✓ Creatives laden</div>
          <div class="step active">✓ Performance-Metriken analysieren</div>
          <div class="step active">⏳ Hook-Patterns erkennen</div>
          <div class="step">⏳ Empfehlungen generieren</div>
        </div>
      </div>
    </div>
  `;
}

function renderError() {
  return `
    <div class="view-header">
      <h2>SENSEI AI SUITE</h2>
    </div>
    <div class="view-body">
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">Sensei-Analyse konnte nicht geladen werden</div>
        <button class="btn-retry" onclick="window.SignalOne.navigateTo('sensei')">🔄 Erneut versuchen</button>
      </div>
    </div>
  `;
}

function renderSenseiDashboard(analysis, isDemo) {
  const perf = analysis.performance || {};
  const summary = perf.summary || {};
  const scoring = perf.scoring || [];
  const recommendations = perf.recommendations || [];
  
  return `
    <div class="view-header">
      <h2>🤖 SENSEI AI SUITE</h2>
      <p class="view-subline">
        KI-gestützte Creative-Analyse • 
        ${scoring.length} Creatives analysiert • 
        ${isDemo ? '<span style="color:#f59e0b;">Demo Mode</span>' : '<span style="color:#22c55e;">Live Mode</span>'}
      </p>
    </div>
    
    <div class="view-body">
      ${renderPerformanceSummary(summary)}
      ${renderCreativeScoring(scoring)}
      ${renderRecommendations(recommendations)}
    </div>
  `;
}

function renderPerformanceSummary(summary) {
  return `
    <div class="sensei-section">
      <h3>📊 Performance Overview</h3>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Gesamt Spend</div>
          <div class="metric-value">${formatCurrency(summary.totalSpend)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Gesamt Revenue</div>
          <div class="metric-value success">${formatCurrency(summary.totalRevenue)}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg. ROAS</div>
          <div class="metric-value ${summary.avgRoas >= 4 ? 'success' : 'warning'}">${formatNumber(summary.avgRoas, 1)}x</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Avg. Score</div>
          <div class="metric-value">${Math.round(summary.avgScore)}/100</div>
        </div>
      </div>
    </div>
  `;
}

function renderCreativeScoring(scoring) {
  if (!scoring || !scoring.length) {
    return '<div class="sensei-section"><p>Keine Creatives zur Analyse gefunden.</p></div>';
  }
  
  return `
    <div class="sensei-section">
      <h3>🎯 Creative Scoring</h3>
      <div class="scoring-list">
        ${scoring.map(s => `
          <div class="scoring-card scoring-${s.tone}">
            <div class="scoring-header">
              <div class="scoring-badge badge-${s.tone}">${s.label}</div>
              <div class="scoring-score">${s.score}/100</div>
            </div>
            <h4 class="scoring-name">${escapeHtml(s.name)}</h4>
            <p class="scoring-reason">${escapeHtml(s.reasoning)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderRecommendations(recommendations) {
  if (!recommendations || !recommendations.length) {
    return '<div class="sensei-section"><p>Keine Empfehlungen verfügbar.</p></div>';
  }
  
  return `
    <div class="sensei-section">
      <h3>💡 Sensei Empfehlungen</h3>
      <div class="recommendations-list">
        ${recommendations.map(r => `
          <div class="recommendation-card priority-${r.priority}">
            <div class="rec-header">
              <span class="rec-icon">${getRecommendationIcon(r.type)}</span>
              <span class="rec-priority badge-${r.priority}">${r.priority}</span>
            </div>
            <h4 class="rec-title">${escapeHtml(r.title)}</h4>
            <p class="rec-message">${escapeHtml(r.message)}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getRecommendationIcon(type) {
  const icons = {
    budget_shift: '💰',
    testing: '🧪',
    kill: '🔪',
    scale: '📈',
    hook_winners: '🎯'
  };
  return icons[type] || '💡';
}

function wireSenseiInteractions() {
  // Add click handlers for recommendations
  document.querySelectorAll('.recommendation-card').forEach(card => {
    card.addEventListener('click', () => {
      console.log('[Sensei] Recommendation clicked');
      // TODO: Open detail modal
    });
  });
}

function buildDemoAnalysis(DemoData) {
  return DemoData.senseiAnalysis || { performance: { summary: {}, scoring: [], recommendations: [] }};
}

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
