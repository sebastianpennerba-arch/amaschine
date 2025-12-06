// packages/onboarding/index.js
// Block 4 – Onboarding Suite (Welcome, Steps, Tooltips, Tutorial Mode)

// ✅ NEU: Init-Wrapper für app.js Kompatibilität
export async function init(ctx = {}) {
  const section = document.getElementById("onboardingView");
  if (!section) return;
  
  const { AppState } = ctx;
  render(section, AppState);
}

export function render(root, AppState) {
  const step = AppState.onboardingStep || 0;
  const totalSteps = 4;

  const steps = [
    {
      title: "Willkommen bei SignalOne",
      text: "Deine AI-gestützte Performance-Plattform. Lass uns dich in unter 30 Sekunden einrichten.",
      icon: "fa-rocket",
    },
    {
      title: "Werbekonto auswählen",
      text: "Wähle dein Ad-Konto, damit SignalOne die passenden KPIs anzeigen kann.",
      icon: "fa-building",
    },
    {
      title: "Kampagne auswählen",
      text: "Wähle eine Kampagne, damit die Creatives, Tests und Insights geladen werden können.",
      icon: "fa-bullhorn",
    },
    {
      title: "Dashboard starten",
      text: "Du bist bereit! Starte dein Titanium-Dashboard.",
      icon: "fa-check-circle",
    },
  ];

  const s = steps[step] || steps[0];

  root.innerHTML = `
    <div class="onboard-shell">
      <div class="onboard-card">
        <div class="onboard-icon">
          <i class="fa-solid ${s.icon}"></i>
        </div>

        <h2 class="onboard-title">${s.title}</h2>
        <p class="onboard-text">${s.text}</p>

        <div class="onboard-progress">
          ${steps
            .map(
              (_, i) =>
                `<span class="onboard-dot ${
                  i <= step ? "active" : ""
                }"></span>`
            )
            .join("")}
        </div>

        <div class="onboard-actions">
          ${
            step > 0
              ? `<button class="meta-button" id="prevStepBtn">Zurück</button>`
              : ``
          }
          ${
            step < totalSteps - 1
              ? `<button class="meta-button" id="nextStepBtn">Weiter</button>`
              : `<button class="meta-button" id="finishBtn">Fertig</button>`
          }
        </div>
      </div>
    </div>
  `;

  const prevBtn = root.querySelector("#prevStepBtn");
  const nextBtn = root.querySelector("#nextStepBtn");
  const finishBtn = root.querySelector("#finishBtn");

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      AppState.onboardingStep = Math.max(0, step - 1);
      window.SignalOne.navigateTo("onboarding");
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      AppState.onboardingStep = Math.min(totalSteps - 1, step + 1);
      window.SignalOne.navigateTo("onboarding");
    });
  }

  if (finishBtn) {
    finishBtn.addEventListener("click", () => {
      AppState.onboardingStep = 0;
      AppState.tutorialMode = true;

      window.SignalOne.showToast(
        "Onboarding abgeschlossen! Tutorial Mode aktiv.",
        "success"
      );

      window.SignalOne.navigateTo("dashboard");
    });
  }
}
