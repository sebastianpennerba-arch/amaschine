// /api/meta-insights.js

export default async function handler(req, res) {
  try {
    const { token, accountId, preset } = req.body || {};
    if (!token || !accountId) {
      return res.status(400).json({ error: "Missing token or accountId" });
    }

    const version = process.env.META_API_VERSION || "v19.0";
    const datePreset = preset || "last_7d";

    const url =
      `https://graph.facebook.com/${version}/act_${accountId}/insights` +
      `?fields=impressions,clicks,spend,ctr,cpc,actions,action_values,purchase_roas` +
      `&date_preset=${encodeURIComponent(datePreset)}` +
      `&level=account` +
      `&time_increment=1` +
      `&access_token=${encodeURIComponent(token)}`;

    const fbRes = await fetch(url);
    const json = await fbRes.json();

    if (!fbRes.ok) {
      console.error("insights error:", json);
      return res.status(500).json(json);
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("insights exception:", e);
    return res.status(500).json({ error: "exception" });
  }
}
