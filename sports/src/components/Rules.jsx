import React, { useState, useRef } from "react";
import { rules } from "../constants/constants";
import { rulesKannada } from "../constants/constants";
import { useLanguage } from "../contexts/LanguageContext";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Rules = () => {
  const { isEnglish } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const bottomRef = useRef(null);

  const rulesToDisplay = isEnglish ? rules : rulesKannada;
  const visibleRules = isExpanded ? rulesToDisplay : rulesToDisplay.slice(0, 5);

  const handleToggle = () => {
    if (isExpanded) {
      setIsExpanded(false);
      // Wait for state update and DOM collapse before scrolling
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
      }, 100);
    } else {
      setIsExpanded(true);
    }
  };

  return (
    <section className="w-[90%] mx-auto my-14">
      {/* Title block */}
      <div className="text-left md:text-center mb-10">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          {isEnglish ? (
            <>
              Rules & <span className="text-[#D35D38]">Regulations</span>
            </>
          ) : (
            <>
              ಕ್ರೀಡಾ <span className="text-[#D35D38]">ನಿಯಮಗಳು</span>
            </>
          )}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A] font-medium">
          {isEnglish
            ? "Official guidelines and regulations for the competitions"
            : "ಸ್ಪರ್ಧೆಗಳಿಗಾಗಿ ಪಾಲಿಸಬೇಕಾದ ಮುಖ್ಯ ನಿಯಮಗಳು ಮತ್ತು ನಿಬಂಧನೆಗಳು"}
        </p>
      </div>

      {/* Rules list container */}
      <div className="bg-white border border-gray-100 rounded-3xl py-2 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_12px_45px_rgba(0,0,0,0.05)] transition-all duration-300 relative overflow-hidden">
        {/* Subtle grid background to match premium theme */}
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

        <div className="relative z-10">
          {visibleRules.map((rule, idx) => {
            // Check if the rule contains table HTML
            if (typeof rule === "string" && rule.includes("<table")) {
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gray-50/50 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#D35D38]/10 text-[#D35D38] flex items-center justify-center font-extrabold text-xs sm:text-sm mt-0.5 sm:mt-1">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base md:text-lg text-slate-700 font-semibold leading-relaxed mb-4 mt-0.5 sm:mt-1">
                      {rule.split("<table")[0].trim()}
                    </p>
                    <div className="overflow-x-auto rounded-2xl border border-slate-100/80 shadow-[0_4px_15px_rgba(0,0,0,0.015)] max-w-full">
                      <table className="w-full border-collapse bg-white">
                        <thead>
                          <tr className="bg-[#D35D38]/8 text-[#D35D38]">
                            <th className="px-5 py-3 text-left font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100/80">
                              {isEnglish ? "Event" : "ಸ್ಪರ್ಧೆ"}
                            </th>
                            <th className="px-5 py-3 text-center font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100/80">
                              {isEnglish ? "1st Place" : "ಪ್ರಥಮ"}
                            </th>
                            <th className="px-5 py-3 text-center font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100/80">
                              {isEnglish ? "2nd Place" : "ದ್ವಿತೀಯ"}
                            </th>
                            <th className="px-5 py-3 text-center font-bold text-xs sm:text-sm uppercase tracking-wider border-b border-slate-100/80">
                              {isEnglish ? "3rd Place" : "ತೃತೀಯ"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/80">
                          {[
                            {
                              name: isEnglish
                                ? "Individual Events"
                                : "ವೈಯಕ್ತಿಕ ಸ್ಪರ್ಧೆಗಳು",
                              p1: "5",
                              p2: "3",
                              p3: "1",
                            },
                            {
                              name: isEnglish ? "Couple Relay" : "ದಂಪತಿ ರಿಲೇ",
                              p1: "5",
                              p2: "3",
                              p3: "1",
                            },
                            {
                              name: isEnglish ? "4x100 Relay" : "4x100 ರಿಲೇ",
                              p1: "10",
                              p2: "6",
                              p3: "3",
                            },
                            {
                              name: isEnglish
                                ? "Volleyball (Men)"
                                : "ವಾಲಿಬಾಲ್ (ಪುರುಷರು)",
                              p1: "10",
                              p2: "5",
                              p3: "–",
                            },
                            {
                              name: isEnglish
                                ? "Throwball (Women)"
                                : "ಥ್ರೋಬಾಲ್ (ಮಹಿಳೆಯರು)",
                              p1: "10",
                              p2: "5",
                              p3: "–",
                            },
                            {
                              name: isEnglish ? "Tug of War" : "ಹಗ್ಗಜಗ್ಗಾಟ",
                              p1: "10",
                              p2: "5",
                              p3: "–",
                            },
                          ].map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              className="hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <td className="px-5 py-3 font-semibold text-slate-800 text-xs sm:text-sm">
                                {row.name}
                              </td>
                              <td className="px-5 py-3 text-center font-extrabold text-emerald-600 text-xs sm:text-sm">
                                {row.p1}
                              </td>
                              <td className="px-5 py-3 text-center font-extrabold text-blue-600 text-xs sm:text-sm">
                                {row.p2}
                              </td>
                              <td className="px-5 py-3 text-center font-extrabold text-[#D35D38] text-xs sm:text-sm">
                                {row.p3}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            }

            // Regular rule display
            return (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 md:px-6  rounded-2xl hover:bg-gray-50/50 transition-colors duration-200"
              >
                <div className="flex-shrink-0 pt-2 text-[#777] font-semibold text-xs sm:text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm sm:text-base md:text-lg text-slate-700 font-semibold leading-relaxed mt-0.5 sm:mt-1">
                    {rule}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Read More / Show Less Button */}
        {rulesToDisplay.length > 5 && (
          <div className="flex justify-center mt-2 pt-4 border-t border-gray-100 relative z-10">
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-slate-700 font-semibold text-sm sm:text-md shadow-sm hover:shadow transition-all duration-300 cursor-pointer"
            >
              <span>
                {isExpanded
                  ? isEnglish
                    ? "Show Less Rules"
                    : "ಕಡಿಮೆ ನಿಯಮಗಳನ್ನು ತೋರಿಸಿ"
                  : isEnglish
                    ? "Read All Rules"
                    : "ಎಲ್ಲಾ ನಿಯಮಗಳನ್ನು ಓದಿ"}
              </span>
              {isExpanded ? (
                <FaChevronUp className="w-3.5 h-3.5 text-[#D35D38]" />
              ) : (
                <FaChevronDown className="w-3.5 h-3.5 text-[#D35D38]" />
              )}
            </button>
          </div>
        )}
      </div>
      <div ref={bottomRef} className="h-1 mt-2" />
    </section>
  );
};

export default Rules;
