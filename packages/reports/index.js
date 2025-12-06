// packages/reports/index.js
// Block 4 – Reports & Export Center (Minimal Stub)

export async function init(ctx = {}) {
  const section = document.getElementById("reportsView");
  if (!section) return;
  
  const { AppState } = ctx;
  render(section, AppState);
}

export function render(root, AppState) {
  root.innerHTML = `
    <div class="view-header">
      <h2>📊 REPORTS & EXPORTS</h2>
      <p class="view-subline">Performance Reports & Datenexport</p>
    </div>
    
    <div class="view-body">
      <div class="empty-state">
        <div class="empty-icon">📈</div>
        <div class="empty-message">Reports-Feature wird entwickelt</div>
        <div class="empty-hint">
          Bald verfügbar: PDF/CSV Export, Custom Reports, Scheduled Reports
        </div>
        <button class="btn-primary" onclick="window.SignalOne.navigateTo('dashboard')">
          Zurück zum Dashboard
        </button>
      </div>
    </div>
  `;
}
