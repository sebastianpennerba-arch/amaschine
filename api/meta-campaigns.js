// /api/meta-campaigns.js

export default async function handler(req, res) {
  try {
    const { token, accountId } = req.body || {};
    if (!token || !accountId) {
      return res.status(400).json({ error: "Missing token or accountId" });
    }

    const version = process.env.META_API_VERSION || "v19.0";

    const url =
      `https://graph.facebook.com/${version}/act_${accountId}/campaigns` +
      `?fields=id,name,status` +
      `&effective_status=["ACTIVE","PAUSED"]` +
      `&limit=50` +
      `&access_token=${encodeURIComponent(token)}`;

    const fbRes = await fetch(url);
    const json = await fbRes.json();

    if (!fbRes.ok) {
      console.error("campaigns error:", json);
      return res.status(500).json(json);
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("campaigns exception:", e);
    return res.status(500).json({ error: "exception" });
  }
}
