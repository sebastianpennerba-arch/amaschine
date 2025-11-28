// packages/campaigns/index.js
// Public API für Campaigns View (P3).

import { buildCampaignsState } from "./campaigns.compute.js";
import { renderCampaigns } from "./campaigns.render.js";

const CampaignsPackage = {
    _filters: {
        search: "",
        status: "all"
    },

    init() {
        console.debug("[CampaignsPackage] init()");
        this._initFilterControls();
    },

    async render(options = {}) {
        const { connected } = options;
        const state = await buildCampaignsState({
            connected,
            filters: this._filters
        });

        renderCampaigns(state);
    },

    async update(options = {}) {
        if (options.filters) {
            this._filters = { ...this._filters, ...options.filters };
        }
        return this.render({ connected: options.connected });
    },

    destroy() {
        console.debug("[CampaignsPackage] destroy()");
    },

    _initFilterControls() {
        const searchInput = document.getElementById("campaignSearch");
        const statusSelect = document.getElementById("campaignStatusFilter");

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this._filters.search = e.target.value || "";
                this.update({ connected: true });
            });
        }

        if (statusSelect) {
            statusSelect.addEventListener("change", (e) => {
                this._filters.status = e.target.value || "all";
                this.update({ connected: true });
            });
        }
    }
};

Object.freeze(CampaignsPackage);

export default CampaignsPackage;
