// packages/campaigns/campaigns.compute.js
// Berechnungs-Engine für Kampagnen (Demo + Live)

import { AppState } from "../../state.js";
import { demoCampaigns } from "./campaigns.demo.js";
import { applyCampaignFilters } from "./campaigns.filters.js";

function safeNumber(v) {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
}

function mapDemoCampaigns() {
    return demoCampaigns.map((c, idx) => ({
        id: c.id || `demo-campaign-${idx}`,
        name: c.name || "Demo Campaign",
        status: c.status || "ACTIVE",
        objective: c.objective || "SALES",
        dailyBudget: safeNumber(c.dailyBudget || c.budget),
        spend: safeNumber(c.spend),
        roas: safeNumber(c.roas),
        ctr: safeNumber(c.ctr),
        impressions: safeNumber(c.impressions),
        clicks: safeNumber(c.clicks)
    }));
}

function mapLiveCampaigns() {
    const campaigns = AppState.meta?.campaigns || [];
    const insightsMap = AppState.meta?.insightsByCampaign || {};

    return campaigns.map((c, idx) => {
        const m = insightsMap[c.id] || {};
        const spend = safeNumber(m.spend);
        const impressions = safeNumber(m.impressions);
        const clicks = safeNumber(m.clicks);
        const ctr = impressions > 0 ? (clicks / impressions) * 100 : safeNumber(m.ctr);
        const roas = safeNumber(m.roas);

        return {
            id: c.id || `live-campaign-${idx}`,
            name: c.name || "Campaign",
            status: c.status || "UNKNOWN",
            objective: c.objective || "UNKNOWN",
            dailyBudget: safeNumber(c.daily_budget || c.lifetime_budget),
            spend,
            roas,
            ctr,
            impressions,
            clicks
        };
    });
}

export async function buildCampaignsState({ connected, filters }) {
    const demoMode = !!AppState.settings?.demoMode;

    let baseCampaigns;
    let mode = "live";

    if (demoMode || !connected) {
        baseCampaigns = mapDemoCampaigns();
        mode = demoMode ? "demo" : "disconnected";
    } else {
        baseCampaigns = mapLiveCampaigns();
        mode = "live";
    }

    const items = applyCampaignFilters(baseCampaigns, filters || {});

    return {
        mode,
        items,
        baseItems: baseCampaigns,
        filters: filters || {}
    };
}
