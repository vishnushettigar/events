import React, { useState, useEffect } from 'react'
import CollapsibleList from './CollapsibleList'

const Templeparticipants = () => {
    const [selectedAge, setSelectedAge] = useState('0-5');
    const [selectedGender, setSelectedGender] = useState('MALE');
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
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch(
                    `http://localhost:4000/api/events/participant-data?ageCategory=${selectedAge}&gender=${selectedGender}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch data');
                }

                const data = await response.json();
                
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
    useEffect(() => {
        const fetchParticipants = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const eventIds = getAllEventIds();
                if (eventIds.length === 0) return;

                const response = await fetch(
                    `http://localhost:4000/api/events/temple-participants?event_ids=${eventIds.join(',')}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch participants');
                }

                const data = await response.json();
                setAllParticipants(data);
            } catch (err) {
                console.error('Error fetching participants:', err);
                setError(err.message);
            }
        };

        fetchParticipants();
    }, [events]);

    // Get participants for a specific event
    const getParticipantsForEvent = (eventId) => {
        return allParticipants.filter(p => p.event_id === eventId);
    };

    return (
        <section className="min-h-screen bg-[#F0F0F0]">
            <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto p-6 m-4">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-[#2A2A2A] sm:text-3xl">Temple Participants</h1>
                        <p className="mt-2 text-sm text-[#5A5A5A]">Manage and view all participants for temple events</p>
                        </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {/* Age Category Filter */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-[#2A2A2A] font-medium">Filter by Age Category</label>
                        <select 
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
                            value={selectedAge}
                                onChange={(e) => setSelectedAge(e.target.value)}
                        >
                                {ageGroups && ageGroups.length > 0 ? (
                                    ageGroups.map((group) => (
                                        <option key={group.id} value={group.value}>
                                            {group.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading age groups...</option>
                                )}
                        </select>
                    </div>

                        {/* Gender Filter */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-[#2A2A2A] font-medium">Filter by Gender</label>
                            <select 
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
                                value={selectedGender}
                                onChange={(e) => setSelectedGender(e.target.value)}
                            >
                                {genders && genders.length > 0 ? (
                                    genders.map((gender) => (
                                        <option key={gender.id} value={gender.value}>
                                            {gender.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading genders...</option>
                                )}
                            </select>
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
                                        <h3 className="text-xl font-semibold text-[#D35D38] border-b-2 border-[#D35D38] pb-2">
                                            {ageCategory} - {gender}
                                        </h3>
                                        <div className="space-y-4 sm:pl-4">
                                            {groupEvents.map((event) => (
                                                <CollapsibleList 
                                                    key={event.id} 
                                                    title={event.name}
                                                    eventId={event.id}
                                                    participants={getParticipantsForEvent(event.id)}
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