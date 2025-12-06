// ============================================================
// API Response Cache with TTL
// ============================================================

import ENV from '../config.js';
import SecureStorage from './storage.js';

class APICache {
  constructor(ttlMinutes = ENV.CACHE_TTL_MINUTES) {
    this.ttl = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.cache = this.loadFromStorage();
  }
  
  /**
   * Load cache from storage
   */
  loadFromStorage() {
    return SecureStorage.get(ENV.STORAGE_KEYS.CACHE, {});
  }
  
  /**
   * Save cache to storage
   */
  saveToStorage() {
    SecureStorage.set(ENV.STORAGE_KEYS.CACHE, this.cache);
  }
  
  /**
   * Generate cache key from URL and params
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${url}?${sortedParams}`;
  }
  
  /**
   * Get cached response if still valid
   */
  get(key) {
    const entry = this.cache[key];
    
    if (!entry) return null;
    
    const now = Date.now();
    const isExpired = (now - entry.timestamp) > this.ttl;
    
    if (isExpired) {
      delete this.cache[key];
      this.saveToStorage();
      return null;
    }
    
    return entry.data;
  }
  
  /**
   * Set cache entry
   */
  set(key, data) {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };
    
    this.saveToStorage();
  }
  
  /**
   * Clear specific key
   */
  clear(key) {
    delete this.cache[key];
    this.saveToStorage();
  }
  
  /**
   * Clear all cache
   */
  clearAll() {
    this.cache = {};
    this.saveToStorage();
  }
  
  /**
   * Clear expired entries
   */
  clearExpired() {
    const now = Date.now();
    
    Object.keys(this.cache).forEach(key => {
      const entry = this.cache[key];
      const isExpired = (now - entry.timestamp) > this.ttl;
      
      if (isExpired) {
        delete this.cache[key];
      }
    });
    
    this.saveToStorage();
  }
}

// Singleton instance
const apiCache = new APICache();

export default apiCache;
