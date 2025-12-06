// ============================================================
// XSS Prevention & Input Sanitization
// ============================================================

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize HTML while allowing safe tags
 * Simple whitelist-based approach
 */
export function sanitizeHtml(html) {
  if (typeof html !== 'string') return '';
  
  // Create a temporary DOM element
  const temp = document.createElement('div');
  temp.textContent = html; // This escapes all HTML
  
  // For now, we don't allow any HTML tags
  // In future, you could use DOMPurify library for more control
  return temp.innerHTML;
}

/**
 * Safe innerHTML setter - always sanitizes
 */
export function safeSetInnerHTML(element, html) {
  if (!element) return;
  
  // Use textContent for complete safety (no HTML rendering)
  // Or sanitizeHtml() if you need limited HTML
  element.innerHTML = sanitizeHtml(html);
}

/**
 * Create safe DOM element with text content
 */
export function createSafeElement(tag, textContent, className = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = textContent; // Always use textContent, never innerHTML
  return el;
}

/**
 * Sanitize object for localStorage (prevent prototype pollution)
 */
export function sanitizeStorageData(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  // Create clean object without prototype
  const clean = Object.create(null);
  
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Recursively sanitize nested objects
      if (typeof data[key] === 'object' && data[key] !== null) {
        clean[key] = sanitizeStorageData(data[key]);
      } else {
        clean[key] = data[key];
      }
    }
  }
  
  return clean;
}

/**
 * Validate and sanitize URL
 */
export function sanitizeUrl(url) {
  if (typeof url !== 'string') return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Strip script tags and event handlers
 */
export function stripDangerousContent(html) {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '');
}
