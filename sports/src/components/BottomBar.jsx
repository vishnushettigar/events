import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { eventAPI } from '../utils/api.js';

const BottomBar = () => {
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const data = await eventAPI.getTempleParticipants({ status: 'PENDING' });
        setPendingCount(data.length);
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

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#F8DFBE] z-50 md:hidden">
      <nav className="flex items-center justify-around py-2">
        {/* My Events */}
        <Link
          to="/myevents"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
            isActive('/myevents')
              ? 'text-[#D35D38] bg-[#F8DFBE]'
              : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-medium truncate">My Events</span>
        </Link>

        {/* Individual Events with Notification */}
        <div className="relative flex flex-col items-center justify-center min-w-0 flex-1">
          <Link
            to="/myevents/templeparticipants"
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors w-full ${
              isActive('/myevents/templeparticipants')
                ? 'text-[#D35D38] bg-[#F8DFBE]'
                : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
            }`}
          >
            <div className="relative">
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              {pendingCount > 0 && (
                <span className="absolute -top-3 -right-4 bg-[#D35D38] text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[16px] flex items-center justify-center text-[10px]">
                  {isLoading ? (
                    <svg className="animate-spin h-2 w-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <span className="text-xs font-medium truncate">Individual</span>
          </Link>
        </div>

        {/* Team Events */}
        <Link
          to="/myevents/groupevents"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
            isActive('/myevents/groupevents')
              ? 'text-[#D35D38] bg-[#F8DFBE]'
              : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium truncate">Team</span>
        </Link>

        {/* Athletes */}
        <Link
          to="/myevents/Participantslist"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 ${
            isActive('/myevents/Participantslist')
              ? 'text-[#D35D38] bg-[#F8DFBE]'
              : 'text-[#5A5A5A] hover:text-[#2A2A2A]'
          }`}
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs font-medium truncate">Athletes</span>
        </Link>
      </nav>
    </div>
  );
};

export default BottomBar;
