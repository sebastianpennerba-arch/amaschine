/*
 * Onboarding Compute
 * Verwaltet den Onboarding-Status und die Antworten aus dem Wizard.
 */

export function nextStep(AppState) {
  if (typeof AppState.onboardingStep !== "number") {
    AppState.onboardingStep = 0;
  }
  AppState.onboardingStep += 1;
}

export function setExperience(AppState, level) {
  if (!AppState.onboarding) AppState.onboarding = {};
  AppState.onboarding.experience = level;
}

export function setGoals(AppState, goals) {
  if (!AppState.onboarding) AppState.onboarding = {};
  AppState.onboarding.goals = goals;
}
