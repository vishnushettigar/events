// Configuration utility for environment variables

const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000',
  API_VERSION: import.meta.env.VITE_API_VERSION || '/api',
  
  // Full API URL
  get API_URL() {
    return `${this.API_BASE_URL}${this.API_VERSION}`;
  },

  // Authentication
  JWT_STORAGE_KEY: import.meta.env.VITE_JWT_STORAGE_KEY || 'token',
  USER_STORAGE_KEY: import.meta.env.VITE_USER_STORAGE_KEY || 'user',

  // Application Configuration
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Sports Event Management System',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',

  // Development Configuration
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
  LOG_LEVEL: import.meta.env.VITE_LOG_LEVEL || 'info',

  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',

  // Pagination Defaults
  DEFAULT_PAGE_SIZE: parseInt(import.meta.env.VITE_DEFAULT_PAGE_SIZE) || 10,
  MAX_PAGE_SIZE: parseInt(import.meta.env.VITE_MAX_PAGE_SIZE) || 100,

  // Timeout Configuration (in milliseconds)
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000,
  SESSION_TIMEOUT: parseInt(import.meta.env.VITE_SESSION_TIMEOUT) || 3600000,

  // Error Handling
  SHOW_ERROR_DETAILS: import.meta.env.VITE_SHOW_ERROR_DETAILS === 'true',
  ERROR_REPORTING_ENABLED: import.meta.env.VITE_ERROR_REPORTING_ENABLED === 'true',
};

// Helper functions
export const getApiUrl = (endpoint = '') => {
  return `${config.API_URL}${endpoint}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem(config.JWT_STORAGE_KEY);
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};

export const logDebug = (message, data = null) => {
  if (config.DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data);
  }
};

export const logError = (message, error = null) => {
  console.error(`[ERROR] ${message}`, error);
  if (config.ERROR_REPORTING_ENABLED) {
    // Add error reporting logic here (e.g., Sentry)
  }
};

export default config; 