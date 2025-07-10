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

      {/* Sidebar */}
      <aside
        className={`fixed md:relative min-h-screen bg-white shadow-xl flex flex-col transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isCollapsed ? 'w-20' : 'w-64'}
          z-40`}
      >
        {/* Collapse Button - Only visible on desktop */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:block absolute -right-3 top-6 bg-[#D35D38] text-white p-1.5 rounded-full shadow-lg hover:bg-[#B84A2E] transition-colors duration-200 border-2 border-white"
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

        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#F8DFBE]">
          <h2 className={`text-lg font-bold text-[#2A2A2A] transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>Menu</h2>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className={`md:hidden p-2 rounded-md text-[#2A2A2A] hover:bg-[#F8DFBE] transition-colors ${isCollapsed ? 'hidden' : ''}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {/* My Events Link */}
            <li className={`${isCollapsed ? 'flex justify-center' : ''}`}>
              <Link
                to="/myevents"
                onClick={handleNavigation}
                className={`flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors ${
                  location.pathname === '/myevents' ? 'bg-[#F8DFBE]' : ''
                } ${isCollapsed ? 'justify-center w-full' : ''} ${
                  location.pathname === '/myevents'
                    ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                    : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                }`}
              >
                <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
                  My Events
                </span>
              </Link>
            </li>

            {/* Participants Link with Notification */}
            <li className={`relative ${isCollapsed ? 'flex justify-center' : ''}`}>
              <Link
                to="/myevents/templeparticipants"
                onClick={handleNavigation}
                className={`flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors ${
                  location.pathname === '/myevents/templeparticipants' ? 'bg-[#F8DFBE]' : ''
                } ${isCollapsed ? 'justify-center w-full' : ''} ${
                  location.pathname === '/myevents/templeparticipants'
                    ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                    : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                }`}
              >
                <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
                  Participants
                </span>
              </Link>
              {pendingCount > 0 && (
                <span className={`absolute bg-[#D35D38] text-white text-xs font-bold px-2 py-1 rounded-full min-w-[20px] flex items-center justify-center ${
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
            </li>

            {/* Team Events Link */}
            <li className={`${isCollapsed ? 'flex justify-center' : ''}`}>
              <Link
                to="/myevents/groupevents"
                onClick={handleNavigation}
                className={`flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors ${
                  location.pathname === '/myevents/groupevents' ? 'bg-[#F8DFBE]' : ''
                } ${isCollapsed ? 'justify-center w-full' : ''} ${
                  location.pathname === '/myevents/groupevents'
                    ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                    : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                }`}
              >
                <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
                  Team Events
                </span>
              </Link>
            </li>

            {/* Athletes Link */}
            <li className={`${isCollapsed ? 'flex justify-center' : ''}`}>
              <Link
                to="/myevents/Participantslist"
                onClick={handleNavigation}
                className={`flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors ${
                  location.pathname === '/myevents/Participantslist' ? 'bg-[#F8DFBE]' : ''
                } ${isCollapsed ? 'justify-center w-full' : ''} ${
                  location.pathname === '/myevents/Participantslist'
                    ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                    : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                }` }
              >
                <svg className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
                  Athletes
                </span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Menu Footer */}
        <div className="p-4 border-t border-[#F8DFBE]">
          <div className={`text-center transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>
            <p className="text-sm text-[#5A5A5A]">Padmashali Annual Sports Meet</p>
            <p className="text-xs text-[#5A5A5A] mt-1">© {new Date().getFullYear()} All rights reserved</p>
          </div>
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