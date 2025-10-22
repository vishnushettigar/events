import React, { useState, useEffect } from 'react'
import { Link,useLocation } from 'react-router-dom';
import './styles.css';
import ProfileDropdown from './ProfileDropdown';
import { userAPI } from '../utils/api.js';
import logo2 from '../assets/pmlogo.jpeg';
import Toggle from './Toggle';
import profile from '../assets/profile.svg';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
    const [userInfo, setUserInfo] = useState(null);
    
    // Use custom auth hook with periodic checking enabled
    const { isLoggedIn, user } = useAuth(true, 30000);

    // Get the current location
    const location = useLocation();

    // Check if the current path is the home page
    const isHomePage = location.pathname === '/';

    // Fetch user profile when authenticated
    useEffect(() => {
        if (isLoggedIn && user) {
            fetchUserProfile();
        } else {
            setUserInfo(null);
        }
    }, [isLoggedIn, user]);

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
        }
    };

    // Check if user is Temple Admin (role_id = 2)
    const isTempleAdmin = userInfo && userInfo.role_id === 2;

    return (
        <nav id="header" className="header fixed bg-[#FCFCFC] h-16 flex flex-row items-center justify-between sticky top-0 z-46">
            <div className='header flex flex-row items-center justify-between sticky top-0 z-10 w-[95%] md:w-[90%] mx-auto'>
                <div className="flex flex-row items-center justify-between w-full">
                    
                    <div className="flex items-center">
                        {/* Logo */}
                        <div className="pl-0 md:pl-0 lg:p-2">
                            <Link to="">
                                <img
                                    src={logo2}
                                    className='drop-shadow-[0px_0px_20px_white] filter h-8 w-auto md:h-12 lg:h-12 max-h-full object-contain'
                                    alt="logo"
                                />
                            </Link>
                        </div>
                   
                    </div>                
                    {/* <div className='hidden md:flex flex-row items-center justify-center gap-2'>
                        <h1 className='text-[20px] text-white pr-[60px]'>PADMASHALI KREEDOTHSAVA</h1>
                    </div> */}
                    <div className="profile nav-links flex flex-row pr-1 gap-4 items-center">
                    {isHomePage && <Toggle />}
                        <ProfileDropdown />
                    </div>
                </div>
            </div>

        </nav>
    )
};

export default Navbar;

