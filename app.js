// =====================================================================
// SignalOne.cloud – PHASE 2: MINIMAL FUNCTIONAL CORE V7
// FIX: ALLE BUTTONS/FUNKTIONEN SIND AKTIV!
// =====================================================================

"use strict";

// Globale Zustandsvariable
const AppState = {
  currentView: "dashboard",
};

// ----------------------------------------------------------------------
// HELPER: Toast System
// ----------------------------------------------------------------------

function showToast(message) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  // Begrenze die Anzahl der Toasts, um Überfüllung zu vermeiden
  if (container.children.length >= 3) {
    container.firstChild.remove();
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  container.appendChild(toast);

  // Auto-Entfernung
  setTimeout(() => {
    toast.classList.add("fade-out");
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000); // 3 Sekunden Sichtbarkeit
}

// ----------------------------------------------------------------------
// FUNKTIONEN FÜR SYSTEM-BUTTONS (AKTIVIERUNG)
// ----------------------------------------------------------------------

function handleSystemAction(actionName) {
  // Simuliert eine Funktion, z.B. das Öffnen eines Modals/Dropdowns
  showToast(`${actionName} wird ausgeführt. Feature-Dialog wird geöffnet...`);
}

// ----------------------------------------------------------------------
// FUNKTIONEN FÜR DROPDOWNS (AKTIVIERUNG)
// ----------------------------------------------------------------------

function handlePlatformChange(selectElement) {
  const selectedText = selectElement.options[selectElement.selectedIndex].text;
  // Simuliert eine Zustandsänderung
  showToast(`✅ PLATFORM-Wechsel erfolgreich: ${selectedText}. Die Datenmatrix wird neu geladen...`);
  // Logik für tatsächliche Datenverarbeitung würde hier folgen
}

function handleAccountChange(selectElement) {
  const selectedText = selectElement.options[selectElement.selectedIndex].text;
  // Simuliert eine Zustandsänderung
  showToast(`✅ WERBEKONTO-Wechsel erfolgreich: ${selectedText}. Daten werden synchronisiert...`);
  // Logik für tatsächliche Datenverarbeitung würde hier folgen
}

// ----------------------------------------------------------------------
// VIEW SWITCHING 
// ----------------------------------------------------------------------

function switchView(viewId) {
  if (AppState.currentView === viewId) return;

  const oldView = document.getElementById(AppState.currentView + "View");
  if (oldView) {
    oldView.classList.add("hidden");
  }

  const newView = document.getElementById(viewId + "View");
  if (newView) {
    newView.classList.remove("hidden");
  }

  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-view') === viewId) {
      item.classList.add('active');
    }
  });

  AppState.currentView = viewId;
  // Optional: Toast bei View-Wechsel
  showToast(`Navigiert zu: ${viewId.charAt(0).toUpperCase() + viewId.slice(1)}`);
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
// INIT & TIME UPDATE (DATUM/UHRZEIT)
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
  
  switchView(AppState.currentView); 

  updateTime();
  setInterval(updateTime, 1000);
});
