import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AvailableEvents = () => {
  const [events, setEvents] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventToUnregister, setEventToUnregister] = useState(null);
  const navigate = useNavigate();

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found in localStorage');
      navigate('/login');
      return {};
    }
    console.log('Using token:', token);
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'
    };
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // First fetch user profile
        const profileResponse = await fetch('http://localhost:4000/api/users/profile', {
          headers: getAuthHeaders()
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const profileData = await profileResponse.json();
        console.log('User profile loaded:', profileData);
        
        if (!profileData.temple_id) {
          throw new Error('User temple information not found. Please contact support.');
        }
        
        setUserInfo(profileData);

        // Then fetch available events
        const eventsResponse = await fetch('http://localhost:4000/api/users/available-events', {
          headers: getAuthHeaders()
        });

        if (!eventsResponse.ok) {
          if (eventsResponse.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          throw new Error('Failed to fetch events');
        }

        const eventsData = await eventsResponse.json();
        console.log('Events loaded:', eventsData);
        setEvents(eventsData.events);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
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
        console.log('Sending registration request with:', requestBody);

        const response = await fetch('http://localhost:4000/api/events/register-participant', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        console.log('Server response:', responseData);

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem('token');
            navigate('/login');
            return;
          }
          
          // Handle specific error cases
          if (response.status === 403) {
            throw new Error('You can only register for events from your own temple');
          }
          
          if (response.status === 404) {
            throw new Error('Event or user not found. Please try refreshing the page.');
          }
          
          if (responseData.error) {
            throw new Error(responseData.error);
          }
          
          if (responseData.errors && responseData.errors.length > 0) {
            throw new Error(responseData.errors[0].msg);
          }
          
          throw new Error('Failed to register for event. Please try again.');
        }

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
        console.error('Registration error details:', {
          error: error.message,
          userInfo: userInfo,
          selectedEvent: selectedEvent
        });
        alert(error.message);
      }
    }
  };

  const handleUnregister = (event) => {
    alert('Only temple administrators can cancel registrations. Please contact your temple admin if you need to cancel your registration.');
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          text: 'Approved',
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
              <div className='flex flex-row gap-4 pt-6'>
                <h2>Point of contact for {userInfo.temple}:</h2>
                <h2>{userInfo.temple_admin_name || 'Not available'}</h2>
                <h2>{userInfo.temple_admin_phone || 'Not available'}</h2>
              </div>
            )}
          </div>
        </div>
      </div>
    
    <div className="container mx-auto px-4 py-8 bg-[#F0F0F0] min-h-screen">
      {userInfo && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4 text-[#2A2A2A]">{userInfo.first_name} {userInfo.last_name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-[#5A5A5A]">Age</p>
              <p className="font-semibold text-[#2A2A2A]">{userInfo.age} years</p>
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
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6 text-[#2A2A2A]">Available Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          // Count only ACCEPTED and PENDING registrations toward the limit
          // DECLINED (rejected) registrations should not count toward the limit
          const activeRegistrations = events.filter(e => 
            e.is_registered && 
            (e.registration_status === 'ACCEPTED' || e.registration_status === 'PENDING')
          ).length;
          const isMaxRegistrationsReached = activeRegistrations >= 3;
          const isDisabled = isMaxRegistrationsReached && !event.is_registered;
          const statusDisplay = getStatusDisplay(event.registration_status);

          return (
            <div key={event.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-semibold mb-2 text-[#2A2A2A]">{event.name}</h3>
              <div className="space-y-2 mb-4">
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
              </div>
              {event.is_registered ? (
                <div className="flex flex-col gap-2">
                  <div className={`px-4 py-2 rounded ${statusDisplay.className}`}>
                    {statusDisplay.text}
                  </div>
                  {event.registration_status !== 'DECLINED' && (
                    <div className="text-sm text-[#5A5A5A] italic">
                      {/* Contact temple admin to cancel registration */}
                    </div>
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

    </div>
    </>
  );
};

export default AvailableEvents; 