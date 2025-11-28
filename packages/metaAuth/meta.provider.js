// packages/metaAuth/meta.provider.js
// Baut die Meta OAuth URL aus der zentralen Konfiguration.

import { META_OAUTH_CONFIG } from "../../state.js";

export function buildMetaOAuthUrl() {
    return (
        "https://www.facebook.com/v21.0/dialog/oauth?" +
        new URLSearchParams({
            client_id: META_OAUTH_CONFIG.appId,
            redirect_uri: META_OAUTH_CONFIG.redirectUri,
            response_type: "code",
            scope: META_OAUTH_CONFIG.scopes
        }).toString()
    );
}
