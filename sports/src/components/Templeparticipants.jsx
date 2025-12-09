import React, { useState, useEffect } from 'react'
import CollapsibleList from './CollapsibleList'
import { eventAPI } from '../utils/api'

const Templeparticipants = () => {
    const [selectedAge, setSelectedAge] = useState('0-5');
    const [selectedGender, setSelectedGender] = useState('MALE');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ageGroups, setAgeGroups] = useState([]);
    const [genders, setGenders] = useState([]);
    const [events, setEvents] = useState([]);
    const [allParticipants, setAllParticipants] = useState([]);

    // Fetch all data when age category or gender changes
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                const data = await eventAPI.getParticipantData({
                    ageCategory: selectedAge,
                    gender: selectedGender
                });
                
                // Filter out the 'All' option from age groups
                const filteredAgeGroups = data.ageCategories.filter(group => group.name !== 'All');
                setAgeGroups(filteredAgeGroups);
                setGenders(data.genderOptions);
                setEvents(data.events);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedAge, selectedGender]);

    // Group events by age category and gender
    const groupedEvents = events.reduce((acc, event) => {
        const key = `${event.age_category}::${event.gender}`;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(event);
        return acc;
    }, {});

    // Get all event IDs from the current view
    const getAllEventIds = () => {
        return Object.values(groupedEvents).flat().map(event => event.id);
    };

    // Fetch participants for all events in the current view
        const fetchParticipants = async () => {
            try {
                const eventIds = getAllEventIds();
                if (eventIds.length === 0) return;

            // Build query parameters
            const params = {
                event_ids: eventIds.join(',')
            };
            if (selectedStatus !== 'ALL') {
                params.status = selectedStatus;
                }

            const data = await eventAPI.getTempleParticipants(params);
                setAllParticipants(data);
            } catch (err) {
                console.error('Error fetching participants:', err);
                setError(err.message);
            }
        };

    useEffect(() => {
        fetchParticipants();
    }, [events, selectedStatus]);

    // Get participants for a specific event
    const getParticipantsForEvent = (eventId) => {
        return allParticipants.filter(p => p.event_id === eventId);
    };

    // Handle participant updates
    const handleParticipantsUpdate = () => {
        fetchParticipants();
    };

    return (
        <section className="min-h-screen bg-[#F0F0F0]">
            <div className="w-full px-4 py-0 sm:py-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto m-4">
                    {/* Header */}
                    <div className="sm:mb-4">
                        <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-[#2A2A2A] mb-2">Temple Participants</h1>
                        <p className="hidden md:block text-sm sm:text-base text-[#5A5A5A]">View and manage participants for all events</p>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 gap-1 md:gap-4 mb-2 md:mb-8">
                        {/* Age Category Filter Chips */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-[#2A2A2A] font-medium">Filter by Age Category</label>
                            <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
                                <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
                                    {ageGroups && ageGroups.length > 0 ? (
                                        ageGroups.map((group) => (
                                            <button
                                                key={group.id}
                                                onClick={() => setSelectedAge(group.name)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
              ${selectedAge === group.name
                                                        ? 'bg-[#D35D38] text-white shadow-md'
                                                        : 'bg-white text-[#2A2A2A] border border-gray-300 hover:border-[#D35D38] hover:text-[#D35D38]'
                                                    }`}
                                            >
                                                {group.name}
                                            </button>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm">Loading age groups...</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Gender Filter Chips */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-[#2A2A2A] font-medium">Filter by Gender</label>
                            <div className="flex flex-wrap gap-2">
                                {genders && genders.length > 0 ? (
                                    genders.map((gender) => (
                                        <button
                                            key={gender.id}
                                            onClick={() => setSelectedGender(gender.value)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
              ${selectedGender === gender.value
                                                    ? 'bg-[#D35D38] text-white shadow-md'
                                                    : 'bg-white text-[#2A2A2A] border border-gray-300 hover:border-[#D35D38] hover:text-[#D35D38]'
                                                }`}
                                        >
                                            {gender.name}
                                        </button>
                                    ))
                                ) : (
                                    <span className="text-gray-400 text-sm">Loading genders...</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex justify-center items-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                </div>
                    )}

                    {/* Events List */}
                    <div className="space-y-6 sm:space-y-8">
                        {Object.entries(groupedEvents).length > 0 ? (
                            Object.entries(groupedEvents).map(([key, groupEvents]) => {
                                const [ageCategory, gender] = key.split('::');
                                return (
                                    <div key={key} className="space-y-4">
                                        <h3 className="text-m md:text-lg lg:text-xl font-semibold text-[#D35D38] border-b-2 border-[#F8DFBE] pb-2">
                                            {ageCategory} - {gender}
                                        </h3>
                                        <div className="space-y-2 md:space-y-4 ">
                                            {groupEvents.map((event) => (
                                                <CollapsibleList 
                                                    key={event.id} 
                                                    title={event.name}
                                                    eventId={event.id}
                                                    participants={getParticipantsForEvent(event.id)}
                                                    onParticipantsUpdate={handleParticipantsUpdate}
                                                    isAdmin={false}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            selectedAge && !loading && (
                                <p className="text-[#5A5A5A] text-center py-4">No events found for this age category</p>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Templeparticipants;