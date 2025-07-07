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
        <div className="min-h-screen bg-[#F0F0F0] py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-4">
                        Temple Participants
                    </h1>
                    <p className="text-lg text-[#5A5A5A]">
                        Manage and view all participants for temple events
                    </p>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-2xl font-bold text-[#2A2A2A] mb-4">Filter Events</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Age Category Filter */}
                        <div>
                            <label htmlFor="ageCategory" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Age Category
                            </label>
                            <select 
                                id="ageCategory"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
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
                        <div>
                            <label htmlFor="gender" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                                Gender
                            </label>
                            <select 
                                id="gender"
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
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
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38] mx-auto mb-4"></div>
                            <p className="text-[#5A5A5A]">Loading events and participants...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
                        <div className="flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <strong className="font-bold">Error!</strong>
                            <span className="ml-2">{error}</span>
                        </div>
                    </div>
                )}

                {/* Events List */}
                {!loading && !error && (
                    <div className="space-y-8">
                        {Object.entries(groupedEvents).length > 0 ? (
                            Object.entries(groupedEvents).map(([key, groupEvents]) => {
                                const [ageCategory, gender] = key.split('::');
                                return (
                                    <div key={key} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                                        {/* Category Header */}
                                        <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
                                            <h3 className="text-xl font-bold text-white">
                                                {ageCategory} - {gender}
                                            </h3>
                                            <p className="text-white/80 text-sm mt-1">
                                                {groupEvents.length} event{groupEvents.length !== 1 ? 's' : ''} available
                                            </p>
                                        </div>
                                        
                                        {/* Events List */}
                                        <div className="p-6 space-y-4">
                                            {groupEvents.map((event) => (
                                                <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <CollapsibleList 
                                                        title={event.name}
                                                        eventId={event.id}
                                                        participants={getParticipantsForEvent(event.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            selectedAge && (
                                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                                    <div className="text-[#5A5A5A]">
                                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-lg font-semibold mb-2">No events found</p>
                                        <p className="text-sm">No events are available for the selected age category and gender combination.</p>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}

                {/* Summary Stats */}
                {!loading && !error && Object.entries(groupedEvents).length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
                        <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-center">📊 Events Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-[#D35D38]">
                                    {Object.keys(groupedEvents).length}
                                </p>
                                <p className="text-sm text-[#5A5A5A]">Age/Gender Categories</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-[#D35D38]">
                                    {events.length}
                                </p>
                                <p className="text-sm text-[#5A5A5A]">Total Events</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-[#D35D38]">
                                    {allParticipants.length}
                                </p>
                                <p className="text-sm text-[#5A5A5A]">Total Participants</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Templeparticipants;