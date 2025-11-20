/* ===========================================================
   SignalOne View Engine
   ViewLoader + ViewRegistry + ViewRenderers
   =========================================================== */

window.SignalViewEngine = {};

/* ===========================================================
   1) View Loader
   =========================================================== */
SignalViewEngine.load = async function(viewName) {
    const container = document.getElementById("view-container");
    if (!container) return;

    try {
        const html = await fetch(`/views/${viewName}.html`).then(r => r.text());
        container.innerHTML = html;

        // Modul initialisieren
        if (SignalViewEngine.registry[viewName]) {
            SignalViewEngine.registry[viewName]();
        }
    } catch (e) {
        container.innerHTML = `
            <div style="padding:20px; color:#ff5a5a;">
                ⚠️ View '${viewName}' konnte nicht geladen werden.
            </div>`;
    }
};

/* ===========================================================
   2) Registry
   =========================================================== */
SignalViewEngine.registry = {};

/* ===========================================================
   3) HELPERS
   =========================================================== */
const $ = (sel) => document.querySelector(sel);
const $all = (sel) => document.querySelectorAll(sel);

/* ===========================================================
   4) DASHBOARD
   =========================================================== */
SignalViewEngine.registry["dashboard"] = function() {
    if (!SignalState.kpi) return;

    $("#kpi-roas").innerText = SignalState.kpi.ROAS.toFixed(2);
    $("#kpi-spend").innerText = SignalState.kpi.Spend.toFixed(2);
    $("#kpi-revenue").innerText = SignalState.kpi.Revenue.toFixed(2);

    const recent = $("#recent-creatives");
    recent.innerHTML = "";

    SignalState.creatives.slice(0, 4).forEach(c => {
        recent.innerHTML += `
            <div class="library-item">
                <img src="${c.URL}" class="library-thumb" />
                <div class="library-info">
                    <div class="creative-name">${c.name}</div>
                    <div class="creative-meta">ROAS: ${c.ROAS}</div>
                </div>
            </div>
        `;
    });
};

/* ===========================================================
   5) CREATIVES
   =========================================================== */
SignalViewEngine.registry["creatives"] = function() {
    const grid = $("#creative-grid");
    const filter = $("#creativeFilter");

    const apply = () => {
        let data = [...SignalState.creatives];

        if (filter.value === "top") data = data.filter(c => c.ROAS >= 3);
        if (filter.value === "testing") data = data.filter(c => c.score < 60);

        grid.innerHTML = "";
        data.forEach(c => {
            grid.innerHTML += `
                <div class="library-item">
                    <img src="${c.URL}" class="library-thumb">
                    <div class="library-info">
                        <div class="creative-name">${c.name}</div>
                        <div class="creative-meta">ROAS: ${c.ROAS}</div>
                    </div>
                </div>`;
        });
    };

    filter.addEventListener("change", apply);
    apply();
};

/* ===========================================================
   6) CAMPAIGNS
   =========================================================== */
SignalViewEngine.registry["campaigns"] = function() {
    const list = $("#campaign-list");

    if (!SignalState.campaigns.length) {
        list.innerHTML = "<div>Keine Kampagnen vorhanden.</div>";
        return;
    }

    list.innerHTML = SignalState.campaigns.map(c => `
        <div class="campaign-card">
            <div class="campaign-title">${c.name}</div>
            <div class="campaign-status">${c.status}</div>
            <div class="campaign-kpi">ROAS: ${c.roas ?? "-"}</div>
        </div>
    `).join("");
};

/* ===========================================================
   7) INSIGHTS
   =========================================================== */
SignalViewEngine.registry["insights"] = function() {
    const el = $("#insight-details");
    const k = SignalState.kpi;
    if (!k) {
        el.innerHTML = "<div>Keine Insights verfügbar.</div>";
        return;
    }

    el.innerHTML = `
        <div class="insight-row"><strong>CTR:</strong> ${k.CTR.toFixed(2)}%</div>
        <div class="insight-row"><strong>CPC:</strong> €${k.CPC.toFixed(2)}</div>
        <div class="insight-row"><strong>ROAS:</strong> ${k.ROAS.toFixed(2)}</div>
        <div class="insight-row"><strong>CR:</strong> ${k.CR.toFixed(2)}%</div>
    `;
};

/* ===========================================================
   8) LIBRARY
   =========================================================== */
SignalViewEngine.registry["library"] = function() {
    const grid = $("#library-grid");
    grid.innerHTML = SignalState.creatives.map(c => `
        <div class="library-item">
            <img src="${c.URL}" class="library-thumb">
            <div class="library-info"><div>${c.name}</div></div>
        </div>
    `).join("");
};

/* ===========================================================
   9) REPORTS
   =========================================================== */
SignalViewEngine.registry["reports"] = function() {
    const history = $("#report-history");

    history.innerHTML = `
        <div class="report-history-card">
            <div>📄 Wochenreport KW ${new Date().getWeek?.() ?? "--"}</div>
        </div>
    `;
};

/* ===========================================================
   10) CONNECTIONS
   =========================================================== */
SignalViewEngine.registry["connections"] = function() {
    const accounts = $("#connected-accounts");

    if (!SignalState.accountId) {
        accounts.innerHTML = "<div>Noch keine Accounts verbunden.</div>";
        return;
    }

    accounts.innerHTML = `
        <div class="connected-account">
            <div class="account-platform-icon" style="background:#0084ff;">M</div>
            <div>
                <div>Meta Account</div>
                <div class="text-small">${SignalState.accountId}</div>
            </div>
        </div>`;
};

/* ===========================================================
   11) PROFILE
   =========================================================== */
SignalViewEngine.registry["profile"] = function() {
    $("#saveProfile").addEventListener("click", () => {
        alert("✓ Profil gespeichert");
    });
    $("#deleteAccount").addEventListener("click", () => {
        if (confirm("Wirklich löschen?")) alert("Account gelöscht.");
    });
};

/* ===========================================================
   12) PRICING
   =========================================================== */
SignalViewEngine.registry["pricing"] = function() {
    const cards = $("#pricing-cards");
    const periodBtns = $all(".period-btn");

    const update = () => {
        const yearly = $(".period-btn[data-period='yearly']").classList.contains("active");

        cards.innerHTML = `
            <div class="pricing-card">
                <h3>Starter</h3>
                <div class="pricing-amount">€${yearly ? 39 : 49}</div>
            </div>
            <div class="pricing-card popular">
                <div class="pricing-popular-badge">Beliebt</div>
                <h3>Professional</h3>
                <div class="pricing-amount">€${yearly ? 119 : 149}</div>
            </div>
            <div class="pricing-card">
                <h3>Enterprise</h3>
                <div class="pricing-amount">€${yearly ? 249 : 299}</div>
            </div>
        `;
    };

    periodBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            periodBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            update();
        });
    });

    update();
};

/* ===========================================================
   END
   =========================================================== */
