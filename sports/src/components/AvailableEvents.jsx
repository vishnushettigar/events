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
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingEvent, setPendingEvent] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipEventId, setTooltipEventId] = useState(null);
  const [teamRegistrations, setTeamRegistrations] = useState([]);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeamRegistration, setSelectedTeamRegistration] = useState(null);
  const [teamParticipants, setTeamParticipants] = useState([]);
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

        // Fetch user's team registrations
        try {
          const teamData = await userAPI.getTeamRegistrations();
          setTeamRegistrations(teamData.registrations);
        } catch (teamError) {
          console.error('Error fetching team registrations:', teamError);
          // Don't fail the entire component if team registrations fail
          setTeamRegistrations([]);
        }

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

        // Show pending modal if status is PENDING
        if (responseData.status === 'PENDING') {
          setPendingEvent(selectedEvent);
          setShowPendingModal(true);
        }
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

  const handlePendingModalClose = () => {
    setShowPendingModal(false);
    setPendingEvent(null);
  };

  const handleTooltipShow = (eventId) => {
    setTooltipEventId(eventId);
    setShowTooltip(true);
  };

  const handleTooltipHide = () => {
    setShowTooltip(false);
    setTooltipEventId(null);
  };

  const handleViewTeam = async (teamRegistration) => {
    setSelectedTeamRegistration(teamRegistration);
    setShowTeamModal(true);
    
    try {
      const participants = await eventAPI.getTeamParticipants(teamRegistration.id);
      setTeamParticipants(participants);
    } catch (error) {
      console.error('Error fetching team participants:', error);
      setTeamParticipants([]);
    }
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTeamRegistration(null);
    setTeamParticipants([]);
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
            
            
            {userInfo && (
              <div className='flex flex-col gap-2 sm:gap-4 pt-6'>
                <h2 className='text-sm sm:text-base font-semibold'>Point of contact for {userInfo.temple}:</h2>
                {userInfo.temple_admins && userInfo.temple_admins.length > 0 ? (
                  <div className='flex flex-col gap-2'>
                    {userInfo.temple_admins.map((admin, index) => (
                      <div key={index} className='flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm sm:text-base'>
                        <span className='font-medium'>{admin.name || 'Not available'}</span>
                        <span className='font-medium'>{admin.phone || 'Not available'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm sm:text-base'>
                    <span className='font-medium'>Not available</span>
                    <span className='font-medium'>Not available</span>
                  </div>
                )}
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

          // Count ALL registrations (ACCEPTED, PENDING, DECLINED) toward the limit, excluding the above age categories
          const activeRegistrations = events.filter(e => 
            !excludedAgeCategories.includes(e.age_category?.name || '') &&
            e.is_registered
          ).length;
          const isMaxRegistrationsReached = activeRegistrations >= 3 && !isExcluded;
          const isDisabled = isMaxRegistrationsReached && !event.is_registered;
          const statusDisplay = getStatusDisplay(event.registration_status);

          return (
            <div key={event.id} className="bg-white rounded-lg shadow p-6 relative">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-semibold text-[#2A2A2A]">{event.name}</h3>
                {(event.registration_status === 'PENDING' || event.registration_status === 'DECLINED') && (
                  <div className="relative">
                    <button
                      onMouseEnter={() => handleTooltipShow(event.id)}
                      onMouseLeave={handleTooltipHide}
                      onClick={() => {
                        if (showTooltip && tooltipEventId === event.id) {
                          handleTooltipHide();
                        } else {
                          handleTooltipShow(event.id);
                        }
                      }}
                      className="w-6 h-6 rounded-full bg-[#F8DFBE] text-brown text-sm font-bold flex items-center justify-center hover:bg-[#D35D38] transition-colors"
                    >
                      i
                    </button>
                    {showTooltip && tooltipEventId === event.id && (
                      <div className="absolute right-0 top-8 w-64 bg-gray-800 text-white text-sm rounded-lg p-3 shadow-lg z-10">
                        <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                        {event.registration_status === 'PENDING' 
                          ? "Three participants already registered for this event. You can wait or contact temple admin for confirming registration."
                          : "Registration Rejected. Please choose another event or contact temple admin."
                        }
                      </div>
                    )}
                  </div>
                )}
              </div>
              {event.is_registered ? (
                <div className="flex items-center gap-2">
                  <div className={`px-3 py-2 rounded text-sm flex-1 text-center ${statusDisplay.className}`}>
                    {statusDisplay.text}
                  </div>
                  <button
                    onClick={() => handleUnregister(event)}
                    className="px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600 transition-colors text-sm whitespace-nowrap"
                  >
                    Cancel 
                  </button>
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

      {/* Team Events Section */}
      {teamRegistrations && teamRegistrations.length > 0 && (
        <div className="mb-8 mt-12">
          <h2 className="text-2xl font-bold mb-6 text-[#2A2A2A]">My Team Events</h2>
          <div className="space-y-4">
            {teamRegistrations.map((registration) => {
              const statusDisplay = getStatusDisplay(registration.status);
              return (
                <div key={registration.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
                  {/* Mobile Layout */}
                  <div className="block sm:hidden">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-[#2A2A2A]">{registration.event.name}</h3>
                      <div className={`px-2 py-1 rounded text-xs ${statusDisplay.className}`}>
                        {statusDisplay.text}
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A5A5A]">Gender:</span>
                        <span className="font-medium">
                          {registration.event.gender === 'M' ? 'Male' : 
                           registration.event.gender === 'F' ? 'Female' : 
                           registration.event.gender}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-[#5A5A5A]">Team Size:</span>
                        <span className="font-medium">{registration.member_count} members</span>
                      </div>
                      {registration.result && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[#5A5A5A]">Result:</span>
                          <span className="font-medium">
                            Rank: {registration.result.rank} 
                            {registration.result.points && ` (${registration.result.points} pts)`}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <button
                      onClick={() => handleViewTeam(registration)}
                      className="w-full px-4 py-2 bg-[#D35D38] text-white rounded hover:bg-[#B84A2E] transition-colors text-sm"
                    >
                      View Team Members
                    </button>
                  </div>

                  {/* Desktop Layout */}
                  <div className="hidden sm:block">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-[#2A2A2A] mb-2">{registration.event.name}</h3>
                        <div className="flex flex-wrap gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-[#5A5A5A]">Gender:</span>
                            <span className="font-medium">
                              {registration.event.gender === 'M' ? 'Male' : 
                               registration.event.gender === 'F' ? 'Female' : 
                               registration.event.gender}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[#5A5A5A]">Team Size:</span>
                            <span className="font-medium">{registration.member_count} members</span>
                          </div>
                          {registration.result && (
                            <div className="flex items-center gap-2">
                              <span className="text-[#5A5A5A]">Result:</span>
                              <span className="font-medium">
                                Rank: {registration.result.rank} 
                                {registration.result.points && ` (${registration.result.points} pts)`}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded text-sm ${statusDisplay.className}`}>
                          {statusDisplay.text}
                        </div>
                        <button
                          onClick={() => handleViewTeam(registration)}
                          className="px-6 py-2 bg-[#D35D38] text-white rounded hover:bg-[#B84A2E] transition-colors whitespace-nowrap"
                        >
                          View Team Members
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Pending Registration Modal */}
      {showPendingModal && pendingEvent && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-md">
            <div className="text-center">
              <div className="text-yellow-500 text-4xl mb-4">⏳</div>
              <h2 className="text-lg font-semibold mb-4 text-yellow-600">Registration Pending</h2>
              <p className="text-gray-700 mb-4">
                Three participants are already registered for <span className="font-bold">{pendingEvent.name}</span>.
              </p>
              <p className="text-sm text-gray-600 mb-6">
                You can wait for temple admin approval or contact your temple admin to confirm your registration.
              </p>
              {userInfo && userInfo.temple_admins && userInfo.temple_admins.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">Contact Temple Admin{userInfo.temple_admins.length > 1 ? 's' : ''}:</h3>
                  {userInfo.temple_admins.map((admin, index) => (
                    <div key={index} className="mb-2 last:mb-0">
                      <p className="text-blue-700">
                        <span className="font-medium">{admin.name}</span>
                      </p>
                      <p className="text-blue-700">
                        <span className="font-medium">Phone:</span> {admin.phone || 'Not available'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handlePendingModalClose}
                className="bg-[#D35D38] text-white px-6 py-2 rounded hover:bg-[#B84A2E] transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamModal && selectedTeamRegistration && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[400px] max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#2A2A2A]">
                Team Members - {selectedTeamRegistration.event.name}
              </h2>
              <button
                onClick={handleCloseTeamModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[#5A5A5A]">Age Category:</span>
                  <span className="ml-2">{selectedTeamRegistration.event.age_category.name}</span>
                </div>
                <div>
                  <span className="font-medium text-[#5A5A5A]">Gender:</span>
                  <span className="ml-2">
                    {selectedTeamRegistration.event.gender === 'M' ? 'Male' : 
                     selectedTeamRegistration.event.gender === 'F' ? 'Female' : 
                     selectedTeamRegistration.event.gender}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#5A5A5A]">Status:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusDisplay(selectedTeamRegistration.status).className}`}>
                    {getStatusDisplay(selectedTeamRegistration.status).text}
                  </span>
                </div>
                {selectedTeamRegistration.result && (
                  <div>
                    <span className="font-medium text-[#5A5A5A]">Result:</span>
                    <span className="ml-2">
                      Rank: {selectedTeamRegistration.result.rank}
                      {selectedTeamRegistration.result.points && ` (${selectedTeamRegistration.result.points} pts)`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-[#2A2A2A] mb-3">Team Members ({teamParticipants.length})</h3>
              {teamParticipants.length > 0 ? (
                <div className="space-y-3">
                  {teamParticipants.map((participant, index) => (
                    <div key={participant.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#D35D38] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#2A2A2A]">
                            {participant.first_name} {participant.last_name}
                          </p>
                          <p className="text-sm text-[#5A5A5A]">
                            {participant.phone && `Phone: ${participant.phone}`}
                            {participant.email && ` • Email: ${participant.email}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-[#5A5A5A]">
                        {participant.gender === 'M' ? 'Male' : 
                         participant.gender === 'F' ? 'Female' : 
                         participant.gender}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#5A5A5A]">
                  <p>No team members found.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCloseTeamModal}
                className="bg-[#D35D38] text-white px-6 py-2 rounded hover:bg-[#B84A2E] transition"
              >
                Close
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