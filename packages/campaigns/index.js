// packages/campaigns/index.js
// -----------------------------------------------------------------------------
// 📊 SignalOne Campaigns Engine 2.0 – Premium (Hybrid C)
// - Nutzt DataLayer.fetchCampaignsForAccount()
// - Zeigt Kampagnen im VisionOS-Stil (Cards / Grid)
// - Health-Badges, Scaling-/Risk-Tags, Testing-Markierungen
// - Demo & Live werden automatisch unterstützt
// -----------------------------------------------------------------------------
//
// Erwartet:
//   render(section, AppState, { useDemoMode: boolean })
//
// Wichtig:
//   - Grundgerüst (index.html / Sidebar / Layout) bleibt unberührt
//   - Dieses Modul füllt nur #campaignsView mit Inhalt
// -----------------------------------------------------------------------------

import DataLayer from "../data/index.js";

// Entry Point für app.js → loadModule("campaigns")
export function render(section, AppState, opts = {}) {
  if (!section) {
    console.error("[Campaigns] Missing target section.");
    return;
  }

  const useDemoMode = !!opts.useDemoMode;
  void renderCampaignsView(section, AppState, useDemoMode);
}

/* -------------------------------------------------------------------------- */
/*  Haupt-Render-Flow                                                         */
/* -------------------------------------------------------------------------- */

