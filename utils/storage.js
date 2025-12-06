// ============================================================
// Secure LocalStorage Wrapper with Encryption
// ============================================================

import ENV from '../config.js';
import { sanitizeStorageData } from './sanitize.js';

/**
 * Simple XOR-based encryption (for demo purposes)
 * In production, use a proper encryption library like crypto-js
 */
function simpleEncrypt(text, key) {
  if (!ENV.ENABLE_ENCRYPTION) return text;
  
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return btoa(result); // Base64 encode
}

function simpleDecrypt(encoded, key) {
  if (!ENV.ENABLE_ENCRYPTION) return encoded;
  
  try {
    const text = atob(encoded); // Base64 decode
    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += String.fromCharCode(
        text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return result;
  } catch {
    return null;
  }
}

// Generate encryption key from browser fingerprint
function getEncryptionKey() {
  // Simple fingerprint based on userAgent and screen
  const fingerprint = `${navigator.userAgent}-${screen.width}x${screen.height}`;
  return fingerprint.substring(0, 32); // Use first 32 chars as key
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Secure storage wrapper
 */
class SecureStorage {
  /**
   * Set item with encryption
   */
  static set(key, value) {
    try {
      // Sanitize data to prevent prototype pollution
      const sanitized = sanitizeStorageData(value);
      const json = JSON.stringify(sanitized);
      const encrypted = simpleEncrypt(json, ENCRYPTION_KEY);
      
      localStorage.setItem(key, encrypted);
      return true;
    } catch (err) {
      console.error('SecureStorage.set failed:', err);
      return false;
    }
  }
  
  /**
   * Get item with decryption
   */
  static get(key, defaultValue = null) {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return defaultValue;
      
      const json = simpleDecrypt(encrypted, ENCRYPTION_KEY);
      if (!json) return defaultValue;
      
      return JSON.parse(json);
    } catch (err) {
      console.error('SecureStorage.get failed:', err);
      return defaultValue;
    }
  }
  
  /**
   * Remove item
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error('SecureStorage.remove failed:', err);
      return false;
    }
  }
  
  /**
   * Clear all storage
   */
  static clear() {
    try {
      localStorage.clear();
      return true;
    } catch (err) {
      console.error('SecureStorage.clear failed:', err);
      return false;
    }
  }
  
  /**
   * Check if key exists
   */
  static has(key) {
    return localStorage.getItem(key) !== null;
  }
}

export default SecureStorage;
