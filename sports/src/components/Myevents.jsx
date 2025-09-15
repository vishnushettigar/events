import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';

const Myevents = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      navigate('/login');
      return {};
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*'
    };
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/users/profile', {
          headers: getAuthHeaders()
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setUserInfo(data);
        setUserRole(data.role_id);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <section className="flex h-screen overflow-hidden">
      {userRole === 2 && (
      <Sidebar />
      )}
      <div className="flex-1 overflow-auto">
        {/* <div className='bg-blue-600 rounded-br-md rounded-bl-md'>
          <div className='flex flex-col  w-[80%] mx-auto text-white items-start  p-6'>
            <div className='flex flex-row'>
              <ul className="text-white space-y-4 list-disc pl-6">
                <li className="text-base">
                    ಒಂದು ದೇವಸ್ಥಾನದಿಂದ ವೈಯಕ್ತಿಕ
                    ವಿಭಾಗದಲ್ಲಿ ಪ್ರತಿ ಸ್ಪರ್ಧೆಗೆ ಗರಿಷ್ಠ 3 ಸ್ಪರ್ಧಿ ಮತ್ತು ಒಬ್ಬ ಸ್ಪರ್ಧಿ ಯಾವುದಾದರೂ ಗರಿಷ್ಠ 3 ಸ್ಪರ್ಧೆಗಳಲ್ಲಿ
                    ಭಾಗವಹಿಸಬಹುದು. (ಈ ನಿಯಮ 10 ವರ್ಷ ಒಳಗಿನವರಿಗೆ ಮತ್ತು 60 ವರ್ಷ ಮೇಲ್ಪಟ್ಟವರಿಗೆ
                    ಅನ್ವಯಿಸುವುದಿಲ್ಲ) ಒಂದು ಸ್ಪರ್ಧೆಯಲ್ಲಿ ಕನಿಷ್ಠ 5 ಸ್ಪರ್ಧಿಗಳಿಲ್ಲದಿದ್ದರೆ ಸ್ಪರ್ಧೆಯನ್ನು ಕೈಬಿಡಲಾಗುವುದು.
                </li>
                <li className="text-base">
                    ಕ್ರೀಡಾಳುಗಳು ತಮ್ಮ ವೈಯಕ್ತಿಕ ಸ್ಪರ್ಧಾ ವಿಭಾಗಗಳಲ್ಲಿ ಸೇರಲು/ಬದಲಾವಣೆ ಬಯಸಿದಲ್ಲಿ ದೇವಸ್ಥಾನದ ಅಧಿಕೃತ ವ್ಯಕ್ತಿಗಳಿಂದ ಒಪ್ಪಿಗೆ ಪಡೆದು ದೃಢೀಕರಿಸಬೇಕು. (ಒಂದು ವೇಳೆ ಆ ವಿಭಾಗದಲ್ಲಿ ನೋಂದಣಿ ಪೂರ್ತಿ ಗೊಂಡಿದ್ದಲ್ಲಿ ಮಾತ್ರ)
                </li>
                </ul>
            </div>
            {userInfo && (
            <div className='flex flex-row gap-4 pt-6'>
                <h2>Point of contact for {userInfo.temple}:</h2>
                <h2>{userInfo.temple_admin_name || 'Not available'}</h2>
                <h2>{userInfo.temple_admin_phone || 'Not available'}</h2>
            </div>
            )}
          </div>
        </div> */}
        <Outlet />
      </div>
    </section>
  );
};

export default Myevents;