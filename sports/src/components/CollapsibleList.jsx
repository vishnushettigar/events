import React, { useState, useEffect } from 'react';
import Playerscard from './Playerscard';

const CollapsibleList = ({ title, eventId, participants = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localParticipants, setLocalParticipants] = useState(participants);

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

  const handleStatusUpdate = async (participantId, newStatus) => {
    // Map the status to match the backend enum values
    const mappedStatus = newStatus === 'APPROVED' ? 'ACCEPTED' : 
                        newStatus === 'REJECTED' ? 'DECLINED' : 
                        newStatus;

    // Update the local state immediately
    setLocalParticipants(prevParticipants =>
      prevParticipants.map(p =>
        p.id === participantId ? { ...p, status: mappedStatus } : p
      )
    );
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
    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden bg-white transition-all duration-300 hover:shadow-md">
      {/* Header button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left px-6 py-4 bg-gradient-to-r from-[#D35D38] to-[#B84A2E] text-white font-semibold focus:outline-none flex justify-between items-center transition-colors duration-200 hover:from-[#B84A2E] hover:to-[#A03D25]"
      >
        <div className="flex flex-col">
          <span className="text-lg">{title}</span>
          {pendingCount > 0 && (
            <span className="text-sm text-[#F0F0F0] mt-1">
              {pendingCount} pending participant{pendingCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="transform transition-transform duration-300">
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </span>
      </button>

      {/* List items with animation */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4">
          {sortedParticipants.length > 0 ? (
            <div className="space-y-4">
              {sortedParticipants.map((participant) => (
                <Playerscard
                  key={participant.id}
                  participant={participant}
                  acceptedCount={acceptedCount}
                  pendingCount={pendingCount}
                  onStatusUpdate={(newStatus) => handleStatusUpdate(participant.id, newStatus)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white shadow-sm p-4 border border-gray-200 text-center">
              <p className="text-[#D35D38]">No participants registered for this event.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollapsibleList;
