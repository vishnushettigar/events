import React, { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { getCurrentUserTemple } from '../utils/templeUtils';

// Custom debounce hook
const useDebounce = (callback, delay) => {
    const timeoutRef = useRef(null);

    return useCallback((...args) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            callback(...args);
        }, delay);
    }, [callback, delay]);
};

const CollapsibleList = ({ title, children, categoryColor }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-6 border border-gray-200 rounded-lg shadow-md overflow-hidden">
            <button
                className={`w-full text-left px-6 py-4 ${categoryColor} hover:opacity-90 font-bold text-lg text-white focus:outline-none flex justify-between items-center transition-all duration-200`}
                onClick={() => setOpen((prev) => !prev)}
            >
                <span className="flex items-center">
                    <span className="mr-3">{open ? '−' : '+'}</span>
                    {title}
                </span>
                <span className="text-sm opacity-80">{open ? 'Collapse' : 'Expand'}</span>
            </button>
            {open && (
                <div className="p-6 bg-white border-t border-gray-100">
                    {children}
                </div>
            )}
        </div>
    );
};

const TeamEvents = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [events, setEvents] = useState([]);
    const [registeredTeams, setRegisteredTeams] = useState([]);

    // Fetch user profile, events, and registered teams on component mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                // Fetch user profile
                const profileResponse = await axios.get('http://localhost:4000/api/users/profile', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setUserProfile(profileResponse.data);

                // Fetch team events
                const eventsResponse = await axios.get('http://localhost:4000/api/events/team-events', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setEvents(eventsResponse.data);

                // Fetch registered teams
                const teamsResponse = await axios.get('http://localhost:4000/api/events/temple-teams', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                setRegisteredTeams(teamsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                setError('Failed to fetch data');
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (eventName, gender, players, registrationId = null) => {
        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            // Filter out empty player entries
            const validPlayers = players.filter(player => player.name && player.profileId);

            if (validPlayers.length === 0) {
                setError('Please add at least one player');
                return;
            }

            if (!userProfile) {
                setError('User profile not found. Please refresh the page.');
                return;
            }

            // Get event ID based on event name and gender
            const eventId = getEventId(eventName, gender);
            if (!eventId) {
                setError('Invalid event');
                return;
            }

            if (registrationId) {
                // Update existing team
                const response = await axios.put(`http://localhost:4000/api/events/update-team/${registrationId}`, {
                    member_user_ids: validPlayers.map(player => player.profileId)
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setSuccess('Team updated successfully!');
            } else {
                // Register new team
                const response = await axios.post('http://localhost:4000/api/events/register-team', {
                    temple_id: userProfile.temple_id,
                    event_id: eventId,
                    member_user_ids: validPlayers.map(player => player.profileId)
                }, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                setSuccess('Team registered successfully!');
            }
            
            // Refresh registered teams
            const teamsResponse = await axios.get('http://localhost:4000/api/events/temple-teams', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            setRegisteredTeams(teamsResponse.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Error processing team');
        } finally {
            setLoading(false);
        }
    };

    const getEventId = (eventName, gender) => {
        // Find the event in the fetched events array
        const event = events.find(e => {
            const eventTypeName = e.event_type?.name?.toLowerCase();
            const searchName = eventName.toLowerCase();
            
            // More flexible matching for different naming conventions
            const matches = 
                eventTypeName === searchName ||
                eventTypeName === searchName.replace('-', ' ') ||
                eventTypeName === searchName.replace(' ', '-') ||
                eventTypeName === searchName.replace('of', 'of ') ||
                eventTypeName === searchName.replace('4x100', '100 x 4') ||
                eventTypeName === searchName.replace('100 x 4', '4x100');
            
            // Handle gender matching - ALL gender events should match any gender
            const genderMatches = e.gender === gender || e.gender === 'ALL';
            
            return matches && genderMatches;
        });
        
        return event?.id;
    };

    const getEventName = (eventId) => {
        const event = events.find(e => e.id === eventId);
        return event?.event_type?.name || 'Unknown Event';
    };

    // Helper function to get registered team for an event
    const getRegisteredTeam = (eventName, gender) => {
        const eventId = getEventId(eventName, gender);
        return registeredTeams.find(team => team.event_id === eventId);
    };

    const TeamForm = ({ eventName, playerCount, gender, buttonColor }) => {
        const registeredTeam = getRegisteredTeam(eventName, gender);
        const isEditing = !!registeredTeam;
        
        // Initialize players with registered team data if available, otherwise empty
        const initialPlayers = registeredTeam ? 
            registeredTeam.members.map(member => ({
                name: `${member.first_name} ${member.last_name || ''}`.trim(),
                aadharNumber: member.aadhar_number || '',
                profileId: member.id
            })) : 
            Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' });

        const [players, setPlayers] = useState(initialPlayers);
        const [loadingPlayers, setLoadingPlayers] = useState(Array(playerCount).fill(false));
        const [errors, setErrors] = useState(Array(playerCount).fill(null));
        const [editMode, setEditMode] = useState(false);
        const [suggestions, setSuggestions] = useState([]);
        const [showSuggestions, setShowSuggestions] = useState(Array(playerCount).fill(false));
        const [loadingSuggestions, setLoadingSuggestions] = useState(false);
        const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

        // Update players when registeredTeam changes
        useEffect(() => {
            if (registeredTeam) {
                const teamPlayers = registeredTeam.members.map(member => ({
                    name: `${member.first_name} ${member.last_name || ''}`.trim(),
                    aadharNumber: member.aadhar_number || '',
                    profileId: member.id
                }));
                setPlayers(teamPlayers);
                setEditMode(false); // Reset edit mode when team data changes
            } else {
                setPlayers(Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' }));
                setEditMode(false);
            }
            // Reset suggestions state
            setShowSuggestions(Array(playerCount).fill(false));
            setSuggestions([]);
            setActiveSuggestionIndex(-1);
        }, [registeredTeam, playerCount]);

        // Close suggestions when clicking outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (!event.target.closest('.suggestions-container')) {
                    setShowSuggestions(Array(playerCount).fill(false));
                    setSuggestions([]);
                    setActiveSuggestionIndex(-1);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, [playerCount]);

        // Fetch temple users for autocomplete
        const fetchTempleUsers = async (searchTerm) => {
            try {
                console.log('Fetching temple users for search term:', searchTerm);
                setLoadingSuggestions(true);
                const response = await axios.get('http://localhost:4000/api/users/templeusers', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                console.log('Temple users response:', response.data);
                const templeUsers = response.data;
                
                // Filter users whose Aadhaar number starts with the search term
                const filteredUsers = templeUsers.filter(user => {
                    if (!user.aadhar_number) return false;
                    const aadharStr = user.aadhar_number.toString();
                    const searchStr = searchTerm.toString();
                    console.log(`Comparing: "${aadharStr}" starts with "${searchStr}" = ${aadharStr.startsWith(searchStr)}`);
                    return aadharStr.startsWith(searchStr);
                });
                
                console.log('Filtered users:', filteredUsers);
                setSuggestions(filteredUsers);
            } catch (error) {
                console.error('Error fetching temple users:', error);
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        // Debounced search for suggestions
        const debouncedFetchSuggestions = useDebounce((searchTerm) => {
            console.log('Debounced fetch called with:', searchTerm);
            if (searchTerm.length >= 1) {
                fetchTempleUsers(searchTerm);
            } else {
                setSuggestions([]);
            }
        }, 300);

        const searchUserByAadhar = async (aadharNumber, index) => {
            try {
                setLoadingPlayers(prev => {
                    const newState = [...prev];
                    newState[index] = true;
                    return newState;
                });

                const response = await axios.get(`http://localhost:4000/api/users/search-by-aadhar`, {
                    params: { aadharNumber },
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                const user = response.data;

                if (!userProfile || user.temple_id !== userProfile.temple_id) {
                    setErrors(prev => {
                        const newState = [...prev];
                        newState[index] = 'User belongs to a different temple';
                        return newState;
                    });
                    return;
                }

                setPlayers(prev => {
                    const newState = [...prev];
                    newState[index] = {
                        ...newState[index],
                        name: user.name,
                        aadharNumber: user.aadhar_number,
                        profileId: user.id
                    };
                    return newState;
                });

                setErrors(prev => {
                    const newState = [...prev];
                    newState[index] = null;
                    return newState;
                });
            } catch (error) {
                setErrors(prev => {
                    const newState = [...prev];
                    newState[index] = error.response?.data?.error || 'Error fetching user details';
                    return newState;
                });
            } finally {
                setLoadingPlayers(prev => {
                    const newState = [...prev];
                    newState[index] = false;
                    return newState;
                });
            }
        };

        // Use our custom debounce hook
        const debouncedSearch = useDebounce((aadharNumber, index) => {
            if (aadharNumber.length === 12) {
                searchUserByAadhar(aadharNumber, index);
            }
        }, 500);

        const handlePlayerChange = (index, field, value) => {
            console.log('handlePlayerChange called:', { index, field, value });
            const newPlayers = [...players];
            newPlayers[index] = { ...newPlayers[index], [field]: value };
            setPlayers(newPlayers);

            if (field === 'aadharNumber') {
                console.log('Processing Aadhaar number change:', value);
                
                // Check for duplicate Aadhaar numbers
                const duplicateIndex = newPlayers.findIndex((player, idx) => 
                    idx !== index && 
                    player.aadharNumber && 
                    player.aadharNumber === value
                );

                // Clear previous error
                setErrors(prev => {
                    const newState = [...prev];
                    newState[index] = null;
                    return newState;
                });

                // Set error if duplicate found
                if (duplicateIndex !== -1 && value.length > 0) {
                    setErrors(prev => {
                        const newState = [...prev];
                        newState[index] = 'This person is already added to the team';
                        return newState;
                    });
                    return; // Don't proceed with suggestions or search if duplicate
                }

                // Show suggestions dropdown from 1 digit
                setShowSuggestions(prev => {
                    const newState = [...prev];
                    newState[index] = value.length >= 1;
                    console.log('Setting showSuggestions for index', index, 'to:', value.length >= 1);
                    return newState;
                });

                // Fetch suggestions
                debouncedFetchSuggestions(value);

                // Only search for exact match if Aadhaar number is 12 digits
                if (value.length === 12) {
                    debouncedSearch(value, index);
                }
            }
        };

        const handleSuggestionSelect = (suggestion, index) => {
            // Check for duplicate Aadhaar numbers before setting
            const duplicateIndex = players.findIndex((player, idx) => 
                idx !== index && 
                player.aadharNumber && 
                player.aadharNumber === suggestion.aadhar_number
            );

            if (duplicateIndex !== -1) {
                setErrors(prev => {
                    const newState = [...prev];
                    newState[index] = 'This person is already added to the team';
                    return newState;
                });
                return; // Don't set the suggestion if duplicate
            }

            setPlayers(prev => {
                const newState = [...prev];
                newState[index] = {
                    ...newState[index],
                    name: suggestion.name,
                    aadharNumber: suggestion.aadhar_number,
                    profileId: suggestion.id
                };
                return newState;
            });

            // Hide suggestions
            setShowSuggestions(prev => {
                const newState = [...prev];
                newState[index] = false;
                return newState;
            });

            setSuggestions([]);
            setErrors(prev => {
                const newState = [...prev];
                newState[index] = null;
                return newState;
            });
        };

        const handleSubmitForm = () => {
            // Check for duplicates before submitting
            const aadharNumbers = players
                .filter(player => player.aadharNumber && player.profileId)
                .map(player => player.aadharNumber);
            
            const uniqueAadharNumbers = new Set(aadharNumbers);
            
            if (aadharNumbers.length !== uniqueAadharNumbers.size) {
                setError('Team cannot have duplicate members. Please remove duplicates before submitting.');
                return;
            }

            handleSubmit(eventName, gender, players, registeredTeam?.id);
        };

        const handleEditClick = () => {
            setEditMode(true);
        };

        const handleCancelEdit = () => {
            // Reset to original data
            if (registeredTeam) {
                const teamPlayers = registeredTeam.members.map(member => ({
                    name: `${member.first_name} ${member.last_name || ''}`.trim(),
                    aadharNumber: member.aadhar_number || '',
                    profileId: member.id
                }));
                setPlayers(teamPlayers);
            }
            setEditMode(false);
            setErrors(Array(playerCount).fill(null));
            setSuggestions([]);
            setShowSuggestions(Array(playerCount).fill(false));
        };

        return (
            <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((player, i) => (
                            <div key={i} className="flex gap-3 items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                <span className="w-8 h-8 flex items-center justify-center bg-[#D35D38] text-white rounded-full text-sm font-bold">
                                    {i + 1}
                                </span>
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        placeholder="Aadhaar Number"
                                        className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35D38] focus:border-[#D35D38] transition-all ${
                                            !editMode && isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white'
                                        }`}
                                        value={player.aadharNumber}
                                        onChange={(e) => handlePlayerChange(i, 'aadharNumber', e.target.value)}
                                        maxLength={12}
                                        readOnly={!editMode && isEditing}
                                    />
                                    {loadingPlayers[i] && editMode && (
                                        <div className="text-sm text-[#D35D38] mt-1">Loading...</div>
                                    )}
                                    {errors[i] && editMode && (
                                        <div className="text-sm text-red-600 mt-1">{errors[i]}</div>
                                    )}
                                    
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions[i] && suggestions.length > 0 && !(!editMode && isEditing) && (
                                        <div className="suggestions-container absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {loadingSuggestions ? (
                                                <div className="p-3 text-sm text-gray-500">Loading suggestions...</div>
                                            ) : (
                                                suggestions.map((suggestion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-3 hover:bg-[#F0F0F0] cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
                                                            idx === activeSuggestionIndex ? 'bg-[#F0F0F0]' : ''
                                                        }`}
                                                        onClick={() => handleSuggestionSelect(suggestion, i)}
                                                    >
                                                        <div className="font-semibold text-sm text-[#2A2A2A]">{suggestion.aadhar_number}</div>
                                                        <div className="text-xs text-[#5A5A5A]">{suggestion.name}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className={`flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D35D38] focus:border-[#D35D38] transition-all ${
                                        !editMode && isEditing ? 'bg-gray-100 text-gray-600' : 'bg-white'
                                    }`}
                                    value={player.name}
                                    onChange={(e) => handlePlayerChange(i, 'name', e.target.value)}
                                    readOnly={(!editMode && isEditing) || loadingPlayers[i]}
                                />
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="flex gap-3">
                    {!isEditing ? (
                        // New team registration
                        <button
                            className={`px-6 py-3 ${buttonColor} text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold transition-all duration-200 shadow-md`}
                            onClick={handleSubmitForm}
                            disabled={loading || errors.some(error => error !== null) || !userProfile}
                        >
                            {loading ? (
                                <span className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </span>
                            ) : (
                                `Submit ${eventName} Team`
                            )}
                        </button>
                    ) : editMode ? (
                        // Edit mode - show Save and Cancel buttons
                        <>
                            <button
                                className={`px-6 py-3 ${buttonColor} text-white rounded-lg hover:opacity-90 disabled:opacity-50 font-semibold transition-all duration-200 shadow-md`}
                                onClick={handleSubmitForm}
                                disabled={loading || errors.some(error => error !== null) || !userProfile}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Processing...
                                    </span>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                            <button
                                className="px-6 py-3 bg-[#5A5A5A] text-white rounded-lg hover:bg-[#2A2A2A] font-semibold transition-all duration-200 shadow-md"
                                onClick={handleCancelEdit}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        // Read-only mode - show Edit button
                        <button
                            className="px-6 py-3 bg-[#D35D38] text-white rounded-lg hover:bg-[#B84A2E] font-semibold transition-all duration-200 shadow-md"
                            onClick={handleEditClick}
                        >
                            Edit Team
                        </button>
                    )}
                </div>
            </div>
        );
    };

    if (!userProfile) {
        return (
            <section className="min-h-screen bg-[#F0F0F0]">
                <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38] mx-auto"></div>
                        <p className="mt-4 text-[#5A5A5A] text-lg">Loading...</p>
                    </div>
                </div>
            </section>
        );
    }

    // Check if user has TEMPLE_ADMIN role
    if (userProfile.role !== 'TEMPLE_ADMIN') {
        return (
            <section className="min-h-screen bg-[#F0F0F0]">
                <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
                    <h2 className="text-3xl font-bold mb-6 text-[#2A2A2A]">Group Events Registration</h2>
                    <div className="text-center p-12">
                        <div className="text-[#D35D38] text-2xl font-bold mb-4">
                            Access Denied
                        </div>
                        <p className="text-[#5A5A5A] mb-4 text-lg">
                            Only Temple Administrators can register teams for group events.
                        </p>
                        <p className="text-sm text-[#5A5A5A] bg-[#F0F0F0] p-3 rounded-lg inline-block">
                            Your current role: <span className="font-semibold">{userProfile.role}</span>
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="min-h-screen bg-[#F0F0F0]">
            <div className="px-4 py-8 max-w-6xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-8 py-6">
                        <h2 className="text-3xl font-bold text-white mb-2">Group Events Registration</h2>
                        <p className="text-white opacity-90">Manage team registrations for temple sports events</p>
                    </div>

                    <div className="p-8">
                        {/* Important Notice */}
                        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700 font-semibold">
                                        <strong>Important:</strong> Participants in team events must register before the temple admin adds their names.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status Messages */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
                                <svg className="h-5 w-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center">
                                <svg className="h-5 w-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                {success}
                            </div>
                        )}

                        {/* Registration Forms */}
                        <div className="space-y-8">
                            {/* Men's Section */}
                            <div>
                                <h3 className="text-2xl font-bold mb-6 text-[#2A2A2A] flex items-center">
                                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold text-sm">M</span>
                                    </div>
                                    Men's Events
                                </h3>
                                <div className="space-y-6">
                                    <CollapsibleList title="Volleyball (9 Players)" categoryColor="bg-blue-600">
                                        <TeamForm eventName="Volleyball" playerCount={9} gender="MALE" buttonColor="bg-blue-600" />
                                    </CollapsibleList>
                                    <CollapsibleList title="Tug of War (9 Players)" categoryColor="bg-blue-600">
                                        <TeamForm eventName="Tug of War" playerCount={9} gender="MALE" buttonColor="bg-blue-600" />
                                    </CollapsibleList>
                                    <CollapsibleList title="Relay - 100 X 4 (4 Players)" categoryColor="bg-blue-600">
                                        <TeamForm eventName="Relay - 100 X 4" playerCount={4} gender="MALE" buttonColor="bg-blue-600" />
                                    </CollapsibleList>
                                </div>
                            </div>

                            {/* Women's Section */}
                            <div>
                                <h3 className="text-2xl font-bold mb-6 text-[#2A2A2A] flex items-center">
                                    <div className="w-8 h-8 bg-pink-600 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold text-sm">W</span>
                                    </div>
                                    Women's Events
                                </h3>
                                <div className="space-y-6">
                                    <CollapsibleList title="Throwball (10 Players)" categoryColor="bg-pink-600">
                                        <TeamForm eventName="Throwball" playerCount={10} gender="FEMALE" buttonColor="bg-pink-600" />
                                    </CollapsibleList>
                                    <CollapsibleList title="Tug of War (9 Players)" categoryColor="bg-pink-600">
                                        <TeamForm eventName="Tug of War" playerCount={9} gender="FEMALE" buttonColor="bg-pink-600" />
                                    </CollapsibleList>
                                    <CollapsibleList title="Relay - 100 X 4 (4 Players)" categoryColor="bg-pink-600">
                                        <TeamForm eventName="Relay - 100 X 4" playerCount={4} gender="FEMALE" buttonColor="bg-pink-600" />
                                    </CollapsibleList>
                                </div>
                            </div>

                            {/* Mixed Gender Events */}
                            <div>
                                <h3 className="text-2xl font-bold mb-6 text-[#2A2A2A] flex items-center">
                                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-white font-bold text-sm">M</span>
                                    </div>
                                    Mixed Gender Events
                                </h3>
                                <div className="space-y-6">
                                    <CollapsibleList title="Couple Relay - 50 x 2 (2 Players)" categoryColor="bg-green-600">
                                        <TeamForm eventName="Couple Relay - 50 x 2" playerCount={2} gender="ALL" buttonColor="bg-green-600" />
                                    </CollapsibleList>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamEvents;
