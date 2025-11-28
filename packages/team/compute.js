/*
 * Team Compute
 * Verwalten von Teammitgliedern, Rollen und (später) Aktivitäten.
 */

export function addMember(AppState, name, role) {
  if (!Array.isArray(AppState.teamMembers)) {
    AppState.teamMembers = [];
  }
  AppState.teamMembers.push({ name, role });
}
