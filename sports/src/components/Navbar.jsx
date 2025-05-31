import React from 'react'
import { Link } from 'react-router-dom';
import './styles.css';
import Padhmashali from '../assets/Padhmashali.png';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
    return (
        <nav id="header" className="header bg-gradient-to-r from-blue-800 to-purple-600 flex flex-row items-center justify-between sticky top-0 z-46">
            <div className='header flex flex-row items-center justify-between sticky top-0 z-10 w-[90%] mx-auto'>
                <div className="flex flex-row items-center justify-between w-full">
                    <div className="pl-12 md:pl-0">
                        <img src={Padhmashali} className='p-5 drop-shadow-[0px_0px_20px_white] filter w-24 md:w-32' alt="logo" />
                    </div>
                   
                    <div className='hidden md:flex flex-row items-center justify-center gap-2'>
                        <h1 className='text-[20px] text-white pr-[60px]'>PADMASHALI KREEDOTHSAVA</h1>
                    </div>
                    <div className="profile nav-links flex flex-row pr-5 gap-2 items-center">
                        <ProfileDropdown />
                    </div>
                </div>
            </div>
        </nav>
    )
};

export default Navbar;

