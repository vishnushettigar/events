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
    const registeredCount = events.filter(e => e.is_registered).length;
    if (registeredCount >= 3) {
      alert('You can only register for a maximum of 3 events. Please cancel one of your existing registrations to register for a new event.');
      return;
    }
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

        // Update the event's registration status
        setEvents(prevEvents => 
          prevEvents.map(event => 
            event.id === selectedEvent.id 
              ? { ...event, is_registered: true, registration_status: 'PENDING' }
              : event
          )
        );

        setShowModal(false);
        setSelectedEvent(null);
      } catch (error) {
        console.error('Registration error details:', {
          error: error.message,
          userInfo: userInfo,
          selectedEvent: selectedEvent,
          userTempleId: userInfo.temple_id,
          eventTempleId: selectedEvent.temple_id,
          requestBody: {
            user_id: parseInt(userInfo.id),
            event_id: parseInt(selectedEvent.id)
          }
        });
        alert(error.message);
      }
    }
  };

  const handleUnregister = (event) => {
    setEventToUnregister(event);
    setShowCancelModal(true);
  };

  const handleConfirmUnregister = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/events/update-registration-status', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          registration_id: eventToUnregister.registration_id,
          status: 'REJECTED'
        })
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel registration');
      }

      // Update the event's registration status
      setEvents(prevEvents => 
        prevEvents.map(event => 
          event.id === eventToUnregister.id 
            ? { ...event, is_registered: false, registration_status: null }
            : event
        )
      );

      setShowCancelModal(false);
      setEventToUnregister(null);
    } catch (error) {
      alert(error.message || 'Failed to cancel registration');
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleCancelUnregister = () => {
    setShowCancelModal(false);
    setEventToUnregister(null);
  };

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
    <div className="container mx-auto px-4 py-8">
      {userInfo && (
        <div className="mb-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Your Profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-gray-600">Age</p>
              <p className="font-semibold">{userInfo.age} years</p>
            </div>
            <div>
              <p className="text-gray-600">Gender</p>
              <p className="font-semibold">{userInfo.gender}</p>
            </div>
            <div>
              <p className="text-gray-600">Temple</p>
              <p className="font-semibold">{userInfo.temple}</p>
            </div>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-6">Available Events</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
            <div className="space-y-2 mb-4">
              <p className="text-gray-600">
                <span className="font-medium">Type:</span> {event.type}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Age Category:</span> {event.age_category.name}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Gender:</span> {event.gender}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Participants:</span> {event.participant_count}
              </p>
            </div>
            {event.is_registered ? (
              <div className="flex flex-col gap-2">
                <div className="bg-green-100 text-green-700 px-4 py-2 rounded">
                  Registered ({event.registration_status})
                </div>
                <button
                  onClick={() => handleUnregister(event)}
                  className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
                >
                  Cancel Registration
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleRegisterClick(event)}
                className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Register
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Registration Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Registration</h2>
            <p>Are you sure you want to register for <span className="font-bold">{selectedEvent?.name}</span>?</p>
            <p className="text-sm text-gray-600 mt-2">
              You have registered for {events.filter(e => e.is_registered).length} out of 3 allowed events.
            </p>
            <div className="flex justify-end gap-4 mt-6">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleCancel}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Registration Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Cancel Registration</h2>
            <p>Are you sure you want to cancel your registration for <span className="font-bold">{eventToUnregister?.name}</span>?</p>
            <div className="flex justify-end gap-4 mt-6">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleCancelUnregister}>No</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleConfirmUnregister}>Yes, Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableEvents; 