export default async function handler(req, res) {
  try {
    const code = req.query.code;

    if (!code) {
      return res.status(400).json({ error: "No code provided" });
    }

    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code,
    });

    const url = "https://graph.facebook.com/v19.0/oauth/access_token?" + params;

    const r = await fetch(url);
    const data = await r.json();

    if (!data.access_token) {
      return res.status(500).json({
        error: "Token exchange failed",
        meta: data,
      });
    }

    return res.status(200).json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (e) {
    return res.status(500).json({ error: "Server error", details: e.message });
  }
}
