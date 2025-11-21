// =====================================================================
// SignalOne.cloud – V9.0: MINIMAL FUNCTIONAL CORE
// Fokus: View-Wechsel und Toast-Meldungen
// =====================================================================

"use strict";

// Globale Zustandsvariable
const AppState = {
  currentView: "dashboard",
};

// ----------------------------------------------------------------------
// HELPER: Dead Button Toast 
// ----------------------------------------------------------------------

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-Entfernung
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener('transitionend', () => toast.remove());
  }, 2500);
}

function handleDeadButton(featureName) {
  showToast(`${featureName} ist in Vorbereitung (Demo-Modus).`);
}


// ----------------------------------------------------------------------
// VIEW SWITCHING 
// ----------------------------------------------------------------------

function switchView(viewId) {
  if (AppState.currentView === viewId) return; 

  const newView = document.getElementById(viewId + "View");
  const oldView = document.getElementById(AppState.currentView + "View");
  
  if (oldView) {
    oldView.classList.add("hidden");
  }

  if (newView) {
    newView.classList.remove("hidden");
    AppState.currentView = viewId;
  }
  
  // Menü-Active-Status aktualisieren
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    }
  });
}

function setupViewSwitching() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      switchView(viewId);
    });
  });
}

// ----------------------------------------------------------------------
// INIT
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  setupViewSwitching();
  
  // Setzt die initial aktive View
  switchView(AppState.currentView); 
  
  // Dummy-Zeit aktualisieren (Optional)
  const timeElement = document.getElementById('currentTime');
  if (timeElement) {
    timeElement.textContent = `Zeit: ${new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  }
});
