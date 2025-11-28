/*
 * Creative Library Render
 * Vollwertige Creative Engine:
 *  - Filter (Tag, Typ, Status)
 *  - Suche
 *  - Sortierung
 *  - Score (0–100)
 *  - Detail-View im System-Modal
 */

import { getDemoCreatives } from "./demo.js";
import { enrichCreatives } from "./compute.js";
import {
  createDefaultFilters,
  applyFiltersAndSort,
} from "./filters.js";

// Lokaler State des Moduls
const state = {
  AppState: null,
  container: null,
  allCreatives: [],
  filters: createDefaultFilters(),
};

// Public API für index.js
export function renderLibrary(container, AppState) {
  state.AppState = AppState;
  state.container = container;
  state.filters = createDefaultFilters();

  // Für jetzt: Nur Demo-Daten – später Mapping von Live-Daten
  const demoCreatives = getDemoCreatives();
  state.allCreatives = enrichCreatives(demoCreatives);

  buildLayout();
  renderList();
}

export function setExternalFilters(partial) {
  if (!state.container) return;
  state.filters = {
    ...state.filters,
    ...(partial || {}),
  };
  renderList();
}

export function openCreativeDetailById(id) {
  const creative = state.allCreatives.find((c) => c.id === id);
  if (creative) {
    openDetailModal(creative);
  }
}

// ---- Layout-Aufbau --------------------------------------------------------

function buildLayout() {
  const container = state.container;
  if (!container) return;

  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Creative Library";
  container.appendChild(heading);

  const subtitle = document.createElement("p");
  subtitle.textContent =
    "Finde Winner, identifiziere Loser und filtere nach Tags, Typen oder Status.";
  container.appendChild(subtitle);

  // Filter-Bar
  const filtersDiv = document.createElement("div");
  filtersDiv.className = "creative-filters";

  // Suche
  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Suche nach Titel, Creator, Kampagne, Hook…";
  searchInput.value = state.filters.search;
  searchInput.oninput = (e) => {
    state.filters.search = e.target.value || "";
    renderList();
  };
  filtersDiv.appendChild(searchInput);

  // Tag-Filter
  const tagSelect = document.createElement("select");
  [
    ["", "Tag: Alle"],
    ["Winner", "Winner"],
    ["Testing", "Testing"],
    ["Loser", "Loser"],
    ["UGC", "UGC"],
    ["Static", "Static"],
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (state.filters.tag === value) opt.selected = true;
    tagSelect.appendChild(opt);
  });
  tagSelect.onchange = (e) => {
    state.filters.tag = e.target.value || "";
    renderList();
  };
  filtersDiv.appendChild(tagSelect);

  // Type-Filter
  const typeSelect = document.createElement("select");
  [
    ["", "Typ: Alle"],
    ["video", "Video"],
    ["static", "Static"],
    ["ugc", "UGC"],
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (state.filters.type === value) opt.selected = true;
    typeSelect.appendChild(opt);
  });
  typeSelect.onchange = (e) => {
    state.filters.type = e.target.value || "";
    renderList();
  };
  filtersDiv.appendChild(typeSelect);

  // Status-Filter
  const statusSelect = document.createElement("select");
  [
    ["", "Status: Alle"],
    ["active", "Aktiv"],
    ["testing", "Testing"],
    ["paused", "Pausiert"],
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (state.filters.status === value) opt.selected = true;
    statusSelect.appendChild(opt);
  });
  statusSelect.onchange = (e) => {
    state.filters.status = e.target.value || "";
    renderList();
  };
  filtersDiv.appendChild(statusSelect);

  // Sortierung
  const sortSelect = document.createElement("select");
  [
    ["score_desc", "Sort: Score ⬇"],
    ["roas_desc", "ROAS ⬇"],
    ["roas_asc", "ROAS ⬆"],
    ["spend_desc", "Spend ⬇"],
    ["ctr_desc", "CTR ⬇"],
  ].forEach(([value, label]) => {
    const opt = document.createElement("option");
    opt.value = value;
    opt.textContent = label;
    if (state.filters.sort === value) opt.selected = true;
    sortSelect.appendChild(opt);
  });
  sortSelect.onchange = (e) => {
    state.filters.sort = e.target.value || "score_desc";
    renderList();
  };
  filtersDiv.appendChild(sortSelect);

  container.appendChild(filtersDiv);

  // Grid-Container
  const listDiv = document.createElement("div");
  listDiv.className = "creative-list";
  listDiv.id = "creativeLibraryGrid";
  container.appendChild(listDiv);
}

// ---- Render der Creative-Karten ------------------------------------------

