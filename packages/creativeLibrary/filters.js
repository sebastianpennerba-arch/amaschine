/*
 * Creative Library Filters
 * Kapselt Filter- und Sortierlogik für die Creatives.
 */

export function createDefaultFilters() {
  return {
    search: "",
    tag: "",
    type: "",
    status: "",
    sort: "score_desc", // score_desc, roas_desc, roas_asc, spend_desc, ctr_desc
  };
}

export function applyFiltersAndSort(creatives, filters) {
  let list = [...creatives];
  const search = (filters.search || "").trim().toLowerCase();

  // Filter: Tag
  if (filters.tag) {
    list = list.filter((c) => c.tags?.includes(filters.tag));
  }

  // Filter: Type
  if (filters.type) {
    list = list.filter((c) => c.type === filters.type);
  }

  // Filter: Status
  if (filters.status) {
    list = list.filter((c) => c.status === filters.status);
  }

  // Filter: Search (Titel, Creator, Kampagne, Hook)
  if (search) {
    list = list.filter((c) => {
      const haystack = [
        c.title,
        c.creator,
        c.campaignName,
        c.hook,
        (c.tags || []).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }

  // Sortierung
  list.sort((a, b) => {
    switch (filters.sort) {
      case "roas_desc":
        return b.roas - a.roas;
      case "roas_asc":
        return a.roas - b.roas;
      case "spend_desc":
        return b.spend - a.spend;
      case "ctr_desc":
        return b.ctr - a.ctr;
      case "score_asc":
        return a.score - b.score;
      case "score_desc":
      default:
        return b.score - a.score;
    }
  });

  return list;
}
