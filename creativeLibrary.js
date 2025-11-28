// creativeLibrary.js
// Legacy-Shim: leitet die alte API auf das neue Creative Library Package um.
// Wichtig: Dieses File bleibt die EINZIGE Stelle, über die app.js die Creative Library ansteuert.

import CreativesPackage from "./packages/creativeLibrary/index.js";

/**
 * Alte öffentliche API für die Creative Library.
 * Wird jetzt intern über das Creative Library Package gerendert.
 * 
 * Erwartet: `connected` = true/false (Meta verbunden?)
 */
export async function updateCreativeLibraryView(connected) {
    return CreativesPackage.render({ connected });
}

/**
 * Optionaler Init-Hook, falls wir später mal
 * frühe Event-Listener o.ä. brauchen.
 * Aktuell nur ein sauberer Durchreicher.
 */
export function initCreativeLibrary() {
    if (typeof CreativesPackage.init === "function") {
        CreativesPackage.init();
    }
}
