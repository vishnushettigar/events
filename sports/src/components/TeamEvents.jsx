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

const CollapsibleList = ({ title, children }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="mb-6 border rounded shadow">
            <button
                className="w-full text-left px-4 py-3 bg-[#F0F0F0] hover:bg-[#E0E0E0] font-semibold text-lg rounded-t focus:outline-none flex justify-between items-center text-[#2A2A2A]"
                onClick={() => setOpen((prev) => !prev)}
            >
                {title}
                <span>{open ? '-' : '+'}</span>
            </button>
            {open && <div className="p-4 bg-white rounded-b">{children}</div>}
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

    // Helper function to get registered teams for an event
    const getRegisteredTeams = (eventName, gender) => {
        const eventId = getEventId(eventName, gender);
        return registeredTeams.filter(team => team.event_id === eventId);
    };

    // Helper function to get registered team for an event (for backward compatibility)
    const getRegisteredTeam = (eventName, gender) => {
        const teams = getRegisteredTeams(eventName, gender);
        return teams.length > 0 ? teams[0] : null;
    };

    const TeamForm = ({ eventName, playerCount, gender, buttonColor }) => {
        const registeredTeams = getRegisteredTeams(eventName, gender);
        const isEditing = registeredTeams.length > 0;
        const isMixedGender = gender === 'ALL';
        
        // Initialize players with empty array
        const initialPlayers = Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' });

        const [players, setPlayers] = useState(initialPlayers);
        const [loadingPlayers, setLoadingPlayers] = useState(Array(playerCount).fill(false));
        const [errors, setErrors] = useState(Array(playerCount).fill(null));
        const [editMode, setEditMode] = useState(false);
        const [editingTeamId, setEditingTeamId] = useState(null);
        const [suggestions, setSuggestions] = useState([]);
        const [showSuggestions, setShowSuggestions] = useState(Array(playerCount).fill(false));
        const [loadingSuggestions, setLoadingSuggestions] = useState(false);
        const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

        // Initialize form state when component mounts, playerCount changes, or registeredTeams changes
        useEffect(() => {
            if (registeredTeams.length > 0 && !isMixedGender) {
                // For single gender events, load the first team in edit mode
                const firstTeam = registeredTeams[0];
                const teamPlayers = Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' }).map((_, index) => {
                    const member = firstTeam.members[index];
                    return member ? {
                        name: `${member.first_name} ${member.last_name || ''}`.trim(),
                        aadharNumber: member.aadhar_number || '',
                        profileId: member.id
                    } : { name: '', aadharNumber: '', profileId: '' };
                });
                setPlayers(teamPlayers);
                setEditMode(true);
                setEditingTeamId(firstTeam.id);
            } else {
                // Reset to empty form for new registration or mixed gender events
                setPlayers(Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' }));
                setEditMode(false);
                setEditingTeamId(null);
            }
            // Reset suggestions state
            setShowSuggestions(Array(playerCount).fill(false));
            setSuggestions([]);
            setActiveSuggestionIndex(-1);
        }, [playerCount, registeredTeams.length, isMixedGender]);

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

            // Validate mixed gender events (ALL gender) must have one MALE and one FEMALE
            if (gender === 'ALL') {
                const validPlayers = players.filter(player => player.aadharNumber && player.profileId);
                
                if (validPlayers.length !== 2) {
                    setError('Mixed gender events must have exactly 2 participants.');
                    return;
                }

                // Fetch gender information for the selected players
                const validateMixedGender = async () => {
                    try {
                        const genderPromises = validPlayers.map(player => 
                            axios.get(`http://localhost:4000/api/users/search-by-aadhar`, {
                                params: { aadharNumber: player.aadharNumber },
                                headers: {
                                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                                }
                            })
                        );

                        const responses = await Promise.all(genderPromises);
                        const playerGenders = responses.map(response => response.data.gender);
                        
                        // Check that first player is MALE and second player is FEMALE
                        if (playerGenders[0] !== 'MALE') {
                            setError('First participant must be MALE.');
                            return;
                        }
                        
                        if (playerGenders[1] !== 'FEMALE') {
                            setError('Second participant must be FEMALE.');
                            return;
                        }

                                    // If validation passes, proceed with submission
            handleSubmit(eventName, gender, players, editingTeamId);
                    } catch (error) {
                        setError('Error validating participant genders. Please try again.');
                    }
                };

                validateMixedGender();
                return;
            }

            handleSubmit(eventName, gender, players, editingTeamId);
        };



        const handleEditTeam = (team) => {
            // Set the team data for editing
            const teamPlayers = Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' }).map((_, index) => {
                const member = team.members[index];
                return member ? {
                    name: `${member.first_name} ${member.last_name || ''}`.trim(),
                    aadharNumber: member.aadhar_number || '',
                    profileId: member.id
                } : { name: '', aadharNumber: '', profileId: '' };
            });
            setPlayers(teamPlayers);
            setEditingTeamId(team.id);
            setEditMode(true);
            setErrors(Array(playerCount).fill(null));
            setSuggestions([]);
            setShowSuggestions(Array(playerCount).fill(false));
        };

        const handleCancelEdit = () => {
            // Reset to empty form for new team registration
            setPlayers(Array(playerCount).fill({ name: '', aadharNumber: '', profileId: '' }));
            setEditingTeamId(null);
            setEditMode(false);
            setErrors(Array(playerCount).fill(null));
            setSuggestions([]);
            setShowSuggestions(Array(playerCount).fill(false));
        };

        return (
            <div className="space-y-4">
                {/* Show existing teams for mixed gender events */}
                {isMixedGender && registeredTeams.length > 0 && (
                    <div className="mb-6">
                        <h4 className="text-lg font-semibold mb-3 text-[#2A2A2A]">Registered Teams ({registeredTeams.length})</h4>
                        <div className="space-y-3">
                            {registeredTeams.map((team, teamIndex) => (
                                <div key={team.id} className="bg-[#F8DFBE] p-4 rounded-lg border border-[#E0E0E0]">
                                    <div className="flex justify-between items-center mb-2">
                                        <h5 className="font-semibold text-[#2A2A2A]">Team {teamIndex + 1}</h5>
                                        <button
                                            className="px-3 py-1 bg-[#D35D38] text-white rounded text-sm hover:opacity-90"
                                            onClick={() => handleEditTeam(team)}
                                        >
                                            Edit
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {team.members.map((member, memberIndex) => (
                                            <div key={member.id} className="text-sm">
                                                <span className="font-medium text-[#D35D38]">
                                                    {memberIndex === 0 ? 'MALE' : 'FEMALE'}:
                                                </span>
                                                <span className="ml-2 text-[#2A2A2A]">
                                                    {member.first_name} {member.last_name || ''} ({member.aadhar_number})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Team Registration Form */}
                <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3 text-[#2A2A2A]">
                        {isMixedGender && registeredTeams.length > 0 ? 'Add New Team' : 'Team Registration'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((player, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <span className="w-8 text-right">
                                    {i + 1}.
                                    {gender === 'ALL' && (
                                        <span className="block text-xs font-medium text-[#D35D38]">
                                            {i === 0 ? 'MALE' : 'FEMALE'}
                                        </span>
                                    )}
                                </span>
                                <div className="w-1/2 relative">
                                    <input
                                        type="text"
                                        placeholder={`Aadhaar Number ${gender === 'ALL' ? `(${i === 0 ? 'MALE' : 'FEMALE'})` : ''}`}
                                        className={`w-full p-2 border rounded ${!editMode && registeredTeams.length > 0 ? 'bg-gray-100' : ''}`}
                                        value={player.aadharNumber}
                                        onChange={(e) => handlePlayerChange(i, 'aadharNumber', e.target.value)}
                                        maxLength={12}
                                        readOnly={!editMode && registeredTeams.length > 0 && !isMixedGender}
                                    />
                                    {loadingPlayers[i] && editMode && (
                                        <div className="text-sm text-gray-500">Loading...</div>
                                    )}
                                    {errors[i] && (
                                        <div className="text-sm text-red-500">{errors[i]}</div>
                                    )}
                                    
                                                                    {/* Suggestions Dropdown */}
                                {showSuggestions[i] && suggestions.length > 0 && (editMode || registeredTeams.length === 0 || isMixedGender) && (
                                        <div className="suggestions-container absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {loadingSuggestions ? (
                                                <div className="p-2 text-sm text-gray-500">Loading suggestions...</div>
                                            ) : (
                                                suggestions.map((suggestion, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                                                            idx === activeSuggestionIndex ? 'bg-blue-50' : ''
                                                        }`}
                                                        onClick={() => handleSuggestionSelect(suggestion, i)}
                                                    >
                                                        <div className="font-medium text-sm text-gray-900">{suggestion.aadhar_number}</div>
                                                        <div className="text-xs text-gray-600">{suggestion.name}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className={`w-1/2 p-2 border rounded ${!editMode && registeredTeams.length > 0 ? 'bg-gray-100' : ''}`}
                                    value={player.name}
                                    onChange={(e) => handlePlayerChange(i, 'name', e.target.value)}
                                    readOnly={(!editMode && registeredTeams.length > 0 && !isMixedGender) || loadingPlayers[i]}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                        {editMode ? (
                            // Edit mode - show Save and Cancel buttons
                            <>
                                <button
                                    className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 disabled:opacity-50`}
                                    onClick={handleSubmitForm}
                                    disabled={loading || errors.some(error => error !== null) || !userProfile}
                                >
                                    {loading ? 'Processing...' : 'Save Changes'}
                                </button>
                                <button
                                    className="px-4 py-2 bg-gray-500 text-white rounded hover:opacity-90"
                                    onClick={handleCancelEdit}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>
                            </>
                        ) : (
                            // New team registration
                            <button
                                className={`px-4 py-2 ${buttonColor} text-white rounded hover:opacity-90 disabled:opacity-50`}
                                onClick={handleSubmitForm}
                                disabled={loading || errors.some(error => error !== null) || !userProfile}
                            >
                                {loading ? 'Processing...' : `Submit ${eventName} Team`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    if (!userProfile) {
        return (
                    <section className="p-6 bg-[#F0F0F0] min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38] mx-auto"></div>
                    <p className="mt-2 text-[#2A2A2A]">Loading...</p>
                </div>
            </div>
        </section>
        );
    }

    // Check if user has TEMPLE_ADMIN role
    if (userProfile.role !== 'TEMPLE_ADMIN') {
        return (
                    <section className="p-6 bg-[#F0F0F0] min-h-screen">
            <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-6 text-[#2A2A2A]">Group Events Registration</h2>
                <div className="text-center p-8">
                    <div className="text-[#D35D38] text-xl font-semibold mb-4">
                        Access Denied
                    </div>
                    <p className="text-[#5A5A5A] mb-4">
                        Only Temple Administrators can register teams for group events.
                    </p>
                    <p className="text-sm text-[#5A5A5A]">
                        Your current role: {userProfile.role}
                    </p>
                </div>
            </div>
        </section>
        );
    }

    return (
        <section className="min-h-screen bg-[#F0F0F0]">
            <div className="px-4 py-6 max-w-6xl mx-auto  m-4">
                <h2 className="text-2xl font-bold mb-6 text-[#2A2A2A]">Group Events Registration</h2>
                <p className='font-extrabold text-[#D35D38] pb-4'>**Participants in team events must register before the temple admin adds their names.**</p>

                {error && (
                    <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                        {success}
                    </div>
                )}

                {/* Registration Forms */}
                <div className="mb-10">
                    <h3 className="text-xl font-semibold mb-4 text-[#2A2A2A]">Team Registration</h3>
                    
                    {/* Men's Section */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 text-[#D35D38]">Men's Events</h4>
                        <div className="space-y-6">
                            <CollapsibleList title="Volleyball (9 Players)">
                                <TeamForm eventName="Volleyball" playerCount={9} gender="MALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                            <CollapsibleList title="Tug of War (9 Players)">
                                <TeamForm eventName="Tug of War" playerCount={9} gender="MALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                            <CollapsibleList title="Relay - 100 X 4 (4 Players)">
                                <TeamForm eventName="Relay - 100 X 4" playerCount={4} gender="MALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                        </div>
                    </div>

                    {/* Women's Section */}
                    <div className="mb-8">
                        <h4 className="text-lg font-semibold mb-4 text-[#D35D38]">Women's Events</h4>
                        <div className="space-y-6">
                            <CollapsibleList title="Throwball (10 Players)">
                                <TeamForm eventName="Throwball" playerCount={10} gender="FEMALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                            <CollapsibleList title="Tug of War (9 Players)">
                                <TeamForm eventName="Tug of War" playerCount={9} gender="FEMALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                            <CollapsibleList title="Relay - 100 X 4 (4 Players)">
                                <TeamForm eventName="Relay - 100 X 4" playerCount={4} gender="FEMALE" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                        </div>
                    </div>

                    {/* Mixed Gender Events */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4 text-[#D35D38]">Mixed Gender Events</h4>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800 font-medium">
                                <span className="font-bold">Note:</span> Mixed gender events require exactly one MALE and one FEMALE participant.
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                <span className="font-semibold">Order:</span> First participant must be MALE, second participant must be FEMALE.
                            </p>
                        </div>
                        <div className="space-y-6">
                            <CollapsibleList title="Couple Relay - 50 x 2 (2 Players)">
                                <TeamForm eventName="Couple Relay - 50 x 2" playerCount={2} gender="ALL" buttonColor="bg-[#D35D38]" />
                            </CollapsibleList>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default TeamEvents;