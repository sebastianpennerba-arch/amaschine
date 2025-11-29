// packages/team/index.js
// Block 4 – Team Manager (UI only, Demo Mode)

export function render(root, AppState) {
  // Falls Team-Array nicht existiert: initialisieren
  if (!Array.isArray(AppState.teamMembers)) {
    AppState.teamMembers = [
      {
        id: "owner",
        name: "Account Owner",
        role: "owner",
        email: "owner@signal.one",
      },
    ];
  }

  function avatarFor(name) {
    if (!name) return "U";
    return name
      .split(" ")
      .map((p) => p[0]?.toUpperCase() || "")
      .join("")
      .slice(0, 2);
  }

  function roleBadge(role) {
    if (role === "owner") return `<span class="badge-pill badge-owner">Owner</span>`;
    if (role === "admin") return `<span class="badge-pill badge-admin">Admin</span>`;
    return `<span class="badge-pill badge-analyst">Analyst</span>`;
  }

  function renderList() {
    return AppState.teamMembers
      .map(
        (m) => `
      <tr>
        <td style="display:flex;align-items:center;gap:10px;">
          <div class="team-avatar">${avatarFor(m.name)}</div>
          <div>
            <div>${m.name}</div>
            <div style="font-size:0.75rem;color:#6b7280;">${m.email}</div>
          </div>
        </td>
        <td>${roleBadge(m.role)}</td>
        <td>
          ${
            m.role === "owner"
              ? `<span style="color:#64748b;font-size:0.8rem;">–</span>`
              : `<button class="meta-button team-remove-btn" data-id="${m.id}">
                   <i class="fa-solid fa-user-minus"></i>
                   Entfernen
                 </button>`
          }
        </td>
      </tr>
    `
      )
      .join("");
  }

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Team</h2>
        <p class="view-subtitle">Mitglieder, Rollen & Aktivität</p>
      </div>
      <div class="topbar-status-group">
        <button id="teamInviteBtn" class="meta-button">
          <i class="fa-solid fa-user-plus"></i>&nbsp;Mitglied einladen
        </button>
      </div>
    </div>

    <div class="reports-layout">
      <!-- Linke Seite -->
      <div class="reports-main">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Teammitglieder</div>
              <div class="sensei-card-subtitle">Rollen & Zugriffsrechte</div>
            </div>
          </div>

          <div class="campaign-table-wrapper" style="margin-top:10px;">
            <table class="reports-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Rolle</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody id="teamRows">
                ${renderList()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Rechte Seite -->
      <aside class="reports-sidebar">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Activity Log</div>
              <div class="sensei-card-subtitle">
                Letzte Aktivitäten (Demo)
              </div>
            </div>
          </div>

          <ul style="margin-left:18px;font-size:0.85rem;color:#4b5563;">
            <li>🎯 Owner hat das Konto erstellt</li>
            <li>📊 Owner hat erste Kampagne geladen</li>
            <li>🤖 Sensei Setup wurde aktiviert</li>
            <li>🧪 Erste Testempfehlungen generiert</li>
          </ul>

          <p style="margin-top:8px;font-size:0.78rem;color:#6b7280;">
            Später dynamisch aus Ereignissen (Permission Changes, Exports, Alerts).
          </p>
        </div>
      </aside>
    </div>
  `;

  // ------------ INVITE MODAL ---------------
  const inviteBtn = root.querySelector("#teamInviteBtn");
  if (inviteBtn) {
    inviteBtn.addEventListener("click", () => {
      openInviteModal();
    });
  }

  function openInviteModal() {
    window.SignalOne.openSystemModal(
      "Mitglied einladen",
      `
      <p>Füge ein neues Teammitglied hinzu.</p>

      <div style="margin-top:10px;">
        <label style="font-size:0.8rem;">Name</label>
        <input id="inviteName" class="meta-input" placeholder="Vor- und Nachname" />
      </div>

      <div style="margin-top:10px;">
        <label style="font-size:0.8rem;">E-Mail</label>
        <input id="inviteEmail" class="meta-input" placeholder="person@firma.de" />
      </div>

      <div style="margin-top:10px;">
        <label style="font-size:0.8rem;">Rolle</label>
        <select id="inviteRole" class="meta-input">
          <option value="analyst">Analyst</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div style="margin-top:14px;display:flex;justify-content:flex-end;gap:10px;">
        <button class="sidebar-footer-button" id="inviteCancel">Abbrechen</button>
        <button class="meta-button" id="inviteSubmit">
          <i class="fa-solid fa-paper-plane"></i> Einladen
        </button>
      </div>
    `
    );

    setTimeout(() => {
      const cancel = document.getElementById("inviteCancel");
      const submit = document.getElementById("inviteSubmit");

      cancel.addEventListener("click", window.SignalOne.closeSystemModal);

      submit.addEventListener("click", () => {
        const name = document.getElementById("inviteName").value.trim();
        const email = document.getElementById("inviteEmail").value.trim();
        const role = document.getElementById("inviteRole").value.trim();

        if (!name || !email) {
          window.SignalOne.showToast("Bitte Name & E-Mail ausfüllen.", "warning");
          return;
        }

        AppState.teamMembers.push({
          id: "user_" + Date.now(),
          name,
          email,
          role: role || "analyst",
        });

        window.SignalOne.showToast("Mitglied hinzugefügt (Demo).", "success");
        window.SignalOne.closeSystemModal();

        window.SignalOne.navigateTo("team");
      });
    }, 50);
  }

  // ------------ REMOVE MEMBER ---------------
  const table = root.querySelector("#teamRows");
  if (table) {
    table.addEventListener("click", (e) => {
      if (e.target.closest(".team-remove-btn")) {
        const id = e.target.closest(".team-remove-btn").dataset.id;
        AppState.teamMembers = AppState.teamMembers.filter((m) => m.id !== id);

        window.SignalOne.showToast("Mitglied entfernt (Demo).", "warning");
        window.SignalOne.navigateTo("team");
      }
    });
  }
}
