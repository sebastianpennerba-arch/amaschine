// packages/sensei/sensei.compute.js
// State Builder + Normalizer + Payload Engine

import { AppState } from "../../state.js";

export function buildSenseiPayload() {
    const demoMode = !!AppState.settings?.demoMode;

    const account = {
        id: AppState.selectedAccountId || "live_account",
        name:
            (AppState.meta?.adAccounts || []).find(
                (a) => a.id === AppState.selectedAccountId
            )?.name || "Live Meta Account",
        currency:
            (AppState.meta?.adAccounts || [])[0]?.currency || "EUR"
    };

    const dashboard = AppState.dashboardMetrics || {
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpm: 0,
        roas: 0,
        scopeLabel: "Keine Auswahl",
        timeRangeLabel: "Unbekannt"
    };

    const campaigns = (AppState.meta?.campaigns || []).map((c) => {
        const insight = AppState.meta?.insightsByCampaign?.[c.id] || {};
        return {
            id: c.id,
            name: c.name,
            status: c.status || c.effective_status || "UNKNOWN",
            objective: c.objective || "UNKNOWN",
            spend: Number(insight.spend || 0),
            impressions: Number(insight.impressions || 0),
            clicks: Number(insight.clicks || 0),
            ctr: Number(insight.ctr || 0),
            roas: Number(insight.roas || 0)
        };
    });

    const creatives = (AppState.meta?.ads || []).map((ad) => {
        let thumb =
            ad.creative?.object_story_spec?.video_data?.thumbnail_url ||
            ad.creative?.object_story_spec?.link_data?.picture ||
            null;

        return {
            id: ad.id,
            name: ad.name || "Anzeige",
            campaign_id: ad.campaign_id || null,
            configured_status: ad.configured_status,
            effective_status: ad.effective_status,
            thumbnail: thumb
        };
    });

    return {
        mode: demoMode ? "demo" : "live",
        account,
        dashboard,
        campaigns,
        creatives,
        alerts: [],
        testing: [],
        funnel: null
    };
}

export function normalizeSenseiResult(raw) {
    if (!raw || typeof raw !== "object") {
        return {
            summary: "Keine verwertbare Antwort.",
            actions: [],
            risks: [],
            opportunities: [],
            testing: [],
            forecast: null,
            funnel: null
        };
    }

    return {
        summary: raw.summary || "Analyse abgeschlossen.",
        actions: toArr(raw.actions),
        risks: toArr(raw.risks),
        opportunities: toArr(raw.opportunities),
        testing: toArr(raw.testing),
        forecast: raw.forecast || null,
        funnel: raw.funnel || null
    };
}

const toArr = (v) => (Array.isArray(v) ? v : []);
