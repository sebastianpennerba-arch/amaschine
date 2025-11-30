/*
 * packages/dashboard/index.js
 * SignalOne Demo-Dashboard
 * Nutzt DemoData über window.SignalOneDemo und respektiert Meta/Demo-Status.
 */

function getDemoData() {
  return window.SignalOneDemo?.DemoData || null;
}

function getActiveBrandFromState(appState) {
  const demo = getDemoData();
  if (!demo || !demo.brands || !demo.brands.length) return null;

  const id = appState.selectedBrandId || demo.brands[0].id;
  return demo.brands.find((b) => b.id === id) || demo.brands[0];
}

function formatCurrency(value) {
  if (value == null || Number.isNaN(value)) return "–";
  return value.toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });
}

function formatNumber(value, fractionDigits = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + suffix
  );
}

function formatPercent(value, fractionDigits = 2) {
  if (value == null || Number.isNaN(value)) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    }) + " %"
  );
}

/**
 * Demo-Metriken pro Brand: Basis ist spend30d / roas30d aus DemoData,
 * der Rest ist ein konsistenter Fake-Layer.
 */
function buildBrandMetrics(brand) {
  if (!brand) {
    return {
      spend30d: 0,
      roas30d: 0,
      revenue30d: 0,
      estimatedProfit: 0,
      ctr30d: 0,
      cpc: 0,
      cpm: 0,
      conversions30d: 0,
    };
  }

  const overrides = {
    acme_fashion: {
      ctr30d: 2.7,
      cpc: 1,
      cpm: 8,
      conversions30d: 2180,
    },
    techgadgets_pro: {
      ctr30d: 1.9,
      cpc: 1.4,
      cpm: 11,
      conversions30d: 940,
    },
    beautylux_cosmetics: {
      ctr30d: 3.4,
      cpc: 0.9,
      cpm: 7,
      conversions30d: 3620,
    },
    fitlife_supplements: {
      ctr30d: 2.3,
      cpc: 1.1,
      cpm: 9,
      conversions30d: 1740,
    },
    homezen_living: {
      ctr30d: 1.8,
      cpc: 1.3,
      cpm: 12,
      conversions30d: 680,
    },
  };

  const baseSpend = brand.spend30d || 0;
  const baseRoas = brand.roas30d || 0;
  const revenue30d = baseSpend * baseRoas;
  const estimatedProfit = revenue30d - baseSpend;

  const extra =
    overrides[brand.id] || {
      ctr30d: 2.4,
      cpc: 1.1,
      cpm: 9,
      conversions30d: Math.round(revenue30d / 120),
    };

  return {
    spend30d: baseSpend,
    roas30d: baseRoas,
    revenue30d,
    estimatedProfit,
    ctr30d: extra.ctr30d,
    cpc: extra.cpc,
    cpm: extra.cpm,
    conversions30d: extra.conversions30d,
  };
}

/**
 * Demo-Performance-Tendenz (letzte 7 Tage) – leichte Variation pro Brand.
 */
function buildPerformanceTrend(brand) {
  const base = [
    { label: "Mo", roas: 4.4 },
    { label: "Di", roas: 4.5 },
    { label: "Mi", roas: 4.7 },
    { label: "Do", roas: 4.8 },
    { label: "Fr", roas: 4.9 },
    { label: "Sa", roas: 5.1 },
    { label: "So", roas: 5.2 },
  ];

  if (!brand) return base;

  const factorMap = {
    acme_fashion: 1,
    techgadgets_pro: 0.8,
    beautylux_cosmetics: 1.15,
    fitlife_supplements: 0.95,
    homezen_living: 0.75,
  };

  const factor = factorMap[brand.id] ?? 1;
  return base.map((d) => ({
    label: d.label,
    roas: +(d.roas * factor).toFixed(1),
  }));
}

