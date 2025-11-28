// packages/dashboard/dashboard.alerts.js
// Alert-Engine (rot/gelb/grün) für das Dashboard (Phase 1 Final)

/**
 * Erzeugt strukturierte Alerts basierend auf KPI-Werten.
 * metrics:
 * {
 *   roas, ctr, cpm, spend, conversions,
 *   trendRoas, trendCtr, trendSpend
 * }
 */
export function generateDashboardAlerts(metrics = {}) {
    const alerts = {
        red: [],
        yellow: [],
        green: []
    };

    const {
        roas = 0,
        ctr = 0,
        cpm = 0,
        spend = 0,
        conversions = 0,
        trendRoas = 0,
        trendCtr = 0,
        trendSpend = 0
    } = metrics;

    /* ---------- 🔴 RED (kritisch) ---------- */

    if (roas < 1 && spend > 0) {
        alerts.red.push({
            title: "ROAS kritisch",
            message: `Der ROAS liegt bei ${roas.toFixed(
                2
            )}x – unter Profitabilität.`,
            kpi: "roas"
        });
    }

    if (ctr < 0.4 && impressionsRelevant(metrics)) {
        alerts.red.push({
            title: "CTR sehr niedrig",
            message: `CTR bei ${ctr.toFixed(
                2
            )}% – Creatives verlieren deutlich an Relevanz.`,
            kpi: "ctr"
        });
    }

    if (trendRoas < -0.25) {
        alerts.red.push({
            title: "ROAS Trend bricht ein",
            message: `ROAS fällt um ${Math.abs(trendRoas * 100).toFixed(
                1
            )}%.`,
            kpi: "trendRoas"
        });
    }

    /* ---------- 🟡 YELLOW (Warnung) ---------- */

    if (ctr < 0.8 && ctr >= 0.4) {
        alerts.yellow.push({
            title: "CTR unter Ziel",
            message: `CTR bei ${ctr.toFixed(
                2
            )}% – Creative Refresh empfohlen.`,
            kpi: "ctr"
        });
    }

    if (trendCtr < -0.15) {
        alerts.yellow.push({
            title: "CTR Trend negativ",
            message: `CTR fällt um ${Math.abs(trendCtr * 100).toFixed(
                1
            )}%.`,
            kpi: "trendCtr"
        });
    }

    if (trendSpend > 0.25 && roas < 1.5) {
        alerts.yellow.push({
            title: "Hoher Spend ohne starken ROAS",
            message: `Spend steigt um ${Math.abs(trendSpend * 100).toFixed(
                1
            )}% bei moderatem ROAS.`,
            kpi: "trendSpend"
        });
    }

    /* ---------- 🟢 GREEN (positiv) ---------- */

    if (roas > 3) {
        alerts.green.push({
            title: "Starker ROAS",
            message: `ROAS liegt bei ${roas.toFixed(2)}x – sehr profitabel.`,
            kpi: "roas"
        });
    }

    if (trendRoas > 0.15) {
        alerts.green.push({
            title: "ROAS im Aufwind",
            message: `ROAS steigt um ${Math.abs(trendRoas * 100).toFixed(
                1
            )}%.`,
            kpi: "trendRoas"
        });
    }

    if (ctr > 1.5) {
        alerts.green.push({
            title: "CTR stark",
            message: `CTR bei ${ctr.toFixed(
                2
            )}% – Creatives performen hervorragend.`,
            kpi: "ctr"
        });
    }

    return alerts;
}

/**
 * Rendert Alerts in HTML für dashboard.render.js
 */
export function renderAlertsBox(alerts) {
    if (!alerts) return "";

    const hasAlerts =
        alerts.red.length || alerts.yellow.length || alerts.green.length;

    if (!hasAlerts) {
        return `
            <div class="alert-box neutral">
                <span>Keine Auffälligkeiten – alles stabil 🎉</span>
            </div>
        `;
    }

    return `
        <div class="alert-box-container">
            ${renderAlertGroup("red", alerts.red)}
            ${renderAlertGroup("yellow", alerts.yellow)}
            ${renderAlertGroup("green", alerts.green)}
        </div>
    `;
}

function renderAlertGroup(type, items) {
    if (!items || !items.length) return "";
    const label =
        type === "red"
            ? "Kritisch"
            : type === "yellow"
            ? "Warnungen"
            : "Positiv";

    return `
        <div class="alert-group ${type}">
            <div class="alert-group-title">${label}</div>
            <ul class="alert-list">
                ${items
                    .map(
                        (a) => `
                <li class="alert-item">
                    <strong>${a.title}</strong>
                    <div>${a.message}</div>
                </li>`
                    )
                    .join("")}
            </ul>
        </div>
    `;
}

function impressionsRelevant(metrics) {
    return (metrics.impressions || 0) > 5000;
}
