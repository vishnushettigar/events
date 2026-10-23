import React from "react";
import { useLanguage } from "../contexts/LanguageContext";

const Location = () => {
  const { isEnglish } = useLanguage();



  return (
    <section className="w-[90%] mx-auto my-12">
      <div className="text-center mb-6">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2  ">
          {isEnglish ? "Location" : "ಸ್ಥಳ"}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          {isEnglish ? "Join us at our event venue" : "ಕಾರ್ಯಕ್ರಮದಲ್ಲಿ ನಮ್ಮೊಂದಿಗೆ ಸೇರಿ"}
        </p>
      </div>
      <div className="flex flex-col md:flex-row gap-8 bg-[#E0E0E0] rounded-2xl  p-4 items-center">
        <div className="w-full md:w-1/2  flex justify-center">
          <iframe
            className="rounded-xl w-100 lg:w-[38rem] shadow-lg"
            width="100%"
            height="320"
            style={{ border: 0 }}
            title="Google Map"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3882.2926247371597!2d74.74045887521196!3d13.332064606872637!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bbcbb72fab4a6cf%3A0x650cd705041331c9!2sMahatma%20Gandhi%20District%20Stadium!5e0!3m2!1sen!2sin!4v1792737049005!5m2!1sen!2sin"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          ></iframe>
        </div>
        <div className="w-full md:w-1/2 flex flex-col items-start md:items-center justify-center ">
          <div className="flex flex-col  items-start md:items-center gap-1 md:gap-2 ">
            <span className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#d5d5d5] mb-2">
              <svg
                className="w-10 h-10 text-[#5A5A5A]"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </span>
            <h3 className="text-xl text-start md:text-center font-semibold text-[#2A2A2A] ">
              {isEnglish ? "Venue" : "ಸ್ಥಳ"}
            </h3>
            <p className="text-base text-start md:text-center text-[#5A5A5A] font-medium">
              {isEnglish ? (
                <>
                  Mahatma Gandhi District Stadium <br />
                  Ajjarkaad, Udupi, Karnataka 576101
                </>
              ) : (
                <>
                  ಮಹಾತ್ಮ ಗಾಂಧಿ ಕ್ರೀಡಾಂಗಣ, ಅಜ್ಜರಕಾಡು, <br />
                  ಉಡುಪಿ, ಕರ್ನಾಟಕ 576101
                </>
              )}
            </p>
            <p className="text-[#5A5A5A] text-center"></p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Government+Junior+College%2C+Karnad%2C+Mulki%2C+Karnataka+574154"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block w-56 px-4 py-2 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition text-center text-sm"
            >
              {isEnglish ? "Open in Google Maps" : "ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;