async function renderCampaignsView(section, AppState, useDemoMode) {
  const accountId = resolveAccountId(AppState);

  // Initialer Placeholder
  section.innerHTML = `
    <div class="campaign-view-root">
      <div class="campaign-header">
        <div class="campaign-header-main">
          <div class="view-kicker">SignalOne • Campaign Engine 2.0</div>
          <h2 class="view-headline">Kampagnenübersicht</h2>
          <p class="view-subline">
            Alle aktiven, testenden und pausierten Kampagnen deines Kontos – inklusive
            Health-Bewertung, Scaling-Signalen und Risikoindikatoren. Die Daten kommen
            direkt aus dem zentralen SignalOne DataLayer
            (${useDemoMode ? "Demo/Showroom-Modus" : "Live/Hybrid-Modus"}).
          </p>
          <div class="view-meta-row">
            <span class="kpi-badge warning">
              Kampagnen werden geladen …
            </span>
          </div>
        </div>
        <div class="campaign-header-meta">
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Brand</div>
            <div class="creative-mini-kpi-value">
              ${escapeHtml(getBrandName(AppState) || "Aktive Brand")}
            </div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Modus</div>
            <div class="creative-mini-kpi-value">
              ${useDemoMode ? "Demo / Showroom" : "Live / Hybrid"}
            </div>
          </div>
        </div>
      </div>

      <div class="campaign-grid">
        <div class="campaign-card empty-state-glass">
          <div class="empty-state">
            <div class="empty-state-icon">📡</div>
            <h3 class="empty-state-title">Kampagnen werden geladen</h3>
            <p class="empty-state-text">
              Wir holen gerade deine Kampagnen und berechnen Health-Scores, Scaling-Chancen
              und Risikoindikatoren. Bitte einen Moment Geduld.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  try {
    const result = await DataLayer.fetchCampaignsForAccount({
      accountId,
      preferLive: !useDemoMode,
    });

    const items = Array.isArray(result?.items) ? result.items : [];
    const source = classifySource(result?._source, useDemoMode);

    renderCampaignGrid(section, items, AppState, {
      useDemoMode,
      source,
    });
  } catch (err) {
    console.error("[Campaigns] Failed to load campaigns:", err);
    renderErrorState(section, err);
    safeToast(
      "Kampagnen konnten nicht geladen werden – prüfe Meta-Connect oder nutze den Demo-Modus.",
      "error"
    );
  }
}

/* -------------------------------------------------------------------------- */
/*  Grid-Rendering                                                            */
/* -------------------------------------------------------------------------- */

function renderCampaignGrid(section, campaigns, AppState, ctx) {
  const hasItems = campaigns && campaigns.length > 0;
  const source = ctx.source;
  const useDemoMode = !!ctx.useDemoMode;

  if (!hasItems) {
    section.innerHTML = `
      <div class="campaign-view-root">
        <div class="campaign-header">
          <div class="campaign-header-main">
            <div class="view-kicker">SignalOne • Campaign Engine 2.0</div>
            <h2 class="view-headline">Kampagnenübersicht</h2>
            <p class="view-subline">
              Aktuell wurden keine Kampagnen gefunden. ${
                useDemoMode
                  ? "Im Demo-Modus solltest du immer mindestens ein volles Demo-Konto sehen. Bitte prüfe die Demo-Datenkonfiguration."
                  : "Verbinde dein Meta-Konto oder aktiviere den Demo-Modus, um Kampagnen zu sehen."
              }
            </p>
            <div class="view-meta-row">
              <span class="kpi-badge ${source.badgeClass}">
                Datenmodus: ${source.label}
              </span>
            </div>
          </div>
        </div>
        <div class="empty-state empty-state-glass">
          <div class="empty-state-icon">🧺</div>
          <h3 class="empty-state-title">Keine Kampagnen vorhanden</h3>
          <p class="empty-state-text">
            Sobald du Kampagnen in deinem Meta-Account laufen hast oder den Demo-Modus
            aktivierst, erscheinen sie hier mit Health-Bewertungen und Insights.
          </p>
        </div>
      </div>
    `;
    return;
  }

  // Health & Sortierung vorbereiten
  const enriched = campaigns.map((c) => {
    const health = computeCampaignHealth(c);
    return { raw: c, health };
  });

  // Sortiert nach Health + Spend (beste zuerst)
  enriched.sort((a, b) => {
    if (b.health.score !== a.health.score) {
      return b.health.score - a.health.score;
    }
    const spendA = a.raw.metrics?.spend || 0;
    const spendB = b.raw.metrics?.spend || 0;
    return spendB - spendA;
  });

  const brandName = getBrandName(AppState) || "Brand";
  const timeRange =
    (AppState.settings && AppState.settings.defaultRange) || "letzte 7 Tage";

  const cardsHtml = enriched
    .map(({ raw, health }) => renderCampaignCard(raw, health, AppState))
    .join("");

  section.innerHTML = `
    <div class="campaign-view-root">
      <div class="campaign-header">
        <div class="campaign-header-main">
          <div class="view-kicker">SignalOne • Campaign Engine 2.0</div>
          <h2 class="view-headline">Kampagnenübersicht</h2>
          <p class="view-subline">
            Alle aktiven und pausierten Kampagnen von
            <strong>${escapeHtml(brandName)}</strong>, sortiert nach Health und Spend.
            Nutze die Karten, um schnell Scaling-Chancen, Tests und Problemfälle zu erkennen.
          </p>
          <div class="view-meta-row">
            <span class="kpi-badge ${source.badgeClass}">
              Datenmodus: ${source.label}
            </span>
            <span class="kpi-badge">
              Range: ${escapeHtml(timeRange)}
            </span>
          </div>
        </div>
        <div class="campaign-header-meta">
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Brand</div>
            <div class="creative-mini-kpi-value">
              ${escapeHtml(brandName)}
            </div>
          </div>
          <div class="creative-mini-kpi">
            <div class="creative-mini-kpi-label">Kampagnen</div>
            <div class="creative-mini-kpi-value">
              ${campaigns.length}
            </div>
          </div>
        </div>
      </div>

      <div class="campaign-grid">
        ${cardsHtml}
      </div>
    </div>
  `;

  wireCampaignActions(section, enriched);
}

/* -------------------------------------------------------------------------- */
/*  Card-Rendering                                                            */
/* -------------------------------------------------------------------------- */

function renderCampaignCard(camp, health, AppState) {
  const metrics = camp.metrics || {};
  const currencyCode = (AppState.settings && AppState.settings.currency) || "EUR";

  const tags = buildCampaignTags(camp, health);

  return `
    <article class="campaign-card" data-campaign-id="${escapeAttr(
      camp.id || ""
    )}">
      <header class="campaign-card-header">
        <div class="campaign-card-title-block">
          <div class="campaign-card-status-row">
            <span class="campaign-status-pill status-${(camp.status || "ACTIVE")
              .toString()
              .toLowerCase()}">
              ${escapeHtml(camp.status || "ACTIVE")}
            </span>
            <span class="campaign-objective-label">
              ${escapeHtml(camp.objective || "SALES")}
            </span>
          </div>
          <h3 class="campaign-name">
            ${escapeHtml(camp.name || camp.id || "Unbenannte Kampagne")}
          </h3>
        </div>
        <div class="campaign-health">
          <span class="campaign-health-badge ${health.tone}">
            ${health.label} • ${health.score} / 100
          </span>
          <div class="campaign-health-subtext">
            ${escapeHtml(health.reasonShort)}
          </div>
        </div>
      </header>

      <div class="campaign-kpi-row">
        <div class="campaign-kpi">
          <div class="label">Spend</div>
          <div class="value">
            ${formatCurrency(metrics.spend, currencyCode)}
          </div>
          <div class="sub">
            Budgeteinsatz
          </div>
        </div>
        <div class="campaign-kpi">
          <div class="label">ROAS</div>
          <div class="value">
            ${formatRoas(metrics.roas)}
          </div>
          <div class="sub">
            ${health.roasNote}
          </div>
        </div>
        <div class="campaign-kpi">
          <div class="label">CTR</div>
          <div class="value">
            ${formatPercent(metrics.ctr)}
          </div>
          <div class="sub">
            ${health.ctrNote}
          </div>
        </div>
        <div class="campaign-kpi">
          <div class="label">CPM</div>
          <div class="value">
            ${formatCurrency(metrics.cpm, currencyCode)}
          </div>
          <div class="sub">
            ${health.cpmNote}
          </div>
        </div>
      </div>

      <div class="campaign-card-tags">
        ${tags
          .map(
            (t) => `
          <span class="campaign-tag campaign-tag-${t.type}">
            ${escapeHtml(t.label)}
          </span>`
          )
          .join("")}
      </div>

      <footer class="campaign-card-actions">
        <button
          type="button"
          class="meta-button"
          data-campaign-action="details"
          data-campaign-id="${escapeAttr(camp.id || "")}"
        >
          Details
        </button>
        <button
          type="button"
          class="meta-button secondary"
          data-campaign-action="goto-creatives"
          data-campaign-id="${escapeAttr(camp.id || "")}"
        >
          Creatives
        </button>
        <button
          type="button"
          class="meta-button secondary"
          data-campaign-action="goto-testing"
          data-campaign-id="${escapeAttr(camp.id || "")}"
        >
          Testing Log
        </button>
      </footer>
    </article>
  `;
}

/* -------------------------------------------------------------------------- */
/*  Error-State                                                               */
/* -------------------------------------------------------------------------- */

function renderErrorState(section, err) {
  section.innerHTML = `
    <div class="campaign-view-root">
      <div class="empty-state empty-state-glass">
        <div class="empty-state-icon">🛠️</div>
        <h3 class="empty-state-title">Kampagnen-Ansicht nicht verfügbar</h3>
        <p class="empty-state-text">
          Beim Laden der Kampagnen ist ein Fehler aufgetreten.
          ${escapeHtml(
            err && err.message ? "Details: " + err.message : ""
          )}
        </p>
        <p class="empty-state-text" style="font-size:0.8rem;color:#94a3b8;">
          Prüfe deine Meta-Connect Einstellungen oder aktiviere den Demo-Modus, um ein
          vollständiges Beispielkonto zu sehen.
        </p>
      </div>
    </div>
  `;
}

/* -------------------------------------------------------------------------- */
/*  Actions / Modal / Navigation                                              */
/* -------------------------------------------------------------------------- */

function wireCampaignActions(section, enrichedList) {
  section.addEventListener("click", (evt) => {
    const btn = evt.target.closest("[data-campaign-action]");
    if (!btn) return;

    const action = btn.getAttribute("data-campaign-action");
    const id = btn.getAttribute("data-campaign-id");
    if (!id) return;

    const item = enrichedList.find((x) => x.raw.id === id);
    if (!item) return;

    if (action === "details") {
      openCampaignDetails(item.raw, item.health);
    } else if (action === "goto-creatives") {
      navigateTo("creativeLibrary");
    } else if (action === "goto-testing") {
      navigateTo("testingLog");
    }
  });
}

function openCampaignDetails(camp, health) {
  const metrics = camp.metrics || {};
  const title = `Kampagnendetails: ${camp.name || camp.id || "Kampagne"}`;

  const body = `
    <div class="modal-kpi-grid">
      <div class="modal-kpi">
        <div class="label">Status</div>
        <div class="value">${escapeHtml(camp.status || "ACTIVE")}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">Objective</div>
        <div class="value">${escapeHtml(camp.objective || "SALES")}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">Health Score</div>
        <div class="value">${health.score} / 100</div>
        <div class="sub">${escapeHtml(health.label)}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">Spend</div>
        <div class="value">${formatCurrency(metrics.spend, "EUR")}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">ROAS</div>
        <div class="value">${formatRoas(metrics.roas)}</div>
        <div class="sub">${escapeHtml(health.roasNote)}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">CTR</div>
        <div class="value">${formatPercent(metrics.ctr)}</div>
        <div class="sub">${escapeHtml(health.ctrNote)}</div>
      </div>
      <div class="modal-kpi">
        <div class="label">CPM</div>
        <div class="value">${formatCurrency(metrics.cpm, "EUR")}</div>
        <div class="sub">${escapeHtml(health.cpmNote)}</div>
      </div>
    </div>
    <div class="modal-chart-placeholder">
      <div class="modal-chart-title">Performance Verlauf (synthetische Vorschau)</div>
      <div class="modal-chart-body">
        <div class="modal-chart-bar modal-chart-bar-main"></div>
        <div class="modal-chart-bar"></div>
        <div class="modal-chart-bar"></div>
        <div class="modal-chart-bar"></div>
      </div>
      <p class="modal-chart-hint">
        In einer späteren Phase können hier echte Zeitreihen (ROAS / Spend) pro Tag
        eingebunden werden.
      </p>
    </div>
    <div style="margin-top:12px;font-size:0.85rem;color:#64748b;">
      ${escapeHtml(health.reasonLong)}
    </div>
  `;

  if (window.SignalOne && typeof window.SignalOne.openSystemModal === "function") {
    window.SignalOne.openSystemModal(title, body);
  } else if (typeof window.openSystemModal === "function") {
    window.openSystemModal(title, body);
  } else {
    console.warn("[Campaigns] Kein Modal-System verfügbar.");
  }
}

function navigateTo(moduleKey) {
  try {
    if (window.SignalOne && typeof window.SignalOne.navigateTo === "function") {
      window.SignalOne.navigateTo(moduleKey);
    }
  } catch (err) {
    console.warn("[Campaigns] navigateTo failed:", err);
  }
}

/* -------------------------------------------------------------------------- */
/*  Health-Scoring & Tags                                                     */
/* -------------------------------------------------------------------------- */

function computeCampaignHealth(camp) {
  const m = camp.metrics || {};
  const roas = toNumber(m.roas);
  const ctr = toNumber(m.ctr);
  const cpm = toNumber(m.cpm);
  const spend = toNumber(m.spend);

  let score = 50;

  // ROAS: starker Hebel
  if (roas >= 5) score += 25;
  else if (roas >= 3) score += 10;
  else if (roas <= 1.5) score -= 15;

  // CTR: Creative Qualität
  if (ctr >= 3) score += 15;
  else if (ctr >= 1.5) score += 5;
  else if (ctr > 0 && ctr < 1.5) score -= 10;

  // CPM: Media-Effizienz
  if (cpm > 0 && cpm <= 8) score += 10;
  else if (cpm > 15) score -= 10;

  // Spend: Relevanz
  if (spend >= 15000) score += 5;

  if (!Number.isFinite(score)) score = 50;
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  let label = "Neutral";
  let tone = "warning";

  if (score >= 80) {
    label = "Sehr gesund";
    tone = "good";
  } else if (score >= 60) {
    label = "Solide";
    tone = "warning";
  } else if (score >= 40) {
    label = "Unter Beobachtung";
    tone = "warning";
  } else {
    label = "Kritisch";
    tone = "critical";
  }

  const roasNote = !Number.isFinite(roas)
    ? "Keine ROAS-Daten"
    : roas >= 4
    ? "Über Ziel-ROAS"
    : roas >= 2
    ? "Im akzeptablen Bereich"
    : "Unter Ziel-ROAS – prüfen";

  const ctrNote = !Number.isFinite(ctr)
    ? "Keine CTR-Daten"
    : ctr >= 3
    ? "Sehr guter Scrollstop"
    : ctr >= 1.5
    ? "OK, aber ausbaufähig"
    : "Schwache CTR – Hook überarbeiten";

  const cpmNote = !Number.isFinite(cpm)
    ? "Keine CPM-Daten"
    : cpm <= 8
    ? "Effiziente Media-Kosten"
    : cpm <= 15
    ? "Im normalen Rahmen"
    : "Hoher CPM – Targeting/Creative prüfen";

  const reasonShort =
    score >= 80
      ? "Starke Kampagne – ideal für Scaling."
      : score >= 60
      ? "Solide Kampagne mit Potenzial."
      : score >= 40
      ? "Auffällige Schwächen – genau beobachten."
      : "Kampagne verbrennt Budget – Optimierung oder Pause empfohlen.";

  const reasonLong =
    "SignalOne kombiniert ROAS, CTR, CPM und Spend zu einem einfachen Health-Score. " +
    "Hoher ROAS + gute CTR + niedriger CPM = gesund. Niedriger ROAS, schwache CTR " +
    "oder sehr hoher CPM drücken den Score. Nutze diese Kampagnenansicht als Radar, " +
    "um schnell die größten Hebel zu identifizieren.";

  return {
    score,
    label,
    tone,
    roasNote,
    ctrNote,
    cpmNote,
    reasonShort,
    reasonLong,
  };
}

function buildCampaignTags(camp, health) {
  const tags = [];
  const m = camp.metrics || {};
  const roas = toNumber(m.roas);
  const ctr = toNumber(m.ctr);
  const cpm = toNumber(m.cpm);
  const spend = toNumber(m.spend);

  if (camp.status === "TESTING") {
    tags.push({ type: "testing", label: "Testing-Kampagne" });
  }
  if (camp.status === "PAUSED") {
    tags.push({ type: "paused", label: "Pausiert" });
  }

  if (roas >= 4 && spend >= 10000) {
    tags.push({ type: "scaling", label: "Scaling Opportunity" });
  }

  if (health.tone === "critical" && spend >= 4000) {
    tags.push({ type: "risk", label: "Budget-Risiko" });
  }

  if (ctr < 1.5 && Number.isFinite(ctr)) {
    tags.push({ type: "creative", label: "Creative Weakness" });
  }

  if (!tags.length) {
    tags.push({ type: "neutral", label: "Stable" });
  }

  return tags;
}

/* -------------------------------------------------------------------------- */
/*  Helpers: AppState / Formatting / Source                                   */
/* -------------------------------------------------------------------------- */

function resolveAccountId(AppState) {
  if (!AppState) return null;

  const meta = AppState.meta || {};
  return (
    meta.selectedAdAccountId ||
    meta.adAccountId ||
    AppState.selectedAdAccountId ||
    AppState.selectedAccountId ||
    null
  );
}

function getBrandName(AppState) {
  if (!AppState) return null;
  if (AppState.brandName) return AppState.brandName;
  if (AppState.selectedBrandName) return AppState.selectedBrandName;
  if (AppState.currentBrand && AppState.currentBrand.name) {
    return AppState.currentBrand.name;
  }
  return null;
}

function classifySource(source, useDemoMode) {
  const src = (source || "").toString().toLowerCase();

  if (src === "live" || src === "live-strict") {
    return { label: "Live-Daten (Meta)", badgeClass: "good" };
  }
  if (src === "demo-fallback" || src === "live-fallback") {
    return { label: "Demo-Fallback", badgeClass: "warning" };
  }
  if (src === "demo") {
    return { label: "Demo-Daten", badgeClass: "warning" };
  }

  return {
    label: useDemoMode ? "Demo-Daten" : "Auto (Demo/Live)",
    badgeClass: useDemoMode ? "warning" : "good",
  };
}

/* -------------------------------------------------------------------------- */
/*  Utils                                                                     */
/* -------------------------------------------------------------------------- */

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function formatCurrency(value, currencyCode) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";

  let symbol = "€";
  if (currencyCode === "USD") symbol = "$";
  if (currencyCode === "GBP") symbol = "£";

  const abs = Math.abs(n);
  let formatted;
  if (abs >= 1_000_000) {
    formatted = (n / 1_000_000).toFixed(1) + "M";
  } else if (abs >= 1_000) {
    formatted = (n / 1_000).toFixed(1) + "k";
  } else {
    formatted = n.toFixed(0);
  }

  return `${symbol}${formatted}`;
}

function formatPercent(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";
  return n.toFixed(2) + " %";
}

function formatRoas(value) {
  const n = toNumber(value);
  if (!Number.isFinite(n)) return "–";
  return n.toFixed(2) + "×";
}

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function safeToast(message, type = "info") {
  try {
    if (window.SignalOne && typeof window.SignalOne.showToast === "function") {
      window.SignalOne.showToast(message, type);
    } else if (typeof window.showToast === "function") {
      window.showToast(message, type);
    }
  } catch {
    // ignore
  }
}