function buildAlertCopy(brand, metrics, isDemo, isConnected) {
  const healthCopy = {
    good: "Alles stabil – keine kritischen Probleme erkannt.",
    warning:
      "Einige Kampagnen laufen leicht unter Ziel. Nutze strukturierte Tests, um Performance zu stabilisieren.",
    critical:
      "Mehrere Kampagnen sind klar unter Ziel. Fokus auf Creative-Testing & Budget-Shift notwendig.",
  };

  const health = brand?.campaignHealth || "good";
  const baseLine = healthCopy[health];

  const modeLine = isConnected
    ? isDemo
      ? "Meta ist verbunden (Demo). Live-Sync kann jederzeit aktiviert werden."
      : "Meta ist live verbunden. Änderungen wirken direkt auf deine Kampagnen."
    : "Meta ist aktuell nicht verbunden. Du arbeitest im reinen Demo-Modus.";

  const profitLine =
    metrics.estimatedProfit > 0
      ? `Aktueller 30-Tage-ROAS liegt bei ${formatNumber(
          metrics.roas30d,
          1,
          "x"
        )} mit einem geschätzten Profit von ${formatCurrency(
          metrics.estimatedProfit
        )}.`
      : "Profit-Schätzung aktuell neutral – Fokus auf Effizienz & Tests.";

  return { baseLine, modeLine, profitLine };
}

function buildSenseiInsight(brand, metrics) {
  if (!brand || !metrics) return "";

  const profitNice = formatCurrency(metrics.estimatedProfit);
  const roasNice = formatNumber(metrics.roas30d, 1, "x");

  return `
    Für <strong>${brand.name}</strong> liegt der aktuelle 30-Tage-ROAS bei
    <strong>${roasNice}</strong> bei einem geschätzten Profit von
    <strong>${profitNice}</strong>. Keine kritischen Probleme im Account sichtbar.
    Nutze das Momentum, um den Gewinner weiter zu skalieren und strukturierte Creative-Tests aufzusetzen.
  `;
}

function buildCreativesDemoRows(brand) {
  const base = [
    {
      name: "UGC – „Outfit Haul” (Reel)",
      tag: "UGC • Hook-Test",
      spend: 18320,
      roas: 5.1,
      status: "Winner",
    },
    {
      name: "Static – „New Collection”",
      tag: "Static • Angle-Test",
      spend: 9420,
      roas: 4.3,
      status: "Scaling",
    },
    {
      name: "Story – „-20% Drop”",
      tag: "Story • Offer-Test",
      spend: 6620,
      roas: 3.8,
      status: "Learning",
    },
  ];

  // sehr leichte Variation nach Brand, aber rein kosmetisch
  if (!brand) return base;

  const factorMap = {
    techgadgets_pro: 0.9,
    beautylux_cosmetics: 1.2,
    fitlife_supplements: 1.05,
    homezen_living: 0.8,
  };

  const f = factorMap[brand.id] ?? 1;
  return base.map((c) => ({
    ...c,
    spend: Math.round(c.spend * f),
    roas: +(c.roas * f).toFixed(1),
  }));
}

function buildTagsDemoRows() {
  return [
    { tag: "Problem → Lösung", usage: "32%", note: "Startet stark in UGC & Static." },
    { tag: "Before / After", usage: "21%", note: "Besonders effektiv im Beauty-Vertical." },
    { tag: "„POV: ...“-Hooks", usage: "17%", note: "Gut für Reels mit Creator-Fokus." },
    { tag: "Reframing Price", usage: "12%", note: "Funktioniert in Retargeting sehr stabil." },
  ];
}

function buildCampaignTableRows(brand, metrics) {
  const demo = getDemoData();
  const campaigns = demo?.campaignsByBrand?.[brand?.id] || [];

  return campaigns.map((c, idx) => {
    // simple fakes, leicht gestaffelt
    const spend = (metrics.spend30d || 0) * (0.25 - idx * 0.04);
    const roas = metrics.roas30d - idx * 0.4;
    const cpm = metrics.cpm + idx * 1.2;
    const ctr = Math.max(0.9, metrics.ctr30d - idx * 0.3);

    return {
      name: c.name,
      status: c.status,
      spend,
      roas,
      cpm,
      ctr,
    };
  });
}

function renderPerformanceTrendHtml(trend) {
  if (!trend || !trend.length) return "";

  const maxRoas = trend.reduce((m, d) => (d.roas > m ? d.roas : m), 0) || 1;

  const rows = trend
    .map((d) => {
      const width = Math.max(8, Math.round((d.roas / maxRoas) * 100));
      return `
        <div class="perf-row" style="display:flex;align-items:center;gap:8px;margin:4px 0;">
          <div style="width:18px;font-size:0.78rem;color:var(--color-text-soft);">${d.label}</div>
          <div style="flex:1;">
            <div
              style="
                height:7px;
                border-radius:999px;
                background:linear-gradient(90deg,#d1d5db,#e5e7eb);
                overflow:hidden;
              "
            >
              <div
                style="
                  width:${width}%;
                  height:100%;
                  border-radius:inherit;
                  background:linear-gradient(90deg,#4f46e5,#22c55e);
                "
              ></div>
            </div>
          </div>
          <div style="width:40px;text-align:right;font-size:0.78rem;font-variant-numeric:tabular-nums;">
            ${formatNumber(d.roas, 1, "x")}
          </div>
        </div>
      `;
    })
    .join("");

  return `<div style="margin-top:6px;">${rows}</div>`;
}

