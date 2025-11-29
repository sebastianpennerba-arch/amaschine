// packages/testingLog/index.js
// SignalOne – Testing Log (Block 1)

const DemoDataTL = window.SignalOneDemo?.DemoData || null;

function getCurrentBrandId(appState) {
  if (appState.selectedBrandId) return appState.selectedBrandId;
  const brands = DemoDataTL?.brands || [];
  return brands[0]?.id || null;
}

function buildDemoTests(AppState) {
  const brandId = getCurrentBrandId(AppState);
  const brand =
    (DemoDataTL?.brands || []).find((b) => b.id === brandId) || null;
  const campaigns = DemoDataTL?.campaignsByBrand?.[brandId] || [];

  const tests = [];

  campaigns.forEach((c, index) => {
    tests.push({
      id: `${brandId}_${c.id}_T${index + 1}`,
      campaignName: c.name,
      hypothesis:
        c.status === "TESTING"
          ? "Neuer Hook schlägt Control in CTR um 20%."
          : "Thumbnail-Variation für mehr Scroll-Stop.",
      variantA: "Control",
      variantB: "New Hook",
      status: c.status === "TESTING" ? "running" : "completed",
      winner: c.status === "TESTING" ? "–" : index % 2 === 0 ? "B" : "A",
      uplift: c.status === "TESTING" ? null : index % 2 === 0 ? 0.23 : 0.11,
      started: "vor 7 Tagen",
    });
  });

  if (!tests.length && brand) {
    tests.push({
      id: `${brandId}_demo_1`,
      campaignName: "Demo Test – First Hook Battle",
      hypothesis: "Hook mit Schmerzpunkt outperformt generischen Hook.",
      variantA: "„Schon wieder …?“",
      variantB: "„Hör auf damit, dein Geld zu verbrennen…“",
      status: "running",
      winner: "–",
      uplift: null,
      started: "vor 3 Tagen",
    });
  }

  return { brand, tests };
}

function renderRow(t) {
  return `
    <tr>
      <td>
        <div class="campaign-name">${t.campaignName}</div>
        <div class="campaign-sub">${t.hypothesis}</div>
      </td>
      <td>${t.variantA}</td>
      <td>${t.variantB}</td>
      <td>
        <span class="log-level-badge ${
          t.status === "running"
            ? "warning"
            : t.status === "completed"
            ? "info"
            : ""
        }">
          ${t.status === "running" ? "Running" : "Completed"}
        </span>
      </td>
      <td>${
        t.winner === "–"
          ? "–"
          : `Variante ${t.winner} (+${Math.round((t.uplift || 0) * 100)}%)`
      }</td>
      <td>${t.started}</td>
    </tr>
  `;
}

export function render(section, AppState, { useDemoMode }) {
  const { brand, tests } = buildDemoTests(AppState);

  section.innerHTML = `
    <header class="view-header">
      <div>
        <h2>Testing Log</h2>
        <div class="view-subtitle">
          Hypothesen, Varianten & Winner/Loser für ${brand?.name || "Demo Brand"}.
        </div>
      </div>
      <div>
        <span class="badge-pill">Modus: ${useDemoMode ? "Demo" : "Live"}</span>
      </div>
    </header>

    <section class="dashboard-section">
      <div class="kpi-grid">
        <article class="metric-card">
          <div class="metric-label">Aktive Tests</div>
          <div class="metric-value">${
            tests.filter((t) => t.status === "running").length
          }</div>
          <div class="metric-subtext">Hypothesen in Auswertung</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Abgeschlossene Tests</div>
          <div class="metric-value">${
            tests.filter((t) => t.status === "completed").length
          }</div>
          <div class="metric-subtext">Basis für Creative Scaling</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Winner-Rate</div>
          <div class="metric-value">
            ${
              (() => {
                const completed = tests.filter(
                  (t) => t.status === "completed"
                );
                if (!completed.length) return "—";
                const winners = completed.filter((t) => t.winner !== "–");
                const rate = (winners.length / completed.length) * 100;
                return `${rate.toFixed(0)}%`;
              })()
            }
          </div>
          <div class="metric-subtext">Anteil Tests mit klarer Gewinner-Variante</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Demo-Level</div>
          <div class="metric-value">T1</div>
          <div class="metric-subtext">Später: echte Testreihen & Phasen</div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section-title">Test-Übersicht</div>
      <div class="dashboard-section-subtitle">
        Überblick über alle kreativen Tests – verknüpft mit Kampagnen & Creatives (Demo).
      </div>

      <div class="reports-table-wrapper log-card">
        <table class="log-table">
          <thead>
            <tr>
              <th>Kampagne / Hypothese</th>
              <th>Variante A</th>
              <th>Variante B</th>
              <th>Status</th>
              <th>Winner / Uplift</th>
              <th>Start</th>
            </tr>
          </thead>
          <tbody>
            ${
              tests.length
                ? tests.map(renderRow).join("")
                : `<tr><td colspan="6" style="padding:16px;font-size:0.9rem;color:#64748b;">
                    Noch keine Tests im Demo-Modus angelegt.
                   </td></tr>`
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}
