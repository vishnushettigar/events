import React from "react";
import {
  eventHighlights,
  eventHighlightsKannada,
} from "../constants/constants";
import { useLanguage } from "../contexts/LanguageContext";

const clickCTA = (text) => {
  console.log(`Clicked: ${text}`);
  // Add event tracking or navigation logic if needed
};

const Counts = () => {
  const { isEnglish } = useLanguage();

  const eventHighlightsToDisplay = isEnglish
    ? eventHighlights
    : eventHighlightsKannada;

  const cardThemes = [
    {
      textClass: "text-[#E05A2B]",
      badgeText: "text-[#E05A2B]",
      gradient: "from-[#FFF7ED] via-[#FFF7ED]/30 to-white",
      border: "border-orange-100/60",
    },
    {
      textClass: "text-[#0A5CDB]",
      badgeText: "text-[#0A5CDB]",
      gradient: "from-[#EFF6FF] via-[#EFF6FF]/30 to-white",
      border: "border-blue-100/60",
    },
    {
      textClass: "text-[#0F8A5F]",
      badgeText: "text-[#0F8A5F]",
      gradient: "from-[#ECFDF5] via-[#ECFDF5]/30 to-white",
      border: "border-emerald-100/60",
    },
    {
      textClass: "text-[#7C3AED]",
      badgeText: "text-[#7C3AED]",
      gradient: "from-[#F5F3FF] via-[#F5F3FF]/30 to-white",
      border: "border-purple-100/60",
    },
  ];

  return (
    <div className="w-[90%] mx-auto mb-8 px-0 md:w-[90%] lg:px-4">
      <div className="text-center mb-6">
        <h1 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2 md:mb-6 ">
          {isEnglish ? (
            <>
              Event <span className="text-[#D35D38]">Highlights</span>
            </>
          ) : (
            <>
              ಕ್ರೀಡಾ <span className="text-[#D35D38]">ಮುಖ್ಯಾಂಶಗಳು</span>
            </>
          )}
        </h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {eventHighlightsToDisplay.map((event, index) => {
          const theme = cardThemes[index % cardThemes.length];
          const Icon = theme.icon;

          return (
            <button
              key={index}
              className={`relative flex flex-col bg-white bg-gradient-to-t ${theme.gradient} border ${theme.border} text-[#2A2A2A] rounded-2xl md:rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.06)] hover:scale-[1.01] transition-all duration-300 overflow-hidden h-[120px] sm:h-44 md:h-52 lg:h-60 w-full cursor-pointer`}
              onClick={() =>
                clickCTA(`${event.count}${event.ifPlus} ${event.title}`)
              }
            >
              {/* Text at top left */}
              <div className="text-left p-3 sm:p-5 md:p-6 z-10 relative flex-1 flex flex-col justify-start">
                <span
                  className={`text-2xl sm:text-4xl md:text-5xl font-extrabold block mb-0.5 sm:mb-1 ${theme.textClass}`}
                >
                  {event.count}
                  <sup className="font-semibold text-lg sm:text-2xl ml-0.5">
                    {event.ifPlus}
                  </sup>
                </span>
                <span className="text-gray-500 font-semibold text-xs sm:text-base md:text-lg tracking-wide leading-tight max-w-[70%] sm:max-w-none">
                  {event.title}
                </span>
              </div>

              {/* Image at bottom right */}
              <img
                src={event.image}
                alt={`${event.count}${event.ifPlus} ${event.title}`}
                className="w-[70px] sm:w-[110px] md:w-[130px] lg:w-[160px] object-contain absolute right-0 bottom-0 z-0 pointer-events-none select-none"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Counts;
