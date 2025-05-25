import React from 'react'
import { Link } from 'react-router-dom';
import './styles.css';
import Padhmashali from '../assets/Padhmashali.png';

const Navbar = () => {
    return (
        <nav id="header" className="header  bg-gradient-to-r from-blue-800 to-purple-600 flex flex-row items-center  justify-between sticky top-0 z-20 " >
            <div className='header  flex flex-row items-center  justify-between sticky top-0 z-10 w-[90%] mx-auto'>
                <div className="flex flex-row items-center  w-full">
                    <Link to="/">
                        <img src={Padhmashali} className='p-5 drop-shadow-[0px_0px_20px_white] filter' width="120px" alt="logo" />
                    </Link>
                    <div className='flex flex-row items-center gap-2'>
                        <h1 className='text-[20px] text-white pl-[300px]'>  PADMASHALI KREEDOTHSAVA</h1>
                        <Link to="/myevents"><h3 className='text-white'>myevents</h3></Link>
                    </div>
                </div>
                <div className="nav-links flex flex-row pr-5 gap-2">
                    {/* <button className='get-started-btn '>
                        <Link to="/login" className='ml-[30px] p-2 rounded px-[25px] whitespace-nowrap transition duration-300 text-sm font-semibold inline-block bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white'>
                            login</Link>
                    </button>
                    <button className='get-started-btn'>
                        <Link to="/register" className='ml-[30px] p-2 rounded px-[25px] whitespace-nowrap transition duration-300 text-sm font-semibold inline-block bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-white'>
                            register</Link>
                    </button> */}
                </div>
            </div>
        </nav>
    )
};

export default Navbar;

