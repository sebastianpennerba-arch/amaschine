// packages/testingLog/index.js
// SignalOne – Testing Log (P6 / Creative Testing Engine)
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

  // Live-Guard – ohne Demo & ohne Meta → Info
  if (!useDemo && !AppState.metaConnected) {
    const msg = document.createElement("p");
    msg.textContent =
      "Live-Modus aktiv. Der Testing Log wird echte Tests anzeigen, sobald die Meta-Anbindung fertig ist. Aktuell kannst du den Demo-Modus nutzen.";
    rootEl.appendChild(msg);
    return;
  }

  // -------------------------------------------------------------
  // Demo-Testdaten für aktuelle Brand
  // -------------------------------------------------------------

  const allTests = getTestsForBrand(brand ? brand.id : null);
  let state = {
    allTests,
    filteredTests: allTests,
    searchTerm: "",
    filterStatus: "all", // running, completed, paused, planned
    filterType: "all", // creative, hook, audience, landing, offer
    filterTimeframe: "30d", // all, 7d, 30d, 90d
  };

  // -------------------------------------------------------------
  // HEADER (Hero)
  // -------------------------------------------------------------

  const header = document.createElement("div");
  header.className = "dashboard-hero";

  const statusChip = document.createElement("div");
  statusChip.className = "dashboard-hero-status";
  statusChip.textContent = brand
    ? `${brand.name} • Testing Engine`
    : "Kein Werbekonto ausgewählt";

  const title = document.createElement("h2");
  title.className = "dashboard-hero-title";
  title.textContent = "Testing Log";

  const subtitle = document.createElement("p");
  subtitle.className = "dashboard-hero-subtitle";
  if (brand) {
    subtitle.textContent = useDemo
      ? "Alle laufenden, geplanten und abgeschlossenen Tests für dieses Konto – inklusive Hypothesen, KPI-Fokus und Sensei-Bewertung."
      : "Hier werden später deine echten Testing-Routen und Ergebnisse angezeigt, sobald Meta-Daten live angebunden sind.";
  } else {
    subtitle.textContent =
      "Wähle oben ein Werbekonto, um dessen Testing Log zu sehen.";
  }

  header.appendChild(statusChip);
  header.appendChild(title);
  header.appendChild(subtitle);
  rootEl.appendChild(header);

  // -------------------------------------------------------------
  // Filter-Leiste + Export / Guidelines
  // -------------------------------------------------------------

  const filters = document.createElement("div");
  filters.className = "creative-filters";

  const searchInput = document.createElement("input");
  searchInput.type = "search";
  searchInput.placeholder =
    "Nach Test, Kampagne, Hypothese oder KPI suchen…";

  const statusSelect = document.createElement("select");
  [
    { value: "all", label: "Status: Alle" },
    { value: "running", label: "Laufend" },
    { value: "completed", label: "Abgeschlossen" },
    { value: "paused", label: "Pausiert" },
    { value: "planned", label: "Geplant" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    statusSelect.appendChild(o);
  });

  const typeSelect = document.createElement("select");
  [
    { value: "all", label: "Testtyp: Alle" },
    { value: "creative", label: "Creative Test" },
    { value: "hook", label: "Hook Test" },
    { value: "audience", label: "Audience Test" },
    { value: "landing", label: "Landingpage Test" },
    { value: "offer", label: "Offer / Pricing Test" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    typeSelect.appendChild(o);
  });

  const timeframeSelect = document.createElement("select");
  [
    { value: "all", label: "Zeitraum: Alle" },
    { value: "7d", label: "Letzte 7 Tage" },
    { value: "30d", label: "Letzte 30 Tage" },
    { value: "90d", label: "Letzte 90 Tage" },
  ].forEach((opt) => {
    const o = document.createElement("option");
    o.value = opt.value;
    o.textContent = opt.label;
    timeframeSelect.appendChild(o);
  });
  timeframeSelect.value = state.filterTimeframe;

  // Buttons: Export + Guidelines
  const exportButton = document.createElement("button");
  exportButton.type = "button";
  exportButton.textContent = "Testing Log exportieren (CSV)";
  exportButton.style.fontSize = "0.8rem";
  exportButton.style.padding = "6px 10px";

  const guidelinesButton = document.createElement("button");
  guidelinesButton.type = "button";
  guidelinesButton.textContent = "Sensei Testing-Guidelines";
  guidelinesButton.style.fontSize = "0.8rem";
  guidelinesButton.style.padding = "6px 10px";

  filters.appendChild(searchInput);
  filters.appendChild(statusSelect);
  filters.appendChild(typeSelect);
  filters.appendChild(timeframeSelect);
  filters.appendChild(exportButton);
  filters.appendChild(guidelinesButton);

  rootEl.appendChild(filters);

  // -------------------------------------------------------------
  // Summary + kleine KPI-Zeile (optional)
  // -------------------------------------------------------------

  const summary = document.createElement("p");
  summary.style.margin = "0 0 10px";
  summary.style.fontSize = "0.85rem";
  summary.style.color = "var(--color-text-muted)";
  rootEl.appendChild(summary);

  // Mini-KPI-Row
  const kpiRow = document.createElement("div");
  kpiRow.className = "kpi-grid";
  kpiRow.style.marginTop = "4px";
  kpiRow.style.marginBottom = "12px";

  const kpiActive = createMiniKpiCard(
    "Laufende Tests",
    String(state.allTests.filter((t) => t.status === "running").length)
  );
  const kpiCompleted = createMiniKpiCard(
    "Abgeschlossene Tests",
    String(state.allTests.filter((t) => t.status === "completed").length)
  );
  const kpiWinrate = createMiniKpiCard(
    "Winrate",
    calcWinrateLabel(state.allTests)
  );
  const kpiFocus = createMiniKpiCard(
    "Fokus",
    getFocusLabel(state.allTests)
  );

  kpiRow.appendChild(kpiActive);
  kpiRow.appendChild(kpiCompleted);
  kpiRow.appendChild(kpiWinrate);
  kpiRow.appendChild(kpiFocus);

  rootEl.appendChild(kpiRow);

  // -------------------------------------------------------------
  // Tabellen-View für Tests
  // -------------------------------------------------------------

  const tableWrapper = document.createElement("div");
  tableWrapper.className = "test-table";

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");

  [
    "Test",
    "Typ",
    "Kampagne",
    "Status",
    "Zeitraum",
    "KPI-Fokus",
    "Winner",
    "Lift",
    "Details",
  ].forEach((txt) => {
    const th = document.createElement("th");
    th.textContent = txt;
    headerRow.appendChild(th);
  });

  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  tableWrapper.appendChild(table);

  rootEl.appendChild(tableWrapper);

  // -------------------------------------------------------------
  // Logik: Filtern / Zeiträume / Rendern
  // -------------------------------------------------------------

  function applyFilters() {
    const term = state.searchTerm.trim().toLowerCase();
    const fStatus = state.filterStatus;
    const fType = state.filterType;
    const fTime = state.filterTimeframe;

    const now = new Date();
    let arr = [...state.allTests];

    if (term) {
      arr = arr.filter((t) => {
        const haystack = (
          t.name +
          " " +
          t.campaign +
          " " +
          t.primaryKpi +
          " " +
          t.hypothesis +
          " " +
          (t.senseiSummary || "")
        )
          .toLowerCase()
          .trim();
        return haystack.includes(term);
      });
    }

    if (fStatus !== "all") {
      arr = arr.filter((t) => t.status === fStatus);
    }

    if (fType !== "all") {
      arr = arr.filter((t) => t.type === fType);
    }

    if (fTime !== "all") {
      arr = arr.filter((t) => {
        const end = t.endDate ? new Date(t.endDate) : null;
        const start = t.startDate ? new Date(t.startDate) : null;
        const ref = end || start || now;
        const diffDays = Math.abs((now - ref) / (1000 * 60 * 60 * 24));
        if (fTime === "7d") return diffDays <= 7;
        if (fTime === "30d") return diffDays <= 30;
        if (fTime === "90d") return diffDays <= 90;
        return true;
      });
    }

    // Standard: neueste Tests oben (Startdatum)
    arr.sort((a, b) => {
      const da = a.startDate ? new Date(a.startDate) : new Date(0);
      const db = b.startDate ? new Date(b.startDate) : new Date(0);
      return db - da;
    });

    state.filteredTests = arr;
  }

  function renderSummary() {
    const total = state.allTests.length;
    const filtered = state.filteredTests.length;
    const demoLabel = useDemo ? "Demo-Testing-Log" : "Live-Testing-Log (demnächst)";

    if (filtered === total) {
      summary.textContent = `${filtered} Tests im ${demoLabel} für dieses Konto erfasst.`;
    } else {
      summary.textContent = `${filtered} von ${total} Tests im ${demoLabel} nach Filterung.`;
    }
  }

  function renderKpis() {
    kpiActive.querySelector("div:nth-child(2)").textContent = String(
      state.allTests.filter((t) => t.status === "running").length
    );
    kpiCompleted.querySelector("div:nth-child(2)").textContent = String(
      state.allTests.filter((t) => t.status === "completed").length
    );
    kpiWinrate.querySelector("div:nth-child(2)").textContent =
      calcWinrateLabel(state.allTests);
    kpiFocus.querySelector("div:nth-child(2)").textContent =
      getFocusLabel(state.allTests);
  }

  function renderTable() {
    tbody.innerHTML = "";

    if (!state.filteredTests.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 9;
      td.textContent =
        "Keine Tests entsprechen den aktuellen Filtern. Passe Suche oder Filter an.";
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    state.filteredTests.forEach((t) => {
      const tr = document.createElement("tr");

      // Test-Name + Hypothese
      const tdName = document.createElement("td");
      const nameEl = document.createElement("div");
      nameEl.style.fontWeight = "600";
      nameEl.style.fontSize = "0.9rem";
      nameEl.textContent = t.name;
      const hypoEl = document.createElement("div");
      hypoEl.style.fontSize = "0.78rem";
      hypoEl.style.color = "var(--color-text-soft)";
      hypoEl.textContent = t.hypothesis;
      tdName.appendChild(nameEl);
      tdName.appendChild(hypoEl);
      tr.appendChild(tdName);

      // Typ
      const tdType = document.createElement("td");
      tdType.textContent = formatTestTypeLabel(t.type);
      tr.appendChild(tdType);

      // Kampagne
      const tdCampaign = document.createElement("td");
      tdCampaign.textContent = t.campaign;
      tr.appendChild(tdCampaign);

      // Status
      const tdStatus = document.createElement("td");
      const statusBadge = document.createElement("span");
      statusBadge.className = "badge";
      if (t.status === "running") {
        statusBadge.classList.add("badge-warning");
        statusBadge.textContent = "Laufend";
      } else if (t.status === "completed") {
        statusBadge.classList.add("badge-success", "badge-online");
        statusBadge.textContent = "Abgeschlossen";
      } else if (t.status === "paused") {
        statusBadge.classList.add("badge-offline");
        statusBadge.textContent = "Pausiert";
      } else {
        statusBadge.classList.add("badge-warning");
        statusBadge.textContent = "Geplant";
      }
      tdStatus.appendChild(statusBadge);
      tr.appendChild(tdStatus);

      // Zeitraum
      const tdRange = document.createElement("td");
      tdRange.textContent = formatRange(t.startDate, t.endDate);
      tr.appendChild(tdRange);

      // KPI-Fokus
      const tdKpi = document.createElement("td");
      tdKpi.textContent = t.primaryKpi;
      tr.appendChild(tdKpi);

      // Winner
      const tdWinner = document.createElement("td");
      tdWinner.textContent = t.winnerLabel || "-";
      tr.appendChild(tdWinner);

      // Lift
      const tdLift = document.createElement("td");
      tdLift.textContent = t.liftLabel || "-";
      tr.appendChild(tdLift);

      // Details Button
      const tdDetails = document.createElement("td");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Details";
      btn.style.fontSize = "0.8rem";
      btn.style.padding = "4px 10px";
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetails(t);
      });
      tdDetails.appendChild(btn);
      tr.appendChild(tdDetails);

      // Klick auf Zeile → ebenfalls Details
      tr.addEventListener("click", () => openDetails(t));

      tbody.appendChild(tr);
    });
  }

  // -------------------------------------------------------------
  // Details-Modal
  // -------------------------------------------------------------

  function openDetails(test) {
    if (!window.SignalOne || !window.SignalOne.openSystemModal) return;

    const variantsHtml = (test.variants || [])
      .map(
        (v) =>
          `<li><strong>${v.label}</strong>: ${v.description || ""} ${
            v.kpi
              ? `<span style="color:#6b7280;">(ROAS ${v.kpi.roas.toFixed(
                  1
                )}x • CTR ${v.kpi.ctr.toFixed(2)} % • CPM ${formatCurrency(
                  v.kpi.cpm
                )})</span>`
              : ""
          }</li>`
      )
      .join("");

    const body = `
      <p><strong>${test.name}</strong></p>
      <p style="font-size:0.9rem;color:#6b7280;margin-top:4px;">
        Typ: ${formatTestTypeLabel(test.type)} • Kampagne: ${
      test.campaign
    } • Status: ${formatStatusLabel(
      test.status
    )}<br/>Zeitraum: ${formatRange(test.startDate, test.endDate)}
      </p>

      <div style="margin-top:10px;font-size:0.9rem;">
        <strong>Hypothese</strong>
        <p style="margin-top:4px;">${test.hypothesis}</p>
      </div>

      <div style="margin-top:10px;font-size:0.9rem;">
        <strong>Setup & Varianten</strong>
        <ul style="margin-top:6px;padding-left:18px;">
          ${variantsHtml}
        </ul>
      </div>

      <div style="margin-top:10px;font-size:0.9rem;">
        <strong>Ergebnis</strong>
        <p style="margin-top:4px;">
          KPI-Fokus: ${test.primaryKpi}<br/>
          Winner: ${test.winnerLabel || "-"}<br/>
          Lift: ${test.liftLabel || "-"}
        </p>
      </div>

      <div style="margin-top:10px;font-size:0.9rem;">
        <strong>Sensei Bewertung</strong>
        <p style="margin-top:4px;">${test.senseiSummary}</p>
      </div>

      <div style="margin-top:10px;font-size:0.85rem;color:#6b7280;">
        Hinweis: Diese Test-Logs sind ${
          useDemo ? "Demo-Daten" : "Preview-Daten"
        }, die 1:1 so funktionieren, wie später deine echten Meta-Testing-Daten.
      </div>
    `;

    window.SignalOne.openSystemModal("Test-Details", body);
  }

  // -------------------------------------------------------------
  // Export & Guidelines
  // -------------------------------------------------------------

  exportButton.addEventListener("click", () => {
    try {
      exportCsv(state.filteredTests, brand);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast("Testing Log als CSV exportiert.", "success");
      }
    } catch (err) {
      console.error("Export-Fehler:", err);
      if (window.SignalOne && window.SignalOne.showToast) {
        window.SignalOne.showToast(
          "Export aktuell nicht möglich (Demo-Limit).",
          "error"
        );
      }
    }
  });

  guidelinesButton.addEventListener("click", () => {
    if (!window.SignalOne || !window.SignalOne.openSystemModal) return;

    const body = `
      <p><strong>Sensei Testing-Guidelines</strong></p>
      <ul style="margin-top:6px;padding-left:18px;font-size:0.9rem;">
        <li>Pro Test eine klare Hypothese und nur <strong>eine</strong> Haupt-KPI definieren.</li>
        <li>Tests sollten innerhalb von 7–14 Tagen auswertbar sein (genug Spend & Conversions).</li>
        <li>„Winner“ konsequent in deine Scale-Kampagnen übernehmen.</li>
        <li>„Loser“ aggressiv pausieren, um Budget zu fokussieren.</li>
        <li>Testing-Log wöchentlich reviewen – was funktioniert entlang Hooks, Formaten & Creators?</li>
      </ul>
      <p style="margin-top:8px;font-size:0.85rem;color:#6b7280;">
        In der Live-Version wird Sensei dir automatisch neue Testideen liefern, basierend auf Hook-, Creator- und Kampagnen-Performance.
      </p>
    `;
    window.SignalOne.openSystemModal("Sensei Testing-Guidelines", body);
  });

  // -------------------------------------------------------------
  // Events: Filter-Controls
  // -------------------------------------------------------------

  searchInput.addEventListener("input", () => {
    state.searchTerm = searchInput.value || "";
    applyFilters();
    renderSummary();
    renderTable();
  });

  statusSelect.addEventListener("change", () => {
    state.filterStatus = statusSelect.value;
    applyFilters();
    renderSummary();
    renderTable();
  });

  typeSelect.addEventListener("change", () => {
    state.filterType = typeSelect.value;
    applyFilters();
    renderSummary();
    renderTable();
  });

  timeframeSelect.addEventListener("change", () => {
    state.filterTimeframe = timeframeSelect.value;
    applyFilters();
    renderSummary();
    renderTable();
    if (window.SignalOne && window.SignalOne.showToast) {
      window.SignalOne.showToast(
        `Testing Log für ${formatTimeframeLabel(
          state.filterTimeframe
        )} aktualisiert.`,
        "success"
      );
    }
  });

  // Initial
  applyFilters();
  renderSummary();
  renderKpis();
  renderTable();
}

