// packages/settings/index.js
// Block 4 – Settings Center (Theme, Currency, Cache, Defaults, Developer Mode + DEMO MODE)

export function render(root, AppState) {
  const s = AppState.settings || {};

  root.innerHTML = `
    <div class="view-header">
      <div>
        <h2>Settings</h2>
        <p class="view-subtitle">Grund­einstellungen für dein SignalOne Workspace</p>
      </div>
    </div>

    <div class="reports-layout">
      <div class="reports-main">

        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Darstellung</div>
              <div class="sensei-card-subtitle">Theme & UI Settings</div>
            </div>
          </div>

          <div style="margin-top:12px;">
            <label class="meta-label">Theme</label>
            <select id="setTheme" class="meta-input">
              <option value="light" ${s.theme === "light" ? "selected" : ""}>Light (Empfohlen)</option>
              <option value="titanium" ${s.theme === "titanium" ? "selected" : ""}>Titanium Vision</option>
              <option value="dark" disabled>Dark Mode (Locked)</option>
            </select>
          </div>

          <div style="margin-top:12px;">
            <label class="meta-label">Währung</label>
            <select id="setCurrency" class="meta-input">
              <option value="EUR" ${s.currency === "EUR" ? "selected" : ""}>EUR</option>
              <option value="USD" ${s.currency === "USD" ? "selected" : ""}>USD</option>
              <option value="GBP" ${s.currency === "GBP" ? "selected" : ""}>GBP</option>
            </select>
          </div>

          <div style="margin-top:12px;">
            <label class="meta-label">Standard-Zeitraum</label>
            <select id="setDefaultRange" class="meta-input">
              <option value="last_7_days" ${s.defaultRange === "last_7_days" ? "selected" : ""}>Letzte 7 Tage</option>
              <option value="last_30_days" ${s.defaultRange === "last_30_days" ? "selected" : ""}>Letzte 30 Tage</option>
              <option value="mtd" ${s.defaultRange === "mtd" ? "selected" : ""}>Monat (MTD)</option>
            </select>
          </div>
        </div>

        <div class="report-card" style="margin-top:20px;">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">System & Performance</div>
              <div class="sensei-card-subtitle">Cache & Developer Settings</div>
            </div>
          </div>

          <div style="margin-top:12px;">
            <label class="meta-label">Cache TTL (Sekunden)</label>
            <input id="setCacheTtl" type="number" min="30" max="3600"
                   class="meta-input"
                   value="${s.cacheTtl ?? 300}">
          </div>

          <div style="margin-top:12px;">
            <label style="font-size:0.86rem;">
              <input type="checkbox" id="setDevMode" ${s.devMode ? "checked" : ""}/>
              &nbsp;Developer Mode aktivieren
            </label>
          </div>

          <!-- ⭐ DEMO MODE -->
          <div style="margin-top:12px;">
            <label style="font-size:0.95rem;">
              <input type="checkbox" id="setDemoMode" ${s.demoMode ? "checked" : ""}/>
              &nbsp;<strong>Demo Mode aktivieren (überschreibt Live)</strong>
            </label>
            <p style="font-size:0.75rem;color:#6b7280;margin-top:4px;">
              Falls aktiviert, lädt SignalOne überall Demo-Daten – auch wenn ein Meta Ads Token vorhanden ist.
            </p>
          </div>

        </div>

      </div>

      <aside class="reports-sidebar">
        <div class="report-card">
          <div class="sensei-card-header">
            <div>
              <div class="sensei-card-title">Speichern</div>
              <div class="sensei-card-subtitle">Persistiert in AppState</div>
            </div>
          </div>

          <p style="font-size:0.85rem;color:#4b5563;margin-bottom:12px;">
            Änderungen wirken sofort, einige erfordern ein Neuladen des Moduls.
          </p>

          <button id="settingsSaveBtn" class="meta-button" style="width:100%;justify-content:center;">
            <i class="fa-solid fa-floppy-disk"></i>
            &nbsp;Einstellungen speichern
          </button>

          <p style="margin-top:10px;font-size:0.75rem;color:#6b7280;">
            In späteren Versionen werden diese Werte auch sessionübergreifend gespeichert.
          </p>
        </div>
      </aside>
    </div>
  `;

  const saveBtn = root.querySelector("#settingsSaveBtn");
  saveBtn.addEventListener("click", () => {
    AppState.settings.theme = document.querySelector("#setTheme").value;
    AppState.settings.currency = document.querySelector("#setCurrency").value;
    AppState.settings.defaultRange =
      document.querySelector("#setDefaultRange").value;
    AppState.settings.cacheTtl =
      Number(document.querySelector("#setCacheTtl").value || 300);
    AppState.settings.devMode =
      document.querySelector("#setDevMode").checked;

    // ⭐ NEU: DEMO MODE
    AppState.settings.demoMode =
      document.querySelector("#setDemoMode").checked;

    window.SignalOne.showToast("Einstellungen gespeichert.", "success");
    window.SignalOne.navigateTo("settings");
  });
}
