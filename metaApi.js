// metaApi.js – SignalOne.cloud – FINAL

const API_BASE = "https://signalone-backend.onrender.com/api/meta";

// -----------------------------
// 1) OAuth Code → Token
// -----------------------------
async function exchangeMetaCodeForToken(code, redirectUri) {
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  });

  const data = await res.json();

  if (!data.ok || !data.accessToken) {
    console.error("exchangeMetaCodeForToken error:", data);
    throw new Error(data.error || "Failed to exchange token");
  }

  return data.accessToken;
}

// -----------------------------
// 2) GET Ad Accounts
// -----------------------------
async function fetchMetaAdAccounts(accessToken) {
  const res = await fetch(`${API_BASE}/adaccounts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("fetchMetaAdAccounts error:", data);
    throw new Error(data.error || "Failed loading ad accounts");
  }

  return data.data?.data || [];
}

// -----------------------------
// 3) GET Campaigns
// -----------------------------
async function fetchMetaCampaigns(accountId, accessToken) {
  const res = await fetch(`${API_BASE}/campaigns/${accountId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("fetchMetaCampaigns error:", data);
    throw new Error("Failed loading campaigns");
  }

  return data.data?.data || [];
}

// -----------------------------
// 4) GET Campaign Insights
// -----------------------------
async function fetchMetaCampaignInsights(campaignId, accessToken, timeRangePreset) {
  const res = await fetch(`${API_BASE}/insights/${campaignId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, timeRangePreset }),
  });

  const data = await res.json();

  if (!data.ok) {
    console.error("fetchMetaCampaignInsights error:", data);
    throw new Error("Failed loading insights");
  }

  return data.data?.data || [];
}

// -----------------------------
// 5) GET Ads
// -----------------------------
async function fetchMetaAds(accountId, accessToken) {
  const res = await fetch(`${API_BASE}/ads/${accountId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("fetchMetaAds error:", data);
    throw new Error("Failed loading ads");
  }

  return data.data?.data || [];
}

// -----------------------------
// 6) GET User Profile
// -----------------------------
async function fetchMetaUser(accessToken) {
  const res = await fetch(`${API_BASE}/me`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  });

  const data = await res.json();
  if (!data.ok) {
    console.error("fetchMetaUser error:", data);
    throw new Error("Failed loading profile");
  }

  return data.data || {};
}

export {
  exchangeMetaCodeForToken,
  fetchMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaCampaignInsights,
  fetchMetaAds,
  fetchMetaUser,
};
