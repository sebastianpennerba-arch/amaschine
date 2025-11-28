// packages/campaigns/index.js
// Public API für Kampagnen-View

import { renderCampaignsView } from "./campaigns.render.js";

const CampaignsPackage = {
    init(options = {}) {
        console.debug("[CampaignsPackage] init()", options);
    },

    render(options = {}) {
        const { connected } = options;
        renderCampaignsView(connected);
    },

    update(options = {}) {
        return this.render(options);
    },

    destroy() {
        console.debug("[CampaignsPackage] destroy()");
    }
};

Object.freeze(CampaignsPackage);

export default CampaignsPackage;
