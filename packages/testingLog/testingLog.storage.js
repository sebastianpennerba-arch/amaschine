// packages/testingLog/testingLog.storage.js
// Persistence-Schicht (z.B. localStorage) – Stub.

const STORAGE_KEY = "signalone_testing_log_v1";

export function loadTestingLog() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveTestingLog(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries || []));
    } catch {
        // ignore
    }
}
