document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupSectionToggles();
  setupExport();
  setupModal();
  setupAIButtons();
  setupLibraryFilters();

  // Render-Initials
  renderRecommendations();
  renderAnomalies();
  renderTopCreatives();
  renderTestingLog();
  renderHookAngle();
  renderCreators();
  renderLibrary();
  renderReports();
});

/* ===== NAVIGATION ===== */

function setupNavigation() {
  const navButtons = document.querySelectorAll(".nav-item");
  const views = document.querySelectorAll(".view");
  const pageTitle = document.getElementById("page-title");

  const titles = {
    dashboard: "Command Center",
    "creative-cockpit": "Creative Cockpit",
    "creative-library": "Creative Library",
    "testing-log": "Testing Log",
    reports: "Reports",
    "ai-hub": "AI Actions",
    integrations: "Integrationen",
    settings: "Einstellungen",
    billing: "Abrechnung",
  };

  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const viewId = btn.dataset.view;

      navButtons.forEach((b) => b.classList.remove("nav-item-active"));
      btn.classList.add("nav-item-active");

      views.forEach((v) => v.classList.remove("view-active"));
      const activeView = document.getElementById(`view-${viewId}`);
      if (activeView) activeView.classList.add("view-active");

      pageTitle.textContent = titles[viewId] || "AdSensei";
    });
  });
}

/* ===== SECTIONS: EIN-/AUSBLENDEN & EINKLAPPEN ===== */

function setupSectionToggles() {
  // Sichtbarkeit per Checkbox
  document.querySelectorAll(".section-toggle").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const sectionId = checkbox.dataset.sectionId;
      const panel = document.querySelector(`.panel[data-section-id="${sectionId}"]`);
      if (!panel) return;
      panel.style.display = checkbox.checked ? "block" : "none";
    });
  });

  // Einklappen
  document.querySelectorAll(".panel-collapse-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sectionId = btn.dataset.sectionId;
      const panel = document.querySelector(`.panel[data-section-id="${sectionId}"]`);
      if (!panel) return;
      panel.classList.toggle("panel-collapsed");
    });
  });
}

/* ===== EXPORT ===== */

function setupExport() {
  const exportBtn = document.getElementById("export-btn");
  exportBtn.addEventListener("click", () => {
    // Hier später CSV-/XLSX-Export einbauen.
    alert("Export-Funktion: Hier wird später CSV/XLSX mit allen Filtern erzeugt.");
  });
}

/* ===== MODAL ===== */

let currentCreative = null;

function setupModal() {
  const backdrop = document.getElementById("creative-modal");
  const closeBtn = document.getElementById("modal-close");
  const aiBtn = document.getElementById("btn-ai-analyze");

  closeBtn.addEventListener("click", hideModal);
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop) hideModal();
  });

  aiBtn.addEventListener("click", () => {
    if (!currentCreative) return;
    alert(
      `KI-Analyse für "${currentCreative.title}" wird später hier über die API von Corelytics laufen.`
    );
  });
}

function showModal(creative) {
  currentCreative = creative;
  const backdrop = document.getElementById("creative-modal");
  backdrop.classList.add("modal-backdrop-active");

  document.getElementById("modal-title").textContent = creative.title;
  const preview = document.getElementById("modal-preview");
  preview.style.backgroundImage = creative.thumb
    ? `url(${creative.thumb})`
    : "linear-gradient(135deg,#343f57,#191e2a)";

  const meta = document.getElementById("modal-meta");
  meta.innerHTML = `
    <div><strong>Plattform:</strong> ${creative.platform}</div>
    <div><strong>Format:</strong> ${creative.format}</div>
    <div><strong>Hook:</strong> ${creative.hook}</div>
    <div><strong>Angle:</strong> ${creative.angle}</div>
    <div><strong>Creator:</strong> ${creative.creator}</div>
  `;

  const metrics = document.getElementById("modal-metrics");
  metrics.innerHTML = `
    <div><strong>Spend:</strong> € ${creative.spend.toLocaleString("de-DE")}</div>
    <div><strong>Purchases:</strong> ${creative.purchases}</div>
    <div><strong>ROAS:</strong> ${creative.roas.toFixed(2)}</div>
    <div><strong>CTR:</strong> ${(creative.ctr * 100).toFixed(2)} %</div>
    <div><strong>CPR:</strong> € ${creative.cpr.toFixed(2)}</div>
  `;
}

function hideModal() {
  const backdrop = document.getElementById("creative-modal");
  backdrop.classList.remove("modal-backdrop-active");
  currentCreative = null;
}

/* ===== AI BUTTONS ===== */

