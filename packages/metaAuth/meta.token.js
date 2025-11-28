// packages/metaAuth/meta.token.js
// Persistierung des Meta Tokens in localStorage.

const META_TOKEN_STORAGE_KEY = "signalone_meta_token_v1";

export function persistMetaToken(token) {
    try {
        if (token) {
            localStorage.setItem(META_TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(META_TOKEN_STORAGE_KEY);
        }
    } catch {
        // silent
    }
}

export function loadPersistedMetaToken() {
    try {
        const t = localStorage.getItem(META_TOKEN_STORAGE_KEY);
        return t || null;
    } catch {
        return null;
    }
}

export function clearPersistedMetaToken() {
    try {
        localStorage.removeItem(META_TOKEN_STORAGE_KEY);
    } catch {
        // silent
    }
}
