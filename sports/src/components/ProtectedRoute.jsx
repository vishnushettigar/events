import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAccess = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      try {
        // Decode JWT token to get user info
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        
        if (requiredRole) {
          // Check if user has the required role
          // SUPER_USER = 4, TEMPLE_ADMIN = 2, STAFF = 3, PARTICIPANT = 1
          const roleMap = {
            'SUPER_USER': 4,
            'TEMPLE_ADMIN': 2,
            'STAFF': 3,
            'PARTICIPANT': 1
          };
          
          const requiredRoleId = roleMap[requiredRole];
          setHasAccess(payload.role === requiredRoleId);
        } else {
          // If no specific role required, just check if user is authenticated
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [requiredRole]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38] mx-auto mb-4"></div>
          <p className="text-[#5A5A5A]">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">🚫</span>
          </div>
          <h1 className="text-2xl font-bold text-[#2A2A2A] mb-2">Access Denied</h1>
          <p className="text-[#5A5A5A] mb-4">
            {requiredRole 
              ? `You need ${requiredRole} privileges to access this page.`
              : 'You need to be logged in to access this page.'
            }
          </p>
          <div className="space-y-2">
            <button
              onClick={() => window.history.back()}
              className="w-full px-4 py-2 bg-[#D35D38] text-white rounded-lg hover:bg-[#B84A2E] transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full px-4 py-2 bg-gray-200 text-[#2A2A2A] rounded-lg hover:bg-gray-300 transition-colors"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute; 