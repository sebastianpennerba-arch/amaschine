// api/meta/oauth/token-debug.js
//
// Debug-Version der Meta OAuth Token Exchange Route
// Gibt ALLES aus: ENV-Variablen, empfangene Daten, Meta Response, redirectUri usw.

module.exports = async function handler(req, res) {
    // Nur POST
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { code, redirectUri } = req.body || {};

        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const serverRedirect = process.env.META_OAUTH_REDIRECT_URI;

        // ========== DEBUG OUTPUT ==========
        const debugInfo = {
            receivedFromFrontend: {
                code,
                redirectUri
            },
            serverEnv: {
                META_APP_ID: appId || null,
                META_APP_SECRET_PRESENT: appSecret ? true : false,
                META_OAUTH_REDIRECT_URI: serverRedirect || null
            },
            serverRuntime: {
                nodeVersion: process.version,
                platform: process.platform,
                endpoint: "token-debug"
            },
            warnings: []
        };

        if (!code) debugInfo.warnings.push("No OAuth 'code' received from frontend.");
        if (!redirectUri) debugInfo.warnings.push("No redirectUri received from frontend.");
        if (!serverRedirect) debugInfo.warnings.push("META_OAUTH_REDIRECT_URI missing in Vercel ENV.");
        if (!appId) debugInfo.warnings.push("META_APP_ID missing in Vercel ENV.");
        if (!appSecret) debugInfo.warnings.push("META_APP_SECRET missing in Vercel ENV.");

        // Wenn essentielle ENV fehlen → sofort zurück (inkl. Debug)
        if (!appId || !appSecret || !serverRedirect) {
            return res.status(500).json({
                error: "Missing ENV Variables",
                debug: debugInfo
            });
        }

        // ========== Meta Token Exchange Request ==========
        const params = new URLSearchParams({
            client_id: appId,
            client_secret: appSecret,
            redirect_uri: redirectUri || serverRedirect,
            code: code
        });

        const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?${params.toString()}`;

        // Meta Call
        const metaResponse = await fetch(tokenUrl);
        const metaJson = await metaResponse.json();

        // ========== Meta Response speichern ==========
        debugInfo.metaResponse = {
            status: metaResponse.status,
            ok: metaResponse.ok,
            body: metaJson
        };

        // Falls Meta Fehler liefert → gib Debug inkl. Meta zurück
        if (!metaResponse.ok) {
            return res.status(400).json({
                error: "Meta token exchange failed",
                debug: debugInfo
            });
        }

        // Erfolg
        return res.status(200).json({
            success: true,
            message: "Token exchange successful",
            debug: debugInfo
        });

    } catch (error) {
        return res.status(500).json({
            error: "Unexpected Server Error",
            details: error.toString()
        });
    }
};
