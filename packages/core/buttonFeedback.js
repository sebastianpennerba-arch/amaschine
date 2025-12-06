/* ========================================
   SignalOne – Button Feedback System
   Ripple, Spinner, Success/Error States
======================================== */

export const ButtonFeedback = {
  /**
   * Ripple-Effekt bei Click
   */
  addRipple(button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple-animation 0.6s ease-out;
      pointer-events: none;
    `;

    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    button.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  },

  /**
   * Button in Loading-State versetzen
   */
  setLoading(button, loadingText = 'Lädt...') {
    if (button.dataset.originalContent) return; // Bereits loading

    button.dataset.originalContent = button.innerHTML;
    button.disabled = true;
    button.classList.add('btn-loading');

    button.innerHTML = `
      <span class="btn-spinner"></span>
      <span class="btn-loading-text">${loadingText}</span>
    `;
  },

  /**
   * Button Loading beenden (Success)
   */
  setSuccess(button, successText = '✓ Fertig', duration = 2000) {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.classList.add('btn-success');

    button.innerHTML = `<span class="btn-success-icon">✓</span> ${successText}`;

    setTimeout(() => {
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      }
      button.classList.remove('btn-success');
    }, duration);
  },

  /**
   * Button Loading beenden (Error)
   */
  setError(button, errorText = '✗ Fehler', duration = 3000) {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.classList.add('btn-error');

    button.innerHTML = `<span class="btn-error-icon">✗</span> ${errorText}`;

    setTimeout(() => {
      if (button.dataset.originalContent) {
        button.innerHTML = button.dataset.originalContent;
        delete button.dataset.originalContent;
      }
      button.classList.remove('btn-error');
    }, duration);
  },

  /**
   * Button zurücksetzen
   */
  reset(button) {
    if (button.dataset.originalContent) {
      button.innerHTML = button.dataset.originalContent;
      delete button.dataset.originalContent;
    }
    button.disabled = false;
    button.classList.remove('btn-loading', 'btn-success', 'btn-error');
  },

  /**
   * Async Action mit automatischem Feedback
   */
  async withFeedback(button, asyncFn, options = {}) {
    const {
      loadingText = 'Lädt...',
      successText = '✓ Fertig',
      errorText = '✗ Fehler',
      successDuration = 2000,
      errorDuration = 3000
    } = options;

    this.setLoading(button, loadingText);

    try {
      const result = await asyncFn();
      this.setSuccess(button, successText, successDuration);
      return result;
    } catch (error) {
      this.setError(button, errorText, errorDuration);
      throw error;
    }
  }
};

/**
 * Auto-Wire alle Buttons mit data-action
 */
export function initButtonFeedback() {
  // Ripple für alle interaktiven Buttons
  document.addEventListener('click', (e) => {
    const button = e.target.closest('button, .btn-primary, .btn-secondary, .icon-button');
    if (button && !button.disabled) {
      ButtonFeedback.addRipple(button, e);
    }
  });

  // Auto-Loading für data-async Buttons
  document.querySelectorAll('[data-async]').forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      const action = button.dataset.async;
      
      if (window[action] && typeof window[action] === 'function') {
        await ButtonFeedback.withFeedback(button, () => window[action]());
      }
    });
  });
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initButtonFeedback);
} else {
  initButtonFeedback();
}

window.ButtonFeedback = ButtonFeedback;
