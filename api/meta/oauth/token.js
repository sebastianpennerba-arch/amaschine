// api/meta/oauth/token.js
//
// Tauscht den OAuth "code" von Meta gegen ein Access Token.
// Läuft als Vercel Serverless Function.
// Erwartet POST { code, redirectUri }
//
// Antwort (Frontend-kompatibel):
//   200: { success: true, accessToken, expiresIn, tokenType, adAccounts: [...] }
//   4xx/5xx: { success: false, error: "..." }

export default async function handler(req, res) {
    // Nur POST erlauben
    if (req.method !== "POST") {
        res.setHeader("Allow", "POST");
        return res
            .status(405)
            .json({ success: false, error: "Method not allowed" });
    }

    try {
        const { code, redirectUri } = req.body || {};

        if (!code) {
            return res.status(400).json({
                success: false,
                error: "Missing 'code' in request body."
            });
        }

        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const configuredRedirectUri = process.env.META_OAUTH_REDIRECT_URI;

        if (!appId || !appSecret || !configuredRedirectUri) {
            return res.status(500).json({
                success: false,
                error:
                    "Server misconfigured. META_APP_ID, META_APP_SECRET oder META_OAUTH_REDIRECT_URI fehlen."
            });
        }

        // Redirect URI muss exakt mit der in der Meta App hinterlegten übereinstimmen
        const finalRedirectUri = redirectUri || configuredRedirectUri;

        // 1) code -> access_token
        const tokenParams = new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: finalRedirectUri,
            code: code
        });

        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`;

        const tokenRes = await fetch(tokenUrl);
        const tokenJson = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error("Meta token error:", tokenJson);
            return res.status(400).json({
                success: false,
                error: "Meta token exchange failed",
                meta: tokenJson
            });
        }

        const { access_token, token_type, expires_in } = tokenJson;

        if (!access_token) {
            return res.status(400).json({
                success: false,
                error: "No access_token returned from Meta",
                meta: tokenJson
            });
        }

        // 2) Optional: direkt Ad Accounts laden (für UX)
        let adAccounts = [];
        try {
            const adAccountUrl = new URL(
                "https://graph.facebook.com/v19.0/me/adaccounts"
            );
            adAccountUrl.searchParams.set(
                "fields",
                "id,account_id,name,account_status,timezone_name,currency"
            );
            adAccountUrl.searchParams.set("access_token", access_token);

            const adRes = await fetch(adAccountUrl.toString());
            const adJson = await adRes.json();

            if (adRes.ok && Array.isArray(adJson.data)) {
                adAccounts = adJson.data;
            } else {
                console.warn("Meta adaccounts error:", adJson);
            }
        } catch (err) {
            console.warn("Error fetching adaccounts:", err);
        }

        // 3) Antwort an Frontend
        return res.status(200).json({
            success: true,
            accessToken: access_token,
            expiresIn: expires_in,
            tokenType: token_type,
            adAccounts
        });
    } catch (err) {
        console.error("Unexpected error in /api/meta/oauth/token:", err);
        return res
            .status(500)
            .json({ success: false, error: "Internal server error" });
    }
}
