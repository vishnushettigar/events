import React, { useState, useEffect } from 'react';
import { userAPI, eventAPI, reportAPI } from '../utils/api';
import authManager from '../utils/authManager';

const StaffPanel = () => {
  const [activeTab, setActiveTab] = useState('update-results');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success', 'error', 'info', 'confirm'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalDetails, setModalDetails] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null); // Store pending update data

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

  // For Champions section - Top Temples
  const [topTemples, setTopTemples] = useState([]);
  const [loadingTopTemples, setLoadingTopTemples] = useState(false);
  const [topTemplesError, setTopTemplesError] = useState(null);

  // For Schedule section
  const [scheduleData, setScheduleData] = useState({ individual: [], team: [] });
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [scheduleError, setScheduleError] = useState(null);

  // For collapsible event states
  const [collapsibleStates, setCollapsibleStates] = useState({});
  
  // For event participants data
  const [eventParticipantsData, setEventParticipantsData] = useState({});
  const [loadingParticipants, setLoadingParticipants] = useState({});
  const [participantErrors, setParticipantErrors] = useState({});
  
  // For tracking rank changes
  const [rankChanges, setRankChanges] = useState({});

  // Helper functions for collapsible state management
  const getCollapsibleState = (eventId) => {
    return collapsibleStates[eventId] || false;
  };

  const setCollapsibleState = (eventId, isOpen) => {
    setCollapsibleStates(prev => ({
      ...prev,
      [eventId]: isOpen
    }));
  };

  // Helper functions for participants data management
  const getEventParticipants = (eventId) => {
    return eventParticipantsData[eventId] || [];
  };

  const setEventParticipants = (eventId, participants) => {
    setEventParticipantsData(prev => ({
      ...prev,
      [eventId]: participants
    }));
  };

  const getLoadingParticipants = (eventId) => {
    return loadingParticipants[eventId] || false;
  };

  const setLoadingParticipantsState = (eventId, loading) => {
    setLoadingParticipants(prev => ({
      ...prev,
      [eventId]: loading
    }));
  };

  const getParticipantError = (eventId) => {
    return participantErrors[eventId] || null;
  };

  const setParticipantError = (eventId, error) => {
    setParticipantErrors(prev => ({
      ...prev,
      [eventId]: error
    }));
  };

  // Helper functions for rank changes management
  const getRankChanges = (eventId) => {
    return rankChanges[eventId] || {};
  };

  const setRankChange = (eventId, participantId, rank) => {
    setRankChanges(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [participantId]: rank
      }
    }));
  };

  const clearRankChanges = (eventId) => {
    setRankChanges(prev => ({
      ...prev,
      [eventId]: {}
    }));
  };

  // Handle bulk result updates
  const handleBulkResultUpdate = async (eventId, eventName, ageCategory) => {
    const changes = getRankChanges(eventId);
    const changeEntries = Object.entries(changes);
    
    if (changeEntries.length === 0) {
      showInfoModal('No Changes', 'No rank changes to update.');
      return;
    }

    try {
      // Show confirmation modal with all changes
      const changesList = changeEntries.map(([participantId, rank]) => {
        const participant = getEventParticipants(eventId).find(p => p.id === participantId);
        return {
          name: participant?.participant_name || participant?.team_name || 'Unknown',
          temple: participant?.temple_name || 'Unknown',
          rank: rank
        };
      });

      showConfirmModal(
        'Confirm Result Update',
        `Are you sure you want to update ${changeEntries.length} participant(s)?`,
        {
          changes: changesList,
          count: changeEntries.length
        },
        {
          eventId,
          eventName,
          ageCategory,
          changes: changes
        }
      );
    } catch (error) {
      console.error('Error preparing bulk update:', error);
      showErrorModal('Error', 'Failed to prepare bulk update.');
    }
  };

  // Execute bulk result updates
  const executeBulkResultUpdate = async () => {
    if (!pendingUpdate || !pendingUpdate.eventId) return;

    const { eventId, eventName, ageCategory, changes } = pendingUpdate;
    const changeEntries = Object.entries(changes);
    
    try {
      // Update each participant
      for (const [participantId, rank] of changeEntries) {
        await eventAPI.updateIndividualResult(participantId, rank);
      }

      // Clear the rank changes
      clearRankChanges(eventId);
      
      // Refresh the participants data
      const updatedData = await eventAPI.getEventParticipants(eventId);
      setEventParticipants(eventId, updatedData);
      
      // Close the confirmation modal and show success modal
      closeModal();
      
      // Use setTimeout to ensure the confirmation modal closes before showing success
      setTimeout(() => {
        showSuccessModal(
          'Result Update Successful',
          `Successfully updated ${changeEntries.length} participant(s).`,
          {
            'Age Category': ageCategory,
            'Event Name': eventName
          }
        );
      }, 100);
      
      console.log('Bulk result update successful');
    } catch (error) {
      console.error('Error updating bulk results:', error);
      showErrorModal(
        'Bulk Update Failed',
        'Failed to update some or all participants.',
        {
          count: changeEntries.length,
          error: error.message
        }
      );
    }
  };

  const tabs = [
    { id: 'update-results', name: 'Individual', endpoint: '/api/events/participant-data' },
    { id: 'teams', name: 'Teams', endpoint: '/api/events/team-events' },
    { id: 'champions', name: 'Champions', endpoint: '/api/users/champions' },
    { id: 'all-result', name: 'All Results', endpoint: '/api/users/all-results' },
    { id: 'schedule', name: 'Schedule', endpoint: '/api/events/schedule' },
    { id: 'temples', name: 'Temple Reports', endpoint: '/api/admin/temples' }
  ];

  // Fetch temple reports from backend
  const fetchTempleReports = async () => {
    try {
      setLoadingTemples(true);
      setTempleError(null);

      const temples = await userAPI.getAllTemples();
      
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

  // Fetch top temples for champions section
  const fetchTopTemples = async () => {
    try {
      setLoadingTopTemples(true);
      setTopTemplesError(null);

      const temples = await userAPI.getAllTemples();
      
      // Transform and sort temples by points
      const topTemplesData = temples
        .map((temple) => ({
          temple_id: temple.id,
          temple_name: temple.name,
          total_points: temple.total_points || 0
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 5); // Get top 5 temples
      
      setTopTemples(topTemplesData);
    } catch (err) {
      console.error('Error fetching top temples:', err);
      setTopTemplesError(err.message);
      setTopTemples([]);
    } finally {
      setLoadingTopTemples(false);
    }
  };

  // Fetch schedule data
  const fetchScheduleData = async () => {
    try {
      setLoadingSchedule(true);
      setScheduleError(null);

      // Fetch all events from the new comprehensive endpoint
      const response = await eventAPI.getAllEventsComplete();
      
      setScheduleData({
        individual: response.individual || [],
        team: response.team || []
      });
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setScheduleError(err.message);
      setScheduleData({ individual: [], team: [] });
    } finally {
      setLoadingSchedule(false);
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
      fetchTopTemples();
    } else if (activeTab === 'all-result') {
      fetchAllResults();
    } else if (activeTab === 'schedule') {
      fetchScheduleData();
    } else if (activeTab === 'results') {
      fetchResults();
    } else {
    fetchData();
    }
  }, [activeTab, selectedAge, selectedGender]);

  // Listen for global logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      console.log('StaffPanel: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);

  // Fetch data for Update Results section
  const fetchUpdateResultsData = async () => {
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

  // Fetch team events data
  const fetchTeamEvents = async () => {
    try {
    setLoading(true);
    setError(null);
      const data = await eventAPI.getTeamEvents();
      setData(data);
    } catch (err) {
      console.error('Error fetching team events:', err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch team participant details for printing
  const fetchTeamParticipants = async (registrationIds) => {
    try {
      const participants = [];
      for (const registrationId of registrationIds) {
        const teamData = await eventAPI.getTeamParticipants(registrationId);
        participants.push(...teamData);
      }
      return participants;
    } catch (error) {
      console.error('Error fetching team participants:', error);
      return [];
    }
  };

  // Print team participants
  const printTeamParticipants = async (temple, eventName, registrationIds) => {
    try {
      const participants = await fetchTeamParticipants(registrationIds);
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Team Participants - ${eventName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #D35D38;
              padding-bottom: 20px;
            }
            .header h1 {
              color: #D35D38;
              margin: 0;
              font-size: 24px;
            }
            .header h2 {
              color: #666;
              margin: 10px 0 0 0;
              font-size: 18px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 12px;
              text-align: left;
            }
            th {
              background-color: #D35D38;
              color: white;
              font-weight: bold;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .temple-name {
              font-weight: bold;
              color: #D35D38;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${eventName}</h1>
            <h2>Team: <span class="temple-name">${temple.temple_name}</span></h2>
            <p>Total Members: ${participants.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SL.NO</th>
                <th>MEMBER NAME</th>
                <th>AADHAAR NUMBER</th>
                <th>PHONE</th>
                <th>EMAIL</th>
              </tr>
            </thead>
            <tbody>
              ${participants.map((participant, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${participant.first_name} ${participant.last_name || ''}</td>
                  <td>${participant.aadhar_number || 'N/A'}</td>
                  <td>${participant.phone || 'N/A'}</td>
                  <td>${participant.email || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      const printWindow = window.open('', '_blank');
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    } catch (error) {
      console.error('Error printing team participants:', error);
      alert('Error loading team participant details for printing');
    }
  };

  // Fetch champions data
  const fetchChampions = async () => {
    try {
    setLoading(true);
      setError(null);
      const data = await reportAPI.getChampions();
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
      console.log('Making request to all-results endpoint...');
      const data = await reportAPI.getAllResults();
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
      const data = await eventAPI.getEventPerformance();
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

  // Modal helper functions
  const showSuccessModal = (title, message, details = null) => {
    setModalType('success');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
    
    // Auto-close success modal after 3 seconds
    setTimeout(() => {
      closeModal();
    }, 1000);
  };

  const showErrorModal = (title, message, details = null) => {
    setModalType('error');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
  };

  const showInfoModal = (title, message, details = null) => {
    setModalType('info');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setShowModal(true);
  };

  const showConfirmModal = (title, message, details = null, updateData = null) => {
    setModalType('confirm');
    setModalTitle(title);
    setModalMessage(message);
    setModalDetails(details);
    setPendingUpdate(updateData);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalTitle('');
    setModalMessage('');
    setModalDetails(null);
    setPendingUpdate(null);
  };

  // Handle individual result update confirmation
  const handleIndividualResultUpdate = (registrationId, rank, participantName, templeName, eventName, aadharNumber) => {
    console.log('handleIndividualResultUpdate called with:', { registrationId, rank, participantName, templeName, eventName, aadharNumber });
    showConfirmModal(
      'Confirm Result Update',
      'Are you sure you want to update this participant\'s result?',
      {
        name: participantName,
        temple: templeName,
        event: eventName,
        aadhar: aadharNumber,
        rank: rank
      },
      {
        registrationId,
        rank,
        participantName,
        templeName,
        eventName,
        aadharNumber
      }
    );
  };

  // Execute the actual update after confirmation
  const executeIndividualResultUpdate = async () => {
    console.log('executeIndividualResultUpdate called with pendingUpdate:', pendingUpdate);
    if (!pendingUpdate) {
      console.log('No pending update found, returning');
      return;
    }

    try {
      console.log('Calling API with:', pendingUpdate.registrationId, pendingUpdate.rank);
      await eventAPI.updateIndividualResult(pendingUpdate.registrationId, pendingUpdate.rank);
      
      // Close the confirmation modal
      closeModal();
      
      // Refresh the participants data for the current event
      // We need to find which event this participant belongs to
      const eventId = Object.keys(eventParticipantsData).find(id => 
        eventParticipantsData[id].some(p => p.id === pendingUpdate.registrationId)
      );
      
      if (eventId) {
        console.log('Refreshing participants data for event:', eventId);
        try {
          const updatedData = await eventAPI.getEventParticipants(eventId);
          setEventParticipants(eventId, updatedData);
          console.log('Participants data refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing participants data:', refreshError);
        }
      }
      
      console.log('Result updated successfully');
    } catch (error) {
      console.error('Error updating individual result:', error);
      showErrorModal(
        'Update Failed',
        'Failed to update the participant result.',
        {
          name: pendingUpdate.participantName,
          temple: pendingUpdate.templeName,
          event: pendingUpdate.eventName,
          aadhar: pendingUpdate.aadharNumber,
          rank: pendingUpdate.rank,
          error: error.message
        }
      );
    }
  };

  // Handle team result update confirmation
  const handleTeamResultUpdate = (registrationId, rank, templeName, eventName) => {
    showConfirmModal(
      'Confirm Team Result Update',
      'Are you sure you want to update this team\'s result?',
      {
        team: `${templeName} Team`,
        temple: templeName,
        event: eventName,
        rank: rank
      },
      {
        registrationId,
        rank,
        templeName,
        eventName
      }
    );
  };

  // Execute the actual team update after confirmation
  const executeTeamResultUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      await eventAPI.updateTeamResult(pendingUpdate.registrationId, pendingUpdate.rank);
      // Close the confirmation modal
      closeModal();
      // Refresh the data
      await fetchTeamEvents();
      // Don't show success modal - just close the confirmation modal
      console.log('Team result updated successfully');
    } catch (error) {
      console.error('Error updating team result:', error);
      showErrorModal(
        'Update Failed',
        'Failed to update the team result.',
        {
          team: `${pendingUpdate.templeName} Team`,
          temple: pendingUpdate.templeName,
          event: pendingUpdate.eventName,
          rank: pendingUpdate.rank,
          error: error.message,
          timestamp: new Date().toLocaleString()
        }
      );
    }
  };

  // Collapsible component for events
  const CollapsibleEvent = ({ 
    title, 
    eventId, 
    ageCategory, 
    gender, 
    isOpen, 
    setIsOpen,
    getEventParticipants,
    setEventParticipants,
    getLoadingParticipants,
    setLoadingParticipantsState,
    getParticipantError,
    setParticipantError,
    getRankChanges,
    setRankChange,
    clearRankChanges,
    handleBulkResultUpdate
  }) => {
    // Use parent-managed state
    const eventParticipants = getEventParticipants(eventId);
    const loadingParticipants = getLoadingParticipants(eventId);
    const participantError = getParticipantError(eventId);
    const [trialMeasurements, setTrialMeasurements] = useState({});
    const [heats, setHeats] = useState({});
    const [selectedHeat, setSelectedHeat] = useState(null);
    const [timings, setTimings] = useState({});
    const [showFinalHeat, setShowFinalHeat] = useState(false);
    const [finalHeatParticipants, setFinalHeatParticipants] = useState([]);
    const [loadingHeats, setLoadingHeats] = useState(false);
    const [savingTimings, setSavingTimings] = useState(false);

    // Check if this event requires trial measurements
    const isTrialEvent = () => {
      const eventName = title.toLowerCase();
      return eventName.includes('long-jump') || eventName.includes('shot put') || eventName.includes('long jump');
    };

    // Check if this event requires heats (running events)
    const isHeatEvent = () => {
      const eventName = title.toLowerCase();
      const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
      console.log(`Event: "${title}" -> EventName: "${eventName}" -> IsHeatEvent: ${isHeat}`);
      return isHeat;
    };

    // Handle trial measurement input
    const handleTrialInput = (participantId, trialNumber, value) => {
      setTrialMeasurements(prev => ({
        ...prev,
        [`${participantId}_${trialNumber}`]: value
      }));
    };

    // Handle timing input
    const handleTimingInput = (participantId, value) => {
      console.log('Timing input:', participantId, value);
      setTimings(prev => {
        const newTimings = {
          ...prev,
          [participantId]: value
        };
        console.log('Updated timings:', newTimings);
        return newTimings;
      });
    };

    // Save timings for current heat
    const saveHeatTimings = async () => {
      if (!selectedHeat || !heats[selectedHeat]) return;
      
      try {
        setSavingTimings(true);
        
        // Only include participants that have actual timing values (not empty)
        const timingsArray = heats[selectedHeat]
          .filter(participant => {
            const timing = timings[participant.id];
            return timing && timing.trim() !== '';
          })
          .map(participant => ({
            registration_id: participant.id,
            heat_time: timings[participant.id]
          }));
        
        console.log(`Updating timings for Heat ${selectedHeat}:`, timingsArray);
        console.log(`Only sending ${timingsArray.length} participants with timings out of ${heats[selectedHeat].length} total participants`);
        
        if (timingsArray.length === 0) {
          showInfoModal('No Timings', 'Please enter at least one timing before saving.');
          return;
        }
        
        await eventAPI.saveTimings(eventId, selectedHeat, timingsArray);
        console.log('Timings updated successfully');
        
        // Refresh heats to get updated data
        await fetchHeats();
        
        // Clear the local timings state since data is now saved
        setTimings({});
        
        showSuccessModal(
          'Timings Updated Successfully',
          `Timings for Heat ${selectedHeat} have been updated successfully!`,
          {
            heat: selectedHeat,
            participants: timingsArray.length,
            total: heats[selectedHeat]?.length || 0
          }
        );
      } catch (error) {
        console.error('Error saving timings:', error);
        showErrorModal(
          'Update Failed',
          'Failed to update timings. Please try again.',
          {
            heat: selectedHeat,
            error: error.message
          }
        );
      } finally {
        setSavingTimings(false);
      }
    };

    // Fetch heats from backend
    const fetchHeats = async () => {
      if (!isHeatEvent()) {
        console.log('Not a heat event, skipping heat fetch');
        return;
      }
      
      try {
        console.log(`Fetching heats for eventId: ${eventId}`);
        setLoadingHeats(true);
        const heatsData = await eventAPI.getHeats(eventId);
        console.log('Heats data received:', heatsData);
        setHeats(heatsData);
        
        // Set first heat as selected if available
        const heatNumbers = Object.keys(heatsData).map(Number).sort((a, b) => a - b);
        console.log('Heat numbers found:', heatNumbers);
        if (heatNumbers.length > 0) {
          setSelectedHeat(heatNumbers[0]);
          console.log(`Set selected heat to: ${heatNumbers[0]}`);
        } else {
          console.log('No heats found in the data');
        }
      } catch (error) {
        console.error('Error fetching heats:', error);
        console.error('Error details:', error.message);
      } finally {
        setLoadingHeats(false);
      }
    };

    // Convert timing string to seconds for comparison
    const parseTiming = (timing) => {
      if (!timing || timing === '' || timing === null || timing === undefined) {
        console.log('Invalid timing input:', timing);
        return Infinity;
      }
      
      // Clean the timing string (remove extra spaces, etc.)
      const cleanTiming = timing.toString().trim();
      
      // Handle formats like "12.34", "1:23.45", "00:12.34", "1:23:45.67"
      const parts = cleanTiming.split(':');
      
      if (parts.length === 3) {
        // Format: HH:MM:SS.ss
        const hours = parseInt(parts[0]) || 0;
        const minutes = parseInt(parts[1]) || 0;
        const seconds = parseFloat(parts[2]) || 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        console.log(`Parsed ${cleanTiming} as ${totalSeconds}s (${hours}h ${minutes}m ${seconds}s)`);
        return totalSeconds;
      } else if (parts.length === 2) {
        // Format: MM:SS.ss
        const minutes = parseInt(parts[0]) || 0;
        const seconds = parseFloat(parts[1]) || 0;
        const totalSeconds = minutes * 60 + seconds;
        console.log(`Parsed ${cleanTiming} as ${totalSeconds}s (${minutes}m ${seconds}s)`);
        return totalSeconds;
      } else {
        // Format: SS.ss
        const seconds = parseFloat(cleanTiming);
        if (isNaN(seconds)) {
          console.log(`Could not parse timing: ${cleanTiming}`);
          return Infinity;
        }
        console.log(`Parsed ${cleanTiming} as ${seconds}s`);
        return seconds;
      }
    };

    // Get all participants with timings from all heats
    const getAllParticipantsWithTimings = () => {
      console.log('Getting all participants with timings...');
      console.log('Current heats:', heats);
      console.log('Current timings state:', timings);
      
      const allParticipants = [];
      
      // Iterate through each heat
      Object.entries(heats).forEach(([heatNumber, heatParticipants]) => {
        console.log(`Processing Heat ${heatNumber} with ${heatParticipants.length} participants`);
        
        heatParticipants.forEach(participant => {
          // Priority: saved heat_time from database > current timings state
          const timing = participant.heat_time || timings[participant.id];
          const timingSeconds = parseTiming(timing);
          
          console.log(`Heat ${heatNumber} - Participant ${participant.id} (${participant.participant_name}):`, {
            heat_time: participant.heat_time,
            timings_state: timings[participant.id],
            final_timing: timing,
            timing_seconds: timingSeconds,
            temple: participant.temple_name
          });
          
          if (timing && timing !== '' && timingSeconds !== Infinity) {
            allParticipants.push({
              ...participant,
              timing: timing,
              timingSeconds: timingSeconds,
              heatNumber: parseInt(heatNumber)
            });
          }
        });
      });
      
      console.log(`Found ${allParticipants.length} participants with valid timings:`, allParticipants);
      return allParticipants;
    };

    // Generate final heat with top 8 participants
    const generateFinalHeat = () => {
      try {
        console.log('Generating final heat...');
        const participantsWithTimings = getAllParticipantsWithTimings();
        
        if (participantsWithTimings.length === 0) {
          console.log('No participants with timings found');
          return;
        }
        
        // Sort by timing (fastest first)
        const sortedParticipants = participantsWithTimings.sort((a, b) => a.timingSeconds - b.timingSeconds);
        
        console.log('=== FINAL HEAT GENERATION ===');
        console.log(`Total participants with timings: ${participantsWithTimings.length}`);
        console.log('All participants sorted by time:');
        sortedParticipants.forEach((participant, index) => {
          console.log(`${index + 1}. ${participant.participant_name} (${participant.temple_name}) - Heat ${participant.heatNumber} - ${participant.timing} (${participant.timingSeconds}s)`);
        });
        
        // Take top 8
        const top8 = sortedParticipants.slice(0, 8);
        
        console.log('\n=== TOP 8 FOR FINAL HEAT ===');
        top8.forEach((participant, index) => {
          console.log(`${index + 1}. ${participant.participant_name} (${participant.temple_name}) - Heat ${participant.heatNumber} - ${participant.timing} (${participant.timingSeconds}s)`);
        });
        
        // Show heat distribution
        const heatDistribution = {};
        top8.forEach(participant => {
          const heat = participant.heatNumber;
          heatDistribution[heat] = (heatDistribution[heat] || 0) + 1;
        });
        console.log('Heat distribution in final:', heatDistribution);
        
        setFinalHeatParticipants(top8);
        setShowFinalHeat(true);
        
        // Success - final heat generated
        const heatCounts = Object.entries(heatDistribution).map(([heat, count]) => `Heat ${heat}: ${count}`).join(', ');
        console.log(`Final heat generated successfully! Top 8 participants selected from all heats: ${heatCounts}`);
        
      } catch (error) {
        console.error('Error generating final heat:', error);
      }
    };

    // Handle final heat participant selection
    const handleFinalHeatSelection = (participantId, isSelected) => {
      if (isSelected) {
        // Add to final heat if not already there
        let participant = null;
        
        // Find participant in heats data
        Object.values(heats).forEach(heatParticipants => {
          const found = heatParticipants.find(p => p.id === participantId);
          if (found) {
            participant = found;
          }
        });
        
        // Fallback to eventParticipants if not found in heats
        if (!participant) {
          participant = eventParticipants.find(p => p.id === participantId);
        }
        
        if (participant && !finalHeatParticipants.find(p => p.id === participantId)) {
          setFinalHeatParticipants(prev => [...prev, {
            ...participant,
            timing: participant.heat_time || timings[participantId] || '',
            timingSeconds: parseTiming(participant.heat_time || timings[participantId])
          }]);
        }
      } else {
        // Remove from final heat
        setFinalHeatParticipants(prev => prev.filter(p => p.id !== participantId));
      }
    };

    // Print function for event participants
    const handlePrint = () => {
      const printWindow = window.open('', '_blank');
      let participantsToPrint = eventParticipants;
      let printTitle = title;
      
      if (isHeatEvent()) {
        if (showFinalHeat) {
          participantsToPrint = finalHeatParticipants;
          printTitle = `${title} - Final Heat`;
        } else if (selectedHeat) {
          participantsToPrint = heats[selectedHeat] || [];
          printTitle = `${title} - Heat ${selectedHeat}`;
        }
      }
      
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Event Participants - ${printTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .event-details { font-size: 16px; margin-bottom: 20px; }
            .event-details span { margin-right: 20px; }
            .heat-info { background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 15px; }
            .final-heat-info { background-color: #e8f5e8; padding: 10px; border-radius: 5px; margin-bottom: 15px; border: 2px solid #4caf50; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .result-badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; }
            .first { background-color: #fff3cd; color: #856404; }
            .second { background-color: #f8f9fa; color: #6c757d; }
            .third { background-color: #ffeaa7; color: #d63031; }
            .trial-data { font-weight: bold; color: #D35D38; }
            .timing-data { font-weight: bold; color: #D35D38; }
            .final-heat-timing { font-weight: bold; color: #4caf50; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
            <div class="event-details">
              <span><strong>Age Category:</strong> ${ageCategory}</span>
              <span><strong>Gender:</strong> ${gender}</span>
              <span><strong>Event:</strong> ${printTitle}</span>
            </div>
          </div>
          ${isHeatEvent() && showFinalHeat ? `
            <div class="final-heat-info">
              <strong>🏁 Final Heat Information:</strong><br>
              Participants: ${finalHeatParticipants.length}/8 | Top performers from all heats<br>
              Temples: ${[...new Set(finalHeatParticipants.map(p => p.temple_name))].join(', ')}
            </div>
          ` : isHeatEvent() && selectedHeat ? `
            <div class="heat-info">
              <strong>Heat ${selectedHeat} Information:</strong><br>
              Participants: ${heats[selectedHeat]?.length || 0}<br>
              Temples: ${[...new Set((heats[selectedHeat] || []).map(p => p.temple_name))].join(', ')}
            </div>
          ` : ''}
          <table>
            <thead>
              <tr>
                <th>SL.NO</th>
                <th>NAME</th>
                <th>TEMPLE</th>
                <th>AADHAR NO</th>
                ${isTrialEvent() ? `
                  <th>TRIAL 1</th>
                  <th>TRIAL 2</th>
                  <th>TRIAL 3</th>
                ` : ''}
                ${isHeatEvent() ? '<th>TIMING</th>' : ''}
                <th>RESULTS</th>
              </tr>
            </thead>
            <tbody>
              ${participantsToPrint.map((participant, index) => {
                const participantName = participant.participant_name || participant.team_name;
                const resultDisplay = participant.result?.rank 
                  ? `<span class="result-badge ${participant.result.rank.toLowerCase()}">${
                      participant.result.rank === 'FIRST' ? '🥇 1st' :
                      participant.result.rank === 'SECOND' ? '🥈 2nd' :
                      participant.result.rank === 'THIRD' ? '🥉 3rd' : participant.result.rank
                    }</span>`
                  : '';
                
                const trial1 = trialMeasurements[`${participant.id}_1`] || '';
                const trial2 = trialMeasurements[`${participant.id}_2`] || '';
                const trial3 = trialMeasurements[`${participant.id}_3`] || '';
                const timing = participant.heat_time || participant.timing || timings[participant.id] || '';
                const timingClass = showFinalHeat && finalHeatParticipants.length > 0 ? 'final-heat-timing' : 'timing-data';
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${participantName}</td>
                    <td>${participant.temple_name}</td>
                    <td>${participant.aadhar_number || 'N/A'}</td>
                    ${isTrialEvent() ? `
                      <td class="trial-data">${trial1 ? trial1 + 'm' : ''}</td>
                      <td class="trial-data">${trial2 ? trial2 + 'm' : ''}</td>
                      <td class="trial-data">${trial3 ? trial3 + 'm' : ''}</td>
                    ` : ''}
                    ${isHeatEvent() ? `<td class="${timingClass}">${timing || '-'}</td>` : ''}
                    <td>${resultDisplay}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };

    // Fetch participants when event is opened
    const fetchEventParticipants = async () => {
      if (eventParticipants.length > 0) return; // Already loaded
      
      try {
        console.log(`Fetching participants for event: ${title} (${eventId})`);
        setLoadingParticipantsState(eventId, true);
        setParticipantError(eventId, null);
        const data = await eventAPI.getEventParticipants(eventId);
        setEventParticipants(eventId, data);
        
        // Fetch heats for running events
        console.log(`Checking if event is heat event: ${isHeatEvent()}`);
        if (isHeatEvent()) {
          console.log('Event is heat event, fetching heats...');
          await fetchHeats();
        } else {
          console.log('Event is not a heat event, skipping heat fetch');
        }
    } catch (err) {
        console.error('Error fetching event participants:', err);
        setParticipantError(eventId, err.message);
    } finally {
        setLoadingParticipantsState(eventId, false);
      }
    };

    const handleToggle = () => {
      if (!isOpen) {
        fetchEventParticipants();
      }
      setIsOpen(!isOpen);
    };

    // Ensure heats are fetched when component mounts for heat events
    React.useEffect(() => {
      if (isOpen && isHeatEvent() && Object.keys(heats).length === 0 && !loadingHeats) {
        console.log('Component mounted for heat event, fetching heats...');
        fetchHeats();
      }
    }, [isOpen, eventId]);

    // Keep dropdown open after updates - don't reset state
    const handleUpdateSuccess = () => {
      // Don't close the dropdown, just refresh the data
      fetchEventParticipants();
    };

    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="flex justify-between items-center">
          <button
            className="flex-1 px-4 py-3 text-left bg-[#F8DFBE] hover:bg-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D35D38] rounded-lg flex justify-between items-center"
            onClick={handleToggle}
          >
            <span className="font-medium text-[#2A2A2A]">{title}</span>
            <span className="text-[#5A5A5A]">{isOpen ? '−' : '+'}</span>
          </button>
          {isOpen && eventParticipants.length > 0 && (
            <button
              onClick={handlePrint}
              className="ml-2 px-3 py-3 bg-[#D35D38] text-white rounded-lg hover:bg-[#B84A2E] focus:outline-none focus:ring-2 focus:ring-[#D35D38] transition"
              title="Print participants list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          )}
        </div>
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
              <div className="space-y-4">
                {/* Heat Selection for Running Events */}
                {isHeatEvent() && Object.keys(heats).length > 0 ? (
                  <div className="bg-[#F8DFBE] p-4 rounded-lg">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-[#2A2A2A]">Select Heat:</label>
                        <button
                          onClick={fetchHeats}
                          className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                          title="Refresh heats"
                        >
                          🔄 Refresh
                        </button>
                        <div className="flex gap-2 flex-wrap">
                          {Object.keys(heats).map((heatNumber) => (
                            <button
                              key={heatNumber}
                              onClick={() => {
                                setSelectedHeat(parseInt(heatNumber));
                                setShowFinalHeat(false);
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                selectedHeat === parseInt(heatNumber) && !showFinalHeat
                                  ? 'bg-[#D35D38] text-white'
                                  : 'bg-white text-[#2A2A2A] hover:bg-gray-100'
                              }`}
                            >
                              Heat {heatNumber} ({heats[heatNumber].length} participants)
                            </button>
                          ))}
                          {Object.keys(heats).length > 0 && (
                            <button
                              onClick={() => {
                                console.log('Final Heat button clicked');
                                console.log('Current heats:', heats);
                                console.log('All participants with timings:', getAllParticipantsWithTimings());
                                setShowFinalHeat(true);
                                setSelectedHeat(null);
                                if (finalHeatParticipants.length === 0) {
                                  generateFinalHeat();
                                }
                              }}
                              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                showFinalHeat
                                  ? 'bg-green-600 text-white'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              🏁 Final Heat ({finalHeatParticipants.length}/8)
                            </button>
                          )}
                        </div>
                      </div>
                      {selectedHeat && (
                        <button
                          onClick={saveHeatTimings}
                          disabled={savingTimings}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                          {savingTimings ? 'Updating...' : 'Update Timings'}
                        </button>
                      )}
                    </div>
                    {selectedHeat && (
                      <div className="text-sm text-[#5A5A5A]">
                        <strong>Heat {selectedHeat}:</strong> {heats[selectedHeat]?.length || 0} participants
                        {heats[selectedHeat]?.length > 0 && (
                          <span className="ml-2">
                            (Temples: {[...new Set(heats[selectedHeat].map(p => p.temple_name))].join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                    {showFinalHeat && (
                      <div className="text-sm text-[#5A5A5A]">
                        <strong>🏁 Final Heat:</strong> {finalHeatParticipants.length}/8 participants
                        {finalHeatParticipants.length > 0 && (
                          <span className="ml-2">
                            (Temples: {[...new Set(finalHeatParticipants.map(p => p.temple_name))].join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : isHeatEvent() && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Heats have not been generated for this event yet. Please contact the admin to generate heats.
                    </p>
                    <div className="mt-2">
                      <button
                        onClick={fetchHeats}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        🔄 Try Fetching Heats
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Debug: EventId: {eventId}, Heats: {JSON.stringify(heats)}, Loading: {loadingHeats ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}

                {/* Final Heat Management */}
                {isHeatEvent() && showFinalHeat && Object.keys(heats).length > 0 && (
                  <div className="bg-[#E8F5E8] p-4 rounded-lg border-2 border-green-300">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-[#2A2A2A]">🏁 Final Heat Management</h4>
                        <button
                          onClick={generateFinalHeat}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Auto Select Top 8
                        </button>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-[#2A2A2A] mb-2">Final Heat Participants ({finalHeatParticipants.length}/8)</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                          {finalHeatParticipants.map((participant, index) => (
                            <div key={participant.id} className="bg-green-50 p-2 rounded border flex justify-between items-center">
                              <div className="flex-1">
                                <div className="font-medium text-sm">{participant.participant_name || participant.team_name}</div>
                                <div className="text-xs text-gray-600">{participant.temple_name}</div>
                                <div className="text-xs font-bold text-green-600">{participant.timing}</div>
                                <div className="text-xs text-blue-600 font-medium">Heat {participant.heatNumber}</div>
                              </div>
                              <button
                                onClick={() => handleFinalHeatSelection(participant.id, false)}
                                className="text-red-600 hover:text-red-800 text-sm ml-2"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-[#2A2A2A] mb-2">All Participants with Timings</h5>
                        <div className="max-h-60 overflow-y-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-2 py-1 text-left">Select</th>
                                <th className="px-2 py-1 text-left">Name</th>
                                <th className="px-2 py-1 text-left">Temple</th>
                                <th className="px-2 py-1 text-left">Timing</th>
                                <th className="px-2 py-1 text-left">Heat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {getAllParticipantsWithTimings()
                                .sort((a, b) => a.timingSeconds - b.timingSeconds)
                                .map((participant, index) => {
                                  const isSelected = finalHeatParticipants.find(p => p.id === participant.id);
                                  
                                  // Find which heat this participant belongs to
                                  let heatNumber = 0;
                                  Object.entries(heats).forEach(([heatNum, heatParticipants]) => {
                                    if (heatParticipants.find(p => p.id === participant.id)) {
                                      heatNumber = parseInt(heatNum);
                                    }
                                  });
                                  
                                  return (
                                    <tr key={participant.id} className="border-b">
                                      <td className="px-2 py-1">
                                        <input
                                          type="checkbox"
                                          checked={!!isSelected}
                                          onChange={(e) => handleFinalHeatSelection(participant.id, e.target.checked)}
                                          disabled={!isSelected && finalHeatParticipants.length >= 8}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-2 py-1">{participant.participant_name || participant.team_name}</td>
                                      <td className="px-2 py-1">{participant.temple_name}</td>
                                      <td className="px-2 py-1 font-bold text-green-600">{participant.timing}</td>
                                      <td className="px-2 py-1">Heat {heatNumber}</td>
                                    </tr>
                                  );
                                })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                 {/*  trial event code start from here */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#F8DFBE] border border-[#F8DFBE]">
                    <thead className="bg-white border-b border-[#F8DFBE]">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">SL.NO</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">NAME</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TEMPLE</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">AADHAR NO</th>
                        {isHeatEvent() && (
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TIMING</th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                          <div className="flex items-center justify-between">
                            <span>RESULT</span>
                            <button
                              onClick={() => handleBulkResultUpdate(eventId, title, ageCategory)}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
                                Object.keys(getRankChanges(eventId)).length > 0
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-[#D35D38] text-white hover:bg-[#B84A2E]'
                              }`}
                              title={`Update all selected results (${Object.keys(getRankChanges(eventId)).length} pending)`}
                            >
                              Update All {Object.keys(getRankChanges(eventId)).length > 0 && `(${Object.keys(getRankChanges(eventId)).length})`}
                            </button>
                          </div>
                        </th>
                      </tr>
                    </thead>
                  <tbody className="bg-white divide-y divide-[#F8DFBE]">
                    {(isHeatEvent() && showFinalHeat ? finalHeatParticipants : 
                      isHeatEvent() && selectedHeat ? heats[selectedHeat] || [] : 
                      eventParticipants).map((participant, index) => (
                        <tr key={participant.id || index} className="hover:bg-[#F8DFBE] transition">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[#2A2A2A] border-r border-[#F8DFBE]">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#2A2A2A] border-r border-[#F8DFBE]">
                            {participant.participant_name || participant.team_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#5A5A5A] border-r border-[#F8DFBE]">
                            {participant.temple_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-[#5A5A5A] border-r border-[#F8DFBE]">
                            {participant.aadhar_number || 'N/A'}
                          </td>
                          {isHeatEvent() && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                              <input
                                type="text"
                                placeholder="00:00.00"
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                value={(() => {
                                  const localTiming = timings[participant.id];
                                  const dbTiming = participant.heat_time;
                                  const finalValue = localTiming !== undefined ? localTiming : (dbTiming || '');
                                  console.log(`Input value for ${participant.id}:`, { localTiming, dbTiming, finalValue });
                                  return finalValue;
                                })()}
                                onChange={(e) => handleTimingInput(participant.id, e.target.value)}
                              />
                            </td>
                          )}
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-3">
                              {/* Current Result Display */}
                              <div className="flex-shrink-0">
                                {participant.result?.rank ? (
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    participant.result.rank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                                    participant.result.rank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                                    participant.result.rank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                                    'bg-green-100 text-green-800'
                                  }`}>
                                    {participant.result.rank === 'FIRST' ? '🥇 1st' :
                                     participant.result.rank === 'SECOND' ? '🥈 2nd' :
                                     participant.result.rank === 'THIRD' ? '🥉 3rd' : participant.result.rank}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-xs">No result</span>
                                )}
                              </div>
                              
                              {/* Rank Selection */}
                              <div className="flex-1">
                                <select 
                                  className={`w-full px-2 py-1 border rounded text-xs ${
                                    getRankChanges(eventId)[participant.id] 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-[#F8DFBE]'
                                  }`}
                                  value={getRankChanges(eventId)[participant.id] || participant.result?.rank || ""}
                                  onChange={(e) => {
                                    const newRank = e.target.value;
                                    if (newRank) {
                                      setRankChange(eventId, participant.id, newRank);
                                    } else {
                                      // Remove from changes if cleared
                                      const currentChanges = getRankChanges(eventId);
                                      const { [participant.id]: removed, ...rest } = currentChanges;
                                      setRankChanges(prev => ({
                                        ...prev,
                                        [eventId]: rest
                                      }));
                                    }
                                  }}
                                >
                                  <option value="">Select Rank</option>
                                  <option value="FIRST">🥇 1st Place</option>
                                  <option value="SECOND">🥈 2nd Place</option>
                                  <option value="THIRD">🥉 3rd Place</option>
                                  <option value="CLEAR">Clear Result</option>
                                </select>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No participants registered for this event</p>
            )}
          </div>
        )}
      </div>
    );
  };
   
  // tabs code start from here 
 
  // Render Temple Reports
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

  // Render Update Individual Results
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
                        ageCategory={ageCategory}
                        gender={gender}
                        isOpen={getCollapsibleState(event.id)}
                        setIsOpen={(isOpen) => setCollapsibleState(event.id, isOpen)}
                        getEventParticipants={getEventParticipants}
                        setEventParticipants={setEventParticipants}
                        getLoadingParticipants={getLoadingParticipants}
                        setLoadingParticipantsState={setLoadingParticipantsState}
                        getParticipantError={getParticipantError}
                        setParticipantError={setParticipantError}
                        getRankChanges={getRankChanges}
                        setRankChange={setRankChange}
                        clearRankChanges={clearRankChanges}
                        handleBulkResultUpdate={handleBulkResultUpdate}
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
                                          <option value="FIRST">🥇 1st Place</option>
                                          <option value="SECOND">🥈 2nd Place</option>
                                          <option value="THIRD">🥉 3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-male-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(
                                                temple.registration_ids[0], 
                                                select.value, 
                                                temple.temple_name,
                                                teamEvent.event_type?.name || teamEvent.name || 'Team Event'
                                              );
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      <button 
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        onClick={() => printTeamParticipants(
                                          temple, 
                                          teamEvent.event_type?.name || teamEvent.name || 'Team Event',
                                          temple.registration_ids || []
                                        )}
                                      >
                                        🖨️ Print Team
                                      </button>
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
                                          <option value="FIRST">🥇 1st Place</option>
                                          <option value="SECOND">🥈 2nd Place</option>
                                          <option value="THIRD">🥉 3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-female-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(
                                                temple.registration_ids[0], 
                                                select.value, 
                                                temple.temple_name,
                                                teamEvent.event_type?.name || teamEvent.name || 'Team Event'
                                              );
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      <button 
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        onClick={() => printTeamParticipants(
                                          temple, 
                                          teamEvent.event_type?.name || teamEvent.name || 'Team Event',
                                          temple.registration_ids || []
                                        )}
                                      >
                                        🖨️ Print Team
                                      </button>
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
                                          <option value="FIRST">🥇 1st Place</option>
                                          <option value="SECOND">🥈 2nd Place</option>
                                          <option value="THIRD">🥉 3rd Place</option>
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                        <button 
                                          className="px-2 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                                          onClick={() => {
                                            const select = document.getElementById(`team-rank-mixed-${temple.registration_ids?.[0] || templeIndex}`);
                                            if (select.value && temple.registration_ids && temple.registration_ids.length > 0) {
                                              handleTeamResultUpdate(
                                                temple.registration_ids[0], 
                                                select.value, 
                                                temple.temple_name,
                                                teamEvent.event_type?.name || teamEvent.name || 'Team Event'
                                              );
                                            }
                                          }}
                                        >
                                          Update
                                        </button>
                                      </div>
                                      <button 
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        onClick={() => printTeamParticipants(
                                          temple, 
                                          teamEvent.event_type?.name || teamEvent.name || 'Team Event',
                                          temple.registration_ids || []
                                        )}
                                      >
                                        🖨️ Print Team
                                      </button>
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

  // Render Champions
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

        {/* Top 5 Temples Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-[#D35D38] border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-white">🏛️ Top 5 Temples</h3>
              <p className="text-xs sm:text-sm text-white/80 mt-1">Temples ranked by total points</p>
            </div>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                const printContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Top 5 Temples - Champions</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      .header { text-align: center; margin-bottom: 20px; }
                      .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                      .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; font-weight: bold; }
                      .rank-badge { padding: 4px 8px; border-radius: 50%; color: white; font-weight: bold; }
                      .rank-1 { background-color: #ffd700; }
                      .rank-2 { background-color: #c0c0c0; }
                      .rank-3 { background-color: #cd7f32; }
                      .rank-other { background-color: #6c757d; }
                      @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                      <div class="section-title">🏛️ Top 5 Temples</div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Temple Name</th>
                          <th>Total Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${topTemples.map((temple, index) => `
                          <tr>
                            <td>
                              <span class="rank-badge ${
                                index === 0 ? 'rank-1' : 
                                index === 1 ? 'rank-2' : 
                                index === 2 ? 'rank-3' : 'rank-other'
                              }">
                                ${index + 1}
                              </span>
                            </td>
                            <td>${temple.temple_name}</td>
                            <td><strong>${temple.total_points}</strong></td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </body>
                  </html>
                `;
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }}
              className="bg-white text-[#D35D38] px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              🖨️ Print
            </button>
          </div>
          
          {loadingTopTemples ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
              <span className="ml-3 text-[#2A2A2A]">Loading top temples...</span>
            </div>
          ) : topTemplesError ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {topTemplesError}</span>
            </div>
          ) : topTemples.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                      Temple Name
                    </th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                      Total Points
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topTemples.map((temple, index) => (
                    <tr key={temple.temple_id} className="hover:bg-gray-50">
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
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                        <div className="text-xs sm:text-sm font-medium text-[#2A2A2A]">
                          {temple.temple_name}
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                        <span className="text-sm sm:text-lg font-bold text-[#D35D38]">
                          {temple.total_points}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-[#5A5A5A]">
              No temple data available
            </div>
          )}
        </div>

        {/* Champions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-[#F8DFBE] border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-[#2A2A2A]">🏆 Champions Leaderboard</h3>
              <p className="text-xs sm:text-sm text-[#5A5A5A] mt-1">{allChampions.length} champions ranked by total points</p>
            </div>
            <button
              onClick={() => {
                const printWindow = window.open('', '_blank');
                const printContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>Champions Leaderboard</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      .header { text-align: center; margin-bottom: 20px; }
                      .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                      .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                      th { background-color: #f2f2f2; font-weight: bold; }
                      .rank-badge { padding: 4px 8px; border-radius: 50%; color: white; font-weight: bold; }
                      .rank-1 { background-color: #ffd700; }
                      .rank-2 { background-color: #c0c0c0; }
                      .rank-3 { background-color: #cd7f32; }
                      .rank-other { background-color: #6c757d; }
                      .result-badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                      .first { background-color: #fff3cd; color: #856404; }
                      .second { background-color: #f8f9fa; color: #6c757d; }
                      .third { background-color: #ffeaa7; color: #d63031; }
                      @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                      <div class="section-title">🏆 Champions Leaderboard</div>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Category</th>
                          <th>Name</th>
                          <th>Temple</th>
                          <th>Aadhar No</th>
                          <th>Points</th>
                          <th>Events Won</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${allChampions.map((champion, index) => `
                          <tr>
                            <td>
                              <span class="rank-badge ${
                                index === 0 ? 'rank-1' : 
                                index === 1 ? 'rank-2' : 
                                index === 2 ? 'rank-3' : 'rank-other'
                              }">
                                ${index + 1}
                              </span>
                            </td>
                            <td>${champion.category || 'N/A'}</td>
                            <td>${champion.name || 'N/A'}</td>
                            <td>${champion.temple || 'N/A'}</td>
                            <td>${champion.aadhar_number || 'N/A'}</td>
                            <td><strong>${champion.points || 0}</strong></td>
                            <td>${champion.events_count || 0}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </body>
                  </html>
                `;
                printWindow.document.write(printContent);
                printWindow.document.close();
                printWindow.focus();
                printWindow.print();
                printWindow.close();
              }}
              className="bg-[#D35D38] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B84A2A] transition-colors"
            >
              🖨️ Print
            </button>
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

  // Render Schedule
  const renderSchedule = () => {
    if (loadingSchedule) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
          <span className="ml-2 text-[#2A2A2A]">Loading schedule...</span>
        </div>
      );
    }

    if (scheduleError) {
      return (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <strong>Error:</strong> {scheduleError}
        </div>
      );
    }

    // Group individual events by age category and gender
    const groupedIndividualEvents = scheduleData.individual.reduce((acc, event) => {
      const key = `${event.age_category?.name || 'Unknown'}::${event.gender}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    // Group team events by gender
    const groupedTeamEvents = scheduleData.team.reduce((acc, event) => {
      const key = event.gender || 'ALL';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(event);
      return acc;
    }, {});

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2A2A2A]">📅 Complete Event Schedule</h1>
          <p className="text-[#5A5A5A] mt-1">All individual and team events organized by age category and gender</p>
        </div>

        {/* Individual Events Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-[#D35D38] border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-white">🏃 Individual Events ({scheduleData.individual.length})</h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1">Individual competitions by age category and gender</p>
          </div>
          
          <div className="p-4 sm:p-6">
            {Object.keys(groupedIndividualEvents).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedIndividualEvents).map(([key, events]) => {
                  const [ageCategory, gender] = key.split('::');
                  return (
                    <div key={key} className="border border-[#F8DFBE] rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-[#D35D38] mb-4 border-b border-[#F8DFBE] pb-2">
                        {ageCategory} - {gender} ({events.length} events)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {events.map((event, index) => (
                          <div key={event.id || index} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0] hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-[#2A2A2A] text-sm leading-tight">{event.name}</h5>
                              <span className="text-xs bg-[#D35D38] text-white px-2 py-1 rounded-full whitespace-nowrap">
                                Individual
                              </span>
                            </div>
                            <div className="space-y-2 text-xs text-[#5A5A5A]">
                              <div className="flex justify-between">
                                <span><strong>Age:</strong> {event.age_category?.name}</span>
                                <span><strong>Gender:</strong> {event.gender}</span>
                              </div>
                              <div className="flex justify-between">
                                <span><strong>Participants:</strong> {event.participant_count}</span>
                                <span><strong>Registered:</strong> {event.registrations_count}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span><strong>Status:</strong></span>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  event.is_closed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}>
                                  {event.is_closed ? 'Closed' : 'Open'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[#5A5A5A]">
                No individual events found
              </div>
            )}
          </div>
        </div>

        {/* Team Events Section */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 bg-[#D35D38] border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-white">🤝 Team Events ({scheduleData.team.length})</h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1">Team competitions by gender</p>
          </div>
          
          <div className="p-4 sm:p-6">
            {Object.keys(groupedTeamEvents).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedTeamEvents).map(([gender, events]) => (
                  <div key={gender} className="border border-[#F8DFBE] rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-[#D35D38] mb-4 border-b border-[#F8DFBE] pb-2">
                      {gender} Team Events ({events.length} events)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {events.map((event, index) => (
                        <div key={event.id || index} className="bg-[#F8DFBE] rounded-lg p-4 border border-[#E0E0E0] hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold text-[#2A2A2A] text-sm leading-tight">
                              {event.name}
                            </h5>
                            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full whitespace-nowrap">
                              Team
                            </span>
                          </div>
                          <div className="space-y-2 text-xs text-[#5A5A5A]">
                            <div className="flex justify-between">
                              <span><strong>Age:</strong> {event.age_category?.name}</span>
                              <span><strong>Gender:</strong> {event.gender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span><strong>Team Size:</strong> {event.participant_count}</span>
                              <span><strong>Registered:</strong> {event.team_registrations_count}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span><strong>Status:</strong></span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                event.is_closed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {event.is_closed ? 'Closed' : 'Open'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#5A5A5A]">
                No team events found
              </div>
            )}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#D35D38] mb-4 text-center">📊 Event Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {scheduleData.individual.length}
              </p>
              <p className="text-sm text-[#5A5A5A]">Individual Events</p>
            </div>
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {scheduleData.team.length}
              </p>
              <p className="text-sm text-[#5A5A5A]">Team Events</p>
            </div>
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {scheduleData.individual.length + scheduleData.team.length}
              </p>
              <p className="text-sm text-[#5A5A5A]">Total Events</p>
            </div>
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {Object.keys(groupedIndividualEvents).length + Object.keys(groupedTeamEvents).length}
              </p>
              <p className="text-sm text-[#5A5A5A]">Categories</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render All Results
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

    // Filter results based on selected filters
    const filterResults = (results, ageFilter, genderFilter) => {
      return results.filter(result => {
        const [categoryAge, categoryGender] = result.category.split(' - ');
        const ageMatch = !ageFilter || ageFilter === 'all' || categoryAge === ageFilter;
        const genderMatch = !genderFilter || genderFilter === 'all' || categoryGender === genderFilter;
        return ageMatch && genderMatch;
      });
    };

    // Collect individual and team results separately
    const allIndividualResults = [];
    const allTeamResults = [];

    // Process individual events
    if (data.individual) {
      data.individual.forEach(category => {
        category.events.forEach(event => {
          allIndividualResults.push({
            category: `${category.age_category} - ${category.gender}`,
            eventName: event.event_name,
            firstPlace: getWinnerText(event.first, true),
            secondPlace: getWinnerText(event.second, true),
            thirdPlace: getWinnerText(event.third, true),
            ageCategory: category.age_category,
            gender: category.gender
          });
        });
      });
    }

    // Process team events
    if (data.team) {
      data.team.forEach(category => {
        category.events.forEach(event => {
          allTeamResults.push({
            category: `${category.age_category} - ${category.gender}`,
            eventName: event.event_name,
            firstPlace: getWinnerText(event.first, false),
            secondPlace: getWinnerText(event.second, false),
            thirdPlace: getWinnerText(event.third, false),
            ageCategory: category.age_category,
            gender: category.gender
          });
        });
      });
    }

    // Apply filters
    const individualResults = filterResults(allIndividualResults, selectedAge, selectedGender);
    const teamResults = filterResults(allTeamResults, selectedAge, selectedGender);

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
          <div className="px-6 py-4 bg-[#F8DFBE] border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-[#2A2A2A]">{title}</h3>
              <p className="text-sm text-[#5A5A5A] mt-1">{results.length} events with results</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>${title} - All Results</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; font-weight: bold; }
                        .winner-text { font-weight: bold; }
                        .first-place { color: #ffd700; font-weight: bold; }
                        .second-place { color: #c0c0c0; font-weight: bold; }
                        .third-place { color: #cd7f32; font-weight: bold; }
                        @media print {
                          body { margin: 0; }
                          .no-print { display: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                        <div class="section-title">${title}</div>
                      </div>
                      <table>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th>Event</th>
                            <th>1st Place</th>
                            <th>2nd Place</th>
                            <th>3rd Place</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${results.map((result, index) => `
                            <tr>
                              <td class="winner-text">${result.category}</td>
                              <td class="winner-text">${result.eventName}</td>
                              <td class="first-place">${result.firstPlace}</td>
                              <td class="second-place">${result.secondPlace}</td>
                              <td class="third-place">${result.thirdPlace}</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </body>
                    </html>
                  `;
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                  printWindow.close();
                }}
                className="bg-[#D35D38] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B84A2A] transition-colors"
              >
                🖨️ Print All
              </button>
            </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Print
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
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank');
                          const printContent = `
                            <!DOCTYPE html>
                            <html>
                            <head>
                              <title>${result.eventName} - ${result.category}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { text-align: center; margin-bottom: 20px; }
                                .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                                .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                                .event-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                                .event-name { font-size: 20px; font-weight: bold; color: #2A2A2A; margin-bottom: 5px; }
                                .event-category { font-size: 16px; color: #5A5A5A; }
                                .winners-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                                .winners-table th, .winners-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                                .winners-table th { background-color: #f2f2f2; font-weight: bold; }
                                .first-place { color: #ffd700; font-weight: bold; }
                                .second-place { color: #c0c0c0; font-weight: bold; }
                                .third-place { color: #cd7f32; font-weight: bold; }
                                @media print {
                                  body { margin: 0; }
                                  .no-print { display: none; }
                                }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                                <div class="section-title">${title}</div>
                              </div>
                              <div class="event-details">
                                <div class="event-name">${result.eventName}</div>
                                <div class="event-category">${result.category}</div>
                              </div>
                              <table class="winners-table">
                                <thead>
                                  <tr>
                                    <th>Position</th>
                                    <th>Winner</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td class="first-place">1st Place</td>
                                    <td class="first-place">${result.firstPlace}</td>
                                  </tr>
                                  <tr>
                                    <td class="second-place">2nd Place</td>
                                    <td class="second-place">${result.secondPlace}</td>
                                  </tr>
                                  <tr>
                                    <td class="third-place">3rd Place</td>
                                    <td class="third-place">${result.thirdPlace}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </body>
                            </html>
                          `;
                          printWindow.document.write(printContent);
                          printWindow.document.close();
                          printWindow.focus();
                          printWindow.print();
                          printWindow.close();
                        }}
                        className="bg-[#D35D38] text-white px-2 py-1 rounded text-xs font-medium hover:bg-[#B84A2A] transition-colors"
                      >
                        🖨️
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
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#2A2A2A]">All Results</h1>
          <p className="text-[#5A5A5A] mt-1">Complete list of winners from all events</p>
        </div>

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
              <option value="all">All Age Categories</option>
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
              <option value="all">All Genders</option>
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

        {/* Individual Events Results */}
        {renderResultsTable(individualResults, "🏃 Individual Events", "Individual")}

        {/* Team Events Results */}
        {renderResultsTable(teamResults, "🤝 Team Events", "Team")}

        {/* Summary */}
        {(individualResults.length > 0 || teamResults.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-[#2A2A2A]">📊 Results Summary</h3>
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  const printContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                      <title>All Results Summary</title>
                      <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                        .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-top: 20px; }
                        .summary-item { text-align: center; padding: 15px; background-color: #f8f9fa; border-radius: 8px; }
                        .summary-number { font-size: 24px; font-weight: bold; color: #D35D38; margin-bottom: 5px; }
                        .summary-label { font-size: 14px; color: #6c757d; }
                        @media print {
                          body { margin: 0; }
                          .no-print { display: none; }
                        }
                      </style>
                    </head>
                    <body>
                      <div class="header">
                        <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                        <div class="section-title">📊 Results Summary</div>
                      </div>
                      <div class="summary-grid">
                        <div class="summary-item">
                          <div class="summary-number">${individualResults.length + teamResults.length}</div>
                          <div class="summary-label">Total Events</div>
                        </div>
                        <div class="summary-item">
                          <div class="summary-number">${individualResults.length}</div>
                          <div class="summary-label">Individual Events</div>
                        </div>
                        <div class="summary-item">
                          <div class="summary-number">${teamResults.length}</div>
                          <div class="summary-label">Team Events</div>
                        </div>
                        <div class="summary-item">
                          <div class="summary-number">${(individualResults.length + teamResults.length) * 3}</div>
                          <div class="summary-label">Total Winners</div>
                        </div>
                      </div>
                    </body>
                    </html>
                  `;
                  printWindow.document.write(printContent);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                  printWindow.close();
                }}
                className="bg-[#D35D38] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#B84A2A] transition-colors"
              >
                🖨️ Print Summary
              </button>
            </div>
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

  // Modal Component
  const Modal = () => {
    if (!showModal) return null;

    const getModalIcon = () => {
      switch (modalType) {
        case 'success':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          );
        case 'error':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          );
        case 'info':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        case 'confirm':
          return (
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          );
        default:
          return null;
      }
    };

    const getModalButtonColor = () => {
      switch (modalType) {
        case 'success':
          return 'bg-green-600 hover:bg-green-700';
        case 'error':
          return 'bg-red-600 hover:bg-red-700';
        case 'info':
          return 'bg-blue-600 hover:bg-blue-700';
        case 'confirm':
          return 'bg-[#D35D38] hover:bg-[#B84A2E]';
        default:
          return 'bg-[#D35D38] hover:bg-[#B84A2E]';
      }
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
        <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-md">
          <div className="flex items-center mb-4">
            {getModalIcon()}
            <h3 className={`text-lg font-semibold ml-3 ${
              modalType === 'success' ? 'text-green-900' : 
              modalType === 'error' ? 'text-red-900' : 
              'text-blue-900'
            }`}>
              {modalTitle}
            </h3>
          </div>
          
          <p className={`text-sm mb-4 ${
            modalType === 'success' ? 'text-green-700' : 
            modalType === 'error' ? 'text-red-700' : 
            'text-blue-700'
          }`}>
            {modalMessage}
          </p>
          
          {/* Details section */}
          {modalDetails && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <h4 className="text-xs font-medium text-gray-700 mb-2">Details:</h4>
              <div className="text-xs text-gray-600 space-y-1">
                {Object.entries(modalDetails).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                    <span className="ml-2">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Only show buttons for non-success modals */}
          {modalType !== 'success' && (
            <div className="flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Confirm button clicked, modalType:', modalType, 'pendingUpdate:', pendingUpdate);
                  if (modalType === 'confirm') {
                    if (pendingUpdate && pendingUpdate.participantName) {
                      // Individual result update
                      console.log('Calling executeIndividualResultUpdate');
                      executeIndividualResultUpdate();
                    } else if (pendingUpdate && pendingUpdate.templeName) {
                      // Team result update
                      console.log('Calling executeTeamResultUpdate');
                      executeTeamResultUpdate();
                    } else if (pendingUpdate && pendingUpdate.eventId) {
                      // Bulk result update
                      console.log('Calling executeBulkResultUpdate');
                      executeBulkResultUpdate();
                    }
                  } else {
                    closeModal();
                  }
                }}
                className={`${getModalButtonColor()} text-white px-4 py-2 rounded transition`}
              >
                Confirm
              </button>
            </div>
          )}
          
          {/* Show auto-close message for success modals */}
          {modalType === 'success' && (
            <div className="text-center text-xs text-gray-500 mt-2">
              This message will close automatically...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F0F0F0] p-3 sm:p-4 md:p-6">
      {/* Modal */}
      <Modal />
      
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
        ) : activeTab === 'schedule' ? (
          renderSchedule()
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