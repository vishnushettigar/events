import React from "react";
import "./styles.css"; // we'll keep styles separate for clarity
import { events } from '../constants/constants';

const SportsHistoryMarquee = () => {
  return (
    <div className="marquee-container">
      <div className="marquee">
        {events.map((event, index) => (
          <span key={index}>{event.year} - {event.place} | </span>
        ))}
      </div>
    </div>
  );
};

export default SportsHistoryMarquee;
