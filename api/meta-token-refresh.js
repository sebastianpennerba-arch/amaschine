// /api/meta-token-refresh.js

export default async function handler(req, res) {
  try {
    const { shortToken } = JSON.parse(req.body);

    const url =
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `grant_type=fb_exchange_token&` +
      `client_id=${process.env.META_APP_ID}&` +
      `client_secret=${process.env.META_APP_SECRET}&` +
      `fb_exchange_token=${shortToken}`;

    const response = await fetch(url);
    const data = await response.json();

    return res.status(200).json(data);
  } catch (e) {
    console.error("token refresh error:", e);
    return res.status(500).json({ error: "exception" });
  }
}
