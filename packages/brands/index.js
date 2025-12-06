// packages/brands/index.js
// SignalOne – Brand Manager (Block 1)

const DemoDataBR = window.SignalOneDemo?.DemoData || null;

function computeHealthLabel(health) {
  if (health === "good") return "Stark";
  if (health === "warning") return "Beobachten";
  if (health === "critical") return "Kritisch";
  return "n/a";
}

function computeHealthClass(health) {
  if (health === "good") return "badge-success";
  if (health === "warning") return "badge-warning";
  if (health === "critical") return "badge-danger";
  return "";
}

export async function init(ctx = {}) {
  const section = document.getElementById("brandsView");
  if (!section) return;
  
  const { AppState, DemoData } = ctx;
  render(section, AppState, DemoData);
}

export function render(section, AppState, { useDemoMode }) {
  const brands = DemoDataBR?.brands || [];

  section.innerHTML = `
    <header class="view-header">
      <div>
        <h2>Brands</h2>
        <div class="view-subtitle">
          Übersicht aller Demo-Werbekonten in SignalOne.
        </div>
      </div>
      <div>
        <span class="badge-pill">Modus: ${useDemoMode ? "Demo" : "Live"}</span>
      </div>
    </header>

    <section class="dashboard-section">
      <div class="kpi-grid">
        <article class="metric-card">
          <div class="metric-label">Anzahl Brands</div>
          <div class="metric-value">${brands.length}</div>
          <div class="metric-subtext">Demo-Werbekonten</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Gesamtspend (30d)</div>
          <div class="metric-value">
            €${brands
              .reduce((sum, b) => sum + (b.spend30d || 0), 0)
              .toLocaleString("de-DE", { maximumFractionDigits: 0 })}
          </div>
          <div class="metric-subtext">Über alle Demo-Brands</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Durchschnittlicher ROAS</div>
          <div class="metric-value">
            ${
              brands.length
                ? (
                    brands.reduce((sum, b) => sum + (b.roas30d || 0), 0) /
                    brands.length
                  ).toFixed(1)
                : "0.0"
            }x
          </div>
          <div class="metric-subtext">Aggregiert</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Lizenz</div>
          <div class="metric-value">${
            AppState.licenseLevel?.toUpperCase?.() || "FREE"
          }</div>
          <div class="metric-subtext">Später: Upgrade auf PRO / AGENCY</div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section-title">Brand Übersicht</div>
      <div class="dashboard-section-subtitle">
        Spend, ROAS & Kampagnen-Health pro Brand.
      </div>

      <div class="campaign-table-wrapper">
        <table class="campaign-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Owner</th>
              <th>Vertical</th>
              <th>Spend (30d)</th>
              <th>ROAS</th>
              <th>Campaign Health</th>
            </tr>
          </thead>
          <tbody>
            ${
              brands.length
                ? brands
                    .map(
                      (b) => `
                  <tr data-brand-id="${b.id}">
                    <td>${b.name}</td>
                    <td>${b.ownerName}</td>
                    <td>${b.vertical}</td>
                    <td>€${b.spend30d.toLocaleString("de-DE", {
                      maximumFractionDigits: 0,
                    })}</td>
                    <td>${b.roas30d.toFixed(1)}x</td>
                    <td>
                      <span class="badge-pill ${computeHealthClass(
                        b.campaignHealth
                      )}">
                        ${computeHealthLabel(b.campaignHealth)}
                      </span>
                    </td>
                  </tr>
                `
                    )
                    .join("")
                : `<tr><td colspan="6" style="padding:16px;font-size:0.9rem;color:#64748b;">
                    Noch keine Brands im Demo-Modus.
                   </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  // Klick auf Brand → Meta-Brand-Selector im AppState updaten
  section.addEventListener("click", (evt) => {
    const row = evt.target.closest("tr[data-brand-id]");
    if (!row) return;
    const id = row.getAttribute("data-brand-id");
    AppState.selectedBrandId = id;
    // Topbar Selects + Health + aktuelle View neu:
    window.SignalOne?.showToast?.(
      `Brand im Demo-Modus gewechselt zu "${row.children[0].textContent}".`,
      "success"
    );
    // Brand-Select neu rendern & aktuelle View neu laden:
    // Wir nutzen vorhandene globale Funktionen über Navigate:
    window.SignalOne?.navigateTo?.("dashboard");
  });
}
