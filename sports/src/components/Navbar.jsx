import React, { useState } from 'react'
import { Link } from 'react-router-dom';
import './styles.css';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav id="header" className="header fixed bg-[#FCFCFC] flex flex-row items-center justify-between sticky top-0 z-46">
            <div className='header flex flex-row items-center justify-between sticky top-0 z-10 w-[90%] mx-auto'>
                <div className="flex flex-row items-center justify-between w-full">
                    
                    <div className="flex items-center">
                        {/* Hamburger Menu - Only visible on mobile */}
                        <button
                            onClick={toggleMenu}
                            className="md:hidden p-2 rounded-lg hover:bg-[#F0F0F0] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                            aria-label="Toggle menu"
                        >
                            <div className="w-6 h-6 flex flex-col justify-center items-center">
                                <span className={`block w-5 h-0.5 bg-[#2A2A2A] transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-1'}`}></span>
                                <span className={`block w-5 h-0.5 bg-[#2A2A2A] transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                                <span className={`block w-5 h-0.5 bg-[#2A2A2A] transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-1'}`}></span>
                            </div>
                        </button>
                        {/* Logo */}
                         <div className="pl-4 md:pl-0">
                        <Link to="/">
                        <img 
                            src="/src/assets/charaka.png" 
                            className=' drop-shadow-[0px_0px_20px_white] filter w-24 md:w-26  md:h-24' 
                            alt="logo" 
                        />
                        </Link> 
                    </div>

                    </div>

                    
                   
                    {/* <div className='hidden md:flex flex-row items-center justify-center gap-2'>
                        <h1 className='text-[20px] text-white pr-[60px]'>PADMASHALI KREEDOTHSAVA</h1>
                    </div> */}
                    <div className="profile nav-links flex flex-row pr-5 gap-2 items-center">
                        <ProfileDropdown />
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={toggleMenu}>
                    <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out" onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col h-full">
                            {/* Menu Header */}
                            <div className="flex items-center justify-between p-4 border-b border-[#F8DFBE]">
                                <h2 className="text-lg font-bold text-[#2A2A2A]">Menu</h2>
                                <button
                                    onClick={toggleMenu}
                                    className="p-2 rounded-md text-[#2A2A2A] hover:bg-[#F8DFBE] transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <nav className="flex-1 p-4">
                                <ul className="space-y-2">
                                    <li>
                                        <Link 
                                            to="/myevents" 
                                            onClick={toggleMenu}
                                            className="flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                            </svg>
                                            My Events
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/myevents/templeparticipants" 
                                            onClick={toggleMenu}
                                            className="flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                            </svg>
                                            Participants
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/myevents/groupevents" 
                                            onClick={toggleMenu}
                                            className="flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                            Team Events
                                        </Link>
                                    </li>
                                    <li>
                                        <Link 
                                            to="/myevents/Participantslist" 
                                            onClick={toggleMenu}
                                            className="flex items-center px-4 py-3 text-[#2A2A2A] hover:bg-[#F8DFBE] rounded-lg transition-colors"
                                        >
                                            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Temple Participants
                                        </Link>
                                    </li>
                                </ul>
                            </nav>

                            {/* Menu Footer */}
                            <div className="p-4 border-t border-[#F8DFBE]">
                                <div className="text-center">
                                    <p className="text-sm text-[#5A5A5A]">Padmashali Annual Sports Meet</p>
                                    <p className="text-xs text-[#5A5A5A] mt-1">© 2024 All rights reserved</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    )
};

export default Navbar;

