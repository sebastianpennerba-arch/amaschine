// packages/creativeLibrary/index.js
// Zentrale API für die Creative Library (P2).

import { buildCreativeLibraryState } from "./creativeLibrary.compute.js";
import { renderCreativeLibrary } from "./creativeLibrary.render.js";
import { attachCreativeCardHandlers, initCreativeDeepDive } from "./creativeLibrary.sections.js";

const CreativesPackage = {
    _filters: {
        search: "",
        type: "all",
        sort: "roas_desc",
        groupBy: "none"
    },

    init() {
        console.debug("[CreativesPackage] init()");
        this._initFilterControls();
        initCreativeDeepDive();
    },

    async render(options = {}) {
        const { connected } = options;
        const state = await buildCreativeLibraryState({
            connected,
            filters: this._filters
        });

        renderCreativeLibrary(state);
        attachCreativeCardHandlers(state.items);
    },

    async update(options = {}) {
        // Optionale Überschreibung der Filter aus Optionen
        if (options.filters) {
            this._filters = { ...this._filters, ...options.filters };
        }
        return this.render({ connected: options.connected });
    },

    destroy() {
        console.debug("[CreativesPackage] destroy()");
    },

    _initFilterControls() {
        const searchInput = document.getElementById("creativeSearch");
        const typeSelect = document.getElementById("creativeType");
        const sortSelect = document.getElementById("creativeSort");
        const groupSelect = document.getElementById("creativeGroupBy");

        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this._filters.search = e.target.value || "";
                this.update({ connected: true });
            });
        }

        if (typeSelect) {
            typeSelect.addEventListener("change", (e) => {
                this._filters.type = e.target.value || "all";
                this.update({ connected: true });
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                this._filters.sort = e.target.value || "roas_desc";
                this.update({ connected: true });
            });
        }

        if (groupSelect) {
            groupSelect.addEventListener("change", (e) => {
                this._filters.groupBy = e.target.value || "none";
                this.update({ connected: true });
            });
        }
    }
};

Object.freeze(CreativesPackage);

export default CreativesPackage;
