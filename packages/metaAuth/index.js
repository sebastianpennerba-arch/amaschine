// packages/metaAuth/index.js
// MetaAuth Gateway – kapselt Meta OAuth, Token-Handling & Disconnect-Flow
// + Demo-Mode-Gating: wenn Demo aktiv ist, macht MetaAuth NICHTS Richtung Meta.

import { AppState } from "../../state.js";
import { fetchMetaUser } from "../../metaApi.js";
import { openMetaLoginPopup } from "./meta.popup.js";
import {
    loadPersistedMetaToken,
    persistMetaToken,
    clearPersistedMetaToken
} from "./meta.token.js";
import { applyTokenToState, hardDisconnectMeta, ensureMetaState } from "./meta.connection.js";
import { handleMetaOAuthRedirectCore } from "./meta.redirect.js";
import { showToast } from "../../uiCore.js";

const MetaAuth = {
    _callbacks: {
        clearMetaCache: null,
        onAfterTokenRestore: null,
        onAfterConnect: null,
        onAfterDisconnect: null
    },

    /**
     * Initialisiert die Meta-Verbindung:
     * 1) Wenn DemoMode aktiv → KEINE Meta Aktionen, direkt raus
     * 2) Token aus Storage laden (falls vorhanden)
     * 3) User nachladen
     * 4) OAuth-Redirect auswerten (falls code vorhanden)
     */
    async init({
        clearMetaCache,
        onAfterTokenRestore,
        onAfterConnect,
        onAfterDisconnect
    } = {}) {
        this._callbacks = {
            clearMetaCache,
            onAfterTokenRestore,
            onAfterConnect,
            onAfterDisconnect
        };

        ensureMetaState();

        const demoMode = !!AppState.settings?.demoMode;

        // 🔒 DEMO-MODE: MetaAuth wird komplett inert
        if (demoMode) {
            // Demo = bewusst NICHT connected, Views nutzen Demo-Daten
            AppState.metaConnected = false;
            AppState.meta.accessToken = null;
            return;
        }

        // 1) Token aus localStorage wiederherstellen
        const storedToken = loadPersistedMetaToken();
        if (storedToken) {
            applyTokenToState(storedToken);

            try {
                const user = await fetchMetaUser(storedToken);
                AppState.meta.user = user;
            } catch (e) {
                console.warn("Meta user fetch failed for stored token", e);
            }

            if (typeof clearMetaCache === "function") clearMetaCache();
            if (typeof onAfterTokenRestore === "function") {
                await onAfterTokenRestore(storedToken);
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

    /**
     * Öffnet das Meta Login Popup – außer im Demo Mode.
     */
    connectWithPopup() {
        const demoMode = !!AppState.settings?.demoMode;
        if (demoMode) {
            showToast("Demo Mode aktiv – kein echter Meta Login.", "info");
            return;
        }
        openMetaLoginPopup();
    },

    /**
     * Trennt die Meta-Verbindung komplett (State + localStorage).
     * Im Demo Mode ist das effektiv ein No-Op, aber safe.
     */
    disconnect({ clearMetaCache, onAfterDisconnect } = {}) {
        const effectiveClear = clearMetaCache || this._callbacks.clearMetaCache;
        const effectiveAfterDisconnect =
            onAfterDisconnect || this._callbacks.onAfterDisconnect;

        hardDisconnectMeta();
        clearPersistedMetaToken();

        if (typeof effectiveClear === "function") effectiveClear();
        if (typeof effectiveAfterDisconnect === "function") {
            effectiveAfterDisconnect();
        }
    }
};

Object.freeze(MetaAuth);

export default MetaAuth;