function renderList() {
  const container = state.container;
  if (!container) return;
  const grid = container.querySelector("#creativeLibraryGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const filtered = applyFiltersAndSort(state.allCreatives, state.filters);

  if (!filtered.length) {
    const empty = document.createElement("p");
    empty.textContent =
      "Keine Creatives für diese Filter gefunden. Passe deine Filter an.";
    grid.appendChild(empty);
    return;
  }

  filtered.forEach((c) => {
    const card = document.createElement("div");
    card.className = "creative-card";

    const header = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = c.title;
    header.appendChild(title);

    const creatorLine = document.createElement("div");
    creatorLine.className = "creative-meta";
    creatorLine.textContent = `${c.creator} · ${
      c.type === "video"
        ? "Video"
        : c.type === "static"
        ? "Static"
        : c.type.toUpperCase()
    }`;
    header.appendChild(creatorLine);

    // Tags
    const tagsRow = document.createElement("div");
    tagsRow.className = "creative-tags";
    (c.tags || []).forEach((tag) => {
      const span = document.createElement("span");
      span.className = "badge";
      if (tag === "Winner") span.classList.add("badge-online");
      if (tag === "Loser") span.classList.add("badge-offline");
      if (tag === "Testing") span.classList.add("badge-warning");
      span.textContent = tag;
      tagsRow.appendChild(span);
    });
    header.appendChild(tagsRow);

    card.appendChild(header);

    // KPIs
    const kpi = document.createElement("div");
    kpi.className = "creative-kpis";
    kpi.innerHTML = `
      <div>Score: <strong>${c.score}/100</strong></div>
      <div>ROAS: ${c.roas.toFixed(1)}x</div>
      <div>Spend: €${c.spend.toLocaleString("de-DE")}</div>
      <div>CTR: ${(c.ctr * 100).toFixed(2)} %</div>
      <div>CPM: €${c.cpm.toFixed(2)}</div>
    `;
    card.appendChild(kpi);

    // Actions
    const actions = document.createElement("div");
    actions.className = "creative-actions";

    const detailBtn = document.createElement("button");
    detailBtn.type = "button";
    detailBtn.textContent = "Details";
    detailBtn.onclick = () => openDetailModal(c);

    const testingBtn = document.createElement("button");
    testingBtn.type = "button";
    testingBtn.textContent = "In Testing Log öffnen";
    testingBtn.onclick = () => openTestingLogFor(c);

    actions.appendChild(detailBtn);
    actions.appendChild(testingBtn);

    card.appendChild(actions);

    grid.appendChild(card);
  });
}

// ---- Detail-Modal ---------------------------------------------------------

function openDetailModal(creative) {
  const api = window.SignalOne || {};
  const openSystemModal = api.openSystemModal || fallbackModal;

  const title = `Creative Deep Dive: ${creative.title}`;

  const body = `
    <div class="creative-detail">
      <p><strong>Creator:</strong> ${creative.creator}</p>
      <p><strong>Kampagne:</strong> ${creative.campaignName}</p>
      <p><strong>Hook:</strong> ${creative.hook}</p>
      <p><strong>Status:</strong> ${creative.status}</p>
      <p><strong>Tags:</strong> ${(creative.tags || []).join(", ")}</p>
      <h3>KPI Overview</h3>
      <ul>
        <li>Score: ${creative.score}/100</li>
        <li>ROAS: ${creative.roas.toFixed(2)}x</li>
        <li>Spend: €${creative.spend.toLocaleString("de-DE")}</li>
        <li>CTR: ${(creative.ctr * 100).toFixed(2)} %</li>
        <li>CPM: €${creative.cpm.toFixed(2)}</li>
        <li>Impressions: ${creative.impressions.toLocaleString("de-DE")}</li>
        <li>Laufzeit: ${creative.daysRunning} Tage</li>
      </ul>
      <h3>Story Breakdown (Demo)</h3>
      <p>
        Hook (0–3s): Problem-Statement mit klarem Pain Point.<br>
        Body (3–12s): Produkt-Demo mit Social Proof.<br>
        CTA (12–15s): "Jetzt shoppen" mit klarer Offer-Kommunikation.
      </p>
      <h3>Sensei Insight (Demo)</h3>
      <p>
        Dieses Creative performt überdurchschnittlich gut. Erstelle 3 weitere Varianten
        mit ähnlichem Hook, aber unterschiedlichen Intros und Thumbnails. Nutze den
        Testing Log, um die besten Varianten zu identifizieren.
      </p>
    </div>
  `;

  openSystemModal(title, body);
}

function fallbackModal(title, bodyHtml) {
  const wrapper = document.createElement("div");
  wrapper.className = "modal";
  wrapper.innerHTML = `
    <div class="modal-content">
      <h2>${title}</h2>
      ${bodyHtml}
      <button type="button" id="close-creative-detail">Schließen</button>
    </div>
  `;
  document.body.appendChild(wrapper);
  document
    .getElementById("close-creative-detail")
    .addEventListener("click", () => document.body.removeChild(wrapper));
}

// ---- Integration mit Testing Log (Platzhalter) ---------------------------

function openTestingLogFor(creative) {
  const api = window.SignalOne || {};
  if (typeof api.navigateTo === "function") {
    api.navigateTo("testingLog");
    if (typeof api.showToast === "function") {
      api.showToast(
        `Testing Log geöffnet – plane jetzt einen Test für "${creative.title}".`,
        "info"
      );
    }
  } else if (typeof api.showToast === "function") {
    api.showToast("Testing Log ist noch nicht vollständig integriert.", "info");
  }
}
