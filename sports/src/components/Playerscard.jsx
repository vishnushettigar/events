import React from 'react';

const Playerscard = ({ participant, onStatusUpdate, acceptedCount, pendingCount, isAdmin = false, isViewer = false, updatingStatus = false }) => {
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
            return <div className="text-sm text-gray-500 italic">Auto-approved</div>;
        }

        if (updatingStatus) {
            return <div className="text-sm text-gray-500 italic">Updating...</div>;
        }

        // Admin buttons - show all options
        if (showAdminButtons) {
            return (
                <div className="flex gap-2">
                    {participant.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('ACCEPTED')}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('DECLINED')}
                                className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                            >
                                Reject
                            </button>
                        </>
                    )}
                    {participant.status === 'ACCEPTED' && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                        >
                            Reject
                        </button>
                    )}
                    {participant.status === 'DECLINED' && (
                        <>
                            <button
                                onClick={() => handleStatusUpdate('ACCEPTED')}
                                className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                            >
                                Accept
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('PENDING')}
                                className="text-sm bg-yellow-500 text-white px-3 py-1.5 rounded-md hover:bg-yellow-600 transition-colors"
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
                <div className="flex gap-2">
                    {/* Accept button for PENDING participants - only if less than 3 accepted */}
                    {participant.status === 'PENDING' && canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('ACCEPTED')}
                            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                        >
                            Accept
                        </button>
                    )}
                    {/* Accept button for REJECTED participants - only if less than 3 accepted */}
                    {participant.status === 'DECLINED' && canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('ACCEPTED')}
                            className="text-sm bg-green-500 text-white px-3 py-1.5 rounded-md hover:bg-green-600 transition-colors"
                        >
                            Accept
                        </button>
                    )}
                    {/* Reject button for PENDING participants */}
                    {participant.status === 'PENDING' && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                        >
                            Reject
                        </button>
                    )}
                    {/* Reject button for ACCEPTED participants - show when there are 3 accepted (to make room) */}
                    {participant.status === 'ACCEPTED' && !canAcceptMore && (
                        <button
                            onClick={() => handleStatusUpdate('DECLINED')}
                            className="text-sm bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 transition-colors"
                        >
                            Reject
                        </button>
                    )}
                    {/* Show message for PENDING participants when limit is reached */}
                    {participant.status === 'PENDING' && !canAcceptMore && (
                        <div className="text-sm text-gray-500 italic">
                            Limit reached (3/3)
                        </div>
                    )}
                    {/* Show message for REJECTED participants when limit is reached */}
                    {participant.status === 'DECLINED' && !canAcceptMore && (
                        <div className="text-sm text-gray-500 italic">
                            Limit reached (3/3)
                        </div>
                    )}
                </div>
            );
        }

        return null;
    };

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
            {/* Name */}
            <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="font-medium text-gray-900">
                        {participant.user?.first_name} {participant.user?.last_name}
                    </div>
                    {getStatusBadge()}
                    {isAdmin && participant.user?.temple?.name && (
                        <div className="text-xs text-gray-500">
                            ({participant.user.temple.name})
                        </div>
                    )}
                </div>
            </td>

            {/* Email */}
            <td className="px-4 py-3 text-gray-900">
                {participant.user?.email || 'Not provided'}
            </td>

            {/* Phone */}
            <td className="px-4 py-3 text-gray-900">
                {participant.user?.phone || 'Not provided'}
            </td>

            {/* Result */}
            <td className="px-4 py-3">
                <div className={`font-semibold ${
                    participant.event_result?.rank === 'FIRST' ? 'text-yellow-500' :
                    participant.event_result?.rank === 'SECOND' ? 'text-gray-400' :
                    participant.event_result?.rank === 'THIRD' ? 'text-amber-600' :
                    'text-gray-900'
                }`}>
                    {participant.event_result?.rank || 'Not available'}
                </div>
            </td>

            {/* Actions */}
            {!isAdmin && !isViewer && (
                <td className="px-4 py-3">
                    {getActionButtons()}
                </td>
            )}
        </tr>
    );
};

export default Playerscard;