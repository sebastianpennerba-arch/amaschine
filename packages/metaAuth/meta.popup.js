// packages/metaAuth/meta.popup.js
// Öffnet das Meta Login Popup und zeigt Toasts.

import { showToast } from "../../uiCore.js";
import { buildMetaOAuthUrl } from "./meta.provider.js";

export function openMetaLoginPopup() {
    const authUrl = buildMetaOAuthUrl();

    const popup = window.open(
        authUrl,
        "MetaLogin",
        "width=600,height=800,left=200,top=100"
    );

    if (!popup) {
        showToast("Popup blockiert!", "error");
        return null;
    }

    showToast("Meta Login geöffnet…", "info");
    return popup;
}
