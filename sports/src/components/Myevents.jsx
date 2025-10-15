import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { userAPI } from '../utils/api.js';
import { isAuthenticated } from '../utils/tokenUtils';
import authManager from '../utils/authManager';

const Myevents = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Check if user is authenticated with valid token
        if (!isAuthenticated()) {
          navigate('/login');
          return;
        }

        const data = await userAPI.getProfile();
        setUserInfo(data);
        setUserRole(data.role_id);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user info:', err);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Token is invalid or expired - redirect to login
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to fetch user profile');
        setLoading(false);
      }
    };

    fetchUserInfo();

    // Listen for global logout events
    const handleAuthLogout = () => {
      console.log('Myevents: Received authLogout event - redirecting to login');
      navigate('/login');
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F0F0F0]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D35D38]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#F0F0F0]">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-lg">
          <h3 className="font-bold text-lg mb-2">Error</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-screen overflow-hidden bg-[#F0F0F0]">
      {userRole === 2 && (
      <Sidebar />
      )}
      <div className="flex-1 overflow-auto bg-[#F0F0F0]">
        <Outlet />
      </div>
    </section>
  );
};

export default Myevents;