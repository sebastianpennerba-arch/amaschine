// metaApi.js – FINAL VERSION for https://signalone-backend.onrender.com
// Frontend-Proxy für Meta-API über das Backend
// - Nutzt automatisch AppState.meta.accessToken, wenn kein Token übergeben wird
// - Schickt beim Insights-Endpoint { accessToken, timeRangePreset } an das Backend
// - Liefert bei Insights ein Objekt im Format { ok, success, data, error? }

import { AppState } from "./state.js";

const BASE_URL = "https://signalone-backend.onrender.com/api/meta";

/**
 * Hilfsfunktion: ermittelt den zu verwendenden Access Token
 * - bevorzugt expliziten Parameter
 * - sonst AppState.meta.accessToken
 */
function resolveAccessToken(explicitToken) {
    if (explicitToken) return explicitToken;
    return AppState?.meta?.accessToken || null;
}

/**
 * Kleine Wrapper-Funktion für Fetch + JSON
 */
async function jsonPost(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
    });

    let data = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { res, data };
}

// 1. OAuth Code gegen Token tauschen
export async function exchangeMetaCodeForToken(code, redirectUri) {
    const { res, data } = await jsonPost(`${BASE_URL}/oauth/token`, {
        code,
        redirectUri
    });

    if (!res.ok || !data?.ok || !data.accessToken) {
        console.error("exchangeMetaCodeForToken failed:", data);
        return null;
    }

    return data.accessToken;
}

// 2. User laden
export async function fetchMetaUser(accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token) return null;

    const { res, data } = await jsonPost(`${BASE_URL}/me`, {
        accessToken: token
    });

    if (!res.ok || !data?.ok) {
        console.error("fetchMetaUser failed:", data);
        return null;
    }

    return data.data;
}

// 3. Werbekonten laden
export async function fetchMetaAdAccounts(accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/adaccounts`, {
        accessToken: token
    });

    if (!res.ok || !data?.ok) {
        console.error("fetchMetaAdAccounts failed:", data);
        return [];
    }

    // Backend liefert { ok: true, data: { data: [...] } }
    return data.data?.data || [];
}

// 4. Kampagnen laden
export async function fetchMetaCampaigns(accountId, accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token || !accountId) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/campaigns/${accountId}`, {
        accessToken: token
    });

    if (!res.ok || !data?.ok) {
        console.error("fetchMetaCampaigns failed:", data);
        return [];
    }

    return data.data?.data || [];
}

// 5. Ads laden
export async function fetchMetaAds(accountId, accessToken) {
    const token = resolveAccessToken(accessToken);
    if (!token || !accountId) return [];

    const { res, data } = await jsonPost(`${BASE_URL}/ads/${accountId}`, {
        accessToken: token
    });

    if (!res.ok || !data?.ok) {
        console.error("fetchMetaAds failed:", data);
        return [];
    }

    return data.data?.data || [];
}

// 6. Kampagnen-Insights laden (WICHTIG! Dashboard fix)
//    - Dashboard ruft auf mit: fetchMetaCampaignInsights(campaignId, preset)
//    - Wir ergänzen automatisch den Access Token
//    - Wir schicken { accessToken, timeRangePreset } an das Backend
//    - Wir geben ein Objekt zurück, das sowohl in aggregateCampaigns()
//      als auch im Single-Campaign-Branch funktioniert.
export async function fetchMetaCampaignInsights(
    campaignId,
    timeRangePreset,
    accessToken
) {
    const token = resolveAccessToken(accessToken);

    if (!token || !campaignId) {
        console.error("fetchMetaCampaignInsights called without token or campaignId");
        return { ok: false, success: false, error: "Missing token or campaignId" };
    }

    const preset = timeRangePreset || AppState.timeRangePreset || "last_30d";

    const { res, data } = await jsonPost(`${BASE_URL}/insights/${campaignId}`, {
        accessToken: token,
        timeRangePreset: preset
    });

    if (!res.ok || !data) {
        console.error("fetchMetaCampaignInsights HTTP error:", res.status, data);
        return {
            ok: false,
            success: false,
            error: data?.error || `HTTP ${res.status}`,
            data
        };
    }

    // Backend liefert: { ok: true, data: { data: [ ... ] } }
    const success = !!data.ok;

    return {
        ...data,
        ok: data.ok,
        success
    };
}