function setupAIButtons() {
  const hookBtn = document.getElementById("ai-hook-gen");
  const breakdownBtn = document.getElementById("ai-breakdown");
  const testplanBtn = document.getElementById("ai-testplan");
  const briefingBtn = document.getElementById("ai-briefing");

  if (hookBtn)
    hookBtn.addEventListener("click", () =>
      alert("Hook Generator: später GPT/AdSensei-Workflow mit echten Daten.")
    );
  if (breakdownBtn)
    breakdownBtn.addEventListener("click", () =>
      alert("Creative Breakdown: KI-Analyse wird später hier angebunden.")
    );
  if (testplanBtn)
    testplanBtn.addEventListener("click", () =>
      alert("Testplan Creator: generiert Testplan per KI in der finalen Version.")
    );
  if (briefingBtn)
    briefingBtn.addEventListener("click", () =>
      alert("UGC-Briefing Generator: erzeugt Briefing aus Top-Creative.")
    );
}

/* ===== LIBRARY FILTERS ===== */

function setupLibraryFilters() {
  const resetBtn = document.getElementById("btn-library-reset");
  const searchInput = document.getElementById("search-creatives");
  const formatSelect = document.getElementById("filter-format");
  const hookSelect = document.getElementById("filter-hook");
  const statusSelect = document.getElementById("filter-status");

  const rerender = () => renderLibrary();

  if (searchInput) searchInput.addEventListener("input", rerender);
  if (formatSelect) formatSelect.addEventListener("change", rerender);
  if (hookSelect) hookSelect.addEventListener("change", rerender);
  if (statusSelect) statusSelect.addEventListener("change", rerender);

  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (formatSelect) formatSelect.value = "all";
      if (hookSelect) hookSelect.value = "all";
      if (statusSelect) statusSelect.value = "all";
      renderLibrary();
    });
}

/* ===== DUMMY DATEN ===== */

const recommendations = [
  {
    text: "Skaliere 'Cookie_Video_Emotional_Lisa' um +30 %, ROAS 5,1 bei stabiler CPA.",
    meta: "Meta • Video • Best Performer 7d",
  },
  {
    text: "Pausiere 'Brownie_Image_Claire', ROAS < 1,0 und CPA doppelt so hoch wie Ziel.",
    meta: "Meta • Image • Underperformer",
  },
  {
    text: "Teste Hook-Variante mit 'Was wäre, wenn du…' auf deiner Top-Audience 25–34.",
    meta: "Hook-Test • Prospecting",
  },
];

const anomalies = [
  {
    text: "Ungewöhnlicher Spend-Anstieg (+65 %) bei 'Retargeting – Cart 30d' seit gestern.",
    meta: "Check Budget & Frequenz",
  },
  {
    text: "CTR-Einbruch bei Testimonials von 2,8 % auf 1,3 %.",
    meta: "Creative Fatigue möglich",
  },
];

const topCreatives = [
  {
    id: 1,
    rank: 1,
    title: "Cookie_Video_Testimonial_Lisa",
    platform: "Meta",
    format: "Video 4:5",
    hook: "Hast du gewusst…?",
    angle: "Testimonial",
    creator: "Lisa",
    spend: 9440,
    purchases: 210,
    roas: 5.05,
    ctr: 0.028,
    cpr: 44.95,
    status: "winner",
    thumb: "",
  },
  {
    id: 2,
    rank: 2,
    title: "Brownie_Video_Emotional_Cedric",
    platform: "Meta",
    format: "Video 9:16",
    hook: "Du glaubst nicht…",
    angle: "Emotional",
    creator: "Cedric",
    spend: 9334,
    purchases: 189,
    roas: 4.86,
    ctr: 0.031,
    cpr: 49.4,
    status: "winner",
    thumb: "",
  },
  {
    id: 3,
    rank: 3,
    title: "Cookie_Image_Claire_Collection",
    platform: "Meta",
    format: "Image 1:1",
    hook: "Nur heute…",
    angle: "Offer",
    creator: "Claire",
    spend: 6280,
    purchases: 195,
    roas: 5.07,
    ctr: 0.024,
    cpr: 32.21,
    status: "learning",
    thumb: "",
  },
  {
    id: 4,
    rank: 4,
    title: "Brownie_Image_Cedric_PDP",
    platform: "Meta",
    format: "Image 4:5",
    hook: "So schmeckt…",
    angle: "Product Focus",
    creator: "Cedric",
    spend: 6400,
    purchases: 150,
    roas: 4.62,
    ctr: 0.022,
    cpr: 42.67,
    status: "dieing",
    thumb: "",
  },
];

