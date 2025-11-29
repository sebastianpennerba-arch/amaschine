// packages/creativeLibrary/index.js
// SignalOne – Creative Library (Block 1)
// Nutzt DemoData über window.SignalOneDemo (aus app.js)

const DemoDataCL = window.SignalOneDemo?.DemoData || null;

// Simple Demo-Creatives je Brand
const demoCreativesByBrand = {
  acme_fashion: [
    {
      id: "acme_reel_1",
      name: "UGC Haul – Herbst Drop",
      type: "Reel",
      hook: "„Ich hab das Teil in jeder Farbe…“",
      ctr: 3.9,
      roas: 5.1,
      spend: 8340,
      status: "winner",
      creator: "@lena.fits",
      duration: "28s",
      format: "9:16",
    },
    {
      id: "acme_static_1",
      name: "Static – Lookbook Carousel",
      type: "Carousel",
      hook: "3 Looks, 1 Outfit",
      ctr: 2.1,
      roas: 3.2,
      spend: 3921,
      status: "stable",
      creator: "Brand",
      duration: "—",
      format: "1:1",
    },
    {
      id: "acme_ugc_2",
      name: "POV: Du brauchst ein Upgrade",
      type: "Reel",
      hook: "„Ich hab mein altes komplett entsorgt…“",
      ctr: 4.8,
      roas: 6.4,
      spend: 11230,
      status: "winner",
      creator: "@streetedit",
      duration: "31s",
      format: "9:16",
    },
  ],
  techgadgets_pro: [
    {
      id: "tech_unbox_1",
      name: "Unboxing – SmartHub Pro",
      type: "Reel",
      hook: "1 Device, 7 Probleme gelöst",
      ctr: 3.1,
      roas: 4.2,
      spend: 6120,
      status: "winner",
      creator: "@techflo",
      duration: "36s",
      format: "9:16",
    },
    {
      id: "tech_static_1",
      name: "Static – Feature Breakdown",
      type: "Static",
      hook: "Plug. Play. Done.",
      ctr: 1.6,
      roas: 2.3,
      spend: 2980,
      status: "loser",
      creator: "Brand",
      duration: "—",
      format: "4:5",
    },
  ],
  beautylux_cosmetics: [
    {
      id: "beauty_routine_1",
      name: "Get Ready With Me – Serum",
      type: "Reel",
      hook: "„In 7 Tagen: sichtbarer Glow“",
      ctr: 4.3,
      roas: 5.9,
      spend: 9480,
      status: "winner",
      creator: "@glow.with.ale",
      duration: "42s",
      format: "9:16",
    },
  ],
  fitlife_supplements: [
    {
      id: "fit_stack_1",
      name: "What I take before Gym",
      type: "Reel",
      hook: "„Ich trainiere seit 10 Jahren…“",
      ctr: 3.7,
      roas: 4.4,
      spend: 7322,
      status: "stable",
      creator: "@liftwithmarc",
      duration: "33s",
      format: "9:16",
    },
  ],
  homezen_living: [
    {
      id: "home_before_after_1",
      name: "Before/After Living Room",
      type: "Reel",
      hook: "3 Teile, 1 neuer Raum",
      ctr: 4.0,
      roas: 3.9,
      spend: 4880,
      status: "winner",
      creator: "@homewithzoe",
      duration: "29s",
      format: "9:16",
    },
  ],
};

function getCurrentBrandId(appState) {
  if (appState.selectedBrandId) return appState.selectedBrandId;
  const brands = DemoDataCL?.brands || [];
  return brands[0]?.id || null;
}

function getCreativesForBrand(brandId) {
  if (!brandId) return [];
  return demoCreativesByBrand[brandId] || [];
}

function statusToBadgeClass(status) {
  if (status === "winner") return "creative-kpi-badge kpi-good";
  if (status === "loser") return "creative-kpi-badge kpi-bad";
  return "creative-kpi-badge kpi-warning";
}

function statusLabel(status) {
  if (status === "winner") return "Winner";
  if (status === "loser") return "Loser";
  return "Stable";
}

