import React from 'react';

const MobileParticipantCard = ({ participant, onStatusUpdate, acceptedCount, pendingCount, isAdmin = false, isViewer = false, updatingStatus = false }) => {
    if (!participant) return null;

    // Check if this participant's age category should be excluded from action buttons
    const excludedAgeCategories = ['0-5', '6-10', '61-90'];
    const participantAgeCategory = participant.event?.age_category?.name || '';
    const isExcludedAgeCategory = excludedAgeCategories.includes(participantAgeCategory);

    const handleStatusUpdate = (newStatus) => {
        if (onStatusUpdate) {
            onStatusUpdate(newStatus);
        }
    };

    const canAcceptMore = acceptedCount < 3;
    const canRejectApproved = participant.status === 'ACCEPTED' && pendingCount > 0;

    // For admin, show all status options regardless of temple limits
    const showAdminButtons = isAdmin && !updatingStatus;
    const showTempleAdminButtons = !isAdmin && !updatingStatus;

    const getStatusBadge = () => (
        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            participant.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
            participant.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
        }`}>
            {participant.status === 'ACCEPTED' ? 'APPROVED' :
             participant.status === 'DECLINED' ? 'REJECTED' :
             participant.status}
        </div>
    );

    const getActionButtons = () => {
        // Don't show action buttons in viewer mode
        if (isViewer) {
            return null;
        }

        // Don't show action buttons for excluded age categories
        if (isExcludedAgeCategory) {
            return null;
        }

        if (updatingStatus) {
            return <div className="text-sm text-gray-500 italic">Updating...</div>;
        }

        // Admin buttons - show all options
        if (showAdminButtons) {
            return (
                <div className="flex flex-wrap gap-2 mt-3">
                    {participant.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('ACCEPTED')}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors flex-1 min-w-0"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('DECLINED')}
                                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors flex-1 min-w-0"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {participant.status === 'ACCEPTED' && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors w-full"
                        >
                            Reject
                        </button>
                    )}
                    {participant.status === 'DECLINED' && (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('ACCEPTED')}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors flex-1 min-w-0"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('PENDING')}
                                className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors flex-1 min-w-0"
                            >
                                Set Pending
                            </button>
                        </>
                    )}
                </div>
            );
        }

        // Temple admin buttons - with temple-specific logic
        if (showTempleAdminButtons) {
            return (
                <div className="flex flex-wrap gap-2 mt-3">
                    {/* Accept button for PENDING participants - only if less than 3 accepted */}
                    {participant.status === 'PENDING' && canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('ACCEPTED')}
                            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors flex-1 min-w-0"
                        >
                            Accept
                        </button>
                    )}
                    {/* Accept button for REJECTED participants - only if less than 3 accepted */}
                    {participant.status === 'DECLINED' && canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('ACCEPTED')}
                            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors flex-1 min-w-0"
                        >
                            Accept
                        </button>
                    )}
                    {/* Reject button for PENDING participants */}
                    {participant.status === 'PENDING' && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors flex-1 min-w-0"
                        >
                            Reject
                        </button>
                    )}
                    {/* Reject button for ACCEPTED participants - show when there are 3 accepted (to make room) */}
                    {participant.status === 'ACCEPTED' && !canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors w-full"
                        >
                            Reject
                        </button>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm hover:shadow-md transition-shadow">
            {/* Header with Name and Status */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg truncate">
                            {participant.user?.first_name} {participant.user?.last_name}
                        </h3>
                        {getStatusBadge()}
                    </div>
                    {isAdmin && participant.user?.temple?.name && (
                        <div className="text-sm text-gray-500 mb-2">
                            Temple: {participant.user.temple.name}
                        </div>
                    )}
                </div>
            </div>

            {/* Contact and Result Row */}
            <div className="mb-4 flex items-center justify-between">
                {/* Contact Information - Left */}
                <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-sm text-gray-600">
                        {participant.user?.phone || 'Phone not provided'}
                    </span>
                </div>

                {/* Result - Right (only show if there's a result) */}
                {participant.event_result?.rank && (
                    <div className="flex items-center">
                        {participant.event_result?.rank === 'FIRST' && (
                            <span className="text-2xl">🥇</span>
                        )}
                        {participant.event_result?.rank === 'SECOND' && (
                            <span className="text-2xl">🥈</span>
                        )}
                        {participant.event_result?.rank === 'THIRD' && (
                            <span className="text-2xl">🥉</span>
                        )}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {getActionButtons()}
        </div>
    );
};

export default MobileParticipantCard;
