import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Padhmashali from '../assets/Padhmashali.png';

const Sidebar = () => {
  const location = useLocation();
  return (
    <aside className="min-h-screen w-74 bg-gradient-to-b from-blue-800 to-blue-500 shadow-2xl flex flex-col p-0">
      <div className="flex flex-col items-center py-8 bg-blue-900 rounded-br-3xl rounded-bl-3xl shadow-md">
        <img src={Padhmashali} alt="Logo" className="pt-2 pb-2 pl-6 pr-6 w-40 h-20 mb-4 rounded-full border-4 border-white shadow-lg" />
        <h2 className="text-white text-2xl font-bold tracking-wide">My Events</h2>
      </div>
      <nav className="flex flex-col gap-2 mt-8 px-6">
        <Link to="/myevents" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>🏅 My Events</Link>
        <Link to="/myevents/templeparticipants" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/templeparticipants' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>👥 Participants</Link>
        <Link to="/myevents/groupevents" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/groupevents' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>🤝 Team Events</Link>
        <Link to="/myevents/athletes" className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition text-left text-lg shadow-sm duration-200 hover:bg-blue-700 hover:text-white ${location.pathname === '/myevents/athletes' ? 'bg-blue-900 text-white' : 'bg-white text-blue-600'}`}>🏃‍♂️ Athletes</Link>
      </nav>
      <div className="mt-auto mb-8 px-6">
        <p className="text-xs text-blue-100 text-center">© {new Date().getFullYear()} Padmashali Kreedothsava</p>
      </div>
    </aside>
  );
};

export default Sidebar;