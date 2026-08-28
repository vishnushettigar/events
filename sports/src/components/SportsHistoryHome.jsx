import React, { useState, useRef } from "react";
import { sportsHistory } from "../constants/constants";
import { useLanguage } from "../contexts/LanguageContext";
import {
  FaMapMarkerAlt,
  FaTrophy,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./styles.css";

const SportsHistoryHome = () => {
  const { isEnglish } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(2024);
  const tabContainerRef = useRef(null);

  // Reverse history so recent years (like 2024) appear first
  const sortedHistory = [...sportsHistory].reverse();

  const handleYearClick = (year) => {
    setSelectedYear(year);
  };

  const scrollTabsLeft = () => {
    if (tabContainerRef.current) {
      tabContainerRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollTabsRight = () => {
    if (tabContainerRef.current) {
      tabContainerRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const selectedEvent = sportsHistory.find(
    (event) => event.year === selectedYear,
  );

  return (
    <section className="w-[90%] mx-auto my-14 md:mt-8">
      {/* Title block matching Rules component */}
      <div className="text-left md:text-center mb-10">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          {isEnglish ? (
            <>
              Sports <span className="text-[#D35D38]">History</span>
            </>
          ) : (
            <>
              ಕ್ರೀಡಾ <span className="text-[#D35D38]">ಇತಿಹಾಸ</span>
            </>
          )}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A] font-medium">
          {isEnglish
            ? "Explore the legacy of the Padmashali Sports Meet over the years"
            : "ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವದ ಇತಿಹಾಸವನ್ನು ಅನ್ವೇಷಿಸಿ"}
        </p>
      </div>

      {/* Main container */}
      <div className="bg-white border border-gray-100 rounded-3xl p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
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

        <div className="relative z-10 flex flex-col gap-5">
          {/* Horizontal scrollable years tab row with chevrons */}
          <div className="flex items-center gap-2 relative z-10">
            {/* Prev button */}
            <button
              onClick={scrollTabsLeft}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[#D35D38] hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
              aria-label="Scroll years left"
            >
              <FaChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div
              ref={tabContainerRef}
              className="flex-1 flex gap-2 overflow-x-auto no-scrollbar"
            >
              {sortedHistory.map((event) => (
                <button
                  key={event.year}
                  onClick={() => handleYearClick(event.year)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-all duration-250 border cursor-pointer ${
                    selectedYear === event.year
                      ? "bg-[#D35D38] text-white border-transparent shadow-md shadow-[#D35D38]/10"
                      : "bg-slate-100  border-slate-100/85 text-slate-600 hover:bg-slate-100/70"
                  }`}
                >
                  {event.year}
                </button>
              ))}
            </div>

            {/* Next button */}
            <button
              onClick={scrollTabsRight}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[#D35D38] hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer flex-shrink-0"
              aria-label="Scroll years right"
            >
              <FaChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Details display at the bottom */}
          {selectedEvent && (
            <div className="p-4 bg-slate-50/70 border border-slate-100/80 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-base sm:text-lg font-semibold text-slate-800">
                  {selectedEvent.year} -{" "}
                  {isEnglish ? "Padmashali Sports Meet" : "ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ"}
                </h4>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                {/* Venue Location */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#D35D38]/10 rounded-xl text-[#D35D38] flex-shrink-0 shadow-sm border border-black/5">
                    <FaMapMarkerAlt className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      {isEnglish ? "Venue Location" : "ನಡೆದ ಸ್ಥಳ"}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedEvent.place}
                    </p>
                  </div>
                </div>

                {/* Winner Details */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl flex-shrink-0 shadow-sm border border-black/5">
                    <FaTrophy className="w-4 h-4 sm:w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                      {isEnglish ? "Champion" : "ವಿಜೇತರು"}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">
                      {isEnglish
                        ? selectedEvent.winner
                        : selectedEvent.winnerKannada}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default SportsHistoryHome;
