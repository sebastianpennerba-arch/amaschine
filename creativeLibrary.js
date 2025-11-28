// creativeLibrary.js – Legacy-Shim für Kompatibilität
// Die komplette Logik liegt jetzt im CreativesPackage.

import CreativesPackage from "./packages/creatives/index.js";

/**
 * Alte öffentliche API – wird intern auf das Package gemappt.
 */
export async function updateCreativeLibraryView(initialLoad = false) {
    // initialLoad wird aktuell ignoriert, kann aber bei Bedarf vom Package genutzt werden.
    return CreativesPackage.render({ connected: true });
}

/**
 * Optionaler Export, falls irgendwo direkt auf renderCreativeLibrary verwiesen wird.
 */
export function renderCreativeLibrary() {
    return CreativesPackage.render({ connected: true });
}
