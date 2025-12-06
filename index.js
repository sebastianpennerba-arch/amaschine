/**
 * SignalOne – Global Module Entry Point
 * Lädt alle Module, initialisiert Navigation & Views,
 * lädt DemoData, triggert initiales Dashboard.
 */

// -----------------------------------------------------
// 1) Importiere globale Demo-Daten
// -----------------------------------------------------
import { DemoData } from "./demoData.js";

// -----------------------------------------------------
// 2) Importiere alle Package-Module
//    (Dashboard, Creatives, Campaigns, Sensei, Reports…)
// -----------------------------------------------------
import "./packages/dashboard/index.js";
import "./packages/dashboard/render.js";
import "./packages/dashboard/compute.js";

import "./packages/creatives/index.js";
// weitere Module hier ergänzen wie sie existieren:
// import "./packages/campaigns/index.js";
// import "./packages/sensei/index.js";


// -----------------------------------------------------
// 3) VIEW HANDLING – einfache modulare Navigation
// -----------------------------------------------------

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("is-active"));
  const activeView = document.getElementById(viewId);
  if (activeView) activeView.classList.add("is-active");
}

function initNavigation() {
  document.querySelectorAll(".sidebar-nav-button").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-target");
      if (target) showView(target);
    });
  });
}


// -----------------------------------------------------
// 4) INITIAL LOAD
// -----------------------------------------------------

function initSignalOneApp() {
  console.log("🚀 SignalOne Module App gestartet");

  window.SignalOne = {
    DemoData,
  };

  // Views klickbar machen
  initNavigation();

  // Starte Dashboard View
  showView("dashboardView");

  // Loader ausblenden falls vorhanden
  const loader = document.getElementById("globalLoader");
  if (loader) loader.classList.add("hidden");

  console.log("✔ DemoData geladen:", DemoData);
  console.log("✔ Dashboard aktiviert");
}


// -----------------------------------------------------
// 5) Bootstrapping
// -----------------------------------------------------
window.addEventListener("DOMContentLoaded", initSignalOneApp);
