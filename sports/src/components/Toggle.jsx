import React, { useState } from 'react';
import '../index.css';
import './styles.css';

const Toggle = () => {
  const [isEnglish, setIsEnglish] = useState(true);

  const handleToggle = () => {
    setIsEnglish(!isEnglish);
  };

  return (
    <div className="language-toggle-container">
      <button 
        className={`language-toggle ${isEnglish ? 'english' : 'kannada'}`}
        onClick={handleToggle}
        aria-label={`Switch to ${isEnglish ? 'Kannada' : 'English'}`}
      >
        <div className="toggle-slider">
          <span className="toggle-text english-text">En</span>
          <span className="toggle-text kannada-text">ಕ</span>
        </div>
      </button>
    </div>
  );
};

export default Toggle;