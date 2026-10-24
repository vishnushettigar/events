import React from "react";

const Footer = () => {
  return (
    <footer className="w-full z-46 bg-[#FCFCFC] border-t border-gray-200">
      <div className="bg-[#FCFCFC] z-20 w-[90%] mx-auto">
        {/* Copyright Section - Responsive */}
        <div className="pt-5 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            {/* Contact Section */}
            <div className="flex flex-row items-center gap-1">
              <a
                href="mailto:friendsclubsalikeri@gmail.com"
                className="flex items-center gap-1 text-sm text-[#5A5A5A] hover:text-[#D35D38] transition-colors"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="flex-shrink-0"
                >
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                friendsclubsalikeri@gmail.com
              </a>
            </div>
            <div className="hidden md:block"></div> {/* Spacer for desktop */}
            <p className="text-xs text-center md:text-right text-[#5a5a5a] order-2 md:order-1">
              Copyright &copy; 2026 SFLabs. All Rights Reserved
            </p>
            {/* <div className="hidden md:block"></div> Spacer for desktop */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;