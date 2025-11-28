// packages/reports/reports.snapshot.js
// Snapshot-Preview im Reports-View (#reportSnapshot)

function f(value) {
    if (value == null) return "-";
    if (typeof value === "number") {
        return value.toLocaleString("de-DE", {
            maximumFractionDigits: 2
        });
    }
    return String(value);
}

export function renderReportSnapshot(scope, payload) {
    const container = document.getElementById("reportSnapshot");
    if (!container) return;

    if (!payload) {
        container.innerHTML = `
            <p style="color:var(--text-secondary); font-size:13px;">
                Kein Snapshot verfügbar.
            </p>
        `;
        return;
    }

    if (scope === "account") {
        const m = payload.metrics || {};
        container.innerHTML = `
            <div class="report-snapshot-card">
                <h3>Account Summary</h3>
                <p class="report-snapshot-sub">
                    Accounts: <strong>${f(payload.accountSummary?.accountCount)}</strong> •
                    Campaigns: <strong>${f(payload.accountSummary?.campaignCount)}</strong><br>
                    Generated: ${payload.generatedAtLabel}
                </p>
                <div class="report-snapshot-grid">
                    <div>
                        <div class="snapshot-label">Spend</div>
                        <div class="snapshot-value">${f(m.spend)} €</div>
                    </div>
                    <div>
                        <div class="snapshot-label">ROAS</div>
                        <div class="snapshot-value">${f(m.roas)}x</div>
                    </div>
                    <div>
                        <div class="snapshot-label">CTR</div>
                        <div class="snapshot-value">${f(m.ctr)}%</div>
                    </div>
                    <div>
                        <div class="snapshot-label">CPM</div>
                        <div class="snapshot-value">${f(m.cpm)} €</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (scope === "campaign") {
        const m = payload.metrics || {};
        container.innerHTML = `
            <div class="report-snapshot-card">
                <h3>Campaign Snapshot</h3>
                <p class="report-snapshot-sub">
                    ${payload.selectedCampaignName || "Keine Kampagne ausgewählt"}<br>
                    Generated: ${payload.generatedAtLabel}
                </p>
                <div class="report-snapshot-grid">
                    <div>
                        <div class="snapshot-label">Spend</div>
                        <div class="snapshot-value">${f(m.spend)} €</div>
                    </div>
                    <div>
                        <div class="snapshot-label">ROAS</div>
                        <div class="snapshot-value">${f(m.roas)}x</div>
                    </div>
                    <div>
                        <div class="snapshot-label">Impressions</div>
                        <div class="snapshot-value">${f(m.impressions)}</div>
                    </div>
                    <div>
                        <div class="snapshot-label">Clicks</div>
                        <div class="snapshot-value">${f(m.clicks)}</div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (scope === "creatives") {
        const count = payload.count || 0;
        container.innerHTML = `
            <div class="report-snapshot-card">
                <h3>Creative Library Snapshot</h3>
                <p class="report-snapshot-sub">
                    ${count} Creatives im Export • Generated: ${payload.generatedAtLabel}
                </p>
                <p style="font-size:12px; color:var(--text-secondary); margin-top:8px;">
                    Der CSV/XLSX Export enthält alle Creatives mit Spend/ROAS/CTR/Impressions.
                </p>
            </div>
        `;
        return;
    }

    if (scope === "raw") {
        container.innerHTML = `
            <div class="report-snapshot-card">
                <h3>RAW Dump Snapshot</h3>
                <p class="report-snapshot-sub">
                    Vollständige Meta-Datenstruktur als JSON (technischer Export).<br>
                    Generated: ${payload.generatedAtLabel}
                </p>
                <pre class="report-raw-preview">${escapeHtml(
                    JSON.stringify(payload.raw || {}, null, 2).slice(0, 1200)
                )}${payload.raw ? "\n..." : ""}</pre>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <p style="color:var(--text-secondary); font-size:13px;">
            Kein Snapshot für diesen Scope definiert.
        </p>
    `;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
