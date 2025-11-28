// packages/creativeLibrary/creativeLibrary.filters.js
// Filter- und Suchlogik für Creatives (Struktur).

export function applyCreativeFilters(creatives, _filterOptions = {}) {
    if (!Array.isArray(creatives)) return [];
    // In der späteren Implementierung greifen hier Suche, Typfilter, Grouping etc.
    return creatives;
}
