// packages/testingLog/index.js
// ---------------------------------------------------------
//  P2.5 – Testing Log (Hybrid Layout T3)
//  → Tabelle aller Tests
//  → Detail-Modal für A/B Vergleich
//  → Deep Integration mit SignalOne.TestingLog API
// ---------------------------------------------------------

export async function init(ctx = {}) {
  const section = document.getElementById("testingLogView");
  if (!section) return;
  
  const { AppState } = ctx;
  render(section, AppState);
}

export function render(section, AppState, options = {}) {
  const SignalOne = window.SignalOne || {};
  const testing = SignalOne.TestingLog;

  if (!testing) {
    section.innerHTML = `
      <div class="view-inner">
        <h2 class="view-title">Testing Log</h2>
        <p class="view-subtitle">TestingLog API nicht initialisiert.</p>
      </div>`;
    return;
  }

  const entries = testing.entries || [];

  section.innerHTML = `
    <div class="view-inner">
      <header class="view-header">
        <h2 class="view-title">Testing Log</h2>
        <p class="view-subtitle">
          Übersicht aller Creative Tests • ${entries.length} Einträge
        </p>
      </header>

      <table class="testinglog-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Creative A</th>
            <th>Creative B</th>
            <th>Winner</th>
            <th>ROAS A</th>
            <th>ROAS B</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          ${
            entries.length
              ? entries
                  .map((e) => renderRow(e))
                  .join("")
              : `<tr><td colspan="7" style="text-align:center;padding:24px;color:#94a3b8;">Noch keine Tests gespeichert.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;

  wireDetailButtons(section, entries);
}

/* ----------------------------------------------------------
   TABLE ROW
-----------------------------------------------------------*/
function renderRow(e) {
  const A = e.creativeA?.metrics || {};
  const B = e.creativeB?.metrics || {};
  const d = new Date(e.createdAt);

  return `
    <tr data-id="${e.id}">
      <td>${formatDate(d)}</td>
      <td>${escapeHtml(e.creativeA?.name || "–")}</td>
      <td>${escapeHtml(e.creativeB?.name || "–")}</td>
      <td>${winnerLabel(e.decision?.winner)}</td>
      <td>${formatRoas(A.roas)}</td>
      <td>${formatRoas(B.roas)}</td>
      <td>
        <button class="meta-button-small" data-role="open-details" data-id="${e.id}">
          Details
        </button>
      </td>
    </tr>
  `;
}

/* ----------------------------------------------------------
   EVENTS (DETAIL MODAL)
-----------------------------------------------------------*/
function wireDetailButtons(section, entries) {
  const btns = section.querySelectorAll('[data-role="open-details"]');
  btns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const entry = entries.find((x) => x.id === id);
      if (!entry) return;
      openDetailModal(entry);
    });
  });
}

/* ----------------------------------------------------------
   DETAIL MODAL (T3 Style)
-----------------------------------------------------------*/
function openDetailModal(entry) {
  const openModal = window.SignalOne?.openSystemModal;
  if (!openModal) return;

  const A = entry.creativeA;
  const B = entry.creativeB;
  const D = entry.decision || {};

  const body = `
    <div class="testinglog-modal">
      <h4 style="margin-bottom:8px;">A/B Test Details</h4>
      <p style="margin-bottom:16px;color:#64748b;">
        Durchgeführt am ${formatDate(new Date(entry.createdAt))}<br>
        Winner Logic: <strong>ROAS first, CTR Tiebreak</strong>
      </p>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        
        <!-- CARD A -->
        <div class="tl-card ${D.winner === "A" ? "winner" : ""}">
          <h3>Creative A</h3>
          <p class="tl-name">${escapeHtml(A.name || entry.creativeA?.name)}</p>
          ${renderMetricBlock(A.metrics || A)}
        </div>

        <!-- CARD B -->
        <div class="tl-card ${D.winner === "B" ? "winner" : ""}">
          <h3>Creative B</h3>
          <p class="tl-name">${escapeHtml(B.name || entry.creativeB?.name)}</p>
          ${renderMetricBlock(B.metrics || B)}
        </div>
      </div>

      <div class="tl-reason">
        <strong>Entscheidung:</strong><br>
        ${escapeHtml(D.reason || "Keine Begründung verfügbar.")}
      </div>

      <div class="tl-actions">
        <button class="meta-button" data-role="retest">Erneut testen</button>
        <button class="meta-button meta-button-primary" data-role="close-modal">Schließen</button>
      </div>
    </div>
  `;

  openModal("Testing Log – Details", body);

  const bodyEl = document.getElementById("modalBody");
  if (!bodyEl) return;

  bodyEl.querySelector('[data-role="close-modal"]')?.addEventListener("click", () => {
    window.SignalOne.closeSystemModal();
  });

  bodyEl.querySelector('[data-role="retest"]')?.addEventListener("click", () => {
    const api = window.SignalOne?.TestingLog;
    if (api) api.openTestSlot(entry.creativeA, [entry.creativeA, entry.creativeB]);
  });
}

/* ----------------------------------------------------------
   RENDER HELPERS
-----------------------------------------------------------*/
function renderMetricBlock(m) {
  return `
    <div class="tl-kpi">
      <div><span>ROAS</span><strong>${formatRoas(m.roas)}</strong></div>
      <div><span>Spend</span><strong>${formatCurrency(m.spend)}</strong></div>
      <div><span>CTR</span><strong>${formatPercent(m.ctr)}</strong></div>
      <div><span>CPM</span><strong>${formatCurrency(m.cpm)}</strong></div>
      <div><span>CPA</span><strong>${formatCurrency(m.cpa)}</strong></div>
      <div><span>Purchases</span><strong>${m.purchases ?? "–"}</strong></div>
    </div>
  `;
}

/* ----------------------------------------------------------
   SMALL UTILS
-----------------------------------------------------------*/
function winnerLabel(w) {
  if (w === "A") return "A";
  if (w === "B") return "B";
  return "–";
}

function formatDate(d) {
  return d.toLocaleDateString("de-DE") + " " + d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function formatRoas(r) {
  const n = Number(r);
  if (!Number.isFinite(n) || n === 0) return "–";
  return `${n.toFixed(1)}x`;
}

function formatPercent(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "–";
  return `${(n > 1 ? n : n * 100).toFixed(1)}%`;
}

function formatCurrency(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "€0";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
