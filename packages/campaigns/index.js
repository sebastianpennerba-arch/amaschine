// packages/campaigns/index.js
// SignalOne – Campaign Manager (Block 1)

const DemoDataCM = window.SignalOneDemo?.DemoData || null;

function getCurrentBrandId(appState) {
  if (appState.selectedBrandId) return appState.selectedBrandId;
  const brands = DemoDataCM?.brands || [];
  return brands[0]?.id || null;
}

function getBrand(appState) {
  const id = getCurrentBrandId(appState);
  return (DemoDataCM?.brands || []).find((b) => b.id === id) || null;
}

function getCampaigns(appState) {
  const id = getCurrentBrandId(appState);
  if (!id) return [];
  return DemoDataCM?.campaignsByBrand?.[id] || [];
}

function statusClass(status) {
  if (status === "ACTIVE") return "campaign-status-pill active";
  if (status === "PAUSED") return "campaign-status-pill paused";
  if (status === "TESTING") return "campaign-status-pill testing";
  return "campaign-status-pill";
}

function pseudoMetrics(campaign, brand) {
  const baseSpend = (brand?.spend30d || 10000) / 5;
  const spend =
    baseSpend *
    (campaign.status === "ACTIVE" ? 1.1 : campaign.status === "TESTING" ? 0.8 : 0.4);
  const roas =
    (brand?.roas30d || 3.5) *
    (campaign.status === "ACTIVE" ? 1 : campaign.status === "TESTING" ? 1.1 : 0.6);
  const ctr = campaign.status === "ACTIVE" ? 2.8 : campaign.status === "TESTING" ? 3.2 : 1.4;
  const cpm = 12 + Math.random() * 4;
  const cpc = cpm / (ctr || 1.5);

  return {
    spend,
    roas,
    ctr,
    cpm,
    cpc,
  };
}

function buildRow(campaign, brand) {
  const m = pseudoMetrics(campaign, brand);
  return `
    <tr data-campaign-id="${campaign.id}">
      <td>
        <div class="campaign-name">${campaign.name}</div>
        <div class="campaign-sub">ID: ${campaign.id}</div>
      </td>
      <td>
        <span class="${statusClass(campaign.status)}">
          ${campaign.status === "ACTIVE" ? "Active" : campaign.status}
        </span>
      </td>
      <td class="campaign-kpi">
        €${m.spend.toLocaleString("de-DE", { maximumFractionDigits: 0 })}
        <span class="campaign-kpi-label">Spend (30d)</span>
      </td>
      <td class="campaign-kpi">
        ${m.roas.toFixed(1)}x
        <span class="campaign-kpi-label">ROAS</span>
      </td>
      <td class="campaign-kpi">
        ${m.ctr.toFixed(1)}%
        <span class="campaign-kpi-label">CTR</span>
      </td>
      <td class="campaign-kpi">
        €${m.cpm.toFixed(2)}
        <span class="campaign-kpi-label">CPM</span>
      </td>
      <td class="campaign-kpi">
        €${m.cpc.toFixed(2)}
        <span class="campaign-kpi-label">CPC</span>
      </td>
      <td>
        <div class="campaign-actions">
          <div class="campaign-action-icon" data-action="scale" title="Scale-Empfehlung">
            <i class="fa-solid fa-arrow-up-right"></i>
          </div>
          <div class="campaign-action-icon" data-action="pause" title="Pause">
            <i class="fa-solid fa-pause"></i>
          </div>
          <div class="campaign-action-icon" data-action="test" title="Testing Log öffnen">
            <i class="fa-solid fa-flask"></i>
          </div>
        </div>
      </td>
    </tr>
  `;
}

export function render(section, AppState, { useDemoMode }) {
  const brand = getBrand(AppState);
  const campaigns = getCampaigns(AppState);

  section.innerHTML = `
    <header class="view-header">
      <div>
        <h2>Kampagnen</h2>
        <div class="view-subtitle">
          ${brand ? brand.name : "Demo Brand"} • ${
    brand ? brand.vertical : "Performance Demo"
  }
        </div>
      </div>
      <div>
        <span class="badge-pill">Modus: ${useDemoMode ? "Demo" : "Live"}</span>
      </div>
    </header>

    <section class="dashboard-section">
      <div class="kpi-grid">
        <article class="metric-card">
          <div class="metric-label">Spend (30 Tage)</div>
          <div class="metric-value">
            €${(brand?.spend30d || 0).toLocaleString("de-DE", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div class="metric-subtext">Alle Kampagnen dieser Brand</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">ROAS (30 Tage)</div>
          <div class="metric-value">${(brand?.roas30d || 0).toFixed(1)}x</div>
          <div class="metric-subtext">Account-weite Performance</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Aktive Kampagnen</div>
          <div class="metric-value">${
            campaigns.filter((c) => c.status === "ACTIVE").length
          }</div>
          <div class="metric-subtext">${campaigns.length} gesamt</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Testing Slots</div>
          <div class="metric-value">${
            campaigns.filter((c) => c.status === "TESTING").length || 1
          }</div>
          <div class="metric-subtext">Verbunden mit Testing Log</div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section-title">Kampagnenübersicht</div>
      <div class="dashboard-section-subtitle">
        ROAS, CTR, Spend & Status je Kampagne. Aktionen sind im Demo-Modus simuliert.
      </div>

      <div class="campaign-table-wrapper">
        <table class="campaign-table">
          <thead>
            <tr>
              <th>Kampagne</th>
              <th>Status</th>
              <th>Spend</th>
              <th>ROAS</th>
              <th>CTR</th>
              <th>CPM</th>
              <th>CPC</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            ${
              campaigns.length
                ? campaigns.map((c) => buildRow(c, brand)).join("")
                : `<tr><td colspan="8" style="padding:16px;font-size:0.9rem;color:#64748b;">
                    Keine Kampagnen im Demo-Modus für diese Brand.
                   </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;

  section.addEventListener("click", (evt) => {
    const actionEl = evt.target.closest(".campaign-action-icon");
    if (!actionEl) return;
    const row = actionEl.closest("tr");
    if (!row) return;
    const id = row.getAttribute("data-campaign-id");
    const name = row.querySelector(".campaign-name")?.textContent || id;
    const action = actionEl.getAttribute("data-action");

    if (action === "scale") {
      window.SignalOne?.showToast?.(
        `Scale-Empfehlung (Demo) für "${name}" geöffnet.`,
        "success"
      );
    } else if (action === "pause") {
      window.SignalOne?.showToast?.(
        `Pause-Aktion (Demo) für "${name}" simuliert.`,
        "warning"
      );
    } else if (action === "test") {
      window.SignalOne?.openSystemModal?.(
        "Testing Log (Demo)",
        `<p>Testing-Log-Eintrag für <strong>${name}</strong> (Demo-Modus).</p>
         <p style="margin-top:8px;font-size:0.9rem;color:#64748b;">
          Später: Direkte Verknüpfung zu echten Test-Cases & Varianten.
         </p>`
      );
    }
  });
}
