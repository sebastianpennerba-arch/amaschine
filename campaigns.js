// creativeLibrary.js
// Legacy-Shim: leitet die alte API auf das neue Creative Library Package um.

import CreativesPackage from "./packages/creativeLibrary/index.js";

/**
 * Alte öffentliche API für die Creative Library.
 * Wird jetzt intern über das Creative Library Package gerendert.
 */
export async function updateCreativeLibraryView(connected) {
    return CreativesPackage.render({ connected });
}
