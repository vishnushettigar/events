import React from 'react';
import { Link } from 'react-router-dom';

const Error = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-md w-full mx-auto text-center">
        {/* Error Icon */}
        <div className="mb-6 sm:mb-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
            Oops! Something went wrong
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
            We couldn't find the page you were looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
        </div>

        {/* Error Code (Optional) */}
        <div className="mb-6 sm:mb-8">
          <div className="inline-block bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs sm:text-sm font-mono">
            404 - Page Not Found
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 sm:space-y-4">
          <Link 
            to="/" 
            className="block w-full sm:w-auto sm:inline-block px-6 py-3 sm:py-4 bg-[#D35D38] text-white font-semibold rounded-lg hover:bg-[#B84A2E] transition-colors duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Go Back to Home
          </Link>
          
          <button 
            onClick={() => window.history.back()} 
            className="block w-full sm:w-auto sm:inline-block px-6 py-3 sm:py-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200 ml-0 sm:ml-3 mt-3 sm:mt-0"
          >
            Go Back
          </button>
        </div>

        {/* Additional Help */}
        <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200">
          <p className="text-xs sm:text-sm text-gray-500 mb-3">
            Need help? Try these options:
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
            <Link to="/login" className="text-[#D35D38] hover:text-[#B84A2E] transition-colors">
              Login
            </Link>
            <Link to="/register" className="text-[#D35D38] hover:text-[#B84A2E] transition-colors">
              Register
            </Link>
            <Link to="/myevents" className="text-[#D35D38] hover:text-[#B84A2E] transition-colors">
              My Events
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Error; 