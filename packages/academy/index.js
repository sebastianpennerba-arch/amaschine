export async function render(container, AppState) {
  const userData = {
    totalLessons: 25,
    completedLessons: 6,
    currentModule: 2,
    currentLesson: 7,
    progress: 24,
    timeRemaining: "3.2h",
    modules: [
      { number: 1, title: "Foundations", icon: "🎯", lessons: 5, completed: 5, status: "completed" },
      { number: 2, title: "Creative Mastery", icon: "🎨", lessons: 8, completed: 1, status: "active" },
      { number: 3, title: "Testing Framework", icon: "🧪", lessons: 6, completed: 0, status: "locked" },
      { number: 4, title: "Sensei Strategie", icon: "🤖", lessons: 4, completed: 0, status: "locked" },
      { number: 5, title: "Advanced Tactics", icon: "⚡", lessons: 2, completed: 0, status: "locked" }
    ]
  };
  
  container.innerHTML = `
    <div class="academy-container">
      <header class="academy-header">
        <h1 class="academy-title">🎓 SignalOne Academy<span class="academy-subtitle">Master Meta Ads with Sensei</span></h1>
        <div class="academy-progress">
          <div class="progress-label">Dein Fortschritt</div>
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: ${userData.progress}%"><span class="progress-text">${userData.progress}%</span></div>
          </div>
          <div class="progress-stats">
            <span>${userData.completedLessons} von ${userData.totalLessons} Lektionen</span>
            <span class="progress-time">~${userData.timeRemaining} verbleibend</span>
          </div>
        </div>
      </header>
      <div class="academy-content">
        <div class="academy-actions">
          <button class="btn-academy-primary">▶️ Weiter lernen<span class="btn-subtitle">Lektion 7: Hook-Formeln</span></button>
          <button class="btn-academy-secondary">📚 Alle Module</button>
          <button class="btn-academy-secondary">🏆 Meine Erfolge</button>
        </div>
        <div class="academy-modules">
          ${userData.modules.map(m => `
            <div class="academy-module academy-module-${m.status}">
              <div class="module-icon">${m.icon}</div>
              <div class="module-content">
                <div class="module-header">
                  <h3 class="module-title">Modul ${m.number}: ${m.title}</h3>
                  <span class="module-badge badge-${m.status}">${m.status === 'completed' ? '✓' : m.status === 'active' ? '●' : '🔒'}</span>
                </div>
                <div class="module-meta">${m.completed} / ${m.lessons} Lektionen</div>
                <div class="module-progress-bar"><div class="module-progress" style="width: ${Math.round((m.completed/m.lessons)*100)}%"></div></div>
              </div>
              <button class="btn-module-action">${m.status === 'completed' ? '↻' : m.status === 'active' ? '→' : '🔒'}</button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
