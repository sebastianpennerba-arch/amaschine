export default async function handler(req, res) {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: "No ?code provided" });
        }

        const client_id = process.env.META_APP_ID;
        const client_secret = process.env.META_APP_SECRET;
        const redirect_uri = "https://amaschine.vercel.app/api/meta-auth";

        const tokenUrl =
            `https://graph.facebook.com/v19.0/oauth/access_token?` +
            `client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}` +
            `&client_secret=${client_secret}&code=${code}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Token Error:", tokenData);
            return res.status(400).send(`
                <html>
                <script>
                    window.opener.postMessage(
                        { type: "meta-auth-error", error: "${JSON.stringify(tokenData.error)}" },
                        "*"
                    );
                    window.close();
                </script>
                <body>Fehler beim Login</body>
                </html>
            `);
        }

        const accessToken = tokenData.access_token;

        return res.status(200).send(`
            <html>
            <head><title>Meta Login</title></head>
            <script>
                console.log("Sending token to parent...");
                window.opener.postMessage(
                    { type: "meta-auth-success", accessToken: "${accessToken}" },
                    "*"
                );
                setTimeout(() => window.close(), 1000);
            </script>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h2>✅ Meta Login erfolgreich!</h2>
                <p>Dieses Fenster wird automatisch geschlossen...</p>
            </body>
            </html>
        `);
    } catch (e) {
        console.error("Server Error:", e);
        res.status(500).json({ error: "Server error", details: e.message });
    }
}
```

---

## 3️⃣ **Vercel Environment Variables checken**

Gehe zu: **Vercel Dashboard → Dein Projekt → Settings → Environment Variables**

Stelle sicher, dass diese **3 Variablen** gesetzt sind:
```
META_APP_ID = 732040642590155
META_APP_SECRET = dein_geheimes_secret
META_DEFAULT_AD_ACCOUNT = deine_werbekonto_id
```

💡 **Wo findest du dein Secret?**
- Gehe zu https://developers.facebook.com/apps/
- Wähle deine App
- Settings → Basic → App Secret (anzeigen)

---

## 4️⃣ **Meta App Settings prüfen**

Gehe zu: https://developers.facebook.com/apps/732040642590155/settings/basic/

### ✅ Check diese Punkte:

**A) Valid OAuth Redirect URIs:**
```
https://amaschine.vercel.app/api/meta-auth
```

**B) App Domains:**
```
amaschine.vercel.app
