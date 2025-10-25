import React, { useState, useEffect } from 'react';
import { sportsHistory } from '../constants/constants';
import { sportsHistoryKannada } from '../constants/constants';
import { useLanguage } from '../contexts/LanguageContext';
import './styles.css';

const SportsHistoryMarquee = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [isMobile, setIsMobile] = useState(false);
  const [displayStartIndex, setDisplayStartIndex] = useState(0); // Track the start index of displayed years
  const { isEnglish } = useLanguage();
  const sportsHistoryToDisplay = isEnglish ? sportsHistory : sportsHistoryKannada;

  // Show all years for navigation
  const allYears = sportsHistoryToDisplay;

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize display start index to show last 5 years
  useEffect(() => {
    setDisplayStartIndex(Math.max(0, allYears.length - 5));
  }, [allYears.length]);
  
  // Get 5 years for display based on current display window
  const getYearsToDisplay = () => {
    const endIndex = Math.min(allYears.length, displayStartIndex + 5);
    return allYears.slice(displayStartIndex, endIndex);
  };
  
  const yearsToDisplay = getYearsToDisplay();

  const handleYearClick = (year) => {
    setSelectedYear(year);
  };

  const goToPreviousYear = () => {
    const currentIndex = allYears.findIndex(event => event.year === selectedYear);
    if (currentIndex > 0) {
      const newYear = allYears[currentIndex - 1].year;
      setSelectedYear(newYear);
      
      // Check if we need to shift the display window
      const newYearIndex = allYears.findIndex(event => event.year === newYear);
      if (newYearIndex < displayStartIndex) {
        // Move display window left
        setDisplayStartIndex(Math.max(0, newYearIndex));
      }
    }
  };

  const goToNextYear = () => {
    const currentIndex = allYears.findIndex(event => event.year === selectedYear);
    if (currentIndex < allYears.length - 1) {
      const newYear = allYears[currentIndex + 1].year;
      setSelectedYear(newYear);
      
      // Check if we need to shift the display window
      const newYearIndex = allYears.findIndex(event => event.year === newYear);
      if (newYearIndex >= displayStartIndex + 5) {
        // Move display window right
        setDisplayStartIndex(Math.min(allYears.length - 5, newYearIndex - 4));
      }
    }
  };

  // Check if we can go to previous/next year
  const canGoPrevious = () => {
    const currentIndex = allYears.findIndex(event => event.year === selectedYear);
    return currentIndex > 0;
  };

  const canGoNext = () => {
    const currentIndex = allYears.findIndex(event => event.year === selectedYear);
    return currentIndex < allYears.length - 1;
  };


  const selectedEvent = sportsHistoryToDisplay.find(event => event.year === selectedYear);

  return (
    <section className="w-[90%] mx-auto my-10">
      {/* Header outside the main container - similar to Rules component */}
      <div className="text-left md:text-center mb-8">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          {isEnglish ? "Sports History" : "ಕ್ರೀಡಾ ಇತಿಹಾಸ"}
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          {isEnglish ? "Explore 32 years of Padmashali Sports Meet" : "ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವದ 32 ವರ್ಷದ ಇತಿಹಾಸ"}
        </p>
      </div>

      {/* Main container with similar styling to Rules component */}
      <div className="bg-[#E0E0E0] rounded-2xl p-4 md:p-8">
        {/* Year Selection with Arrows */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6 transition-all duration-300 ease-in-out">
          {/* Left Arrow */}
          <button
            onClick={goToPreviousYear}
            disabled={!canGoPrevious()}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 shadow-md ${
              canGoPrevious()
                ? 'bg-[#D35D38] text-white hover:bg-[#B84A2A] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Previous year"
          >
            ‹
          </button>

          {/* Years */}
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 transition-all duration-300 ease-in-out">
            {yearsToDisplay.map((event, index) => {
              const isSelected = selectedYear === event.year;
              
              return (
                <div
                  key={event.year}
                  className={`${
                    isMobile 
                      ? `text-lg font-medium cursor-pointer px-3 py-2 rounded-lg transition-all duration-300 ease-in-out transform ${
                          isSelected 
                            ? 'text-[#D35D38] font-bold scale-110' 
                            : 'text-[#5A5A5A] hover:text-[#D35D38] hover:scale-105'
                        }`
                      : `px-4 py-2 rounded-lg font-medium cursor-pointer transition-all duration-300 ease-in-out transform ${
                          isSelected
                            ? 'bg-[#D35D38] text-white shadow-lg scale-110 ring-2 ring-[#D35D38] ring-opacity-50'
                            : 'bg-white text-[#5A5A5A] hover:bg-[#D35D38] hover:text-white hover:shadow-md hover:scale-105'
                        }`
                  }`}
                  onClick={() => handleYearClick(event.year)}
                >
                  {event.year}
                </div>
              );
            })}
          </div>

          {/* Right Arrow */}
          <button
            onClick={goToNextYear}
            disabled={!canGoNext()}
            className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors duration-200 shadow-md ${
              canGoNext()
                ? 'bg-[#D35D38] text-white hover:bg-[#B84A2A] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            aria-label="Next year"
          >
            ›
          </button>
        </div>

        {selectedEvent && (
          <div className="selected-event-card mt-6 transition-all duration-300 ease-in-out">
            <div className="event-card-header">
              <h3 className="text-xl font-semibold text-[#2A2A2A] mb-2">{selectedEvent.year}</h3>
              <div className="event-card-place text-lg font-medium text-[#D35D38] mb-4">{selectedEvent.place}</div>
            </div>
            <div className="event-card-content">
              <p className="text-base text-[#5A5A5A] leading-relaxed">
                {isEnglish 
                  ? `Padmashali Sports Meet was held in ${selectedEvent.place} in the year ${selectedEvent.year}.`
                  : `ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವವು ${selectedEvent.year}ನೇ ವರ್ಷದಲ್ಲಿ ${selectedEvent.place}ದಲ್ಲಿ ನಡೆಸಲಾಯಿತು.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SportsHistoryMarquee;
