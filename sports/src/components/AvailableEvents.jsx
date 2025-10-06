import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, eventAPI } from '../utils/api.js';
import PointsTable from './PointsTable';

const AvailableEvents = () => {
  const [events, setEvents] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState(null);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [showPointsTable, setShowPointsTable] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // First fetch user profile
        const profileData = await userAPI.getProfile();
        
        if (!profileData.temple_id) {
          throw new Error('User temple information not found. Please contact support.');
        }
        
        setUserInfo(profileData);

        // Then fetch available events
        const eventsData = await eventAPI.getAvailableEvents();
        setEvents(eventsData.events);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        setError(err.message || 'Failed to fetch data');
        setLoading(false);
      }
    };

    fetchEvents();
  }, [navigate]);

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (selectedEvent) {
      if (!userInfo || !userInfo.id) {
        alert('User information not available. Please try refreshing the page.');
        return;
      }

      try {
        const requestBody = {
          user_id: parseInt(userInfo.id),
          event_id: parseInt(selectedEvent.id)
        };

        const responseData = await eventAPI.registerParticipant(requestBody);

        // Update the event's registration status with the status from the backend
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === selectedEvent.id 
              ? { ...event, is_registered: true, registration_status: responseData.status }
              : event
          )
        );

        setShowModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Registration error:', error.message);
        
        // Handle specific error cases
        if (error.message.includes('403')) {
          alert('You can only register for events from your own temple');
        } else if (error.message.includes('404')) {
          alert('Event or user not found. Please try refreshing the page.');
        } else {
          alert(error.message || 'Failed to register for event. Please try again.');
        }
      }
    }
  };

  const handleUnregister = (event) => {
    setEventToUnregister(event);
    setShowCancelModal(true);
    setCancelSuccess(false);
  };

  const handleConfirmCancel = async () => {
    if (eventToUnregister) {
      try {
        const response = await eventAPI.unregisterParticipant(eventToUnregister.id);
        
        if (response.success) {
          // Update the events state to remove the registration
          setEvents(prevEvents =>
            prevEvents.map(event =>
              event.id === eventToUnregister.id
                ? { ...event, is_registered: false, registration_status: null }
                : event
            )
          );

          setCancelSuccess(true);
          
          // Close modal after showing success message
          setTimeout(() => {
            setShowCancelModal(false);
            setEventToUnregister(null);
            setCancelSuccess(false);
          }, 2000);
        } else {
          throw new Error(response.message || 'Failed to cancel registration');
        }
        
      } catch (error) {
        console.error('Cancellation error:', error);
        alert('Failed to cancel registration. Please try again.');
      }
    }
  };

  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setEventToUnregister(null);
    setCancelSuccess(false);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          text: 'REGISTERED',
          className: 'bg-green-100 text-green-700'
        };
      case 'PENDING':
        return {
          text: 'Pending',
          className: 'bg-yellow-100 text-yellow-700'
        };
      case 'DECLINED':
        return {
          text: 'Rejected',
          className: 'bg-red-100 text-red-700'
        };
      default:
        return {
          text: status || 'Not Registered',
          className: 'bg-gray-100 text-gray-700'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D35D38]"></div>
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
    <>
      <div className='flex-1'>
      <div className='bg-[#D35D38] rounded-br-md rounded-bl-md'>
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
              <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 pt-6'>
                <div className='flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center'>
                  <h2 className='text-sm sm:text-base font-semibold'>Point of contact for {userInfo.temple}:</h2>
                  <div className='flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm sm:text-base'>
                    <span className='font-medium'>{userInfo.temple_admin_name || 'Not available'}</span>
                    <span className='font-medium'>{userInfo.temple_admin_phone || 'Not available'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    
    <div className="container mx-auto px-4 py-8 bg-[#F0F0F0] min-h-screen">
      {userInfo && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#2A2A2A]">{userInfo.first_name} {userInfo.last_name}</h2>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-[#5A5A5A]">Age</p>
              <p className="font-semibold text-[#2A2A2A]">{userInfo.age} years</p>
            </div>
            <div>
              <p className="text-[#5A5A5A]">Age Category</p>
              <p className="font-semibold text-[#2A2A2A]">{userInfo.age_category || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-[#5A5A5A]">Gender</p>
              <p className="font-semibold text-[#2A2A2A]">{userInfo.gender === 'M' ? 'Male' : userInfo.gender === 'F' ? 'Female' : userInfo.gender}</p>
            </div>
            <div>
              <p className="text-[#5A5A5A]">Temple</p>
              <p className="font-semibold text-[#2A2A2A]">{userInfo.temple || 'Not specified'}</p>
            </div>
          </div>
          <div className='mt-4'>
            <h4 className='text-[#D35D38] font-semibold bg-yellow-200 px-4 py-2 rounded-lg border-l-4 border-[#D35D38] shadow-md animate-pulse'>Last date for registration: 18-12-2025</h4> 
          </div>
          
          {/* Points Table Button */}
          <div className='mt-4 flex justify-center'>
            <button
              onClick={() => setShowPointsTable(!showPointsTable)}
              className='bg-[#D35D38] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#B84A2A] transition-colors shadow-md flex items-center gap-2'
            >
              <span>🏛️</span>
              {showPointsTable ? 'Hide Points Table' : 'View Points Table'}
            </button>
          </div>
        </div>
      )}

      {/* Points Table Section */}
      {showPointsTable && (
        <div className="mb-8">
          <PointsTable />
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-[#2A2A2A]">Available Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          // Exclude age categories 0-5, 6-10, 61-90 from registration limit
          const excludedAgeCategories = ['0-5', '6-10', '61-90'];
          const eventAgeCategory = event.age_category?.name || '';
          const isExcluded = excludedAgeCategories.includes(eventAgeCategory);

          // Count only ACCEPTED and PENDING registrations toward the limit, excluding the above age categories
          const activeRegistrations = events.filter(e => 
            !excludedAgeCategories.includes(e.age_category?.name || '') &&
            e.is_registered && 
            (e.registration_status === 'ACCEPTED' || e.registration_status === 'PENDING')
          ).length;
          const isMaxRegistrationsReached = activeRegistrations >= 3 && !isExcluded;
          const isDisabled = isMaxRegistrationsReached && !event.is_registered;
          const statusDisplay = getStatusDisplay(event.registration_status);

          return (
            <div key={event.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">{event.name}</h3>
              {/* <div className="space-y-2 mb-4">
                <p className="text-[#5A5A5A]">
                  <span className="font-medium">Type:</span> {event.type}
                </p>
                <p className="text-[#5A5A5A]">
                  <span className="font-medium">Age Category:</span> {event.age_category.name}
                </p>
                <p className="text-[#5A5A5A]">
                  <span className="font-medium">Gender:</span> {event.gender}
                </p>
                <p className="text-[#5A5A5A]">
                  <span className="font-medium">Participants:</span> {event.participant_count}
                </p>
              </div> */}
              {event.is_registered ? (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-2 rounded text-sm flex-1 text-center ${statusDisplay.className}`}>
                    {statusDisplay.text}
                  </div>
                  {event.registration_status !== 'DECLINED' && (
                    <button
                      onClick={() => handleUnregister(event)}
                      className="px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm whitespace-nowrap"
                    >
                      Cancel 
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => handleRegisterClick(event)}
                  disabled={isDisabled}
                  className={`w-full px-4 py-2 rounded transition-colors ${
                    isDisabled
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-[#D35D38] text-white hover:bg-[#B84A2E]'
                  }`}
                  title={isDisabled ? 'Maximum registration limit reached (3 events)' : 'Register'}
                >
                  {isDisabled ? 'Registration Limit Reached' : 'Register'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Registration Confirmation Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-md">
            <h2 className="text-lg font-semibold mb-4">Confirm Registration</h2>
            <p>
              Are you sure you want to register for{" "}
              <span className="font-bold">{selectedEvent.name}</span>?
            </p>
            <div className="mt-6 flex justify-end gap-4">
              <button
                onClick={handleCancel}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="bg-[#D35D38] text-white px-4 py-2 rounded hover:bg-[#B84A2E] transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && eventToUnregister && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-md">
            {!cancelSuccess ? (
              <>
                <h2 className="text-lg font-semibold mb-4 text-red-600">Cancel Registration</h2>
                <p>
                  Are you sure you want to cancel your registration for{" "}
                  <span className="font-bold">{eventToUnregister.name}</span>?
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  This action cannot be undone. You will need to register again if you change your mind.
                </p>
                <div className="mt-6 flex justify-end gap-4">
                  <button
                    onClick={handleCancelModalClose}
                    className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                  >
                    Keep Registration
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  >
                    Cancel Registration
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="text-green-500 text-4xl mb-4">✓</div>
                  <h2 className="text-lg font-semibold mb-4 text-green-600">Registration Cancelled Successfully</h2>
                  <p className="text-gray-600">
                    Your registration for <span className="font-bold">{eventToUnregister.name}</span> has been cancelled.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

    </div>
    </>
  );
};

export default AvailableEvents; 