// packages/reports/index.js
// Block 5 – Export Engine (Weekly/Monthly/Executive + CSV)
// Nutzt DemoData aus window.SignalOneDemo, AppState & Meta/Demo-Guard aus app.js

export function render(root, AppState, ctx = {}) {
  const demoMode = ctx.useDemoMode ?? true;

  const DemoData = (window.SignalOneDemo && window.SignalOneDemo.DemoData) || {
    brands: [],
    campaignsByBrand: {},
  };

  const now = new Date();
  const todayLabel = now.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const selectedBrand =
    DemoData.brands.find((b) => b.id === AppState.selectedBrandId) ||
    DemoData.brands[0] ||
    null;

  const brandName = selectedBrand ? selectedBrand.name : "Kein Konto ausgewählt";
  const brandVertical = selectedBrand ? selectedBrand.vertical : "–";
  const spend30d = selectedBrand ? selectedBrand.spend30d : 0;
  const roas30d = selectedBrand ? selectedBrand.roas30d : 0;
  const health = selectedBrand ? selectedBrand.campaignHealth : "n/a";

  // --------------------------------------------------
  // Helper: Health Label
  // --------------------------------------------------
  function healthLabel(h) {
    if (h === "good") return "Stark";
    if (h === "warning") return "Beobachten";
    if (h === "critical") return "Kritisch";
    return "n/a";
  }

  // --------------------------------------------------
  // Helper: CSV Export
  // --------------------------------------------------
  function exportCsv(rangeKey) {
    const rangeLabel =
      rangeKey === "weekly"
        ? "Letzte 7 Tage"
        : rangeKey === "monthly"
        ? "Letzte 30 Tage"
        : "Executive";

    const sep = ";";

    const header =
      [
        "Brand",
        "Vertical",
        "Zeitraum",
        "Spend_30d",
        "ROAS_30d",
        "Campaign_Health",
      ].join(sep) + "\n";

    const row =
      [
        `"${brandName}"`,
        `"${brandVertical}"`,
        `"${rangeLabel}"`,
        spend30d,
        roas30d,
        `"${healthLabel(health)}"`,
      ].join(sep) + "\n";

    const csv = header + row;

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const safeBrand = brandName.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
    a.download = `signalone_${safeBrand}_${rangeKey}_report.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    window.SignalOne.showToast("CSV Export vorbereitet.", "success");
  }

  // --------------------------------------------------
  // Helper: „PDF“ / Print-Export (browser print)
  // --------------------------------------------------
  function openPrintWindow(rangeKey) {
    const rangeLabel =
      rangeKey === "weekly"
        ? "Weekly Performance Report"
        : rangeKey === "monthly"
        ? "Monthly Performance Report"
        : "Executive Summary";

    const campaignList =
      (selectedBrand && DemoData.campaignsByBrand[selectedBrand.id]) || [];
    const dateStr = todayLabel;

    const html = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8" />
        <title>SignalOne – ${rangeLabel}</title>
        <style>
          * { box-sizing: border-box; font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif; }
          body {
            margin: 0;
            padding: 32px 40px;
            background: #f3f4f6;
            color: #0f172a;
          }
          h1, h2, h3 {
            margin: 0 0 8px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }
          h1 { font-size: 18px; }
          h2 { font-size: 14px; }
          h3 { font-size: 12px; }
          .badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 11px;
            border: 1px solid #cbd5e1;
            background: #e5e7eb;
            margin-left: 8px;
          }
          .pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            border: 1px solid #d1d5db;
          }
          .pill.good { background: #ecfdf3; border-color: #4ade80; color: #15803d; }
          .pill.warning { background: #fffbeb; border-color: #facc15; color: #92400e; }
          .pill.critical { background: #fef2f2; border-color: #f87171; color: #b91c1c; }
          .meta {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 16px;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 16px;
            margin: 16px 0 24px;
          }
          .kpi-box {
            border-radius: 12px;
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            background: #ffffff;
          }
          .kpi-label {
            font-size: 11px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: #94a3b8;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 18px;
            font-weight: 600;
          }
          .kpi-sub {
            font-size: 11px;
            color: #6b7280;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 8px;
          }
          th, td {
            padding: 6px 8px;
            border-bottom: 1px solid #e5e7eb;
            text-align: left;
          }
          th {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 10px;
            color: #94a3b8;
          }
          tr:last-child td { border-bottom: none; }
          .footer {
            margin-top: 24px;
            font-size: 10px;
            color: #9ca3af;
            border-top: 1px solid #e5e7eb;
            padding-top: 8px;
          }
          @media print {
            body { background: #ffffff; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <header style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;">
          <div>
            <h1>SignalOne Report</h1>
            <div class="meta">
              ${rangeLabel}<br/>
              Generiert am ${dateStr}${demoMode ? " · Demo Mode" : ""}
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:12px;font-weight:600;">${brandName}</div>
            <div style="font-size:11px;color:#6b7280;">${brandVertical}</div>
            <div style="margin-top:6px;">
              <span class="pill ${health}">
                Health: ${healthLabel(health)}
              </span>
            </div>
          </div>
        </header>

        <section>
          <h2>Kern-KPIs</h2>
          <div class="kpi-grid">
            <div class="kpi-box">
              <div class="kpi-label">Ad Spend (30d)</div>
              <div class="kpi-value">${formatCurrency(spend30d, AppState.settings.currency)}</div>
              <div class="kpi-sub">Basierend auf Demo-Konto</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">ROAS (30d)</div>
              <div class="kpi-value">${roas30d.toFixed(2)}x</div>
              <div class="kpi-sub">Return on Ad Spend</div>
            </div>
            <div class="kpi-box">
              <div class="kpi-label">Campaign Health</div>
              <div class="kpi-value">${healthLabel(health)}</div>
              <div class="kpi-sub">Aus Kampagnensetup abgeleitet</div>
            </div>
          </div>
        </section>

        <section>
          <h2>Campagnenübersicht</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${
                campaignList.length
                  ? campaignList
                      .map(
                        (c) => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.status}</td>
                </tr>
              `
                      )
                      .join("")
                  : `<tr><td colspan="2">Keine Kampagnen gefunden (Demo).</td></tr>`
              }
            </tbody>
          </table>
        </section>

        <section style="margin-top:22px;">
          <h2>Executive Notes</h2>
          <p style="font-size:12px;color:#4b5563;max-width:640px;">
            Dieser Report wurde automatisch von SignalOne generiert. In der Live-Version
            werden hier automatisierte AI-Kommentare zu Performance-Treibern, Risiko-Signalen
            und konkreten Next Steps eingeblendet.
          </p>
        </section>

        <footer class="footer">
          SignalOne · Automated Performance Reporting · ${todayLabel}
        </footer>

        <div class="no-print" style="margin-top:18px;">
          <button onclick="window.print()" style="padding:6px 12px;border-radius:999px;border:1px solid #cbd5e1;background:#0f172a;color:#f9fafb;font-size:11px;">
            Als PDF drucken
          </button>
        </div>
      </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      window.SignalOne.showToast("Pop-Up für PDF-Druck blockiert.", "error");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  function formatCurrency(value, currency) {
    try {
      return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: currency || "EUR",
        maximumFractionDigits: 0,
      }).format(value || 0);
    } catch (e) {
      return `${value.toFixed ? value.toFixed(0) : value} ${currency || ""}`;
    }
  }

  // --------------------------------------------------
  // UI Rendering
  // --------------------------------------------------

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Reports</h2>
        <p class="view-subtitle">
          Exportiere Weekly, Monthly & Executive Reports für dein Konto.
        </p>
      </div>
    </div>

    <div class="reports-layout">
      <!-- Linke Seite: Übersicht & Tabelle -->
      <div class="reports-main">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Brand Overview</div>
              <div class="sensei-card-subtitle">
                ${brandName} · ${brandVertical}
              </div>
            </div>
            <span class="badge-pill">
              ${demoMode ? "Demo Mode" : "Live Mode"}
            </span>
          </div>

          <div class="kpi-grid">
            <div class="metric-card">
              <div class="metric-label">Ad Spend (30d)</div>
              <div class="metric-value">${formatCurrency(
                spend30d,
                AppState.settings.currency
              )}</div>
              <div class="metric-subtext">Gesamtbudget der letzten 30 Tage</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">ROAS (30d)</div>
              <div class="metric-value">${roas30d.toFixed(2)}x</div>
              <div class="metric-subtext">Return on Ad Spend</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Campaign Health</div>
              <div class="metric-value">${healthLabel(health)}</div>
              <div class="metric-subtext">
                Status des verbundenen Brand-Setups
              </div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Report Datum</div>
              <div class="metric-value" style="font-size:1.1rem;">${todayLabel}</div>
              <div class="metric-subtext">
                Snapshot zum Zeitpunkt des Exports
              </div>
            </div>
          </div>

          <div class="reports-table-wrapper" style="margin-top:18px;">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Kampagne</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${
                  selectedBrand &&
                  DemoData.campaignsByBrand[selectedBrand.id] &&
                  DemoData.campaignsByBrand[selectedBrand.id].length
                    ? DemoData.campaignsByBrand[selectedBrand.id]
                        .map(
                          (c) => `
                      <tr>
                        <td>${c.name}</td>
                        <td>${c.status}</td>
                      </tr>
                    `
                        )
                        .join("")
                    : `
                    <tr>
                      <td colspan="2">
                        Keine Kampagnen im Demo-Datensatz gefunden.
                      </td>
                    </tr>
                  `
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rechte Seite: Export Panel -->
      <aside class="reports-sidebar">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Export Center</div>
              <div class="sensei-card-subtitle">
                Dateien für Kunden, Slack oder E-Mail.
              </div>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;margin-top:6px;">
            <button id="exportWeeklyPdf" class="meta-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-pdf"></i>&nbsp;Weekly Report (PDF Druck)
            </button>
            <button id="exportMonthlyPdf" class="meta-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-pdf"></i>&nbsp;Monthly Report (PDF Druck)
            </button>
            <button id="exportExecPdf" class="meta-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-signature"></i>&nbsp;Executive Summary (PDF Druck)
            </button>
          </div>

          <hr style="margin:14px 0;border:none;border-top:1px solid rgba(226,232,240,0.9);" />

          <div style="display:flex;flex-direction:column;gap:10px;">
            <button id="exportWeeklyCsv" class="sidebar-footer-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-csv"></i>&nbsp;Weekly CSV Export
            </button>
            <button id="exportMonthlyCsv" class="sidebar-footer-button" style="width:100%;justify-content:center;">
              <i class="fa-solid fa-file-csv"></i>&nbsp;Monthly CSV Export
            </button>
          </div>

          <p style="margin-top:12px;font-size:0.78rem;color:#6b7280;">
            In der Live-Integration werden hier echte Meta- und Shopify-Daten
            in PDFs & CSVs geschrieben. Aktuell nutzt das System deine Demo-Daten.
          </p>
        </div>
      </aside>
    </div>
  `;

  // --------------------------------------------------
  // Event Wiring – Buttons
  // --------------------------------------------------

  const weeklyPdfBtn = root.querySelector("#exportWeeklyPdf");
  const monthlyPdfBtn = root.querySelector("#exportMonthlyPdf");
  const execPdfBtn = root.querySelector("#exportExecPdf");
  const weeklyCsvBtn = root.querySelector("#exportWeeklyCsv");
  const monthlyCsvBtn = root.querySelector("#exportMonthlyCsv");

  if (weeklyPdfBtn) {
    weeklyPdfBtn.addEventListener("click", () => {
      window.SignalOne.showToast("Weekly Report wird vorbereitet…", "info");
      openPrintWindow("weekly");
    });
  }

  if (monthlyPdfBtn) {
    monthlyPdfBtn.addEventListener("click", () => {
      window.SignalOne.showToast("Monthly Report wird vorbereitet…", "info");
      openPrintWindow("monthly");
    });
  }

  if (execPdfBtn) {
    execPdfBtn.addEventListener("click", () => {
      window.SignalOne.showToast(
        "Executive Summary wird vorbereitet…",
        "info"
      );
      openPrintWindow("executive");
    });
  }

  if (weeklyCsvBtn) {
    weeklyCsvBtn.addEventListener("click", () => {
      exportCsv("weekly");
    });
  }

  if (monthlyCsvBtn) {
    monthlyCsvBtn.addEventListener("click", () => {
      exportCsv("monthly");
    });
  }
}
