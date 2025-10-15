// Test utility for JWT token expiration
// This file can be used to test token expiration behavior

import { 
  decodeToken, 
  isTokenExpired, 
  validateToken, 
  getCurrentUser, 
  isAuthenticated,
  getTokenExpirationTime,
  getTokenTimeRemaining 
} from './tokenUtils.js';

/**
 * Test function to demonstrate token expiration behavior
 * This can be called from browser console for testing
 */
export const testTokenExpiration = () => {
  console.log('=== JWT Token Expiration Test ===');
  
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.log('❌ No token found in localStorage');
    return;
  }
  
  console.log('🔍 Token found:', token.substring(0, 50) + '...');
  
  // Test token decoding
  const decoded = decodeToken(token);
  console.log('📋 Decoded payload:', decoded);
  
  // Test expiration check
  const expired = isTokenExpired(token);
  console.log('⏰ Token expired:', expired);
  
  // Test validation
  const user = validateToken(token);
  console.log('👤 Valid user:', user);
  
  // Test authentication status
  const authenticated = isAuthenticated();
  console.log('🔐 Is authenticated:', authenticated);
  
  // Test expiration time
  const expirationTime = getTokenExpirationTime(token);
  console.log('📅 Expiration time:', expirationTime);
  
  // Test time remaining
  const timeRemaining = getTokenTimeRemaining(token);
  console.log('⏱️ Time remaining (seconds):', timeRemaining);
  
  if (timeRemaining > 0) {
    const hours = Math.floor(timeRemaining / 3600);
    const minutes = Math.floor((timeRemaining % 3600) / 60);
    const seconds = timeRemaining % 60;
    console.log(`⏱️ Time remaining: ${hours}h ${minutes}m ${seconds}s`);
  }
  
  console.log('=== Test Complete ===');
};

/**
 * Create a test token with custom expiration (for testing purposes)
 * WARNING: This is for testing only, not for production use
 */
export const createTestToken = (expirationMinutes = 1) => {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expirationMinutes * 60);
  
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    user_id: 999,
    role: 1,
    iat: now,
    exp: exp
  }));
  const signature = 'test-signature';
  
  const testToken = `${header}.${payload}.${signature}`;
  
  console.log(`🧪 Created test token expiring in ${expirationMinutes} minute(s)`);
  console.log('⚠️ WARNING: This is a test token and will not work with the backend');
  
  return testToken;
};

// Make functions available globally for console testing
if (typeof window !== 'undefined') {
  window.testTokenExpiration = testTokenExpiration;
  window.createTestToken = createTestToken;
}
