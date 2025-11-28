// metaApi.js – FIXED VERSION
// Bündelt alle Einzel-Funktionen in ein MetaApi Objekt,
// damit app.js korrekt importieren kann:
// import { MetaApi } from "./metaApi.js";

import { AppState } from "./state.js";

const BASE_URL = "https://signalone-backend.onrender.com/api/meta";

function resolveAccessToken(explicitToken) {
    if (explicitToken) return explicitToken;
    return AppState?.meta?.accessToken || null;
}

async function jsonPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
    });

    let data = null;
    try { data = await res.json(); } catch { data = null; }

    return { res, data };
}

// ===============================
// Einzel-Funktionen
// ===============================

async function exchangeMetaCodeForToken(code, redirectUri) {
    const { res, data } = await jsonPost(`${BASE_URL}/oauth/token`, {
        code,
        redirectUri
    });

    return res.ok && data?.ok ? data.accessToken : null;
}

async function fetchMetaUser(accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token) return null;

    const { res, data } = await jsonPost(`${BASE_URL}/me`, { accessToken: token });
    return res.ok && data?.ok ? data.data : null;
}

async function fetchMetaAdAccounts(accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/adaccounts`, { accessToken: token });
    return res.ok && data?.ok ? data.data?.data || [] : [];
}

async function fetchMetaCampaigns(accountId, accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token || !accountId) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/campaigns/${accountId}`, {
        accessToken: token
    });

    return res.ok && data?.ok ? data.data?.data || [] : [];
}

async function fetchMetaAds(accountId, accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token || !accountId) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/ads/${accountId}`, {
        accessToken: token
    });

    return res.ok && data?.ok ? data.data?.data || [] : [];
}

async function fetchMetaCampaignInsights(campaignId, timeRangePreset, accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token || !campaignId) {
        return { ok: false, success: false, error: "Missing token or campaignId" };
    }

    const preset = timeRangePreset || AppState.timeRangePreset || "last_30d";

    const { res, data } = await jsonPost(`${BASE_URL}/insights/${campaignId}`, {
        accessToken: token,
        timeRangePreset: preset
    });

    if (!res.ok || !data) {
        return { ok: false, success: false, error: data?.error || res.status };
    }

    return { ...data, ok: data.ok, success: !!data.ok };
}

// ===============================
// Export als EIN Objekt (für app.js)
// ===============================

export const MetaApi = {
    exchangeMetaCodeForToken,
    fetchMetaUser,
    fetchMetaAdAccounts,
    fetchMetaCampaigns,
    fetchMetaAds,
    fetchMetaCampaignInsights
};
