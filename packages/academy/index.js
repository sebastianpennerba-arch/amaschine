// packages/academy/index.js
// SignalOne Academy - Deep Dive Training Module

export async function render(container, AppState) {
  const userData = getUserProgress(AppState);
  
  container.innerHTML = `
    <div class="academy-container">
      ${renderHeader(userData)}
      ${renderContent(userData)}
    </div>
  `;
  
  attachEventListeners(AppState);
}

function getUserProgress(AppState) {
  return {
    totalLessons: 25,
    completedLessons: 6,
    currentModule: 2,
    currentLesson: 7,
    progress: 24,
    timeRemaining: "3.2h",
    modules: [
      {
        number: 1,
        title: "Foundations",
        icon: "🎯",
        lessons: 5,
        completed: 5,
        status: "completed"
      },
      {
        number: 2,
        title: "Creative Mastery",
        icon: "🎨",
        lessons: 8,
        completed: 1,
        status: "active"
      },
      {
        number: 3,
        title: "Testing Framework",
        icon: "🧪",
        lessons: 6,
        completed: 0,
        status: "locked"
      },
      {
        number: 4,
        title: "Sensei Strategie",
        icon: "🤖",
        lessons: 4,
        completed: 0,
        status: "locked"
      },
      {
        number: 5,
        title: "Advanced Tactics",
        icon: "⚡",
        lessons: 2,
        completed: 0,
        status: "locked"
      }
    ]
  };
}

function renderHeader(userData) {
  return `
    <header class="academy-header">
      <h1 class="academy-title">
        🎓 SignalOne Academy
        <span class="academy-subtitle">Master Meta Ads with Sensei</span>
      </h1>
      
      <div class="academy-progress">
        <div class="progress-label">Dein Fortschritt</div>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: ${userData.progress}%">
            <span class="progress-text">${userData.progress}%</span>
          </div>
        </div>
        <div class="progress-stats">
          <span>${userData.completedLessons} von ${userData.totalLessons} Lektionen abgeschlossen</span>
          <span class="progress-time">~${userData.timeRemaining} verbleibend</span>
        </div>
      </div>
    </header>
  `;
}

function renderContent(userData) {
  return `
    <div class="academy-content">
      <div class="academy-actions">
        <button class="btn-academy-primary" data-action="continue">
          ▶️ Weiter lernen
          <span class="btn-subtitle">Lektion ${userData.currentLesson}: Hook-Formeln</span>
        </button>
        
        <button class="btn-academy-secondary" data-action="all-modules">
          📚 Alle Module
        </button>
        
        <button class="btn-academy-secondary" data-action="achievements">
          🏆 Meine Erfolge
        </button>
      </div>

      <div class="academy-modules">
        ${userData.modules.map(module => renderModule(module)).join('')}
      </div>

      ${renderSenseiInsight(userData)}
    </div>
  `;
}

function renderModule(module) {
  const progress = Math.round((module.completed / module.lessons) * 100);
  
  const statusBadges = {
    completed: '<span class="module-badge badge-completed">✓ Abgeschlossen</span>',
    active: '<span class="module-badge badge-active">● In Bearbeitung</span>',
    locked: '<span class="module-badge badge-locked">🔒 Gesperrt</span>'
  };
  
  const actionButtons = {
    completed: '↻ Wiederholen',
    active: '→ Fortsetzen',
    locked: '🔒'
  };
  
  return `
    <div class="academy-module academy-module-${module.status}" data-module="${module.number}">
      <div class="module-icon">${module.icon}</div>
      <div class="module-content">
        <div class="module-header">
          <h3 class="module-title">Modul ${module.number}: ${module.title}</h3>
          ${statusBadges[module.status]}
        </div>
        <div class="module-meta">
          <span>${module.completed} / ${module.lessons} Lektionen</span>
        </div>
        <div class="module-progress-bar">
          <div class="module-progress" style="width: ${progress}%"></div>
        </div>
      </div>
      <button 
        class="btn-module-action ${module.status === 'locked' ? 'disabled' : ''}"
        data-action="open-module"
        data-module="${module.number}"
        ${module.status === 'locked' ? 'disabled' : ''}
      >
        ${actionButtons[module.status]}
      </button>
    </div>
  `;
}

function renderSenseiInsight(userData) {
  return `
    <div class="academy-sensei-box">
      <div class="sensei-avatar">🤖</div>
      <div class="sensei-content">
        <h3>Sensei Empfehlung</h3>
        <p>Basierend auf deinem Account würde ich dir empfehlen, als Nächstes 
        <strong>Modul 2, Lektion 7: Hook-Formeln für UGC</strong> zu machen. 
        Deine aktuellen Creatives haben Potenzial für stärkere Hooks.</p>
        <button class="btn-sensei-action" data-action="start-recommended">
          Jetzt starten →
        </button>
      </div>
    </div>
  `;
}

function attachEventListeners(AppState) {
  document.querySelector('[data-action="continue"]')?.addEventListener('click', () => {
    console.log('[Academy] Continue learning clicked');
    showToast('Lektion wird geladen...', 'info');
  });
  
  document.querySelector('[data-action="all-modules"]')?.addEventListener('click', () => {
    console.log('[Academy] All modules clicked');
  });
  
  document.querySelector('[data-action="achievements"]')?.addEventListener('click', () => {
    console.log('[Academy] Achievements clicked');
  });
  
  document.querySelectorAll('[data-action="open-module"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleNumber = btn.getAttribute('data-module');
      console.log(`[Academy] Opening module ${moduleNumber}`);
      showToast(`Modul ${moduleNumber} wird geladen...`, 'info');
    });
  });
  
  document.querySelector('[data-action="start-recommended"]')?.addEventListener('click', () => {
    console.log('[Academy] Sensei recommendation clicked');
    showToast('Empfohlene Lektion wird geladen...', 'info');
  });
}

function showToast(message, type = 'info') {
  if (window.showToast) {
    window.showToast(message, type);
  } else {
    console.log(`[Toast ${type}]`, message);
  }
}
