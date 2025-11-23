// metaApi.js – Wrapper für Backend-API Richtung Meta

import { AppState, META_BACKEND_CONFIG } from "./state.js";

export async function fetchMetaAdAccounts() {
    if (!AppState.meta.accessToken) {
        return { success: false, error: "No access token" };
    }

    const res = await fetch(META_BACKEND_CONFIG.adAccountsEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);

    if (!res) return { success: false, error: "Network error" };
    return await res.json();
}

export async function fetchMetaCampaigns(accountId) {
    if (!AppState.meta.accessToken) {
        return { success: false, error: "No access token" };
    }

    const res = await fetch(META_BACKEND_CONFIG.campaignsEndpoint(accountId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);

    if (!res) return { success: false, error: "Network error" };
    return await res.json();
}

export async function fetchMetaCampaignInsights(campaignId, datePreset) {
    if (!AppState.meta.accessToken) {
        return { success: false, error: "No access token" };
    }

    const body = {
        accessToken: AppState.meta.accessToken,
        datePreset: datePreset || "last_30d"
    };

    const res = await fetch(META_BACKEND_CONFIG.insightsEndpoint(campaignId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    }).catch(() => null);

    if (!res) return { success: false, error: "Network error" };
    return await res.json();
}

export async function fetchMetaAds(accountId) {
    if (!AppState.meta.accessToken) {
        return { success: false, error: "No access token" };
    }

    const res = await fetch(META_BACKEND_CONFIG.adsEndpoint(accountId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: AppState.meta.accessToken })
    }).catch(() => null);

    if (!res) return { success: false, error: "Network error" };
    return await res.json();
}

export async function fetchMetaUser() {
    if (!AppState.meta.accessToken) return null;

    try {
        const res = await fetch(META_BACKEND_CONFIG.meEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: AppState.meta.accessToken })
        }).catch(() => null);

        if (!res) return null;
        const data = await res.json();
        if (data?.success && data.data) {
            AppState.meta.user = {
                id: data.data.id,
                name: data.data.name
            };
            return AppState.meta.user;
        }
    } catch (e) {
        console.warn("fetchMetaUser error:", e);
    }
    return null;
}

export async function exchangeMetaCodeForToken(code, redirectUri) {
    const res = await fetch(META_BACKEND_CONFIG.tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri })
    }).catch(() => null);

    if (!res) return { success: false, error: "Network error" };
    return await res.json();
}
