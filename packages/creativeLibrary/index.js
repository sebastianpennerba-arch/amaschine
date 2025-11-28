// packages/creativeLibrary/index.js
// Zentrale öffentliche API der Creative Library (P2 Final)
// Dieses Modul steuert: Compute → Filters → Render → Sections → Demo Fallback
// und wird ausschließlich über den Legacy-Shim creativeLibrary.js angesprochen.

import { buildCreativeLibraryState } from "./creativeLibrary.compute.js";
import { renderCreativeLibrary } from "./creativeLibrary.render.js";
import { applyCreativeFilters } from "./creativeLibrary.filters.js";
import { renderCreativeDetailsModal } from "./creativeLibrary.sections.js";

const CreativesPackage = {
    _state: {
        connected: false,
        demoMode: true,
        creatives: [],
        filteredCreatives: [],
        filters: {
            search: "",
            type: "all",
            groupBy: "none",
            sort: "roas_desc"
        }
    },

    init() {
        // spätere Erweiterungen (Action Buttons, Infinite Scroll, Lazy Load etc.)
        console.debug("[CreativeLibraryPackage] init()");
        this._attachEventListeners();
    },

    async render({ connected }) {
        const state = await buildCreativeLibraryState({ connected });

        this._state.connected = state.connected;
        this._state.demoMode = state.demoMode;
        this._state.creatives = state.creatives;

        // Filter initial anwenden
        this._state.filteredCreatives = applyCreativeFilters(
            this._state.creatives,
            this._state.filters
        );

        renderCreativeLibrary({
            creatives: this._state.filteredCreatives,
            demoMode: this._state.demoMode
        });
    },

    updateFilters(newFilters = {}) {
        this._state.filters = { ...this._state.filters, ...newFilters };

        this._state.filteredCreatives = applyCreativeFilters(
            this._state.creatives,
            this._state.filters
        );

        renderCreativeLibrary({
            creatives: this._state.filteredCreatives,
            demoMode: this._state.demoMode
        });
    },

    openDetails(creativeId) {
        const item = this._state.creatives.find((c) => c.id === creativeId);
        if (!item) return;
        renderCreativeDetailsModal(item, this._state.demoMode);
    },

    _attachEventListeners() {
        // Search
        const searchInput = document.getElementById("creativeSearch");
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                this.updateFilters({ search: e.target.value.toLowerCase() });
            });
        }

        // Type
        const typeSelect = document.getElementById("creativeType");
        if (typeSelect) {
            typeSelect.addEventListener("change", (e) => {
                this.updateFilters({ type: e.target.value });
            });
        }

        // Group By
        const groupSelect = document.getElementById("creativeGroupBy");
        if (groupSelect) {
            groupSelect.addEventListener("change", (e) => {
                this.updateFilters({ groupBy: e.target.value });
            });
        }

        // Sort
        const sortSelect = document.getElementById("creativeSort");
        if (sortSelect) {
            sortSelect.addEventListener("change", (e) => {
                this.updateFilters({ sort: e.target.value });
            });
        }

        // Delegated click listener für Details
        document.body.addEventListener("click", (e) => {
            const target = e.target.closest("[data-creative-id]");
            if (target) {
                const creativeId = target.getAttribute("data-creative-id");
                this.openDetails(creativeId);
            }
        });
    }
};

Object.freeze(CreativesPackage);
export default CreativesPackage;
