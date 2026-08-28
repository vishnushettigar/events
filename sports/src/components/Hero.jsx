import React, { useState, useEffect } from "react";
import "./styles.css";
import { Link, useNavigate } from "react-router-dom";
import heroImg from "../assets/heroBg2.png";
import { useLanguage } from "../contexts/LanguageContext";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaArrowRight,
  FaDownload,
} from "react-icons/fa";

export const Hero = () => {
  const { isEnglish } = useLanguage();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleMyEventsClick = () => {
    navigate("/myevents");
  };

  return (
    <div className="w-full flex flex-col md:relative md:min-h-screen bg-black">
      {/* 40% Height Image Column on Mobile, Absolute Background on Desktop */}
      <div className="w-full h-[40vh] md:h-auto md:absolute md:inset-0 md:z-0 select-none relative overflow-hidden flex-shrink-0">
        {/* Mobile Collaged Image */}
        <img
          src="https://res.cloudinary.com/ddzrfwfsl/image/upload/q_auto,f_auto/v1787808949/heroBg_1_1_whz3up.jpg"
          alt="Sports Collage Background Mobile"
          className="block md:hidden w-full h-full object-cover object-center pointer-events-none"
        />
        {/* Desktop Collaged Image */}
        <img
          src="https://res.cloudinary.com/ddzrfwfsl/image/upload/q_auto,f_auto/v1787806618/heroBg_1_lbowzg.png"
          alt="Sports Collage Background Desktop"
          className="hidden md:block w-full h-full object-cover object-center pointer-events-none"
        />
        {/* Overlays for high readability and image focus */}
        <div className="hidden md:block absolute inset-0 bg-black/30"></div>
        {/* Dark-to-transparent gradient from bottom to top */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
        {/* Subtle top gradient for navbar legibility */}
        <div className="hidden md:block absolute top-0 left-0 right-0 h-28 bg-gradient-to-b from-black/75 to-transparent"></div>
      </div>

      {/* Main Content Area (Text & Headings in overlapping white card on mobile) */}
      <div className="relative z-10 w-full bg-[#f0f0f0] md:bg-transparent rounded-t-[32px] md:rounded-none -mt-8 md:mt-0 px-4 md:px-6 pb-6 md:p-0 flex flex-col items-stretch md:items-center justify-start md:justify-end md:min-h-screen pt-6 md:pt-12 md:pb-16 shadow-[0_-8px_30px_rgba(0,0,0,0.03)] md:shadow-none">
        <div className="flex flex-col items-start md:items-center justify-center text-left md:text-center max-w-5xl mx-auto w-full mb-3  md:mt-auto">
          {/* Welcome Intro */}
          {/* <p className="text-xs sm:text-sm font-semibold text-[#777] tracking-widest uppercase mb-2">
            {isEnglish ? "Warm Welcome" : "ಸುಸ್ವಾಗತ"}
          </p> */}
          {/* Dynamic Slanted Headings */}
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-extrabold leading-tight text-[#2A2A2A] md:text-white uppercase mb-4 hero-title-shadow">
            {isEnglish ? (
              <span>
                34<sup className="lowercase">th</sup> Padmashil Kreedothsava
                2026
              </span>
            ) : (
              <>
                ಕ್ರೀಡಾ ಸಂಭ್ರಮ. <br />
                <span className="text-[#D35D38]">ಚಾಂಪಿಯನ್ಸ್ ನಿರ್ಮಾಣ.</span>
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="sm:text-lg md:text-3xl text-[#555] font-semibold md:text-gray-200 font-medium leading-relaxed hero-subtitle-shadow">
            {isEnglish ? (
              <span>D.K. Jilla Padmashali Mahasabha&reg; Mangaluru</span>
            ) : (
              "ಯುವ ಕ್ರೀಡಾಪಟುಗಳ ಒಕ್ಕೂಟ. ಉತ್ಕೃಷ್ಟತೆಯ ಪ್ರೇರಣೆ. ಕ್ರೀಡಾ ಮನೋಭಾವದ ಗೌರವ."
            )}
          </p>

          {/* CTA Buttons - Hidden on tablet/desktop, full width on mobile */}
          <div className="mt-6 w-full md:hidden flex justify-center">
            <Link
              to={isLoggedIn ? "/myevents" : "/login"}
              className="w-full max-w-[420px] bg-[#D35D38] hover:bg-[#B84A2E] text-white font-bold px-6 py-3 rounded-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
            >
              <span>{isLoggedIn ? (isEnglish ? "Go to Dashboard" : "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹೋಗಿ") : (isEnglish ? "Login" : "ಲಾಗಿನ್")}</span>
              <FaArrowRight className="w-4 h-4 flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* Metrics Info Card Section */}
        <div className="w-full max-w-4xl md:mx-auto md:translate-y-1/2 relative z-30 mt-4 md:mt-0">
          <div
            className="bg-black/95 backdrop-blur-md border border-white/20 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Inline keyframe animation styling for the shine effect */}
            <style>{`
              @keyframes metallicShineNormal {
                0% {
                  transform: translateX(-200%) skewX(-30deg);
                }
                37.5% { /* 1.5s / 4s = 37.5% */
                  transform: translateX(200%) skewX(-30deg);
                }
                100% {
                  transform: translateX(200%) skewX(-30deg);
                }
              }
              @keyframes metallicShineHover {
                0% {
                  transform: translateX(-200%) skewX(-30deg);
                }
                25% { /* 1.5s / 6s = 25% */
                  transform: translateX(200%) skewX(-30deg);
                }
                100% {
                  transform: translateX(200%) skewX(-30deg);
                }
              }
              .metallic-shine-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                  to right,
                  rgba(255, 255, 255, 0) 0%,
                  rgba(255, 255, 255, 0.05) 30%,
                  rgba(255, 255, 255, 0.15) 50%,
                  rgba(255, 255, 255, 0.05) 70%,
                  rgba(255, 255, 255, 0) 100%
                );
                transform: translateX(-200%) skewX(-30deg);
                pointer-events: none;
                z-index: 0;
              }
            `}</style>

            {/* Shining overlay element with hover duration adjustment */}
            <div
              className="metallic-shine-overlay"
              style={{
                animation: isHovered
                  ? "metallicShineHover 6s infinite ease-in-out"
                  : "metallicShineNormal 4s infinite ease-in-out",
              }}
            />

            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
              {/* Column 1: Dates */}
              <div className="flex items-center justify-start gap-4 py-4 md:py-0 md:px-6 first:pt-0 last:pb-0 md:first:pt-0 md:last:pb-0 flex-1 shrink">
                <div className="p-2.5 bg-[#D35D38]/10 rounded-xl text-[#D35D38] border border-[#D35D38]/20 flex-shrink-0">
                  <FaCalendarAlt className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-white tracking-wide">
                    {isEnglish ? "AUG 27 – 31, 2026" : "ಆಗಸ್ಟ್ 27 – 31, 2026"}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-400 font-semibold uppercase tracking-wider mt-0.5">
                    {isEnglish ? "Event Dates" : "ಕ್ರೀಡಾ ದಿನಾಂಕಗಳು"}
                  </p>
                </div>
              </div>

              {/* Column 2: Location */}
              <div className="flex items-center justify-start gap-4 py-4 md:py-0 md:px-6 flex-1 grow">
                <div className="p-2.5 bg-[#D35D38]/10 rounded-xl text-[#D35D38] border border-[#D35D38]/20 flex-shrink-0">
                  <FaMapMarkerAlt className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm sm:text-base font-bold text-white tracking-wide leading-snug">
                    {isEnglish
                      ? "Sri kshetra Kalyanpura, Santhekatte"
                      : "ಡಿ.ಸಿ. ಜೈನ್ ಶಾಲೆ, ಮಣಿಗಾಲಾ,"}
                  </p>
                  <p className="text-[10px] sm:text-xs font-semibold text-gray-200 mt-0.5">
                    {isEnglish ? "Hosapete, Karnataka" : "ಹೊಸಪೇಟೆ, ಕರ್ನಾಟಕ"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Background spacers below info card on desktop */}
      <div className="bg-[#f0f0f0] h-12 md:h-16 w-full hidden md:block"></div>
    </div>
  );
};

export default Hero;
