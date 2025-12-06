export async function init(ctx = {}) {
  const section = document.getElementById("shopifyView");
  if (!section) return;
  
  section.innerHTML = `
    <div class="view-header">
      <h2>SHOPIFY CONNECT</h2>
      <p class="view-subline">E-Commerce Integration</p>
    </div>
    <div class="view-body">
      <div class="empty-state">
        <div class="empty-icon">🛍️</div>
        <div class="empty-message">Shopify noch nicht verbunden</div>
        <button class="btn-primary">Shopify verbinden</button>
      </div>
    </div>
  `;
}
