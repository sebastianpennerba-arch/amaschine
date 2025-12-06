// packages/roast/index.js
// Block 4 – Creative Roast (AI-powered Creative Critique)

export async function init(ctx = {}) {
  const section = document.getElementById("roastView");
  if (!section) return;
  
  const { AppState } = ctx;
  render(section, AppState);
}

export function render(root, AppState) {
  root.innerHTML = `
    <div class="view-header">
      <h2>🔥 CREATIVE ROAST</h2>
      <p class="view-subline">Sensei analysiert deine Creatives – brutal ehrlich</p>
    </div>
    
    <div class="view-body">
      <div class="roast-intro">
        <div class="roast-avatar">
          <div class="ai-avatar">🤖</div>
        </div>
        <div class="roast-message">
          <h3>Bereit für ehrliches Feedback?</h3>
          <p>Sensei analysiert deine Creatives und zeigt dir gnadenlos, was funktioniert – und was nicht.</p>
        </div>
      </div>
      
      <div class="empty-state" style="margin-top: 40px;">
        <div class="empty-icon">🚧</div>
        <div class="empty-message">Roast-Feature wird entwickelt</div>
        <div class="empty-hint">
          Bald verfügbar: AI Creative Critique, Hook Analysis, Performance Predictions
        </div>
        <button class="btn-primary" onclick="window.SignalOne.navigateTo('sensei')">
          Zu Sensei AI
        </button>
      </div>
    </div>
  `;
}
