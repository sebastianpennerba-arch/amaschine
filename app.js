// =====================================================================
// SignalOne.cloud – PHASE 2: MINIMAL FUNCTIONAL CORE
// Steuert View-Wechsel und Button-Funktionen
// =====================================================================

"use strict";

// Globale Zustandsvariable
const AppState = {
  currentView: "dashboard",
  // Da der Toggle-Button entfernt wurde, entfernen wir auch die collapsed-Logik
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
// INIT & TIME UPDATE
// ----------------------------------------------------------------------

function updateTime() {
    const now = new Date();
    const timeElement = document.getElementById('currentTime');

    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit' };

    if (timeElement) {
        timeElement.textContent = `Zeit: ${now.toLocaleTimeString('de-DE', timeOptions)}`;
    }
}


document.addEventListener("DOMContentLoaded", () => {
  setupViewSwitching();
  
  // Setzt die initial aktive View
  switchView(AppState.currentView); 

  // Startet die Uhr und aktualisiert sie jede Sekunde
  updateTime();
  setInterval(updateTime, 1000);
});
