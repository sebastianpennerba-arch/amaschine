export default async function handler(req, res) {
    try {
        const { code } = req.query;

        if (!code) {
            return res.status(400).json({ error: "No ?code provided" });
        }

        const client_id = process.env.META_APP_ID;         // LIVE APP
        const client_secret = process.env.META_APP_SECRET; // LIVE SECRET
        const redirect_uri = "https://amaschine.vercel.app/api/meta-auth";

        const tokenUrl =
            `https://graph.facebook.com/v19.0/oauth/access_token?` +
            `client_id=${client_id}&redirect_uri=${encodeURIComponent(redirect_uri)}` +
            `&client_secret=${client_secret}&code=${code}`;

        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
            console.error("Token Error:", tokenData);
            return res.status(400).json({ error: "Token exchange failed", details: tokenData });
        }

        const accessToken = tokenData.access_token;

        return res.status(200).send(`
            <html>
            <script>
                window.opener.postMessage(
                    { type: "meta-auth-success", accessToken: "${accessToken}" },
                    "*"
                );
                window.close();
            </script>
            <body>Meta Login erfolgreich. Dieses Fenster kann geschlossen werden.</body>
            </html>
        `);
    } catch (e) {
        console.error("Server Error:", e);
        res.status(500).json({ error: "Server error", details: e.message });
    }
}
