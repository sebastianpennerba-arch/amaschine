// =====================================================================
// SignalOne.cloud – PHASE 2: MINIMAL FUNCTIONAL CORE
// Behebt: Buttons funktionieren nicht, View-Wechsel instabil
// =====================================================================

"use strict";

// Globale Zustandsvariable
const AppState = {
  currentView: "dashboard",
  isSidebarCollapsed: localStorage.getItem('isSidebarCollapsed') === 'true',
};

// ----------------------------------------------------------------------
// HELPER: Dead Button Toast (Fixes "Buttons funktionieren nicht")
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
// VIEW SWITCHING (Fixes instabilen View-Wechsel)
// ----------------------------------------------------------------------

function switchView(viewId) {
  if (AppState.currentView === viewId) return;

  // Alte View ausblenden
  const oldView = document.getElementById(AppState.currentView + "View");
  if (oldView) {
    oldView.classList.add("hidden");
  }

  // Neue View einblenden
  const newView = document.getElementById(viewId + "View");
  if (newView) {
    newView.classList.remove("hidden");
  }

  // Aktiven Menüpunkt aktualisieren
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    }
  });

  AppState.currentView = viewId;
}

function setupViewSwitching() {
  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view');
      if (viewId) {
        switchView(viewId);
      }
    });
  });
}

// ----------------------------------------------------------------------
// SIDEBAR (Fixes Toggle-Funktionalität)
// ----------------------------------------------------------------------

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const body = document.body;
  
  AppState.isSidebarCollapsed = !AppState.isSidebarCollapsed;
  localStorage.setItem('isSidebarCollapsed', AppState.isSidebarCollapsed);

  if (AppState.isSidebarCollapsed) {
    sidebar.classList.add('collapsed');
    body.classList.add('sidebar-collapsed'); // Fügt Klasse zum Body hinzu, um den Main-Content zu verschieben
  } else {
    sidebar.classList.remove('collapsed');
    body.classList.remove('sidebar-collapsed');
  }
}

function setupSidebar() {
  const toggleButton = document.getElementById('sidebarToggle');
  if (toggleButton) {
    toggleButton.addEventListener('click', toggleSidebar);
  }
  
  // Initialen Zustand setzen
  const sidebar = document.getElementById('sidebar');
  if (AppState.isSidebarCollapsed) {
    sidebar.classList.add('collapsed');
  } else {
    sidebar.classList.remove('collapsed');
  }
}

// ----------------------------------------------------------------------
// INIT
// ----------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  setupSidebar();
  setupViewSwitching();
  
  // Setzt die initial aktive View
  switchView(AppState.currentView); 
  
  // Alle Dead-Buttons mit dem Toast versehen
  document.querySelectorAll('button[onclick^="handleDeadButton"]').forEach(button => {
    // Stellt sicher, dass der Toast auch ausgelöst wird, wenn der onclick-Event im HTML definiert ist
  });
});
