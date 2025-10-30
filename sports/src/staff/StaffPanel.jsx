import React, { useState, useEffect, useRef } from 'react';
import { eventAPI, reportAPI } from '../utils/api';
import TempleManagement from '../components/TempleManagement.jsx';
import Schedule from '../components/Schedule.jsx';
import Results from '../components/Results.jsx';
import Champions from '../components/Champions.jsx';

const StaffPanel = () => {
  const [activeTab, setActiveTab] = useState('update-results');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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


  // For collapsible event states
  const [collapsibleStates, setCollapsibleStates] = useState({});
  
  // Map of eventId -> ref to scroll into view on open
  const eventRefs = useRef({});
  const getEventRef = (eventId) => {
    if (!eventRefs.current[eventId]) {
      eventRefs.current[eventId] = React.createRef();
    }
    return eventRefs.current[eventId];
  };
  
  // For event participants data
  const [eventParticipantsData, setEventParticipantsData] = useState({});
  const [loadingParticipants, setLoadingParticipants] = useState({});
  const [participantErrors, setParticipantErrors] = useState({});
  
  // For tracking rank changes
  const [rankChanges, setRankChanges] = useState({});
  
  // For tracking team rank changes
  const [teamRankChanges, setTeamRankChanges] = useState({});
  
  // For team participant details
  const [teamParticipantDetails, setTeamParticipantDetails] = useState({});

  // Helper functions for collapsible state management
  const getCollapsibleState = (eventId) => {
    return collapsibleStates[eventId] || false;
  };

  const setCollapsibleState = (eventId, isOpen) => {
    // Store current scroll position before opening
    const currentScrollY = window.scrollY;
    
    setCollapsibleStates(prev => ({
      ...prev,
      [eventId]: isOpen
    }));

    // If opening, focus on the event container and restore scroll position
    if (isOpen) {
      setTimeout(() => {
        const ref = getEventRef(eventId);
        if (ref && ref.current) {
          ref.current.focus();
          // Restore the original scroll position to prevent auto-scroll
          window.scrollTo(0, currentScrollY);
        }
      }, 0);
    }
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

  // Helper functions for team rank changes management
  const getTeamRankChanges = (eventId) => {
    return teamRankChanges[eventId] || {};
  };

  const setTeamRankChange = (eventId, registrationId, rank) => {
    setTeamRankChanges(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [registrationId]: rank
      }
    }));
  };

  const clearTeamRankChanges = (eventId) => {
    setTeamRankChanges(prev => ({
      ...prev,
      [eventId]: {}
    }));
  };

  // Helper functions for team participant details management
  const getTeamParticipantDetails = (registrationId) => {
    return teamParticipantDetails[registrationId] || [];
  };

  const setTeamParticipantDetailsData = (registrationId, participants) => {
    setTeamParticipantDetails(prev => ({
      ...prev,
      [registrationId]: participants
    }));
  };

  // Fetch team participant details
  const fetchTeamParticipantDetails = async (registrationId) => {
    if (teamParticipantDetails[registrationId]) {
      console.log('Using cached team participant details for:', registrationId);
      return teamParticipantDetails[registrationId];
    }

    try {
      console.log('Fetching team participant details for registration ID:', registrationId);
      const data = await eventAPI.getTeamParticipants(registrationId);
      console.log('API response for team participants:', data);
      setTeamParticipantDetailsData(registrationId, data);
      return data;
    } catch (error) {
      console.error('Error fetching team participant details:', error);
      return [];
    }
  };

  // Handle bulk result updates individual events
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

  // Execute bulk result updates individual events
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
      
      // Also refresh heats data if this is a heat event
      const currentEvent = events.find(e => e.id === parseInt(eventId));
      if (currentEvent && currentEvent.event_type && currentEvent.event_type.name) {
        const eventName = currentEvent.event_type.name.toLowerCase();
        const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
        if (isHeat) {
          console.log('Bulk update - refreshing heats data for heat event:', eventId);
          await fetchHeats();
        }
      }
      
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

  // Handle bulk Team result updates
  const handleBulkTeamResultUpdate = async (eventId, eventName, ageCategory) => {
    const changes = getTeamRankChanges(eventId);
    const changeEntries = Object.entries(changes);
    
    if (changeEntries.length === 0) {
      showInfoModal('No Changes', 'No rank changes to update.');
      return;
    }

    try {
      // Show confirmation modal with all changes
      const changesList = changeEntries.map(([registrationId, rank]) => {
        // Find the temple name from the team events data
        const teamEvent = data.find(event => 
          event.registered_temples?.some(temple => 
            temple.registration_ids?.includes(registrationId)
          )
        );
        const temple = teamEvent?.registered_temples?.find(temple => 
          temple.registration_ids?.includes(registrationId)
        );
        return {
          name: temple?.temple_name || 'Unknown Temple',
          temple: temple?.temple_name || 'Unknown Temple',
          rank: rank
        };
      });

      showConfirmModal(
        'Confirm Team Result Update',
        `Are you sure you want to update ${changeEntries.length} team(s)?`,
        {
          changes: changesList,
          count: changeEntries.length
        },
        {
          eventId,
          eventName,
          ageCategory,
          changes: changes,
          isTeamUpdate: true
        }
      );
    } catch (error) {
      console.error('Error preparing bulk team update:', error);
      showErrorModal('Error', 'Failed to prepare bulk team update.');
    }
  };

  // Execute bulk Team result updates
  const executeBulkTeamResultUpdate = async () => {
    if (!pendingUpdate || !pendingUpdate.eventId) return;

    const { eventId, eventName, ageCategory, changes } = pendingUpdate;
    const changeEntries = Object.entries(changes);
    
    try {
      // Update each team
      for (const [registrationId, rank] of changeEntries) {
        await eventAPI.updateTeamResult(registrationId, rank);
      }

      // Clear the team rank changes
      clearTeamRankChanges(eventId);
      
      // Refresh the team events data
      await fetchTeamEvents();
      
      // Close the confirmation modal and show success modal
      closeModal();
      
      // Use setTimeout to ensure the confirmation modal closes before showing success
      setTimeout(() => {
        showSuccessModal(
          'Team Result Update Successful',
          `Successfully updated ${changeEntries.length} team(s).`,
          {
            'Age Category': ageCategory,
            'Event Name': eventName
          }
        );
      }, 100);
      
      console.log('Bulk team result update successful');
    } catch (error) {
      console.error('Error updating bulk team results:', error);
      showErrorModal(
        'Bulk Team Update Failed',
        'Failed to update some or all teams.',
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

  useEffect(() => {
    // Clear data when switching tabs to prevent structure conflicts
    setData([]);
    setError(null);
    
    if (activeTab === 'update-results') {
      fetchUpdateResultsData();
    } else if (activeTab === 'teams') {
      fetchTeamEvents();
    } else if (activeTab === 'champions') {
      fetchChampions();
    } else if (activeTab === 'all-result') {
      fetchAllResults();
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

  // Print team participants for printing volleyball,throwball,relay,tug of war,couple relay
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
            .place {
              font-size: 16px;
              margin: 10px 0;
              color: #666;
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
            <div class="place">ಸ್ಥಳ - ಮುಲ್ಕಿ</div>
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

  // Print MALE/FEMALE team events table
  const printTeamEventTable = async (teamEvent, eventType) => {
    try {
      const eventName = teamEvent.event_type?.name || teamEvent.name || 'Team Event';
      const gender = teamEvent.gender;
      
      // Create print content
      const printContent = `
        <html>
          <head>
            <title>${eventType} Team Events - ${eventName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .event-name { font-size: 18px; font-weight: bold; color: #D35D38; }
              .event-details { font-size: 14px; margin-top: 5px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #D35D38; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .result { font-weight: bold; }
              .first { color: #FFD700; }
              .second { color: #C0C0C0; }
              .third { color: #CD7F32; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="event-name">${eventName} - ${gender}</div>
              <div class="event-details">${teamEvent.age_category} • ${eventType} Team Event</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SL.NO</th>
                  <th>Temple Name</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${teamEvent.registered_temples.map((temple, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${temple.temple_name}</td>
                    <td class="result">
                      ${temple.result?.rank ? 
                        (temple.result.rank === 'FIRST' ? '🥇 1st Place' :
                         temple.result.rank === 'SECOND' ? '🥈 2nd Place' :
                         temple.result.rank === 'THIRD' ? '🥉 3rd Place' : temple.result.rank) : 
                        ''
                      }
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Print directly without opening new tab
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.left = '-9999px';
      
      document.body.appendChild(printFrame);
      
      printFrame.contentDocument.write(printContent);
      printFrame.contentDocument.close();
      
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    } catch (error) {
      console.error('Error printing team event table:', error);
    }
  };

  // Print MIXED team events table
  const printMixedTeamEventTable = async (teamEvent) => {
    try {
      const eventName = teamEvent.event_type?.name || teamEvent.name || 'Team Event';
      
      // Fetch all team data for mixed events
      const allTeamData = [];
      for (const temple of teamEvent.registered_temples || []) {
        const registrationIds = temple.registration_ids || [];
        for (const registrationId of registrationIds) {
          try {
            const registrationData = await eventAPI.getTeamRegistration(registrationId);
            const participants = await eventAPI.getTeamParticipants(registrationId);
            
            const maleParticipants = participants.filter(p => p.gender === 'MALE');
            const femaleParticipants = participants.filter(p => p.gender === 'FEMALE');
            
            allTeamData.push({
              templeName: temple.temple_name,
              maleParticipants: maleParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', '),
              femaleParticipants: femaleParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', '),
              result: registrationData.event_result ? 
                (registrationData.event_result.rank === 'FIRST' ? '🥇 1st Place' :
                 registrationData.event_result.rank === 'SECOND' ? '🥈 2nd Place' :
                 registrationData.event_result.rank === 'THIRD' ? '🥉 3rd Place' : registrationData.event_result.rank) : 
                ''
            });
          } catch (error) {
            console.error(`Error fetching data for registration ${registrationId}:`, error);
          }
        }
      }

      // Create print content
      const printContent = `
        <html>
          <head>
            <title>Mixed Team Events - ${eventName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .event-name { font-size: 18px; font-weight: bold; color: #D35D38; }
              .event-details { font-size: 14px; margin-top: 5px; color: #666; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #D35D38; color: white; font-weight: bold; }
              tr:nth-child(even) { background-color: #f9f9f9; }
              .result { font-weight: bold; }
              .participants { font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="event-name">${eventName} - Mixed</div>
              <div class="event-details">${teamEvent.age_category} • Mixed Team Event</div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>SL.NO</th>
                  <th>Temple Name</th>
                  <th>Male Participants</th>
                  <th>Female Participants</th>
                  <th>Result</th>
                </tr>
              </thead>
              <tbody>
                ${allTeamData.map((team, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${team.templeName}</td>
                    <td class="participants">${team.maleParticipants || 'None'}</td>
                    <td class="participants">${team.femaleParticipants || 'None'}</td>
                    <td class="result">${team.result}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;

      // Print directly without opening new tab
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'absolute';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.left = '-9999px';
      
      document.body.appendChild(printFrame);
      
      printFrame.contentDocument.write(printContent);
      printFrame.contentDocument.close();
      
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
      
      // Clean up after printing
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    } catch (error) {
      console.error('Error printing mixed team event table:', error);
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
          
          // Also refresh heats data if this is a heat event
          // Check if the current event is a heat event by looking at the event data
          const currentEvent = events.find(e => e.id === parseInt(eventId));
          if (currentEvent && currentEvent.event_type && currentEvent.event_type.name) {
            const eventName = currentEvent.event_type.name.toLowerCase();
            const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
            if (isHeat) {
              console.log('Refreshing heats data for heat event:', eventId);
              await fetchHeats();
            }
          }
          
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
    containerRef,
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
    const [savingTrials, setSavingTrials] = useState(false);

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

    // Save timings for current heat or final heat
    const saveHeatTimings = async () => {
      if (showFinalHeat) {
        // Save final heat timings - only update performance_2
        if (!finalHeatParticipants || finalHeatParticipants.length === 0) return;
        
        try {
          setSavingTimings(true);
          
          // Only include participants that have actual final time values (not empty)
          const timingsArray = finalHeatParticipants
            .filter(participant => {
              const finalTime = timings[`${participant.id}_performance_2`];
              return (finalTime && finalTime.trim() !== '');
            })
            .map(participant => ({
              registration_id: participant.id,
              performance_1: String(participant.performance_1 || ''), // Keep existing heat time as string
              performance_2: String(timings[`${participant.id}_performance_2`] || participant.performance_2 || ''), // Convert to string
              performance_3: '' // Not used for heat events
            }));
          
          console.log(`Updating final heat timings (performance_2 only):`, timingsArray);
          console.log(`Only sending ${timingsArray.length} participants with final times out of ${finalHeatParticipants.length} total participants`);
          
          if (timingsArray.length === 0) {
            showInfoModal('No Final Times', 'Please enter at least one final time before saving.');
            return;
          }
          
          await eventAPI.saveFinalTimings(eventId, timingsArray);
          console.log('Final heat timings updated successfully');
          
          // Clear the local timings state since data is now saved
          setTimings({});
          
          showSuccessModal(
            'Final Heat Timings Updated',
            `Final heat timings have been updated successfully!`,
            {
              participants: timingsArray.length,
              total: finalHeatParticipants.length
            }
          );
        } catch (error) {
          console.error('Error saving final heat timings:', error);
          showErrorModal(
            'Update Failed',
            'Failed to update final heat timings. Please try again.',
            {
              error: error.message
            }
          );
        } finally {
          setSavingTimings(false);
        }
      } else {
        // Save regular heat timings - only update performance_1
        if (!selectedHeat || !heats[selectedHeat]) return;
        
        try {
          setSavingTimings(true);
          
          // Only include participants that have actual heat time values (not empty)
          const timingsArray = heats[selectedHeat]
            .filter(participant => {
              const heatTime = timings[participant.id];
              return (heatTime && heatTime.trim() !== '');
            })
            .map(participant => ({
              registration_id: participant.id,
              performance_1: String(timings[participant.id] || participant.performance_1 || ''), // Convert to string
              performance_2: String(participant.performance_2 || ''), // Keep existing final time as string
              performance_3: '' // Not used for heat events
            }));
          
          console.log(`Updating heat timings (performance_1 only):`, timingsArray);
          console.log(`Only sending ${timingsArray.length} participants with heat times out of ${heats[selectedHeat].length} total participants`);
          
          if (timingsArray.length === 0) {
            showInfoModal('No Heat Times', 'Please enter at least one heat time before saving.');
            return;
          }
          
          await eventAPI.saveTimings(eventId, selectedHeat, timingsArray);
          console.log('Heat timings updated successfully');
          
          // Refresh heats to get updated data
          await fetchHeats();
          
          // Clear the local timings state since data is now saved
          setTimings({});
          
          showSuccessModal(
            'Heat Timings Updated Successfully',
            `Heat timings for Heat ${selectedHeat} have been updated successfully!`,
            {
              heat: selectedHeat,
              participants: timingsArray.length,
              total: heats[selectedHeat]?.length || 0
            }
          );
        } catch (error) {
          console.error('Error saving heat timings:', error);
          showErrorModal(
            'Update Failed',
            'Failed to update heat timings. Please try again.',
            {
              heat: selectedHeat,
              error: error.message
            }
          );
        } finally {
          setSavingTimings(false);
        }
      }
    };

    // Save trial measurements for trial events
    const saveTrials = async () => {
      if (!isTrialEvent()) return;
      
      try {
        setSavingTrials(true);
        
        // Only include participants that have actual trial values (not empty)
        const trialsArray = eventParticipants
          .filter(participant => {
            const trial1 = trialMeasurements[`${participant.id}_1`];
            const trial2 = trialMeasurements[`${participant.id}_2`];
            const trial3 = trialMeasurements[`${participant.id}_3`];
            return (trial1 && trial1.trim() !== '') || 
                   (trial2 && trial2.trim() !== '') || 
                   (trial3 && trial3.trim() !== '');
          })
          .map(participant => ({
            registration_id: participant.id,
            performance_1: String(trialMeasurements[`${participant.id}_1`] || participant.performance_1 || ''), // Convert to string
            performance_2: String(trialMeasurements[`${participant.id}_2`] || participant.performance_2 || ''), // Convert to string
            performance_3: String(trialMeasurements[`${participant.id}_3`] || participant.performance_3 || '') // Convert to string
          }));
        
        console.log(`Updating trials for event ${eventId}:`, trialsArray);
        console.log(`Only sending ${trialsArray.length} participants with trials out of ${eventParticipants.length} total participants`);
        
        if (trialsArray.length === 0) {
          showInfoModal('No Trials', 'Please enter at least one trial measurement before saving.');
          return;
        }
        
        await eventAPI.saveTrials(eventId, trialsArray);
        console.log('Trials updated successfully');
        
        // Clear the local trial measurements state since data is now saved
        setTrialMeasurements({});
        
        showSuccessModal(
          'Trials Updated',
          `Trial measurements have been updated successfully!`,
          {
            event: title,
            participants: trialsArray.length,
            total: eventParticipants.length
          }
        );
      } catch (error) {
        console.error('Error saving trials:', error);
        showErrorModal(
          'Update Failed',
          'Failed to update trial measurements. Please try again.',
          {
            event: title,
            error: error.message
          }
        );
      } finally {
        setSavingTrials(false);
      }
    };

    // Fetch heats from backend
    const fetchHeats = async () => {
      console.log('fetchHeats called for event:', title, 'eventId:', eventId);
      console.log('isHeatEvent():', isHeatEvent());
      
      if (!isHeatEvent()) {
        console.log('Not a heat event, skipping heat fetch');
        return;
      }
      
      try {
        console.log(`Fetching heats for eventId: ${eventId}`);
        setLoadingHeats(true);
        const heatsData = await eventAPI.getHeats(eventId);
        console.log('Heats data received:', heatsData);
        console.log('Number of heats:', Object.keys(heatsData).length);
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

    // Fetch trial measurements from backend
    const fetchTrials = async () => {
      if (!isTrialEvent()) {
        console.log('Not a trial event, skipping trial fetch');
        return;
      }
      
      try {
        console.log(`Fetching trials for eventId: ${eventId}`);
        const trialsData = await eventAPI.getTrials(eventId);
        console.log('Trials data received:', trialsData);
        
        // Convert the trials data to the format expected by trialMeasurements state
        const trialsMap = {};
        Object.entries(trialsData).forEach(([registrationId, trialData]) => {
          if (trialData.performance_1) trialsMap[`${registrationId}_1`] = trialData.performance_1.toString();
          if (trialData.performance_2) trialsMap[`${registrationId}_2`] = trialData.performance_2.toString();
          if (trialData.performance_3) trialsMap[`${registrationId}_3`] = trialData.performance_3.toString();
        });
        
        setTrialMeasurements(trialsMap);
        console.log('Trial measurements set:', trialsMap);
      } catch (error) {
        console.error('Error fetching trials:', error);
        console.error('Error details:', error.message);
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
          // Priority: saved performance_1 from database > current timings state
          const timing = participant.performance_1 || timings[participant.id];
          const timingSeconds = parseTiming(timing);
          
          console.log(`Heat ${heatNumber} - Participant ${participant.id} (${participant.participant_name}):`, {
            performance_1: participant.performance_1,
            performance_2: participant.performance_2,
            performance_3: participant.performance_3,
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
            timing: participant.performance_1 || timings[participantId] || '',
            timingSeconds: parseTiming(participant.performance_1 || timings[participantId])
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
            .place { font-size: 16px; margin-bottom: 10px; color: #666; }
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
            <div class="place">ಸ್ಥಳ - ಮುಲ್ಕಿ</div>
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
                const timing = participant.performance_1 || participant.timing || timings[participant.id] || '';
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
      if (eventParticipants.length > 0) {
        console.log('Participants already loaded, skipping participant fetch');
        return;
      }
      
      try {
        console.log(`Fetching participants for event: ${title} (${eventId})`);
        setLoadingParticipantsState(eventId, true);
        setParticipantError(eventId, null);
        
        // Fetch participants
        const data = await eventAPI.getEventParticipants(eventId);
        setEventParticipants(eventId, data);
        
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
        fetchTrials(); // Fetch trial data for trial events
      }
      setIsOpen(!isOpen);
    };

    // Auto-fetch heats when heat event is opened
    React.useEffect(() => {
      if (isOpen && isHeatEvent()) {
        console.log('Heat event opened, auto-fetching heats...');
        fetchHeats();
      }
    }, [isOpen, eventId]);



    // Keep dropdown open after updates - don't reset state
    const handleUpdateSuccess = () => {
      // Don't close the dropdown, just refresh the data
      fetchEventParticipants();
      if (isTrialEvent()) {
        fetchTrials(); // Only refresh trial data for trial events
      }
    };

    return (
      <div 
        ref={containerRef} 
        className="border border-gray-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:ring-offset-2 transition-all duration-200"
        tabIndex={-1}
      >
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
                        onClick={async () => {
                          console.log('Try Fetching heats button clicked');
                          console.log('Current heats state:', heats);
                          console.log('Object.keys(heats).length:', Object.keys(heats).length);
                          
                          // First try to fetch existing heats
                          await fetchHeats();
                          
                          // If no heats found, try to generate them
                          if (Object.keys(heats).length === 0) {
                            console.log('No heats found, trying to generate heats...');
                            try {
                              const generateResponse = await eventAPI.generateHeats(eventId);
                              console.log('Generate heats response:', generateResponse);
                              
                              // After generating, fetch the heats again
                              await fetchHeats();
                            } catch (generateError) {
                              console.error('Error generating heats:', generateError);
                            }
                          }
                        }}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                      >
                        🔄 Try Fetching/Generating Heats
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
                        {isTrialEvent() && (
                          <>
                            <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TRIAL 1</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TRIAL 2</th>
                            <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TRIAL 3</th>
                          </>
                        )}
                        {isHeatEvent() && (
                          <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">
                            <div className="flex items-center justify-between">
                              <span>TIMING</span>
                              {(selectedHeat || showFinalHeat) && (
                                <button
                                  onClick={saveHeatTimings}
                                  disabled={savingTimings}
                                  className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                                >
                                  {savingTimings ? 'Updating...' : 'Update Timings'}
                                </button>
                              )}
                            </div>
                          </th>
                        )}
                        {(!isHeatEvent() || (isHeatEvent() && showFinalHeat)) && (
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
                        )}
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
                          {isTrialEvent() && (
                            <>
                              <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={trialMeasurements[`${participant.id}_1`] || participant.performance_1 || ''}
                                  onChange={(e) => handleTrialInput(participant.id, 1, e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={trialMeasurements[`${participant.id}_2`] || participant.performance_2 || ''}
                                  onChange={(e) => handleTrialInput(participant.id, 2, e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={trialMeasurements[`${participant.id}_3`] || participant.performance_3 || ''}
                                  onChange={(e) => handleTrialInput(participant.id, 3, e.target.value)}
                                />
                              </td>
                            </>
                          )}
                          {isHeatEvent() && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                              {showFinalHeat ? (
                                // Final Heat - only show Final Time input (performance_2)
                                <input
                                  type="text"
                                  placeholder="Final Time"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={(() => {
                                    const localTiming = timings[`${participant.id}_performance_2`];
                                    const dbTiming = participant.performance_2;
                                    const finalValue = localTiming !== undefined ? localTiming : (dbTiming || '');
                                    console.log(`Final heat input value for ${participant.id}:`, { localTiming, dbTiming, finalValue });
                                    return finalValue;
                                  })()}
                                  onChange={(e) => {
                                    // Handle performance_2 input for final heat
                                    const newTimings = { ...timings };
                                    newTimings[`${participant.id}_performance_2`] = e.target.value;
                                    setTimings(newTimings);
                                  }}
                                />
                              ) : (
                                // Selected Heat - only show Heat Time input (performance_1)
                                <input
                                  type="text"
                                  placeholder="Heat Time"
                                  className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={(() => {
                                    const localTiming = timings[participant.id];
                                    const dbTiming = participant.performance_1;
                                    const finalValue = localTiming !== undefined ? localTiming : (dbTiming || '');
                                    console.log(`Heat input value for ${participant.id}:`, { localTiming, dbTiming, finalValue });
                                    return finalValue;
                                  })()}
                                  onChange={(e) => handleTimingInput(participant.id, e.target.value)}
                                />
                              )}
                            </td>
                          )}
                          {(!isHeatEvent() || (isHeatEvent() && showFinalHeat)) && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <div className="flex items-center gap-3">
                                {/* Current Result Display */}
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const currentRank = getRankChanges(eventId)[participant.id] || participant.result?.rank;
                                    return currentRank ? (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                        currentRank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                                        currentRank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                                        currentRank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {currentRank === 'FIRST' ? '🥇 1st' :
                                         currentRank === 'SECOND' ? '🥈 2nd' :
                                         currentRank === 'THIRD' ? '🥉 3rd' : currentRank}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400 text-xs">No result</span>
                                    );
                                  })()}
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
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Save Trials Button for Trial Events */}
                {isTrialEvent() && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={saveTrials}
                      disabled={savingTrials}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {savingTrials ? 'Saving...' : 'Save Trials'}
                    </button>
                  </div>
                )}
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
 
  // Render Temple Reports - now using reusable component
  const renderTempleReports = () => {
    return <TempleManagement apiSource="staff" showContactInfo={false} showParticipants={false} />;
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
                        containerRef={getEventRef(event.id)}
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

  // Mixed Team Row Component
  const MixedTeamRow = ({ 
    registrationId, 
    temple, 
    teamEvent, 
    rowIndex, 
    getTeamParticipantDetails, 
    fetchTeamParticipantDetails, 
    getTeamRankChanges, 
    setTeamRankChange, 
    printTeamParticipants 
  }) => {
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [teamResult, setTeamResult] = useState(null);

    useEffect(() => {
      if (registrationId) {
        loadTeamParticipants();
        loadTeamResult();
      }
    }, [registrationId]);

    const loadTeamParticipants = async () => {
      setLoading(true);
      try {
        console.log('Loading team participants for registration ID:', registrationId);
        const data = await fetchTeamParticipantDetails(registrationId);
        console.log('Fetched team participants:', data);
        setParticipants(data);
      } catch (error) {
        console.error('Error loading team participants:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadTeamResult = async () => {
      try {
        console.log('Loading team result for registration ID:', registrationId);
        const registrationData = await eventAPI.getTeamRegistration(registrationId);
        console.log('Fetched team registration data:', registrationData);
        
        if (registrationData.event_result) {
          setTeamResult({
            rank: registrationData.event_result.rank,
            points: registrationData.event_result.points
          });
        } else {
          setTeamResult(null);
        }
      } catch (error) {
        console.error('Error loading team result:', error);
        setTeamResult(null);
      }
    };

    // Separate male and female participants
    const maleParticipants = participants.filter(p => p.gender === 'MALE');
    const femaleParticipants = participants.filter(p => p.gender === 'FEMALE');

    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-[#2A2A2A]">
            {rowIndex}
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div>
              <div className="text-sm font-semibold text-[#2A2A2A]">
                {temple.temple_name}
              </div>
              <div className="text-xs text-[#5A5A5A]">
                Team {rowIndex % 10 || 1}
              </div>
            </div>
          </div>
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : maleParticipants.length > 0 ? (
            <div className="space-y-1">
              {maleParticipants.map((participant, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-[#2A2A2A]">
                    {participant.first_name} {participant.last_name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No male participants</div>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          {loading ? (
            <div className="text-sm text-gray-500">Loading...</div>
          ) : femaleParticipants.length > 0 ? (
            <div className="space-y-1">
              {femaleParticipants.map((participant, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-medium text-[#2A2A2A]">
                    {participant.first_name} {participant.last_name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No female participants</div>
          )}
        </td>
        <td className="px-4 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {teamResult?.rank ? (
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                {teamResult.rank === 'FIRST' ? '🥇 1st' :
                 teamResult.rank === 'SECOND' ? '🥈 2nd' :
                 teamResult.rank === 'THIRD' ? '🥉 3rd' : teamResult.rank}
              </span>
            ) : (
              <span className="text-xs text-[#5A5A5A]">No result</span>
            )}
            <select
              className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
              value={getTeamRankChanges(teamEvent.id)[registrationId] || teamResult?.rank || ""}
              onChange={(e) => {
                if (registrationId) {
                  setTeamRankChange(teamEvent.id, registrationId, e.target.value);
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
        </td>
        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
          <button 
            className="px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
            onClick={() => printTeamParticipants(
              { registration_id: registrationId }, 
              teamEvent.event_type?.name || teamEvent.name || 'Team Event',
              [registrationId]
            )}
          >
            🖨️ Print Team
          </button>
        </td>
      </tr>
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
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                            <p className="text-white/80 text-sm mt-1">
                              {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                            </p>
                          </div>
                          <button
                            onClick={() => printTeamEventTable(teamEvent, 'Male')}
                            className="px-4 py-2 bg-white text-[#D35D38] rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                          >
                            🖨️ Print Table
                          </button>
                        </div>
                      </div>
                      
                      {/* Registered Temples */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Temples</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-[#D35D38]">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    SL.NO
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Temple Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Total Members
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Total Points
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    <div className="flex items-center justify-between">
                                      <span>Result & Actions</span>
                                      <button
                                        onClick={() => handleBulkTeamResultUpdate(teamEvent.id, teamEvent.event_type?.name || teamEvent.name || 'Team Event', teamEvent.age_category)}
                                        className={`px-3 py-1 rounded text-xs transition-colors ${
                                          Object.keys(getTeamRankChanges(teamEvent.id)).length > 0
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-white text-[#D35D38] hover:bg-gray-100'
                                        }`}
                                        title={`Update all selected results (${Object.keys(getTeamRankChanges(teamEvent.id)).length} pending)`}
                                      >
                                        Update All {Object.keys(getTeamRankChanges(teamEvent.id)).length > 0 && `(${Object.keys(getTeamRankChanges(teamEvent.id)).length})`}
                                      </button>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Print
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {teamEvent.registered_temples.map((temple, templeIndex) => (
                                  <tr key={templeIndex} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-[#2A2A2A]">
                                        {templeIndex + 1}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div>
                                          <div className="text-sm font-semibold text-[#2A2A2A]">
                                            {temple.temple_name}
                                          </div>
                                          <div className="text-xs text-[#5A5A5A]">
                                            {temple.team_count || 1} team{temple.team_count > 1 ? 's' : ''} registered
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-[#2A2A2A] font-medium">
                                        {temple.member_count || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-[#D35D38]">
                                        {temple.result?.points || temple.total_points || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {temple.result?.rank ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {temple.result.rank === 'FIRST' ? '🥇 1st' :
                                             temple.result.rank === 'SECOND' ? '🥈 2nd' :
                                             temple.result.rank === 'THIRD' ? '🥉 3rd' : temple.result.rank}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-[#5A5A5A]">No result</span>
                                        )}
                                        <select
                                          className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                                          value={getTeamRankChanges(teamEvent.id)[temple.registration_ids?.[0]] || temple.result?.rank || ""}
                                          onChange={(e) => {
                                            if (temple.registration_ids && temple.registration_ids.length > 0) {
                                              setTeamRankChange(teamEvent.id, temple.registration_ids[0], e.target.value);
                                            }
                                          }}
                                        >
                                          <option value="">Select Rank</option>
                                          <option value="FIRST">🥇 1st Place</option>
                                          <option value="SECOND">🥈 2nd Place</option>
                                          {(teamEvent.event_type?.name || teamEvent.name || '').includes('Relay - 100 X 4') && (
                                            <option value="THIRD">🥉 3rd Place</option>
                                          )}
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                      <button 
                                        className="px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        onClick={() => printTeamParticipants(
                                          temple, 
                                          teamEvent.event_type?.name || teamEvent.name || 'Team Event',
                                          temple.registration_ids || []
                                        )}
                                      >
                                        🖨️ Print Team
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                            <p className="text-white/80 text-sm mt-1">
                              {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                            </p>
                          </div>
                          <button
                            onClick={() => printTeamEventTable(teamEvent, 'Female')}
                            className="px-4 py-2 bg-white text-[#D35D38] rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                          >
                            🖨️ Print Table
                          </button>
                        </div>
                      </div>
                      
                      {/* Registered Temples */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Temples</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-[#D35D38]">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    SL.NO
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Temple Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Total Members
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Total Points
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    <div className="flex items-center justify-between">
                                      <span>Result & Actions</span>
                                      <button
                                        onClick={() => handleBulkTeamResultUpdate(teamEvent.id, teamEvent.event_type?.name || teamEvent.name || 'Team Event', teamEvent.age_category)}
                                        className={`px-3 py-1 rounded text-xs transition-colors ${
                                          Object.keys(getTeamRankChanges(teamEvent.id)).length > 0
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-white text-[#D35D38] hover:bg-gray-100'
                                        }`}
                                        title={`Update all selected results (${Object.keys(getTeamRankChanges(teamEvent.id)).length} pending)`}
                                      >
                                        Update All {Object.keys(getTeamRankChanges(teamEvent.id)).length > 0 && `(${Object.keys(getTeamRankChanges(teamEvent.id)).length})`}
                                      </button>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Print
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {teamEvent.registered_temples.map((temple, templeIndex) => (
                                  <tr key={templeIndex} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-medium text-[#2A2A2A]">
                                        {templeIndex + 1}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div>
                                          <div className="text-sm font-semibold text-[#2A2A2A]">
                                            {temple.temple_name}
                                          </div>
                                          <div className="text-xs text-[#5A5A5A]">
                                            {temple.team_count || 1} team{temple.team_count > 1 ? 's' : ''} registered
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm text-[#2A2A2A] font-medium">
                                        {temple.member_count || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="text-sm font-bold text-[#D35D38]">
                                        {temple.result?.points || temple.total_points || 0}
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                      <div className="flex items-center gap-2">
                                        {temple.result?.rank ? (
                                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                            {temple.result.rank === 'FIRST' ? '🥇 1st' :
                                             temple.result.rank === 'SECOND' ? '🥈 2nd' :
                                             temple.result.rank === 'THIRD' ? '🥉 3rd' : temple.result.rank}
                                          </span>
                                        ) : (
                                          <span className="text-xs text-[#5A5A5A]">No result</span>
                                        )}
                                        <select
                                          className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                                          value={getTeamRankChanges(teamEvent.id)[temple.registration_ids?.[0]] || temple.result?.rank || ""}
                                          onChange={(e) => {
                                            if (temple.registration_ids && temple.registration_ids.length > 0) {
                                              setTeamRankChange(teamEvent.id, temple.registration_ids[0], e.target.value);
                                            }
                                          }}
                                        >
                                          <option value="">Select Rank</option>
                                          <option value="FIRST">🥇 1st Place</option>
                                          <option value="SECOND">🥈 2nd Place</option>
                                          {(teamEvent.event_type?.name || teamEvent.name || '').includes('Relay - 100 X 4') && (
                                            <option value="THIRD">🥉 3rd Place</option>
                                          )}
                                          <option value="CLEAR">Clear Result</option>
                                        </select>
                                      </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                      <button 
                                        className="px-3 py-2 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center gap-1"
                                        onClick={() => printTeamParticipants(
                                          temple, 
                                          teamEvent.event_type?.name || teamEvent.name || 'Team Event',
                                          temple.registration_ids || []
                                        )}
                                      >
                                        🖨️ Print Team
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-white">{teamEvent.event_type?.name || teamEvent.name || 'Team Event'} - {teamEvent.gender}</h3>
                            <p className="text-white/80 text-sm mt-1">
                              {teamEvent.age_category} - {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} Event
                            </p>
                          </div>
                          <button
                            onClick={() => printMixedTeamEventTable(teamEvent)}
                            className="px-4 py-2 bg-white text-[#D35D38] rounded-lg hover:bg-gray-100 flex items-center gap-2 text-sm font-medium"
                          >
                            🖨️ Print Table
                          </button>
                        </div>
                      </div>
                      
                      {/* Registered Teams */}
                      <div className="p-6">
                        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">Registered Teams</h4>
                        
                        {teamEvent.registered_temples && teamEvent.registered_temples.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-[#D35D38]">
                                <tr>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    SL.NO
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Temple Name
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Male Participants
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Female Participants
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    <div className="flex items-center justify-between">
                                      <span>Result & Actions</span>
                                      <button
                                        onClick={() => handleBulkTeamResultUpdate(teamEvent.id, teamEvent.event_type?.name || teamEvent.name || 'Team Event', teamEvent.age_category)}
                                        className={`px-3 py-1 rounded text-xs transition-colors ${
                                          Object.keys(getTeamRankChanges(teamEvent.id)).length > 0
                                            ? 'bg-green-600 text-white hover:bg-green-700'
                                            : 'bg-white text-[#D35D38] hover:bg-gray-100'
                                        }`}
                                        title={`Update all selected results (${Object.keys(getTeamRankChanges(teamEvent.id)).length} pending)`}
                                      >
                                        Update All {Object.keys(getTeamRankChanges(teamEvent.id)).length > 0 && `(${Object.keys(getTeamRankChanges(teamEvent.id)).length})`}
                                      </button>
                                    </div>
                                  </th>
                                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                                    Print
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {teamEvent.registered_temples.map((temple, templeIndex) => {
                                  // For Mixed events, we need to show each team separately
                                  // Use registration_ids to create individual team rows
                                  const registrationIds = temple.registration_ids || [];
                                  return registrationIds.map((registrationId, teamIndex) => (
                                    <MixedTeamRow
                                      key={`${templeIndex}-${teamIndex}`}
                                      registrationId={registrationId}
                                      temple={temple}
                                      teamEvent={teamEvent}
                                      rowIndex={templeIndex * 10 + teamIndex + 1} // Ensure unique row numbers
                                      getTeamParticipantDetails={getTeamParticipantDetails}
                                      fetchTeamParticipantDetails={fetchTeamParticipantDetails}
                                      getTeamRankChanges={getTeamRankChanges}
                                      setTeamRankChange={setTeamRankChange}
                                      printTeamParticipants={printTeamParticipants}
                                    />
                                  ));
                                })}
                              </tbody>
                            </table>
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
                              <span className="font-medium text-[#2A2A2A]">Total Teams:</span>
                              <span className="ml-2 text-[#D35D38] font-bold">
                                {teamEvent.registered_temples ? 
                                  teamEvent.registered_temples.reduce((total, temple) => total + (temple.teams?.length || 0), 0) : 0}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-[#2A2A2A]">Event Type:</span>
                              <span className="ml-2 text-[#5A5A5A]">Mixed Team Event</span>
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
                      if (pendingUpdate.isTeamUpdate) {
                        console.log('Calling executeBulkTeamResultUpdate');
                        executeBulkTeamResultUpdate();
                      } else {
                        console.log('Calling executeBulkResultUpdate');
                        executeBulkResultUpdate();
                      }
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
  
  //Body
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
          <Champions apiSource="staff" />
        ) : activeTab === 'all-result' ? (
          <Results apiSource="staff" />
        ) : activeTab === 'schedule' ? (
          <Schedule apiSource="staff" />
        ) : null}
      </div>
    </div>
  );
};

export default StaffPanel; 