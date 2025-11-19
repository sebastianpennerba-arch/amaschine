/* styles.css */
/* ========================= BASE ========================= */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

:root {
    --primary: #2457dd;
    --primary-dark: #1b43aa;
    --success: #1a8f63;
    --success-light: #e7f4ee;
    --warning: #bf7a15;
    --warning-light: #fff5e5;
    --danger: #c0392b;
    --danger-light: #ffe6e3;

    --bg: #f4f5f7;
    --bg-alt: #ffffff;
    --text: #111827;
    --text-light: #6b7280;
    --text-lighter: #9ca3af;
    --border: #e1e4ea;
    --border-light: #f2f3f6;

    --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04);
    --shadow: 0 2px 6px rgba(15, 23, 42, 0.06);
    --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.08);
    --shadow-lg: 0 6px 18px rgba(15, 23, 42, 0.10);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--text);
    font-size: 13px;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.wrapper {
    max-width: 1440px;
    margin: 0 auto;
    padding: 20px 24px 32px;
}

/* ========================= HEADER ========================= */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid var(--border);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 18px;
}

.logo-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.logo-icon {
    font-size: 20px;
    color: var(--primary);
}

.logo-title {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: -0.25px;
}

.logo-subtitle {
    font-size: 11px;
    color: var(--text-light);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.divider {
    width: 1px;
    height: 34px;
    background: var(--border);
}

.header-stats {
    display: flex;
    gap: 18px;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.stat-label {
    font-size: 11px;
    color: var(--text-lighter);
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.stat-value {
    font-size: 13px;
    font-weight: 600;
}

.pulse {
    color: var(--success);
}

.header-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.date-display {
    font-size: 12px;
    font-weight: 500;
    color: var(--text-light);
    padding: 6px 12px;
    background: var(--bg-alt);
    border-radius: 6px;
    border: 1px solid var(--border);
}

.mode-toggle {
    display: flex;
    gap: 2px;
    background: var(--bg-alt);
    padding: 2px;
    border-radius: 7px;
    border: 1px solid var(--border);
}

.mode-btn {
    padding: 5px 10px;
    border: none;
    background: transparent;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--text-light);
}

.mode-btn.active {
    background: var(--primary);
    color: #fff;
}

.mode-icon {
    font-size: 13px;
}

.btn {
    padding: 7px 14px;
    border-radius: 7px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-primary {
    background: var(--primary);
    color: #fff;
    box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
    background: var(--primary-dark);
}

.status-badge {
    padding: 5px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
    background: var(--border-light);
    color: var(--text-light);
}

/* ========================= AI INSIGHTS BANNER ========================= */
.ai-insights-banner {
    background: var(--primary);
    padding: 14px 18px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
    color: #fff;
    box-shadow: var(--shadow-sm);
}

.ai-icon {
    font-size: 24px;
}

.ai-content {
    flex: 1;
}

.ai-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 3px;
}

.ai-text {
    font-size: 12px;
    opacity: 0.9;
}

.ai-btn {
    padding: 8px 14px;
    background: #fff;
    color: var(--primary);
    border: none;
    border-radius: 7px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
}

.ai-btn:hover {
    box-shadow: var(--shadow-sm);
}

.sparkle {
    font-size: 14px;
}

/* ========================= PERIOD SELECTOR ========================= */
.period-selector {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    padding: 10px 14px;
    background: var(--bg-alt);
    border-radius: 10px;
    border: 1px solid var(--border);
}

.period-label {
    font-weight: 500;
    color: var(--text-light);
    font-size: 12px;
}

.toggle {
    display: flex;
    gap: 4px;
}

.toggle-btn {
    padding: 5px 10px;
    border: 1px solid var(--border);
    background: var(--bg);
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-light);
}

.toggle-btn.active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary-dark);
}

.export-btn {
    margin-left: auto;
    padding: 5px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-weight: 500;
    cursor: pointer;
    font-size: 12px;
}

/* ========================= SCORE SECTION ========================= */
.score-section {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 16px;
    margin-bottom: 20px;
}

.score-card {
    background: var(--bg-alt);
    padding: 18px;
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.score-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
}

.score-header h2 {
    font-size: 15px;
    font-weight: 600;
}

.score-trend {
    font-size: 12px;
    color: var(--success);
    font-weight: 500;
}

.score-visual {
    position: relative;
    width: 160px;
    height: 160px;
    margin: 0 auto 14px;
}

.score-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
}

.score-number {
    font-size: 34px;
    font-weight: 800;
    line-height: 1;
    color: var(--text);
}

