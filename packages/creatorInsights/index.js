// packages/creatorInsights/index.js
// Creator Insights – Ranking & Performance je Creator.

export function render(root, AppState, { useDemoMode }) {
  const DemoData = window.SignalOneDemo?.DemoData || null;
  const brandId = AppState.selectedBrandId || (DemoData?.brands?.[0]?.id ?? null);

  const demoCreators = getDemoCreatorsForBrand(brandId);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Creator Insights</h2>
        <p class="view-subtitle">
          Performance-Ranking deiner Creator – nach ROAS, Spend und Stabilität.
        </p>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="metric-card">
        <div class="metric-label">Top Creator ROAS</div>
        <div class="metric-value">${
          demoCreators[0]?.roas != null ? demoCreators[0].roas.toFixed(1) : "n/a"
        }</div>
        <div class="metric-subtext">${demoCreators[0]?.name || "n/a"}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Creator Count</div>
        <div class="metric-value">${demoCreators.length}</div>
        <div class="metric-subtext">aktive Creator in diesem Brand</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Top 3 Share</div>
        <div class="metric-value">${
          demoCreators.length
            ? Math.round(
                (demoCreators.slice(0, 3).reduce((s, c) => s + c.spend, 0) /
                  demoCreators.reduce((s, c) => s + c.spend, 0)) *
                  100
              ) + "%"
            : "n/a"
        }</div>
        <div class="metric-subtext">Spend in Top 3 Creators</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Modus</div>
        <div class="metric-value">${useDemoMode ? "Demo" : "Live"}</div>
        <div class="metric-subtext">Quelle: ${
          useDemoMode ? "Demo-Daten" : "Meta + interne Engine"
        }</div>
      </div>
    </div>

    <div class="card">
      <table class="dashboard-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Creator</th>
            <th>ROAS</th>
            <th>Spend</th>
            <th>Stabilität</th>
            <th>Primärer Hook</th>
          </tr>
        </thead>
        <tbody>
          ${demoCreators
            .map((c, idx) => {
              const stabilityBadge = stabilityBadgeFor(c.stability);
              return `
              <tr>
                <td>${idx + 1}</td>
                <td>
                  <div class="log-message-main">${escapeHtml(c.name)}</div>
                  <div class="log-message-sub">${escapeHtml(
                    c.handle || ""
                  )}</div>
                </td>
                <td>${c.roas.toFixed(1)}</td>
                <td>${formatCurrency(c.spend)}</td>
                <td>${stabilityBadge}</td>
                <td>${escapeHtml(c.primaryHook)}</td>
              </tr>
              `;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="card">
      <h3 style="margin-bottom:8px;">Sensei Empfehlung auf Creator-Level</h3>
      <p style="font-size:0.86rem;margin:0 0 8px 0;">
        Fokus auf Creator mit <strong>stabilen</strong> Ergebnissen und ausreichendem Spend –
        aggressive Tests nur mit klarer Hypothese und sauberem Log im Testing Log.
      </p>
      <ul style="font-size:0.86rem;margin:0 0 0 18px;padding:0;">
        <li>Top 1–2 Creator mit hohem ROAS und Stabilität weiter skalieren.</li>
        <li>Creator mit volatilen Ergebnissen: nur 10–15% des Gesamtspends.</li>
        <li>Neue Creator zuerst im Testing Bucket fahren – nicht direkt in Main Scaling Kampagnen.</li>
      </ul>
    </div>
  `;
}

function getDemoCreatorsForBrand(brandId) {
  // Dummy-Daten; später ggf. aus Live-Daten ableitbar
  const base = [
    {
      id: "cr1",
      name: "Anna K.",
      handle: "@anna.ugc",
      roas: 5.1,
      spend: 12800,
      stability: "high",
      primaryHook: "Problem-first Hook mit POV UGC",
    },
    {
      id: "cr2",
      name: "Marvin",
      handle: "@marvin.creates",
      roas: 3.8,
      spend: 9600,
      stability: "medium",
      primaryHook: "Unboxing + Social Proof",
    },
    {
      id: "cr3",
      name: "Jule",
      handle: "@jule.studio",
      roas: 4.3,
      spend: 7200,
      stability: "high",
      primaryHook: "Before/After + Routine",
    },
    {
      id: "cr4",
      name: "Luca",
      handle: "@luca.ad",
      roas: 2.9,
      spend: 5400,
      stability: "volatile",
      primaryHook: "Hard-sell Hook mit Offer Fokus",
    },
  ];

  // In echt könnte brandId unterschiedliche Werte triggern; hier nur Variation
  if (!brandId) return base;
  if (brandId.includes("beauty")) {
    return base.map((c, i) => ({
      ...c,
      roas: c.roas + (i % 2 === 0 ? 0.4 : -0.2),
    }));
  }
  if (brandId.includes("tech")) {
    return base.map((c, i) => ({
      ...c,
      roas: c.roas + (i % 2 === 0 ? -0.4 : 0.1),
    }));
  }
  return base;
}

function stabilityBadgeFor(level) {
  const text =
    level === "high"
      ? "Stabil"
      : level === "medium"
      ? "Okay"
      : level === "volatile"
      ? "Volatil"
      : "n/a";
  const cls =
    level === "high"
      ? "badge-success"
      : level === "volatile"
      ? "badge-danger"
      : "badge-warning";
  return `<span class="badge-pill ${cls}">${text}</span>`;
}

function formatCurrency(value) {
  if (typeof value !== "number") return "n/a";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
