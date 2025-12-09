import React, { useState, useEffect } from 'react';
import { eventAPI, systemAPI } from '../utils/api';

const UpdateIndividualResult = () => {
  // State management
  const [selectedAge, setSelectedAge] = useState('0-5');
  const [selectedGender, setSelectedGender] = useState('MALE');
  const [ageGroups, setAgeGroups] = useState([]);
  const [genders, setGenders] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('success'); // 'success', 'error', 'info', 'confirm'
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalDetails, setModalDetails] = useState(null);
  const [pendingUpdate, setPendingUpdate] = useState(null); // Store pending update data

  // For collapsible event states
  const [collapsibleStates, setCollapsibleStates] = useState({});
  
  // For event participants data
  const [eventParticipantsData, setEventParticipantsData] = useState({});
  const [loadingParticipants, setLoadingParticipants] = useState({});
  const [participantErrors, setParticipantErrors] = useState({});
  
  // For tracking rank changes
  const [rankChanges, setRankChanges] = useState({});
  
  // State for all heats data
  const [allHeatsData, setAllHeatsData] = useState({});
  
  // State for selected heat per event
  const [selectedHeats, setSelectedHeats] = useState({});
  
  // State for tracking if Final Heat is selected per event
  const [finalHeatSelected, setFinalHeatSelected] = useState({});
  
  // State for lane count from settings
  const [laneCount, setLaneCount] = useState(8); // Default to 8 if not fetched

  // Helper functions for collapsible state management
  const getCollapsibleState = (eventId) => {
    return collapsibleStates[eventId] || false;
  };

  const setCollapsibleState = (eventId, isOpen) => {
    setCollapsibleStates(prev => {
      // If opening an event, close all others (accordion behavior)
      if (isOpen) {
        return { [eventId]: true };
      }
      // If closing, just close this one
      return {
      ...prev,
        [eventId]: false
      };
    });
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

  // Helper functions for heats data management
  const getHeatsData = (eventId) => {
    return allHeatsData[eventId] || {};
  };

  const setHeatsData = (eventId, heats) => {
    setAllHeatsData(prev => ({
      ...prev,
      [eventId]: heats
    }));
  };

  // Helper functions for selected heat management
  const getSelectedHeat = (eventId) => {
    return selectedHeats[eventId] || null;
  };

  const setSelectedHeatForEvent = (eventId, heat) => {
    setSelectedHeats(prev => ({
      ...prev,
      [eventId]: heat
    }));
  };

  // Helper functions for Final Heat selection management
  const isFinalHeatSelected = (eventId) => {
    return finalHeatSelected[eventId] || false;
  };

  const setFinalHeatSelectedForEvent = (eventId, isSelected) => {
    setFinalHeatSelected(prev => ({
      ...prev,
      [eventId]: isSelected
    }));
  };

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

  // Fetch lane count from settings on mount
  useEffect(() => {
    const fetchLaneCount = async () => {
      try {
        const setting = await systemAPI.getSetting('lane_count');
        if (setting && setting.value) {
          const count = parseInt(setting.value, 10);
          if (!isNaN(count) && count > 0) {
            setLaneCount(count);
          }
        }
      } catch (error) {
        console.error('Error fetching lane count setting:', error);
        // Keep default value of 8 if fetch fails
      }
    };
    fetchLaneCount();
  }, []);

  // Load data on mount and when filters change
  useEffect(() => {
    fetchUpdateResultsData();
  }, [selectedAge, selectedGender]);

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
          
          // Also refresh heats data if this is a heat event (needed for final heat rank updates)
          const currentEvent = events.find(e => e.id === parseInt(eventId));
          if (currentEvent && currentEvent.event_type && currentEvent.event_type.name) {
            const eventName = currentEvent.event_type.name.toLowerCase();
            const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
            if (isHeat) {
              console.log('Refreshing heats data for heat event:', eventId);
              try {
                const updatedHeatsData = await eventAPI.getHeats(eventId);
                setHeatsData(eventId, updatedHeatsData); // Update parent state, which will trigger useEffect in CollapsibleEvent
              } catch (heatsError) {
                console.error('Error refreshing heats data after individual update:', heatsError);
              }
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

  // Handle bulk result updates individual events
  const handleBulkResultUpdate = async (eventId, eventName, ageCategory) => {
    // Preserve scroll position to prevent jumping to top
    const scrollY = window.scrollY;
    
    const changes = getRankChanges(eventId);
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
      // Show confirmation modal with all changes
      const participants = getEventParticipants(eventId);
      console.log('Available participants:', participants.map(p => ({ id: p.id, idType: typeof p.id, name: p.participant_name || p.team_name })));
      console.log('Change entries:', changeEntries.map(([id, rank]) => ({ id, idType: typeof id, rank })));
      
      const changesList = changeEntries.map(([participantId, rank]) => {
        // Convert both IDs to strings for comparison to handle type mismatches
        const participant = participants.find(p => String(p.id) === String(participantId));
        console.log(`Looking for participant ${participantId} (${typeof participantId}):`, participant ? 'Found' : 'Not found');
        
        if (!participant) {
          console.warn(`Participant with ID ${participantId} not found in event ${eventId}`);
        }
        
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
      
      // Restore scroll position after modal is shown
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
    } catch (error) {
      console.error('Error preparing bulk update:', error);
      showErrorModal('Error', 'Failed to prepare bulk update.');
      // Restore scroll position
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
    }
  };

  // Execute bulk result updates individual events
  const executeBulkResultUpdate = async () => {
    if (!pendingUpdate || !pendingUpdate.eventId) return;

    // Preserve scroll position to prevent jumping to top
    const scrollY = window.scrollY;

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
      
      // Also refresh heats data if this is a heat event (needed for final heat rank updates)
      const currentEvent = events.find(e => e.id === parseInt(eventId));
      if (currentEvent && currentEvent.event_type && currentEvent.event_type.name) {
        const eventName = currentEvent.event_type.name.toLowerCase();
        const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
        if (isHeat) {
          console.log('Bulk update - refreshing heats data for heat event:', eventId);
          try {
            const updatedHeatsData = await eventAPI.getHeats(eventId);
            setHeatsData(eventId, updatedHeatsData); // Update parent state, which will trigger useEffect in CollapsibleEvent
          } catch (heatsError) {
            console.error('Error refreshing heats data after bulk update:', heatsError);
          }
        }
      }
      
      // Close the confirmation modal and show success modal
      closeModal();
      
      // Restore scroll position after DOM updates
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
      
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
        // Restore scroll position again after success modal is shown
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
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
      // Restore scroll position after error modal is shown
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
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
    handleBulkResultUpdate,
    getHeatsData,
    setHeatsData,
    getSelectedHeat,
    setSelectedHeatForEvent,
    isFinalHeatSelected,
    setFinalHeatSelectedForEvent,
    laneCount
  }) => {
    // Use parent-managed state
    const eventParticipants = getEventParticipants(eventId);
    const loadingParticipants = getLoadingParticipants(eventId);
    const participantError = getParticipantError(eventId);
    
    // Get heats and selectedHeat from parent state, and manage local states
    const [trialMeasurements, setTrialMeasurements] = useState({});
    const [heats, setHeats] = useState(() => getHeatsData(eventId)); // Initialize from parent state
    const selectedHeat = getSelectedHeat(eventId); // Use parent-managed selectedHeat
    const [showFinalHeat, setShowFinalHeat] = useState(false); // Local UI state for showing final heat
    const [timings, setTimings] = useState({});
    const [finalHeatParticipants, setFinalHeatParticipants] = useState([]);
    const [loadingHeats, setLoadingHeats] = useState(false);
    const [savingTimings, setSavingTimings] = useState(false);
    const [savingTrials, setSavingTrials] = useState(false);
    const [expandedCard, setExpandedCard] = useState(null); // Track which card is expanded for mobile

    // Debug: Log when finalHeatParticipants changes
    React.useEffect(() => {
      console.log('🔍 finalHeatParticipants state changed:', finalHeatParticipants.length, 'participants');
      if (finalHeatParticipants.length > 0) {
        console.log('Final heat participants:', finalHeatParticipants.map(p => ({
          id: p.id,
          idType: typeof p.id,
          name: p.participant_name || p.team_name,
          timing: p.timing
        })));
        
        // Verify all participants have valid IDs
        const allIds = finalHeatParticipants.map(p => String(p.id));
        console.log('All participant IDs (as strings):', allIds);
      } else {
        console.log('⚠️ finalHeatParticipants is empty');
      }
    }, [finalHeatParticipants]);

    // Use ref to track previous parent heats data to detect changes
    const prevParentHeatsRef = React.useRef({});
    
    // Sync local heats state with parent state when eventId changes
    React.useEffect(() => {
      const parentHeats = getHeatsData(eventId);
      if (Object.keys(parentHeats).length > 0) {
        setHeats(parentHeats);
        prevParentHeatsRef.current[eventId] = parentHeats;
        
        // Also ensure selectedHeat is set if it's the first time loading
        // But don't reset if Final Heat is currently selected
        const currentSelectedHeat = getSelectedHeat(eventId);
        const isFinalSelected = isFinalHeatSelected(eventId);
        const heatNumbers = Object.keys(parentHeats).map(Number).sort((a, b) => a - b);
        if (heatNumbers.length > 0 && !isFinalSelected && (currentSelectedHeat === null || !parentHeats[currentSelectedHeat])) {
          setSelectedHeatForEvent(eventId, heatNumbers[0]);
        }
      }
      
      // Sync showFinalHeat with parent's finalHeatSelected state
      const isFinalSelected = isFinalHeatSelected(eventId);
      setShowFinalHeat(isFinalSelected);
    }, [eventId]); // Run when eventId changes
    
    // Check for parent heats data changes on every render (for rank updates)
    React.useEffect(() => {
      const parentHeats = getHeatsData(eventId);
      const parentHeatsStr = JSON.stringify(parentHeats);
      const prevParentHeatsStr = JSON.stringify(prevParentHeatsRef.current[eventId] || {});
      
      // Update if parent heats data changed (e.g., after rank update)
      if (Object.keys(parentHeats).length > 0 && parentHeatsStr !== prevParentHeatsStr) {
        setHeats(parentHeats);
        prevParentHeatsRef.current[eventId] = parentHeats;
      }
    }); // Run on every render to detect parent heats data changes

    // Auto-populate top participants (based on lane_count) when Final Heat is shown and finalHeatParticipants is empty
    React.useEffect(() => {
      if (showFinalHeat && finalHeatParticipants.length === 0 && Object.keys(heats).length > 0) {
        const participantsWithTimings = getAllParticipantsWithTimings();
        if (participantsWithTimings.length > 0) {
          const sortedParticipants = participantsWithTimings.sort((a, b) => a.timingSeconds - b.timingSeconds);
          const topParticipants = sortedParticipants.slice(0, laneCount);
          // Merge rank data from eventParticipants (where ranks are stored)
          const participantsWithRanks = topParticipants.map(p => {
            const participantWithRank = eventParticipants.find(ep => String(ep.id) === String(p.id));
            return {
              ...p,
              result: participantWithRank?.result || p.result
            };
          });
          setFinalHeatParticipants([...participantsWithRanks]);
        }
      }
    }, [showFinalHeat, heats, eventParticipants, laneCount]); // Run when showFinalHeat changes or heats/eventParticipants data changes

    // Update finalHeatParticipants with refreshed rank data when heats data or eventParticipants changes and final heat is shown
    React.useEffect(() => {
      if (showFinalHeat && finalHeatParticipants.length > 0 && (Object.keys(heats).length > 0 || eventParticipants.length > 0)) {
        // Update existing final heat participants with fresh data from heats and eventParticipants (including updated ranks)
        setFinalHeatParticipants(prevParticipants => {
          return prevParticipants.map(prevParticipant => {
            let updatedParticipant = null;
            let foundHeatNumber = null;
            
            // First, search through all heats to find this participant with updated data
            for (const [heatNumber, heatParticipants] of Object.entries(heats)) {
              const found = heatParticipants.find(p => String(p.id) === String(prevParticipant.id));
              if (found) {
                updatedParticipant = found;
                foundHeatNumber = parseInt(heatNumber);
                break;
              }
            }
            
            // Also check eventParticipants for rank data (result.rank) - this is where ranks are stored
            const participantWithRank = eventParticipants.find(p => String(p.id) === String(prevParticipant.id));
            
            // Merge data: use heats data for performance/timing, but use eventParticipants for rank data
            if (updatedParticipant || participantWithRank) {
              return {
                ...(updatedParticipant || prevParticipant),
                // Merge rank data from eventParticipants if available (this is where ranks are stored)
                result: participantWithRank?.result || updatedParticipant?.result || prevParticipant.result,
                // Preserve timing and heatNumber
                timing: prevParticipant.timing || updatedParticipant?.performance_1 || '',
                timingSeconds: prevParticipant.timingSeconds || parseTiming(updatedParticipant?.performance_1),
                heatNumber: prevParticipant.heatNumber || foundHeatNumber
              };
            }
            
            // If not found, return original participant
            return prevParticipant;
          });
        });
      }
    }, [heats, eventParticipants, showFinalHeat]); // Run when heats data or eventParticipants changes and final heat is shown

    // Check if this event requires trial measurements
    const isTrialEvent = () => {
      const eventName = title.toLowerCase();
      return eventName.includes('long-jump') || eventName.includes('shot put') || eventName.includes('long jump');
    };

    // Check if this event requires heats (running events)
    const isHeatEvent = () => {
      const eventName = title.toLowerCase();
      const isHeat = eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
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
      // Preserve scroll position to prevent jumping to top
      const scrollY = window.scrollY;
      
      if (showFinalHeat) {
        // Save final heat timings - only update performance_2
        if (!finalHeatParticipants || finalHeatParticipants.length === 0) {
          // Restore scroll position
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
          return;
        }
        
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
            // Restore scroll position
            setTimeout(() => {
              window.scrollTo(0, scrollY);
            }, 0);
            return;
          }
          
          await eventAPI.saveFinalTimings(eventId, timingsArray);
          console.log('Final heat timings updated successfully');
          
          // Refresh heats to get updated data (force refresh after successful save)
          // Fetch the updated heats data directly to use for updating finalHeatParticipants
          const updatedHeatsData = await eventAPI.getHeats(eventId);
          console.log('Refreshed heats data after saving final timings:', updatedHeatsData);
          
          // Update heats state with refreshed data
          setHeats(updatedHeatsData);
          setHeatsData(eventId, updatedHeatsData); // Update parent state
          
          // Update finalHeatParticipants with refreshed performance_2 values from updated heats
          // Since participants in finalHeatParticipants come from different heats,
          // we need to find each participant in the refreshed heats and update their performance_2
          setFinalHeatParticipants(prevParticipants => {
            return prevParticipants.map(participant => {
              // Search through all heats to find this participant
              let updatedParticipant = { ...participant };
              for (const [heatNumber, heatParticipants] of Object.entries(updatedHeatsData)) {
                const found = heatParticipants.find(p => String(p.id) === String(participant.id));
                if (found) {
                  // Update with the refreshed performance_2 from the database
                  updatedParticipant = {
                    ...participant,
                    performance_2: found.performance_2 || participant.performance_2
                  };
                  console.log(`Updated participant ${participant.id} performance_2: ${found.performance_2}`);
                  break;
                }
              }
              return updatedParticipant;
            });
          });
          
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
          
          // Restore scroll position after modal is shown
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
        } catch (error) {
          console.error('Error saving final heat timings:', error);
          showErrorModal(
            'Update Failed',
            'Failed to update final heat timings. Please try again.',
            {
              error: error.message
            }
          );
          // Restore scroll position after error modal is shown
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
        } finally {
          setSavingTimings(false);
        }
      } else {
        // Save regular heat timings - only update performance_1
        if (!selectedHeat || !heats[selectedHeat]) {
          // Restore scroll position
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
          return;
        }
        
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
            // Restore scroll position
            setTimeout(() => {
              window.scrollTo(0, scrollY);
            }, 0);
            return;
          }
          
          await eventAPI.saveTimings(eventId, selectedHeat, timingsArray);
          console.log('Heat timings updated successfully');
          
          // Refresh heats to get updated data (force refresh after successful save)
          await fetchHeats(true);
          
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
          
          // Restore scroll position after DOM updates and modal is shown
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
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
          // Restore scroll position after error modal is shown
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
        } finally {
          setSavingTimings(false);
        }
      }
    };

    // Save trial measurements for trial events
    const saveTrials = async () => {
      // Preserve scroll position to prevent jumping to top
      const scrollY = window.scrollY;
      
      if (!isTrialEvent()) {
        // Restore scroll position
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
        return;
      }
      
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
          // Restore scroll position
          setTimeout(() => {
            window.scrollTo(0, scrollY);
          }, 0);
          return;
        }
        
        await eventAPI.saveTrials(eventId, trialsArray);
        console.log('Trials updated successfully');
        
        // Refresh the participants data to show updated trial measurements
        const updatedData = await eventAPI.getEventParticipants(eventId);
        setEventParticipants(eventId, updatedData);
        
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
        
        // Restore scroll position after modal is shown
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
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
        // Restore scroll position after error modal is shown
        setTimeout(() => {
          window.scrollTo(0, scrollY);
        }, 0);
      } finally {
        setSavingTrials(false);
      }
    };

    // Fetch heats from backend - ADD CHECK FOR EXISTING DATA
    const fetchHeats = async (forceRefresh = false) => {
      console.log('fetchHeats called for event:', title, 'eventId:', eventId, 'forceRefresh:', forceRefresh);
      
      if (!isHeatEvent()) {
        console.log('Not a heat event, skipping heat fetch');
        return;
      }
      
      // Check if heats are already in state
      if (!forceRefresh && Object.keys(heats).length > 0) {
        console.log('Heats already fetched, skipping API call.');
        return;
      }
      
      try {
        console.log(`Fetching heats for eventId: ${eventId}`);
        setLoadingHeats(true);
        const heatsData = await eventAPI.getHeats(eventId);
        console.log('Heats data received:', heatsData);
        console.log('Number of heats:', Object.keys(heatsData).length);
        
        // Update both local and parent state
        setHeats(heatsData);
        setHeatsData(eventId, heatsData); // Update parent state
        
        // Preserve existing selectedHeat - only set if null or invalid
        const heatNumbers = Object.keys(heatsData).map(Number).sort((a, b) => a - b);
        console.log('Heat numbers found:', heatNumbers);
        
        // Check if the current selected heat is still valid or if one needs to be set
        // But don't reset if Final Heat is currently selected
        const currentSelectedHeat = getSelectedHeat(eventId);
        const isFinalSelected = isFinalHeatSelected(eventId);
        if (!isFinalSelected && (currentSelectedHeat === null || !heatsData[currentSelectedHeat])) {
          if (heatNumbers.length > 0) {
            setSelectedHeatForEvent(eventId, heatNumbers[0]);
            console.log(`Selected heat was null or invalid. Set selected heat to: ${heatNumbers[0]}`);
          } else {
            setSelectedHeatForEvent(eventId, null);
            console.log('No heats found in the data, selectedHeat set to null');
          }
        } else if (isFinalSelected) {
          // Final Heat is selected, preserve null selection
          console.log(`Final Heat is selected, preserving null selectedHeat`);
        } else {
          // SelectedHeat is already set and valid, so do nothing, preserving the current selection.
          console.log(`Preserving existing selected heat: ${currentSelectedHeat}`);
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

    // Generate final heat with top participants (based on lane_count)
    const generateFinalHeat = () => {
      try {
        console.log('=== GENERATING FINAL HEAT ===');
        console.log('Current heats:', heats);
        console.log('Current timings state:', timings);
        
        const participantsWithTimings = getAllParticipantsWithTimings();
        console.log('Participants with timings found:', participantsWithTimings.length);
        
        if (participantsWithTimings.length === 0) {
          console.warn('No participants with timings found');
          console.log('Heats data:', heats);
          console.log('Timings state:', timings);
          // Show info modal to user if available
          if (typeof showInfoModal === 'function') {
            showInfoModal(
              'No Timings Available',
              'Please enter and save heat timings for participants before generating the final heat.',
              {
                'Heats available': Object.keys(heats).length,
                'Participants with timings': 0
              }
            );
          }
          // Clear final heat participants
          setFinalHeatParticipants([]);
          return;
        }
        
        // Sort by timing (fastest first)
        const sortedParticipants = [...participantsWithTimings].sort((a, b) => a.timingSeconds - b.timingSeconds);
        
        console.log('=== FINAL HEAT GENERATION ===');
        console.log(`Total participants with timings: ${participantsWithTimings.length}`);
        console.log('All participants sorted by time:');
        sortedParticipants.forEach((participant, index) => {
          console.log(`${index + 1}. ${participant.participant_name} (${participant.temple_name}) - Heat ${participant.heatNumber} - ${participant.timing} (${participant.timingSeconds}s)`);
        });
        
        // Take top participants based on lane_count
        const topParticipants = sortedParticipants.slice(0, laneCount);
        
        console.log(`\n=== TOP ${laneCount} FOR FINAL HEAT ===`);
        topParticipants.forEach((participant, index) => {
          console.log(`${index + 1}. ${participant.participant_name} (${participant.temple_name}) - Heat ${participant.heatNumber} - ${participant.timing} (${participant.timingSeconds}s)`);
        });
        
        // Show heat distribution
        const heatDistribution = {};
        topParticipants.forEach(participant => {
          const heat = participant.heatNumber;
          heatDistribution[heat] = (heatDistribution[heat] || 0) + 1;
        });
        console.log('Heat distribution in final:', heatDistribution);
        
        // Update state - ensure we're setting the correct data
        console.log(`Setting final heat participants: ${topParticipants.length}`);
        console.log(`Top ${laneCount} participants data:`, topParticipants);
        console.log(`Top ${laneCount} participant IDs:`, topParticipants.map(p => p.id));
        
        // Set the final heat participants directly
        // Create a new array to ensure React detects the change
        // Preserve all original properties and ensure ID is consistent
        // Also merge rank data from eventParticipants (where ranks are stored)
        const newFinalHeatParticipants = topParticipants.map(p => {
          // Find corresponding participant in eventParticipants to get rank data
          const participantWithRank = eventParticipants.find(ep => String(ep.id) === String(p.id));
          
          const participant = {
            ...p,
            // Ensure ID is preserved as-is (could be string or number)
            id: p.id,
            participant_name: p.participant_name || p.team_name,
            temple_name: p.temple_name,
            timing: p.timing,
            timingSeconds: p.timingSeconds,
            heatNumber: p.heatNumber,
            // Merge rank data from eventParticipants (this is where ranks are stored)
            result: participantWithRank?.result || p.result
          };
          return participant;
        });
        
        console.log('New final heat participants array:', newFinalHeatParticipants);
        console.log('Participant IDs in final heat:', newFinalHeatParticipants.map(p => ({ id: p.id, type: typeof p.id })));
        
        // Force a state update by creating a completely new array reference
        setFinalHeatParticipants([...newFinalHeatParticipants]);
        setShowFinalHeat(true);
        setFinalHeatSelectedForEvent(eventId, true);
        
        // Log for debugging
        console.log('State update called with', newFinalHeatParticipants.length, 'participants');
        
        // Verify the state was set
        console.log('✅ Final heat participants state updated');
        console.log('State should now contain:', newFinalHeatParticipants.length, 'participants');
        
        // Success - final heat generated
        const heatCounts = Object.entries(heatDistribution).map(([heat, count]) => `Heat ${heat}: ${count}`).join(', ');
        console.log(`✅ Final heat generated successfully! Top ${laneCount} participants selected from all heats: ${heatCounts}`);
        
      } catch (error) {
        console.error('❌ Error generating final heat:', error);
        console.error('Error stack:', error.stack);
      }
    };

    // Handle final heat participant selection
    const handleFinalHeatSelection = (participantId, isSelected) => {
      const participantIdStr = String(participantId);
      
      if (isSelected) {
        // Add to final heat if not already there
        let participant = null;
        
        // Find participant in heats data - compare as strings
        Object.values(heats).forEach(heatParticipants => {
          const found = heatParticipants.find(p => String(p.id) === participantIdStr);
          if (found) {
            participant = found;
          }
        });
        
        // Fallback to eventParticipants if not found in heats
        if (!participant) {
          participant = eventParticipants.find(p => String(p.id) === participantIdStr);
        }
        
        // Check if already in final heat - compare as strings
        const alreadySelected = finalHeatParticipants.find(p => String(p.id) === participantIdStr);
        
        if (participant && !alreadySelected) {
          setFinalHeatParticipants(prev => [...prev, {
            ...participant,
            timing: participant.performance_1 || timings[participantId] || '',
            timingSeconds: parseTiming(participant.performance_1 || timings[participantId])
          }]);
        }
      } else {
        // Remove from final heat - compare as strings
        setFinalHeatParticipants(prev => prev.filter(p => String(p.id) !== participantIdStr));
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
              Participants: ${finalHeatParticipants.length}/${laneCount} | Top performers from all heats<br>
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

    const handleToggle = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Preserve scroll position to prevent jumping to top
      const scrollY = window.scrollY;
      
      if (!isOpen) {
        fetchEventParticipants();
        fetchTrials(); // Fetch trial data for trial events
        
        // Call fetchHeats here only when opening
        if (isHeatEvent()) {
          fetchHeats();
        }
      }
      setIsOpen(!isOpen);
      
      // Restore scroll position after React updates the DOM
      // Use setTimeout to ensure DOM has been updated
      setTimeout(() => {
        window.scrollTo(0, scrollY);
      }, 0);
    };

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
        className="border border-gray-200 rounded-lg mb-3 transition-all duration-200"
      >
        <div className="sticky top-16 z-30 bg-[#F0F0F0]  flex justify-between items-center">
          <button
            type="button"
            className="flex-1 px-2 py-1 md:px-4 md:py-3 text-left bg-[#F8DFBE] hover:bg-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#D35D38] rounded-lg flex justify-between items-center"
            onClick={handleToggle}
          >
            <span className="font-medium text-sm md:text-base text-[#2A2A2A]">{title}</span>
            <svg 
              className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#5A5A5A] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && eventParticipants.length > 0 && (
            <button
              onClick={handlePrint}
              className="hidden md:block ml-2 px-3 py-3 bg-[#D35D38] text-white rounded-lg hover:bg-[#B84A2E] focus:outline-none focus:ring-2 focus:ring-[#D35D38] transition"
              title="Print participants list"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </button>
          )}
        </div>
        {isOpen && (
          <div className="p-2 md:p-4 mt-[2px] bg-white">
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
                  <div className="bg-[#F8DFBE] p-3 md:p-4 rounded-lg">
                    {/* Header Row - Label and Refresh Button */}
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm md:text-base font-semibold text-[#2A2A2A]">Select Heat:</label>
                        <button
                          onClick={() => fetchHeats(true)}
                        className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          title="Refresh heats"
                        >
                          🔄 Refresh
                        </button>
                    </div>
                    
                    {/* Heat Selection Chips - Horizontal Scrollable */}
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="flex gap-2 pb-2 pl-1 min-w-max">
                          {Object.keys(heats).map((heatNumber) => (
                            <button
                              key={heatNumber}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                setSelectedHeatForEvent(eventId, parseInt(heatNumber));
                                setShowFinalHeat(false);
                                setFinalHeatSelectedForEvent(eventId, false);
                              }}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                                selectedHeat === parseInt(heatNumber) && !showFinalHeat
                                ? 'bg-[#D35D38] text-white shadow-md scale-105'
                                : 'bg-white text-[#2A2A2A] hover:bg-gray-100 hover:shadow-sm border border-gray-200'
                              }`}
                            >
                            Heat {heatNumber}
                            <span className="ml-1 text-[10px] md:text-xs opacity-75">({heats[heatNumber].length})</span>
                            </button>
                          ))}
                          {Object.keys(heats).length > 0 && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                
                                console.log('🏁 Final Heat button clicked');
                                console.log('Current heats:', heats);
                                console.log('Current timings:', timings);
                                
                                // Set Final Heat as selected first
                                setShowFinalHeat(true);
                                setFinalHeatSelectedForEvent(eventId, true);
                                setSelectedHeatForEvent(eventId, null);
                                
                                // Immediately generate final heat - it will check for participants with timings
                                console.log('Calling generateFinalHeat immediately...');
                                generateFinalHeat();
                              }}
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-medium transition-all whitespace-nowrap ${
                                showFinalHeat
                                ? 'bg-green-600 text-white shadow-md scale-105'
                                : 'bg-green-100 text-green-800 hover:bg-green-200 hover:shadow-sm border border-green-300'
                              }`}
                            >
                            🏁 Final Heat
                            <span className="ml-1 text-[10px] md:text-xs opacity-75">({finalHeatParticipants.length}/{laneCount})</span>
                            </button>
                          )}
                        </div>
                      </div>
                    
                    {/* Selected Heat Info */}
                    {selectedHeat && (
                      <div className="hidden md:block mt-3 text-xs md:text-sm text-[#5A5A5A] bg-white p-2 rounded">
                        <strong>Heat {selectedHeat}:</strong> {heats[selectedHeat]?.length || 0} participants
                        {heats[selectedHeat]?.length > 0 && (
                          <span className="ml-2">
                            (Temples: {[...new Set(heats[selectedHeat].map(p => p.temple_name))].join(', ')})
                          </span>
                        )}
                      </div>
                    )}
                    {showFinalHeat && (
                      <div className="hidden md:block mt-3 text-xs md:text-sm text-[#5A5A5A] bg-white p-2 rounded">
                        <strong>🏁 Final Heat:</strong> {finalHeatParticipants.length}/{laneCount} participants
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
                  </div>
                )}

                {/* Final Heat Management - Desktop Only */}
                {isHeatEvent() && showFinalHeat && Object.keys(heats).length > 0 && (
                  <div className="hidden md:block bg-[#E8F5E8] p-4 rounded-lg border-2 border-green-300">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-lg font-semibold text-[#2A2A2A]">🏁 Final Heat</h4>
                        <button
                          onClick={generateFinalHeat}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Auto Select Top {laneCount}
                        </button>
                      </div>
                      
                      <div className="bg-white p-3 rounded border">
                        <h5 className="font-medium text-[#2A2A2A] mb-2">Final Heat Participants ({finalHeatParticipants.length}/{laneCount})</h5>
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
                              {(() => {
                                const sortedParticipants = getAllParticipantsWithTimings()
                                  .sort((a, b) => a.timingSeconds - b.timingSeconds);
                                
                                return sortedParticipants.map((participant, index) => {
                                  // Simple: Top participants (based on lane_count) are automatically selected
                                  // OR if they're already in finalHeatParticipants
                                  const participantIdStr = String(participant.id);
                                  const isInFinalHeat = finalHeatParticipants.some(p => String(p.id) === participantIdStr);
                                  const isTopParticipant = index < laneCount;
                                  const isSelected = isInFinalHeat || isTopParticipant;
                                  
                                  // Find which heat this participant belongs to
                                  let heatNumber = 0;
                                  Object.entries(heats).forEach(([heatNum, heatParticipants]) => {
                                    if (heatParticipants.find(p => String(p.id) === participantIdStr)) {
                                      heatNumber = parseInt(heatNum);
                                    }
                                  });
                                  
                                  return (
                                    <tr key={participant.id} className="border-b">
                                      <td className="px-2 py-1">
                                        <input
                                          type="checkbox"
                                          checked={isSelected}
                                          onChange={(e) => handleFinalHeatSelection(participant.id, e.target.checked)}
                                          disabled={!isSelected && finalHeatParticipants.length >= laneCount}
                                          className="rounded"
                                        />
                                      </td>
                                      <td className="px-2 py-1">{participant.participant_name || participant.team_name}</td>
                                      <td className="px-2 py-1">{participant.temple_name}</td>
                                      <td className="px-2 py-1 font-bold text-green-600">{participant.timing}</td>
                                      <td className="px-2 py-1">Heat {heatNumber}</td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                 {/*  trial event code start from here */}
                
                {/* Action buttons for mobile - shown above cards */}
                <div className="md:hidden sticky top-[100px] z-20 bg-white pt-2 pb-2 -mx-2 px-2 space-y-2">
                  {/* All Buttons - Horizontal Layout */}
                  <div className="flex gap-2">
                    {/* Update Timings Button */}
                    {isHeatEvent() && (selectedHeat || showFinalHeat) && (
                      <button
                        onClick={saveHeatTimings}
                        disabled={savingTimings}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {savingTimings ? 'Updating...' : 'Update Timings'}
                      </button>
                    )}
                    
                    {/* Update Results Button */}
                    {(!isHeatEvent() || (isHeatEvent() && showFinalHeat)) && (
                      <button
                        onClick={() => handleBulkResultUpdate(eventId, title, ageCategory)}
                        className={`flex-1 px-3 py-1.5 rounded-lg transition-colors font-medium text-sm ${
                          Object.keys(getRankChanges(eventId)).length > 0
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-[#D35D38] text-white hover:bg-[#B84A2E]'
                        }`}
                      >
                        Update Results {Object.keys(getRankChanges(eventId)).length > 0 && `(${Object.keys(getRankChanges(eventId)).length})`}
                      </button>
                    )}
                    
                    {/* Save Trials Button */}
                    {isTrialEvent() && (
                      <button
                        onClick={saveTrials}
                        disabled={savingTrials}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                      >
                        {savingTrials ? 'Saving...' : 'Save Trials'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card View for Mobile */}
                <div className="block md:hidden space-y-2">
                  {(isHeatEvent() && showFinalHeat ? finalHeatParticipants : 
                    isHeatEvent() && selectedHeat ? heats[selectedHeat] || [] : 
                    eventParticipants).map((participant, index) => {
                      const isExpanded = expandedCard === participant.id;
                      return (
                      <div key={participant.id || index} className="bg-white border-2 border-[#F8DFBE] rounded-lg shadow-sm overflow-hidden">
                        {/* Card Header - Always visible and clickable */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                          onClick={() => setExpandedCard(isExpanded ? null : participant.id)}
                        >
                          <div className="space-y-2">
                            {/* Participant Name Row */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-black text-xs font-bold">
                                 {index + 1}.
                                </span>
                                <h4 className=" text-[#2A2A2A] text-m">
                                  {participant.participant_name || participant.team_name}
                                </h4>
                              </div>
                              {/* Expand/Collapse indicator */}
                              <svg 
                                className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#5A5A5A] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            
                            {/* Temple, Aadhar & Result Badge Row */}
                            <div className="flex justify-between items-center gap-2">
                              <div className="flex-1 space-y-1">
                                <p className="text-xs text-[#5A5A5A]">{participant.temple_name}</p>
                              </div>
                              <div className="flex-1 space-y-1" >
                                <p className="text-xs text-[#5A5A5A]">#{participant.aadhar_number || 'N/A'}</p>
                              </div>
                              {/* Result Badge - only show for non-heat events or final heat */}
                              {(!isHeatEvent() || (isHeatEvent() && showFinalHeat)) && (
                                <div className="flex-shrink-0">
                                  {(() => {
                                    const currentRank = getRankChanges(eventId)[participant.id] || participant.result?.rank;
                                    return currentRank ? (
                                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-lg ${
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
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Body - Expandable content */}
                        {isExpanded && (
                          <div className="px-4 pb-4 pt-2 border-t border-[#F8DFBE] space-y-3">
                            {/* Trial Measurements */}
                            {isTrialEvent() && (
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs font-semibold text-[#2A2A2A] mb-1">Trial 1</label>
                                  <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                                    value={`${participant.id}_1` in trialMeasurements ? trialMeasurements[`${participant.id}_1`] : (participant.performance_1 || '')}
                                    onChange={(e) => handleTrialInput(participant.id, 1, e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#2A2A2A] mb-1">Trial 2</label>
                                  <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                                    value={`${participant.id}_2` in trialMeasurements ? trialMeasurements[`${participant.id}_2`] : (participant.performance_2 || '')}
                                    onChange={(e) => handleTrialInput(participant.id, 2, e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold text-[#2A2A2A] mb-1">Trial 3</label>
                                  <input
                                    type="text"
                                    placeholder="0.00"
                                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                                    value={`${participant.id}_3` in trialMeasurements ? trialMeasurements[`${participant.id}_3`] : (participant.performance_3 || '')}
                                    onChange={(e) => handleTrialInput(participant.id, 3, e.target.value)}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Timing Input */}
                            {isHeatEvent() && (
                              <div>
                                <label className="block text-xs font-semibold text-[#2A2A2A] mb-1">
                                  {showFinalHeat ? 'Final Time' : 'Heat Time'}
                                </label>
                                {showFinalHeat ? (
                                  <input
                                    type="text"
                                    placeholder="Final Time"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                                    value={(() => {
                                      const localTiming = timings[`${participant.id}_performance_2`];
                                      const dbTiming = participant.performance_2;
                                      return localTiming !== undefined ? localTiming : (dbTiming || '');
                                    })()}
                                    onChange={(e) => {
                                      const newTimings = { ...timings };
                                      newTimings[`${participant.id}_performance_2`] = e.target.value;
                                      setTimings(newTimings);
                                    }}
                                  />
                                ) : (
                                  <input
                                    type="text"
                                    placeholder="Heat Time"
                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#D35D38]"
                                    value={(() => {
                                      const localTiming = timings[participant.id];
                                      const dbTiming = participant.performance_1;
                                      return localTiming !== undefined ? localTiming : (dbTiming || '');
                                    })()}
                                    onChange={(e) => handleTimingInput(participant.id, e.target.value)}
                                  />
                                )}
                              </div>
                            )}

                            {/* Result Selection */}
                            {(!isHeatEvent() || (isHeatEvent() && showFinalHeat)) && (
                              <div>
                                {/* <label className="block text-xs font-semibold text-[#2A2A2A] mb-1">Select Result</label> */}
                                <select 
                                  className={`w-full px-3 py-2 border rounded-lg text-sm ${
                                    getRankChanges(eventId)[participant.id] 
                                      ? 'border-green-500 bg-green-50' 
                                      : 'border-[#F8DFBE]'
                                  }`}
                                  value={getRankChanges(eventId)[participant.id] || participant.result?.rank || ""}
                                  onChange={(e) => {
                                    const scrollY = window.scrollY;
                                    const newRank = e.target.value;
                                    if (newRank) {
                                      setRankChange(eventId, participant.id, newRank);
                                    } else {
                                      const currentChanges = getRankChanges(eventId);
                                      const { [participant.id]: removed, ...rest } = currentChanges;
                                      setRankChanges(prev => ({
                                        ...prev,
                                        [eventId]: rest
                                      }));
                                    }
                                    setTimeout(() => window.scrollTo(0, scrollY), 0);
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Select Rank</option>
                                  <option value="FIRST">🥇 1st Place</option>
                                  <option value="SECOND">🥈 2nd Place</option>
                                  <option value="THIRD">🥉 3rd Place</option>
                                  <option value="CLEAR">Clear Result</option>
                                </select>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Table View for Desktop */}
                <div className="hidden md:block overflow-x-auto">
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
                                Update Results {Object.keys(getRankChanges(eventId)).length > 0 && `(${Object.keys(getRankChanges(eventId)).length})`}
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
                                  value={`${participant.id}_1` in trialMeasurements ? trialMeasurements[`${participant.id}_1`] : (participant.performance_1 || '')}
                                  onChange={(e) => handleTrialInput(participant.id, 1, e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={`${participant.id}_2` in trialMeasurements ? trialMeasurements[`${participant.id}_2`] : (participant.performance_2 || '')}
                                  onChange={(e) => handleTrialInput(participant.id, 2, e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                                <input
                                  type="text"
                                  placeholder="0.00"
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                  value={`${participant.id}_3` in trialMeasurements ? trialMeasurements[`${participant.id}_3`] : (participant.performance_3 || '')}
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
                                    onMouseDown={(e) => {
                                      // Capture scroll position BEFORE dropdown opens
                                      const scrollY = window.scrollY;
                                      e.currentTarget.dataset.scrollY = scrollY.toString();
                                    }}
                                    onFocus={(e) => {
                                      // Prevent browser from scrolling element into view
                                      const savedScrollY = e.currentTarget.dataset.scrollY;
                                      const scrollY = savedScrollY ? parseInt(savedScrollY, 10) : window.scrollY;
                                      
                                      // Immediately restore scroll position
                                      window.scrollTo(0, scrollY);
                                      
                                      // Restore scroll position multiple times to catch all scenarios
                                      requestAnimationFrame(() => {
                                        window.scrollTo(0, scrollY);
                                        requestAnimationFrame(() => {
                                          window.scrollTo(0, scrollY);
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 0);
                                        });
                                      });
                                    }}
                                    onChange={(e) => {
                                      // Get saved scroll position from before dropdown opened
                                      const savedScrollY = e.target.dataset.scrollY;
                                      const scrollY = savedScrollY ? parseInt(savedScrollY, 10) : window.scrollY;
                                      
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
                                      
                                      // Immediately restore scroll position
                                      window.scrollTo(0, scrollY);
                                      
                                      // Aggressively restore scroll position using multiple methods
                                      requestAnimationFrame(() => {
                                        window.scrollTo(0, scrollY);
                                        requestAnimationFrame(() => {
                                          window.scrollTo(0, scrollY);
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 0);
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 10);
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 50);
                                        });
                                      });
                                    }}
                                    onBlur={(e) => {
                                      // Restore scroll position when select loses focus
                                      const savedScrollY = e.currentTarget.dataset.scrollY;
                                      if (savedScrollY) {
                                        const scrollY = parseInt(savedScrollY, 10);
                                        window.scrollTo(0, scrollY);
                                        requestAnimationFrame(() => {
                                          window.scrollTo(0, scrollY);
                                          setTimeout(() => {
                                            window.scrollTo(0, scrollY);
                                          }, 0);
                                        });
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
                
                {/* Save Trials Button for Trial Events - Desktop Only */}
                {isTrialEvent() && (
                  <div className="mt-4 hidden md:flex justify-end">
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

  // Group events by age category and gender
  const groupedEvents = events.reduce((acc, event) => {
    const key = `${event.age_category}::${event.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {});

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
          
          {modalDetails && (
            <div className="mb-4 text-sm">
              {modalDetails.changes && (
                <div className="max-h-60 overflow-y-auto">
                  <p className="text-xs font-semibold text-[#2A2A2A] mb-2">Changes to be made:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {modalDetails.changes.map((change, index) => (
                      <li key={index} className="text-xs text-[#5A5A5A]">
                        <span className="font-semibold">{change.name || 'Unknown'}</span> ({change.temple || 'Unknown'}) - {change.rank === 'FIRST' ? '🥇 1st' : change.rank === 'SECOND' ? '🥈 2nd' : change.rank === 'THIRD' ? '🥉 3rd' : change.rank}
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
                  if (pendingUpdate && pendingUpdate.participantName) {
                    // Individual result update
                    executeIndividualResultUpdate();
                  } else if (pendingUpdate && pendingUpdate.eventId) {
                    // Bulk result update
                    executeBulkResultUpdate();
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

  return (
    <div className="space-y-6">
      {/* Modal */}
      <Modal />
      
      {/* Filters */}
      <div className="space-y-4 mb-6 sm:mb-8">
        {/* Age Category Filter Chips */}
        <div className="flex flex-col mb-0">
          <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Age Category</label>
          <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
            <div className="flex gap-2 pb-2" style={{ minWidth: 'max-content' }}>
              {ageGroups && ageGroups.length > 0 ? (
                ageGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => setSelectedAge(group.name)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-sm sm:text-base font-medium whitespace-nowrap transition-all duration-200
                      ${selectedAge === group.name 
                        ? 'bg-[#D35D38] text-white shadow-md' 
                        : 'bg-white text-[#2A2A2A] border border-[#F8DFBE] hover:border-[#D35D38] hover:text-[#D35D38]'
                      }`}
                  >
                    {group.name}
                  </button>
                ))
              ) : (
                <span className="text-gray-400 text-sm">Loading age groups...</span>
              )}
            </div>
          </div>
        </div>

        {/* Gender Filter Chips */}
        <div className="flex flex-col">
          <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Gender</label>
          <div className="flex gap-2 flex-wrap">
            {genders && genders.length > 0 ? (
              genders.map((gender) => (
                <button
                  key={gender.id}
                  onClick={() => setSelectedGender(gender.value)}
                  className={`px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-sm sm:text-base font-medium transition-all duration-200
                    ${selectedGender === gender.value 
                      ? 'bg-[#D35D38] text-white shadow-md' 
                      : 'bg-white text-[#2A2A2A] border border-[#F8DFBE] hover:border-[#D35D38] hover:text-[#D35D38]'
                    }`}
                >
                  {gender.name}
                </button>
              ))
            ) : (
              <span className="text-gray-400 text-sm">Loading genders...</span>
            )}
          </div>
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
                <h3 className="text-sm md:text-base lg:text-lg font-semibold text-[#D35D38] border-b-2 border-[#F8DFBE] pb-2">
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
                      getHeatsData={getHeatsData}
                      setHeatsData={setHeatsData}
                      getSelectedHeat={getSelectedHeat}
                      setSelectedHeatForEvent={setSelectedHeatForEvent}
                      isFinalHeatSelected={isFinalHeatSelected}
                      setFinalHeatSelectedForEvent={setFinalHeatSelectedForEvent}
                      laneCount={laneCount}
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

export default UpdateIndividualResult;

