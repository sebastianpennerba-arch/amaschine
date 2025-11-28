// packages/reports/index.js
// Reports Center – Executive Summaries & Exporte (Demo).

export function render(root, AppState, { useDemoMode }) {
  const DemoData = window.SignalOneDemo?.DemoData || null;
  const brand = getCurrentBrand(AppState, DemoData);
  const brandName = brand?.name || "Deine Brand";
  const showToast = window.SignalOne?.showToast;

  const reports = getDemoReports(brandName);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Reports Center</h2>
        <p class="view-subtitle">
          Weekly & Monthly Reports als Executive Summary – ready für CEO & Kunde.
        </p>
      </div>
    </div>

    <div class="reports-layout">
      <!-- Linke Seite: Tabelle -->
      <div class="reports-table-wrapper">
        <table class="reports-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Zeitraum</th>
              <th>Brand</th>
              <th>Status</th>
              <th>Export</th>
            </tr>
          </thead>
          <tbody>
            ${reports
              .map((r) => {
                const statusBadge = statusBadgeFor(r.status);
                return `
                <tr>
                  <td>
                    <div class="log-message-main">${escapeHtml(r.title)}</div>
                    <div class="log-message-sub">${escapeHtml(
                      r.summary
                    )}</div>
                  </td>
                  <td>${escapeHtml(r.range)}</td>
                  <td>${escapeHtml(r.brand)}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <button
                      class="report-download-button"
                      data-report-id="${r.id}"
                      type="button"
                      style="padding:6px 10px;font-size:0.78rem;width:auto;"
                    >
                      Export (PDF Demo)
                    </button>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>

      <!-- Rechte Seite: Export-Panel -->
      <div class="card">
        <div class="sensei-card-header">
          <div>
            <div class="sensei-card-title">Report Generator</div>
            <div class="sensei-card-subtitle">
              Erzeuge Executive Reports für ${escapeHtml(brandName)}.
            </div>
          </div>
          <div class="sensei-ai-pill">AI Summary</div>
        </div>

        <div class="sensei-prompt-area">
          <label class="sensei-prompt-label">Zeitraum</label>
          <select id="reportRange" class="creative-filter-select" style="width:100%;">
            <option value="7d">Letzte 7 Tage</option>
            <option value="30d" selected>Letzte 30 Tage</option>
            <option value="90d">Letzte 90 Tage</option>
          </select>

          <label class="sensei-prompt-label" style="margin-top:8px;">Fokus</label>
          <textarea
            id="reportFocus"
            class="sensei-prompt-textarea"
            rows="3"
            placeholder="z.B. „Profit-Fokus, Skalierung mit kontrolliertem Risiko, Creative Learnings highlighten“"
          ></textarea>

          <button id="reportGenerateButton" class="sensei-generate-button" type="button">
            Report-Entwurf generieren
          </button>

          <div id="reportPreview" class="sensei-output" style="margin-top:10px;">
            <h4>Executive Summary (Demo)</h4>
            <p style="margin:0 0 6px 0;font-size:0.86rem;">
              Hier wird der automatisch generierte Report-Text angezeigt – perfekt für Export oder Copy-Paste in Mails.
            </p>
          </div>
        </div>

        <div class="report-hint-card" style="margin-top:12px;">
          <strong>Hinweis:</strong> Im Live-Modus zieht SignalOne echte Meta-Daten,
          baut eine Executive Summary und erzeugt fertige White-Label Reports.
        </div>
      </div>
    </div>
  `;

  // Export Buttons
  root.querySelectorAll("[data-report-id]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-report-id");
      if (!id) return;
      showToast &&
        showToast(
          "Report-Export ist im Demo-Modus nur simuliert. (PDF-Export folgt in P6).",
          "success"
        );
    });
  });

  // Report Generator
  const btnGen = root.querySelector("#reportGenerateButton");
  const preview = root.querySelector("#reportPreview");
  const rangeSel = root.querySelector("#reportRange");
  const focusEl = root.querySelector("#reportFocus");

  if (btnGen && preview && rangeSel && focusEl) {
    btnGen.addEventListener("click", () => {
      const range = /** @type {HTMLSelectElement} */ (rangeSel).value;
      const focus = /** @type {HTMLTextAreaElement} */ (focusEl).value.trim();
      const html = generateReportPreview({
        range,
        focus,
        brandName,
        useDemoMode,
      });
      preview.innerHTML = html;
      showToast &&
        showToast(
          "Report-Entwurf aktualisiert – du kannst den Text direkt verwenden.",
          "success"
        );
    });
  }
}

