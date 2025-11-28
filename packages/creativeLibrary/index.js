// packages/creativeLibrary/index.js
// Premium Grid Creative Library für SignalOne
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

  if (!useDemo && !AppState.metaConnected) {
    const msg = document.createElement("p");
    msg.textContent =
      "Live-Modus aktiv. Die Creative Library wird echte Creatives anzeigen, sobald die Meta-Anbindung fertig ist. Aktuell kannst du den Demo-Modus nutzen.";
    rootEl.appendChild(msg);
    return;
  }

  // -------------------------------------------------------------
  // Demo-Daten je Brand
  // -------------------------------------------------------------

  const baseCreatives = getCreativesForBrand(brand ? brand.id : null);
  let state = {
    allCreatives: baseCreatives,
    filteredCreatives: baseCreatives,
    searchTerm: "",
    filterType: "all",
    filterStatus: "all",
    sortBy: "spend_desc",
    favorites: new Set(),
  };

  // -------------------------------------------------------------
  // Layout: Header + Filter + Summary + Grid
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
  title.textContent = "Creative Library";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    subtitle.textContent = useDemo
      ? "Demo-Creatives basierend auf deinem Konto – Filter, Suche und KPIs funktionieren wie bei echten Daten."
      : "Live-Modus – hier erscheinen deine echten Creatives, sobald Meta verbunden ist.";
  } else {
    subtitle.textContent =
      "Wähle oben ein Werbekonto, um dessen Creative Library zu sehen.";
  }

  header.appendChild(statusChip);
  header.appendChild(title);
  header.appendChild(subtitle);

  // Filter-Row
  const filters = document.createElement("div");
  filters.className = "creative-filters";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder = "Nach Creative, Hook, Tag oder Creator suchen…";

  const typeSelect = document.createElement("select");
  [
    { value: "all", label: "Alle Formate" },
    { value: "ugc", label: "UGC" },
    { value: "static", label: "Static" },
    { value: "carousel", label: "Carousel" },
    { value: "story", label: "Story / Vertical" },
    { value: "other", label: "Sonstige" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    typeSelect.appendChild(o);
  });

  const statusSelect = document.createElement("select");
  [
    { value: "all", label: "Alle Status" },
    { value: "winner", label: "Winner" },
    { value: "testing", label: "Testing" },
    { value: "loser", label: "Loser" },
    { value: "evergreen", label: "Evergreen" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    statusSelect.appendChild(o);
  });

  const sortSelect = document.createElement("select");
  [
    { value: "spend_desc", label: "Sortieren: Spend (absteigend)" },
    { value: "spend_asc", label: "Spend (aufsteigend)" },
    { value: "roas_desc", label: "ROAS (absteigend)" },
    { value: "roas_asc", label: "ROAS (aufsteigend)" },
    { value: "ctr_desc", label: "CTR (absteigend)" },
    { value: "ctr_asc", label: "CTR (aufsteigend)" },
    { value: "cpm_asc", label: "CPM (aufsteigend)" },
    { value: "cpm_desc", label: "CPM (absteigend)" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    sortSelect.appendChild(o);
  });

  filters.appendChild(searchInput);
  filters.appendChild(typeSelect);
  filters.appendChild(statusSelect);
  filters.appendChild(sortSelect);

  // Summary
  const summary = document.createElement("p");
  summary.style.margin = "0 0 10px";
  summary.style.fontSize = "0.85rem";
  summary.style.color = "var(--color-text-muted)";

  // Grid
  const list = document.createElement("div");
  list.className = "creative-list";

  rootEl.appendChild(header);
  rootEl.appendChild(filters);
  rootEl.appendChild(summary);
  rootEl.appendChild(list);

  // -------------------------------------------------------------
  // Interaktion / State-Management
  // -------------------------------------------------------------

  function applyFiltersAndSort() {
    const term = state.searchTerm.trim().toLowerCase();
    const type = state.filterType;
    const status = state.filterStatus;
    const sort = state.sortBy;

    let arr = [...state.allCreatives];

    if (term) {
      arr = arr.filter((c) => {
        const haystack =
          `${c.name} ${c.hook} ${c.creator} ${c.platform} ${c.tags.join(
            " "
          )}`.toLowerCase();
        return haystack.includes(term);
      });
    }

    if (type !== "all") {
      arr = arr.filter((c) => c.type === type);
    }

    if (status !== "all") {
      arr = arr.filter((c) => c.status === status);
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
        case "ctr_desc":
          return b.ctr - a.ctr;
        case "ctr_asc":
          return a.ctr - b.ctr;
        case "cpm_asc":
          return a.cpm - b.cpm;
        case "cpm_desc":
          return b.cpm - a.cpm;
        default:
          return 0;
      }
    });

    state.filteredCreatives = arr;
  }

  function renderSummary() {
    const total = state.allCreatives.length;
    const filtered = state.filteredCreatives.length;
    const demoLabel = useDemo ? "Demo-Datensatz" : "Live-Daten (demnächst)";
    if (filtered === total) {
      summary.textContent = `${filtered} Creatives im ${demoLabel} für dieses Konto.`;
    } else {
      summary.textContent = `${filtered} von ${total} Creatives nach Filterung im ${demoLabel}.`;
    }
  }

  function renderGrid() {
    list.innerHTML = "";

    if (!state.filteredCreatives.length) {
      const empty = document.createElement("p");
      empty.style.marginTop = "8px";
      empty.style.fontSize = "0.9rem";
      empty.style.color = "var(--color-text-muted)";
      empty.textContent =
        "Keine Creatives entsprechen den aktuellen Filtern. Passe die Suche oder Filter an.";
      list.appendChild(empty);
      return;
    }

    state.filteredCreatives.forEach((c) => {
      const card = document.createElement("article");
      card.className = "creative-card";

      // Titel + Favourite
      const topRow = document.createElement("div");
      topRow.style.display = "flex";
      topRow.style.justifyContent = "space-between";
      topRow.style.alignItems = "center";
      const titleEl = document.createElement("strong");
      titleEl.textContent = c.name;
      const favBtn = document.createElement("button");
      favBtn.type = "button";
      favBtn.style.fontSize = "0.8rem";
      favBtn.style.padding = "4px 8px";
      favBtn.style.minWidth = "60px";
      updateFavoriteButton(favBtn, c.id);

      favBtn.addEventListener("click", () => {
        toggleFavorite(c.id);
        updateFavoriteButton(favBtn, c.id);
      });

      topRow.appendChild(titleEl);
      topRow.appendChild(favBtn);
      card.appendChild(topRow);

      // Meta
      const meta = document.createElement("div");
      meta.className = "creative-meta";
      meta.textContent = `${c.platform} • ${c.format} • ${c.length}s • ${c.creator}`;
      card.appendChild(meta);

      // Tags
      const tagRow = document.createElement("div");
      tagRow.className = "creative-tags";
      c.tags.forEach((t) => {
        const span = document.createElement("span");
        span.style.fontSize = "0.75rem";
        span.style.padding = "2px 7px";
        span.style.borderRadius = "999px";
        span.style.border = "1px solid var(--color-border-subtle)";
        span.style.backgroundColor = "var(--color-surface-muted)";
        span.textContent = t;
        tagRow.appendChild(span);
      });
      card.appendChild(tagRow);

      // KPIs
      const kpiGrid = document.createElement("div");
      kpiGrid.className = "creative-kpis";

      const kpiItems = [
        { label: "ROAS", value: `${c.roas.toFixed(1)}x` },
        { label: "CTR", value: `${c.ctr.toFixed(2)} %` },
        { label: "CPM", value: formatCurrency(c.cpm) },
        { label: "Spend 30d", value: formatCurrency(c.spend) },
        { label: "Clicks", value: formatNumber(c.clicks) },
        { label: "Sales", value: formatNumber(c.sales) },
      ];

      kpiItems.forEach((k) => {
        const wrap = document.createElement("div");
        const label = document.createElement("span");
        label.style.display = "block";
        label.style.fontSize = "0.75rem";
        label.style.color = "var(--color-text-soft)";
        label.textContent = k.label;
        const value = document.createElement("strong");
        value.textContent = k.value;
        wrap.appendChild(label);
        wrap.appendChild(value);
        kpiGrid.appendChild(wrap);
      });

      card.appendChild(kpiGrid);

      // Actions
      const actions = document.createElement("div");
      actions.className = "creative-actions";

      const btnDetails = document.createElement("button");
      btnDetails.type = "button";
      btnDetails.textContent = "Details";
      btnDetails.addEventListener("click", () => openDetails(c));

      const btnJump = document.createElement("button");
      btnJump.type = "button";
      btnJump.textContent = "Zur Kampagne";
      btnJump.addEventListener("click", () => jumpToCampaign(c));

      actions.appendChild(btnDetails);
      actions.appendChild(btnJump);

      card.appendChild(actions);

      list.appendChild(card);
    });
  }

  function updateFavoriteButton(btn, id) {
    const isFav = state.favorites.has(id);
    btn.textContent = isFav ? "★ Favorit" : "☆ Favorit";
  }

  function toggleFavorite(id) {
    if (state.favorites.has(id)) {
      state.favorites.delete(id);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast("Favorit entfernt.", "success");
      }
    } else {
      state.favorites.add(id);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast("Creative als Favorit markiert.", "success");
      }
    }
  }

  function openDetails(c) {
    if (!window.SignalOne || !window.SignalOne.openSystemModal) return;

    const body = `
      <p><strong>${c.name}</strong></p>
      <p style="font-size:0.9rem;color:#6b7280;margin-top:4px;">
        ${c.platform} • ${c.format} • ${c.length}s • ${c.creator}
      </p>
      <p style="margin-top:10px;font-size:0.9rem;">${c.description}</p>
      <div style="margin-top:12px;font-size:0.85rem;">
        <strong>KPIs (30 Tage)</strong>
        <ul style="margin-top:6px;padding-left:18px;">
          <li>ROAS: ${c.roas.toFixed(1)}x</li>
          <li>CTR: ${c.ctr.toFixed(2)} %</li>
          <li>CPM: ${formatCurrency(c.cpm)}</li>
          <li>Spend: ${formatCurrency(c.spend)}</li>
          <li>Clicks: ${formatNumber(c.clicks)}</li>
          <li>Sales: ${formatNumber(c.sales)}</li>
        </ul>
      </div>
      <div style="margin-top:12px;font-size:0.85rem;color:#6b7280;">
        <strong>Sensei-Einschätzung:</strong><br />
        ${c.insight}
      </div>
    `;
    window.SignalOne.openSystemModal("Creative Details", body);
  }

  function jumpToCampaign(c) {
    if (!window.SignalOne || !window.SignalOne.navigateTo) return;
    // Demo-Verhalten: Einfacher Hinweis + Navigation zum Campaigns Modul
    window.SignalOne.showToast(
      `Wechsle zur Kampagnen-Übersicht für Creatives wie "${c.name}".`,
      "success"
    );
    window.SignalOne.navigateTo("campaigns");
  }

  // Event Wiring
  searchInput.addEventListener("input", () => {
    state.searchTerm = searchInput.value || "";
    applyFiltersAndSort();
    renderSummary();
    renderGrid();
  });

  typeSelect.addEventListener("change", () => {
    state.filterType = typeSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderGrid();
  });

  statusSelect.addEventListener("change", () => {
    state.filterStatus = statusSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderGrid();
  });

  sortSelect.addEventListener("change", () => {
    state.sortBy = sortSelect.value;
    applyFiltersAndSort();
    renderSummary();
    renderGrid();
  });

  // Initial render
  applyFiltersAndSort();
  renderSummary();
  renderGrid();
}

