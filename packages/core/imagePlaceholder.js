/* ========================================
   SignalOne – Image Placeholder System
   Graue, transparente Fallbacks
======================================== */

export const ImagePlaceholder = {
  /**
   * Generiert SVG Placeholder
   * @param {number} width 
   * @param {number} height 
   * @param {string} text - Optional text overlay
   */
  svg(width = 300, height = 200, text = '') {
    return `
      <svg 
        width="${width}" 
        height="${height}" 
        viewBox="0 0 ${width} ${height}"
        class="image-placeholder"
      >
        <defs>
          <linearGradient id="placeholder-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgba(226,232,240,0.8);stop-opacity:1" />
            <stop offset="50%" style="stop-color:rgba(203,213,225,0.6);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgba(226,232,240,0.8);stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#placeholder-gradient)"/>
        <path 
          d="M${width/2-30},${height/2-20} L${width/2},${height/2-40} L${width/2+30},${height/2-20} L${width/2+30},${height/2+30} L${width/2-30},${height/2+30} Z" 
          fill="rgba(148,163,184,0.3)"
        />
        ircle cx="${width/2-10}" cy="${height/2-25}" r="8" fill="rgba(148,163,184,0.4)"/>
        ${text ? `
          <text 
            x="${width/2}" 
            y="${height-20}" 
            text-anchor="middle" 
            fill="rgba(71,85,105,0.6)" 
            font-size="12" 
            font-family="system-ui"
          >${text}</text>
        ` : ''}
      </svg>
    `;
  },

  /**
   * Lazy Loading Image mit Placeholder
   */
  lazyImage(src, alt = '', width = 300, height = 200) {
    const placeholderSVG = this.svg(width, height, 'Lädt...');
    const encodedSVG = encodeURIComponent(placeholderSVG);
    
    return `
      <img 
        src="data:image/svg+xml,${encodedSVG}"
        data-src="${src}"
        alt="${alt}"
        class="lazy-image"
        width="${width}"
        height="${height}"
        loading="lazy"
        onerror="this.src='data:image/svg+xml,${encodeURIComponent(this.svg(width, height, 'Fehler'))}';"
      />
    `;
  },

  /**
   * Background Image mit Placeholder
   */
  backgroundPlaceholder(selector, imageUrl, options = {}) {
    const {
      fadeIn = true,
      duration = '0.5s',
      onLoad = null
    } = options;
    
    return `
      <div class="bg-placeholder ${selector}" style="
        background-image: url('data:image/svg+xml,${encodeURIComponent(this.svg(400, 300))}');
        transition: background-image ${duration} ease;
      ">
        <div class="bg-loader" data-bg-url="${imageUrl}"></div>
      </div>
    `;
  },

  /**
   * Creative Thumbnail Placeholder (für Library)
   */
  creativePlaceholder(type = 'video') {
    const icon = type === 'video' ? '🎬' : '📸';
    return this.svg(280, 350, `${icon} ${type === 'video' ? 'Video' : 'Image'}`);
  }
};

/**
 * Lazy Loading Observer
 */
export function initLazyLoading() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: load all images immediately
    document.querySelectorAll('.lazy-image').forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          const tempImg = new Image();
          tempImg.onload = () => {
            img.src = img.dataset.src;
            img.classList.add('loaded');
          };
          tempImg.src = img.dataset.src;
        }
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });

  document.querySelectorAll('.lazy-image').forEach(img => observer.observe(img));
}

// Auto-init on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLazyLoading);
} else {
  initLazyLoading();
}

window.ImagePlaceholder = ImagePlaceholder;
