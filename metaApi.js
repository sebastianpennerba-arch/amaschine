/* ============================================================
   metaApi.js – FINAL VERSION (kompatibel mit neuer app.js)
============================================================ */

import { AppState } from "./state.js";

const BASE_URL = "https://signalone-backend.onrender.com/api/meta";

/* ============================================================
   Helper: Token auflösen
============================================================ */

function resolveAccessToken(explicitToken) {
    if (explicitToken) return explicitToken;
    return AppState?.meta?.accessToken || null;
}

/* ============================================================
   Helper: POST JSON Wrapper
============================================================ */

async function jsonPost(url, body) {
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body || {})
        });

        const data = await res.json().catch(() => null);

        return { ok: res.ok, status: res.status, data };
    } catch (e) {
        return { ok: false, status: 500, data: { ok: false, error: e.toString() } };
    }
}

/* ============================================================
   OAuth: Code → Access Token
============================================================ */

export async function exchangeMetaCodeForToken(code, redirectUri) {
    const { ok, data } = await jsonPost(`${BASE_URL}/oauth/token`, {
        code,
        redirectUri
    });

    return ok && data?.ok ? data.accessToken : null;
}

/* ============================================================
   USER
============================================================ */

export async function fetchMetaUser(explicitToken) {
    const token = resolveAccessToken(explicitToken);
    if (!token) return null;

    const { ok, data } = await jsonPost(`${BASE_URL}/me`, {
        accessToken: token
    });

    return ok && data?.ok ? data.data : null;
}

/* ============================================================
   AD ACCOUNTS
============================================================ */

export async function fetchMetaAdAccounts(explicitToken) {
    const token = resolveAccessToken(explicitToken);
    if (!token) return [];

    const { ok, data } = await jsonPost(`${BASE_URL}/adaccounts`, {
        accessToken: token
    });

    return ok && data?.ok ? data.data?.data || [] : [];
}

/* ============================================================
   CAMPAIGNS
============================================================ */

export async function fetchMetaCampaigns(accountId, explicitToken) {
    const token = resolveAccessToken(explicitToken);
    if (!token || !accountId) return [];

    const { ok, data } = await jsonPost(`${BASE_URL}/campaigns/${accountId}`, {
        accessToken: token
    });

    return ok && data?.ok ? data.data?.data || [] : [];
}

/* ============================================================
   ADS
============================================================ */

export async function fetchMetaAds(accountId, explicitToken) {
    const token = resolveAccessToken(explicitToken);
    if (!token || !accountId) return [];

    const { ok, data } = await jsonPost(`${BASE_URL}/ads/${accountId}`, {
        accessToken: token
    });

    return ok && data?.ok ? data.data?.data || [] : [];
}

/* ============================================================
   INSIGHTS
============================================================ */

export async function fetchMetaCampaignInsights(campaignId, timeRangePreset, explicitToken) {
    const token = resolveAccessToken(explicitToken);
    if (!token || !campaignId) {
        return { ok: false, error: "Missing token or campaignId" };
    }

    const range = timeRangePreset || AppState.timeRangePreset || "last_30d";

    const { ok, data } = await jsonPost(`${BASE_URL}/insights/${campaignId}`, {
        accessToken: token,
        timeRangePreset: range
    });

    if (!ok || !data) {
        return { ok: false, error: data?.error || "Unknown API error" };
    }

    return data;
}
