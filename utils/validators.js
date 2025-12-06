// ============================================================
// Input Validation Utilities
// ============================================================

/**
 * Validate email format
 */
export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate number range
 */
export function isInRange(value, min, max) {
  const num = Number(value);
  if (!Number.isFinite(num)) return false;
  return num >= min && num <= max;
}

/**
 * Validate string length
 */
export function isValidLength(str, minLength, maxLength) {
  if (typeof str !== 'string') return false;
  return str.length >= minLength && str.length <= maxLength;
}

/**
 * Validate Meta Access Token format
 * Meta tokens are typically long alphanumeric strings
 */
export function isValidMetaToken(token) {
  if (typeof token !== 'string') return false;
  
  // Must be between 50-500 chars, alphanumeric + some special chars
  if (token.length < 50 || token.length > 500) return false;
  
  // Only allow safe characters
  const validChars = /^[A-Za-z0-9_\-|.]+$/;
  return validChars.test(token);
}

/**
 * Validate account ID format
 */
export function isValidAccountId(id) {
  if (typeof id !== 'string') return false;
  
  // Meta account IDs are numeric, sometimes prefixed with "act_"
  const cleanId = id.replace(/^act_/, '');
  return /^\d+$/.test(cleanId);
}

/**
 * Validate campaign ID format
 */
export function isValidCampaignId(id) {
  if (typeof id !== 'string' && typeof id !== 'number') return false;
  
  // Campaign IDs are numeric
  return /^\d+$/.test(String(id));
}

/**
 * Validate time range preset
 */
export function isValidTimeRange(range) {
  const validRanges = [
    'today',
    'yesterday',
    'last_7d',
    'last_14d',
    'last_30d',
    'this_month',
    'last_month'
  ];
  
  return validRanges.includes(range);
}

/**
 * Validate ROAS value (Return on Ad Spend)
 */
export function isValidRoas(roas) {
  const num = Number(roas);
  if (!Number.isFinite(num)) return false;
  
  // ROAS should be >= 0 and reasonably < 100 (10000% return is extreme)
  return num >= 0 && num < 100;
}

/**
 * Validate currency code (ISO 4217)
 */
export function isValidCurrency(currency) {
  const validCurrencies = ['EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD'];
  return validCurrencies.includes(currency);
}

/**
 * Sanitize filename for download
 */
export function sanitizeFilename(filename) {
  if (typeof filename !== 'string') return 'download';
  
  return filename
    .replace(/[^a-zA-Z0-9_\-\.]/g, '_') // Replace special chars
    .replace(/_{2,}/g, '_') // Remove multiple underscores
    .substring(0, 200); // Limit length
}

/**
 * Validate object has required keys
 */
export function hasRequiredKeys(obj, requiredKeys) {
  if (typeof obj !== 'object' || obj === null) return false;
  
  return requiredKeys.every(key => key in obj);
}

/**
 * Validate creative data structure
 */
export function isValidCreativeData(creative) {
  if (typeof creative !== 'object' || creative === null) return false;
  
  const required = ['id', 'name'];
  return hasRequiredKeys(creative, required);
}

/**
 * Validate metrics data structure
 */
export function isValidMetricsData(metrics) {
  if (typeof metrics !== 'object' || metrics === null) return false;
  
  // At least one metric should be present
  const validMetrics = ['spend', 'revenue', 'roas', 'ctr', 'cpm', 'impressions', 'clicks'];
  return validMetrics.some(key => key in metrics);
}

/**
 * Validate date string (ISO 8601)
 */
export function isValidISODate(dateStr) {
  if (typeof dateStr !== 'string') return false;
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * General purpose validator builder
 */
export function createValidator(rules) {
  return function validate(data) {
    const errors = [];
    
    for (const [field, rule] of Object.entries(rules)) {
      const value = data[field];
      
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        continue;
      }
      
      if (value !== undefined && value !== null && rule.validate) {
        const isValid = rule.validate(value);
        if (!isValid) {
          errors.push(rule.message || `${field} is invalid`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };
}

// Example usage:
// const validateCampaign = createValidator({
//   id: { required: true, validate: isValidCampaignId, message: 'Invalid campaign ID' },
//   name: { required: true, validate: (v) => isValidLength(v, 1, 100) },
//   roas: { required: false, validate: isValidRoas }
// });
