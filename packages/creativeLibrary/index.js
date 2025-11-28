import {
  renderLibrary,
  setExternalFilters,
  openCreativeDetailById,
} from "./render.js";

export function render(container, AppState) {
  renderLibrary(container, AppState);
}

export function updateFilters(filtersPartial) {
  setExternalFilters(filtersPartial);
}

export function openDetails(creativeId) {
  openCreativeDetailById(creativeId);
}
