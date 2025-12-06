export async function init(ctx = {}) {
  const section = document.getElementById("senseiView");
  if (!section) return;
  
  section.innerHTML = `
    <div class="view-header">
      <h2>SENSEI AI SUITE</h2>
      <p class="view-subline">KI-gestützte Creative-Analyse</p>
    </div>
    <div class="view-body">
      <div class="empty-state">
        <div class="empty-icon">🤖</div>
        <div class="empty-message">Sensei AI wird geladen...</div>
        <p style="color:#6b7280;font-size:0.85rem;">Modul in Entwicklung</p>
      </div>
    </div>
  `;
}
