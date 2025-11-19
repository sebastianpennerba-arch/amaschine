// /api/meta-adaccounts.js

export default async function handler(req, res) {
  try {
    const { token } = req.body || {};
    if (!token) {
      return res.status(400).json({ error: "No token" });
    }

    const version = process.env.META_API_VERSION || "v19.0";

    const url =
      `https://graph.facebook.com/${version}/me/adaccounts` +
      `?fields=id,account_id,name` +
      `&limit=50` +
      `&access_token=${encodeURIComponent(token)}`;

    const fbRes = await fetch(url);
    const json = await fbRes.json();

    if (!fbRes.ok) {
      console.error("adaccounts error:", json);
      return res.status(500).json(json);
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("adaccounts exception:", e);
    return res.status(500).json({ error: "exception" });
  }
}
