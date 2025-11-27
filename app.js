// ==========================================================
// SignalOne.cloud – app.js (FINAL / FIXED VERSION)
// ==========================================================

// Imports
import {
  exchangeMetaCodeForToken,
  fetchMetaAdAccounts,
  fetchMetaCampaigns,
  fetchMetaCampaignInsights,
  fetchMetaAds,
  fetchMetaUser,
} from "./metaApi.js";

import { AppState } from "./state.js";
import { showToast, setActiveSidebarItem, openModal } from "./uiCore.js";

import { updateDashboardView } from "./dashboard.js";
import { updateCreativeLibraryView } from "./creativeLibrary.js";
import { updateCampaignsView } from "./campaigns.js";
import { updateSenseiView } from "./sensei.js";
import { updateReportsView } from "./reports.js";
import { updateTestingLogView } from "./testingLog.js";

// ==========================================================
// INITIALIZATION
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  console.log("SignalOne app.js loaded.");

  setupSidebarNavigation();
  setupDropdownListeners();
  handleMetaOAuthRedirectIfPresent();

  updateUI();
});

// ==========================================================
// VIEW SYSTEM
// ==========================================================

function showView(id) {
  document.querySelectorAll(".view").forEach((v) => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  AppState.currentView = id;
  updateUI();
}

// Sidebar Navigation
function setupSidebarNavigation() {
  document.querySelectorAll(".sidebar-item").forEach((item) => {
    item.addEventListener("click", () => {
      const view = item.dataset.view;
      if (!view) return;

      setActiveSidebarItem(item);
      showView(view);
    });
  });
}

// ==========================================================
// DROPDOWNS
// ==========================================================

function setupDropdownListeners() {
  const accountDD = document.getElementById("adAccountSelect");
  const campaignDD = document.getElementById("campaignSelect");
  const timeDD = document.getElementById("timeRangeSelect");

  if (accountDD) {
    accountDD.addEventListener("change", async (e) => {
      AppState.selectedAccountId = e.target.value;
      await loadCampaigns();
      await reloadDashboard();
    });
  }

  if (campaignDD) {
    campaignDD.addEventListener("change", (e) => {
      AppState.selectedCampaignId = e.target.value;
      reloadDashboard();
    });
  }

  if (timeDD) {
    timeDD.addEventListener("change", (e) => {
      AppState.timeRangePreset = e.target.value;
      reloadDashboard();
    });
  }
}

// ==========================================================
// META CONNECT
// ==========================================================

document.getElementById("metaConnectBtn")?.addEventListener("click", () => {
  const redirect = window.location.href;
  const metaAuth = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${AppState.config.meta.appId}&redirect_uri=${redirect}&scope=ads_read,read_insights`;
  window.location.href = metaAuth;
});

async function handleMetaOAuthRedirectIfPresent() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  if (!code) return;

  try {
    showToast("Meta Verbindung wird hergestellt...", "info");

    const redirectUri = window.location.origin + window.location.pathname;

    const token = await exchangeMetaCodeForToken(code, redirectUri);
    AppState.meta.accessToken = token;
    AppState.metaConnected = true;

    // Remove ?code from URL
    window.history.replaceState({}, document.title, redirectUri);

    showToast("Erfolgreich mit Meta verbunden!", "success");

    await loadMetaAccountsAndCampaigns();
  } catch (err) {
    console.error(err);
    showToast("Meta Login fehlgeschlagen.", "error");
  }
}

// ==========================================================
// LOAD DATA
// ==========================================================

async function loadMetaAccountsAndCampaigns() {
  try {
    const token = AppState.meta.accessToken;
    if (!token) return;

    // 1) Ad Accounts
    const accounts = await fetchMetaAdAccounts(token);
    AppState.meta.adAccounts = accounts;

    if (accounts.length === 0) {
      showToast("Keine Werbekonten im Meta-Konto gefunden.", "warning");
      updateUI();
      return;
    }

    AppState.selectedAccountId = accounts[0].id;

    // 2) Campaigns
    const campaigns = await fetchMetaCampaigns(AppState.selectedAccountId, token);
    AppState.meta.campaigns = campaigns;

    // 3) Dashboard Reload
    updateUI();
    await reloadDashboard();
  } catch (err) {
    console.error(err);
    showToast("Fehler beim Laden der Meta-Daten.", "error");
  }
}

async function loadCampaigns() {
  try {
    const token = AppState.meta.accessToken;
    const account = AppState.selectedAccountId;
    if (!token || !account) return;

    const campaigns = await fetchMetaCampaigns(account, token);
    AppState.meta.campaigns = campaigns;
    updateUI();
  } catch (err) {
    console.error(err);
    showToast("Kampagnen konnten nicht geladen werden", "error");
  }
}

async function reloadDashboard() {
  updateDashboardView();
  updateSenseiView();
}

// ==========================================================
// UPDATE UI
// ==========================================================

export function updateUI() {
  updateTopBar();
  updateAccountDropdown();
  updateCampaignDropdown();

  const view = AppState.currentView;

  switch (view) {
    case "dashboardView":
      updateDashboardView();
      break;
    case "creativesView":
      updateCreativeLibraryView();
      break;
    case "campaignsView":
      updateCampaignsView();
      break;
    case "senseiView":
      updateSenseiView();
      break;
    case "reportsView":
      updateReportsView();
      break;
    case "testingLogView":
      updateTestingLogView();
      break;
  }
}

// ==========================================================
// TOPBAR UPDATE
// ==========================================================

function updateTopBar() {
  const statusEl = document.getElementById("metaStatusIndicator");
  if (!statusEl) return;

  if (AppState.metaConnected) {
    statusEl.textContent = "Verbunden";
    statusEl.classList.add("connected");
  } else {
    statusEl.textContent = "Nicht verbunden";
    statusEl.classList.remove("connected");
  }
}

// ==========================================================
// ACCOUNT DROPDOWN RENDER
// ==========================================================

function updateAccountDropdown() {
  const dd = document.getElementById("adAccountSelect");
  if (!dd) return;

  dd.innerHTML = "";

  const accounts = AppState.meta.adAccounts || [];

  if (accounts.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Kein Werbekonto gefunden";
    dd.appendChild(opt);
    return;
  }

  accounts.forEach((acc) => {
    const opt = document.createElement("option");
    opt.value = acc.id;
    opt.textContent = `${acc.name} (${acc.id})`;
    if (acc.id === AppState.selectedAccountId) opt.selected = true;
    dd.appendChild(opt);
  });
}

// ==========================================================
// CAMPAIGN DROPDOWN RENDER
// ==========================================================

function updateCampaignDropdown() {
  const dd = document.getElementById("campaignSelect");
  if (!dd) return;

  dd.innerHTML = "";

  const campaigns = AppState.meta.campaigns || [];

  if (campaigns.length === 0) {
    const opt = document.createElement("option");
    opt.textContent = "Keine Kampagnen";
    dd.appendChild(opt);
    return;
  }

  // "Alle Kampagnen"-Option
  const allOpt = document.createElement("option");
  allOpt.value = "ALL";
  allOpt.textContent = "Alle Kampagnen";
  dd.appendChild(allOpt);

  campaigns.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.name}`;
    if (c.id === AppState.selectedCampaignId) opt.selected = true;
    dd.appendChild(opt);
  });
}

// ==========================================================
// EXPORTS
// ==========================================================

export {
  showView,
  loadMetaAccountsAndCampaigns,
  reloadDashboard,
};
