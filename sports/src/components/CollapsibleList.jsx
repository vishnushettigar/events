import React, { useState, useEffect } from 'react';
import Playerscard from './Playerscard';
import { participantAPI, eventAPI } from '../utils/api.js';

const CollapsibleList = ({ title, eventId, participants = [], onParticipantsUpdate, isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(participants);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showHeatGeneration, setShowHeatGeneration] = useState(false);
  const [laneCount, setLaneCount] = useState(8);
  const [generatingHeats, setGeneratingHeats] = useState(false);
  const [heatsGenerated, setHeatsGenerated] = useState(false);
  const [heatError, setHeatError] = useState(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Update local participants when props change
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Set initial open state based on pending participants only once
  useEffect(() => {
    if (!hasInitialized) {
      const hasPendingParticipants = participants.some(p => p.status === 'PENDING');
      setIsOpen(hasPendingParticipants);
      setHasInitialized(true);
    }
  }, [participants, hasInitialized]);

  // Calculate the number of accepted participants for this event
  const acceptedCount = localParticipants.filter(p => p.status === 'ACCEPTED').length;
  const pendingCount = localParticipants.filter(p => p.status === 'PENDING').length;
  const declinedCount = localParticipants.filter(p => p.status === 'DECLINED').length;

  // Check if this is a running event that supports heat generation
  const isRunningEvent = () => {
    const eventName = title.toLowerCase();
    return eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
  };

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
      
      const result = await eventAPI.generateHeats(eventId, laneCount);
      
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
                {!heatsGenerated && (
                  <button
                    onClick={() => setShowHeatGeneration(!showHeatGeneration)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    {showHeatGeneration ? 'Cancel' : 'Generate Heats'}
                  </button>
                )}
                {heatsGenerated && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    ✅ Heats Generated
                  </span>
                )}
              </div>
              
              {showHeatGeneration && !heatsGenerated && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Lane Count:</label>
                    <select
                      value={laneCount}
                      onChange={(e) => setLaneCount(parseInt(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={6}>6 Lanes</option>
                      <option value={7}>7 Lanes</option>
                      <option value={8}>8 Lanes</option>
                    </select>
                    <button
                      onClick={handleGenerateHeats}
                      disabled={generatingHeats || acceptedCount === 0}
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
                    <p className="text-sm text-gray-600">
                      📊 {acceptedCount} accepted participants will be distributed across heats with temple separation logic.
                    </p>
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
          
          {sortedParticipants.length > 0 ? (
            <div className="overflow-x-auto">
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
                    {!isAdmin && (
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
                  updatingStatus={updatingStatus}
                />
              ))}
                </tbody>
              </table>
            </div>
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
