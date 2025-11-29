// packages/reports/index.js
// Block 3 – Reporting & Export Layer (Executive Summary, Weekly & Monthly View)

function getDemoData() {
  if (window.SignalOneDemo && window.SignalOneDemo.DemoData) {
    return window.SignalOneDemo.DemoData;
  }
  return {
    brands: [],
    campaignsByBrand: {},
  };
}

function getActiveBrand(AppState, DemoData) {
  const brands = DemoData.brands || [];
  if (!brands.length) return null;

  if (AppState.selectedBrandId) {
    const found = brands.find((b) => b.id === AppState.selectedBrandId);
    if (found) return found;
  }

  return brands[0] || null;
}

function getCampaignsForBrand(brand, DemoData) {
  if (!brand || !DemoData.campaignsByBrand) return [];
  return DemoData.campaignsByBrand[brand.id] || [];
}

function formatCurrency(value) {
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

// Grobe 4-Wochen-Aufteilung aus 30d-Spend + ROAS
function buildWeeklyRows(brand) {
  const rows = [];
  if (!brand) return rows;

  const totalSpend = brand.spend30d || 0;
  const base = totalSpend / 4 || 0;
  const roas = brand.roas30d || 0;

  const factors = [0.9, 1.0, 1.1, 1.0];
  const roasOffsets = [-0.3, 0, 0.2, -0.1];

  for (let i = 0; i < 4; i++) {
    const spend = Math.round(base * factors[i]);
    const weekRoas = Math.max(0, roas + roasOffsets[i]);
    const revenue = spend * weekRoas;

    rows.push({
      label: `Woche ${i + 1}`,
      spend,
      roas: weekRoas,
      revenue,
    });
  }

  return rows;
}

function buildBrandComparison(DemoData) {
  const brands = DemoData.brands || [];
  return brands.map((b) => {
    const spend = b.spend30d || 0;
    const roas = b.roas30d || 0;
    const revenue = spend * roas;
    return {
      name: b.name,
      vertical: b.vertical,
      spend,
      roas,
      revenue,
      health: b.campaignHealth || "unknown",
    };
  });
}

function deriveHighlights(DemoData) {
  const brands = DemoData.brands || [];
  if (!brands.length) return null;

  let topRoas = brands[0];
  let topSpend = brands[0];
  let criticalBrand = null;

  for (const b of brands) {
    if (b.roas30d > topRoas.roas30d) topRoas = b;
    if (b.spend30d > topSpend.spend30d) topSpend = b;
    if (b.campaignHealth === "critical" && !criticalBrand) criticalBrand = b;
  }

  return {
    topRoas,
    topSpend,
    criticalBrand,
  };
}

export function render(root, AppState, ctx = {}) {
  const DemoData = getDemoData();
  const brand = getActiveBrand(AppState, DemoData);
  const campaigns = getCampaignsForBrand(brand, DemoData);
  const weeklyRows = buildWeeklyRows(brand);
  const comparison = buildBrandComparison(DemoData);
  const highlights = deriveHighlights(DemoData);
  const isDemo = !!ctx.useDemoMode;

  const spend30d = brand ? brand.spend30d || 0 : 0;
  const roas30d = brand ? brand.roas30d || 0 : 0;
  const revenue30d = spend30d * roas30d;
  const avgDailySpend = spend30d / 30 || 0;

  const brandLabel = brand ? brand.name : "Kein Werbekonto";
  const campCount = campaigns.length;

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Reports & Exports</h2>
        <p class="view-subtitle">
          Executive Summary & Performance-Reports für
          <strong>${brandLabel}</strong> (letzte 30 Tage).
        </p>
      </div>
      <div class="topbar-status-group">
        <span class="mode-badge">
          <i class="fa-solid fa-robot"></i>
          Modus: ${isDemo ? "Demo-Reporting" : "Live-Reporting"}
        </span>
        <span class="badge">
          <i class="fa-solid fa-calendar-week"></i>
          Zeitraum: Letzte 30 Tage
        </span>
      </div>
    </div>

    <div class="reports-layout">
      <!-- Linke Seite: KPIs + Tabellen -->
      <div class="reports-main">
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-label">Ad Spend · 30 Tage</div>
            <div class="metric-value">
              ${spend30d ? formatCurrency(spend30d) : "–"}
            </div>
            <div class="metric-subtext">
              Ø Tagesbudget: ${
                spend30d ? formatCurrency(avgDailySpend) : "–"
              }
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">ROAS · 30 Tage</div>
            <div class="metric-value">${roas30d ? roas30d.toFixed(1) + "x" : "–"}</div>
            <div class="metric-subtext">
              Geschätzter Umsatz: ${
                revenue30d ? formatCurrency(revenue30d) : "–"
              }
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Aktive Kampagnen</div>
            <div class="metric-value">${campCount}</div>
            <div class="metric-subtext">
              Basierend auf der Demo-Struktur deines Kontos.
            </div>
          </div>

          <div class="metric-card">
            <div class="metric-label">Report-Typ</div>
            <div class="metric-value">Weekly & Monthly</div>
            <div class="metric-subtext">
              Export vorbereitet, PDF-Engine folgt in P6.
            </div>
          </div>
        </div>

        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Weekly Performance</div>
              <div class="sensei-card-subtitle">
                Aufteilung des 30-Tage-Profils auf vier Wochen-Blöcke.
              </div>
            </div>
            <span class="sensei-ai-pill">
              <i class="fa-solid fa-wave-square"></i>
              Zeitreihen-Demo
            </span>
          </div>

          <div class="campaign-table-wrapper" style="margin-top:10px;">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Woche</th>
                  <th>Spend</th>
                  <th>ROAS</th>
                  <th>Umsatz (geschätzt)</th>
                </tr>
              </thead>
              <tbody>
                ${
                  weeklyRows.length
                    ? weeklyRows
                        .map(
                          (row) => `
                  <tr>
                    <td>${row.label}</td>
                    <td>${formatCurrency(row.spend)}</td>
                    <td>${row.roas.toFixed(1)}x</td>
                    <td>${formatCurrency(row.revenue)}</td>
                  </tr>
                `
                        )
                        .join("")
                    : `
                  <tr>
                    <td colspan="4">Keine Daten verfügbar – wähle ein Werbekonto aus.</td>
                  </tr>
                `
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="report-card" style="margin-top:18px;">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Monthly Brand Comparison</div>
              <div class="sensei-card-subtitle">
                Vergleich aller Demo-Brands innerhalb deines Signals-Setups.
              </div>
            </div>
            <span class="sensei-ai-pill">
              <i class="fa-solid fa-chart-column"></i>
              Cross-Brand View
            </span>
          </div>

          <div class="campaign-table-wrapper" style="margin-top:10px;">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Vertical</th>
                  <th>Spend 30d</th>
                  <th>ROAS 30d</th>
                  <th>Umsatz (geschätzt)</th>
                  <th>Health</th>
                </tr>
              </thead>
              <tbody>
                ${
                  comparison.length
                    ? comparison
                        .map((row) => {
                          let badgeClass = "badge-pill";
                          if (row.health === "good") badgeClass += " badge-success";
                          else if (row.health === "warning") badgeClass += " badge-warning";
                          else if (row.health === "critical")
                            badgeClass += " badge-danger";

                          return `
                    <tr>
                      <td>${row.name}</td>
                      <td>${row.vertical}</td>
                      <td>${formatCurrency(row.spend)}</td>
                      <td>${row.roas.toFixed(1)}x</td>
                      <td>${formatCurrency(row.revenue)}</td>
                      <td>
                        <span class="${badgeClass}">
                          ${
                            row.health === "good"
                              ? "Stark"
                              : row.health === "warning"
                              ? "Beobachten"
                              : row.health === "critical"
                              ? "Kritisch"
                              : "n/a"
                          }
                        </span>
                      </td>
                    </tr>
                  `;
                        })
                        .join("")
                    : `
                  <tr>
                    <td colspan="6">Keine Brand-Daten verfügbar.</td>
                  </tr>
                `
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rechte Seite: Executive Summary + Highlights + Export -->
      <aside class="reports-sidebar">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Executive Summary</div>
              <div class="sensei-card-subtitle">
                Kurzfassung für Stakeholder & Management.
              </div>
            </div>
          </div>

          <p style="font-size:0.86rem;color:#4b5563;margin-bottom:8px;">
            Für <strong>${brandLabel}</strong> ergibt sich aktuell folgende Lage:
          </p>
          <ul style="margin-left:18px;font-size:0.86rem;color:#4b5563;">
            <li>30-Tage Ad Spend von <strong>${
              spend30d ? formatCurrency(spend30d) : "–"
            }</strong> bei einem ROAS von <strong>${
    roas30d ? roas30d.toFixed(1) + "x" : "–"
  }</strong>.</li>
            <li>Geschätzter Umsatz im betrachteten Zeitraum: <strong>${
              revenue30d ? formatCurrency(revenue30d) : "–"
            }</strong>.</li>
            <li><strong>${campCount}</strong> relevante Kampagnen in deinem Fokus-Setup.</li>
            <li>Reports laufen aktuell im <strong>${
              isDemo ? "Demo-" : "Live-"
            }Modus</strong> – ideal zum Onboarding & Testing.</li>
          </ul>

          <p style="margin-top:8px;font-size:0.8rem;color:#6b7280;">
            Später kann hier ein vollständiger <strong>AI-generierter Text-Report</strong>
            ausgegeben werden (inkl. Wording für Investor-Reports oder Weekly Memos).
          </p>
        </div>

        <div class="report-card" style="margin-top:16px;">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Highlights & Risks</div>
              <div class="sensei-card-subtitle">
                Sensei-Auszug aus deinem Brand-Set.
              </div>
            </div>
          </div>

          <ul style="margin-left:18px;font-size:0.85rem;color:#4b5563;">
            <li>
              <strong>Top ROAS Brand:</strong>
              ${
                highlights && highlights.topRoas
                  ? `${highlights.topRoas.name} (${highlights.topRoas.roas30d.toFixed(
                      1
                    )}x)`
                  : "–"
              }
            </li>
            <li>
              <strong>Höchster Spend:</strong>
              ${
                highlights && highlights.topSpend
                  ? `${highlights.topSpend.name} (${formatCurrency(
                      highlights.topSpend.spend30d
                    )})`
                  : "–"
              }
            </li>
            <li>
              <strong>Kritisches Konto:</strong>
              ${
                highlights && highlights.criticalBrand
                  ? `${highlights.criticalBrand.name} (Health: kritisch)`
                  : "aktuell kein Brand im Status 'kritisch' in der Demo."
              }
            </li>
          </ul>

          <p style="margin-top:8px;font-size:0.8rem;color:#6b7280;">
            In einem späteren Ausbauschritt verlinkt dieser Block direkt in Sensei,
            Creatives & Testing Log für eine vollständige Ursachenanalyse.
          </p>
        </div>

        <div class="report-card" style="margin-top:16px;">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Export Center</div>
              <div class="sensei-card-subtitle">
                Export-Optionen für Weekly & Monthly Reports.
              </div>
            </div>
            <span class="sensei-ai-pill">
              <i class="fa-solid fa-file-export"></i>
              P6: PDF Engine
            </span>
          </div>

          <p style="font-size:0.84rem;color:#4b5563;margin-bottom:10px;">
            Aktuell im Demo-Modus – die Buttons zeigen dir nur den Flow.
            In Phase P6 wird hier die echte PDF/CSV-Exportlogik angebunden.
          </p>

          <div style="display:flex;flex-direction:column;gap:8px;">
            <button type="button" id="exportWeeklyBtn" class="meta-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-arrow-down"></i>
              &nbsp;Weekly Report (PDF Demo)
            </button>
            <button type="button" id="exportMonthlyBtn" class="sidebar-footer-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-table"></i>
              &nbsp;Monthly CSV (Demo)
            </button>
          </div>

          <p style="margin-top:10px;font-size:0.78rem;color:#6b7280;">
            Geplante Formate: PDF, CSV, Google Sheets Connect, E-Mail Routing.
          </p>
        </div>
      </aside>
    </div>
  `;

  // Interaktionen: Export-Buttons (Demo)
  const weeklyBtn = root.querySelector("#exportWeeklyBtn");
  const monthlyBtn = root.querySelector("#exportMonthlyBtn");

  if (weeklyBtn) {
    weeklyBtn.addEventListener("click", () => {
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          "Weekly Report Export (Demo) – PDF Engine folgt in P6.",
          "success"
        );
      }
    });
  }

  if (monthlyBtn) {
    monthlyBtn.addEventListener("click", () => {
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          "Monthly CSV Export (Demo) – echter Export folgt in P6.",
          "success"
        );
      }
    });
  }
}
