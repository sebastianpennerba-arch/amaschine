// packages/creatives/creatives.filters.js
// Filter-/Sort-Steuerung für Creative Library

let filtersInitialized = false;

export function getCreativeFilterState() {
    const search =
        document.getElementById("creativeSearch")?.value?.toLowerCase() || "";
    const sort = document.getElementById("creativeSort")?.value || "roas_desc";
    const typeFilter =
        document.getElementById("creativeType")?.value || "all";
    const groupBy =
        document.getElementById("creativeGroupBy")?.value || "none";

    return { search, sort, typeFilter, groupBy };
}

export function initCreativeLibraryFilters(onChange) {
    if (filtersInitialized) return;
    filtersInitialized = true;

    const ids = [
        "creativeSearch",
        "creativeSort",
        "creativeType",
        "creativeGroupBy"
    ];

    ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener("input", () => onChange());
        el.addEventListener("change", () => onChange());
    });
}
