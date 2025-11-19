// ======================================================
// CONFIG
// ======================================================
const CFG = {
    // HIER deine Google-Sheet-ID einsetzen:
    // Beispiel: https://docs.google.com/spreadsheets/d/DEINE_ID/edit
    sheetId: "1f4KqwWAs6NeVHHtRg-RfClj7NaD3chal9atfaEoL2DM",
    period: 1, // 1 = letzte 24h, 7 = letzte 7 Tage
};

let ROWS = [];
let KPI = null;
let CREATIVES = [];
let FILTER = "all";

// Format-Helfer
const fmt = {
    num: (v, d = 0) =>
        new Intl.NumberFormat("de-DE", {
            minimumFractionDigits: d,
            maximumFractionDigits: d,
        }).format(v || 0),
    curr: (v, d = 2) =>
        new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
            minimumFractionDigits: d,
            maximumFractionDigits: d,
        }).format(v || 0),
    pct: (v, d = 2) => fmt.num(v, d) + " %",
};

// ======================================================
// GOOGLE SHEET LADEN (TAB: DashboardData)
// ======================================================
async function loadSheetData() {
    console.log("Lade Sheet-Daten…");

    // Wir zielen explizit auf den Tab "DashboardData"
    const url = `https://docs.google.com/spreadsheets/d/${CFG.sheetId}/gviz/tq?tqx=out:json&sheet=DashboardData`;

    const res = await fetch(url, { cache: "no-store" });
    const text = await res.text();

    // Google liefert JSON in einer komischen Hülle → wir schneiden sie ab
    const json = JSON.parse(text.substring(text.indexOf("{"), text.lastIndexOf("}") + 1));
    return parseTable(json.table);
}

function parseTable(table) {
    const cols = table.cols.map((c) => c.label);
    const rows = table.rows || [];

    const out = rows
        .map((row) => {
            const cells = row.c || [];
            const obj = {};
            cells.forEach((cell, idx) => {
                const key = cols[idx] || `col_${idx}`;
                obj[key] = cell ? cell.v : null;
            });
            return obj;
        })
        // leere Zeilen raus
        .filter((r) => Object.values(r).some((v) => v !== null && v !== ""));

    console.log("Parsed Rows:", out);
    return out;
}

// ======================================================
// DATEN AUFBEREITEN (KPI + CREATIVES)
// ======================================================
function prepareData() {
    // KPI-Zeile für aktuellen Zeitraum (Period-Spalte)
    KPI =
        ROWS.find(
            (r) =>
                String(r.Type).toLowerCase() === "kpi" &&
                String(r.Period || "1") === String(CFG.period)
        ) ||
        ROWS.find((r) => String(r.Type).toLowerCase() === "kpi") ||
        null;

    if (!KPI) {
        console.warn("Keine KPI-Zeile gefunden – bitte Type='KPI' in DashboardData anlegen.");
    }

    // Creative-Zeilen
    CREATIVES = ROWS.filter(
        (r) =>
            String(r.Type).toLowerCase() === "creative" &&
            (String(r.Period || "1") === String(CFG.period) || !r.Period)
    ).map((r) => {
        const url = r.URL || "";
        const isVideo =
            url.toLowerCase().includes(".mp4") ||
            url.toLowerCase().includes("video");

        return {
            ...r,
            mediaType: isVideo ? "video" : "image",
        };
    });

    console.log("KPI:", KPI);
    console.log("Creatives:", CREATIVES);
}
async function loadMetaData() {
  const user = Clerk.user;
  const token = user.unsafeMetadata.meta_token;

  if (!token) {
    console.log("Kein Meta Token vorhanden");
    return;
  }

  const response = await fetch("/api/meta-insights", {
    method: "POST",
    body: JSON.stringify({
      token: token,
      accountId: "HIER_DEIN_AD_ACCOUNT"
    })
  });

  const metaData = await response.json();

  console.log("Meta Insights:", metaData);
}


// ======================================================
// RENDER: OVERVIEW
// ======================================================
function renderOverview() {
    const el = document.getElementById("overviewGrid");
    if (!el || !KPI) return;

    const metrics = [
        { label: "Impressions", key: "Impressions" },
        { label: "Clicks", key: "Clicks" },
        { label: "AddToCart", key: "AddToCart" },
        { label: "Purchases", key: "Purchases" },
        { label: "Revenue", key: "Revenue", fmt: "curr" },
        { label: "Spend", key: "Spend", fmt: "curr" },
        { label: "ROAS", key: "ROAS", fmt: "num2" },
    ];

    el.innerHTML = metrics
        .map((m) => {
            const raw = Number(KPI[m.key] || 0);
            let valText;

            if (m.fmt === "curr") valText = fmt.curr(raw);
            else if (m.fmt === "num2") valText = fmt.num(raw, 2);
            else valText = fmt.num(raw, 0);

            return `
            <div class="overview-card">
                <div class="metric-label">${m.label}</div>
                <div class="metric-value">${valText}</div>
            </div>`;
        })
        .join("");
}

