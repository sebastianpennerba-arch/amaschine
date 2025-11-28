// packages/testing/index.js
// Public API für das Testing Log (P6-2)

import { buildTestingState } from "./testing.compute.js";
import { renderTestingTable } from "./testing.render.js";
import { addTestingEntry, clearTestingEntries } from "./testing.actions.js";

const TestingPackage = {
    _state: {
        items: []
    },

    init() {
        console.debug("[TestingPackage] init()");
        this._attachControls();
    },

    async render(options = {}) {
        const state = buildTestingState(options);
        this._state = state;
        renderTestingTable(state.items);
    },

    async update(options = {}) {
        return this.render(options);
    },

    destroy() {},

    _attachControls() {
        const addBtn = document.getElementById("testingAddBtn");
        const clearBtn = document.getElementById("testingClearBtn");

        if (addBtn) {
            addBtn.onclick = () => {
                const nameInput = document.getElementById("testingAddName");
                const detailsInput = document.getElementById("testingAddDetails");

                if (!nameInput || !nameInput.value.trim()) return;

                addTestingEntry({
                    name: nameInput.value.trim(),
                    details: detailsInput?.value?.trim() || "",
                    date: new Date().toISOString(),
                    status: "open",
                });

                nameInput.value = "";
                if (detailsInput) detailsInput.value = "";

                this.update({ connected: true });
            };
        }

        if (clearBtn) {
            clearBtn.onclick = () => {
                if (!confirm("Testing Log wirklich löschen?")) return;
                clearTestingEntries();
                this.update({ connected: true });
            };
        }
    }
};

Object.freeze(TestingPackage);

export default TestingPackage;
