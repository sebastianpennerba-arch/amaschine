/*
 * Team Render
 * Zeigt Team-Mitglieder und ermöglicht das Hinzufügen neuer.
 * Nutzt AppState.teamMembers als zentrale Quelle.
 */

import { addMember } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";

  const heading = document.createElement("h2");
  heading.textContent = "Team";
  container.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "team-list";

  if (!Array.isArray(AppState.teamMembers)) {
    AppState.teamMembers = [];
  }

  if (!AppState.teamMembers.length) {
    const li = document.createElement("li");
    li.textContent = "Noch keine Team-Mitglieder angelegt.";
    list.appendChild(li);
  } else {
    AppState.teamMembers.forEach((member) => {
      const li = document.createElement("li");
      li.textContent = `${member.name} – ${member.role}`;
      list.appendChild(li);
    });
  }

  container.appendChild(list);

  // Form
  const form = document.createElement("div");
  form.className = "team-form";
  form.innerHTML = `
    <h3>Neues Team-Mitglied</h3>
    <input type="text" id="team-name" placeholder="Name" />
    <input type="text" id="team-role" placeholder="Rolle (z. B. Media Buyer)" />
    <button type="button" id="team-add">Hinzufügen</button>
  `;
  form.querySelector("#team-add").onclick = () => {
    const name = form.querySelector("#team-name").value.trim();
    const role = form.querySelector("#team-role").value.trim();
    if (name && role) {
      addMember(AppState, name, role);
      const api = window.SignalOne || {};
      if (typeof api.showToast === "function") {
        api.showToast(`Team-Mitglied "${name}" hinzugefügt.`, "success");
      }
      render(container, AppState);
    }
  };

  container.appendChild(form);

  // Team-Summary
  const summary = document.createElement("p");
  const count = AppState.teamMembers.length;
  summary.textContent = `Team-Größe: ${count} ${
    count === 1 ? "Person" : "Personen"
  }.`;
  container.appendChild(summary);
}
