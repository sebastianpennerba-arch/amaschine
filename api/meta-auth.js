export default async function handler(req, res) {
  try {
    const code = req.query.code;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const appId = "732040642590155";
    const appSecret = "14f64aab9d45c4dbc27e0feaac530e11"; // <-- IN VERCEL EINTRAGEN!
    const redirectUri = "https://amaschine.vercel.app/meta-popup.html";

    const tokenUrl =
      `https://graph.facebook.com/v19.0/oauth/access_token` +
      `?client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirect)}` +
      `&client_secret=${secret}` +
      `&code=${code}`;

    const fbRes = await fetch(tokenUrl);
    const json = await fbRes.json();

    return res.status(200).json(json);
  } catch (e) {
    console.error("OAuth Fehler:", e);
    res.status(500).json({ error: "OAuth failed" });
  }
}
