// shared/compute.js
// Gemeinsame Berechnungs-Helfer (ROAS, CTR, CPM etc.)

export function computeRoas(revenue, spend) {
    if (!spend || spend === 0 || spend == null) return null;
    return Number(revenue || 0) / Number(spend);
}

export function computeCtr(clicks, impressions) {
    if (!impressions || impressions === 0 || impressions == null) return null;
    return (Number(clicks || 0) / Number(impressions)) * 100;
}

export function computeCpm(spend, impressions) {
    if (!impressions || impressions === 0 || impressions == null) return null;
    return (Number(spend || 0) / Number(impressions)) * 1000;
}
