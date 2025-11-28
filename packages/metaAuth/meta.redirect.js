// packages/metaAuth/meta.redirect.js
// Handhabt den OAuth Redirect Flow (?code=...) inkl. Popup-Fix.

import { showToast } from "../../uiCore.js";
import { META_OAUTH_CONFIG } from "../../state.js";
import { exchangeMetaCodeForToken } from "../../metaApi.js";

/**
 * Liest ?code=... aus der URL aus und tauscht ihn gegen einen Meta Token.
 * Ruft onToken(token) auf, wenn alles erfolgreich war.
 *
 * Rückgabe:
 *  - false  → kein code in der URL
 *  - true   → Redirect wurde verarbeitet (erfolgreich oder Fehler)
 */
export async function handleMetaOAuthRedirectCore({ onToken } = {}) {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    if (!code) return false;

    // Code aus der URL entfernen
    window.history.replaceState({}, "", "/");
    showToast("Token wird abgeholt…", "info");

    try {
        const token = await exchangeMetaCodeForToken(
            code,
            META_OAUTH_CONFIG.redirectUri
        );

        if (!token) {
            showToast("OAuth Fehler", "error");
            return true;
        }

        if (typeof onToken === "function") {
            await onToken(token);
        }

        showToast("Meta verbunden!", "success");

        // Popup-Fix: wenn wir im Popup sind, Parent refreshen + schließen
        if (window.opener) {
            window.opener.location.reload();
            window.close();
        }
    } catch (e) {
        console.error("Meta OAuth Redirect Error:", e);
        showToast("Verbindung fehlgeschlagen", "error");
    }

    return true;
}
