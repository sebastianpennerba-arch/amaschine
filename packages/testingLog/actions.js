// packages/testing/testing.actions.js
// Add, remove, clear actions

import { saveTestingState } from "./testing.compute.js";

let buffer = null;

function ensureBuffer() {
    if (!buffer) {
        try {
            const raw = localStorage.getItem("signalone_testing_log_v1");
            buffer = raw ? JSON.parse(raw) : [];
        } catch {
            buffer = [];
        }
    }
    return buffer;
}

export function addTestingEntry(entry) {
    const list = ensureBuffer();
    list.unshift(entry);
    saveTestingState(list);
}

export function clearTestingEntries() {
    buffer = [];
    saveTestingState([]);
}
