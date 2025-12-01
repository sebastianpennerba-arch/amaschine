// packages/data/live/campaigns.js
// -----------------------------------------------------------------------------
// LIVE Campaign Fetch über dein echtes Backend
// -----------------------------------------------------------------------------

const API_BASE = "/api/meta";

async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "Unknown error");
    throw new Error(`[Meta Live] ${path}: ${res.status} – ${err}`);
  }

  return res.json();
}

// Holt alle Kampagnen eines AdAccounts
export async function fetchLiveCampaigns({ accountId, accessToken }) {
  if (!accountId) throw new Error("[Live Campaigns] Missing accountId");
  if (!accessToken) throw new Error("[Live Campaigns] Missing access token");

  const res = await post(`/campaigns/${accountId}`, { accessToken });

  if (!res.ok || !res.data) {
    throw new Error("[Live Campaigns] Invalid response");
  }

  return res.data.data || []; // Graph API packt Ergebnisse in .data.data
}

// Holt Insights für eine Kampagne
export async function fetchLiveCampaignInsights({
  campaignId,
  accessToken,
  preset = "last_7d"
}) {
  if (!campaignId) throw new Error("[Live Insights] Missing campaignId");

  const res = await post(`/insights/${campaignId}`, {
    accessToken,
    timeRangePreset: preset
  });

  if (!res?.ok || !res?.data) return [];

  return res.data.data || [];
}

// Holt Ads (inkl. Creatives) eines AdAccounts
export async function fetchLiveAds({ accountId, accessToken }) {
  if (!accountId) throw new Error("[Live Ads] Missing accountId");

  const res = await post(`/ads/${accountId}`, { accessToken });

  if (!res?.ok || !res?.data) return [];

  return res.data.data || [];
}
