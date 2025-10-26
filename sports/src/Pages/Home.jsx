import React, { useEffect } from "react";

import Sponsors from "../components/Sponsers";
import Rules from "../components/Rules";
import Counts from "../components/Counts";
import Location from "../components/Location";
import "./styles.css"; // Create this file for styling
import { Link, useNavigate } from "react-router-dom";
import Contacts from "../components/Contacts";
import heroImg from "../assets/heroImg.png";
import EventDetails from "../components/EventDetails";
// import background from "../assets/background.png";
// import Loginbg from "../assets/Login-Img.png"
import { useLanguage } from "../contexts/LanguageContext";
import SportsHistoryMarquee from "../components/SportsHistoryMarquee";
import SportsHistoryHome from "../components/SportsHistoryHome";
import { useAuth } from "../hooks/useAuth";
import authManager from "../utils/authManager";

const Home = () => {
  const { isEnglish } = useLanguage();
  const navigate = useNavigate();
  
  // Use custom auth hook with periodic checking enabled
  const { isLoggedIn } = useAuth(true, 30000);

  // Listen for global logout events to ensure UI updates
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('Home: Received authLogout event - UI should update');
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);

  const handleMyEventsClick = () => {
    navigate('/myevents');
  };

  return (
    <>
      {/* Hero Section Redesigned */}
      <section className="relative pt-[2px] pt-12  flex items-center bg-[#F0F0F0] overflow-hidden">
        {/* Top Organization Name */}
        <div className="absolute top-4 left-0 right-0 z-20 text-center px-4 md:mt-4">
          <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-[#D35D38] mb-4 md:mb-0">
            {isEnglish 
              ? "D.K. Jilla Padmashali Mahasabha® Mangaluru"
              : "ದ.ಕ. ಜಿಲ್ಲಾ ಪದ್ಮಶಾಲಿ ಮಹಾಸಭಾ® ಮಂಗಳೂರು"
            }
          </p>
        </div>
        
        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-start px-4 py-4 max-w-7xl mx-auto w-full mt-16 md:mt-8">
          {/* Left Side - Charaka Image */}
          <div className="flex-1 flex justify-center md:justify-start mb-4 md:mb-0">
            <img
              src={heroImg}
              alt="background"
              className="max-w-xs md:p-10 md:m-3  md:max-w-md lg:max-w-lg "
            />
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col items-start md:items-start md:text-left mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-[#2A2A2A]  mb-3 whitespace-pre-line">
              {isEnglish 
                ? <>33<sup>rd</sup> Padmashali Kreedothsava - 2025</>
                : <>33ನೇ ಪದ್ಮಶಾಲಿ <br/> ಕ್ರೀಡೋತ್ಸವ - 2025</>
              }
            </h1>
            {/* <p className="text-[16px] md:text-[20px] text-[#5A5A5A] mb-2">
              Hosted by Sri Brahmalinga Veerabhadra Durgaparameshwari temple,
              Salikeri
            </p> */}
            <EventDetails />
            <div className="flex flex-row sm:flex-row gap-2 sm:gap-4 mt-4 w-full">
              {isLoggedIn ? (
                <button
                  onClick={handleMyEventsClick}
                  className="flex-1 sm:flex-initial px-8 h-12 rounded-lg text-center bg-[#D35D38] text-white font-medium text-md shadow-lg hover:bg-[#B84A2E] transition w-[160px] flex items-center justify-center whitespace-nowrap leading-none"
                >
                  {isEnglish ? "My Events" : "ನನ್ನ ಸ್ಪರ್ಧೆಗಳು"}
                </button>
              ) : (
                <>
                  <a
                    href="/login"
                    className="flex-1 sm:flex-initial px-8 h-12 rounded-lg text-center text-[#D35D38] border-[1.5px] border-[#D35D38] font-medium text-md hover:bg-[#e0e0e0] transition w-[140px] flex items-center justify-center whitespace-nowrap leading-none"
                  >
                    {isEnglish ? "Login" : "ಲಾಗಿನ್"}
                  </a>
                  <a
                    href="/register"
                    className="flex-1 sm:flex-initial px-8 h-12 rounded-lg text-center bg-[#D35D38] text-white font-medium text-md shadow-lg hover:bg-[#B84A2E] transition w-[140px] flex items-center justify-center whitespace-nowrap leading-none"
                  >
                    {isEnglish ? "Register" : "ನೋಂದಣಿ"}
                  </a>
                </>
              )}
              {/* <button
                  className="w-full sm:w-80 px-4 py-3 rounded-lg text-center bg-[#D35D38] text-white font-medium text-sm shadow-lg hover:bg-[#B84A2E] transition"
                >
                {isEnglish ? "Registration will start soon" : "ನೋಂದಣಿ ಶೀಘ್ರದಲ್ಲೇ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ"}
              </button> */}
             

            </div>
          </div>
        </div>
      </section>     
      <div className="bg-[#F0F0F0]">
        <div>
          {" "}
          <Counts />
        </div>
        <div>
          <Sponsors />
        </div>
        <div>
          <Location />
        </div>
        {/* Sports History Section */}
        {/* <div >
        <SportsHistoryMarquee />
        <SportsHistoryHome />
        </div> */}
        <div>
          <Rules />
        </div>
        <div>
          <Contacts />
        </div>
      </div>

      
    </>
  );
};

export default Home;
