import React from 'react';

const Playerscard = ({ participant, onStatusUpdate, acceptedCount, pendingCount }) => {
    if (!participant) return null;

    const handleStatusUpdate = async (newStatus) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch('http://localhost:4000/api/events/update-registration-status', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    registration_id: participant.id,
                    status: newStatus
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update status');
            }

            // Call the parent component's callback with the new status
            if (onStatusUpdate) {
                onStatusUpdate(newStatus);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            alert(error.message);
        }
    };

    const canAcceptMore = acceptedCount < 3;
    const canRejectApproved = participant.status === 'ACCEPTED' && pendingCount > 0;

    return (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="grid grid-cols-12 gap-4 items-center">
                {/* Name - 2 columns */}
                <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-500">Name</div>
                    <div className="text-base text-gray-900">
                        {participant.user?.first_name} {participant.user?.last_name}
                    </div>
                </div>

                {/* Email - 4 columns */}
                <div className="col-span-4">
                    <div className="text-sm font-medium text-gray-500">Email</div>
                    <div className="text-base text-gray-900">
                        {participant.user?.email || 'Not provided'}
                    </div>
                </div>

                {/* Phone - 2 columns */}
                <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-500">Phone</div>
                    <div className="text-base text-gray-900">
                        {participant.user?.phone || 'Not provided'}
                    </div>
                </div>

                {/* Result - 2 columns */}
                <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-500">Result</div>
                    <div className={`text-lg font-semibold ${
                        participant.event_result?.rank === 'FIRST' ? 'text-yellow-500' :
                        participant.event_result?.rank === 'SECOND' ? 'text-gray-400' :
                        participant.event_result?.rank === 'THIRD' ? 'text-amber-600' :
                        'text-gray-900'
                    }`}>
                        {participant.event_result?.rank || 'Not available'}
                    </div>
                </div>

                {/* Status and Actions - 2 columns */}
                <div className="col-span-2">
                    <div className="text-sm font-medium text-gray-500">Status</div>
                    <div className="flex flex-col gap-2">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            participant.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {participant.status === 'ACCEPTED' ? 'APPROVED' :
                             participant.status === 'DECLINED' ? 'REJECTED' :
                             participant.status}
                        </div>
                        
                        {participant.status === 'PENDING' && canAcceptMore && (
                            <button
                                onClick={() => handleStatusUpdate('APPROVED')}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                        )}
                        {(participant.status === 'PENDING' || canRejectApproved) && (
                            <button
                                onClick={() => handleStatusUpdate('REJECTED')}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        )}
                        {participant.status === 'PENDING' && !canAcceptMore && (
                            <div className="text-xs text-gray-500 italic">
                                Max participants reached
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Playerscard;