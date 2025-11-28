// packages/creativeLibrary/creativeLibrary.filters.js
// Filter-, Sort- und Grouping-Engine für die Creative Library
// Wird von index.js aufgerufen, um state.filteredCreatives zu erzeugen.

/**
 * Wendet alle Filter auf die Creative-Liste an:
 * - search
 * - type
 * - groupBy
 * - sort
 */
export function applyCreativeFilters(list, filters) {
    let result = [...list];

    // =============================
    // 1) SEARCH
    // =============================
    if (filters.search && filters.search.trim() !== "") {
        const q = filters.search.toLowerCase();
        result = result.filter((item) => {
            return (
                (item.name || "").toLowerCase().includes(q) ||
                (item.headline || "").toLowerCase().includes(q)
            );
        });
    }

    // =============================
    // 2) TYPE FILTER
    // =============================
    if (filters.type && filters.type !== "all") {
        result = result.filter((item) => item.type === filters.type);
    }

    // =============================
    // 3) SORT
    // =============================
    result = sortCreatives(result, filters.sort);

    // =============================
    // 4) GROUP BY (optional)
    // =============================
    if (filters.groupBy && filters.groupBy !== "none") {
        return groupCreatives(result, filters.groupBy);
    }

    return result;
}

/* ============================================================
   SORTING
============================================================ */

function sortCreatives(list, sort) {
    const sorted = [...list];

    switch (sort) {
        case "roas_desc":
            return sorted.sort((a, b) => b.roas - a.roas);
        case "roas_asc":
            return sorted.sort((a, b) => a.roas - b.roas);

        case "ctr_desc":
            return sorted.sort((a, b) => b.ctr - a.ctr);
        case "ctr_asc":
            return sorted.sort((a, b) => a.ctr - b.ctr);

        case "spend_desc":
            return sorted.sort((a, b) => b.spend - a.spend);
        case "spend_asc":
            return sorted.sort((a, b) => a.spend - b.spend);

        default:
            return sorted;
    }
}

/* ============================================================
   GROUPING
============================================================ */

function groupCreatives(list, key) {
    const groups = {};

    list.forEach((item) => {
        const groupValue = item[key] || "Sonstige";
        if (!groups[groupValue]) groups[groupValue] = [];
        groups[groupValue].push(item);
    });

    // Ergebnis: flach zurückgeben, aber gruppiert via Trenner
    const flattened = [];
    Object.keys(groups).forEach((groupLabel) => {
        flattened.push({
            __group: true,
            label: groupLabel,
            count: groups[groupLabel].length
        });
        flattened.push(...groups[groupLabel]);
    });

    return flattened;
}
