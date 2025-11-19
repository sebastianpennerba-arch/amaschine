export default async function handler(req, res) {
  try {
    const code = req.query.code || req.body.code;

    if (!code) {
      return res.status(400).json({ error: "No ?code provided" });
    }

    const appId = "732040642590155";
    const appSecret = "14f64aab9d45c4dbc27e0feaac530e11"; // <-- IN VERCEL EINTRAGEN!
    const redirectUri = "https://amaschine.vercel.app/meta-popup.html";

    const tokenUrl =
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&client_secret=${appSecret}&code=${code}`;

    const fbResponse = await fetch(tokenUrl);
    const fbJson = await fbResponse.json();

    if (!fbJson.access_token) {
      return res.status(400).json({
        error: "Token exchange failed",
        details: fbJson,
      });
    }

    return res.status(200).json({
      access_token: fbJson.access_token,
      expires_in: fbJson.expires_in,
    });

  } catch (e) {
    return res.status(500).json({
      error: "Server error during token exchange",
      details: e.message,
    });
  }
}
