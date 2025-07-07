import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffPanel = () => {
  const [activeTab, setActiveTab] = useState('temples');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // For Update Results section
  const [selectedAge, setSelectedAge] = useState('0-5');
  const [selectedGender, setSelectedGender] = useState('MALE');
  const [ageGroups, setAgeGroups] = useState([]);
  const [genders, setGenders] = useState([]);
  const [events, setEvents] = useState([]);

  // For Temple Reports section
  const [templeReports, setTempleReports] = useState([]);
  const [loadingTemples, setLoadingTemples] = useState(false);
  const [templeError, setTempleError] = useState(null);

  const tabs = [
    { id: 'temples', name: 'Temple Reports', endpoint: '/api/admin/temples' },
    { id: 'update-results', name: 'Update Results', endpoint: '/api/events/participant-data' },
    { id: 'teams', name: 'Teams', endpoint: '/api/events/team-events' },
    { id: 'champions', name: 'Champions', endpoint: '/api/users/champions' },
    { id: 'all-result', name: 'All Results', endpoint: '/api/users/all-results' }
  ];

  // Fetch temple reports from backend
  const fetchTempleReports = async () => {
    try {
      setLoadingTemples(true);
      setTempleError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/users/temples', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch temple reports');
      }

      const temples = await response.json();
      
      // Transform temple data to include points from backend
      const templeReportsData = temples.map((temple) => ({
        temple_id: temple.id,
        temple_name: temple.name,
        total_points: temple.total_points || 0
      }));
      
      setTempleReports(templeReportsData);
    } catch (err) {
      console.error('Error fetching temple reports:', err);
      setTempleError(err.message);
      // Fallback to empty array
      setTempleReports([]);
    } finally {
      setLoadingTemples(false);
    }
  };

  useEffect(() => {
    // Clear data when switching tabs to prevent structure conflicts
    setData([]);
    setError(null);
    
    if (activeTab === 'temples') {
      fetchTempleReports();
    } else if (activeTab === 'update-results') {
      fetchUpdateResultsData();
    } else if (activeTab === 'teams') {
      fetchTeamEvents();
    } else if (activeTab === 'champions') {
      fetchChampions();
    } else if (activeTab === 'all-result') {
      fetchAllResults();
    } else if (activeTab === 'results') {
      fetchResults();
    } else {
      fetchData();
    }
  }, [activeTab, selectedAge, selectedGender]);

  // Fetch data for Update Results section
  const fetchUpdateResultsData = async () => {
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

  // Fetch team events data
  const fetchTeamEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/events/team-events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team events');
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching team events:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch champions data
  const fetchChampions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/users/champions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch champions');
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching champions:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all results data
  const fetchAllResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      console.log('Fetching all results with token:', token ? 'Token exists' : 'No token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Making request to all-results endpoint...');
      const response = await fetch('http://localhost:4000/api/users/all-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`Failed to fetch all results: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('All Results Data:', data); // Debug logging
      setData(data);
    } catch (err) {
      console.error('Error fetching all results:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch results data
  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/reports/event-performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setData(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Group events by age category and gender
  const groupedEvents = events.reduce((acc, event) => {
    const key = `${event.age_category}::${event.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {});

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (!currentTab) {
        throw new Error('Invalid tab selected');
      }

      const response = await axios.get(`http://localhost:4000${currentTab.endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setData(response.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to fetch data');
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (!currentTab) {
        throw new Error('Invalid tab selected');
      }
      
      if (isEditing) {
        await axios.put(`http://localhost:4000${currentTab.endpoint}/${editingId}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } else {
        await axios.post(`http://localhost:4000${currentTab.endpoint}`, formData, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      setFormData({});
      setIsEditing(false);
      setEditingId(null);
      fetchData();
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err.response?.data?.error || err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setIsEditing(true);
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const currentTab = tabs.find(tab => tab.id === activeTab);
      
      if (!currentTab) {
        throw new Error('Invalid tab selected');
      }
      
      await axios.delete(`http://localhost:4000${currentTab.endpoint}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchData();
    } catch (err) {
      console.error('Error in handleDelete:', err);
      setError(err.response?.data?.error || err.message || 'Delete failed');
    } finally {
      setLoading(false);
    }
  };

  // Handle individual result update
  const handleIndividualResultUpdate = async (registrationId, rank) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/update-individual-result/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rank })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update result');
      }

      // Refresh the data
      await fetchUpdateResultsData();
      alert('Result updated successfully!');
    } catch (error) {
      console.error('Error updating individual result:', error);
      alert(`Error updating result: ${error.message}`);
    }
  };

  // Handle team result update
  const handleTeamResultUpdate = async (registrationId, rank) => {
    try {
      const response = await fetch(`http://localhost:4000/api/events/update-team-result/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ rank })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update result');
      }

      // Refresh the data
      await fetchTeamEvents();
      alert('Result updated successfully!');
    } catch (error) {
      console.error('Error updating team result:', error);
      alert(`Error updating result: ${error.message}`);
    }
  };

  // Collapsible component for events
  const CollapsibleEvent = ({ title, eventId }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [eventParticipants, setEventParticipants] = useState([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [participantError, setParticipantError] = useState(null);

    // Fetch participants when event is opened
    const fetchEventParticipants = async () => {
      if (eventParticipants.length > 0) return; // Already loaded
      
      try {
        setLoadingParticipants(true);
        setParticipantError(null);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:4000/api/events/event-participants/${eventId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch participants');
        }

        const data = await response.json();
        setEventParticipants(data);
      } catch (err) {
        console.error('Error fetching event participants:', err);
        setParticipantError(err.message);
      } finally {
        setLoadingParticipants(false);
      }
    };

    const handleToggle = () => {
      if (!isOpen) {
        fetchEventParticipants();
      }
      setIsOpen(!isOpen);
    };

    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <button
          className="w-full px-4 py-3 text-left bg-[#F8DFBE] hover:bg-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D35D38] rounded-lg flex justify-between items-center"
          onClick={handleToggle}
        >
          <span className="font-medium text-[#2A2A2A]">{title}</span>
          <span className="text-[#5A5A5A]">{isOpen ? '−' : '+'}</span>
        </button>
        {isOpen && (
          <div className="p-4 mt-[2px] bg-white">
            {loadingParticipants ? (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading participants...</span>
              </div>
            ) : participantError ? (
              <div className="text-red-600 text-center py-4">
                Error: {participantError}
              </div>
            ) : eventParticipants.length > 0 ? (
              <div className="space-y-2">
                {eventParticipants.map((participant, index) => (
                  <div key={participant.id || index} className="flex justify-between items-center p-3 bg-[#F8DFBE] rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#2A2A2A]">
                          {participant.registration_type === 'INDIVIDUAL' 
                            ? participant.participant_name 
                            : participant.team_name}
                        </span>
                        <span className="text-sm text-[#5A5A5A]">({participant.temple_name})</span>
                        {participant.registration_type === 'TEAM' && (
                          <span className="text-sm text-[#5A5A5A]">({participant.member_count} members)</span>
                        )}
                      </div>
                      {participant.registration_type === 'INDIVIDUAL' && (
                        <div className="text-xs text-[#5A5A5A] mt-1">
                          <span>Phone: {participant.phone || 'N/A'}</span>
                          <span className="ml-3">Aadhaar: {participant.aadhar_number || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                                            <div className="flex gap-2">
                          <select 
                            className="px-2 py-1 border border-[#F8DFBE] rounded text-sm"
                            defaultValue={participant.result?.rank || ""}
                            id={`rank-${participant.id}`}
                          >
                            <option value="">Select Rank</option>
                            <option value="FIRST">1st Place</option>
                            <option value="SECOND">2nd Place</option>
                            <option value="THIRD">3rd Place</option>
                            <option value="CLEAR">Clear Result</option>
                          </select>
                          <button 
                            className="px-3 py-1 bg-[#D35D38] text-white rounded text-sm hover:bg-[#B84A2E]"
                            onClick={() => {
                              const select = document.getElementById(`rank-${participant.id}`);
                              if (select.value) {
                                handleIndividualResultUpdate(participant.id, select.value);
                              }
                            }}
                          >
                            Update
                          </button>
                        </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No participants registered for this event</p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderTempleReports = () => {
    return (
      <div className="space-y-6">
        {/* Loading State */}
        {loadingTemples && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
            <span className="ml-3 text-[#2A2A2A]">Loading temple reports...</span>
          </div>
        )}

        {/* Error State */}
        {templeError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {templeError}</span>
          </div>
        )}

        {/* Temple Reports Table */}
        {!loadingTemples && !templeError && (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#F8DFBE]">
                <thead className="bg-[#D35D38]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">SL.NO</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Temple Name</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Total Points</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">View Points</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">View All Participants</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-[#F8DFBE]">
                  {templeReports.length > 0 ? (
                    templeReports.map((temple_info, idx) => (
                      <tr key={temple_info.temple_id} className="hover:bg-[#F8DFBE] transition">
                        <td className="px-6 py-4 font-semibold text-[#2A2A2A]">{idx + 1}</td>
                        <td className="px-6 py-4 font-semibold text-[#2A2A2A]">{temple_info.temple_name}</td>
                        <td className="px-6 py-4 text-[#D35D38] font-bold">{temple_info.total_points}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => window.open(`/templedetailedreport/?temple_id=${temple_info.temple_id}`, '_blank')}
                            className="inline-block px-4 py-2 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-sm"
                          >
                            View Points
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => window.open(`/participantslist/?temple_id=${temple_info.temple_id}`, '_blank')}
                            className="inline-block px-4 py-2 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-sm"
                          >
                            View All Participants
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-8 text-center text-[#5A5A5A]">
                        No temple reports available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderUpdateResults = () => {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {/* Age Category Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Filter by Age Category</label>
            <select 
              className="p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
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
              className="p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
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
                  <h3 className="text-xl font-semibold text-[#D35D38] border-b-2 border-[#F8DFBE] pb-2">
                    {ageCategory} - {gender}
                  </h3>
                  <div className="space-y-4 sm:pl-4">
                    {groupEvents.map((event) => (
                      <CollapsibleEvent 
                        key={event.id} 
                        title={event.name}
                        eventId={event.id}
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
    );
  };

  // Render Teams section
  const renderTeams = () => {
    // Group team events by gender
    const groupEventsByGender = (events) => {
      const grouped = {
        MALE: [],
        FEMALE: [],
        ALL: []
      };

      if (!Array.isArray(events)) {
        return grouped;
      }

      events.forEach(event => {
        if (grouped[event.gender]) {
          grouped[event.gender].push(event);
        } else {
          grouped['ALL'].push(event); // Fallback for unknown genders
        }
      });

      return grouped;
    };

    const groupedTeamEvents = groupEventsByGender(data);

    return (
      <div className="space-y-8">
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
            <span className="ml-3 text-[#2A2A2A]">Loading team events...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Team Events by Gender */}
        {!loading && !error && (
          <>
            {/* Male Events */}
            {groupedTeamEvents.MALE.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#2A2A2A] border-b-2 border-[#D35D38] pb-2">
                  🏃‍♂️ Male Team Events
                </h2>
                <div className="space-y-4">
                  {groupedTeamEvents.MALE.map((teamEvent, index) => (
                    <div key={teamEvent.id || index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      {/* Team Event Header */}
                      <div className="bg-[#D35D38] px-6 py-4">
                        <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                        <p className="text-white/80 text-sm mt-1">
                          {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                        </p>
                      </div>
                      
                      {/* Registered Temples */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Temples</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamEvent.registered_temples.map((temple, templeIndex) => (
                              <div key={templeIndex} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0]">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-[#2A2A2A]">{temple.temple_name}</h5>
                                    <p className="text-sm text-[#5A5A5A] mt-1">
                                      {temple.team_count || 1} team{temple.team_count > 1 ? 's' : ''} registered
                                    </p>
                                    {temple.member_count && (
                                      <p className="text-xs text-[#5A5A5A] mt-1">
                                        {temple.member_count} members total
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex gap-2">
                                        <select
                                          className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                                          defaultValue={temple.result?.rank || ""}
                                          id={`team-rank-male-${temple.registration_ids?.[0] || templeIndex}`}
                                        >
                                          <option value="">Select Rank</option>
                                          <option value="FIRST">1st Place</option>
                                          <option value="SECOND">2nd Place</option>
                                          <option value="THIRD">3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-male-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(temple.registration_ids[0], select.value);
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      {temple.result?.rank && (
                                        <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                          {temple.result.rank === 'FIRST' ? '🥇 1st' :
                                           temple.result.rank === 'SECOND' ? '🥈 2nd' :
                                           temple.result.rank === 'THIRD' ? '🥉 3rd' : temple.result.rank}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-[#5A5A5A]">No temples have registered for this team event yet.</p>
                          </div>
                        )}
                        
                        {/* Event Details */}
                        <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Total Registrations:</span>
                              <span className="ml-2 text-[#D35D38] font-bold">
                                {teamEvent.registered_temples ? teamEvent.registered_temples.length : 0}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Event Type:</span>
                              <span className="ml-2 text-[#5A5A5A]">Team Event</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Status:</span>
                              <span className="ml-2 text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Female Events */}
            {groupedTeamEvents.FEMALE.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#2A2A2A] border-b-2 border-[#D35D38] pb-2">
                  🏃‍♀️ Female Team Events
                </h2>
                <div className="space-y-4">
                  {groupedTeamEvents.FEMALE.map((teamEvent, index) => (
                    <div key={teamEvent.id || index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      {/* Team Event Header */}
                      <div className="bg-[#D35D38] px-6 py-4">
                        <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                        <p className="text-white/80 text-sm mt-1">
                          {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                        </p>
                      </div>
                      
                      {/* Registered Temples */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Temples</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamEvent.registered_temples.map((temple, templeIndex) => (
                              <div key={templeIndex} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0]">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-[#2A2A2A]">{temple.temple_name}</h5>
                                    <p className="text-sm text-[#5A5A5A] mt-1">
                                      {temple.team_count || 1} team{temple.team_count > 1 ? 's' : ''} registered
                                    </p>
                                    {temple.member_count && (
                                      <p className="text-xs text-[#5A5A5A] mt-1">
                                        {temple.member_count} members total
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex gap-2">
                                        <select
                                          className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                                          defaultValue={temple.result?.rank || ""}
                                          id={`team-rank-female-${temple.registration_ids?.[0] || templeIndex}`}
                                        >
                                          <option value="">Select Rank</option>
                                          <option value="FIRST">1st Place</option>
                                          <option value="SECOND">2nd Place</option>
                                          <option value="THIRD">3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-female-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(temple.registration_ids[0], select.value);
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      {temple.result?.rank && (
                                        <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                          {temple.result.rank === 'FIRST' ? '🥇 1st' :
                                           temple.result.rank === 'SECOND' ? '🥈 2nd' :
                                           temple.result.rank === 'THIRD' ? '🥉 3rd' : temple.result.rank}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-[#5A5A5A]">No temples have registered for this team event yet.</p>
                          </div>
                        )}
                        
                        {/* Event Details */}
                        <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Total Registrations:</span>
                              <span className="ml-2 text-[#D35D38] font-bold">
                                {teamEvent.registered_temples ? teamEvent.registered_temples.length : 0}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Event Type:</span>
                              <span className="ml-2 text-[#5A5A5A]">Team Event</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Status:</span>
                              <span className="ml-2 text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mixed/All Events */}
            {groupedTeamEvents.ALL.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-[#2A2A2A] border-b-2 border-[#D35D38] pb-2">
                  🤝 Mixed Team Events
                </h2>
                <div className="space-y-4">
                  {groupedTeamEvents.ALL.map((teamEvent, index) => (
                    <div key={teamEvent.id || index} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                      {/* Team Event Header */}
                      <div className="bg-[#D35D38] px-6 py-4">
                        <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                        <p className="text-white/80 text-sm mt-1">
                          {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                        </p>
                      </div>
                      
                      {/* Registered Temples */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Temples</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {teamEvent.registered_temples.map((temple, templeIndex) => (
                              <div key={templeIndex} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0]">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h5 className="font-semibold text-[#2A2A2A]">{temple.temple_name}</h5>
                                    <p className="text-sm text-[#5A5A5A] mt-1">
                                      {temple.team_count || 1} team{temple.team_count > 1 ? 's' : ''} registered
                                    </p>
                                    {temple.member_count && (
                                      <p className="text-xs text-[#5A5A5A] mt-1">
                                        {temple.member_count} members total
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="flex flex-col gap-2">
                                      <div className="flex gap-2">
                                        <select
                                          className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                                          defaultValue={temple.result?.rank || ""}
                                          id={`team-rank-mixed-${temple.registration_ids?.[0] || templeIndex}`}
                                        >
                                          <option value="">Select Rank</option>
                                          <option value="FIRST">1st Place</option>
                                          <option value="SECOND">2nd Place</option>
                                          <option value="THIRD">3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-mixed-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(temple.registration_ids[0], select.value);
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      {temple.result?.rank && (
                                        <span className="inline-block px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                                          {temple.result.rank === 'FIRST' ? '🥇 1st' :
                                           temple.result.rank === 'SECOND' ? '🥈 2nd' :
                                           temple.result.rank === 'THIRD' ? '🥉 3rd' : temple.result.rank}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-[#5A5A5A]">No temples have registered for this team event yet.</p>
                          </div>
                        )}
                        
                        {/* Event Details */}
                        <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Total Registrations:</span>
                              <span className="ml-2 text-[#D35D38] font-bold">
                                {teamEvent.registered_temples ? teamEvent.registered_temples.length : 0}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Event Type:</span>
                              <span className="ml-2 text-[#5A5A5A]">Team Event</span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Status:</span>
                              <span className="ml-2 text-green-600 font-medium">Active</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Events State */}
            {data.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-[#5A5A5A]">No team events found.</p>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderChampions = () => {
    console.log('renderChampions - data:', data); // Debug logging
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-[#5A5A5A]">No champions data available yet.</p>
          {data && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Data structure: {JSON.stringify(data, null, 2)}</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2">🏆 Champions </h1>
          <p className="text-[#5A5A5A]">Highest Point Getters by Age Category and Gender</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((category, categoryIndex) => {
            // Defensive check for category structure
            if (!category || typeof category !== 'object') {
              console.warn('Invalid category data:', category);
              return null;
            }
            
            return (
              <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
                  <h2 className="text-xl font-bold text-white">
                    {category.age_category || 'Unknown'} - {category.gender || 'Unknown'}
                  </h2>
                  <p className="text-white/80 text-sm mt-1">
                    {category.total_participants || 0} Participants
                  </p>
                </div>

              {/* Champion Details */}
              <div className="p-6">
                {category.champions && category.champions.length > 0 ? (
                  <div className="text-center">
                    {/* Champion Badge */}
                    <div className="mb-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full mb-3">
                        <span className="text-2xl">👑</span>
                      </div>
                      <h3 className="text-lg font-bold text-[#2A2A2A] mb-1">
                        {category.champions.length === 1 ? 'Category Champion' : 'Category Champions'}
                      </h3>
                    </div>

                    {/* Champions Info */}
                    <div className="space-y-4">
                      {category.champions.map((champion, championIndex) => {
                        // Defensive check for champion structure
                        if (!champion || typeof champion !== 'object') {
                          console.warn('Invalid champion data:', champion);
                          return null;
                        }
                        
                        return (
                          <div key={championIndex} className="border border-[#F8DFBE] rounded-lg p-4 bg-gradient-to-br from-yellow-50 to-yellow-100">
                            <div>
                              <p className="text-xl font-bold text-[#D35D38]">{champion.name || 'Unknown'}</p>
                              <p className="text-sm text-[#5A5A5A]">{champion.temple || 'Unknown'}</p>
                              <p className="text-xs text-[#5A5A5A] mt-1">Aadhar: {champion.aadhar_number || 'N/A'}</p>
                            </div>
                            
                            <div className="mt-3">
                              <p className="text-2xl font-bold text-[#D35D38]">{champion.points || 0}</p>
                              <p className="text-sm text-[#5A5A5A]">Total Points</p>
                            </div>

                          {/* Champion's Events */}
                          {champion.events && Array.isArray(champion.events) && champion.events.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-yellow-200">
                              <h4 className="text-sm font-semibold text-[#2A2A2A] mb-2 text-center">Events Participated</h4>
                              <div className="space-y-2 max-h-24 overflow-y-auto">
                                {champion.events.map((event, eventIndex) => {
                                  // Defensive check for event structure
                                  if (!event || typeof event !== 'object') {
                                    console.warn('Invalid event data:', event);
                                    return null;
                                  }
                                  
                                  return (
                                    <div key={eventIndex} className="flex justify-between items-center text-xs bg-white rounded px-2 py-1">
                                      <span className="text-[#5A5A5A] truncate">{event.event_name || 'Unknown Event'}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className={`px-1 py-0.5 rounded text-xs font-medium ${
                                          event.rank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                                          event.rank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                                          event.rank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {event.rank === 'FIRST' ? '🥇' : event.rank === 'SECOND' ? '🥈' : event.rank === 'THIRD' ? '🥉' : 'N/A'}
                                        </span>
                                        <span className="font-medium text-[#D35D38]">{event.points || 0}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}

                      {/* Category Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F8DFBE]">
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#2A2A2A]">{category.total_participants}</p>
                          <p className="text-xs text-[#5A5A5A]">Participants</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold text-[#2A2A2A]">{category.total_points_in_category}</p>
                          <p className="text-xs text-[#5A5A5A]">Total Points</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-[#5A5A5A]">No participants in this category yet</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>

        {/* Summary Stats */}
        {data.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-center">🏆 Overall Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">{data.length}</p>
                <p className="text-sm text-[#5A5A5A]">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.reduce((sum, category) => sum + (category.total_participants || 0), 0)}
                </p>
                <p className="text-sm text-[#5A5A5A]">Total Participants</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.reduce((sum, category) => sum + (category.champions?.length || 0), 0)}
                </p>
                <p className="text-sm text-[#5A5A5A]">Total Champions</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.reduce((sum, category) => sum + (category.total_points_in_category || 0), 0)}
                </p>
                <p className="text-sm text-[#5A5A5A]">Total Points Awarded</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAllResults = () => {
    console.log('renderAllResults - data:', data); // Debug logging
    console.log('renderAllResults - loading:', loading);
    console.log('renderAllResults - error:', error);
    
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
        </div>
      );
    }

    if (error) {
      console.log('renderAllResults - Showing error:', error);
      return (
        <div className="space-y-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
          <button 
            onClick={fetchAllResults}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry Fetch
          </button>
        </div>
      );
    }

    if (!data || typeof data !== 'object' || (!data.individual && !data.team)) {
      console.log('renderAllResults - No data or invalid structure:', data); // Debug logging
      const token = localStorage.getItem('token');
      return (
        <div className="text-center py-8">
          <p className="text-[#5A5A5A]">No results data available yet.</p>
          <button 
            onClick={fetchAllResults}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          >
            Load Data
          </button>
          
          {/* Debug Information */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg text-left">
            <h4 className="font-bold mb-2">Debug Information:</h4>
            <p><strong>Token exists:</strong> {token ? 'Yes' : 'No'}</p>
            <p><strong>Active tab:</strong> {activeTab}</p>
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Error:</strong> {error || 'None'}</p>
            <p><strong>Data type:</strong> {typeof data}</p>
            <p><strong>Data keys:</strong> {data ? Object.keys(data).join(', ') : 'No data'}</p>
          </div>
          
          {data && (
            <div className="mt-4 text-sm text-gray-500">
              <p>Data structure: {JSON.stringify(data, null, 2)}</p>
            </div>
          )}
        </div>
      );
    }

    // Helper function to render winners list
    const renderWinnersList = (winners, isIndividual = true) => {
      if (!winners || winners.length === 0) {
        return <p className="text-center text-[#5A5A5A] text-sm">No winner yet</p>;
      }

      return (
        <div className="space-y-2">
          {winners.map((winner, index) => (
            <div key={winner.aadhar || index} className="text-center border-b border-gray-100 pb-2 last:border-b-0">
              {isIndividual ? (
                <>
                  <p className="font-medium text-[#D35D38]">{winner.name}</p>
                  <p className="text-sm text-[#5A5A5A]">{winner.temple}</p>
                  {winner.aadhar && (
                    <p className="text-xs text-[#5A5A5A] mt-1">Aadhar: {winner.aadhar}</p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium text-[#D35D38]">{winner.temple}</p>
                  <p className="text-xs text-[#5A5A5A] mt-1">{winner.points} points</p>
                </>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2">🏆 Complete Results</h1>
          <p className="text-[#5A5A5A]">All winners from individual and team events</p>
        </div>

        {/* Individual Events Results */}
        {data.individual && data.individual.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#2A2A2A] border-b-2 border-[#D35D38] pb-2">
              🏃 Individual Events
            </h2>
            
            {data.individual.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">
                    {category.age_category} - {category.gender}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    {category.events.length} Events • Individual Results
                  </p>
                </div>

                {/* Events List */}
                <div className="p-6">
                  <div className="space-y-6">
                    {category.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="border border-[#F8DFBE] rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4 border-b border-[#F8DFBE] pb-2">
                          {event.event_name}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* First Place */}
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥇</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              1st Place {Array.isArray(event.first) && event.first.length > 1 && `(${event.first.length} winners)`}
                            </h5>
                            {renderWinnersList(event.first, true)}
                          </div>

                          {/* Second Place */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥈</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              2nd Place {Array.isArray(event.second) && event.second.length > 1 && `(${event.second.length} winners)`}
                            </h5>
                            {renderWinnersList(event.second, true)}
                          </div>

                          {/* Third Place */}
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥉</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              3rd Place {Array.isArray(event.third) && event.third.length > 1 && `(${event.third.length} winners)`}
                            </h5>
                            {renderWinnersList(event.third, true)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Team Events Results */}
        {data.team && data.team.length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#2A2A2A] border-b-2 border-[#D35D38] pb-2">
              🤝 Team Events ({data.team.length} categories)
            </h2>
            
            {data.team.map((category, categoryIndex) => (
              <div key={categoryIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
                  <h3 className="text-xl font-bold text-white">
                    {category.age_category} - {category.gender}
                  </h3>
                  <p className="text-white/80 text-sm mt-1">
                    {category.events.length} Events • Team Results
                  </p>
                </div>

                {/* Events List */}
                <div className="p-6">
                  <div className="space-y-6">
                    {category.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="border border-[#F8DFBE] rounded-xl p-4">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4 border-b border-[#F8DFBE] pb-2">
                          {event.event_name}
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* First Place */}
                          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥇</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              1st Place {Array.isArray(event.first) && event.first.length > 1 && `(${event.first.length} winners)`}
                            </h5>
                            {renderWinnersList(event.first, false)}
                          </div>

                          {/* Second Place */}
                          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥈</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              2nd Place {Array.isArray(event.second) && event.second.length > 1 && `(${event.second.length} winners)`}
                            </h5>
                            {renderWinnersList(event.second, false)}
                          </div>

                          {/* Third Place */}
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center justify-center mb-2">
                              <span className="text-2xl">🥉</span>
                            </div>
                            <h5 className="text-center font-semibold text-[#2A2A2A] mb-2">
                              3rd Place {Array.isArray(event.third) && event.third.length > 1 && `(${event.third.length} winners)`}
                            </h5>
                            {renderWinnersList(event.third, false)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-[#5A5A5A]">No team events with results available yet.</p>
            {data.team && (
              <p className="text-sm text-gray-500 mt-2">Team data: {JSON.stringify(data.team)}</p>
            )}
          </div>
        )}

        {/* Summary Stats */}
        {data.individual && data.team && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
            <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-center">📊 Results Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.individual.reduce((sum, category) => sum + category.events.length, 0)}
                </p>
                <p className="text-sm text-[#5A5A5A]">Individual Events</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.team.reduce((sum, category) => sum + category.events.length, 0)}
                </p>
                <p className="text-sm text-[#5A5A5A]">Team Events</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {data.individual.length + data.team.length}
                </p>
                <p className="text-sm text-[#5A5A5A]">Categories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {(data.individual.reduce((sum, category) => sum + category.events.length, 0) + 
                    data.team.reduce((sum, category) => sum + category.events.length, 0)) * 3}
                </p>
                <p className="text-sm text-[#5A5A5A]">Total Winners</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    const fields = {
      users: ['first_name', 'last_name', 'email', 'phone', 'gender', 'dob', 'aadhar_number'],
      registrations: ['user_id', 'event_id', 'status'],
      teams: ['temple_id', 'event_id', 'member_user_ids', 'status'],
      results: ['event_type_id', 'rank', 'points']
    };

    const currentFields = fields[activeTab] || [];

    return (
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4 text-[#2A2A2A]">
          {isEditing ? 'Edit' : 'Add'} {activeTab.replace('-', ' ').slice(0, -1)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentFields.map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-[#2A2A2A] mb-1">
                {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <input
                type={field.includes('dob') ? 'date' : 'text'}
                value={formData[field] || ''}
                onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                className="w-full p-2 border border-[#F8DFBE] rounded focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
                required
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-[#D35D38] text-white rounded hover:bg-[#B84A2E] disabled:opacity-50"
          >
            {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormData({});
                setIsEditing(false);
                setEditingId(null);
              }}
              className="px-4 py-2 bg-[#5A5A5A] text-white rounded hover:bg-[#2A2A2A]"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    );
  };

  const renderTable = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      );
    }

    if (error) {
        return null;
    //   return (
    //     <div className="text-center py-8">
    //       <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
    //         <p className="font-bold">Demo Admin Panel</p>
    //         <p>{error}</p>
    //         <p className="text-sm mt-2">
    //           This is a demonstration admin interface. The backend APIs for admin operations are not implemented yet.
    //         </p>
    //       </div>
    //     </div>
    //   );
    }

    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No data available</p>
        </div>
      );
    }

    const columns = Object.keys(data[0] || {}).filter(key => 
      !['created_at', 'updated_at', 'is_deleted'].includes(key)
    );

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#F8DFBE]">
            <thead className="bg-[#F8DFBE]">
              <tr>
                {columns.map(column => (
                  <th
                    key={column}
                    className="px-6 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider"
                  >
                    {column.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </th>
                ))}
                <th className="px-6 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F8DFBE]">
              {data.map((item, index) => (
                <tr key={item.id || index} className="hover:bg-[#F8DFBE]">
                  {columns.map(column => (
                    <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-[#2A2A2A]">
                      {typeof item[column] === 'boolean' 
                        ? (item[column] ? 'Yes' : 'No')
                        : item[column]?.toString() || '-'
                      }
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(item)}
                      className="text-[#D35D38] hover:text-[#B84A2E] mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2A2A2A] mb-2">Sports Event Staff Panel</h1>
          <p className="text-[#5A5A5A]">Manage your sports event data</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#D35D38] text-[#D35D38]'
                    : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-[#D35D38]'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Render different content based on active tab */}
        {activeTab === 'temples' ? (
          renderTempleReports()
        ) : activeTab === 'update-results' ? (
          renderUpdateResults()
        ) : activeTab === 'teams' ? (
          renderTeams()
        ) : activeTab === 'champions' ? (
          renderChampions()
        ) : activeTab === 'all-result' ? (
          renderAllResults()
        ) : activeTab === 'results' ? (
          <>
            {/* Form */}
            {renderForm()}

            {/* Table */}
            {renderTable()}
          </>
        ) : (
          <>
            {/* Form */}
            {renderForm()}

            {/* Table */}
            {renderTable()}
          </>
        )}
      </div>
    </div>
  );
};

export default StaffPanel; 