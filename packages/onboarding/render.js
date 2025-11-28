/*
 * Onboarding Render
 * Schrittweiser Wizard:
 *  0: Meta-Connect
 *  1: Erfahrungslevel
 *  2: Ziele
 *  3: Zusammenfassung
 */

import { nextStep, setExperience, setGoals } from "./compute.js";

export function render(container, AppState) {
  container.innerHTML = "";
  const step = AppState.onboardingStep || 0;

  const wrapper = document.createElement("div");
  wrapper.className = "onboarding";

  if (step === 0) {
    wrapper.innerHTML = `
      <h2>Willkommen bei SignalOne</h2>
      <p>Verbinde deinen Meta-Account oder starte im Demo-Modus.</p>
      <button id="connect">Meta-Account verbinden (Demo)</button>
      <button id="demo">Demo-Modus nutzen</button>
    `;
    wrapper.querySelector("#connect").onclick = () => {
      AppState.metaConnected = true;
      const api = window.SignalOne || {};
      if (typeof api.showToast === "function") {
        api.showToast("Meta Demo-Verbindung hergestellt.", "success");
      }
      nextStep(AppState);
      render(container, AppState);
    };
    wrapper.querySelector("#demo").onclick = () => {
      AppState.settings.demoMode = true;
      const api = window.SignalOne || {};
      if (typeof api.showToast === "function") {
        api.showToast("Demo-Modus aktiviert.", "info");
      }
      nextStep(AppState);
      render(container, AppState);
    };
  } else if (step === 1) {
    wrapper.innerHTML = `
      <h2>Erfahrungslevel</h2>
      <p>Wie viel Erfahrung hast du mit Meta Ads?</p>
      <button id="beginner">Anfänger</button>
      <button id="advanced">Fortgeschritten</button>
      <button id="pro">Profi / Agentur</button>
    `;
    wrapper.querySelector("#beginner").onclick = () => {
      setExperience(AppState, "beginner");
      AppState.tutorialMode = true;
      nextStep(AppState);
      render(container, AppState);
    };
    wrapper.querySelector("#advanced").onclick = () => {
      setExperience(AppState, "advanced");
      AppState.tutorialMode = false;
      nextStep(AppState);
      render(container, AppState);
    };
    wrapper.querySelector("#pro").onclick = () => {
      setExperience(AppState, "pro");
      AppState.tutorialMode = false;
      nextStep(AppState);
      render(container, AppState);
    };
  } else if (step === 2) {
    wrapper.innerHTML = `
      <h2>Deine Ziele</h2>
      <p>Was möchtest du mit SignalOne erreichen?</p>
      <label><input type="checkbox" value="roas" /> ROAS verbessern</label><br/>
      <label><input type="checkbox" value="creatives" /> Creatives optimieren</label><br/>
      <label><input type="checkbox" value="scale" /> Skalieren</label><br/>
      <label><input type="checkbox" value="testing" /> Testing strukturieren</label><br/>
      <button id="goals-next">Weiter</button>
    `;
    wrapper.querySelector("#goals-next").onclick = () => {
      const inputs = wrapper.querySelectorAll("input[type=checkbox]");
      const selected = [];
      inputs.forEach((i) => {
        if (i.checked) selected.push(i.value);
      });
      setGoals(AppState, selected);
      nextStep(AppState);
      render(container, AppState);
    };
  } else {
    wrapper.innerHTML = `
      <h2>Onboarding abgeschlossen</h2>
      <p>Dein Setup ist bereit.</p>
      <p>Erfahrung: ${AppState.onboarding?.experience || "n/a"}</p>
      <p>Ziele: ${(AppState.onboarding?.goals || []).join(", ") || "n/a"}</p>
      <p>Du kannst jetzt mit SignalOne loslegen!</p>
    `;
  }

  container.appendChild(wrapper);
}
