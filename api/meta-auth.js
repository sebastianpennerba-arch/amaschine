// pages/api/meta-auth.js

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { code, error } = req.query;

  if (error) {
    console.error("Meta OAuth Error:", error);
    return renderClosePage(res, null, "Meta Login abgebrochen.");
  }

  if (!code) {
    return renderClosePage(res, null, "Kein Code übergeben.");
  }

  try {
    const params = new URLSearchParams({
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      redirect_uri: process.env.META_REDIRECT_URI,
      code: String(code),
    });

    // Schritt 1: Short-lived User Token holen
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`
    );
    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Fehler beim Token-Tausch:", tokenJson);
      return renderClosePage(res, null, "Token konnte nicht geholt werden.");
    }

    const shortLivedToken = tokenJson.access_token;

    // Optional: In Long-Lived Token tauschen (empfohlen, aber nicht Pflicht)
    const llParams = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: process.env.META_APP_ID,
      client_secret: process.env.META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    const llRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${llParams.toString()}`
    );
    const llJson = await llRes.json();

    const finalToken = llJson.access_token || shortLivedToken;

    return renderClosePage(res, finalToken);
  } catch (e) {
    console.error("meta-auth server error:", e);
    return renderClosePage(res, null, "Serverfehler in meta-auth.");
  }
}

function renderClosePage(res, token, message) {
  const payload = token ? { access_token: token } : { error: message || "error" };

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`
<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Meta Login</title></head>
<body>
<script>
  (function() {
    var data = ${JSON.stringify(payload)};
    if (window.opener && window.opener.postMessage) {
      window.opener.postMessage(data, window.opener.location.origin);
    }
    window.close();
  })();
</script>
Meta Login kann dieses Fenster schließen.
</body>
</html>
  `);
}
