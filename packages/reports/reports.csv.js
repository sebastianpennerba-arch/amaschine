// packages/reports/reports.csv.js
// CSV Export – je nach Scope andere Struktur.

function toCsvRow(values) {
    return (
        values
            .map((v) => {
                if (v == null) return "";
                const s = String(v).replace(/"/g, '""');
                if (s.includes(";") || s.includes("\n") || s.includes('"')) {
                    return `"${s}"`;
                }
                return s;
            })
            .join(";") + "\n"
    );
}

export function buildCsvReport(scope, payload) {
    let csv = "sep=;\n";

    if (scope === "creatives") {
        csv += toCsvRow([
            "id",
            "name",
            "campaignName",
            "adsetName",
            "spend",
            "impressions",
            "clicks",
            "ctr",
            "roas"
        ]);

        (payload.items || []).forEach((item) => {
            csv += toCsvRow([
                item.id,
                item.name,
                item.campaignName,
                item.adsetName,
                item.spend,
                item.impressions,
                item.clicks,
                item.ctr,
                item.roas
            ]);
        });
    } else if (scope === "campaign") {
        csv += toCsvRow(["campaignId", "name", "spend", "impressions", "clicks", "ctr", "roas"]);
        csv += toCsvRow([
            payload.selectedCampaignId,
            payload.selectedCampaignName,
            payload.metrics?.spend,
            payload.metrics?.impressions,
            payload.metrics?.clicks,
            payload.metrics?.ctr,
            payload.metrics?.roas
        ]);
    } else if (scope === "account") {
        csv += toCsvRow([
            "metric",
            "value"
        ]);
        csv += toCsvRow(["accountCount", payload.accountSummary?.accountCount]);
        csv += toCsvRow(["campaignCount", payload.accountSummary?.campaignCount]);
        if (payload.metrics) {
            csv += toCsvRow(["spend", payload.metrics.spend]);
            csv += toCsvRow(["roas", payload.metrics.roas]);
            csv += toCsvRow(["ctr", payload.metrics.ctr]);
            csv += toCsvRow(["cpm", payload.metrics.cpm]);
            csv += toCsvRow(["impressions", payload.metrics.impressions]);
            csv += toCsvRow(["clicks", payload.metrics.clicks]);
        }
    } else if (scope === "raw") {
        csv += toCsvRow(["key", "json"]);
        csv += toCsvRow(["raw", JSON.stringify(payload.raw || {})]);
    }

    return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}
