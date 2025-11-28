// packages/campaigns/index.js
// Advanced Campaigns Table für SignalOne
// Nutzt Brand-Kontext (AppState.selectedBrandId) & Demo-/Live-Mode (env.useDemoMode)

export function render(rootEl, AppState, env = {}) {
  if (!rootEl) return;

  const useDemo =
    typeof env.useDemoMode === "boolean" ? env.useDemoMode : true;

  const demo = window.SignalOneDemo && window.SignalOneDemo.DemoData;
  const brands = demo && demo.brands ? demo.brands : [];

  let brandId = AppState.selectedBrandId;
  if (!brandId && brands.length) {
    brandId = brands[0].id;
  }
  const brand =
    brands.find((b) => b.id === brandId) || (brands.length ? brands[0] : null);

  rootEl.innerHTML = "";

  // Live-Guard – ohne Demo & ohne Meta → Info-Text
  if (!useDemo && !AppState.metaConnected) {
    const msg = document.createElement("p");
    msg.textContent =
      "Live-Modus aktiv. Die Kampagnen-Übersicht wird echte Kampagnen anzeigen, sobald die Meta-Anbindung fertig ist. Aktuell kannst du den Demo-Modus nutzen.";
    rootEl.appendChild(msg);
    return;
  }

  // -------------------------------------------------------------
  // Demo-Kampagnen für aktuelle Brand
  // -------------------------------------------------------------

  const allCampaigns = getCampaignsForBrand(brand ? brand.id : null);
  let state = {
    allCampaigns,
    filteredCampaigns: allCampaigns,
    searchTerm: "",
    filterStatus: "all",
    filterLearning: "all",
    sortBy: "spend_desc",
  };

  // -------------------------------------------------------------
  // Layout: Header (Hero) + Filter + Summary + Tabelle
  // -------------------------------------------------------------

  const header = document.createElement("div");
  header.className = "dashboard-hero";

  const statusChip = document.createElement("div");
  statusChip.className = "dashboard-hero-status";
  statusChip.textContent = brand
    ? `${brand.name} • ${brand.vertical}`
    : "Kein Werbekonto ausgewählt";

  const title = document.createElement("h2");
  title.className = "dashboard-hero-title";
  title.textContent = "Kampagnen-Übersicht";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    subtitle.textContent = useDemo
      ? "Demo-Kampagnen mit realistischen KPIs, Status und Sensei-Hinweisen – verhalten sich wie echte Meta-Kampagnen."
      : "Live-Modus – hier erscheinen deine echten Kampagnen, sobald Meta verbunden ist.";
  } else {
    subtitle.textContent =
      "Wähle oben ein Werbekonto, um dessen Kampagnen zu sehen.";
  }

  header.appendChild(statusChip);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Filter-Leiste
  const filters = document.createElement("div");
  filters.className = "creative-filters"; // nutzt bestehendes Layout

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Nach Kampagne, Objective oder Insight suchen…";

  const statusSelect = document.createElement("select");
  [
    { value: "all", label: "Status: Alle" },
    { value: "ACTIVE", label: "Nur aktive" },
    { value: "PAUSED", label: "Pausiert" },
    { value: "TESTING", label: "Testing" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    statusSelect.appendChild(o);
  });

  const learningSelect = document.createElement("select");
  [
    { value: "all", label: "Lernphase: Alle" },
    { value: "learning", label: "In Lernphase" },
    { value: "stable", label: "Stabil" },
    { value: "limited", label: "Limited Learning" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    learningSelect.appendChild(o);
  });

  const sortSelect = document.createElement("select");
  [
    { value: "spend_desc", label: "Sortieren: Spend (absteigend)" },
    { value: "spend_asc", label: "Spend (aufsteigend)" },
    { value: "roas_desc", label: "ROAS (absteigend)" },
    { value: "roas_asc", label: "ROAS (aufsteigend)" },
    { value: "cpa_asc", label: "CPA (aufsteigend)" },
    { value: "cpm_asc", label: "CPM (aufsteigend)" },
    { value: "cpm_desc", label: "CPM (absteigend)" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    sortSelect.appendChild(o);
  });

  filters.appendChild(searchInput);
  filters.appendChild(statusSelect);
  filters.appendChild(learningSelect);
  filters.appendChild(sortSelect);

  // Summary
  const summary = document.createElement("p");
  summary.style.margin = "0 0 10px";
  summary.style.fontSize = "0.85rem";
  summary.style.color = "var(--color-text-muted)";

  // Tabellen-Wrapper
  const tableWrapper = document.createElement("div");
  tableWrapper.className = "campaign-table";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  [
    "Kampagne",
    "Status",
    "Lernphase",
    "Spend (30d)",
    "Revenue (30d)",
    "ROAS",
    "CPM",
    "CTR",
    "CPA",
    "Creatives",
    "Details",
  ].forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrapper.appendChild(table);

  // Layout ins Root hängen
  rootEl.appendChild(header);
  rootEl.appendChild(filters);
  rootEl.appendChild(summary);
  rootEl.appendChild(tableWrapper);

  // -------------------------------------------------------------
  // State-Logik: Filtern, Sortieren, Rendern
  // -------------------------------------------------------------

  function applyFiltersAndSort() {
    const term = state.searchTerm.trim().toLowerCase();
    const fStatus = state.filterStatus;
    const fLearning = state.filterLearning;
    const sort = state.sortBy;

    let arr = [...state.allCampaigns];

    if (term) {
      arr = arr.filter((c) => {
        const haystack = `${c.name} ${c.objective} ${c.senseiInsight} ${(
          c.tags || []
        ).join(" ")}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    if (fStatus !== "all") {
      arr = arr.filter((c) => c.status === fStatus);
    }

    if (fLearning !== "all") {
      if (fLearning === "learning") {
        arr = arr.filter((c) => c.learningPhase === "Learning");
      } else if (fLearning === "stable") {
        arr = arr.filter((c) => c.learningPhase === "Stable");
      } else if (fLearning === "limited") {
        arr = arr.filter((c) => c.learningPhase === "Limited");
      }
    }

    arr.sort((a, b) => {
      switch (sort) {
        case "spend_desc":
          return b.spend - a.spend;
        case "spend_asc":
          return a.spend - b.spend;
        case "roas_desc":
          return b.roas - a.roas;
        case "roas_asc":
          return a.roas - b.roas;
        case "cpa_asc":
          return a.cpa - b.cpa;
        case "cpm_asc":
          return a.cpm - b.cpm;
        case "cpm_desc":
          return b.cpm - a.cpm;
        default:
          return 0;
      }
    });

    state.filteredCampaigns = arr;
  }

  function renderSummary() {
    const total = state.allCampaigns.length;
    const filtered = state.filteredCampaigns.length;
    const demoLabel = useDemo ? "Demo-Datensatz" : "Live-Daten (demnächst)";
    if (filtered === total) {
      summary.textContent = `${filtered} Kampagnen im ${demoLabel} für dieses Konto.`;
    } else {
      summary.textContent = `${filtered} von ${total} Kampagnen nach Filterung im ${demoLabel}.`;
    }
  }

  function renderTable() {
    tbody.innerHTML = "";

    if (!state.filteredCampaigns.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 11;
      td.textContent =
        "Keine Kampagnen entsprechen den aktuellen Filtern. Passe Suche oder Filter an.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    state.filteredCampaigns.forEach((c) => {
      const tr = document.createElement("tr");

      // Kampagne (Name + Objective)
      const tdName = document.createElement("td");
      const nameEl = document.createElement("div");
      nameEl.style.fontWeight = "600";
      nameEl.style.fontSize = "0.9rem";
      nameEl.textContent = c.name;
      const sub = document.createElement("div");
      sub.style.fontSize = "0.78rem";
      sub.style.color = "var(--color-text-soft)";
      sub.textContent = c.objective;
      tdName.appendChild(nameEl);
      tdName.appendChild(sub);
      tr.appendChild(tdName);

      // Status
      const tdStatus = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = "badge";
      if (c.status === "ACTIVE") {
        statusBadge.classList.add("badge-online");
        statusBadge.textContent = "Active";
      } else if (c.status === "PAUSED") {
        statusBadge.classList.add("badge-warning");
        statusBadge.textContent = "Paused";
      } else {
        statusBadge.classList.add("badge-offline");
        statusBadge.textContent = "Testing";
      }
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // Lernphase
      const tdLearning = document.createElement("td");
      tdLearning.textContent = c.learningPhase;
      tr.appendChild(tdLearning);

      // Spend
      const tdSpend = document.createElement("td");
      tdSpend.textContent = formatCurrency(c.spend);
      tr.appendChild(tdSpend);

      // Revenue
      const tdRevenue = document.createElement("td");
      tdRevenue.textContent = formatCurrency(c.revenue);
      tr.appendChild(tdRevenue);

      // ROAS
      const tdRoas = document.createElement("td");
      tdRoas.textContent = `${c.roas.toFixed(1)}x`;
      tr.appendChild(tdRoas);

      // CPM
      const tdCpm = document.createElement("td");
      tdCpm.textContent = formatCurrency(c.cpm);
      tr.appendChild(tdCpm);

      // CTR
      const tdCtr = document.createElement("td");
      tdCtr.textContent = `${c.ctr.toFixed(2)} %`;
      tr.appendChild(tdCtr);

      // CPA
      const tdCpa = document.createElement("td");
      tdCpa.textContent = formatCurrency(c.cpa);
      tr.appendChild(tdCpa);

      // Creatives
      const tdCreatives = document.createElement("td");
      tdCreatives.textContent = `${c.creativeCount}`;
      tr.appendChild(tdCreatives);

      // Details Button
      const tdDetails = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Details";
      btn.style.fontSize = "0.8rem";
      btn.style.padding = "4px 10px";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetails(c);
      });
      tdDetails.appendChild(btn);
      tr.appendChild(tdDetails);

      // Zeilen-Klick → Details
      tr.addEventListener("click", () => openDetails(c));
      tbody.appendChild(tr);
    });
  }

  function openDetails(campaign) {
    if (!window.SignalOne || !window.SignalOne.openSystemModal) return;

    const alertsHtml = (campaign.alerts || [])
      .map((a) => `<li>${a}</li>`)
      .join("");

    const body = `
      <p><strong>${campaign.name}</strong></p>
      <p style="font-size:0.9rem;color:#6b7280;margin-top:4px;">
        Objective: ${campaign.objective} • Status: ${campaign.status} • Lernphase: ${campaign.learningPhase}
      </p>

      <div style="margin-top:12px;font-size:0.9rem;">
        <strong>KPIs (letzte 30 Tage)</strong>
        <ul style="margin-top:6px;padding-left:18px;">
          <li>Ad Spend: ${formatCurrency(campaign.spend)}</li>
          <li>Revenue: ${formatCurrency(campaign.revenue)}</li>
          <li>ROAS: ${campaign.roas.toFixed(1)}x</li>
          <li>CPM: ${formatCurrency(campaign.cpm)}</li>
          <li>CTR: ${campaign.ctr.toFixed(2)} %</li>
          <li>CPA: ${formatCurrency(campaign.cpa)}</li>
          <li>Creatives: ${campaign.creativeCount}</li>
        </ul>
      </div>

      <div style="margin-top:12px;font-size:0.9rem;">
        <strong>Sensei Insight</strong>
        <p style="margin-top:4px;">${campaign.senseiInsight}</p>
      </div>

      ${
        alertsHtml
          ? `<div style="margin-top:12px;font-size:0.9rem;">
        <strong>Alerts & Checks</strong>
        <ul style="margin-top:6px;padding-left:18px;">${alertsHtml}</ul>
      </div>`
          : ""
      }

      <div style="margin-top:14px;font-size:0.85rem;color:#6b7280;">
        Hinweis: Dies ist ein ${env.useDemoMode ? "Demo-" : "Preview-"}Datensatz, der sich im Verhalten wie echte Meta-Kampagnen verhält.
      </div>
    `;

    window.SignalOne.openSystemModal("Kampagnendetails", body);
  }

  // Event Wiring
  searchInput.addEventListener("input", () => {
    state.searchTerm = searchInput.value || "";
    applyFiltersAndSort();
    renderSummary();
    renderTable();
  });

  statusSelect.addEventListener("change", () => {
    state.filterStatus = statusSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderTable();
  });

  learningSelect.addEventListener("change", () => {
    state.filterLearning = learningSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderTable();
  });

  sortSelect.addEventListener("change", () => {
    state.sortBy = sortSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderTable();
  });

  // Initial render
  applyFiltersAndSort();
  renderSummary();
  renderTable();
}

// ---------------------------------------------------------------------------
// DEMO-KAMPAGNENDATEN – je Brand eigene Struktur
// ---------------------------------------------------------------------------

function getCampaignsForBrand(brandId) {
  switch (brandId) {
    case "acme_fashion":
      return [
        {
          id: "acme_ugc_scale",
          name: "UGC Scale – Evergreen",
          objective: "Sales / Purchase Conversion",
          status: "ACTIVE",
          learningPhase: "Stable",
          spend: 18240,
          revenue: 91200,
          roas: 5.0,
          cpm: 8.2,
          ctr: 2.9,
          cpa: 7.5,
          creativeCount: 14,
          alerts: [
            "Creative Fatigue in Ad Set „Lookalike 3%“ erkennbar.",
            "Audience-Overlap mit ‚BA Evergreen‘ bei ~32%.",
          ],
          senseiInsight:
            "Starker Scale-Kandidat. Sensei empfiehlt, Budget in den besten Ad Sets um 20–30 % zu erhöhen und neue Hooks für gesättigte Zielgruppen zu testen.",
        },
        {
          id: "acme_brand_static",
          name: "Brand Awareness – Static Lookbook",
          objective: "Brand Awareness / Reach",
          status: "PAUSED",
          learningPhase: "Stable",
          spend: 6210,
          revenue: 20100,
          roas: 3.2,
          cpm: 7.6,
          ctr: 1.8,
          cpa: 11.4,
          creativeCount: 6,
          alerts: [
            "Kampagne war eher auf Brand KPIs optimiert, nicht auf direkte Conversions.",
          ],
          senseiInsight:
            "Solide Brand-Kampagne mit positivem Nebeneffekt auf Performance-Kampagnen. Als Always-On-Brand-Layer mit reduziertem Budget sinnvoll.",
        },
        {
          id: "acme_hook_battle",
          name: "Hook Battle Q4 – UGC Testing",
          objective: "Sales / Creative Testing",
          status: "TESTING",
          learningPhase: "Learning",
          spend: 7420,
          revenue: 26300,
          roas: 3.5,
          cpm: 9.4,
          ctr: 3.1,
          cpa: 9.9,
          creativeCount: 18,
          alerts: [
            "2 Hooks deutlich stärker (> 5.0x ROAS) als restliche Test-Creatives.",
            "Mehrere schwache Ads (< 2.0x ROAS) laufen noch mit vollem Budget.",
          ],
          senseiInsight:
            "Sensei empfiehlt, die 2 stärksten Hooks in die Scale-Kampagne zu verschieben und schwache Variationen aggressiv abzuschalten.",
        },
      ];

    case "techgadgets_pro":
      return [
        {
          id: "tech_launch",
          name: "Launch Funnel EU – Conversion",
          objective: "Sales / Full-Funnel Launch",
          status: "ACTIVE",
          learningPhase: "Limited",
          spend: 15340,
          revenue: 49800,
          roas: 3.2,
          cpm: 11.8,
          ctr: 1.9,
          cpa: 19.4,
          creativeCount: 9,
          alerts: [
            "CPM leicht über Benchmark im kalten Traffic.",
            "Retargeting-Frequenz steigt über 7 in einigen Anzeigengruppen.",
          ],
          senseiInsight:
            "Launch läuft solide, aber mit leicht erhöhtem CPM. Sensei empfiehlt, Prospecting-Audiences aufzubrechen und günstigere Broad-Tests einzubauen.",
        },
        {
          id: "tech_retarg",
          name: "Retargeting Core – Demo & Unboxing",
          objective: "Sales / Retargeting",
          status: "ACTIVE",
          learningPhase: "Stable",
          spend: 9480,
          revenue: 42100,
          roas: 4.4,
          cpm: 10.9,
          ctr: 2.4,
          cpa: 14.9,
          creativeCount: 7,
          alerts: [
            "Retargeting-Kampagne liefert sehr hohen ROAS.",
            "Audience-Size begrenzt – Skalierungsoption primär über mehr Prospecting.",
          ],
          senseiInsight:
            "Sehr starke Retargeting-Performance. Fokus sollte auf dem Füllen des Retargeting-Funnels durch skalierendes Prospecting liegen.",
        },
      ];

    case "beautylux_cosmetics":
      return [
        {
          id: "beauty_creators",
          name: "Creator Evergreen – Skin Transformation",
          objective: "Sales / Creator UGC",
          status: "ACTIVE",
          learningPhase: "Stable",
          spend: 21480,
          revenue: 152900,
          roas: 7.1,
          cpm: 7.4,
          ctr: 3.7,
          cpa: 6.1,
          creativeCount: 22,
          alerts: [
            "Winner-Creatives liefern > 9.0x ROAS.",
            "Einige ältere Ads mit stark sinkendem ROAS sind noch aktiv.",
          ],
          senseiInsight:
            "Top-Performance-Kampagne. Sensei empfiehlt, alte Creatives in dieser Struktur zu archivieren und neue Creator-Routen hinzuzufügen.",
        },
        {
          id: "beauty_ba",
          name: "Brand Awareness – Ingredient Education",
          objective: "Brand Awareness / Education",
          status: "PAUSED",
          learningPhase: "Limited",
          spend: 6840,
          revenue: 22840,
          roas: 3.3,
          cpm: 8.1,
          ctr: 2.3,
          cpa: 11.2,
          creativeCount: 5,
          alerts: [
            "Kampagne bringt Brand-Lift, aber nur indirekt messbaren Umsatz.",
          ],
          senseiInsight:
            "Sinnvoll als temporärer Awareness-Push, insbesondere vor großen Sales-Phasen oder Launches.",
        },
      ];

    case "fitlife_supplements":
      return [
        {
          id: "fit_scale",
          name: "Scale Stack Q4 – Performance",
          objective: "Sales / Scale",
          status: "ACTIVE",
          learningPhase: "Stable",
          spend: 12810,
          revenue: 52440,
          roas: 4.1,
          cpm: 9.3,
          ctr: 2.5,
          cpa: 13.1,
          creativeCount: 11,
          alerts: [
            "Performance solide, aber unter Top-Benchmark.",
            "Mehr Story-basierte UGC-Creatives könnten die CTR weiter erhöhen.",
          ],
          senseiInsight:
            "Sensei empfiehlt, 1–2 zusätzliche UGC-Stories als frische Tests aufzusetzen und gleichzeitig die besten Ads aus der Testing-Kampagne zu übernehmen.",
        },
      ];

    case "homezen_living":
      return [
        {
          id: "home_test",
          name: "Creative Testing – Cozy Home",
          objective: "Sales / Creative Testing",
          status: "TESTING",
          learningPhase: "Learning",
          spend: 6840,
          revenue: 17100,
          roas: 2.5,
          cpm: 10.7,
          ctr: 1.6,
          cpa: 24.5,
          creativeCount: 13,
          alerts: [
            "Mehrere Ads mit ROAS < 1.5x laufen noch mit Budget.",
            "Kein klarer Winner identifiziert – Testzeitraum eventuell zu kurz.",
          ],
          senseiInsight:
            "Sensei empfiehlt, die schlechtesten 30–40 % der Creatives abzuschalten und weitere Variationen des bestlaufenden Before/After-Videos zu testen.",
        },
      ];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Format Helper
// ---------------------------------------------------------------------------

function formatCurrency(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}