// ---------------------------------------------------------------------------
// Demo-Tests je Brand
// ---------------------------------------------------------------------------

function getTestsForBrand(brandId) {
  switch (brandId) {
    case "acme_fashion":
      return [
        {
          id: "acme_test_ugc_vs_static",
          name: "UGC vs Static – Evergreen Test",
          type: "creative",
          campaign: "UGC Scale – Evergreen",
          status: "running",
          startDate: "2025-10-10",
          endDate: null,
          primaryKpi: "ROAS",
          winnerLabel: "UGC Variant B (Fast Try-On)",
          liftLabel: "+28 % ROAS",
          hypothesis:
            "UGC-Videos mit schnellem Outfit-Wechsel schlagen statische Lookbook-Creatives im ROAS.",
          variants: [
            {
              label: "Variante A – Static Lookbook",
              description: "Statisches Herbst-Lookbook mit 4 Outfits.",
              kpi: { roas: 3.8, ctr: 2.0, cpm: 8.0 },
            },
            {
              label: "Variante B – UGC Fast Try-On",
              description:
                "Creator zeigt 3 Outfits in 10 Sekunden mit direktem CTA.",
              kpi: { roas: 4.9, ctr: 3.3, cpm: 7.4 },
            },
          ],
          senseiSummary:
            "Variante B performt deutlich besser bei ROAS und CTR. Sensei empfiehlt, diese Creative-Linie in die Haupt-Scale-Kampagne zu übertragen.",
        },
        {
          id: "acme_test_hook_opening",
          name: "Hook Opening – 3 Sekunden Battle",
          type: "hook",
          campaign: "Hook Battle Q4 – UGC Testing",
          status: "completed",
          startDate: "2025-09-18",
          endDate: "2025-10-02",
          primaryKpi: "CTR",
          winnerLabel: "Hook C – „Du machst diesen Fehler…“",
          liftLabel: "+35 % CTR",
          hypothesis:
            "Hooks, die direkt ein Fehlverhalten adressieren, ziehen mehr Aufmerksamkeit als generische Outfit-Hooks.",
          variants: [
            {
              label: "Hook A",
              description: "„3 Outfits für deinen Herbst…“",
              kpi: { roas: 3.2, ctr: 2.1, cpm: 8.6 },
            },
            {
              label: "Hook B",
              description: "„Welches Outfit passt zu dir?“",
              kpi: { roas: 3.4, ctr: 2.3, cpm: 8.9 },
            },
            {
              label: "Hook C",
              description: "„Du machst diesen Outfit-Fehler jeden Tag…“",
              kpi: { roas: 4.1, ctr: 3.2, cpm: 8.1 },
            },
          ],
          senseiSummary:
            "Hook C bestätigt die Hypothese klar. Für kommende Creatives sollten mehr „Error/Fail“-Hooks getestet werden.",
        },
        {
          id: "acme_test_story_vs_feed",
          name: "Story vs Feed – Placement Test",
          type: "creative",
          campaign: "Story – New Drop",
          status: "paused",
          startDate: "2025-09-01",
          endDate: "2025-09-20",
          primaryKpi: "CPA",
          winnerLabel: "Feed-only Variante",
          liftLabel: "-18 % CPA",
          hypothesis:
            "Story-only Placements liefern günstigere Conversions als Feed-Platzierungen.",
          variants: [
            {
              label: "Variante A – Story only",
              description: "Nur Story-Platzierungen mit 15s Creative.",
              kpi: { roas: 2.4, ctr: 1.9, cpm: 10.8 },
            },
            {
              label: "Variante B – Feed only",
              description: "Feed-Placement mit angepasstem 4:5 Creative.",
              kpi: { roas: 3.0, ctr: 2.2, cpm: 9.4 },
            },
          ],
          senseiSummary:
            "Hypothese wurde widerlegt. Feed-Platzierungen liefern aktuell bessere CPA. Story-Creatives sollten optimiert oder neu gedacht werden.",
        },
      ];

    case "techgadgets_pro":
      return [
        {
          id: "tech_test_demo_vs_unboxing",
          name: "Demo vs Unboxing – Prospecting",
          type: "creative",
          campaign: "Launch Funnel EU – Conversion",
          status: "running",
          startDate: "2025-10-05",
          endDate: null,
          primaryKpi: "ROAS",
          winnerLabel: "Product Demo",
          liftLabel: "+22 % ROAS",
          hypothesis:
            "Detaillierte Produkt-Demos performen im kalten Traffic besser als Unboxing-Videos.",
          variants: [
            {
              label: "Variante A – Unboxing",
              description: "Unboxing Fokus auf Packaging & Ersteindruck.",
              kpi: { roas: 3.1, ctr: 1.7, cpm: 11.6 },
            },
            {
              label: "Variante B – Demo",
              description: "30s Demo mit klaren Problem → Lösung Sequenzen.",
              kpi: { roas: 3.8, ctr: 2.1, cpm: 11.3 },
            },
          ],
          senseiSummary:
            "Product Demo bestätigt sich als stärkerer Prospecting-Creative. Unboxing eher im Warm-Traffic nutzen.",
        },
        {
          id: "tech_test_offer_pricing",
          name: "Offer Test – Bundle vs Einzelkauf",
          type: "offer",
          campaign: "Retargeting Core – Demo & Unboxing",
          status: "completed",
          startDate: "2025-09-10",
          endDate: "2025-09-24",
          primaryKpi: "AOV / ROAS",
          winnerLabel: "Bundle-Offer",
          liftLabel: "+19 % AOV",
          hypothesis:
            "Bundles mit leichtem Discount führen zu höherem AOV ohne ROAS-Verlust.",
          variants: [
            {
              label: "Variante A – Einzelkauf",
              description: "Standard-Preis, ein Produkt.",
              kpi: { roas: 4.3, ctr: 2.4, cpm: 11.0 },
            },
            {
              label: "Variante B – Bundle",
              description: "Bundle-Angebot (Gerät + Zubehör) mit Rabatt.",
              kpi: { roas: 4.4, ctr: 2.5, cpm: 11.2 },
            },
          ],
          senseiSummary:
            "Bundle-Offer steigert den AOV spürbar ohne ROAS-Einbußen. Dauerhaft als Retargeting-Offer etablieren.",
        },
      ];

    case "beautylux_cosmetics":
      return [
        {
          id: "beauty_test_beforeafter_formats",
          name: "Before/After – Format-Test",
          type: "creative",
          campaign: "Creator Evergreen – Skin Transformation",
          status: "running",
          startDate: "2025-10-08",
          endDate: null,
          primaryKpi: "ROAS",
          winnerLabel: "9:16 Vertical",
          liftLabel: "+26 % ROAS",
          hypothesis:
            "Vertical Before/After-Videos performen besser als 1:1 oder 4:5 Varianten.",
          variants: [
            {
              label: "Variante A – 1:1 Square",
              description: "Square-Format für Feed.",
              kpi: { roas: 5.9, ctr: 3.1, cpm: 7.7 },
            },
            {
              label: "Variante B – 9:16 Vertical",
              description: "Volles Vertical für Reels & Stories.",
              kpi: { roas: 7.4, ctr: 3.9, cpm: 7.2 },
            },
          ],
          senseiSummary:
            "Vertical-Format bestätigt sich als klarer Winner. Sensei empfiehlt, mehr Verticals für andere Creatives zu produzieren.",
        },
      ];

    case "fitlife_supplements":
      return [
        {
          id: "fit_test_progress_vs_coach",
          name: "Progress vs Coach POV",
          type: "creative",
          campaign: "Scale Stack Q4 – Performance",
          status: "completed",
          startDate: "2025-09-15",
          endDate: "2025-09-29",
          primaryKpi: "ROAS",
          winnerLabel: "Progress-Story",
          liftLabel: "+31 % ROAS",
          hypothesis:
            "Persönliche Progress-Stories performen besser als Coach-POV-Ads.",
          variants: [
            {
              label: "Variante A – Progress Story",
              description: "30 Tage Transformation mit Vorher/Nachher.",
              kpi: { roas: 5.0, ctr: 2.7, cpm: 9.4 },
            },
            {
              label: "Variante B – Coach POV",
              description: "Gym-Routine & Tipps, Coach spricht direkt.",
              kpi: { roas: 3.8, ctr: 2.1, cpm: 9.0 },
            },
          ],
          senseiSummary:
            "Progress-Stories sind klar überlegen. Coach-POV weiter nutzen, aber eher im Mittelfunnel.",
        },
      ];

    case "homezen_living":
      return [
        {
          id: "home_test_makeover_vs_mood",
          name: "Makeover vs Moodboard",
          type: "creative",
          campaign: "Creative Testing – Cozy Home",
          status: "running",
          startDate: "2025-10-03",
          endDate: null,
          primaryKpi: "ROAS",
          winnerLabel: "Makeover-Video",
          liftLabel: "+42 % ROAS",
          hypothesis:
            "Dynamische Makeover-Videos schlagen statische Moodboards im ROAS.",
          variants: [
            {
              label: "Variante A – Moodboard",
              description: "Static Moodboard mit mehreren Interior-Bildern.",
              kpi: { roas: 2.4, ctr: 1.4, cpm: 11.1 },
            },
            {
              label: "Variante B – Makeover",
              description: "Vorher/Nachher Wohnzimmer-Makeover.",
              kpi: { roas: 3.4, ctr: 1.9, cpm: 10.2 },
            },
          ],
          senseiSummary:
            "Makeover-Video performt deutlich besser. Moodboards eher als unterstützende Inspiration nutzen, nicht als primäre Performance-Creatives.",
        },
      ];

    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers – KPIs & Labels & Export
// ---------------------------------------------------------------------------

function createMiniKpiCard(label, value) {
  const card = document.createElement("div");
  card.className = "kpi-card";
  const l = document.createElement("strong");
  l.textContent = label;
  const v = document.createElement("div");
  v.textContent = value;
  card.appendChild(l);
  card.appendChild(v);
  return card;
}

function calcWinrateLabel(tests) {
  if (!tests || !tests.length) return "–";
  const completed = tests.filter((t) => t.status === "completed");
  if (!completed.length) return "–";
  // naive Winrate: Anteil Tests mit positivem Lift
  const winners = completed.filter((t) => {
    if (!t.liftLabel) return false;
    return t.liftLabel.trim().startsWith("+");
  });
  const rate = (winners.length / completed.length) * 100;
  return `${rate.toFixed(0)} %`;
}

function getFocusLabel(tests) {
  if (!tests || !tests.length) return "–";
  const counts = {};
  tests.forEach((t) => {
    counts[t.type] = (counts[t.type] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const top = entries[0];
  return top ? formatTestTypeLabel(top[0]) : "–";
}

function formatRange(start, end) {
  if (!start && !end) return "–";
  const s = start ? formatDate(start) : "?";
  const e = end ? formatDate(end) : "laufend";
  return `${s} – ${e}`;
}

function formatDate(str) {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

function formatTestTypeLabel(type) {
  switch (type) {
    case "creative":
      return "Creative Test";
    case "hook":
      return "Hook Test";
    case "audience":
      return "Audience Test";
    case "landing":
      return "Landingpage Test";
    case "offer":
      return "Offer / Pricing Test";
    default:
      return type || "–";
  }
}

function formatStatusLabel(status) {
  switch (status) {
    case "running":
      return "Laufend";
    case "completed":
      return "Abgeschlossen";
    case "paused":
      return "Pausiert";
    case "planned":
      return "Geplant";
    default:
      return status || "–";
  }
}

function formatTimeframeLabel(tf) {
  switch (tf) {
    case "7d":
      return "letzte 7 Tage";
    case "30d":
      return "letzte 30 Tage";
    case "90d":
      return "letzte 90 Tage";
    default:
      return "alle Zeiträume";
  }
}

function formatCurrency(value) {
  if (!value || isNaN(value)) value = 0;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function exportCsv(tests, brand) {
  const rows = [];
  rows.push([
    "Test-ID",
    "Name",
    "Typ",
    "Kampagne",
    "Status",
    "Startdatum",
    "Enddatum",
    "KPI-Fokus",
    "Winner",
    "Lift",
    "Hypothese",
  ]);

  (tests || []).forEach((t) => {
    rows.push([
      t.id || "",
      t.name || "",
      formatTestTypeLabel(t.type || ""),
      t.campaign || "",
      formatStatusLabel(t.status || ""),
      t.startDate || "",
      t.endDate || "",
      t.primaryKpi || "",
      t.winnerLabel || "",
      t.liftLabel || "",
      (t.hypothesis || "").replace(/\r?\n/g, " "),
    ]);
  });

  const csv = rows
    .map((r) =>
      r
        .map((field) => {
          const f = String(field || "");
          if (f.includes(";") || f.includes('"') || f.includes("\n")) {
            return `"${f.replace(/"/g, '""')}"`;
          }
          return f;
        })
        .join(";")
    )
    .join("\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const brandName = brand && brand.name ? brand.name.replace(/\s+/g, "_") : "brand";
  link.href = url;
  link.download = `signalone-testing-log-${brandName}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
