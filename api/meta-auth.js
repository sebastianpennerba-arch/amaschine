export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send("No ?code provided.");
  }

  const appId = "732040642590155";
  const appSecret = process.env.META_APP_SECRET; 
  const redirectUri = "https://amaschine.vercel.app/api/meta-auth";

  // 1. Meta Code -> Token tauschen
  const tokenUrl =
    `https://graph.facebook.com/v19.0/oauth/access_token?` +
    `client_id=${appId}&client_secret=${appSecret}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&code=${code}`;

  const tokenRes = await fetch(tokenUrl);
  const tokenJson = await tokenRes.json();

  if (!tokenJson.access_token) {
    return res.status(500).json({ error: "Token exchange failed", details: tokenJson });
  }

  const accessToken = tokenJson.access_token;

  // 2. RESPONSE = Popup -> sendet Token zurück ans Dashboard
  res.setHeader("Content-Type", "text/html");
  res.send(`
<html>
  <body style="font-family: sans-serif; font-size: 18px;">
    <p>Meta Login erfolgreich. Dieses Fenster kann geschlossen werden.</p>
    <script>
      // WICHTIG: Token zurück an Hauptseite schicken
      window.opener.postMessage(
        {
          type: "META_AUTH_SUCCESS",
          token: "${accessToken}"
        },
        "*"
      );
      window.close();
    </script>
  </body>
</html>
  `);
}
