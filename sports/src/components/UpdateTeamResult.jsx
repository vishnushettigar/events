import React, { useState, useEffect } from 'react';
import { eventAPI } from '../utils/api';

const UpdateTeamResult = () => {
  // State management
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

  // For tracking team rank changes
  const [teamRankChanges, setTeamRankChanges] = useState({});
  
  // For team participant details
  const [teamParticipantDetails, setTeamParticipantDetails] = useState({});

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

  // Load data on mount
  useEffect(() => {
    fetchTeamEvents();
  }, []);

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

  // Handle bulk Team result updates
  const handleBulkTeamResultUpdate = async (eventId, eventName, ageCategory) => {
    // Preserve scroll position to prevent jumping to top
    const scrollY = window.scrollY;
    
    const changes = getTeamRankChanges(eventId);
    const changeEntries = Object.entries(changes);
    
    if (changeEntries.length === 0) {
      showInfoModal('No Changes', 'No rank changes to update.');
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
      return;
    }

    try {
      // Find the specific event first
      const teamEvent = data.find(event => String(event.id) === String(eventId));
      console.log('Team event found:', teamEvent ? { id: teamEvent.id, name: teamEvent.event_type?.name, gender: teamEvent.gender } : 'Not found');
      console.log('Change entries:', changeEntries.map(([id, rank]) => ({ id, idType: typeof id, rank })));
      
      // Check if this is a Mixed gender event
      const isMixedEvent = teamEvent && (teamEvent.gender === 'MIXED' || teamEvent.gender === 'ALL');
      
      // Show confirmation modal with all changes
      const changesList = await Promise.all(changeEntries.map(async ([registrationId, rank]) => {
        // Find the temple name from the specific team event
        let temple = null;
        
        if (teamEvent && teamEvent.registered_temples) {
          // Search for temple with matching registration ID (handle type conversion)
          temple = teamEvent.registered_temples.find(t => 
            t.registration_ids?.some(rid => String(rid) === String(registrationId))
          );
        }
        
        console.log(`Looking for registration ${registrationId} (${typeof registrationId}):`, temple ? `Found temple: ${temple.temple_name}` : 'Not found');
        
        if (!temple) {
          console.warn(`Temple not found for registration ID ${registrationId} in event ${eventId}`);
        }
        
        // For Mixed events, fetch participant names
        let participantNames = null;
        if (isMixedEvent && registrationId) {
          try {
            const participants = await fetchTeamParticipantDetails(registrationId);
            if (participants && participants.length > 0) {
              const maleParticipants = participants.filter(p => p.gender === 'MALE');
              const femaleParticipants = participants.filter(p => p.gender === 'FEMALE');
              
              const maleNames = maleParticipants.map(p => `${p.first_name} ${p.last_name || ''}`.trim()).join(', ');
              const femaleNames = femaleParticipants.map(p => `${p.first_name} ${p.last_name || ''}`.trim()).join(', ');
              
              participantNames = {
                male: maleNames || 'None',
                female: femaleNames || 'None'
              };
            }
          } catch (error) {
            console.error(`Error fetching participants for registration ${registrationId}:`, error);
          }
        }
        
        return {
          name: temple?.temple_name || 'Unknown Temple',
          temple: temple?.temple_name || 'Unknown Temple',
          rank: rank,
          isMixed: isMixedEvent,
          participants: participantNames
        };
      }));

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
      
      // Restore scroll position after modal is shown
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
    } catch (error) {
      console.error('Error preparing bulk team update:', error);
      showErrorModal('Error', 'Failed to prepare bulk team update.');
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
    }
  };

  // Execute bulk Team result updates
  const executeBulkTeamResultUpdate = async () => {
    if (!pendingUpdate || !pendingUpdate.eventId) return;

    // Preserve scroll position to prevent jumping to top
    const scrollY = window.scrollY;

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
      
      // Restore scroll position after DOM updates
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
      
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
        // Restore scroll position again after success modal is shown
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
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
      // Restore scroll position after error modal is shown
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
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

  // Print team participants for printing volleyball,throwball,relay,tug of war,couple relay
  const printTeamParticipants = async (temple, eventName, registrationIds) => {
    try {
      const participants = await fetchTeamParticipants(registrationIds);
      const isTugOfWar = eventName && eventName.toUpperCase().includes('TUG OF WAR');
      
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
            <h2>Team: <span class="temple-name">${temple.temple_name || temple.registration_id}</span></h2>
            <p>Total Members: ${participants.length}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>SL.NO</th>
                <th>MEMBER NAME</th>
                <th>AADHAAR NUMBER</th>
                <th>PHONE</th>
                ${isTugOfWar ? '<th>WEIGHT</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${participants.map((participant, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${participant.first_name} ${participant.last_name || ''}</td>
                  <td>${participant.aadhar_number || 'N/A'}</td>
                  <td>${participant.phone || 'N/A'}</td>
                  ${isTugOfWar ? '<td></td>' : ''}
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
      // console.error('Error printing team participants:', error);
      // alert('Error loading team participant details for printing');
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
                // Preserve scroll position to prevent jumping to top
                const scrollY = window.scrollY;
                
                if (registrationId) {
                  setTeamRankChange(teamEvent.id, registrationId, e.target.value);
                }
                
                // Restore scroll position after React updates the DOM
                setTimeout(() => {
                  window.scrollTo(0, scrollY);
                }, 0);
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
        <div className="bg-white p-6 rounded shadow-lg min-w-[300px] max-w-lg">
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
          
          {modalDetails && (
            <div className="mb-4 text-sm">
              {modalDetails.changes && (
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-xs font-semibold text-[#2A2A2A] mb-2">Changes to be made:</p>
                  <ul className="list-disc list-inside space-y-2">
                    {modalDetails.changes.map((change, index) => (
                      <li key={index} className="text-xs text-[#5A5A5A]">
                        <div className="space-y-1">
                          <div>
                            <span className="font-semibold">{change.temple || change.name || 'Unknown Temple'}</span> - {change.rank === 'FIRST' ? '🥇 1st' : change.rank === 'SECOND' ? '🥈 2nd' : change.rank === 'THIRD' ? '🥉 3rd' : change.rank}
                          </div>
                          {change.isMixed && change.participants && (
                            <div className="ml-4 text-[#5A5A5A] space-y-0.5">
                              {change.participants.male && change.participants.male !== 'None' && (
                                <div className="text-[10px]">
                                  <span className="font-medium">Male:</span> {change.participants.male}
                                </div>
                              )}
                              {change.participants.female && change.participants.female !== 'None' && (
                                <div className="text-[10px]">
                                  <span className="font-medium">Female:</span> {change.participants.female}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!modalDetails.changes && Object.entries(modalDetails).map(([key, value]) => (
                key !== 'changes' && (
                  <p key={key} className="text-xs text-[#5A5A5A]">
                    <span className="font-semibold">{key}:</span> {value}
                  </p>
                )
              ))}
            </div>
          )}
          
          {modalType === 'confirm' && (
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 text-[#2A2A2A] rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (pendingUpdate?.isTeamUpdate) {
                    executeBulkTeamResultUpdate();
                  } else {
                    executeTeamResultUpdate();
                  }
                }}
                className={`${getModalButtonColor()} text-white px-4 py-2 rounded transition`}
              >
                Confirm
              </button>
            </div>
          )}
          
          {/* Close button for info and error modals */}
          {(modalType === 'info' || modalType === 'error') && (
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className={`${getModalButtonColor()} text-white px-4 py-2 rounded-lg hover:opacity-90 transition`}
              >
                Close
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

  const groupedTeamEvents = groupEventsByGender(data);

  return (
    <div className="space-y-8">
      {/* Modal */}
      <Modal />
      
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
                 Male Team Events
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
                             {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} participants
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
                                          // Preserve scroll position to prevent jumping to top
                                          const scrollY = window.scrollY;
                                          
                                          if (temple.registration_ids && temple.registration_ids.length > 0) {
                                            setTeamRankChange(teamEvent.id, temple.registration_ids[0], e.target.value);
                                          }
                                          
                                          // Restore scroll position after React updates the DOM
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 0);
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
                      {/* <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
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
                      </div> */}
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
                 Female Team Events
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
                            {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} participants
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
                                          // Preserve scroll position to prevent jumping to top
                                          const scrollY = window.scrollY;
                                          
                                          if (temple.registration_ids && temple.registration_ids.length > 0) {
                                            setTeamRankChange(teamEvent.id, temple.registration_ids[0], e.target.value);
                                          }
                                          
                                          // Restore scroll position after React updates the DOM
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 0);
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
                      {/* <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
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
                      </div> */}
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
                Mixed Gender Team Events
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
                            {teamEvent.gender} • {teamEvent.event_type?.participant_count || teamEvent.member_count || 'Team'} partcipants
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
                              {/* Flatten all teams across temples for sequential numbering */}
                              {teamEvent.registered_temples
                                .flatMap((temple, templeIndex) => 
                                  (temple.registration_ids || []).map((registrationId, teamIndex) => ({
                                    registrationId,
                                    temple,
                                    key: `${templeIndex}-${teamIndex}`
                                  }))
                                )
                                .map((row, flatIndex) => (
                                  <MixedTeamRow
                                    key={row.key}
                                    registrationId={row.registrationId}
                                    temple={row.temple}
                                    teamEvent={teamEvent}
                                    rowIndex={flatIndex + 1}
                                    getTeamParticipantDetails={getTeamParticipantDetails}
                                    fetchTeamParticipantDetails={fetchTeamParticipantDetails}
                                    getTeamRankChanges={getTeamRankChanges}
                                    setTeamRankChange={setTeamRankChange}
                                    printTeamParticipants={printTeamParticipants}
                                  />
                                ))
                              }
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-[#5A5A5A]">No temples have registered for this team event yet.</p>
                        </div>
                      )}
                      
                      {/* Event Details */}
                      {/* <div className="mt-6 pt-4 border-t border-[#F8DFBE]">
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
                      </div> */}
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

export default UpdateTeamResult;

