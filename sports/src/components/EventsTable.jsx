import React, { useState } from 'react';
import './styles.css'; // Import your CSS file

const EventsList = () => {
  const [showModal, setShowModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventToUnregister, setEventToUnregister] = useState(null);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const events = [
    { name: 'Running - 50 mts', slots: 3, category: '0-5', gender: 'MALE', result: 'N/A' },
    { name: 'Running - 100 mts', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'Running - 200 mts', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'Running - 400 mts', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'Running - 800 mts', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'Long-jump', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'SHOT PUT', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'Running - 25 mts', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'lucky circle', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'ball passing', slots: 3, category: '19-24', gender: 'MALE', result: 'N/A' },
    { name: 'frogjump -25mts', slots: 3, category: '6-10', gender: 'MALE', result: 'N/A' },
    { name: 'frogjump -15mts', slots: 3, category: '0-5', gender: 'MALE', result: 'N/A' },
  ];

  const handleRegisterClick = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (selectedEvent) {
      setRegisteredEvents((prev) => [...prev, selectedEvent.name]);
    }
    setShowModal(false);
    setSelectedEvent(null);
  };

  const handleUnregister = (eventName) => {
    setEventToUnregister(eventName);
    setShowCancelModal(true);
  };

  const handleCancelUnregister = () => {
    setShowCancelModal(false);
    setEventToUnregister(null);
  };

  const handleConfirmUnregister = () => {
    setRegisteredEvents((prev) => prev.filter((name) => name !== eventToUnregister));
    setShowCancelModal(false);
    setEventToUnregister(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedEvent(null);
  };

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

      {events.map((event, index) => (
        <div className="event-card" key={index}>
          <div>{index + 1}</div>
          <div>{event.name}</div>
          <div>{event.slots}</div>
          <div>{event.category}</div>
          <div>{event.gender}</div>
          <div>{event.result}</div>
          <div className=''>
            {registeredEvents.includes(event.name) ? (
              <>
              <div className='flex flex-row gap-2'>
                <button className="bg-green-500 text-white px-4 py-2 rounded cursor-default" disabled>Registered</button>
                <button className="bg-red-500 text-white rounded" onClick={() => handleUnregister(event.name)}>Cancel</button>
              </div>
                
              </>
            ) : (
              <button className="register-btn" onClick={() => handleRegisterClick(event)}>Register</button>
            )}
          </div>
        </div>
      ))}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px]">
            <h2 className="text-lg font-semibold mb-4">Confirm Registration</h2>
            <p>Are you sure you want to register for <span className="font-bold">{selectedEvent?.name}</span>?</p>
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
