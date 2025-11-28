// packages/creativeLibrary/creativeLibrary.group.js
// Gruppierungslogik (nach Creative, Ad Name, Headline etc.) – Stub.

export function groupCreatives(creatives, _groupByKey) {
    if (!Array.isArray(creatives)) return {};
    // Später: echte Grouping-Implementierung.
    return { all: creatives };
}
