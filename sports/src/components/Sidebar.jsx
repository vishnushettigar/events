import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Padhmashali from '../assets/Padhmashali.png';

const Sidebar = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`min-h-screen bg-gradient-to-b from-blue-800 to-blue-500 shadow-2xl flex flex-col p-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-74'} relative`}>
      <div className="flex flex-col items-center py-8 bg-blue-900 rounded-br-3xl rounded-bl-3xl shadow-md">
        <img src={Padhmashali} alt="Logo" className={`pt-2 pb-2 pl-6 pr-6 w-40 h-20 mb-4 rounded-full border-4 border-white shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16 h-16 pl-2 pr-2' : ''}`} />
        <h2 className={`text-white text-2xl font-bold tracking-wide transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>My Events</h2>
      </div>
      <nav className="flex flex-col gap-2 mt-8 px-6">
        <Link to="/myevents" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>
          <span className="text-xl">🏅</span>
          <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>My Events</span>
        </Link>
        <Link to="/myevents/templeparticipants" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/templeparticipants' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>
          <span className="text-xl">👥</span>
          <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>Participants</span>
        </Link>
        <Link to="/myevents/groupevents" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/groupevents' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>
          <span className="text-xl">🤝</span>
          <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>Team Events</span>
        </Link>
        <Link to="/myevents/Participantslist" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/Participantslist' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>
          <span className="text-xl">🏃‍♂️</span>
          <span className={`transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>Athletes</span>
        </Link>
      </nav>
      <div className="mt-auto mb-8 px-6">
        <p className={`text-xs text-blue-100 text-center transition-all duration-300 ${isCollapsed ? 'hidden' : ''}`}>© {new Date().getFullYear()} Padmashali Kreedothsava</p>
      </div>
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute left-4 top-20 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200"
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
    </aside>
  );
};

export default Sidebar;