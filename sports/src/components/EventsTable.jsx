import React, { useState, useEffect } from 'react';
import './styles.css'; // Import your CSS file

const EventsList = () => {
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToUnregister, setEventToUnregister] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:4000/api/users/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setUserProfile(data);

        // Fetch user's registered events
        const registrationsResponse = await fetch('http://localhost:4000/api/events/registrations', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!registrationsResponse.ok) {
          throw new Error('Failed to fetch registrations');
        }

        const registrationsData = await registrationsResponse.json();
        setRegisteredEvents(registrationsData.map(reg => reg.event.name));
        
        // Update filtered events with registration IDs
        const updatedFilteredEvents = filteredEvents.map(event => {
          const registration = registrationsData.find(reg => reg.event.id === event.id);
          return {
            ...event,
            registration_id: registration?.id
          };
        });
        setFilteredEvents(updatedFilteredEvents);

        filterEventsByAge(data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const filterEventsByAge = (profile) => {
    const dob = new Date(profile.dob);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    const allEvents = [
      { name: 'Running - 25 mts', slots: 3, category: '0-5', gender: 'ALL', result: 'N/A' },
      { name: 'frogjump -15mts', slots: 3, category: '0-5', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 50 mts', slots: 3, category: '6-10', gender: 'ALL', result: 'N/A' },
      { name: 'frogjump -25mts', slots: 3, category: '6-10', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 50 mts', slots: 3, category: '11-14', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '11-14', gender: 'ALL', result: 'N/A' },
      { name: 'Long-jump', slots: 3, category: '11-14', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '11-14', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 200 mts', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 400 mts', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 800 mts', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'Long-jump', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '15-18', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 200 mts', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 400 mts', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 800 mts', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'Long-jump', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '19-24', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '25-35', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 200 mts', slots: 3, category: '25-35', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 400 mts', slots: 3, category: '25-35', gender: 'ALL', result: 'N/A' },
      { name: 'Long-jump', slots: 3, category: '25-35', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '25-35', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '36-48', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 200 mts', slots: 3, category: '36-48', gender: 'ALL', result: 'N/A' },
      { name: 'Long-jump', slots: 3, category: '36-48', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '36-48', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 50 mts', slots: 3, category: '49-60', gender: 'ALL', result: 'N/A' },
      { name: 'Running - 100 mts', slots: 3, category: '49-60', gender: 'ALL', result: 'N/A' },
      { name: 'SHOT PUT', slots: 3, category: '49-60', gender: 'ALL', result: 'N/A' },
      { name: 'lucky circle', slots: 3, category: '61-90', gender: 'ALL', result: 'N/A' },
      { name: 'ball passing', slots: 3, category: '61-90', gender: 'ALL', result: 'N/A' },
    ];

    const filtered = allEvents.filter(event => {
      // Check if event matches user's gender or is for all genders
      const genderMatch = event.gender === 'ALL' || event.gender === profile.gender;

      // Get the age category for the user
      let userAgeCategory;
      if (age >= 0 && age <= 5) userAgeCategory = '0-5';
      else if (age >= 6 && age <= 10) userAgeCategory = '6-10';
      else if (age >= 11 && age <= 14) userAgeCategory = '11-14';
      else if (age >= 15 && age <= 18) userAgeCategory = '15-18';
      else if (age >= 19 && age <= 24) userAgeCategory = '19-24';
      else if (age >= 25 && age <= 35) userAgeCategory = '25-35';
      else if (age >= 36 && age <= 48) userAgeCategory = '36-48';
      else if (age >= 49 && age <= 60) userAgeCategory = '49-60';
      else if (age >= 61 && age <= 90) userAgeCategory = '61-90';

      // Check if the event's category matches the user's age category
      const ageMatch = event.category === userAgeCategory;

      return ageMatch && genderMatch;
    });

    setFilteredEvents(filtered);
  };

  const handleRegisterClick = (event) => {
    if (registeredEvents.length >= 3) {
      alert('You can only register for a maximum of 3 events. Please cancel one of your existing registrations to register for a new event.');
      return;
    }
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (selectedEvent) {
      if (registeredEvents.length >= 3) {
        alert('You can only register for a maximum of 3 events. Please cancel one of your existing registrations to register for a new event.');
        setShowModal(false);
        setSelectedEvent(null);
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/events/register-participant', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            user_id: userProfile.id,
            event_id: selectedEvent.id
          })
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to register for event');
        }

      setRegisteredEvents((prev) => [...prev, selectedEvent.name]);
    setShowModal(false);
    setSelectedEvent(null);
      } catch (error) {
        alert(error.message || 'Failed to register for event');
      }
    }
  };

  const handleUnregister = (eventName) => {
    setEventToUnregister(eventName);
    setShowCancelModal(true);
  };

  const handleCancelUnregister = () => {
    setShowCancelModal(false);
    setEventToUnregister(null);
  };

  const handleConfirmUnregister = async () => {
    try {
      const token = localStorage.getItem('token');
      const event = filteredEvents.find(e => e.name === eventToUnregister);
      
      if (!event) {
        throw new Error('Event not found');
      }

      const response = await fetch('http://localhost:4000/api/events/update-registration-status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          registration_id: event.registration_id,
          status: 'REJECTED'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel registration');
      }

    setRegisteredEvents((prev) => prev.filter((name) => name !== eventToUnregister));
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="event-list-container w-[90%] mx-auto">
      <div className="event-list-header">
        <div>SL.NO</div>
        <div>Event Name</div>
        <div>Slots</div>
        <div>Category</div>
        <div>Gender</div>
        <div>Result</div>
        <div className='pl-[1rem]'>Action</div>
      </div>

      {filteredEvents.map((event, index) => (
        <div className="event-card" key={index}>
          <div>{index + 1}</div>
          <div>{event.name}</div>
          <div>{event.slots}</div>
          <div>{event.category}</div>
          <div>{userProfile?.gender || 'ALL'}</div>
          <div>{event.result}</div>
          <div className=''>
            {registeredEvents.includes(event.name) ? (
              <div className='flex flex-row gap-2'>
                <button className="bg-green-500 text-white px-4 py-2 rounded cursor-default" disabled>Registered</button>
                <button className="bg-red-500 text-white rounded" onClick={() => handleUnregister(event.name)}>Cancel</button>
              </div>
            ) : (
              <button 
                className={`register-btn ${registeredEvents.length >= 3 ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => handleRegisterClick(event)}
                disabled={registeredEvents.length >= 3}
              >
                Register
              </button>
            )}
          </div>
        </div>
      ))}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Registration</h2>
            <p>Are you sure you want to register for <span className="font-bold">{selectedEvent?.name}</span>?</p>
            <p className="text-sm text-gray-600 mt-2">You have registered for {registeredEvents.length} out of 3 allowed events.</p>
            <div className="flex justify-end gap-4 mt-6">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={handleCancel}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Cancel Registration</h2>
            <p>Are you sure you want to cancel your registration for <span className="font-bold">{eventToUnregister}</span>?</p>
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

export default EventsList;
