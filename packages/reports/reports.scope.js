// packages/reports/reports.scope.js
// Baut den Daten-Payload für die verschiedenen Report-Scopes.

import { AppState } from "../../state.js";

/**
 * Normalisiert Daten für die verschiedenen Report-Scopes.
 *
 * scope: "account" | "campaign" | "creatives" | "raw"
 */
export function buildReportPayload(scope, { connected }) {
    const meta = AppState.meta || {};
    const now = new Date();

    const base = {
        generatedAt: now.toISOString(),
        generatedAtLabel: now.toLocaleString("de-DE"),
        scope,
        connected: !!connected,
        metaConnection: {
            connected: !!AppState.metaConnected,
            user: meta.user ? { id: meta.user.id, name: meta.user.name } : null
        }
    };

    if (scope === "account") {
        const accounts = meta.adAccounts || [];
        const campaigns = meta.campaigns || [];
        const metrics = AppState.dashboardMetrics || null;

        return {
            ...base,
            accountSummary: {
                accountCount: accounts.length,
                campaignCount: campaigns.length
            },
            metrics
        };
    }

    if (scope === "campaign") {
        const campaigns = meta.campaigns || [];
        const insights = meta.insightsByCampaign || {};
        const currentId = AppState.selectedCampaignId;

        const selected =
            campaigns.find((c) => c.id === currentId) ||
            (campaigns.length ? campaigns[0] : null);

        const metrics = selected ? insights[selected.id] || null : null;

        return {
            ...base,
            selectedCampaignId: selected?.id || null,
            selectedCampaignName: selected?.name || null,
            metrics
        };
    }

    if (scope === "creatives") {
        const ads = meta.ads || [];
        const rows = ads.map((a) => {
            const insights = Array.isArray(a.insights?.data)
                ? a.insights.data[0]
                : a.insights?.data || a.insights || {};

            return {
                id: a.id,
                name: a.name || a.ad_name,
                campaignName: a.campaign_name,
                adsetName: a.adset_name,
                spend: Number(insights?.spend || 0),
                impressions: Number(insights?.impressions || 0),
                clicks: Number(insights?.clicks || 0),
                ctr:
                    Number(insights?.impressions || 0) > 0
                        ? (Number(insights?.clicks || 0) /
                              Number(insights?.impressions || 0)) *
                          100
                        : 0,
                roas: extractRoas(insights),
                rawInsights: insights
            };
        });

        return {
            ...base,
            count: rows.length,
            items: rows
        };
    }

    if (scope === "raw") {
        // Kompletter Meta-Block für Debugging & Tech-Export
        return {
            ...base,
            raw: meta
        };
    }

    // Fallback: Account-Report
    return buildReportPayload("account", { connected });
}

function extractRoas(insights) {
    if (
        Array.isArray(insights?.website_purchase_roas) &&
        insights.website_purchase_roas.length
    ) {
        const val = Number(insights.website_purchase_roas[0].value);
        return isNaN(val) ? 0 : val;
    }
    return 0;
}
