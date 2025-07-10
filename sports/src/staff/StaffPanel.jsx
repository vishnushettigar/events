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
          <div className="bg-white rounded-lg sm:rounded-2xl shadow-lg sm:shadow-xl overflow-hidden">
            {/* Mobile Cards View */}
            <div className="block lg:hidden">
              {templeReports.length > 0 ? (
                <div className="space-y-4 p-4">
                  {templeReports.map((temple_info, idx) => (
                    <div key={temple_info.temple_id} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0]">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-[#5A5A5A]">#{idx + 1}</span>
                            <h3 className="font-semibold text-[#2A2A2A] text-lg">{temple_info.temple_name}</h3>
                          </div>
                          <p className="text-[#D35D38] font-bold text-xl">{temple_info.total_points} Points</p>
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => window.open(`/templedetailedreport/?temple_id=${temple_info.temple_id}`, '_blank')}
                          className="w-full px-3 py-2 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-sm"
                        >
                          View Points
                        </button>
                        <button
                          onClick={() => window.open(`/participantslist/?temple_id=${temple_info.temple_id}`, '_blank')}
                          className="w-full px-3 py-2 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-sm"
                        >
                          View All Participants
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-[#5A5A5A]">
                  No temple reports available
                </div>
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
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
          </div>
        )}
      </div>
    );
  };

  const renderUpdateResults = () => {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Age Category Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Age Category</label>
            <select 
              className="p-2 sm:p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white text-sm sm:text-base"
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
            <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Gender</label>
            <select 
              className="p-2 sm:p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white text-sm sm:text-base"
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
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
          <span className="ml-2 text-[#2A2A2A]">Loading champions...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      );
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-[#5A5A5A]">No champions data available yet.</p>
        </div>
      );
    }

    // Flatten champions data for table display
    const allChampions = [];
    data.forEach((category, categoryIndex) => {
      if (category.champions && Array.isArray(category.champions)) {
        category.champions.forEach((champion, championIndex) => {
          allChampions.push({
            rank: championIndex + 1,
            category: `${category.age_category} - ${category.gender}`,
            name: champion.name,
            temple: champion.temple,
            aadhar_number: champion.aadhar_number,
            points: champion.points,
            events_count: champion.events ? champion.events.length : 0,
            events: champion.events || []
          });
        });
      }
    });

    // Sort by points (highest first)
    allChampions.sort((a, b) => b.points - a.points);

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2A2A2A]">🏆 Champions</h1>
          <p className="text-[#5A5A5A] mt-1">Top performers from all categories</p>
        </div>

        {/* Champions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-[#F8DFBE] border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-[#2A2A2A]">🏆 Champions Leaderboard</h3>
            <p className="text-xs sm:text-sm text-[#5A5A5A] mt-1">{allChampions.length} champions ranked by total points</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Champion
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Temple
                  </th>
                  <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Aadhar Number
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Total Points
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Events Won
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allChampions.map((champion, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                          index === 0 ? 'bg-yellow-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' :
                          'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                      {champion.category}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-[#2A2A2A]">
                        {champion.name}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                      {champion.temple}
                    </td>
                    <td className="hidden md:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                      {champion.aadhar_number}
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <span className="text-sm sm:text-lg font-bold text-[#D35D38]">
                        {champion.points}
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                      {champion.events_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {allChampions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">{allChampions.length}</p>
                <p className="text-xs text-[#5A5A5A]">Total Champions</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">
                  {allChampions.reduce((sum, champ) => sum + champ.points, 0)}
                </p>
                <p className="text-xs text-[#5A5A5A]">Total Points</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">
                  {allChampions.reduce((sum, champ) => sum + champ.events_count, 0)}
                </p>
                <p className="text-xs text-[#5A5A5A]">Events Won</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">
                  {allChampions.length > 0 ? Math.round(allChampions.reduce((sum, champ) => sum + champ.points, 0) / allChampions.length) : 0}
                </p>
                <p className="text-xs text-[#5A5A5A]">Avg Points</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderAllResults = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
          <span className="ml-2 text-[#2A2A2A]">Loading results...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {error}
        </div>
      );
    }

    if (!data || typeof data !== 'object' || (!data.individual && !data.team)) {
      return (
        <div className="text-center py-8">
          <p className="text-[#5A5A5A]">No results data available yet.</p>
        </div>
      );
    }

    // Helper function to get winner display text
    const getWinnerText = (winners, isIndividual = true) => {
      if (!winners || winners.length === 0) return 'No winner';
      
      if (isIndividual) {
        return winners.map(winner => `${winner.name} (${winner.temple})`).join(', ');
      } else {
        return winners.map(winner => `${winner.temple} (${winner.points} pts)`).join(', ');
      }
    };

    // Collect individual and team results separately
    const individualResults = [];
    const teamResults = [];

    // Process individual events
    if (data.individual) {
      data.individual.forEach(category => {
        category.events.forEach(event => {
          individualResults.push({
            category: `${category.age_category} - ${category.gender}`,
            eventName: event.event_name,
            firstPlace: getWinnerText(event.first, true),
            secondPlace: getWinnerText(event.second, true),
            thirdPlace: getWinnerText(event.third, true)
          });
        });
      });
    }

    // Process team events
    if (data.team) {
      data.team.forEach(category => {
        category.events.forEach(event => {
          teamResults.push({
            category: `${category.age_category} - ${category.gender}`,
            eventName: event.event_name,
            firstPlace: getWinnerText(event.first, false),
            secondPlace: getWinnerText(event.second, false),
            thirdPlace: getWinnerText(event.third, false)
          });
        });
      });
    }

    // Helper function to render results table
    const renderResultsTable = (results, title, type) => {
      if (results.length === 0) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4">{title}</h3>
            <p className="text-[#5A5A5A] text-center py-4">No {type.toLowerCase()} results available</p>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-[#F8DFBE] border-b border-gray-200">
            <h3 className="text-lg font-semibold text-[#2A2A2A]">{title}</h3>
            <p className="text-sm text-[#5A5A5A] mt-1">{results.length} events with results</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    1st Place
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    2nd Place
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    3rd Place
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#2A2A2A]">
                      {result.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#2A2A2A]">
                      {result.eventName}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5A5A5A]">
                      {result.firstPlace}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5A5A5A]">
                      {result.secondPlace}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5A5A5A]">
                      {result.thirdPlace}
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
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2A2A2A]">All Results</h1>
          <p className="text-[#5A5A5A] mt-1">Complete list of winners from all events</p>
        </div>

        {/* Individual Events Results */}
        {renderResultsTable(individualResults, "🏃 Individual Events", "Individual")}

        {/* Team Events Results */}
        {renderResultsTable(teamResults, "🤝 Team Events", "Team")}

        {/* Summary */}
        {(individualResults.length > 0 || teamResults.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">{individualResults.length + teamResults.length}</p>
                <p className="text-xs text-[#5A5A5A]">Total Events</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">{individualResults.length}</p>
                <p className="text-xs text-[#5A5A5A]">Individual Events</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">{teamResults.length}</p>
                <p className="text-xs text-[#5A5A5A]">Team Events</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-[#D35D38]">{(individualResults.length + teamResults.length) * 3}</p>
                <p className="text-xs text-[#5A5A5A]">Total Winners</p>
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
    <div className="min-h-screen bg-[#F0F0F0] p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2A2A2A] mb-2">Sports Event Staff Panel</h1>
          <p className="text-sm sm:text-base text-[#5A5A5A]">Manage your sports event data</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          {/* Mobile Tabs - Dropdown */}
          <div className="lg:hidden">
            <div className="relative">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="w-full p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white text-[#2A2A2A] font-medium"
              >
                {tabs.map(tab => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Desktop Tabs - Horizontal */}
          <nav className="hidden lg:flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[#D35D38] text-[#D35D38]'
                    : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-[#D35D38]'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>

          {/* Tablet Tabs - Scrollable */}
          <div className="hidden md:block lg:hidden">
            <div className="overflow-x-auto">
              <nav className="flex space-x-6 min-w-max">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
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
          </div>
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