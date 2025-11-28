/*
 * Brands Compute
 * Verwalten von Marken und Cross-Brand-Analyse.
 */

export function selectBrand(AppState, id) {
  AppState.selectedBrandId = id;
}

/**
 * Dummy-Brand-Stats für Demo-Zwecke.
 * In echter Implementierung kommen diese Daten aus Backend/Meta.
 */
export function getBrandSummary(brandId) {
  switch (brandId) {
    case "brandB":
      return {
        id: "brandB",
        spend: 12100,
        roas: 3.2,
        revenue: 38720,
      };
    case "brandC":
      return {
        id: "brandC",
        spend: 8900,
        roas: 5.9,
        revenue: 52510,
      };
    case "brandA":
    default:
      return {
        id: "brandA",
        spend: 18420,
        roas: 4.8,
        revenue: 88320,
      };
  }
}
