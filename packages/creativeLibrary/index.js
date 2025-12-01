// packages/creativeLibrary/index.js
// ---------------------------------------------------------
//  P2 – Creative Library
//  UI-Layer (Grid, Filter, Modal) + DataLayer-Anbindung
//  -> Compute-Layer: compute.js
//  -> Varianten-Gruppierung: group.js
//  -> Test-Slot: SignalOne.TestingLog.openTestSlot
// ---------------------------------------------------------

import { buildCreativeLibraryViewModel } from "./compute.js";
import { groupCreatives } from "./group.js";

// Public API: wird von app.js als Modul geladen
export async function render(section, AppState, options = {}) {
  const useDemoMode = !!options.useDemoMode;

  const SignalOne = window.SignalOne || {};
  const DataLayer = SignalOne.DataLayer;

  if (!section) return;

  // 1) DataLayer & Meta-Gatekeeper ---------------------------------
  if (!DataLayer) {
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Creative Library</h2>
        <p class="view-subtitle">
          DataLayer ist noch nicht initialisiert. Bitte Backend prüfen.
        </p>
      </div>
    `;
    return;
  }

  const meta = (AppState && AppState.meta) || {};
  const hasLiveAccess =
    !!meta.token || !!meta.accessToken || !!meta.activeAccountId;

  if (!useDemoMode && !hasLiveAccess) {
    // Harte Gatekeeper-Regel: ohne Meta-Token keine Live-Daten
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Creative Library</h2>
        <p class="view-subtitle">
          Verbinde deinen Meta Account, um Live-Creatives zu sehen.
        </p>
      </div>
    `;
    return;
  }

  // 2) Rohdaten vom DataLayer holen --------------------------------
  const accountId =
    meta.activeAccountId ||
    meta.selectedAccountId ||
    meta.accountId ||
    "DEMO_ACCOUNT";

  showLoader(true);

  let rawCreatives = [];
  try {
    rawCreatives = await DataLayer.fetchCreativesForAccount({
      accountId,
      preferLive: !useDemoMode,
    });
  } catch (err) {
    console.error("[CreativeLibrary] fetchCreativesForAccount failed", err);
    SignalOne.showToast?.(
      "Creative-Daten konnten nicht geladen werden. Demo-Daten werden verwendet.",
      "error",
    );

    try {
      rawCreatives = await DataLayer.fetchCreativesForAccount({
        accountId,
        preferLive: false,
      });
    } catch (fallbackErr) {
      console.error(
        "[CreativeLibrary] Demo-Fallback für Creatives fehlgeschlagen",
        fallbackErr,
      );
      rawCreatives = [];
    }
  } finally {
    showLoader(false);
  }

  const rangeLabel =
    AppState?.dateRange?.label || AppState?.dateRange?.preset || "Letzte 30 Tage";
  const brandName =
    AppState?.currentBrand?.name ||
    AppState?.brand?.name ||
    meta.accountName ||
    "Dein Brand";

  const viewModel = buildCreativeLibraryViewModel(rawCreatives, {
    brandName,
    rangeLabel,
    preferLive: !useDemoMode,
  });

  const { creatives, tags, stats, meta: headerMeta } = viewModel;

  // Varianten-Gruppierung (Hybrid C)
  const variantModel = groupCreatives(creatives);
  const variantById = variantModel.byCreativeId;

  // 3) Empty-State, falls keine Creatives ---------------------------
  if (!creatives.length) {
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Creative Library</h2>
        <p class="view-subtitle">
          Für diesen Account konnten noch keine Creatives gefunden werden.
        </p>
        <p class="view-subtitle">
          Prüfe im Meta Ads Manager, ob Kampagnen aktiv sind – oder aktiviere den Demo-Modus in den Settings.
        </p>
      </div>
    `;
    return;
  }

  // 4) Haupt-Template (Header + Filter + Grid-Container) -----------
  section.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <div>
          <h2 class="view-title">Creative Library</h2>
          <p class="view-subtitle">
            ${escapeHtml(
              headerMeta.brandName,
            )} • ${escapeHtml(headerMeta.modeLabel)}
          </p>
        </div>

        <div class="creative-mini-kpis">
          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Creatives</span>
            <span class="creative-mini-kpi-value">${creatives.length}</span>
          </div>
          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Spend Grid</span>
            <span class="creative-mini-kpi-value">
              ${formatCurrency(stats.totalSpend)}
            </span>
          </div>
          <div class="creative-mini-kpi">
            <span class="creative-mini-kpi-label">Ø ROAS</span>
            <span class="creative-mini-kpi-value">
              ${formatRoas(stats.avgRoas)}
            </span>
          </div>
        </div>
      </header>

      <section class="creative-filter-bar">
        <div class="creative-filter-chips" data-role="bucket-chips">
          <button class="chip active" data-bucket="all">Alle</button>
          <button class="chip" data-bucket="winner">Winner</button>
          <button class="chip" data-bucket="testing">Testing</button>
          <button class="chip" data-bucket="loser">Loser</button>
        </div>

        <div class="creative-filter-inputs">
          <input type="search" class="meta-input" placeholder="Suche..." data-role="search" />
          <select class="meta-input" data-role="sort">
            <option value="score_desc">Score (hoch)</option>
            <option value="roas_desc">ROAS (hoch)</option>
            <option value="spend_desc">Spend (hoch)</option>
            <option value="ctr_desc">CTR (hoch)</option>
            <option value="days_desc">Laufzeit (neu)</option>
          </select>
        </div>
      </section>

      <section class="creative-tags-row">
        <div class="creative-tags" data-role="tags">
          <button class="tag-pill active" data-tag="all">#Alle (${tags.total})</button>
          <button class="tag-pill" data-tag="Winner">#Winner (${tags.winners})</button>
          <button class="tag-pill" data-tag="Testing">#Testing (${tags.testing})</button>
          <button class="tag-pill" data-tag="Loser">#Loser (${tags.losers})</button>
          <button class="tag-pill" data-tag="UGC">#UGC (${tags.ugc})</button>
          <button class="tag-pill" data-tag="Static">#Static (${tags.static})</button>
        </div>
      </section>

      <section class="creative-grid" data-role="grid"></section>
    </div>
  `;

  // 5) Grid + Filter-Logik ------------------------------------------
  const gridEl = section.querySelector('[data-role="grid"]');
  const searchInput = section.querySelector('[data-role="search"]');
  const sortSelect = section.querySelector('[data-role="sort"]');
  const tagContainer = section.querySelector('[data-role="tags"]');
  const bucketChips = section.querySelector('[data-role="bucket-chips"]');

  const state = {
    allCreatives: creatives,
    search: "",
    tag: "all",
    bucket: "all",
    sort: "score_desc",
  };

  function smoothSet(html) {
    if (!gridEl) return;
    gridEl.style.opacity = 0;
    setTimeout(() => {
      gridEl.innerHTML = html;
      gridEl.style.opacity = 1;
    }, 150);
  }

  function renderGrid() {
    let list = state.allCreatives.slice();

    if (state.bucket !== "all") {
      list = list.filter((c) => c.bucket === state.bucket);
    }

    if (state.tag !== "all") {
      list = list.filter((c) => (c.tags || []).includes(state.tag));
    }

    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      list = list.filter((c) => {
        return (
          (c.name && c.name.toLowerCase().includes(q)) ||
          (c.creator && c.creator.toLowerCase().includes(q)) ||
          (c.hook && c.hook.toLowerCase().includes(q))
        );
      });
    }

    list.sort((a, b) => {
      switch (state.sort) {
        case "roas_desc":
          return (b.metrics.roas || 0) - (a.metrics.roas || 0);
        case "spend_desc":
          return (b.metrics.spend || 0) - (a.metrics.spend || 0);
        case "ctr_desc":
          return (b.metrics.ctr || 0) - (a.metrics.ctr || 0);
        case "days_desc":
          return (b.daysActive || 0) - (a.daysActive || 0);
        case "score_desc":
        default:
          return (b.score || 0) - (a.score || 0);
      }
    });

    const html = list
      .map((c) => {
        const m = c.metrics || {};
        const group = variantById.get(c.id);
        const variantCount = group?.variantCount || 1;
        const hasVariants = variantCount > 1;

        return `
          <article class="creative-library-item" data-id="${escapeHtml(c.id)}">
            ${
              hasVariants
                ? `<div class="creative-variant-badge">V${variantCount}</div>`
                : ""
            }
            <div class="creative-thumb" style="${
              c.thumbnailUrl
                ? `background-image:url('${encodeURI(
                    c.thumbnailUrl,
                  )}');background-size:cover;background-position:center;`
                : ""
            }"></div>
            <div class="creative-info">
              <div class="creative-title-row">
                <span class="creative-title">${escapeHtml(c.name)}</span>
              </div>
              <div class="creative-kpi">
                ⭐ ${formatBucketLabel(c.bucket)} • Score: ${c.score ?? "-"}
              </div>
              <div class="creative-kpi">
                ROAS: ${formatRoas(m.roas)} · Spend: ${formatCurrency(
                  m.spend,
                )}
              </div>
              <div class="creative-kpi">
                CTR: ${formatPercent(m.ctr)} · CPM: ${formatCurrency(m.cpm)}
              </div>
              <div class="creative-kpi">
                🎬 Hook: ${c.hook ? escapeHtml(c.hook) : "–"}
              </div>
              <div class="creative-kpi">
                👤 Creator: ${escapeHtml(c.creator || "Unknown")}
                ${c.daysActive ? ` · 📅 ${c.daysActive} Tage` : ""}
              </div>
            </div>
            <div class="creative-actions">
              <button data-role="details">Details</button>
              <button data-role="variants">Varianten</button>
              <button data-role="testslot">Test-Slot</button>
            </div>
          </article>
        `;
      })
      .join("");

    smoothSet(html);
    attachCardEvents();
  }

  function attachCardEvents() {
    const cards = gridEl.querySelectorAll(".creative-library-item");
    cards.forEach((card) => {
      const id = card.getAttribute("data-id");
      const creative = state.allCreatives.find((c) => c.id === id);
      if (!creative) return;

      card.addEventListener("click", (ev) => {
        const role =
          ev.target && ev.target.getAttribute("data-role")
            ? ev.target.getAttribute("data-role")
            : null;

        const group = variantById.get(creative.id);
        const variants = group ? group.items : [creative];

        if (role === "details") {
          ev.stopPropagation();
          openCreativeModal(creative, variants);
          return;
        }

        if (role === "variants") {
          ev.stopPropagation();
          openCreativeModal(creative, variants);
          return;
        }

        if (role === "testslot") {
          ev.stopPropagation();
          const api = window.SignalOne?.TestingLog;
          if (api && typeof api.openTestSlot === "function") {
            api.openTestSlot(creative, variants);
          } else {
            window.SignalOne?.showToast?.(
              "Testing Log API ist noch nicht initialisiert.",
              "warning",
            );
          }
          return;
        }

        // Default: Details
        openCreativeModal(creative, variants);
      });
    });
  }

  // Filter-Events
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      state.search = e.target.value || "";
      renderGrid();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      state.sort = e.target.value;
      renderGrid();
    });
  }

  if (tagContainer) {
    tagContainer.addEventListener("click", (e) => {
      const btn = e.target.closest(".tag-pill");
      if (!btn) return;
      const tag = btn.getAttribute("data-tag");
      if (!tag) return;

      tagContainer
        .querySelectorAll(".tag-pill")
        .forEach((el) => el.classList.remove("active"));
      btn.classList.add("active");

      state.tag = tag;
      renderGrid();
    });
  }

  if (bucketChips) {
    bucketChips.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const bucket = chip.getAttribute("data-bucket");
      if (!bucket) return;

      bucketChips
        .querySelectorAll(".chip")
        .forEach((el) => el.classList.remove("active"));
      chip.classList.add("active");

      state.bucket = bucket;
      renderGrid();
    });
  }

  // Initiales Rendering
  renderGrid();
}

/* ----------------------------------------------------------
   Modal – Varianten-Layout (V2: Liste links, Detail rechts)
-----------------------------------------------------------*/

function openCreativeModal(creative, variants = []) {
  const openModal = window.SignalOne?.openSystemModal;
  if (!openModal) {
    const m = creative.metrics || {};
    alert(
      `${creative.name}\n\nROAS: ${formatRoas(m.roas)}\nSpend: ${formatCurrency(
        m.spend,
      )}`,
    );
    return;
  }

  const uniqVariants = dedupeById(
    Array.isArray(variants) && variants.length ? variants : [creative],
  );
  const activeId = creative.id;

  const bodyHtml = `
    <div class="creative-modal">
      <div class="creative-modal-main" data-role="variant-layout" style="display:grid;grid-template-columns: minmax(0,220px) minmax(0,1fr);gap:16px;align-items:flex-start;">
        
        <!-- Variantenliste (links) -->
        <aside class="creative-variant-list">
          <h4 class="creative-variant-heading">Varianten</h4>
          <div class="creative-variant-items">
            ${uniqVariants
              .map(
                (v) => `
              <button
                class="creative-variant-pill ${
                  v.id === activeId ? "active" : ""
                }"
                data-variant-id="${escapeHtml(v.id)}"
              >
                <div class="creative-variant-pill-title">
                  ${escapeHtml(v.name)}
                </div>
                <div class="creative-variant-pill-meta">
                  ROAS ${formatRoas(v.metrics?.roas)} • ${
                  v.metrics?.purchases ?? "–"
                } Purchases
                </div>
              </button>
            `,
              )
              .join("")}
          </div>
        </aside>

        <!-- Detailansicht (rechts) -->
        <div class="creative-variant-detail" data-role="variant-detail">
          ${renderVariantDetailHtml(
            uniqVariants.find((v) => v.id === activeId) || uniqVariants[0],
          )}
        </div>
      </div>
    </div>
  `;

  openModal(creative.name, bodyHtml);

  const bodyEl = document.getElementById("modalBody");
  if (!bodyEl) return;

  const detailEl = bodyEl.querySelector('[data-role="variant-detail"]');
  const pills = bodyEl.querySelectorAll(".creative-variant-pill");

  pills.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-variant-id");
      const selected = uniqVariants.find((v) => v.id === id);
      if (!selected || !detailEl) return;

      pills.forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");

      detailEl.innerHTML = renderVariantDetailHtml(selected);
    });
  });
}

function renderVariantDetailHtml(c) {
  const m = c.metrics || {};

  return `
    <div class="creative-modal-main-inner">
      <div class="creative-modal-left">
        <div class="creative-modal-thumb" style="${
          c.thumbnailUrl
            ? `background-image:url('${encodeURI(
                c.thumbnailUrl,
              )}');background-size:cover;background-position:center;`
            : ""
        }">
          ${
            !c.thumbnailUrl
              ? `<div class="creative-modal-thumb-overlay">
                   <span class="creative-modal-thumb-label">Kein Thumbnail vorhanden</span>
                 </div>`
              : ""
          }
        </div>

        <div class="creative-modal-kpis">
          <div>
            <span class="creative-kpi-label">ROAS</span>
            <span class="creative-kpi-value">${formatRoas(m.roas)}</span>
          </div>
          <div>
            <span class="creative-kpi-label">Spend</span>
            <span class="creative-kpi-value">${formatCurrency(m.spend)}</span>
          </div>
          <div>
            <span class="creative-kpi-label">CTR</span>
            <span class="creative-kpi-value">${formatPercent(m.ctr)}</span>
          </div>
          <div>
            <span class="creative-kpi-label">CPM</span>
            <span class="creative-kpi-value">${formatCurrency(m.cpm)}</span>
          </div>
          <div>
            <span class="creative-kpi-label">CPA</span>
            <span class="creative-kpi-value">${formatCurrency(m.cpa)}</span>
          </div>
          <div>
            <span class="creative-kpi-label">Purchases</span>
            <span class="creative-kpi-value">${
              m.purchases != null ? m.purchases : "–"
            }</span>
          </div>
        </div>
      </div>

      <div class="creative-modal-right">
        <h3 class="creative-modal-title">${escapeHtml(c.name)}</h3>
        <p class="creative-modal-subtitle">
          ${formatBucketLabel(c.bucket)} • Score ${c.score ?? "-"} • ${
            c.daysActive ? `${c.daysActive} Tage live` : ""
          }
        </p>

        <div class="creative-modal-section">
          <h4>Story & Hook</h4>
          <p class="creative-modal-text">
            ${c.hook ? escapeHtml(c.hook) : "Kein Hook hinterlegt."}
          </p>
          <p class="creative-modal-text">
            Creator: ${escapeHtml(c.creator || "Unknown")}
          </p>
        </div>

        <div class="creative-modal-section">
          <h4>Sensei Insight (Light)</h4>
          <p class="creative-modal-text">
            Dieses Creative performt ${
              m.roas && m.roas >= 4
                ? "stark über"
                : m.roas && m.roas >= 1.5
                  ? "über"
                  : m.roas && m.roas > 0
                    ? "unter"
                    : "auf"
            } deinem erwarteten Benchmark. Nutze ähnliche Hooks & Creator,
            um weitere Varianten zu testen.
          </p>
        </div>

        <div class="creative-modal-actions">
          <button class="meta-button meta-button-primary" data-role="generate-hook">
            Neue Hook-Ideen
          </button>
          <button class="meta-button" data-role="open-testing-log">
            Testplan erstellen
          </button>
        </div>
      </div>
    </div>
  `;
}

/* ----------------------------------------------------------
   Kleine Utils (UI-seitig)
-----------------------------------------------------------*/

function showLoader(active) {
  const el = document.getElementById("globalLoader");
  if (!el) return;
  if (active) {
    el.classList.remove("hidden");
  } else {
    el.classList.add("hidden");
  }
}

function formatCurrency(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "€0";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatRoas(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "–";
  return `${n.toFixed(1)}x`;
}

function formatPercent(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n === 0) return "–";
  const perc = n > 1 ? n : n * 100;
  return `${perc.toFixed(1)}%`;
}

function formatBucketLabel(bucket) {
  switch (bucket) {
    case "winner":
      return "⭐ Winner";
    case "testing":
      return "🧪 Testing";
    case "loser":
      return "❌ Loser";
    default:
      return "Creative";
  }
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function dedupeById(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!item || !item.id) continue;
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}
