import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Myevents = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      navigate('/login');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*'
    };
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/users/profile', {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUserInfo(data);
        setUserRole(data.role_id);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserInfo();
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