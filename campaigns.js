// campaigns.js – Legacy-Shim für Kompatibilität
// Die komplette Logik liegt jetzt im CampaignsPackage.

import CampaignsPackage from "./packages/campaigns/index.js";

/**
 * Alte öffentliche API – wird intern auf das Package gemappt.
 * So bleiben existierende Importe kompatibel.
 */
export function updateCampaignsView(connected) {
    return CampaignsPackage.render({ connected });
}
