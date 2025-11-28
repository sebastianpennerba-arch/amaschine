// packages/testing/testing.compute.js
// Local Storage + Demo Mode + State Builder

import { AppState } from "../../state.js";
import { demoTestingLog } from "./testing.demo.js";

const STORAGE_KEY = "signalone_testing_log_v1";

export function buildTestingState({ connected }) {
    const demoMode = !!AppState.settings?.demoMode;

    let items = [];

    if (demoMode || !connected) {
        items = demoTestingLog;
    } else {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) items = JSON.parse(raw);
        } catch (err) {
            console.warn("Testing Log corrupted", err);
        }
    }

    return {
        mode: demoMode ? "demo" : "live",
        items
    };
}

export function saveTestingState(items) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
        console.error("Cannot save testing log", err);
    }
}