.score-label {
    font-size: 11px;
    color: var(--text-light);
    font-weight: 500;
}

.score-breakdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.score-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
}

.score-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
}

.score-item span:nth-child(2) {
    flex: 1;
    color: var(--text-light);
}

/* ========================= QUICK METRICS ========================= */
.quick-metrics {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
}

.quick-metric {
    background: var(--bg-alt);
    padding: 14px;
    border-radius: 10px;
    box-shadow: var(--shadow-sm);
    display: flex;
    gap: 10px;
    border: 1px solid var(--border);
}

.quick-metric.highlight {
    background: #f0f3ff;
}

.metric-icon {
    font-size: 22px;
}

.metric-content {
    flex: 1;
}

.metric-label {
    font-size: 11px;
    color: var(--text-light);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.metric-value {
    font-size: 20px;
    font-weight: 700;
    line-height: 1.3;
    margin: 2px 0;
}

.metric-change {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    display: inline-block;
    background: var(--bg);
    color: var(--text-light);
}

/* ========================= SECTIONS ========================= */
.section {
    margin-bottom: 22px;
    background: var(--bg-alt);
    border-radius: 10px;
    padding: 20px 18px 18px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.section-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
}

.section-number {
    background: var(--bg);
    color: var(--text-light);
    font-size: 13px;
    font-weight: 600;
    padding: 6px 10px;
    border-radius: 7px;
    border: 1px solid var(--border);
}

.section-title {
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.2px;
}

.section-subtitle {
    color: var(--text-light);
    font-size: 12px;
}

.section-action {
    margin-left: auto;
    padding: 6px 10px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 7px;
    font-weight: 500;
    font-size: 12px;
    cursor: pointer;
}

/* ========================= OVERVIEW GRID ========================= */
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 10px;
    margin-bottom: 20px;
}

.overview-card {
    background: var(--bg);
    padding: 12px;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--border);
}

.metric-label {
    color: var(--text-light);
    font-size: 11px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.metric-value {
    font-size: 20px;
    font-weight: 700;
    margin-top: 6px;
}

/* ========================= FUNNEL ========================= */
.funnel-section {
    margin-bottom: 18px;
}

.funnel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;
}

.funnel-header h3 {
    font-size: 15px;
    font-weight: 600;
}

.funnel-stats {
    display: flex;
    gap: 12px;
    font-size: 12px;
    color: var(--text-light);
}

.funnel-visual {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
}

.funnel-step {
    background: var(--bg);
    padding: 14px;
    border-radius: 8px;
    color: var(--text);
    border: 1px solid var(--border);
}

.funnel-step .metric-label {
    color: var(--text-light);
}

.funnel-step-value {
    font-size: 20px;
    font-weight: 700;
    margin-top: 6px;
}

/* ========================= CHART ========================= */
.chart-container {
    margin-top: 18px;
    padding: 14px 14px 10px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
}

.chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.chart-header h3 {
    font-size: 15px;
    font-weight: 600;
}

.chart-filters {
    display: flex;
    gap: 6px;
}

.chart-filter {
    padding: 4px 8px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
    font-size: 11px;
    font-weight: 500;
    color: var(--text-light);
}

.chart-filter.active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary-dark);
}

.chart-inner {
    height: 200px;
}

#trendChart {
    max-height: 180px;
}

/* ========================= KPI GRID ENHANCED ========================= */
.kpi-grid-enhanced {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 10px;
    margin-bottom: 18px;
}

.kpi-card-enhanced {
    background: var(--bg);
    padding: 14px;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--border);
    position: relative;
}

.kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
}

.kpi-label {
    font-size: 11px;
    color: var(--text-light);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.4px;
}

.kpi-trend {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    background: var(--bg-alt);
}

.kpi-value {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
}

.kpi-comparison {
    font-size: 11px;
    color: var(--text-light);
}

.kpi-bar {
    width: 100%;
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    margin-top: 6px;
}

.kpi-bar-fill {
    height: 100%;
    background: var(--primary);
    border-radius: 2px;
}

/* ========================= HEATMAP ========================= */
.heatmap-section {
    margin-top: 18px;
    padding: 14px;
    background: var(--bg);
    border-radius: 8px;
    border: 1px solid var(--border);
}

.heatmap-header h3 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
}

.heatmap-header p {
    font-size: 12px;
    color: var(--text-light);
}

.heatmap-container {
    display: grid;
    grid-template-columns: 60px repeat(7, 1fr);
    gap: 3px;
    margin: 10px 0 8px;
}

.heatmap-label {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 500;
    color: var(--text-light);
}

