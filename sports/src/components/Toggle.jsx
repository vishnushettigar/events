import React from 'react';
import '../index.css';
import './styles.css';
import { useLanguage } from '../contexts/LanguageContext';

const Toggle = () => {
  const { isEnglish, toggleLanguage } = useLanguage();

  const handleToggle = () => {
    toggleLanguage();
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