const libraryCreatives = [
  ...topCreatives,
  {
    id: 5,
    rank: 5,
    title: "UGC_Story_Emotional_Lisa",
    platform: "Meta",
    format: "Video 9:16",
    hook: "Ich zeig dir mal…",
    angle: "UGC",
    creator: "Lisa",
    spend: 3200,
    purchases: 80,
    roas: 3.7,
    ctr: 0.029,
    cpr: 40,
    status: "learning",
    thumb: "",
  },
  {
    id: 6,
    rank: 6,
    title: "Static_Image_Offer_Scarcity",
    platform: "Meta",
    format: "Image 1:1",
    hook: "Nur bis heute 23:59…",
    angle: "Scarcity",
    creator: "Stock",
    spend: 2100,
    purchases: 40,
    roas: 2.9,
    ctr: 0.02,
    cpr: 52.5,
    status: "learning",
    thumb: "",
  },
];

const testingExperiments = [
  {
    name: "Hook-Test: 'Wusstest du…?' vs. 'Stell dir vor…'",
    hook: "Wusstest du…?",
    angle: "Education",
    platform: "Meta",
    spend: 2300,
    purchases: 48,
    roas: 3.9,
    status: "Läuft",
  },
  {
    name: "Angle-Test: Emotional vs. Testimonial",
    hook: "Du glaubst nicht…",
    angle: "Emotional",
    platform: "Meta",
    spend: 3100,
    purchases: 70,
    roas: 4.4,
    status: "Gewinner erkennen",
  },
  {
    name: "Creator-Test: Lisa vs. Cedric",
    hook: "So einfach…",
    angle: "UGC Testimonial",
    platform: "Meta",
    spend: 1800,
    purchases: 37,
    roas: 3.6,
    status: "Daten sammeln",
  },
];

const hookAngleData = [
  { type: "Hook", label: "Hast du gewusst…?", spend: 12000, roas: 4.8, ctr: 0.029 },
  { type: "Hook", label: "Du glaubst nicht…", spend: 9000, roas: 4.3, ctr: 0.031 },
  { type: "Angle", label: "Testimonial", spend: 15000, roas: 4.9, ctr: 0.028 },
  { type: "Angle", label: "Emotional", spend: 13000, roas: 4.4, ctr: 0.03 },
];

const creatorPerformance = [
  { name: "Lisa", creatives: 6, spend: 16000, purchases: 340, roas: 4.6 },
  { name: "Cedric", creatives: 5, spend: 14000, purchases: 295, roas: 4.2 },
  { name: "Claire", creatives: 3, spend: 7800, purchases: 210, roas: 4.9 },
];

const reportHooks = [
  { hook: "Hast du gewusst…?", creatives: 4, spend: 12000, roas: 4.8 },
  { hook: "Du glaubst nicht…", creatives: 3, spend: 9000, roas: 4.3 },
];

const reportAngles = [
  { angle: "Testimonial", creatives: 5, spend: 15000, roas: 4.9 },
  { angle: "Emotional", creatives: 4, spend: 13000, roas: 4.4 },
];

/* ===== RENDER FUNKTIONEN ===== */

function renderRecommendations() {
  const list = document.getElementById("recommendations-list");
  if (!list) return;
  list.innerHTML = "";
  recommendations.forEach((rec) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <span class="list-item-label">${rec.text}</span>
      <span class="list-item-meta">${rec.meta}</span>
    `;
    list.appendChild(li);
  });
}

function renderAnomalies() {
  const list = document.getElementById("anomalies-list");
  if (!list) return;
  list.innerHTML = "";
  anomalies.forEach((a) => {
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <span class="list-item-label">${a.text}</span>
      <span class="list-item-meta">${a.meta}</span>
    `;
    list.appendChild(li);
  });
}

function renderTopCreatives() {
  const grid = document.getElementById("top-creatives-grid");
  if (!grid) return;
  grid.innerHTML = "";
  topCreatives.forEach((c) => {
    const card = document.createElement("article");
    card.className = "creative-card";
    card.addEventListener("click", () => showModal(c));

    const thumb = document.createElement("div");
    thumb.className = "creative-thumb";
    thumb.style.backgroundImage = c.thumb
      ? `url(${c.thumb})`
      : "linear-gradient(135deg,#343f57,#191e2a)";
    thumb.innerHTML = `
      <span class="creative-rank">#${c.rank}</span>
      <span class="creative-platform">${c.platform}</span>
    `;

    const body = document.createElement("div");
    body.className = "creative-body";
    body.innerHTML = `
      <div class="creative-title">${c.title}</div>
      <div class="creative-metrics">
        <span>ROAS ${c.roas.toFixed(2)}</span>
        <span>CPR € ${c.cpr.toFixed(2)}</span>
        <span>CTR ${(c.ctr * 100).toFixed(1)}%</span>
      </div>
      <div class="creative-metrics">
        <span class="creative-tag">${c.format}</span>
        <span class="creative-tag">Hook: ${c.hook}</span>
        <span class="creative-tag">Creator: ${c.creator}</span>
      </div>
    `;

    card.appendChild(thumb);
    card.appendChild(body);
    grid.appendChild(card);
  });
}

