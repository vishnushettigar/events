import { useState, useEffect } from 'react';
import { isAuthenticated, getCurrentUser, clearAuthData } from '../utils/tokenUtils';
import authManager from '../utils/authManager';

/**
 * Custom hook for authentication state management
 * @param {boolean} enablePeriodicCheck - Whether to enable periodic token validation
 * @param {number} checkInterval - Interval in milliseconds for periodic checks (default: 30000)
 * @returns {Object} - Authentication state and utilities
 */
export const useAuth = (enablePeriodicCheck = false, checkInterval = 30000) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = () => {
    const isUserAuthenticated = isAuthenticated();
    console.log('useAuth - isUserAuthenticated:', isUserAuthenticated);
    
    setIsLoggedIn(isUserAuthenticated);
    
    if (isUserAuthenticated) {
      const currentUser = getCurrentUser();
      console.log('useAuth - currentUser:', currentUser);
      setUser(currentUser);
    } else {
      setUser(null);
      // Clear any invalid/expired tokens
      const token = localStorage.getItem('token');
      if (token) {
        console.log('useAuth - clearing invalid token');
        clearAuthData();
      }
    }
    setIsLoading(false);
  };

  const logout = () => {
    authManager.logout(false); // Don't redirect, let the component handle it
  };

  useEffect(() => {
    // Initial check
    checkAuthStatus();

    // Subscribe to auth manager changes
    const unsubscribe = authManager.subscribe((isLoggedIn, user) => {
      setIsLoggedIn(isLoggedIn);
      setUser(user);
      setIsLoading(false);
    });

    let interval = null;
    
    if (enablePeriodicCheck) {
      // Set up periodic check to handle token expiration
      interval = setInterval(checkAuthStatus, checkInterval);
    }

    // Cleanup interval and subscription on component unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
      unsubscribe();
    };
  }, [enablePeriodicCheck, checkInterval]);

  return {
    isLoggedIn,
    user,
    isLoading,
    checkAuthStatus,
    logout
  };
};

export default useAuth;