// ======================================================
// RENDER: FUNNEL
// ======================================================
function renderFunnel() {
    const el = document.getElementById("funnelSteps");
    if (!el || !KPI) return;

    const imp = Number(KPI.Impressions || 0);
    const clicks = Number(KPI.Clicks || 0);
    const atc = Number(KPI.AddToCart || 0);
    const purchases = Number(KPI.Purchases || 0);

    el.innerHTML = `
        <div class="funnel-step">
            <div class="metric-label">Impressions</div>
            <div class="funnel-step-value">${fmt.num(imp, 0)}</div>
        </div>
        <div class="funnel-step">
            <div class="metric-label">Clicks</div>
            <div class="funnel-step-value">${fmt.num(clicks, 0)}</div>
        </div>
        <div class="funnel-step">
            <div class="metric-label">ATCs</div>
            <div class="funnel-step-value">${fmt.num(atc, 0)}</div>
        </div>
        <div class="funnel-step">
            <div class="metric-label">Purchases</div>
            <div class="funnel-step-value">${fmt.num(purchases, 0)}</div>
        </div>
    `;
}

// ======================================================
// RENDER: KPIs
// ======================================================
function renderKPIs() {
    const el = document.getElementById("kpiGrid");
    if (!el || !KPI) return;

    const metrics = [
        { label: "CTR", key: "CTR", type: "pct" },
        { label: "CPC", key: "CPC", type: "curr" },
        { label: "ROAS", key: "ROAS", type: "num2" },
        { label: "AOV", key: "AOV", type: "curr" },
        { label: "CR", key: "CR", type: "pct" },
    ];

    el.innerHTML = metrics
        .map((m) => {
            const raw = Number(KPI[m.key] || 0);
            let valText;
            if (m.type === "curr") valText = fmt.curr(raw);
            else if (m.type === "pct") valText = fmt.pct(raw);
            else if (m.type === "num2") valText = fmt.num(raw, 2);
            else valText = fmt.num(raw, 0);

            return `
            <div class="kpi-card">
                <div class="kpi-label">${m.label}</div>
                <div class="kpi-value">${valText}</div>
            </div>`;
        })
        .join("");
}

// ======================================================
// RENDER: CREATIVES
// ======================================================
function renderCreatives() {
    const grid = document.getElementById("creativesGrid");
    if (!grid) return;

    let items = CREATIVES;
    if (FILTER === "image") items = items.filter((c) => c.mediaType === "image");
    if (FILTER === "video") items = items.filter((c) => c.mediaType === "video");

    if (!items.length) {
        grid.innerHTML = `<div style="grid-column: 1 / -1; text-align:center; color:#6B7280; padding:20px;">Keine Creatives vorhanden.</div>`;
        return;
    }

    grid.innerHTML = items
        .map((c) => {
            const ctr = Number(c.CTR || 0);
            const cpc = Number(c.CPC || 0);
            const roas = Number(c.ROAS || 0);
            const url = c.URL || "";
            const media =
                c.mediaType === "video"
                    ? `<video class="creative-media" controls src="${url}"></video>`
                    : `<img class="creative-media" src="${url}" alt="Creative">`;

            return `
            <div class="creative-card">
                ${media}
                <div class="creative-metrics">
                    <span>CTR: ${fmt.pct(ctr)}</span>
                    <span>ROAS: ${fmt.num(roas, 2)}</span>
                    <span>CPC: ${fmt.curr(cpc)}</span>
                </div>
            </div>`;
        })
        .join("");
}

// ======================================================
// INIT
// ======================================================
async function initDashboard() {
    try {
        const loading = document.getElementById("loading");
        if (loading) loading.style.display = "flex";

        ROWS = await loadSheetData();
        if (!ROWS || !ROWS.length) {
            console.warn("Keine Daten in DashboardData.");
            if (loading) loading.style.display = "none";
            return;
        }

        prepareData();
        renderOverview();
        renderFunnel();
        renderKPIs();
        renderCreatives();

        const dateEl = document.getElementById("currentDate");
        if (dateEl) {
            const now = new Date();
            dateEl.textContent = now.toLocaleDateString("de-DE", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            });
        }

        if (loading) loading.style.display = "none";
    } catch (e) {
        console.error("Fehler im Dashboard:", e);
        const loading = document.getElementById("loading");
        if (loading) loading.style.display = "none";
        alert("Fehler beim Laden der Dashboard-Daten. Siehe Konsole (F12).");
    }
}

// ======================================================
// EVENT HANDLING
// ======================================================
function setupEvents() {
    const refreshBtn = document.getElementById("refresh");
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            initDashboard();
        });
    }

    document.querySelectorAll(".toggle-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".toggle-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            CFG.period = parseInt(btn.dataset.period || "1", 10) || 1;
            initDashboard();
        });
    });

    document.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            document
                .querySelectorAll(".filter-btn")
                .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            FILTER = btn.dataset.filter || "all";
            renderCreatives();
        });
    });
}

// ======================================================
// START
// ======================================================
window.onload = function () {
    console.log("Dashboard wird initialisiert…");
    setupEvents();
    initDashboard();
};
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("connectMeta");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=732040642590155&` +
      `redirect_uri=https://amaschine.vercel.app/api/meta-auth&` +
      `scope=ads_read,ads_management,business_management,pages_show_list`;

    window.open(authUrl, "_blank", "width=500,height=600");
  });
});