function renderTestingLog() {
  const tbody = document.querySelector("#testing-log-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  testingExperiments.forEach((exp) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${exp.name}</td>
      <td>${exp.hook}</td>
      <td>${exp.angle}</td>
      <td>${exp.platform}</td>
      <td>€ ${exp.spend.toLocaleString("de-DE")}</td>
      <td>${exp.purchases}</td>
      <td>${exp.roas.toFixed(2)}</td>
      <td>${exp.status}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderHookAngle() {
  const tbody = document.querySelector("#hook-angle-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  hookAngleData.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.type}</td>
      <td>${row.label}</td>
      <td>€ ${row.spend.toLocaleString("de-DE")}</td>
      <td>${row.roas.toFixed(2)}</td>
      <td>${(row.ctr * 100).toFixed(2)} %</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderCreators() {
  const tbody = document.querySelector("#creator-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  creatorPerformance.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.name}</td>
      <td>${row.creatives}</td>
      <td>€ ${row.spend.toLocaleString("de-DE")}</td>
      <td>${row.purchases}</td>
      <td>${row.roas.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderLibrary() {
  const grid = document.getElementById("library-grid");
  if (!grid) return;

  const search = document.getElementById("search-creatives")?.value.toLowerCase() || "";
  const format = document.getElementById("filter-format")?.value || "all";
  const hookFilter = document.getElementById("filter-hook")?.value || "all";
  const status = document.getElementById("filter-status")?.value || "all";

  grid.innerHTML = "";

  libraryCreatives
    .filter((c) => {
      if (
        search &&
        !(
          c.title.toLowerCase().includes(search) ||
          c.hook.toLowerCase().includes(search) ||
          c.creator.toLowerCase().includes(search)
        )
      ) {
        return false;
      }
      if (format !== "all") {
        const isVideo = c.format.toLowerCase().includes("video");
        const isImage = c.format.toLowerCase().includes("image");
        const isCarousel = c.format.toLowerCase().includes("carousel");
        if (
          (format === "video" && !isVideo) ||
          (format === "image" && !isImage) ||
          (format === "carousel" && !isCarousel)
        )
          return false;
      }
      if (hookFilter !== "all") {
        if (hookFilter === "education" && !c.angle.toLowerCase().includes("education"))
          return false;
        if (hookFilter === "emotional" && !c.angle.toLowerCase().includes("emotional"))
          return false;
        if (hookFilter === "offer" && !c.angle.toLowerCase().includes("offer")) return false;
      }
      if (status !== "all" && c.status !== status) return false;
      return true;
    })
    .forEach((c) => {
      const card = document.createElement("article");
      card.className = "creative-card";
      card.addEventListener("click", () => showModal(c));

      const thumb = document.createElement("div");
      thumb.className = "creative-thumb";
      thumb.style.backgroundImage = c.thumb
        ? `url(${c.thumb})`
        : "linear-gradient(135deg,#343f57,#191e2a)";
      thumb.innerHTML = `
        <span class="creative-rank">#${c.rank}</span>
        <span class="creative-platform">${c.platform}</span>
      `;

      const body = document.createElement("div");
      body.className = "creative-body";
      body.innerHTML = `
        <div class="creative-title">${c.title}</div>
        <div class="creative-metrics">
          <span>ROAS ${c.roas.toFixed(2)}</span>
          <span>CPR € ${c.cpr.toFixed(2)}</span>
          <span>CTR ${(c.ctr * 100).toFixed(1)}%</span>
        </div>
        <div class="creative-metrics">
          <span class="creative-tag">${c.format}</span>
          <span class="creative-tag">Hook: ${c.hook}</span>
          <span class="creative-tag">Creator: ${c.creator}</span>
          <span class="creative-tag">${c.status}</span>
        </div>
      `;
      card.appendChild(thumb);
      card.appendChild(body);
      grid.appendChild(card);
    });
}

function renderReports() {
  const hooksBody = document.querySelector("#report-hooks tbody");
  const anglesBody = document.querySelector("#report-angles tbody");
  if (hooksBody) {
    hooksBody.innerHTML = "";
    reportHooks.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.hook}</td>
        <td>${row.creatives}</td>
        <td>€ ${row.spend.toLocaleString("de-DE")}</td>
        <td>${row.roas.toFixed(2)}</td>
      `;
      hooksBody.appendChild(tr);
    });
  }
  if (anglesBody) {
    anglesBody.innerHTML = "";
    reportAngles.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.angle}</td>
        <td>${row.creatives}</td>
        <td>€ ${row.spend.toLocaleString("de-DE")}</td>
        <td>${row.roas.toFixed(2)}</td>
      `;
      anglesBody.appendChild(tr);
    });
  }
}
