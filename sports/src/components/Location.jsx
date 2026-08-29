import React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { FaMapMarkerAlt } from "react-icons/fa";

const Location = () => {
  const { isEnglish } = useLanguage();

  return (
    <section className="w-[90%] mx-auto my-14">
      {/* Title block matching other sections */}
      <div className="text-left md:text-center mb-10">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          {isEnglish ? (
            <>
              Event <span className="text-[#D35D38]">Venue</span>
            </>
          ) : (
            <>
              ಕಾರ್ಯಕ್ರಮದ <span className="text-[#D35D38]">ಸ್ಥಳ</span>
            </>
          )}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A] font-medium">
          {isEnglish
            ? "Join us at the official event grounds"
            : "ಕಾರ್ಯಕ್ರಮ ನಡೆಯುವ ಅಧಿಕೃತ ಸ್ಥಳ"}
        </p>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none z-0"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">
          {/* Left Column: Map */}
          <div className="w-full md:w-1/2 flex justify-center z-10">
            <div className="overflow-hidden rounded-2xl border border-slate-100/80 shadow-[0_4px_15px_rgba(0,0,0,0.015)] w-full">
              <iframe
                className="w-full"
                height="220"
                frameBorder="0"
                scrolling="no"
                marginHeight="0"
                marginWidth="0"
                title="Google Map"
                src="https://maps.google.com/maps?width=100%25&amp;height=220&amp;hl=en&amp;q=Government%20Junior%20College%2C%20Karnad%2C%20Mulki%2C%20Karnataka%20574154+(Government%20Junior%20College)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* Right Column: Address details */}
          <div className="w-full md:w-1/2 flex flex-col justify-start items-start gap-4 z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#D35D38]/10 rounded-xl text-[#D35D38] flex-shrink-0 shadow-sm border border-black/5">
                <FaMapMarkerAlt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#2A2A2A]">
                  {isEnglish ? "Official Venue" : "ಅಧಿಕೃತ ಸ್ಥಳ"}
                </h3>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                  {isEnglish
                    ? "Government Junior College"
                    : "ಸರ್ಕಾರಿ ಪದವಿ ಪೂರ್ವ ಕಾಲೇಜು"}
                </p>
              </div>
            </div>
            <p className="text-sm font-semibold text-slate-700 leading-relaxed">
              {isEnglish
                ? "Government Junior College Ground, 19-31, Karnad, Mulki, Karnataka 574154"
                : "ಸರ್ಕಾರಿ ಪದವಿ ಪೂರ್ವ ಕಾಲೇಜು ಮೈದಾನ, 19-31, ಕರ್ನಾಡ್, ಮುಲ್ಕಿ, ಕರ್ನಾಟಕ 574154"}
            </p>
            <a
              href="https://www.google.com/maps/search/?api=1&query=Government+Junior+College%2C+Karnad%2C+Mulki%2C+Karnataka+574154"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-6 py-2.5 bg-[#D35D38] text-white rounded-xl shadow-md shadow-[#D35D38]/10 hover:bg-[#B84A2E] active:scale-95 transition-all duration-200 text-center font-bold text-sm cursor-pointer"
            >
              {isEnglish ? "Get Directions" : "ಮಾರ್ಗಸೂಚಿ ಪಡೆಯಿರಿ"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Location;
