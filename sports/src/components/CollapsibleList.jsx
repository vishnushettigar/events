import React, { useState, useEffect } from 'react';
import Playerscard from './Playerscard';

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

      // Use different API endpoints based on whether it's admin or temple admin
      const endpoint = isAdmin 
        ? `http://localhost:4000/api/admin/participants/${participantId}/update-status`
        : 'http://localhost:4000/api/events/update-registration-status';

      const requestBody = isAdmin 
        ? { status: newStatus }
        : { registration_id: participantId, status: newStatus };

      const response = await fetch(endpoint, {
        method: isAdmin ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update status');
      }

      const result = await response.json();
      console.log('Status update successful:', result);

    // Update the local state immediately
    setLocalParticipants(prevParticipants =>
      prevParticipants.map(p =>
          p.id === participantId ? { ...p, status: newStatus } : p
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
        <div className="flex items-center space-x-3">
          <span className="text-lg font-semibold text-[#2A2A2A]">{title}</span>
          <div className="flex space-x-2">
            {acceptedCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                {acceptedCount} Accepted
              </span>
            )}
          {pendingCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                {pendingCount} Pending
              </span>
            )}
            {declinedCount > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                {declinedCount} Declined
            </span>
          )}
          </div>
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
            <div className="p-4 space-y-3">
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
