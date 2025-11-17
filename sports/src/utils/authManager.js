// Global authentication manager for handling logout and state clearing

import { clearAuthData } from './tokenUtils.js';

class AuthManager {
  constructor() {
    this.listeners = new Set();
    this.isLoggingOut = false;
  }

  // Subscribe to authentication state changes
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Notify all listeners of authentication state change
  notifyListeners(isLoggedIn, user = null) {
    this.listeners.forEach(callback => {
      try {
        callback(isLoggedIn, user);
      } catch (error) {
        // console.error('Error in auth listener:', error);
      }
    });
  }

  // Global logout function
  logout(redirectToLogin = true) {
    if (this.isLoggingOut) {
      return; // Prevent multiple simultaneous logout calls
    }

    this.isLoggingOut = true;
    
    try {
      // console.log('AuthManager: Performing global logout', redirectToLogin ? '(with redirect)' : '(no redirect)');
      
      // Clear all authentication data
      clearAuthData();
      
      // Notify all listeners that user is logged out
      this.notifyListeners(false, null);
      
      // Dispatch custom event for components that listen to it
      window.dispatchEvent(new CustomEvent('authLogout'));
      
      // Redirect to login page if requested
      if (redirectToLogin && typeof window !== 'undefined') {
        // Use a small delay to ensure state is cleared before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
      
    } catch (error) {
      // console.error('Error during logout:', error);
    } finally {
      this.isLoggingOut = false;
    }
  }

  // Handle 401 Unauthorized response
  handleUnauthorized() {
    // console.log('AuthManager: Handling 401 Unauthorized response');
    this.logout(true);
  }

  // Handle successful login
  handleLogin(user) {
    // console.log('AuthManager: Handling successful login');
    this.notifyListeners(true, user);
    window.dispatchEvent(new CustomEvent('authLogin', { detail: user }));
  }

  // Check if currently logging out
  isCurrentlyLoggingOut() {
    return this.isLoggingOut;
  }
}

// Create singleton instance
const authManager = new AuthManager();

export default authManager;
