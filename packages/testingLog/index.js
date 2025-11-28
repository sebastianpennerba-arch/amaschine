// packages/testingLog/index.js
// Testing Log – Journal aller Tests, Hypothesen und Ergebnisse.

export function render(root, AppState, { useDemoMode }) {
  ensureLogState(AppState);

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Testing Log</h2>
        <p class="view-subtitle">
          Alle Creatives-, Audience- und Funnel-Tests als strukturiertes Journal.
        </p>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button id="testingNewEntryBtn" class="meta-button" type="button">
          Neuen Test erfassen
        </button>
      </div>
    </div>

    <div class="testing-log-filter-bar">
      <div class="testing-log-filter-left">
        <button class="testing-log-filter-pill active" data-filter-status="all">Alle</button>
        <button class="testing-log-filter-pill" data-filter-status="running">Running</button>
        <button class="testing-log-filter-pill" data-filter-status="completed">Completed</button>
        <button class="testing-log-filter-pill" data-filter-status="failed">Failed</button>
      </div>
      <div class="testing-log-filter-right">
        <button class="testing-log-filter-pill active" data-filter-type="all">Alle Typen</button>
        <button class="testing-log-filter-pill" data-filter-type="creative">Creative</button>
        <button class="testing-log-filter-pill" data-filter-type="audience">Audience</button>
        <button class="testing-log-filter-pill" data-filter-type="funnel">Funnel</button>
      </div>
    </div>

    <div class="log-card">
      <table class="log-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Test</th>
            <th>Typ</th>
            <th>Status</th>
            <th>Ergebnis / ROAS</th>
          </tr>
        </thead>
        <tbody id="testingLogTableBody"></tbody>
      </table>
    </div>
  `;

  const tbody = root.querySelector("#testingLogTableBody");
  const statusPills = root.querySelectorAll("[data-filter-status]");
  const typePills = root.querySelectorAll("[data-filter-type]");
  const newBtn = root.querySelector("#testingNewEntryBtn");

  let activeStatus = "all";
  let activeType = "all";

  const rerender = () => {
    renderRows(tbody, AppState.testingLog, activeStatus, activeType);
  };

  statusPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      statusPills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeStatus = pill.getAttribute("data-filter-status") || "all";
      rerender();
    });
  });

  typePills.forEach((pill) => {
    pill.addEventListener("click", () => {
      typePills.forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      activeType = pill.getAttribute("data-filter-type") || "all";
      rerender();
    });
  });

  if (newBtn) {
    newBtn.addEventListener("click", () => {
      openNewTestModal(AppState, rerender);
    });
  }

  rerender();
}

function ensureLogState(AppState) {
  if (!Array.isArray(AppState.testingLog)) {
    const today = new Date();
    const d = (offset) =>
      new Date(today.getTime() - offset * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);

    AppState.testingLog = [
      {
        id: "t1",
        date: d(1),
        title: "Hook Battle – UGC vs. Static",
        type: "creative",
        status: "completed",
        result: "ROAS +34% vs. BAU",
        level: "info",
      },
      {
        id: "t2",
        date: d(3),
        title: "Broad vs. 5% LAL – Prospecting",
        type: "audience",
        status: "running",
        result: "Broad leicht vorne, Datenlauf noch aktiv",
        level: "info",
      },
      {
        id: "t3",
        date: d(5),
        title: "Post-Purchase Funnel – Upsell A/B",
        type: "funnel",
        status: "failed",
        result: "Upsell-Variante ohne Impact, wird verworfen",
        level: "warning",
      },
    ];
  }
}

function renderRows(tbody, log, statusFilter, typeFilter) {
  if (!tbody) return;
  const rows = (log || []).filter((entry) => {
    if (statusFilter !== "all" && entry.status !== statusFilter) return false;
    if (typeFilter !== "all" && entry.type !== typeFilter) return false;
    return true;
  });

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="padding:16px;font-size:0.86rem;color:#6b7280;">
          Keine Tests für diese Filterkombination. Erstelle einen neuen Test oder setze Filter zurück.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = rows
    .map((entry) => {
      const levelClass =
        entry.level === "error"
          ? "error"
          : entry.level === "warning"
          ? "warning"
          : "info";
      const statusLabel = statusLabelFor(entry.status);
      const typeLabel = typeLabelFor(entry.type);
      return `
        <tr>
          <td class="log-meta">${escapeHtml(entry.date)}</td>
          <td>
            <div class="log-message-main">${escapeHtml(entry.title)}</div>
            <div class="log-message-sub">${escapeHtml(
              entry.hypothesis || "Hypothese: n/a"
            )}</div>
          </td>
          <td>${typeLabel}</td>
          <td>
            <span class="log-level-badge ${levelClass}">
              ${statusLabel}
            </span>
          </td>
          <td>
            <div class="log-message-main">${escapeHtml(entry.result)}</div>
            ${
              entry.nextStep
                ? `<div class="log-message-sub">Next: ${escapeHtml(
                    entry.nextStep
                  )}</div>`
                : ""
            }
          </td>
        </tr>
      `;
    })
    .join("");
}

function openNewTestModal(AppState, rerender) {
  const modal = window.SignalOne?.openSystemModal;
  const showToast = window.SignalOne?.showToast;
  if (!modal) return;

  const today = new Date().toISOString().slice(0, 10);

  const html = `
    <p style="font-size:0.86rem;margin-bottom:10px;">
      Erfasse einen neuen Testlauf – Sensei nutzt dieses Log als Gedächtnis für deine Entscheidungen.
    </p>
    <div style="display:flex;flex-direction:column;gap:10px;font-size:0.85rem;">
      <div>
        <label>Datum</label><br>
        <input id="tlDate" type="date" value="${today}" style="width:180px;">
      </div>
      <div>
        <label>Title</label><br>
        <input id="tlTitle" type="text" placeholder="z.B. UGC Hook Battle vs. Static" style="width:100%;">
      </div>
      <div>
        <label>Typ</label><br>
        <select id="tlType" style="width:200px;">
          <option value="creative">Creative</option>
          <option value="audience">Audience</option>
          <option value="funnel">Funnel</option>
        </select>
      </div>
      <div>
        <label>Hypothese</label><br>
        <textarea id="tlHypothesis" rows="2" placeholder="Was willst du beweisen / testen?" style="width:100%;"></textarea>
      </div>
      <div>
        <label>Ergebnis / Erwartung</label><br>
        <textarea id="tlResult" rows="2" placeholder="z.B. ROAS +20%, bessere Hook Performance erwartet." style="width:100%;"></textarea>
      </div>
      <div>
        <label>Nächster Schritt</label><br>
        <input id="tlNext" type="text" placeholder="z.B. Winner auf Main Stack duplizieren">
      </div>
      <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
        <button id="tlCancelBtn" type="button">Abbrechen</button>
        <button id="tlSaveBtn" class="meta-button" type="button">Speichern</button>
      </div>
    </div>
  `;

  modal("Neuen Test erfassen", html);

  setTimeout(() => {
    const close = window.SignalOne?.closeSystemModal;
    const saveBtn = document.getElementById("tlSaveBtn");
    const cancelBtn = document.getElementById("tlCancelBtn");

    if (cancelBtn && close) cancelBtn.addEventListener("click", close);
    if (!saveBtn) return;

    saveBtn.addEventListener("click", () => {
      const date = /** @type {HTMLInputElement|null} */ (
        document.getElementById("tlDate")
      )?.value;
      const title = /** @type {HTMLInputElement|null} */ (
        document.getElementById("tlTitle")
      )?.value;
      const type = /** @type {HTMLSelectElement|null} */ (
        document.getElementById("tlType")
      )?.value;
      const hypothesis = /** @type {HTMLTextAreaElement|null} */ (
        document.getElementById("tlHypothesis")
      )?.value;
      const result = /** @type {HTMLTextAreaElement|null} */ (
        document.getElementById("tlResult")
      )?.value;
      const next = /** @type {HTMLInputElement|null} */ (
        document.getElementById("tlNext")
      )?.value;

      if (!title || !type) {
        showToast && showToast("Titel und Typ sind Pflichtfelder.", "warning");
        return;
      }

      AppState.testingLog.unshift({
        id: "t" + Date.now(),
        date: date || new Date().toISOString().slice(0, 10),
        title: title.trim(),
        type,
        status: "running",
        result: result?.trim() || "Laufend – noch keine finalen Ergebnisse.",
        hypothesis: hypothesis?.trim(),
        nextStep: next?.trim(),
        level: "info",
      });

      rerender();
      showToast && showToast("Test in Testing Log aufgenommen.", "success");
      window.SignalOne?.closeSystemModal?.();
    });
  }, 0);
}

function statusLabelFor(status) {
  if (status === "running") return "Running";
  if (status === "completed") return "Completed";
  if (status === "failed") return "Failed";
  return status || "n/a";
}

function typeLabelFor(type) {
  if (type === "creative") return "Creative";
  if (type === "audience") return "Audience";
  if (type === "funnel") return "Funnel";
  return type || "n/a";
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
