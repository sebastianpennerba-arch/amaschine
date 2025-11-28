// packages/campaigns/campaigns.filters.js
// Filter & Search für Campaigns View.

export function applyCampaignFilters(campaigns, filters) {
    if (!Array.isArray(campaigns)) return [];

    const search = (filters.search || "").toLowerCase();
    const statusFilter = filters.status || "all";

    let list = campaigns.filter((c) => {
        if (statusFilter !== "all" && c.status !== statusFilter) return false;

        if (!search) return true;

        return (
            (c.name || "").toLowerCase().includes(search) ||
            (c.objective || "").toLowerCase().includes(search)
        );
    });

    // Default: sort by spend desc
    list = list.sort((a, b) => (b.spend || 0) - (a.spend || 0));

    return list;
}