// ---------------------------------------------------------------------------
// DEMO DATA GENERATOR – je Brand eigene Creatives
// ---------------------------------------------------------------------------

function getCreativesForBrand(brandId) {
  switch (brandId) {
    case "acme_fashion":
      return [
        {
          id: "acme_creative_ugc_fasttryon",
          name: 'UGC – "Outfit in 10 Sekunden"',
          type: "ugc",
          platform: "Meta (Feed + Reels)",
          format: "9:16 Vertical",
          length: 24,
          creator: "Lena • Fashion Creator",
          tags: ["Winner", "UGC", "Hook: Fast Try-On"],
          status: "winner",
          spend: 12890,
          roas: 6.2,
          ctr: 3.4,
          cpm: 7.8,
          clicks: 42130,
          sales: 2380,
          description:
            "Schneller Outfit-Wechsel mit Split-Screen: vorher / nachher, kombiniert mit einem simplen CTA am Ende.",
          insight:
            "Sehr starke Hook in den ersten 3 Sekunden, klares Versprechen und hoher Social-Proof. Sensei empfiehlt, weitere Varianten mit anderen Outfits und Creators zu testen.",
          hook: "Fast Try-On",
        },
        {
          id: "acme_creative_static_lookbook",
          name: "Static – Herbst Lookbook",
          type: "static",
          platform: "Meta (Feed)",
          format: "4:5 Portrait",
          length: 0,
          creator: "Brand Asset",
          tags: ["Evergreen", "Static"],
          status: "evergreen",
          spend: 6210,
          roas: 4.1,
          ctr: 2.1,
          cpm: 8.2,
          clicks: 12890,
          sales: 720,
          description:
            "Statisches Lookbook mit 4 Outfits pro Creative, klare Typografie und dezenter Brand-Fokus.",
          insight:
            "Läuft konstant über mehrere Wochen stabil. Sinnvoll als Evergreen im Structure, aber kein extremer Scale-Winner.",
          hook: "Lookbook Overview",
        },
        {
          id: "acme_creative_ugc_failfix",
          name: "UGC – „Outfit Fail Fix“",
          type: "ugc",
          platform: "Meta (Reels)",
          format: "9:16 Vertical",
          length: 31,
          creator: "Mia • UGC Creator",
          tags: ["Testing", "UGC", "Hook: Relatable Story"],
          status: "testing",
          spend: 3120,
          roas: 3.2,
          ctr: 2.9,
          cpm: 9.1,
          clicks: 9210,
          sales: 410,
          description:
            "Relatable Story: „Ich hatte nichts anzuziehen…“ mit humorvollem Einstieg, dann Produktlösung.",
          insight:
            "Storytelling funktioniert, aber Hook könnte noch schneller auf den Punkt kommen. Weitere Hooks testen (z.B. direkt mit Problem starten).",
          hook: "Relatable Story",
        },
        {
          id: "acme_creative_story_drop",
          name: "Story – „New Drop in 3 Farben“",
          type: "story",
          platform: "Meta (Stories)",
          format: "9:16 Vertical",
          length: 15,
          creator: "Brand Asset",
          tags: ["Testing", "Story", "Drop"],
          status: "testing",
          spend: 1870,
          roas: 2.4,
          ctr: 1.8,
          cpm: 10.5,
          clicks: 4320,
          sales: 160,
          description:
            "Kurzformat für Stories mit einfach animierten Headlines und Fokus auf Verknappung.",
          insight:
            "Story Ads liefern solide Zusatz-Conversions, aber liegen klar hinter dem UGC Winner.",
          hook: "Drop / Scarcity",
        },
      ];

    case "techgadgets_pro":
      return [
        {
          id: "tech_creative_demo",
          name: "Product Demo – 30 Sek. Deep Dive",
          type: "ugc",
          platform: "Meta (Feed + Reels)",
          format: "1:1 / 9:16",
          length: 30,
          creator: "Tom • Tech Reviewer",
          tags: ["Winner", "Demo", "Hook: Problem → Lösung"],
          status: "winner",
          spend: 9420,
          roas: 4.3,
          ctr: 2.1,
          cpm: 12.3,
          clicks: 18450,
          sales: 930,
          description:
            "Klassischer Review-Stil: Problem zeigen, Gerät vorstellen, Features in 3 Bullet Points, klares Offer.",
          insight:
            "Sehr starker Fit für kalte Zielgruppen. Sensei empfiehlt Lookalike-Scaling sowie internationale Duplikate.",
          hook: "Problem → Lösung",
        },
        {
          id: "tech_creative_unboxing",
          name: "Unboxing – Creator Review",
          type: "ugc",
          platform: "Meta (Reels)",
          format: "9:16 Vertical",
          length: 36,
          creator: "Alex • Tech Creator",
          tags: ["UGC", "Unboxing", "Testing"],
          status: "testing",
          spend: 5310,
          roas: 3.1,
          ctr: 1.7,
          cpm: 11.4,
          clicks: 10890,
          sales: 410,
          description:
            "Unboxing mit Live-Reaction, Fokus auf Packaging und ersten Eindruck, danach kurze Feature-Rundtour.",
          insight:
            "Starke Watchtime, aber CTR noch unter Benchmark. Call-to-Action prominenter testen.",
          hook: "Unboxing / First Impression",
        },
        {
          id: "tech_creative_static_specs",
          name: "Static – Specs & Features",
          type: "static",
          platform: "Meta (Feed)",
          format: "1:1 Square",
          length: 0,
          creator: "Brand Asset",
          tags: ["Evergreen", "Static", "Specs"],
          status: "evergreen",
          spend: 2690,
          roas: 3.4,
          ctr: 1.3,
          cpm: 13.0,
          clicks: 4720,
          sales: 210,
          description:
            "Kompakte Spezifikationsgrafik mit Fokus auf 3 Key Features und Pricing.",
          insight:
            "Gut als Retargeting-Layer, aber nicht als Primär-Creative zum Skalieren geeignet.",
          hook: "Feature Callout",
        },
      ];

    case "beautylux_cosmetics":
      return [
        {
          id: "beauty_creative_beforeafter",
          name: "Before/After – Skin Routine",
          type: "ugc",
          platform: "Meta (Feed + Reels)",
          format: "9:16 Vertical",
          length: 28,
          creator: "Sophie • Skinfluencer",
          tags: ["Winner", "UGC", "Hook: Transformation"],
          status: "winner",
          spend: 15870,
          roas: 7.1,
          ctr: 3.9,
          cpm: 7.1,
          clicks: 53420,
          sales: 4120,
          description:
            "Klares Before/After mit Nahaufnahme, dann simplifizierte Routine-Erklärung und Social Proof.",
          insight:
            "Extrem starke Kombination aus starkem Visual und Social-Proof. Sensei empfiehlt: ähnliche Routinen für andere Skin-Concerns.",
          hook: "Transformation",
        },
        {
          id: "beauty_creative_ingredients",
          name: "Static – Ingredient Callout",
          type: "static",
          platform: "Meta (Feed)",
          format: "4:5 Portrait",
          length: 0,
          creator: "Brand Asset",
          tags: ["Evergreen", "Static"],
          status: "evergreen",
          spend: 7640,
          roas: 5.2,
          ctr: 2.8,
          cpm: 8.0,
          clicks: 21230,
          sales: 1180,
          description:
            "Focus auf Inhaltsstoffe mit klarer Erklärung, warum sie wirken – plus dermatologisch getestet.",
          insight:
            "Sehr geeignet für warme Zielgruppen. In kalten Zielgruppen etwas komplex.",
          hook: "Ingredient Education",
        },
      ];

    case "fitlife_supplements":
      return [
        {
          id: "fit_creative_progress",
          name: "UGC – 30 Tage Progress Story",
          type: "ugc",
          platform: "Meta (Reels)",
          format: "9:16 Vertical",
          length: 32,
          creator: "Jonas • Fitness Creator",
          tags: ["Winner", "UGC", "Hook: Journey"],
          status: "winner",
          spend: 9740,
          roas: 4.9,
          ctr: 2.6,
          cpm: 9.5,
          clicks: 25780,
          sales: 1390,
          description:
            "Progress-Fotos mit Voiceover, Training-Ausschnitten und Supplement-Erklärung am Ende.",
          insight:
            "Starker emotionaler Hook mit klarer Product Integration. Sensei empfiehlt Split-Tests mit unterschiedlichen Körpertypen.",
          hook: "Progress Journey",
        },
        {
          id: "fit_creative_coachpov",
          name: "Coach POV – Gym Routine",
          type: "ugc",
          platform: "Meta (Feed + Reels)",
          format: "9:16 Vertical",
          length: 26,
          creator: "Coach Lisa",
          tags: ["Testing", "UGC", "Coach"],
          status: "testing",
          spend: 4130,
          roas: 3.5,
          ctr: 2.2,
          cpm: 8.9,
          clicks: 10840,
          sales: 580,
          description:
            "Schnelle Gym-Tipps mit direktem Bezug zur Supplement-Einnahme.",
          insight:
            "Watchtime ist gut, ROAS solide. CTA noch klarer und Offer aggressiver testen.",
          hook: "Coach POV",
        },
      ];

    case "homezen_living":
      return [
        {
          id: "home_creative_makeover",
          name: "Before/After – Wohnzimmer Makeover",
          type: "ugc",
          platform: "Meta (Feed + Reels)",
          format: "9:16 Vertical",
          length: 29,
          creator: "Anna • Interior Creator",
          tags: ["Winner", "Hook: Raum-Transformation"],
          status: "winner",
          spend: 6820,
          roas: 4.0,
          ctr: 1.9,
          cpm: 10.1,
          clicks: 14890,
          sales: 810,
          description:
            "Zeitraffer-Video von leerem Raum zu Cozy Living mit Fokus auf Kernelemente.",
          insight:
            "Starkes Visual, aber CTR niedriger als in anderen Verticals. Eventuell Intro-Text testen.",
          hook: "Room Transformation",
        },
        {
          id: "home_creative_moodboard",
          name: "Static – Moodboard Cozy Home",
          type: "static",
          platform: "Meta (Feed)",
          format: "4:5 Portrait",
          length: 0,
          creator: "Brand Asset",
          tags: ["Static", "Testing"],
          status: "testing",
          spend: 2940,
          roas: 2.6,
          ctr: 1.3,
          cpm: 11.2,
          clicks: 5230,
          sales: 230,
          description:
            "Moodboard mit mehreren Produktbildern, Fokus auf Stimmung statt Produktdetails.",
          insight:
            "Gut für Inspiration, aber nicht ideal als Performance-Creative. Besser im Retargeting einsetzen.",
          hook: "Mood / Vibe",
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

function formatNumber(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE").format(value);
}
