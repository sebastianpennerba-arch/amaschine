// packages/data/index.js
// --------------------------------------------------------
// SignalOne DataLayer
// - Zentraler Zugriff für Sensei & Co.
// - Heute: Demo-Creatives voll angebunden + Sensei-Backend
// - Morgen: Live-Meta (Accounts, Kampagnen, Ads) automatisch,
//   sobald AppState.metaConnected + Access Token vorhanden.
// --------------------------------------------------------

import {
  fetchMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaAds,
} from "/metaApi.js";

const API_BASE = "https://signalone-backend.onrender.com/api";

/**
 * Hilfsfunktionen, um globalen Zustand sicher zu lesen.
 */
function getAppState() {
  return window.SignalOne?.AppState || null;
}

function getDemoEnv() {
  const demo = window.SignalOneDemo || {};
  const creatives = demo.BASE_CREATIVES || [];
  const demoData = demo.DemoData || {};
  const campaigns =
    demo.DemoCampaigns ||
    demoData.campaigns ||
    [];

  return { creatives, campaigns, demoData };
}

/**
 * Entscheidet, ob Demo-Mode aktiv ist.
 * - Fallback auf Demo, falls wir keinen AppState haben.
 */
function isDemoMode() {
  const state = getAppState();
  if (!state) return true;

  const fromSettings = !!state.settings?.demoMode;
  const metaConnected = !!state.metaConnected;

  // Hybrid-Logik:
  // - Wenn Demo explizit AN → immer Demo
  // - Wenn Meta NICHT verbunden → Demo
  if (fromSettings) return true;
  if (!metaConnected) return true;

  return false;
}

/**
 * Versucht, einen Meta-Access-Token aus dem AppState zu lesen.
 * (Vorbereitet für spätere, saubere Integration mit deinem Meta-Auth-Flow.)
 */
function resolveMetaToken(state) {
  if (!state) return null;
  if (state.meta?.accessToken) return state.meta.accessToken;
  if (state.meta?.token) return state.meta.token;
  return null;
}

/**
 * Lädt Live-Meta-Daten (Accounts, Ads, Kampagnen), sobald möglich.
 * Aktuell:
 * - Wird nur aktiv, wenn AppState.metaConnected + Token vorhanden.
 * - Sonst wirft diese Funktion, und der aufrufende Code kann auf Demo zurückfallen.
 */
async function loadLiveMetaSnapshot() {
  const state = getAppState();
  if (!state) {
    throw new Error("AppState nicht verfügbar (Live-Meta).");
  }

  const token = resolveMetaToken(state);
  if (!token || !state.metaConnected) {
    throw new Error("Meta Live ist (noch) nicht verbunden.");
  }

  let accounts = Array.isArray(state.meta?.accounts)
    ? state.meta.accounts
    : [];

  // Falls im State nichts liegt, vom Backend ziehen
  if (!accounts.length) {
    accounts = await fetchMetaAdAccounts(token);
    if (!Array.isArray(accounts) || !accounts.length) {
      throw new Error("Keine Meta-Werbekonten gefunden.");
    }
    state.meta = state.meta || {};
    state.meta.accounts = accounts;
  }

  // Account-Auswahl: vorhandene Selection oder 1. Account
  if (!state.selectedAccountId && accounts[0]) {
    state.selectedAccountId = accounts[0].id;
  }

  const accountId = state.selectedAccountId;
  if (!accountId) {
    throw new Error("Kein Meta-Werbekonto ausgewählt.");
  }

  const [ads, campaigns] = await Promise.all([
    fetchMetaAds(accountId, token),
    fetchMetaCampaigns(accountId, token),
  ]);

  return {
    token,
    accountId,
    accounts,
    ads: Array.isArray(ads) ? ads : [],
    campaigns: Array.isArray(campaigns) ? campaigns : [],
  };
}

/**
 * Zentrale Sensei-Analyse:
 * - Nutzt Live-Meta, wenn möglich
 * - Fällt ansonsten sauber auf Demo-Creatives zurück
 * - Ruft immer das echte Backend auf (`/api/sensei/analyze`)
 */
export async function fetchSenseiAnalysis(options = {}) {
  const preferLive = options.preferLive ?? true;

  let creatives = [];
  let campaigns = [];
  let usedMode = "demo";

  if (preferLive && !isDemoMode()) {
    try {
      const live = await loadLiveMetaSnapshot();
      // Backend kann direkt mit Meta-Objekten arbeiten,
      // weil es `entity.insights` usw. versteht.
      creatives = live.ads;
      campaigns = live.campaigns;
      usedMode = "meta";
    } catch (err) {
      console.warn("[DataLayer] Live-Meta nicht nutzbar, fallback auf Demo:", err);
    }
  }

  // Fallback / Default: Demo
  if (!creatives.length) {
    const demoEnv = getDemoEnv();
    creatives = demoEnv.creatives;
    campaigns = demoEnv.campaigns;
    usedMode = "demo";
  }

  const payload = {
    creatives,
    campaigns,
    source: usedMode,
  };

  const res = await fetch(`${API_BASE}/sensei/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    // noop → Fehlerbehandlung unten
  }

  if (!res.ok || !data || data.success === false) {
    const msg =
      data?.error || `Sensei Analyse fehlgeschlagen (HTTP ${res.status})`;
    throw new Error(msg);
  }

  // Wir annotieren, aus welcher Quelle die Daten stammen.
  return {
    ...data,
    _source: usedMode,
  };
}

/**
 * Export als Default-Objekt, damit wir im Frontend flexibel sind:
 *   import DataLayer from "/packages/data/index.js";
 *   DataLayer.fetchSenseiAnalysis(...)
 */
const DataLayer = {
  fetchSenseiAnalysis,
};

export default DataLayer;
