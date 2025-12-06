// packages/creatorInsights/index.js
// Block 4 – Creator Performance Insights (Minimal Stub)

export async function init(ctx = {}) {
  const section = document.getElementById("creatorInsightsView");
  if (!section) return;
  
  const { AppState } = ctx;
  render(section, AppState);
}

export function render(root, AppState) {
  root.innerHTML = `
    <div class="view-header">
      <h2>👥 CREATOR INSIGHTS</h2>
      <p class="view-subline">UGC Creator Performance & ROI</p>
    </div>
    
    <div class="view-body">
      <div class="empty-state">
        <div class="empty-icon">🎬</div>
        <div class="empty-message">Creator Insights wird entwickelt</div>
        <div class="empty-hint">
          Bald verfügbar: Creator-Performance, ROI-Tracking, Top-Performer Rankings
        </div>
        <button class="btn-primary" onclick="window.SignalOne.navigateTo('creativeLibrary')">
          Zur Creative Library
        </button>
      </div>
    </div>
  `;
}
