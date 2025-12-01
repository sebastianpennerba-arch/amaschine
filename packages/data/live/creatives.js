// packages/data/live/creatives.js
// -----------------------------------------------------------------------------
// LIVE Creatives & Ads Fetch über dein Backend
// Nutzt exakt die Routen aus metaRoutes.js:
//   /api/meta/ads/:accountId
//   /api/meta/campaigns/:accountId
//   /api/meta/insights/:campaignId
// -----------------------------------------------------------------------------

const API_BASE = "/api/meta";

// Generic POST
async function post(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {})
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`[Meta Live] ${path} failed: ${res.status} ${err}`);
  }

  return res.json();
}

// Holt alle Creatives über /ads/:accountId
export async function fetchLiveCreatives({ accountId, accessToken }) {
  if (!accountId) throw new Error("[Live Creatives] Missing accountId");
  if (!accessToken) throw new Error("[Live Creatives] Missing token");

  const res = await post(`/ads/${accountId}`, { accessToken });

  if (!res.ok || !res.data) return [];

  const ads = res.data.data || [];

  // Mapping Ads -> Creative-Layer
  return ads.map((ad) => {
    const creative = ad.creative || {};
    const id = creative.id || ad.id || crypto.randomUUID();

    const name =
      creative.name ||
      ad.name ||
      creative.title ||
      `Creative ${id.slice(-4)}`;

    const thumbnail =
      creative.thumbnail_url ||
      creative.thumbnailUrl ||
      ad.thumbnail_url ||
      null;

    const base = {
      id,
      name,
      thumbnail,
      adId: ad.id,
      campaignId: ad.campaign_id || null,
      metrics: null // wird durch Insight-Mapping befüllt
    };

    return base;
  });
}

// Holt Creative-Level Insights über Kampagnen
export async function fetchLiveCreativeInsights({
  campaignId,
  accessToken,
  preset = "last_7d"
}) {
  if (!campaignId) throw new Error("[Live Creative Insights] Missing ID");

  const res = await post(`/insights/${campaignId}`, {
    accessToken,
    timeRangePreset: preset
  });

  if (!res.ok || !res.data) return [];

  const rows = res.data.data || [];

  return rows.map((row) => {
    // Normalisierte Kennzahlen
    const impressions = parseFloat(row.impressions || 0);
    const clicks = parseFloat(row.clicks || 0);
    const spend = parseFloat(row.spend || 0);

    let ctr = parseFloat(row.ctr || 0);
    if (!ctr && impressions > 0) ctr = clicks / impressions;

    let cpm = parseFloat(row.cpm || 0);
    if (!cpm && impressions > 0) cpm = (spend / impressions) * 1000;

    const purchases =
      row.actions?.find((a) => a.action_type === "purchase")?.value || 0;

    const roas =
      row.website_purchase_roas?.[0]?.value ||
      row.purchase_roas?.[0]?.value ||
      0;

    return {
      impressions,
      clicks,
      spend,
      ctr,
      cpm,
      purchases,
      roas,
      campaignId
    };
  });
}
