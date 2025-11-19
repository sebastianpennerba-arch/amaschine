// /api/meta-auth.js

export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const appId = process.env.META_APP_ID;
    const secret = process.env.META_APP_SECRET;
    const version = process.env.META_API_VERSION || "v19.0";

    // MUSS exakt der Redirect sein, den Facebook benutzt
    const redirect = "https://amaschine.vercel.app/meta-popup.html";

    const tokenUrl =
      `https://graph.facebook.com/${version}/oauth/access_token` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&client_secret=${encodeURIComponent(secret)}` +
      `&code=${encodeURIComponent(code)}`;

    const fbRes = await fetch(tokenUrl);
    const json = await fbRes.json();

    if (!fbRes.ok) {
      console.error("Meta OAuth Error:", json);
      return res.status(500).json({ error: json.error || "OAuth failed" });
    }

    return res.status(200).json(json);
  } catch (e) {
    console.error("Meta OAuth exception:", e);
    return res.status(500).json({ error: "OAuth exception" });
  }
}
