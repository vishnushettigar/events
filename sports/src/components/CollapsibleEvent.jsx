import React, { useState } from 'react';
import { eventAPI } from '../utils/api';

const CollapsibleEvent = ({ title, eventId, ageCategory, gender, onResultUpdate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [eventParticipants, setEventParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [participantError, setParticipantError] = useState(null);
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
    return eventName.includes('running - 100 mts') || eventName.includes('running - 200 mts');
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
    setTimings(prev => ({
      ...prev,
      [participantId]: value
    }));
  };

  // Save timings for current heat
  const saveHeatTimings = async () => {
    if (!selectedHeat || !heats[selectedHeat]) return;
    
    try {
      setSavingTimings(true);
      const timingsArray = heats[selectedHeat].map(participant => ({
        registration_id: participant.id,
        heat_time: timings[participant.id] || ''
      }));
      
      console.log(`Saving timings for Heat ${selectedHeat}:`, timingsArray);
      
      await eventAPI.saveTimings(eventId, selectedHeat, timingsArray);
      console.log('Timings saved successfully');
      
      // Refresh heats to get updated data
      await fetchHeats();
      
      // Clear the local timings state since data is now saved
      setTimings({});
      
      alert(`Timings for Heat ${selectedHeat} saved successfully!`);
    } catch (error) {
      console.error('Error saving timings:', error);
      alert('Failed to save timings. Please try again.');
    } finally {
      setSavingTimings(false);
    }
  };

  // Fetch heats from backend
  const fetchHeats = async () => {
    if (!isHeatEvent()) return;
    
    try {
      setLoadingHeats(true);
      const heatsData = await eventAPI.getHeats(eventId);
      setHeats(heatsData);
      
      // Set first heat as selected if available
      const heatNumbers = Object.keys(heatsData).map(Number).sort((a, b) => a - b);
      if (heatNumbers.length > 0) {
        setSelectedHeat(heatNumbers[0]);
      }
    } catch (error) {
      console.error('Error fetching heats:', error);
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
        alert('No participants with timings found. Please enter timings for at least one heat first.');
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
      
      // Show success message with details
      const heatCounts = Object.entries(heatDistribution).map(([heat, count]) => `Heat ${heat}: ${count}`).join(', ');
      alert(`Final heat generated successfully!\n\nTop 8 participants selected from all heats:\n${heatCounts}\n\nCheck the console for detailed timing comparison.`);
      
    } catch (error) {
      console.error('Error generating final heat:', error);
      alert('Error generating final heat. Please try again.');
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
                    <td class="trial-data">${trial1 ? trial1 + 'm' : '-'}</td>
                    <td class="trial-data">${trial2 ? trial2 + 'm' : '-'}</td>
                    <td class="trial-data">${trial3 ? trial3 + 'm' : '-'}</td>
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
      setLoadingParticipants(true);
      setParticipantError(null);
      const data = await eventAPI.getEventParticipants(eventId);
      setEventParticipants(data);
      
      // Fetch heats for running events
      if (isHeatEvent()) {
        await fetchHeats();
      }
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

  // Handle result update - call parent callback
  const handleResultUpdate = (participantId, rank, participantName, templeName, eventName, aadharNumber) => {
    if (onResultUpdate) {
      onResultUpdate(participantId, rank, participantName, templeName, eventName, aadharNumber);
    }
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
                        {savingTimings ? 'Saving...' : 'Save Timings'}
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
                        <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">TIMING</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider border-r border-[#F8DFBE]">RESULTS</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">ACTIONS</th>
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
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                value={trialMeasurements[`${participant.id}_1`] || ''}
                                onChange={(e) => handleTrialInput(participant.id, 1, e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                value={trialMeasurements[`${participant.id}_2`] || ''}
                                onChange={(e) => handleTrialInput(participant.id, 2, e.target.value)}
                              />
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                                value={trialMeasurements[`${participant.id}_3`] || ''}
                                onChange={(e) => handleTrialInput(participant.id, 3, e.target.value)}
                              />
                            </td>
                          </>
                        )}
                        {isHeatEvent() && (
                          <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
                            <input
                              type="text"
                              placeholder="00:00.00"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#D35D38]"
                              value={participant.heat_time || timings[participant.id] || ''}
                              onChange={(e) => handleTimingInput(participant.id, e.target.value)}
                            />
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap text-sm border-r border-[#F8DFBE]">
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
                            <span className="text-gray-400 text-xs"></span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex gap-2">
                            <select 
                              className="px-2 py-1 border border-[#F8DFBE] rounded text-xs"
                              defaultValue={participant.result?.rank || ""}
                              id={`rank-${participant.id}`}
                            >
                              <option value="">Select Rank</option>
                              <option value="FIRST">🥇 1st Place</option>
                              <option value="SECOND">🥈 2nd Place</option>
                              <option value="THIRD">🥉 3rd Place</option>
                              <option value="CLEAR">Clear Result</option>
                            </select>
                            <button 
                              className="px-3 py-1 bg-[#D35D38] text-white rounded text-xs hover:bg-[#B84A2E]"
                              onClick={() => {
                                const select = document.getElementById(`rank-${participant.id}`);
                                if (select.value) {
                                  const participantName = participant.registration_type === 'INDIVIDUAL' 
                                    ? participant.participant_name 
                                    : participant.team_name;
                                  handleResultUpdate(
                                    participant.id, 
                                    select.value, 
                                    participantName, 
                                    participant.temple_name,
                                    title, // event name
                                    participant.aadhar_number || 'N/A'
                                  );
                                }
                              }}
                            >
                              Update
                            </button>
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

export default CollapsibleEvent;
