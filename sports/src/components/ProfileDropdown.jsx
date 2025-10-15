import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
// import userIcon from '../assets/user-icon.png';
import { userAPI } from '../utils/api.js';
import profile from '../assets/profile.svg';
import { useAuth } from '../hooks/useAuth';
import { isAuthenticated } from '../utils/tokenUtils';
import authManager from '../utils/authManager';

const ProfileDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  
  // Use custom auth hook with periodic checking enabled
  const { isLoggedIn, user, logout } = useAuth(true, 30000);

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch user profile when authenticated
  useEffect(() => {
    console.log('ProfileDropdown - isLoggedIn:', isLoggedIn);
    console.log('ProfileDropdown - user:', user);
    console.log('ProfileDropdown - userInfo:', userInfo);
    console.log('ProfileDropdown - isAuthenticated():', isAuthenticated());
    
    // Use both useAuth hook and direct token check as fallback
    const isActuallyLoggedIn = isLoggedIn || isAuthenticated();
    
    if (isActuallyLoggedIn) {
      setIsLoadingProfile(true);
      fetchUserProfile();
    } else {
      setUserInfo(null);
      setIsLoadingProfile(false);
    }
  }, [isLoggedIn, user]);

  // Add periodic check to ensure dropdown stays in sync
  useEffect(() => {
    const interval = setInterval(() => {
      const isActuallyLoggedIn = isLoggedIn || isAuthenticated();
      if (isActuallyLoggedIn && !userInfo && !isLoadingProfile) {
        console.log('ProfileDropdown - Periodic check: fetching profile');
        setIsLoadingProfile(true);
        fetchUserProfile();
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [isLoggedIn, userInfo, isLoadingProfile]);

  // Listen for global logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('ProfileDropdown: Received authLogout event');
      setUserInfo(null);
      setIsLoadingProfile(false);
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      setUserInfo(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        // Token is invalid or expired - the useAuth hook will handle this
        setUserInfo(null);
      }
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleLogout = () => {
    console.log('ProfileDropdown: Handling logout');
    // Check if we're on the home page
    const isOnHomePage = window.location.pathname === '/';
    
    if (isOnHomePage) {
      // Stay on home page, don't redirect
      authManager.logout(false);
    } else {
      // Redirect to login for other pages
      authManager.logout(true);
    }
    
    setUserInfo(null);
    setShowLogoutModal(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
     
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 pb-[1px] focus:outline-none"
      >
        <img
          src={profile}
          alt="Profile"
          className="w-10 h-10 cursor-pointer rounded-full border-2 border-white"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
          {(isLoggedIn || isAuthenticated()) ? (
            <>
              {isLoadingProfile || !userInfo ? (
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#D35D38]"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-800">
                      {userInfo?.first_name} {userInfo?.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{userInfo?.temple}</p>
                  </div>
                  <Link
                    to="/myevents"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsOpen(false)}
                  >
                    My events
                  </Link>
                  {userInfo?.role_id === 5 && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">👑</span>
                        Admin Panel
                      </span>
                    </Link>
                  )}
                  {userInfo?.role_id === 4 && (
                    <Link
                      to="/viewer"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">🛡️</span>
                        Viewer 
                      </span>
                    </Link>
                  )}
                  {userInfo?.role_id === 3 && (
                    <Link
                      to="/staffpanel"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 border-t border-gray-100"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="flex items-center">
                        <span className="mr-2">⚙️</span>
                        Staff Panel
                      </span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setShowLogoutModal(true);
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Logout</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to logout?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown; 