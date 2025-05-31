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

                console.log('Fetching data for age category:', selectedAge, 'and gender:', selectedGender);
                const response = await fetch(
                    `http://localhost:4000/api/events/temple-participant-data?ageCategory=${selectedAge}&gender=${selectedGender}`,
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
                console.log('Received data:', data);
                
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
    const fetchAllParticipants = async () => {
        try {
            const eventIds = getAllEventIds();
            if (eventIds.length === 0) return;

            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('No authentication token found');
            }

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

            const participants = await response.json();
            console.log('Fetched participants for all events:', participants);
            setAllParticipants(participants);
        } catch (err) {
            console.error('Error fetching participants:', err);
            setError(err.message);
        }
    };

    // Get participants for a specific event
    const getParticipantsForEvent = (eventId) => {
        return allParticipants.filter(participant => participant.event_id === eventId);
    };

    // Fetch participants when events change
    useEffect(() => {
        if (events.length > 0) {
            fetchAllParticipants();
        }
    }, [events]);

    return (
        <section className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-3xl font-bold text-blue-800 mb-6">Temple Participants</h2>

                    {/* Search Bar */}
                    {/* <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search participants..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <svg
                                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>
                    </div> */}

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Age Filter */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-gray-700 font-medium">Filter by Age</label>
                        <select 
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            value={selectedAge}
                                onChange={(e) => {
                                    console.log('Selected age:', e.target.value);
                                    setSelectedAge(e.target.value);
                                }}
                        >     
                                {ageGroups && ageGroups.length > 0 ? (
                                    ageGroups.map((ageGroup) => (
                                        <option key={ageGroup.id} value={ageGroup.name}>
                                            {ageGroup.name}
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>Loading age groups...</option>
                                )}
                        </select>
                    </div>

                        {/* Gender Filter */}
                        <div className="flex flex-col">
                            <label className="mb-2 text-gray-700 font-medium">Filter by Gender</label>
                            <select 
                                className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                    <div className="space-y-8">
                        {Object.entries(groupedEvents).length > 0 ? (
                            Object.entries(groupedEvents).map(([key, groupEvents]) => {
                                const [ageCategory, gender] = key.split('::');
                                console.log('Group key:', key, 'Split into:', { ageCategory, gender }); // Debug log
                                return (
                                    <div key={key} className="space-y-4">
                                        <h3 className="text-xl font-semibold text-blue-700 border-b-2 border-blue-200 pb-2">
                                            {ageCategory} - {gender}
                                        </h3>
                                        <div className="space-y-4 pl-4">
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
                                <p className="text-gray-500 text-center py-4">No events found for this age category</p>
                            )
                        )}
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Templeparticipants;