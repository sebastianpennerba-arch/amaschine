// /api/meta-ads.js

export default async function handler(req, res) {
  try {
    const { token, campaignId } = req.body || {};
    if (!token || !campaignId) {
      return res.status(400).json({ error: "Missing token or campaignId" });
    }

    const version = process.env.META_API_VERSION || "v19.0";

    const url =
      `https://graph.facebook.com/${version}/${campaignId}/ads` +
      `?fields=id,name,creative{thumbnail_url,image_url,video_url,object_story_spec},` +
      `insights{impressions,clicks,ctr,cpc,spend,actions,action_values}` +
      `&limit=50` +
      `&access_token=${encodeURIComponent(token)}`;

    const fbRes = await fetch(url);
    const json = await fbRes.json();

    if (!fbRes.ok) {
      console.error("ads error:", json);
      return res.status(500).json(json);
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("ads exception:", e);
    return res.status(500).json({ error: "exception" });
  }
}