export function render(section, appState, opts = {}) {
  const isDemo = typeof opts.useDemoMode === "function" ? opts.useDemoMode : () => true;
  const demoModeActive = !!isDemo();
  const isConnected = !!appState.metaConnected;

  const brand = getActiveBrandFromState(appState);
  const metrics = buildBrandMetrics(brand);
  const trend = buildPerformanceTrend(brand);
  const alerts = buildAlertCopy(brand, metrics, demoModeActive, isConnected);
  const creatives = buildCreativesDemoRows(brand);
  const tags = buildTagsDemoRows();
  const campaigns = buildCampaignTableRows(brand, metrics);
  const senseiInsight = buildSenseiInsight(brand, metrics);

  const spendNice = formatCurrency(metrics.spend30d);
  const revenueNice = formatCurrency(metrics.revenue30d);
  const profitNice = formatCurrency(metrics.estimatedProfit);

  const modeLabel = demoModeActive ? "Demo-Modus aktiv" : "Live-Daten";
  const modeBadgeClass = demoModeActive
    ? "kpi-badge warning"
    : "kpi-badge good";

  const brandLine =
    brand && brand.name && metrics.roas30d
      ? `${brand.name} • ROAS ${formatNumber(metrics.roas30d, 1, "x")} • Spend 30 Tage: ${spendNice}`
      : "Keine Brand ausgewählt – Demo-Fallback aktiv.";

  section.innerHTML = `
    <div class="view-header">
      <div>
        <h2>SignalOne Performance Dashboard</h2>
        <p class="view-header-sub">
          ${
            brand
              ? `${brand.name} • ${brand.vertical}`
              : "SignalOne Demo-Workspace"
          }
        </p>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="${modeBadgeClass}">
            ${modeLabel}
          </span>
          <span style="font-size:0.78rem;color:var(--color-text-soft);">
            ${isConnected ? "Meta verbunden" : "Meta nicht verbunden"}
          </span>
        </div>
        <span style="font-size:0.74rem;color:var(--color-text-muted);">
          ${brandLine}
        </span>
      </div>
    </div>

    <div class="card dashboard-card" style="margin-bottom:16px;">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:flex-end;gap:10px;margin-bottom:10px;">
        <div>
          <h3 class="card-title">Account KPIs (letzte 30 Tage)</h3>
          <p class="card-subtitle">
            Simulierte Meta-Daten – verhalten sich später identisch zu Live-Daten.
          </p>
        </div>
        <div style="text-align:right;font-size:0.78rem;color:var(--color-text-soft);">
          <div>Standard-Range: Letzte 30 Tage</div>
          <div>Währung: EUR • Zeitzone: Europe/Berlin</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-item">
          <div class="kpi-label">Ad Spend (30 Tage)</div>
          <div class="kpi-value">${spendNice}</div>
          <div class="kpi-meta">Budget, das in Meta Ads investiert wurde.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">Revenue (30 Tage)</div>
          <div class="kpi-value">${revenueNice}</div>
          <div class="kpi-meta">Umsatz, der aus bezahltem Traffic stammt.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">ROAS</div>
          <div class="kpi-value">${formatNumber(metrics.roas30d, 1, "x")}</div>
          <div class="kpi-meta">Return on Ad Spend des Accounts.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">CTR</div>
          <div class="kpi-value">${formatPercent(metrics.ctr30d)}</div>
          <div class="kpi-meta">Durchschnittliche Click-Through-Rate.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">CPC</div>
          <div class="kpi-value">${formatCurrency(metrics.cpc)}</div>
          <div class="kpi-meta">Durchschnittlicher Cost per Click.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">CPM</div>
          <div class="kpi-value">${formatCurrency(metrics.cpm)}</div>
          <div class="kpi-meta">Kosten pro 1.000 Impressionen.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">Conversions (30 Tage)</div>
          <div class="kpi-value">
            ${metrics.conversions30d.toLocaleString("de-DE")}
          </div>
          <div class="kpi-meta">Trackbare Käufe / Leads aus den Kampagnen.</div>
        </div>

        <div class="kpi-item">
          <div class="kpi-label">Estimated Profit</div>
          <div class="kpi-value">${profitNice}</div>
          <div class="kpi-meta">
            Vereinfachte Profit-Schätzung: Umsatz – Ad Spend.
          </div>
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="card dashboard-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Performance-Tendenz (letzte 7 Tage)</h3>
            <p class="card-subtitle">
              Zeigt, ob dein ROAS Momentum gewinnt oder verliert.
            </p>
          </div>
        </div>
        ${renderPerformanceTrendHtml(trend)}
      </div>

      <div class="card dashboard-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Alerts & Checks</h3>
            <p class="card-subtitle">
              Automatische SignalOne-Checks über alle Kampagnen.
            </p>
          </div>
        </div>
        <div style="font-size:0.82rem;color:var(--color-text-main);">
          <p style="margin-bottom:6px;">
            <strong>${alerts.baseLine}</strong>
          </p>
          <ul style="margin:0 0 8px 18px;padding:0;font-size:0.8rem;color:var(--color-text-muted);line-height:1.5;">
            <li>${alerts.modeLine}</li>
            <li>${alerts.profitLine}</li>
            <li>Keine kritischen Systemfehler – System Health ist <strong>OK</strong>.</li>
          </ul>
          <p style="margin:0;font-size:0.78rem;color:var(--color-text-soft);">
            Später: echte Alert-Engine mit Webhooks, Slack & E-Mail.
          </p>
        </div>
      </div>
    </div>

    <div class="card dashboard-card" style="margin-bottom:16px;">
      <div class="card-header">
        <h3 class="card-title">Sensei Insight</h3>
        <p class="card-subtitle">
          Kurz-Zusammenfassung, wie dein Account aktuell performt – Demo-Version.
        </p>
      </div>
      <div style="font-size:0.86rem;color:var(--color-text-main);">
        ${senseiInsight}
      </div>
    </div>

    <div class="dashboard-section">
      <div class="card dashboard-card">
        <div class="card-header">
          <h3 class="card-title">Top Creatives (letzte 30 Tage)</h3>
          <p class="card-subtitle">Demo-Daten: verhalten sich wie echte Library.</p>
        </div>
        <table class="table-mini">
          <thead>
            <tr>
              <th>Creative</th>
              <th>Tag</th>
              <th>Spend</th>
              <th>ROAS</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${creatives
              .map(
                (c) => `
              <tr>
                <td>${c.name}</td>
                <td>${c.tag}</td>
                <td>${formatCurrency(c.spend)}</td>
                <td>${formatNumber(c.roas, 1, "x")}</td>
                <td>${c.status}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>

      <div class="card dashboard-card">
        <div class="card-header">
          <h3 class="card-title">Tag / Angle Overview</h3>
          <p class="card-subtitle">Welche Creative-Ansätze aktuell ziehen.</p>
        </div>
        <table class="table-mini">
          <thead>
            <tr>
              <th>Tag</th>
              <th>Nutzung</th>
              <th>Notiz</th>
            </tr>
          </thead>
          <tbody>
            ${tags
              .map(
                (t) => `
              <tr>
                <td>${t.tag}</td>
                <td>${t.usage}</td>
                <td>${t.note}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </div>

    <div class="card dashboard-card" style="margin-top:16px;">
      <div class="card-header">
        <h3 class="card-title">Kampagnen-Übersicht (30 Tage)</h3>
        <p class="card-subtitle">
          Kompakte Demo-Tabelle – später 1:1 durch Live-Meta-Insights ersetzt.
        </p>
      </div>
      <table>
        <thead>
          <tr>
            <th>Kampagne</th>
            <th>Status</th>
            <th>Spend (30d)</th>
            <th>ROAS</th>
            <th>CPM</th>
            <th>CTR</th>
          </tr>
        </thead>
        <tbody>
          ${
            campaigns.length
              ? campaigns
                  .map(
                    (c) => `
                <tr>
                  <td>${c.name}</td>
                  <td>${c.status}</td>
                  <td>${formatCurrency(c.spend)}</td>
                  <td>${formatNumber(c.roas, 1, "x")}</td>
                  <td>${formatCurrency(c.cpm)}</td>
                  <td>${formatPercent(c.ctr)}</td>
                </tr>`
                  )
                  .join("")
              : `<tr><td colspan="6">Für dieses Werbekonto sind in der Demo aktuell keine Kampagnen hinterlegt.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
}
