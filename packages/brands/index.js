// packages/brands/index.js
// Brand Manager – Multi-Brand Übersicht + Selection.

export function render(root, AppState, { useDemoMode }) {
  const DemoData = window.SignalOneDemo?.DemoData || null;
  const brands = DemoData?.brands || [];

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Brand Manager</h2>
        <p class="view-subtitle">
          Alle Brands im Überblick – ROAS, Spend, Health & aktives Werbekonto.
        </p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="metric-card">
        <div class="metric-label">Brands</div>
        <div class="metric-value">${brands.length}</div>
        <div class="metric-subtext">im Demo-Workspace</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Aktive Brand</div>
        <div class="metric-value">${getActiveBrandName(AppState, brands)}</div>
        <div class="metric-subtext">Topbar Werbekonto Auswahl</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Modus</div>
        <div class="metric-value">${useDemoMode ? "Demo" : "Live"}</div>
        <div class="metric-subtext">
          Meta: ${AppState.metaConnected ? "verbunden" : "nicht verbunden"}
        </div>
      </div>
      <div class="metric-card">
        <div class="metric-label">System Health</div>
        <div class="metric-value">${
          AppState.systemHealthy ? "OK" : "Check"
        }</div>
        <div class="metric-subtext">siehe Testing Log</div>
      </div>
    </div>

    <div class="creative-grid">
      ${brands
        .map((b) => {
          const isActive = AppState.selectedBrandId === b.id;
          const healthBadge = healthBadgeFor(b.campaignHealth);
          return `
          <div class="creative-library-item" data-brand-id="${b.id}">
            <div class="creative-media-container-library">
              <div class="creative-faux-thumb">
                ${escapeHtml(shortBrandCode(b.name))}
              </div>
            </div>
            <div class="creative-stats">
              <div class="creative-name-library">${escapeHtml(b.name)}</div>
              <div class="creative-meta">${escapeHtml(
                b.vertical
              )} · ${escapeHtml(b.ownerName)}</div>
              <div class="creative-kpi-row">
                <span class="creative-kpi-badge">
                  ROAS 30d: ${b.roas30d.toFixed(1)}
                </span>
                <span class="creative-kpi-badge">
                  Spend 30d: ${formatCurrency(b.spend30d)}
                </span>
              </div>
              <div class="creative-info-row">
                <span>${healthBadge}</span>
                <button
                  class="sidebar-footer-button"
                  data-brand-select="${b.id}"
                  type="button"
                  style="padding:6px 10px;font-size:0.78rem;"
                >
                  ${isActive ? "Aktiv" : "Als aktiv setzen"}
                </button>
              </div>
            </div>
          </div>
        `;
        })
        .join("")}
    </div>
  `;

  root.querySelectorAll("[data-brand-select]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-brand-select");
      if (!id) return;
      setActiveBrand(id);
    });
  });
}

function getActiveBrandName(AppState, brands) {
  if (!brands.length) return "n/a";
  const b = brands.find((br) => br.id === AppState.selectedBrandId);
  return b?.name || brands[0].name;
}

function setActiveBrand(brandId) {
  const select = document.getElementById("brandSelect");
  if (select) {
    select.value = brandId;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const toast = window.SignalOne?.showToast;
  toast && toast("Aktive Brand aktualisiert.", "success");
}

function healthBadgeFor(health) {
  if (!health) return `<span class="badge-pill">n/a</span>`;
  if (health === "good") {
    return `<span class="badge-pill badge-success">Health: Stark</span>`;
  }
  if (health === "warning") {
    return `<span class="badge-pill badge-warning">Health: Beobachten</span>`;
  }
  if (health === "critical") {
    return `<span class="badge-pill badge-danger">Health: Kritisch</span>`;
  }
  return `<span class="badge-pill">${escapeHtml(health)}</span>`;
}

function shortBrandCode(name) {
  if (!name) return "BR";
  const parts = name.split(" ");
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatCurrency(value) {
  if (typeof value !== "number") return "n/a";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
