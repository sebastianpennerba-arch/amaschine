// packages/metaAuth/index.js
// MetaAuth Gateway – kapselt Meta OAuth, Token-Handling & Disconnect-Flow

import { AppState } from "../../state.js";
import { fetchMetaUser } from "../../metaApi.js";
import { openMetaLoginPopup } from "./meta.popup.js";
import {
    loadPersistedMetaToken,
    persistMetaToken,
    clearPersistedMetaToken
} from "./meta.token.js";
import { applyTokenToState, hardDisconnectMeta } from "./meta.connection.js";
import { handleMetaOAuthRedirectCore } from "./meta.redirect.js";

const MetaAuth = {
    /**
     * Initialisiert die Meta-Verbindung:
     * 1) Token aus Storage laden (falls vorhanden)
     * 2) User nachladen
     * 3) OAuth-Redirect auswerten (falls code vorhanden)
     */
    async init({
        clearMetaCache,
        onAfterTokenRestore,
        onAfterConnect,
        onAfterDisconnect // aktuell nur dokumentiert, wird beim disconnect genutzt
    } = {}) {
        this._callbacks = {
            clearMetaCache,
            onAfterTokenRestore,
            onAfterConnect,
            onAfterDisconnect
        };

        // 1) Token aus localStorage wiederherstellen
        const stored = loadPersistedMetaToken();
        if (stored) {
            applyTokenToState(stored);
            try {
                const user = await fetchMetaUser(stored);
                AppState.meta.user = user;
            } catch (e) {
                console.warn("Meta user fetch failed for stored token", e);
            }
            if (typeof clearMetaCache === "function") clearMetaCache();
            if (typeof onAfterTokenRestore === "function") {
                await onAfterTokenRestore(stored);
            }
        }

        // 2) OAuth Redirect (code=...) behandeln
        await handleMetaOAuthRedirectCore({
            async onToken(token) {
                applyTokenToState(token);
                persistMetaToken(token);
                if (typeof clearMetaCache === "function") clearMetaCache();
                try {
                    const user = await fetchMetaUser(token);
                    AppState.meta.user = user;
                } catch (e) {
                    console.warn("Meta user fetch failed after OAuth", e);
                }
                if (typeof onAfterConnect === "function") {
                    await onAfterConnect(token);
                }
            }
        });
    },

    connectWithPopup() {
        openMetaLoginPopup();
    },

    /**
     * Trennt die Meta-Verbindung komplett (State + localStorage).
     */
    disconnect({ clearMetaCache, onAfterDisconnect } = {}) {
        hardDisconnectMeta();
        clearPersistedMetaToken();
        if (typeof clearMetaCache === "function") clearMetaCache();
        if (typeof onAfterDisconnect === "function") {
            onAfterDisconnect();
        } else if (this._callbacks?.onAfterDisconnect) {
            this._callbacks.onAfterDisconnect();
        }
    }
};

Object.freeze(MetaAuth);

export default MetaAuth;
