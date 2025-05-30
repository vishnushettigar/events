import React, { useState } from 'react';
import Playerscard from './Playerscard';

const CollapsibleList = ({title}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white transition-all duration-300 hover:shadow-md">
      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold focus:outline-none flex justify-between items-center transition-colors duration-200 hover:from-blue-700 hover:to-blue-800"
      >
        <span className="text-lg">{title}</span>
        <span className="transform transition-transform duration-300">
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>

      {/* List items with animation */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <Playerscard />
        </div>
      </div>
    </div>
  );
};

export default CollapsibleList;
