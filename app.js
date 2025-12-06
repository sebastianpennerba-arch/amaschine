// Basic View / Nav / Modal / Toast & Meta-OAuth Simulation  
// -------------------------------------------

// Simulierter Auth-Token Check  
function ensureAuthToken() {
  const token = localStorage.getItem("metaToken");
  if (!token) {
    throw new Error("Nicht authentifiziert. Meta-Token fehlt.");
  }
  return token;
}

// Sidebar Navigation Definition  
const navConfig = [
  { id: "dashboard", label: "Dashboard", icon: "icon-dashboard" },
  { id: "creatives", label: "Creatives", icon: "icon-creative" },
  { id: "campaigns", label: "Campaigns", icon: "icon-campaign" },
  { id: "sensei", label: "Sensei", icon: "icon-sensei" },
  { id: "academy", label: "Academy", icon: "icon-academy" },
  { section: "tools", label: "TOOLS", items: [
      { id: "tool1", label: "Tool 1", icon: "icon-tool1" },
      { id: "tool2", label: "Tool 2", icon: "icon-tool2" }
    ]},
  { section: "settings", label: "Einstellungen", items: [
      { id: "profile", label: "Profil", icon: "icon-user" },
      { id: "prefs", label: "Preferences", icon: "icon-settings" }
    ]}
];

// Helper: Create SVG icon (placeholder)  
function createIconElement(iconName) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
  svg.setAttribute("class", "sidebar-btn-icon");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.innerHTML = `
    <path class="icon-layer-fill" d="M3 3h18v18H3z"></path>
  `;
  return svg;
}

// Render Sidebar Nav  
function renderNav() {
  const nav = document.getElementById("sidebarNav");
  nav.innerHTML = "";

  for (const item of navConfig) {
    if (item.section) {
      const label = document.createElement("div");
      label.className = "sidebar-section-label";
      label.textContent = item.label;
      nav.append(label);

      const group = document.createElement("div");
      group.className = "sidebar-group collapsed";

      for (const sub of item.items) {
        const li = document.createElement("div");
        li.className = "sidebar-nav-item";

        const btn = document.createElement("button");
        btn.className = "sidebar-nav-button sidebar-nav-button-nested";
        btn.setAttribute("data-view", sub.id);

        const icon = createIconElement(sub.icon);
        btn.append(icon);
        btn.append(document.createTextNode(sub.label));

        li.append(btn);
        group.append(li);
      }

      nav.append(group);

      label.addEventListener("click", () => {
        const isOpen = label.classList.toggle("open");
        if (isOpen) {
          group.classList.remove("collapsed");
        } else {
          group.classList.add("collapsed");
        }
      });

    } else {
      const li = document.createElement("div");
      li.className = "sidebar-nav-item";

      const btn = document.createElement("button");
      btn.className = "sidebar-nav-button";
      btn.setAttribute("data-view", item.id);

      const icon = createIconElement(item.icon);
      btn.append(icon);
      btn.append(document.createTextNode(item.label));

      li.append(btn);
      nav.append(li);
    }
  }
}

// View Switch Logic  
function initNavigation() {
  renderNav();
  const btns = document.querySelectorAll(".sidebar-nav-button");
  btns.forEach(btn => {
    btn.addEventListener("click", () => {
      const viewId = btn.getAttribute("data-view") + "View";
      const views = document.querySelectorAll(".view");
      views.forEach(v => v.classList.remove("is-active"));
      const target = document.getElementById(viewId);
      if (target) target.classList.add("is-active");

      // Active-Button Styling  
      btns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

// On Load  
window.addEventListener("DOMContentLoaded", () => {
  initNavigation();
});
