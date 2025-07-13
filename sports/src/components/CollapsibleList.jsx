import React, { useState, useEffect } from 'react';
import Playerscard from './Playerscard';
import { participantAPI } from '../utils/api.js';

const CollapsibleList = ({ title, eventId, participants = [], onParticipantsUpdate, isAdmin = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(participants);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Update local participants when props change
  useEffect(() => {
    setLocalParticipants(participants);
  }, [participants]);

  // Set initial open state based on pending participants
  useEffect(() => {
    const hasPendingParticipants = participants.some(p => p.status === 'PENDING');
    setIsOpen(hasPendingParticipants);
  }, [participants]);

  // Calculate the number of accepted participants for this event
  const acceptedCount = localParticipants.filter(p => p.status === 'ACCEPTED').length;
  const pendingCount = localParticipants.filter(p => p.status === 'PENDING').length;
  const declinedCount = localParticipants.filter(p => p.status === 'DECLINED').length;

  const handleStatusUpdate = async (participantId, newStatus) => {
    try {
      setUpdatingStatus(true);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Starting status update:', { participantId, newStatus, isAdmin });

      let result;
      
      // Use different API endpoints based on whether it's admin or temple admin
      if (isAdmin) {
        console.log('Using admin API endpoint');
        result = await participantAPI.updateParticipantStatus(participantId, newStatus);
      } else {
        console.log('Using temple admin API endpoint');
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
        console.log('Temple admin request body:', requestBody);
        result = await participantAPI.updateRegistrationStatus(requestBody);
      }

      console.log('Status update successful:', result);

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

      // Show success message
      alert(`Status updated successfully to ${newStatus}`);

      // Notify parent component to refresh data
      if (onParticipantsUpdate) {
        onParticipantsUpdate();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(`Failed to update status: ${error.message}`);
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
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
