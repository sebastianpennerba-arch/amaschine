// ============================================================
// SignalOne Frontend - Configuration
// Centralized config for all environments
// ============================================================

const ENV = {
  // Detect environment
  isDevelopment: window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1',
  isProduction: window.location.hostname === 'signalone.cloud',
  
  // API Endpoints
  API_BASE_URL: window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : 'https://signalone-backend.onrender.com/api',
  
  // Meta OAuth
  META_APP_ID: '732040642590155',
  META_REDIRECT_URI: window.location.hostname === 'localhost'
    ? 'http://localhost:5173/auth/callback'
    : 'https://signalone.cloud/auth/callback',
  
  // App Settings
  APP_VERSION: '1.0.0',
  DEFAULT_LANGUAGE: 'de',
  CACHE_TTL_MINUTES: 15,
  REQUEST_TIMEOUT: 30000,
  
  // Feature Flags
  FEATURES: {
    DEMO_MODE: true,
    TESTING_LOG: true,
    SENSEI_AI: true,
    REPORTS_EXPORT: true,
    MULTI_LANGUAGE: false // Future feature
  },
  
  // Storage Keys
  STORAGE_KEYS: {
    META_AUTH: 'signalone-meta-auth-v1',
    TESTING_LOG: 'signalone-testing-log-v1',
    USER_PREFS: 'signalone-user-prefs-v1',
    CACHE: 'signalone-cache-v1'
  },
  
  // Security
  ENABLE_ENCRYPTION: true,
  LOG_ERRORS_TO_CONSOLE: true
};

// Freeze to prevent modifications
Object.freeze(ENV);

export default ENV;
