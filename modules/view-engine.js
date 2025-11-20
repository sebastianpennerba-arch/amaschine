/* ===========================================================
   SignalOne.cloud – SPA View Engine (PRO VERSION)
   Routing + ViewLoader + RenderHooks
   =========================================================== */

window.ViewEngine = {};

// Speicherort für alle Renderer
ViewEngine.renderers = {};

/* ===========================================================
   1) HTML-VIEW LADEN
   =========================================================== */
ViewEngine.loadHTML = async function (view) {
  const container = document.getElementById("view-container");

  if (!container) return;

  try {
    const html = await fetch(`/views/${view}.html`).then((r) => r.text());
    container.innerHTML = html;
  } catch (err) {
    console.error("Fehler beim Laden des HTML:", err);
    container.innerHTML = `
      <div style="padding:20px; color:#c00;">
        ⚠️ View '${view}' konnte nicht geladen werden.
      </div>`;
  }
};

/* ===========================================================
   2) VIEW MIT RENDER-FUNKTION LADEN
   =========================================================== */
ViewEngine.loadView = async function (view) {
  await ViewEngine.loadHTML(view);

  // passenden Renderer ausführen, wenn vorhanden
  if (ViewEngine.renderers[view]) {
    try {
      ViewEngine.renderers[view](window.SignalState || {});
    } catch (err) {
      console.error("Renderfehler in View:", view, err);
    }
  }

  ViewEngine.highlightMenu(view);
};

/* ===========================================================
   3) NAVIGATION / MENU ACTIVE
   =========================================================== */
ViewEngine.highlightMenu = function (view) {
  document.querySelectorAll(".menu-item").forEach((i) => {
    i.classList.toggle("active", i.dataset.view === view);
  });
};

/* ===========================================================
   4) HASH ROUTER
   =========================================================== */
function getView() {
  const hash = window.location.hash.replace("#", "").trim();
  return hash || "dashboard";
}

function handleHashChange() {
  const view = getView();
  ViewEngine.loadView(view);
}

window.addEventListener("hashchange", handleHashChange);

/* ===========================================================
   5) INITIALISIERUNG
   =========================================================== */
window.addEventListener("DOMContentLoaded", () => {
  // Menu Klick → Hash setzen
  document.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      const v = item.dataset.view;
      if (v) location.hash = v;
    });
  });

  // erste View laden
  handleHashChange();
});

/* ===========================================================
   6) REGISTRIERTE RENDERER
   =========================================================== */

// Dashboard
ViewEngine.renderers["dashboard"] = function (state) {
  console.log("Dashboard Renderer läuft", state);
};

// Creatives
ViewEngine.renderers["creatives"] = function (state) {
  console.log("Creatives Renderer läuft", state);
};

// Campaigns
ViewEngine.renderers["campaigns"] = function (state) {
  console.log("Campaigns Renderer läuft", state);
};

// Insights
ViewEngine.renderers["insights"] = function (state) {
  console.log("Insights Renderer läuft", state);
};

// Library
ViewEngine.renderers["library"] = function (state) {
  console.log("Library Renderer läuft", state);
};

// Reports
ViewEngine.renderers["reports"] = function (state) {
  console.log("Reports Renderer läuft", state);
};

// Profile
ViewEngine.renderers["profile"] = function (state) {
  console.log("Profile Renderer läuft", state);
};

// Pricing
ViewEngine.renderers["pricing"] = function (state) {
  console.log("Pricing Renderer läuft", state);
};

// Connections
ViewEngine.renderers["connections"] = function (state) {
  console.log("Connections Renderer läuft", state);
};
