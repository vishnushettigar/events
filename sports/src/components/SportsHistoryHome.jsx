import React, { useState, useRef, useEffect } from 'react';
import { sportsHistory } from '../constants/constants';
import './styles.css';

const SportsHistoryHome = () => {
  const [selectedYear, setSelectedYear] = useState(2024);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Center the initial selected year when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      centerYearInView(selectedYear);
    }, 100); // Small delay to ensure DOM is ready
    
    return () => clearTimeout(timer);
  }, []);

  // Create infinite scroll data (duplicate the array for seamless scrolling)
  const infiniteData = [...sportsHistory, ...sportsHistory, ...sportsHistory];

  const handleYearClick = (year) => {
    centerYearInView(year, () => {
      setSelectedYear(year);
    });
  };
  
  

  const centerYearInView = (year, callback) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const yearCards = container.querySelectorAll('.year-card');
      const matchingCards = Array.from(yearCards).filter(card => {
        const cardYear = parseInt(card.querySelector('.year-number').textContent);
        return cardYear === year;
      });
  
      if (matchingCards.length > 0) {
        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        const closestCard = matchingCards.reduce((prev, curr) => {
          const prevCenter = prev.offsetLeft + prev.offsetWidth / 2;
          const currCenter = curr.offsetLeft + curr.offsetWidth / 2;
          return Math.abs(currCenter - containerCenter) < Math.abs(prevCenter - containerCenter)
            ? curr
            : prev;
        });
  
        const containerWidth = container.clientWidth;
        const cardLeft = closestCard.offsetLeft;
        const cardWidth = closestCard.offsetWidth;
        const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);
  
        container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  
        // Run callback after scroll animation
        if (callback) {
          setTimeout(callback, 300);
        }
      }
    }
  };
  
  

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      container.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
      
      // After scrolling, find and select the center year
      setTimeout(() => {
        const centerPosition = container.scrollLeft + (container.clientWidth / 2);
        const yearCards = container.querySelectorAll('.year-card');
        let closestCard = null;
        let minDistance = Infinity;
        
        yearCards.forEach(card => {
          const cardLeft = card.offsetLeft;
          const cardCenter = cardLeft + (card.offsetWidth / 2);
          const distance = Math.abs(centerPosition - cardCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestCard = card;
          }
        });
        
        if (closestCard) {
          const year = parseInt(closestCard.querySelector('.year-number').textContent);
          setSelectedYear(year);
        }
      }, 300); // Wait for smooth scroll to complete
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = 200;
      container.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
      
      // After scrolling, find and select the center year
      setTimeout(() => {
        const centerPosition = container.scrollLeft + (container.clientWidth / 2);
        const yearCards = container.querySelectorAll('.year-card');
        let closestCard = null;
        let minDistance = Infinity;
        
        yearCards.forEach(card => {
          const cardLeft = card.offsetLeft;
          const cardCenter = cardLeft + (card.offsetWidth / 2);
          const distance = Math.abs(centerPosition - cardCenter);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestCard = card;
          }
        });
        
        if (closestCard) {
          const year = parseInt(closestCard.querySelector('.year-number').textContent);
          setSelectedYear(year);
        }
      }, 300); // Wait for smooth scroll to complete
    }
  };

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollLeft = container.scrollLeft;
      const scrollWidth = container.scrollWidth;
      const clientWidth = container.clientWidth;
      
      // Reset scroll position for infinite scroll
      if (scrollLeft >= scrollWidth / 3) {
        container.scrollLeft = scrollLeft - (scrollWidth / 3);
      } else if (scrollLeft <= 0) {
        container.scrollLeft = (scrollWidth / 3) + scrollLeft;
      }
      
      setScrollPosition(scrollLeft);
      
      // Find the year card that is closest to the center
      const centerPosition = container.scrollLeft + (container.clientWidth / 2);
      const yearCards = container.querySelectorAll('.year-card');
      let closestCard = null;
      let minDistance = Infinity;
      
      yearCards.forEach(card => {
        const cardLeft = card.offsetLeft;
        const cardCenter = cardLeft + (card.offsetWidth / 2);
        const distance = Math.abs(centerPosition - cardCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCard = card;
        }
      });
      
      if (closestCard) {
        const year = parseInt(closestCard.querySelector('.year-number').textContent);
        if (year !== selectedYear) {
          setSelectedYear(year);
        }
      }
    }
  };

  const selectedEvent = sportsHistory.find(event => event.year === selectedYear);

  return (
    <section className="w-[90%] mx-auto my-10">
      {/* Header outside the main container - similar to Rules component */}
      <div className="text-left md:text-center mb-8">
        <h2 className="text-2xl text-left md:text-center md:text-4xl font-bold text-[#2A2A2A] mb-2">
          Sports History
        </h2>
        <p className="text-base text-left md:text-center md:text-lg text-[#5A5A5A]">
          Explore 32 years of Padmashali Sports Meet
        </p>
      </div>

      {/* Main container with similar styling to Rules component */}
      <div className="bg-[#E0E0E0] rounded-2xl p-4 md:p-8">
        <div className="year-scroll-container">
          {!isMobile && (
            <button 
              className="scroll-arrow scroll-arrow-left"
              onClick={scrollLeft}
              aria-label="Scroll left"
            >
              ‹
            </button>
          )}
          
          <div 
            className="year-scroll-wrapper"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div className="year-scroll-content">
              {infiniteData.map((event, index) => (
                <div
                  key={`${event.year}-${index}`}
                  className={`year-card ${selectedYear === event.year ? 'selected' : ''}`}
                  onClick={() => handleYearClick(event.year)}
                >
                  <div className="year-number">{event.year}</div>
                </div>
              ))}
            </div>
          </div>

          {!isMobile && (
            <button 
              className="scroll-arrow scroll-arrow-right"
              onClick={scrollRight}
              aria-label="Scroll right"
            >
              ›
            </button>
          )}
        </div>

        {selectedEvent && (
          <div className="selected-event-card mt-6">
            <div className="event-card-header">
              <h3 className="text-xl font-semibold text-[#2A2A2A] mb-2">{selectedEvent.year}</h3>
              <div className="event-card-place text-lg font-medium text-[#D35D38] mb-4">{selectedEvent.place}</div>
            </div>
            <div className="event-card-content">
              <p className="text-base text-[#5A5A5A] leading-relaxed">
                Padmashali Sports Meet was held in <strong className="text-[#2A2A2A]">{selectedEvent.place}</strong> in the year <strong className="text-[#2A2A2A]">{selectedEvent.year}</strong>.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SportsHistoryHome;
