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
    setSelectedYear(year);
    // Center the selected year in the scroll view
    centerYearInView(year);
  };

  const centerYearInView = (year) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const yearCards = container.querySelectorAll('.year-card');
      const selectedCard = Array.from(yearCards).find(card => 
        parseInt(card.querySelector('.year-number').textContent) === year
      );
      
      if (selectedCard) {
        const containerWidth = container.clientWidth;
        const cardLeft = selectedCard.offsetLeft;
        const cardWidth = selectedCard.offsetWidth;
        const scrollLeft = cardLeft - (containerWidth / 2) + (cardWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
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
          const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
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
          const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
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
      const centerPosition = scrollLeft + (clientWidth / 2);
      const yearCards = container.querySelectorAll('.year-card');
      let closestCard = null;
      let minDistance = Infinity;
      
      yearCards.forEach(card => {
        const cardLeft = card.offsetLeft;
        const cardRight = cardLeft + card.offsetWidth;
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
    <div className="sports-history-container">
      <div className="sports-history-header">
        <h2>Sports History</h2>
        <p>Explore 32 years of Padmashali Sports Meet</p>
      </div>

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
                {/* <div className="year-place">{event.place}</div> */}
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
        <div className="selected-event-card">
          <div className="event-card-header">
            <h3>{selectedEvent.year}</h3>
            <div className="event-card-place">{selectedEvent.place}</div>
          </div>
          <div className="event-card-content">
            <p>Padmashali Sports Meet was held in <strong>{selectedEvent.place}</strong> in the year <strong>{selectedEvent.year}</strong>.</p>
            {/* <div className="event-card-details">
              <div className="detail-item">
                <span className="detail-label">Venue:</span>
                <span className="detail-value">{selectedEvent.place}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Year:</span>
                <span className="detail-value">{selectedEvent.year}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Status:</span>
                <span className="detail-value">Completed</span>
              </div>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
};

export default SportsHistoryHome;
