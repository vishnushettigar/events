import React, { useState } from 'react';
import Playerscard from './Playerscard';

const CollapsibleList = ({title}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-md shadow-md mb-4 bg-white">
      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full  text-left px-4 py-3 bg-blue-600 text-white font-semibold rounded-t-md focus:outline-none"
      >
        {title} {isOpen ? '▲' : '▼'}
      </button>

      {/* List items */}
      {isOpen && (
        <Playerscard/>
      )}
    </div>
  );
};

export default CollapsibleList;
