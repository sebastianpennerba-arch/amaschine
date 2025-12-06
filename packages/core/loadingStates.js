/* ========================================
   SignalOne – Loading States System
   Fast / Medium / Slow + Transitions
======================================== */

export const LoadingStates = {
  /**
   * Skeleton Loader mit konfigurierbarer Dauer
   * @param {string} type - 'fast' | 'medium' | 'slow'
   * @returns {string} HTML
   */
  skeleton(type = 'medium') {
    const config = {
      fast: { duration: '0.8s', opacity: '0.6' },
      medium: { duration: '1.2s', opacity: '0.5' },
      slow: { duration: '1.8s', opacity: '0.4' }
    };
    
    const { duration, opacity } = config[type] || config.medium;
    
    return `
      <div class="skeleton-loader" style="
        --skeleton-duration: ${duration};
        --skeleton-opacity: ${opacity};
      "></div>
    `;
  },

  /**
   * Skeleton Grid (z.B. für Creative Library)
   * @param {number} count - Anzahl Items
   * @param {string} speed - 'fast' | 'medium' | 'slow'
   */
  skeletonGrid(count = 6, speed = 'medium') {
    const items = Array.from({ length: count }, (_, i) => `
      <div class="skeleton-card" style="animation-delay: ${i * 0.05}s;">
        ${this.skeleton(speed)}
        <div class="skeleton-text"></div>
        <div class="skeleton-text short"></div>
      </div>
    `).join('');
    
    return `<div class="skeleton-grid">${items}</div>`;
  },

  /**
   * KPI Skeleton (Dashboard)
   */
  skeletonKPI(count = 4) {
    return Array.from({ length: count }, (_, i) => `
      <div class="skeleton-kpi" style="animation-delay: ${i * 0.08}s;">
        <div class="skeleton-label"></div>
        <div class="skeleton-value"></div>
        <div class="skeleton-badge"></div>
      </div>
    `).join('');
  },

  /**
   * Empty State (keine Daten vorhanden)
   */
  empty(message, icon = '📭', ctaText = null, ctaAction = null) {
    return `
      <div class="empty-state">
        <div class="empty-icon">${icon}</div>
        <div class="empty-message">${message}</div>
        ${ctaText ? `
          <button class="btn-primary" onclick="${ctaAction}">
            ${ctaText}
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Error State mit Retry
   */
  error(message = 'Fehler beim Laden', retry = null) {
    return `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <div class="error-message">${message}</div>
        ${retry ? `
          <button class="btn-retry" onclick="${retry}">
            🔄 Erneut versuchen
          </button>
        ` : ''}
      </div>
    `;
  },

  /**
   * Progressive Loader (für langsame Aktionen)
   */
  progressiveLoader(steps = []) {
    const stepHTML = steps.map((step, i) => `
      <div class="progress-step" data-step="${i}">
        <div class="progress-dot"></div>
        <span>${step}</span>
      </div>
    `).join('');
    
    return `
      <div class="progressive-loader">
        <div class="progress-steps">${stepHTML}</div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    `;
  }
};

/**
 * Loading Manager für async Operationen
 */
export class LoadingManager {
  static activeLoaders = new Map();

  /**
   * Zeigt Loader für eine Operation
   * @param {string} key - Eindeutige ID
   * @param {HTMLElement} container - Container Element
   * @param {string} type - 'skeleton' | 'spinner' | 'progressive'
   */
  static show(key, container, type = 'skeleton', options = {}) {
    if (!container) return;
    
    const originalContent = container.innerHTML;
    this.activeLoaders.set(key, { container, originalContent });
    
    container.classList.add('is-loading');
    
    switch(type) {
      case 'spinner':
        container.innerHTML = `
          <div class="loader-spinner">
            <div class="spinner"></div>
            <p>${options.message || 'Lädt...'}</p>
          </div>
        `;
        break;
      case 'progressive':
        container.innerHTML = LoadingStates.progressiveLoader(options.steps || []);
        break;
      default:
        container.innerHTML = options.html || LoadingStates.skeleton(options.speed || 'medium');
    }
  }

  /**
   * Versteckt Loader und zeigt Content
   */
  static hide(key, newContent = null) {
    const loader = this.activeLoaders.get(key);
    if (!loader) return;
    
    const { container, originalContent } = loader;
    container.classList.remove('is-loading');
    
    setTimeout(() => {
      if (newContent) {
        container.innerHTML = newContent;
      } else {
        container.innerHTML = originalContent;
      }
      container.classList.add('fade-in');
    }, 150);
    
    this.activeLoaders.delete(key);
  }

  /**
   * Utility: Wraps eine async function mit Loading State
   */
  static async wrap(key, container, asyncFn, options = {}) {
    this.show(key, container, options.type || 'skeleton', options);
    
    try {
      const result = await asyncFn();
      this.hide(key, result);
      return result;
    } catch (error) {
      this.hide(key, LoadingStates.error(
        options.errorMessage || 'Fehler beim Laden',
        options.onRetry ? `LoadingManager.retry('${key}', ${options.onRetry.toString()})` : null
      ));
      throw error;
    }
  }
}

// Global verfügbar machen
window.LoadingStates = LoadingStates;
window.LoadingManager = LoadingManager;
