export function renderListSection(title, items = []) {
    if (!items.length) return "";
    return `
        <div class="sensei-section">
            <h3>${title}</h3>
            <ul>
                ${items
                    .map(
                        (i) => `
                    <li>
                        <strong>${escapeHtml(i.title)}</strong><br>
                        <span>${escapeHtml(i.message)}</span><br>
                        ${
                            i.priority
                                ? `<small>Priorität: ${escapeHtml(
                                      i.priority
                                  )}</small>`
                                : ""
                        }
                    </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;
}

export function renderTestingSection(tests = []) {
    if (!tests.length) return "";
    return `
        <div class="sensei-section">
            <h3>Testing</h3>
            <ul>
                ${tests
                    .map(
                        (t) => `
                <li>
                    <strong>${escapeHtml(t.title)}</strong><br>
                    ${
                        t.status
                            ? `<small>Status: ${escapeHtml(t.status)}</small><br>`
                            : ""
                    }
                    <div>${escapeHtml(t.findings)}</div>
                    ${
                        t.next
                            ? `<em>Nächster Schritt: ${escapeHtml(
                                  t.next
                              )}</em>`
                            : ""
                    }
                </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;
}

export function renderForecastSection(fc) {
    if (!fc) return "";
    return `
        <div class="sensei-section">
            <h3>Prognose (7 Tage)</h3>
            <p><strong>ROAS:</strong> ${(fc.roas || 0).toFixed(2)}x</p>
            <p><strong>Spend:</strong> ${(fc.spend || 0).toLocaleString(
                "de-DE"
            )} €</p>
            <p><strong>Revenue:</strong> ${(fc.revenue || 0).toLocaleString(
                "de-DE"
            )} €</p>
            <p><strong>Konfidenz:</strong> ${(
                (fc.confidence || 0) * 100
            ).toFixed(1)}%</p>
            ${
                fc.message
                    ? `<small>${escapeHtml(fc.message)}</small>`
                    : ""
            }
        </div>
    `;
}

export function renderFunnelSection(f) {
    if (!f) return "";

    const stages = ["tof", "mof", "bof"];
    return `
        <div class="sensei-section">
            <h3>Funnel Analyse</h3>
            ${stages
                .filter((s) => f[s])
                .map(
                    (stage) => `
                <div class="funnel-block">
                    <strong>${label(stage)}</strong><br>
                    ${
                        f[stage].score != null
                            ? `Score: ${f[stage].score}<br>`
                            : ""
                    }
                    ${
                        f[stage].issues?.length
                            ? `Probleme: ${f[stage].issues
                                  .map(escapeHtml)
                                  .join(", ")}<br>`
                            : ""
                    }
                    ${
                        f[stage].opportunities?.length
                            ? `Chancen: ${f[stage].opportunities
                                  .map(escapeHtml)
                                  .join(", ")}`
                            : ""
                    }
                </div>`
                )
                .join("")}
        </div>
    `;
}

function label(s) {
    return s === "tof"
        ? "Top Funnel"
        : s === "mof"
        ? "Middle Funnel"
        : "Bottom Funnel";
}

function escapeHtml(str) {
    if (!str && str !== 0) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
