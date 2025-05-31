import React from 'react';
import InstagramButton from './InstagramButton';
import SFC_logo from '../assets/sfc_logo.png';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-800 to-purple-600 z-20">
      <div className="flex flex-col md:flex-row items-center justify-between w-[90%] mx-auto p-4 md:p-6 gap-4 md:gap-0">
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-2">
          <div className="text-white text-center md:text-left">
            <div className="copyright text-sm md:text-base">© Copyright Presento. All Rights Reserved</div>
            <div className="credits text-sm md:text-base">Designed by 
              <a className="hover:text-pink-500 ml-1" href="https://www.instagram.com/friends_club_salikeri/" target="_blank" rel="noopener noreferrer">
                Friends Club Salikeri
              </a>
            </div>
          </div>
          <div className="logo">
            <a href="https://www.instagram.com/friends_club_salikeri/" target="_blank" rel="noopener noreferrer">
              <img className="w-10 md:w-12" src={SFC_logo} alt="SFC Logo" />
            </a>
          </div>
        </div>
        
        <div className="flex flex-col text-white"> 
          <div>
            <a href="https://www.instagram.com/friends_club_salikeri/" target="_blank" rel="noopener noreferrer">
              <InstagramButton />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;