// packages/creatorInsights/index.js
// SignalOne – Creator Insights (Block 1)

const DemoDataCI = window.SignalOneDemo?.DemoData || null;

function buildCreatorLeaderboard() {
  // Simpler Demo-Leaderboard
  return [
    {
      handle: "@lena.fits",
      vertical: "Fashion UGC",
      brand: "ACME Fashion",
      avgRoas: 5.4,
      tests: 7,
      winners: 4,
    },
    {
      handle: "@techflo",
      vertical: "Tech Reviews",
      brand: "TechGadgets Pro",
      avgRoas: 4.1,
      tests: 4,
      winners: 3,
    },
    {
      handle: "@glow.with.ale",
      vertical: "Beauty / Skincare",
      brand: "BeautyLux Cosmetics",
      avgRoas: 6.2,
      tests: 5,
      winners: 4,
    },
    {
      handle: "@liftwithmarc",
      vertical: "Fitness / Gym",
      brand: "FitLife Supplements",
      avgRoas: 4.3,
      tests: 3,
      winners: 2,
    },
  ];
}

function buildBrandSnapshot() {
  const brands = DemoDataCI?.brands || [];
  return brands.map((b) => ({
    name: b.name,
    vertical: b.vertical,
    spend30d: b.spend30d,
    roas30d: b.roas30d,
    creatorCount: b.campaignHealth === "good" ? 5 : 2,
    activeCreators:
      b.campaignHealth === "good"
        ? "Stark aktiv"
        : b.campaignHealth === "warning"
        ? "Ausbaufähig"
        : "Unterversorgt",
  }));
}

function computeGlobalMetrics() {
  const brands = DemoDataCI?.brands || [];
  if (!brands.length) {
    return {
      spend: 0,
      roas: 0,
      creators: 0,
      signals: 0,
    };
  }
  const spend = brands.reduce((sum, b) => sum + (b.spend30d || 0), 0);
  const roas = brands.reduce((sum, b) => sum + (b.roas30d || 0), 0) / brands.length;
  const creators = brands.length * 3;
  const signals = brands.length * 12;

  return { spend, roas, creators, signals };
}

export function render(section, AppState, { useDemoMode }) {
  const leaderboard = buildCreatorLeaderboard();
  const brands = buildBrandSnapshot();
  const metrics = computeGlobalMetrics();

  section.innerHTML = `
    <header class="view-header">
      <div>
        <h2>Creator Insights</h2>
        <div class="view-subtitle">
          Ranking & Performance-Signale für deine Creator im Demo-Modus.
        </div>
      </div>
      <div>
        <span class="badge-pill">Modus: ${useDemoMode ? "Demo" : "Live"}</span>
      </div>
    </header>

    <section class="dashboard-section">
      <div class="kpi-grid">
        <article class="metric-card">
          <div class="metric-label">Gesamtspend (30d)</div>
          <div class="metric-value">
            €${metrics.spend.toLocaleString("de-DE", {
              maximumFractionDigits: 0,
            })}
          </div>
          <div class="metric-subtext">Über alle Demo-Brands</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Durchschnittlicher ROAS</div>
          <div class="metric-value">${metrics.roas.toFixed(1)}x</div>
          <div class="metric-subtext">Creator-getriebene Kampagnen</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Aktive Creator</div>
          <div class="metric-value">${metrics.creators}</div>
          <div class="metric-subtext">Demo-Pool – später API-basiert</div>
        </article>
        <article class="metric-card">
          <div class="metric-label">Signals</div>
          <div class="metric-value">${metrics.signals}</div>
          <div class="metric-subtext">Hook-, Format- & Funnel-Signale</div>
        </article>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section-title">Top Creator</div>
      <div class="dashboard-section-subtitle">
        Ranking nach durchschnittlichem ROAS und Winner-Rate im Testing.
      </div>

      <div class="campaign-table-wrapper">
        <table class="campaign-table">
          <thead>
            <tr>
              <th>Creator</th>
              <th>Vertical</th>
              <th>Brand</th>
              <th>Avg. ROAS</th>
              <th>Tests</th>
              <th>Winner</th>
              <th>Win-Rate</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard
              .map((c) => {
                const winRate = c.tests ? (c.winners / c.tests) * 100 : 0;
                return `
                <tr>
                  <td>${c.handle}</td>
                  <td>${c.vertical}</td>
                  <td>${c.brand}</td>
                  <td class="campaign-kpi">${c.avgRoas.toFixed(1)}x</td>
                  <td>${c.tests}</td>
                  <td>${c.winners}</td>
                  <td>${winRate.toFixed(0)}%</td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    </section>

    <section class="dashboard-section">
      <div class="dashboard-section-title">Brand Snapshot</div>
      <div class="dashboard-section-subtitle">
        Überblick, welche Brands wie stark mit Creators arbeiten.
      </div>

      <div class="reports-table-wrapper log-card">
        <table class="log-table">
          <thead>
            <tr>
              <th>Brand</th>
              <th>Vertical</th>
              <th>Spend (30d)</th>
              <th>ROAS</th>
              <th>Creator-Pool</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${brands
              .map(
                (b) => `
              <tr>
                <td>${b.name}</td>
                <td>${b.vertical}</td>
                <td>€${b.spend30d.toLocaleString("de-DE", {
                  maximumFractionDigits: 0,
                })}</td>
                <td>${b.roas30d.toFixed(1)}x</td>
                <td>${b.creatorCount} Creator</td>
                <td>${b.activeCreators}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}
