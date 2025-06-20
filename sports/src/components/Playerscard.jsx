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
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
            {/* Header Section */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="text-lg font-semibold text-gray-900">
                            {participant.user?.first_name} {participant.user?.last_name}
                        </div>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            participant.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                            participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                            {participant.status === 'ACCEPTED' ? 'APPROVED' :
                             participant.status === 'DECLINED' ? 'REJECTED' :
                             participant.status}
                        </div>
                </div>
                    <div className="flex flex-wrap gap-2">
                        {participant.status === 'PENDING' && canAcceptMore && (
                            <button
                                onClick={() => handleStatusUpdate('APPROVED')}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                        )}
                        {(participant.status === 'PENDING' || canRejectApproved) && (
                            <button
                                onClick={() => handleStatusUpdate('REJECTED')}
                                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        )}
                        {participant.status === 'PENDING' && !canAcceptMore && (
                            <div className="text-sm text-gray-500 italic">
                                Max participants reached
                </div>
                        )}
                </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Contact Information */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div className="text-sm font-medium">Email</div>
        </div>
                        <div className="text-base text-gray-900 break-words pl-7">
                            {participant.user?.email || 'Not provided'}
                </div>
                </div>

                    {/* Phone Information */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div className="text-sm font-medium">Phone</div>
                </div>
                        <div className="text-base text-gray-900 break-words pl-7">
                            {participant.user?.phone || 'Not provided'}
                </div>
            </div>

                    {/* Result Information */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-gray-500">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <div className="text-sm font-medium">Result</div>
        </div>
                        <div className={`text-lg font-semibold pl-7 ${
                            participant.event_result?.rank === 'FIRST' ? 'text-yellow-500' :
                            participant.event_result?.rank === 'SECOND' ? 'text-gray-400' :
                            participant.event_result?.rank === 'THIRD' ? 'text-amber-600' :
                            'text-gray-900'
                        }`}>
                            {participant.event_result?.rank || 'Not available'}
                </div>
                </div>
                </div>
            </div>
        </div>
    );
};

export default Playerscard;