// packages/testing/testing.render.js
// Renders #testingLogTableBody

export function renderTestingTable(items) {
    const tbody = document.getElementById("testingLogTableBody");
    if (!tbody) return;

    if (!items.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center; color:var(--text-secondary);">
                    Keine Testing Log Einträge vorhanden.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = items
        .map(
            (i) => `
        <tr>
            <td><strong>${escape(i.name)}</strong></td>
            <td>${escape(i.details)}</td>
            <td>${formatDate(i.date)}</td>
            <td>${statusPill(i.status)}</td>
        </tr>`
        )
        .join("");
}

function escape(s) {
    return (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

function formatDate(d) {
    if (!d) return "-";
    try {
        return new Date(d).toLocaleString("de-DE");
    } catch {
        return d;
    }
}

function statusPill(s) {
    const st = (s || "open").toLowerCase();
    const cls =
        st === "completed"
            ? "status-pill active"
            : st === "in_progress"
            ? "status-pill paused"
            : "status-pill unknown";
    return `<span class="${cls}">${st}</span>`;
}
