import React, { useState, useEffect } from 'react';
import Playerscard from './Playerscard';
import MobileParticipantCard from './MobileParticipantCard';
import AdminHeatViewer from './AdminHeatViewer';
import { participantAPI, eventAPI, systemAPI } from '../utils/api.js';

const CollapsibleList = ({ title, eventId, participants = [], onParticipantsUpdate, isAdmin = false, isViewer = false, ageCategory = "Admin View", gender = "All" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(participants);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showHeatGeneration, setShowHeatGeneration] = useState(false);
  const [laneCount, setLaneCount] = useState(8);
  const [generatingHeats, setGeneratingHeats] = useState(false);
  const [regeneratingHeats, setRegeneratingHeats] = useState(false);
  const [heatsGenerated, setHeatsGenerated] = useState(false);
  const [heatError, setHeatError] = useState(null);
  const [loadingLaneCount, setLoadingLaneCount] = useState(false);
  const [initializingTrials, setInitializingTrials] = useState(false);
  const [trialInitError, setTrialInitError] = useState(null);

  // Update local participants when props change
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Set initial open state based on pending participants (only on first load)
  useEffect(() => {
    const hasPendingParticipants = participants.some(p => p.status === 'PENDING');
    // Only auto-open if there are pending participants and the list is not already open
    if (hasPendingParticipants && !isOpen) {
      setIsOpen(true);
    }
  }, [participants]);

  // Calculate the number of accepted participants for this event
  const acceptedCount = localParticipants.filter(p => p.status === 'ACCEPTED').length;
  const pendingCount = localParticipants.filter(p => p.status === 'PENDING').length;
  const declinedCount = localParticipants.filter(p => p.status === 'DECLINED').length;

  // Check if this is a running event that supports heat generation
  const isRunningEvent = () => {
    const eventName = title.toLowerCase();
    return eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
  };

  // Check if this event is a field/trial event (e.g., long jump, shot put)
  const isTrialEvent = () => {
    const eventName = title.toLowerCase();
    return eventName.includes('long-jump') || eventName.includes('long jump') || eventName.includes('shot put');
  };

  // Fetch lane count from settings
  useEffect(() => {
    const fetchLaneCount = async () => {
      if (isRunningEvent() && isAdmin) {
        try {
          setLoadingLaneCount(true);
          const setting = await systemAPI.getSetting('lane_count');
          if (setting && setting.value) {
            setLaneCount(setting.value);
          }
        } catch (error) {
          console.error('Error fetching lane count setting:', error);
          // Keep default value of 8 if fetch fails
        } finally {
          setLoadingLaneCount(false);
        }
      }
    };
    fetchLaneCount();
  }, [isAdmin, title]);

  // Check if heats are already generated
  useEffect(() => {
    const checkHeatsGenerated = async () => {
      if (isRunningEvent() && isAdmin) {
        try {
          const heats = await eventAPI.getHeats(eventId);
          setHeatsGenerated(Object.keys(heats).length > 0);
        } catch (error) {
          console.error('Error checking heats:', error);
        }
      }
    };
    checkHeatsGenerated();
  }, [eventId, isAdmin, title]);

  // Handle heat generation
  const handleGenerateHeats = async () => {
    try {
      setGeneratingHeats(true);
      setHeatError(null);
      
      const result = await eventAPI.generateHeats(eventId);
      
      setHeatsGenerated(true);
      setShowHeatGeneration(false);
      
      // Notify parent component to refresh data
      if (onParticipantsUpdate) {
        onParticipantsUpdate();
      }
    } catch (error) {
      console.error('Error generating heats:', error);
      setHeatError(error.message || 'Failed to generate heats');
    } finally {
      setGeneratingHeats(false);
    }
  };

  // Handle heat regeneration
  const handleRegenerateHeats = async () => {
    try {
      setRegeneratingHeats(true);
      setHeatError(null);
      
      await eventAPI.regenerateHeats(eventId);
      
      setHeatsGenerated(false);
      setShowHeatGeneration(true);
      
      // Notify parent component to refresh data
      if (onParticipantsUpdate) {
        onParticipantsUpdate();
      }
    } catch (error) {
      console.error('Error regenerating heats:', error);
      setHeatError(error.message || 'Failed to regenerate heats');
    } finally {
      setRegeneratingHeats(false);
    }
  };

  // Initialize trial performances for trial events (ADMIN only)
  const handleInitTrials = async () => {
    try {
      setInitializingTrials(true);
      setTrialInitError(null);
      await eventAPI.initTrials(eventId);
      if (onParticipantsUpdate) {
        onParticipantsUpdate();
      }
    } catch (error) {
      console.error('Error initializing trials:', error);
      setTrialInitError(error.message || 'Failed to initialize trial performances');
    } finally {
      setInitializingTrials(false);
    }
  };

  const handleStatusUpdate = async (participantId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      let result;
      
      // Use different API endpoints based on whether it's admin or temple admin
      if (isAdmin) {
        result = await participantAPI.updateParticipantStatus(participantId, newStatus);
      } else {
        // Map status for temple admin API
        let mappedStatus;
        switch (newStatus) {
          case 'ACCEPTED':
            mappedStatus = 'APPROVED';
            break;
          case 'DECLINED':
            mappedStatus = 'REJECTED';
            break;
          case 'PENDING':
            mappedStatus = 'PENDING';
            break;
          default:
            mappedStatus = newStatus;
        }
        const requestBody = { registration_id: participantId, status: mappedStatus };
        result = await participantAPI.updateRegistrationStatus(requestBody);
      }

      // For temple admin, we need to map the response status back to our internal format
      let finalStatus = newStatus;
      if (!isAdmin && result.registration && result.registration.status) {
        // Map the response status back to our internal format
        switch (result.registration.status) {
          case 'APPROVED':
            finalStatus = 'ACCEPTED';
            break;
          case 'REJECTED':
            finalStatus = 'DECLINED';
            break;
          case 'PENDING':
            finalStatus = 'PENDING';
            break;
          default:
            finalStatus = result.registration.status;
        }
      }

    // Update the local state immediately
    setLocalParticipants(prevParticipants =>
      prevParticipants.map(p =>
          p.id === participantId ? { ...p, status: finalStatus } : p
      )
    );

      // Notify parent component to refresh data
      if (onParticipantsUpdate) {
        onParticipantsUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Sort participants by status
  const sortedParticipants = [...localParticipants].sort((a, b) => {
    const statusOrder = {
      'ACCEPTED': 0,  // First
      'PENDING': 1,   // Second
      'DECLINED': 2   // Last
    };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex flex-col">
          <span className="text-lg font-semibold text-[#2A2A2A]">{title}</span>
          {pendingCount > 0 && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mt-1 w-fit">
                {pendingCount} Pending
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-[#5A5A5A] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
      </button>

      {isOpen && (
        <div className="border-t border-gray-200">
          {/* Heat Generation Section for Running Events (Admin Only) */}
          {isRunningEvent() && isAdmin && (
            <div className="bg-blue-50 border-b border-blue-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-blue-800">🏃‍♂️ Heat Management</h4>
                <div className="flex items-center gap-2">
                  {/* generating heat and regenrating heat if the heat is already generated */}
                  {!heatsGenerated && (
                    <button
                      onClick={() => setShowHeatGeneration(!showHeatGeneration)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {showHeatGeneration ? 'Cancel' : 'Generate Heats'}
                    </button>
                  )}
                  {heatsGenerated && (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        ✅ Heats Generated
                      </span>
                      <button
                        onClick={handleRegenerateHeats}
                        disabled={regeneratingHeats}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {regeneratingHeats ? 'Regenerating...' : 'Regenerate Heats'}
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {showHeatGeneration && !heatsGenerated && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Lane Count:</label>
                      {loadingLaneCount ? (
                        <span className="text-sm text-gray-500">Loading...</span>
                      ) : (
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                          {laneCount} Lanes
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleGenerateHeats}
                      disabled={generatingHeats || acceptedCount === 0 || loadingLaneCount}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {generatingHeats ? 'Generating...' : 'Generate Heats'}
                    </button>
                  </div>
                  
                  {acceptedCount === 0 && (
                    <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ No accepted participants found. Please approve participants first.
                    </p>
                  )}
                  
                  {acceptedCount > 0 && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>📊 {acceptedCount} accepted participants will be distributed as follows (max 8 per heat):</p>
                      {acceptedCount <= 8 ? (
                        <p>• 1 heat with {acceptedCount} participants</p>
                      ) : (
                        (() => {
                          const fullHeats = Math.floor(acceptedCount / 8);
                          const remainder = acceptedCount % 8;
                          const adjustedFullHeats = remainder <= 4 && remainder > 0 ? Math.max(0, fullHeats - 1) : fullHeats;
                          const remainingParticipants = acceptedCount - (adjustedFullHeats * 8);
                          const totalHeats = adjustedFullHeats + (remainingParticipants > 0 ? (remainingParticipants <= 8 ? 1 : 2) : 0);
                          
                          return (
                            <>
                              {adjustedFullHeats > 0 && <p>• {adjustedFullHeats} heat(s) with 8 participants each</p>}
                              {remainingParticipants > 0 && remainingParticipants <= 8 && (
                                <p>• 1 heat with {remainingParticipants} participants</p>
                              )}
                              {remainingParticipants > 8 && (
                                <>
                                  <p>• 1 heat with {Math.ceil(remainingParticipants / 2)} participants</p>
                                  <p>• 1 heat with {Math.floor(remainingParticipants / 2)} participants</p>
                                </>
                              )}
                              {totalHeats >= 2 && (
                                <p className="text-blue-600 font-medium">🏛️ Temple separation will be applied for fair distribution</p>
                              )}
                              {totalHeats === 1 && (
                                <p className="text-amber-600 font-medium">🏛️ Single heat - temple grouping will be maintained</p>
                              )}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                  
                  {heatError && (
                    <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                      ❌ {heatError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Trial Performance Initialization (Admin Only) */}
          {isTrialEvent() && isAdmin && (
            <div className="bg-purple-50 border-b border-purple-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold text-purple-800">🏅 Trial Management</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleInitTrials}
                    disabled={initializingTrials || acceptedCount === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {initializingTrials ? 'Initializing...' : 'Init Trials'}
                  </button>
                </div>
              </div>
              {acceptedCount === 0 && (
                <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                  ⚠️ No accepted participants found. Please approve participants first.
                </p>
              )}
              {trialInitError && (
                <p className="text-sm text-red-700 bg-red-100 p-2 rounded">
                  {trialInitError}
                </p>
              )}
            </div>
          )}

          {/* Heat Viewer for Admin - Show after heats are generated */}
          {isRunningEvent() && isAdmin && heatsGenerated && (
            <AdminHeatViewer 
              eventId={eventId}
              eventName={title}
              ageCategory={ageCategory}
              gender={gender}
            />
          )}
          
          {sortedParticipants.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name & Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Result
                      </th>
                      {!isAdmin && !isViewer && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                {sortedParticipants.map((participant) => (
                  <Playerscard
                    key={participant.id}
                    participant={participant}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(participant.id, newStatus)}
                    acceptedCount={acceptedCount}
                    pendingCount={pendingCount}
                    isAdmin={isAdmin}
                    isViewer={isViewer}
                    updatingStatus={updatingStatus}
                  />
                ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4 space-y-3">
                {sortedParticipants.map((participant) => (
                  <MobileParticipantCard
                    key={participant.id}
                    participant={participant}
                    onStatusUpdate={(newStatus) => handleStatusUpdate(participant.id, newStatus)}
                    acceptedCount={acceptedCount}
                    pendingCount={pendingCount}
                    isAdmin={isAdmin}
                    isViewer={isViewer}
                    updatingStatus={updatingStatus}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="p-4 text-center text-[#5A5A5A]">
              No participants registered for this event
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollapsibleList;
