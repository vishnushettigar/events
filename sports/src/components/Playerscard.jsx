import React from 'react'

const Playerscard = () => {
    const participants = [
        {
            name: 'Ankith Shettigar',
            result: 'THIRD',
            phone: '9686671369',
            email: 'ankithshettigar47@gmail.com'
        },
        {
            name: 'Rahul Shettigar',
            result: 'FIRST',
            phone: '9876543210',
            email: 'rahul.shettigar@gmail.com'
        },
        {
            name: 'Priya Shettigar',
            result: 'SECOND',
            phone: '9876543211',
            email: 'priya.shettigar@gmail.com'
        },
        {
            name: 'Extra Participant',
            result: 'NONE',
            phone: '9000000000',
            email: 'extra@example.com'
        }
    ];

    return (
        <div className="space-y-4">
            {participants.map((participant, index) => (
                <div 
                    key={index}
                    className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl shadow-sm p-6 transition-all duration-300 hover:shadow-md hover:border-amber-300 relative"
                >
                    {/* Status badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        {index < 3 ? (
                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">ACCEPTED</span>
                        ) : (
                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold">PENDING</span>
                        )}
                        {/* Delete button (UI only) */}
                        <button
                            className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs font-semibold transition"
                            title="Delete participant"
                        >
                            Delete
                        </button>
                </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Participant Name</h6>
                            <p className="text-lg font-medium text-gray-900">{participant.name}</p>
                </div>
                        <div className="space-y-1">
                            <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Result</h6>
                            <p className={`text-lg font-medium ${
                                participant.result === 'FIRST' ? 'text-yellow-600' :
                                participant.result === 'SECOND' ? 'text-gray-600' :
                                participant.result === 'THIRD' ? 'text-amber-700' :
                                'text-gray-400'
                            }`}>
                                {participant.result}
                            </p>
                </div>
                        <div className="space-y-1">
                            <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Phone No</h6>
                            <p className="text-lg font-medium text-gray-900">{participant.phone}</p>
                </div>
                        <div className="space-y-1">
                            <h6 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Email</h6>
                            <p className="text-lg font-medium text-gray-900 truncate">{participant.email}</p>
            </div>
        </div>
                </div>
            ))}
        </div>
    )
}

export default Playerscard