function getCurrentBrand(AppState, DemoData) {
  if (!DemoData || !DemoData.brands) return null;
  const id = AppState.selectedBrandId;
  if (!id) return DemoData.brands[0] || null;
  return DemoData.brands.find((b) => b.id === id) || DemoData.brands[0] || null;
}

function getDemoReports(brandName) {
  return [
    {
      id: "r1",
      title: "Weekly Performance Report",
      range: "KW " + getIsoWeek(),
      brand: brandName,
      status: "ready",
      summary: "Kurzüberblick über Spend, ROAS, Top Creatives & Alerts.",
    },
    {
      id: "r2",
      title: "Monthly Executive Report",
      range: currentMonthLabel(),
      brand: brandName,
      status: "draft",
      summary: "Ideal für C-Level & Kunden – inkl. Strategieempfehlungen.",
    },
    {
      id: "r3",
      title: "Testing Summary",
      range: "Letzte 30 Tage",
      brand: brandName,
      status: "in_progress",
      summary: "Auswertung aller gespeicherten Tests im Testing Log.",
    },
  ];
}

function statusBadgeFor(status) {
  if (status === "ready") {
    return `<span class="badge-pill badge-success">Ready</span>`;
  }
  if (status === "in_progress") {
    return `<span class="badge-pill badge-warning">In Arbeit</span>`;
  }
  if (status === "draft") {
    return `<span class="badge-pill">Draft</span>`;
  }
  return `<span class="badge-pill">${escapeHtml(status || "n/a")}</span>`;
}

function generateReportPreview({ range, focus, brandName, useDemoMode }) {
  const rangeLabel =
    range === "7d"
      ? "letzten 7 Tage"
      : range === "30d"
      ? "letzten 30 Tage"
      : "letzten 90 Tage";

  const focusHtml = focus
    ? `<p style="margin:6px 0 8px 0;">Fokus laut Briefing: <strong>${escapeHtml(
        focus
      )}</strong></p>`
    : "";

  return `
    <h4>Executive Summary – ${escapeHtml(brandName)}</h4>
    <p style="margin:0 0 6px 0;font-size:0.86rem;">
      Zeitraum: ${rangeLabel} · Quelle: ${
    useDemoMode ? "Demo-Daten" : "Meta Live-Daten"
  }
    </p>
    ${focusHtml}
    <p style="margin:0 0 6px 0;font-size:0.86rem;">
      1. <strong>Performance Overview:</strong> Spend, Umsatz und ROAS liegen im erwarteten Korridor.
      Skalierung fand kontrolliert statt, ohne den Profit zu killen.
    </p>
    <p style="margin:0 0 6px 0;font-size:0.86rem;">
      2. <strong>Creative Learnings:</strong> UGC-Hooks outperformen statische Creatives in fast allen wichtigen Zielgruppen.
      Winner-Creatives wurden in die Main Scaling Kampagnen übernommen.
    </p>
    <p style="margin:0 0 6px 0;font-size:0.86rem;">
      3. <strong>Testing & Next Steps:</strong> Die wichtigsten Tests wurden im Testing Log dokumentiert.
      Auf Basis der gewonnenen Learnings empfiehlt Sensei, die Budgets moderat zu erhöhen und
      weitere Creator mit ähnlichen Patterns einzubinden.
    </p>
    <p style="margin:8px 0 0 0;font-size:0.8rem;color:#6b7280;">
      Dieser Text ist ein automatisch generierter Entwurf.
      Im Live-Modus werden konkrete Zahlen, Creatives und Charts eingefügt.
    </p>
  `;
}

function getIsoWeek() {
  const date = new Date();
  const target = new Date(
    date.valueOf() +
      (date.getTimezoneOffset() + 60) * 60 * 1000 // grobe EU-Korrektur
  );
  const dayNr = (target.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const diff =
    target.getTime() - firstThursday.getTime() + (firstThursday.getDay() - 4) * 86400000;
  const week = 1 + Math.round(diff / 604800000);
  return week.toString().padStart(2, "0");
}

function currentMonthLabel() {
  return new Date().toLocaleDateString("de-DE", {
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