function buildCreativeCard(c) {
  const badgeClass = statusToBadgeClass(c.status);
  return `
    <article class="creative-library-item" data-name="${c.name.toLowerCase()}" data-hook="${c.hook.toLowerCase()}" data-status="${c.status}">
      <div class="creative-media-container-library">
        <div class="creative-faux-thumb">
          ${c.type === "Reel" ? "▶︎" : "▢"}
        </div>
        <div class="creative-card-menu" title="Aktionen">
          …
        </div>
      </div>
      <div class="creative-stats">
        <div class="creative-name-library">${c.name}</div>
        <div class="creative-meta">
          <span>${c.type} • ${c.format}</span>
          <span>${c.duration}</span>
        </div>
        <div class="creative-kpi-row">
          <span>CTR ${c.ctr.toFixed(1)}%</span>
          <span>ROAS ${c.roas.toFixed(1)}x</span>
          <span>Spend €${c.spend.toLocaleString("de-DE")}</span>
        </div>
        <div class="creative-info-row">
          <span>Creator: ${c.creator}</span>
          <span class="${badgeClass}">${statusLabel(c.status)}</span>
        </div>
      </div>
    </article>
  `;
}

function renderGrid(root, creatives) {
  const grid = root.querySelector("[data-role='creative-grid']");
  if (!grid) return;
  if (!creatives.length) {
    grid.innerHTML =
      '<p style="font-size:0.9rem;color:#64748b;">Für diese Brand liegen im Demo-Modus noch keine Creatives vor.</p>';
    return;
  }
  grid.innerHTML = creatives.map(buildCreativeCard).join("");
}

function wireFilters(root, allCreatives) {
  const searchInput = root.querySelector("[data-role='creative-search']");
  const statusSelect = root.querySelector("[data-role='creative-status-filter']");
  const grid = root.querySelector("[data-role='creative-grid']");
  if (!grid) return;

  function applyFilter() {
    const term = (searchInput?.value || "").toLowerCase();
    const status = statusSelect?.value || "all";

    const filtered = allCreatives.filter((c) => {
      const matchesStatus = status === "all" || c.status === status;
      const text =
        (c.name + " " + c.hook + " " + c.creator + " " + c.type).toLowerCase();
      const matchesSearch = !term || text.includes(term);
      return matchesStatus && matchesSearch;
    });

    renderGrid(root, filtered);
  }

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      applyFilter();
    });
  }
  if (statusSelect) {
    statusSelect.addEventListener("change", () => {
      applyFilter();
    });
  }

  applyFilter();
}

export function render(section, AppState, { useDemoMode }) {
  const brandId = getCurrentBrandId(AppState);
  const brand =
    (DemoDataCL?.brands || []).find((b) => b.id === brandId) || null;
  const creatives = getCreativesForBrand(brandId);

  section.innerHTML = `
    <header class="view-header">
      <div>
        <h2>Creative Library</h2>
        <div class="view-subtitle">
          ${brand ? brand.name : "Demo Brand"} • ${
    brand ? brand.vertical : "Performance Demo"
  }
        </div>
      </div>
      <div>
        <span class="badge-pill">Modus: ${useDemoMode ? "Demo" : "Live"}</span>
      </div>
    </header>

    <div class="view-body">
      <div class="creative-filter-row">
        <input
          type="text"
          placeholder="Suchen nach Hook, Creator, Format…"
          class="creative-filter-input"
          data-role="creative-search"
        />
        <select class="creative-filter-select" data-role="creative-status-filter">
          <option value="all">Status: Alle</option>
          <option value="winner">Nur Winner</option>
          <option value="stable">Nur Stable</option>
          <option value="loser">Nur Loser</option>
        </select>
        <span style="font-size:0.8rem;color:#64748b;">
          Demo-Modus zeigt kuratierte Beispiel-Creatives je Brand.
        </span>
      </div>

      <div class="creative-grid" data-role="creative-grid"></div>
    </div>
  `;

  wireFilters(section, creatives);

  // Karten-Klick → Detail-Modal (einfacher Stub)
  section.addEventListener("click", (evt) => {
    const card = evt.target.closest(".creative-library-item");
    if (!card) return;
    const name = card.querySelector(".creative-name-library")?.textContent;
    const status = card.getAttribute("data-status") || "–";
    const hook = card.getAttribute("data-hook") || "";
    const meta = card
      .querySelector(".creative-meta")
      ?.textContent.trim() || "";

    const body = `
      <p><strong>${name}</strong></p>
      <p style="margin-top:6px;font-size:0.9rem;color:#64748b;">
        Status: ${status.toUpperCase()} • ${meta}
      </p>
      <p style="margin-top:10px;font-size:0.9rem;">
        Hook Preview:<br/>
        <em>${hook || "„Hook-Text im Demo-Modus“"}</em>
      </p>
      <p style="margin-top:10px;font-size:0.8rem;color:#94a3b8;">
        Später: Vollständiges Creative-Detail mit Varianten, Tests und Sensei-Empfehlungen.
      </p>
    `;
    window.SignalOne?.openSystemModal?.("Creative Detail", body);
  });
}
