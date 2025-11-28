// shared/helpers.js
// Kleine generische Hilfsfunktionen, wiederverwendbar in allen Paketen.

export function safeGet(obj, path, fallback = null) {
    try {
        return path
            .split(".")
            .reduce((acc, key) => (acc && key in acc ? acc[key] : undefined), obj) ??
            fallback;
    } catch {
        return fallback;
    }
}

export function notEmptyArray(value) {
    return Array.isArray(value) && value.length > 0;
}

export function groupBy(array, keyFn) {
    const map = new Map();
    if (!Array.isArray(array)) return map;

    for (const item of array) {
        const key = keyFn(item);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    }
    return map;
}
