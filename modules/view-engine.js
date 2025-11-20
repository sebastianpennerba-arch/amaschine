/* ===========================================================
   SignalOne.cloud – Lightweight View Engine / Router
   Nutzt den bestehenden ViewLoader aus app.js
   =========================================================== */

(function () {
  // Hilfsfunktion: aktuellen View aus dem Hash lesen
  function getViewFromHash() {
    const hash = window.location.hash || "";
    const view = hash.replace("#", "").trim();
    return view || "dashboard";
  }

  // Sidebar-Active-State aktualisieren
  function highlightMenu(view) {
    document.querySelectorAll(".menu-item").forEach((item) => {
      const itemView = item.getAttribute("data-view");
      item.classList.toggle("active", itemView === view);
    });
  }

  // Zentraler Loader: delegiert an ViewLoader aus app.js
  function loadView(view) {
    if (!view) view = "dashboard";

    // Sicherstellen, dass ViewLoader existiert
    if (window.ViewLoader && typeof window.ViewLoader.loadView === "function") {
      try {
        window.ViewLoader.loadView(view);
      } catch (err) {
        console.error("Fehler beim Laden der View über ViewLoader:", err);
      }
    } else {
      console.warn("ViewLoader noch nicht verfügbar – warte auf app.js");
    }

    highlightMenu(view);
  }

  // Wird bei Hash-Wechsel aufgerufen
  function handleHashChange() {
    const view = getViewFromHash();
    loadView(view);
  }

  // Initialisierung nach DOM-Ladung
  function initRouter() {
    // Klicks auf Sidebar-Menü: Hash setzen
    document.querySelectorAll(".menu-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        const view = item.getAttribute("data-view");
        if (!view) return;

        // Hash nur ändern, wenn nötig
        const newHash = "#" + view;
        if (window.location.hash !== newHash) {
          window.location.hash = newHash;
        } else {
          // Wenn der Hash gleich bleibt, trotzdem View neu laden
          handleHashChange();
        }
      });
    });

    // Initialen Hash auswerten (direkte Deep-Links wie /#pricing)
    handleHashChange();
  }

  // Events registrieren
  window.addEventListener("hashchange", handleHashChange);
  window.addEventListener("DOMContentLoaded", initRouter);
})();
