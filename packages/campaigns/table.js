// packages/campaigns/campaigns.table.js
// Rendering der Kampagnentabelle in #campaignsTableBody

function fEuro(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 2
    });
}

function fPct(v) {
    const n = Number(v || 0);
    return `${n.toFixed(2)}%`;
}

function fInt(v) {
    const n = Number(v || 0);
    return n.toLocaleString("de-DE");
}

function renderStatusPill(status) {
    const s = (status || "UNKNOWN").toUpperCase();
    let cls = "status-pill unknown";
    let label = s;

    if (s === "ACTIVE") {
        cls = "status-pill active";
        label = "Active";
    } else if (s === "PAUSED") {
        cls = "status-pill paused";
        label = "Paused";
    }

    return `<span class="${cls}">${label}</span>`;
}

export function renderCampaignsTable(campaigns) {
    const tbody = document.getElementById("campaignsTableBody");
    if (!tbody) return;

    if (!campaigns.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9">
                    <span style="color: var(--text-secondary); font-size:14px;">
                        Keine Kampagnen gefunden. Verbinde Meta oder aktiviere Demo Mode.
                    </span>
                </td>
            </tr>
        `;
        return;
    }

    const rows = campaigns
        .map(
            (c) => `
        <tr data-campaign-id="${c.id}">
            <td>${renderStatusPill(c.status)}</td>
            <td>${c.name}</td>
            <td>${c.objective || "n/a"}</td>
            <td>${fEuro(c.dailyBudget)}</td>
            <td>${fEuro(c.spend)}</td>
            <td>${(c.roas || 0).toFixed(2)}x</td>
            <td>${fPct(c.ctr)}</td>
            <td>${fInt(c.impressions)}</td>
            <td>
                <button class="action-button-secondary campaign-details-btn" data-campaign-id="${
                    c.id
                }">Details</button>
            </td>
        </tr>
    `
        )
        .join("");

    tbody.innerHTML = rows;
}
