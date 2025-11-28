// campaigns.js
// Legacy-Shim, kompatibel zu app.js

import CampaignsPackage from "./packages/campaigns/index.js";

export function updateCampaignsView(connected) {
    return CampaignsPackage.render({ connected });
}

export function initCampaigns() {
    if (CampaignsPackage.init) CampaignsPackage.init();
}
