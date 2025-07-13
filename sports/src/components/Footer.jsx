import React from "react";
import InstagramButton from "./InstagramButton";
import SFC_logo from "../assets/sfc_logo.png";

const Footer = () => {
  return (
    <footer className="bg-[#FCFCFC] z-20 w-[90%] mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 py-4">
        {/* Left Side - Logo, Designer, and Contact */}
        <div className="flex flex-col gap-4 w-full md:w-auto">
          <div className="flex flex-row items-center gap-2 text-sm text-start md:text-base">
            <img src={SFC_logo} alt="logo" width={40} />
            <div className="flex flex-col">
              <p>Designed by</p>
              <a
                className="hover:text-[#D35D38]"
                href="https://www.instagram.com/friends_club_salikeri/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <strong>Friends Club Salikeri</strong>
              </a>
            </div>
          </div>
          
          {/* Contact Section */}
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-[#2A2A2A]">Contact Us:</p>
            <a 
              href="mailto:friendsclubsalikeri@gmail.com"
              className="text-sm text-[#5A5A5A] hover:text-[#D35D38] transition-colors"
            >
              friendsclubsalikeri@gmail.com
            </a>
          </div>
        </div>

        {/* Right Side - Instagram Button */}
        <div className="flex text-[#2A2A2A]">
          <div>
            <a
              href="https://www.instagram.com/friends_club_salikeri/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramButton />
            </a>
          </div>
        </div>
      </div>
      
      <div className="h-[1px] w-[100%] bg-[#aaa]"></div>
      
      {/* Copyright Section - Responsive */}
      <div className="pt-5 pb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="hidden md:block"></div> {/* Spacer for desktop */}
          <p className="text-xs text-center md:text-right text-[#5a5a5a] order-2 md:order-1">
            &copy; 2025 Shettigar Sports Summit. All Rights Reserved
          </p>
          <div className="hidden md:block"></div> {/* Spacer for desktop */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;