.heatmap-cell {
    aspect-ratio: 1;
    border-radius: 4px;
    border: 1px solid var(--border-light);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 500;
    cursor: default;
}

/* ========================= CREATIVES ========================= */
.creative-view-toggle {
    display: flex;
    gap: 4px;
    background: var(--bg);
    padding: 3px;
    border-radius: 7px;
    border: 1px solid var(--border);
}

.view-btn {
    padding: 4px 8px;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-light);
}

.view-btn.active {
    background: var(--primary);
    color: #fff;
}

.filter-bar {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    align-items: center;
}

.filter-btn {
    padding: 7px 12px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--bg-alt);
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text);
}

.filter-btn.active {
    background: var(--primary);
    color: #fff;
    border-color: var(--primary-dark);
}

.filter-icon {
    font-size: 13px;
}

.count {
    background: rgba(0,0,0,0.04);
    padding: 1px 6px;
    border-radius: 999px;
    font-size: 10px;
}

.filter-spacer {
    flex: 1;
}

.filter-select {
    padding: 7px 10px;
    border: 1px solid var(--border);
    border-radius: 7px;
    background: var(--bg-alt);
    font-size: 12px;
    font-weight: 500;
}

.creative-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 14px;
}

.creative-card {
    background: var(--bg-alt);
    border-radius: 8px;
    padding: 10px;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--border);
}

.creative-thumb {
    width: 100%;
    height: 190px;
    border-radius: 6px;
    object-fit: cover;
    background: var(--bg);
    margin-bottom: 10px;
}

.creative-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
}

.creative-kpis {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
}

.kpi-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 600;
}

.kpi-green {
    background: var(--success-light);
    color: var(--success);
}

.kpi-yellow {
    background: var(--warning-light);
    color: var(--warning);
}

.kpi-red {
    background: var(--danger-light);
    color: var(--danger);
}

/* ========================= WINNER/LOSER ========================= */
.winner-loser-section {
    background: var(--bg-alt);
}

.winner-loser-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.winner-card, .loser-card {
    background: var(--bg);
    padding: 14px;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--border);
}

.card-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    font-weight: 600;
    font-size: 11px;
    margin-bottom: 12px;
}

.card-badge.winner {
    background: var(--success-light);
    color: var(--success);
}

.card-badge.loser {
    background: var(--warning-light);
    color: var(--warning);
}

/* ========================= RECOMMENDATIONS ========================= */
.recommendations-grid {
    display: grid;
    gap: 10px;
}

.recommendation-card {
    background: var(--bg);
    padding: 14px;
    border-radius: 8px;
    box-shadow: none;
    border: 1px solid var(--border);
    display: flex;
    gap: 12px;
    align-items: flex-start;
}

.recommendation-card.priority-high {
    border-left: 3px solid var(--danger);
}

.recommendation-card.priority-medium {
    border-left: 3px solid var(--warning);
}

.recommendation-card.priority-low {
    border-left: 3px solid var(--primary);
}

.rec-icon {
    font-size: 20px;
    line-height: 1;
}

.rec-content h4 {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
}

.rec-content p {
    font-size: 12px;
    color: var(--text-light);
    margin-bottom: 4px;
}

.rec-impact {
    font-size: 11px;
    color: var(--text-light);
}

.rec-impact strong {
    color: var(--success);
}

.rec-action {
    padding: 6px 10px;
    background: var(--bg-alt);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 7px;
    font-weight: 500;
    font-size: 12px;
    cursor: pointer;
}

/* ========================= LOADING ========================= */
.loading {
    position: fixed;
    inset: 0;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(3px);
    z-index: 9999;
    display: flex;
    justify-content: center;
    align-items: center;
}

.spinner-modern {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--primary);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 10px;
}

.spinner-container p {
    color: var(--text-light);
    font-size: 12px;
    font-weight: 500;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* ========================= RESPONSIVE ========================= */
@media (max-width: 1200px) {
    .score-section {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 900px) {
    .wrapper {
        padding: 16px;
    }
    .header {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
    }
    .winner-loser-grid {
        grid-template-columns: 1fr;
    }
    .quick-metrics {
        grid-template-columns: repeat(2, 1fr);
    }
    .overview-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 640px) {
    .section {
        padding: 16px 12px;
    }
    .quick-metrics {
        grid-template-columns: 1fr;
    }
    .overview-grid {
        grid-template-columns: 1fr;
    }
    .funnel-visual {
        grid-template-columns: 1fr;
    }
    .creative-grid {
        grid-template-columns: 1fr;
    }
}
