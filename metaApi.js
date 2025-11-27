// metaApi.js – FINAL VERSION for https://signalone-backend.onrender.com

const BASE_URL = "https://signalone-backend.onrender.com/api/meta";

// 1. OAuth Code gegen Token tauschen
export async function exchangeMetaCodeForToken(code, redirectUri) {
    const res = await fetch(`${BASE_URL}/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri })
    });

    const data = await res.json();
    if (!data.ok || !data.accessToken) return null;

    return data.accessToken;
}

// 2. User laden
export async function fetchMetaUser(accessToken) {
    const res = await fetch(`${BASE_URL}/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken })
    });
    const data = await res.json();
    return data.ok ? data.data : null;
}

// 3. Werbekonten laden
export async function fetchMetaAdAccounts(accessToken) {
    const res = await fetch(`${BASE_URL}/adaccounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken })
    });
    const data = await res.json();
    return data.ok ? data.data.data : [];
}

// 4. Kampagnen laden
export async function fetchMetaCampaigns(accountId, accessToken) {
    const res = await fetch(`${BASE_URL}/campaigns/${accountId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken })
    });
    const data = await res.json();
    return data.ok ? data.data.data : [];
}

// 5. Ads laden
export async function fetchMetaAds(accountId, accessToken) {
    const res = await fetch(`${BASE_URL}/ads/${accountId}`, {
       method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ accessToken })
   });
    const data = await res.json();
   return data.ok ? data.data.data : [];
}

// 6. Kampagnen-Insights laden (WICHTIG! Dashboard fix)
export async function fetchMetaCampaignInsights(campaignId, timeRange, accessToken) {
    const res = await fetch(`${BASE_URL}/insights/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeRange, accessToken })
    });

    const data = await res.json();
    return data.ok ? data.data.data : [];
}
