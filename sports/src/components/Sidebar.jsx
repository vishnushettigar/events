import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:4000/api/events/temple-participants', {
          params: {
            status: 'PENDING'
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setPendingCount(response.data.length);
      } catch (error) {
        console.error('Error fetching pending participants:', error);
        setError('Failed to fetch pending count');
        setPendingCount(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPendingCount();
    // Refresh the count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleNavigation = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors duration-200"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed md:relative min-h-screen bg-gradient-to-b from-blue-800 to-blue-500 shadow-2xl flex flex-col transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          z-40`}
      >
        {/* Collapse Button - Only visible on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-6 bg-blue-600 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 border-2 border-white"
        >
          {isCollapsed ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          )}
        </button>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-2 mt-8 px-3">
          {/* My Events Link */}
          <Link
            to="/myevents"
            onClick={handleNavigation}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-700 hover:text-white ${
              location.pathname === '/myevents' 
                ? 'bg-blue-900 text-white' 
                : 'bg-white text-blue-600'
            }`}
          >
            <span className={`text-xl flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
              🏅
            </span>
            <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
              My Events
            </span>
          </Link>

          {/* Participants Link with Notification */}
          <div className="relative">
            <Link
              to="/myevents/templeparticipants"
              onClick={handleNavigation}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-700 hover:text-white ${
                location.pathname === '/myevents/templeparticipants' 
                  ? 'bg-blue-900 text-white' 
                  : 'bg-white text-blue-600'
              }`}
            >
              <span className={`text-xl flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
                👥
              </span>
              <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
                Participants
              </span>
            </Link>
            {pendingCount > 0 && (
              <span className={`absolute bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center ${
                isCollapsed 
                  ? 'top-0 right-0 transform translate-x-1/2 -translate-y-1/2' 
                  : 'top-1/2 right-4 transform -translate-y-1/2'
              }`}>
                {isLoading ? (
                  <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : error ? (
                  '!'
                ) : (
                  pendingCount
                )}
              </span>
            )}
      </div>

          {/* Team Events Link */}
          <Link
            to="/myevents/groupevents"
            onClick={handleNavigation}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-700 hover:text-white ${
              location.pathname === '/myevents/groupevents' 
                ? 'bg-blue-900 text-white' 
                : 'bg-white text-blue-600'
            }`}
          >
            <span className={`text-xl flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
              🤝
            </span>
            <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
              Team Events
            </span>
          </Link>

          {/* Athletes Link */}
          <Link
            to="/myevents/Participantslist"
            onClick={handleNavigation}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-blue-700 hover:text-white ${
              location.pathname === '/myevents/Participantslist' 
                ? 'bg-blue-900 text-white' 
                : 'bg-white text-blue-600'
            }`}
          >
            <span className={`text-xl flex items-center justify-center ${isCollapsed ? 'w-full' : ''}`}>
              🏃‍♂️
            </span>
            <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
              Athletes
            </span>
          </Link>
      </nav>

        {/* Copyright Section */}
        <div className="mt-auto mb-6 px-3">
          <p className={`text-xs text-blue-100 text-center transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
            © {new Date().getFullYear()} Padmashali Kreedothsava
          </p>
      </div>
    </aside>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;