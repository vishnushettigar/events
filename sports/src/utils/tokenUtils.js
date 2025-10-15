// Token validation utilities

/**
 * Decodes a JWT token and returns the payload
 * @param {string} token - JWT token
 * @returns {Object|null} - Decoded payload or null if invalid
 */
export const decodeToken = (token) => {
  try {
    if (!token) return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

/**
 * Checks if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if token is expired or invalid
 */
export const isTokenExpired = (token) => {
  try {
    if (!token) return true;
    
    const payload = decodeToken(token);
    if (!payload || !payload.exp) return true;
    
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Validates a JWT token and returns user info if valid
 * @param {string} token - JWT token
 * @returns {Object|null} - User info if token is valid, null if expired/invalid
 */
export const validateToken = (token) => {
  if (!token) return null;
  
  if (isTokenExpired(token)) {
    // Remove expired token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return null;
  }
  
  return decodeToken(token);
};

/**
 * Gets the current user from localStorage if token is valid
 * @returns {Object|null} - User info if valid token exists, null otherwise
 */
export const getCurrentUser = () => {
  const token = localStorage.getItem('token');
  return validateToken(token);
};

/**
 * Clears authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Checks if user is authenticated with a valid token
 * @returns {boolean} - True if user has valid token
 */
export const isAuthenticated = () => {
  const user = getCurrentUser();
  console.log('isAuthenticated - user:', user);
  return user !== null;
};

/**
 * Gets token expiration time in a readable format
 * @param {string} token - JWT token
 * @returns {string|null} - Formatted expiration time or null if invalid
 */
export const getTokenExpirationTime = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  
  const expirationDate = new Date(payload.exp * 1000);
  return expirationDate.toLocaleString();
};

/**
 * Gets time remaining until token expires
 * @param {string} token - JWT token
 * @returns {number|null} - Seconds remaining or null if invalid/expired
 */
export const getTokenTimeRemaining = (token) => {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return null;
  
  const currentTime = Math.floor(Date.now() / 1000);
  const timeRemaining = payload.exp - currentTime;
  
  return timeRemaining > 0 ? timeRemaining : 0;
};
