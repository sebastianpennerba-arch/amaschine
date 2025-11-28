// packages/reports/reports.json.js
// JSON Export

export function buildJsonReport(scope, payload) {
    const data = {
        scope,
        ...payload
    };

    const json = JSON.stringify(data, null, 2);
    return new Blob([json], { type: "application/json" });
}
