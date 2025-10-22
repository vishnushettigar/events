import React, { useState, useEffect } from 'react';
import { eventAPI } from '../utils/api.js';

const AdminHeatViewer = ({ eventId, eventName, ageCategory, gender }) => {
  const [heats, setHeats] = useState({});
  const [selectedHeat, setSelectedHeat] = useState(null);
  const [loadingHeats, setLoadingHeats] = useState(false);
  const [heatError, setHeatError] = useState(null);
  const [showFinalHeat, setShowFinalHeat] = useState(false);
  const [finalHeatParticipants, setFinalHeatParticipants] = useState([]);

  // Check if this event requires heats (running events)
  const isHeatEvent = () => {
    const eventNameLower = eventName.toLowerCase();
    return eventNameLower.includes('running - 100 mts') || eventNameLower.includes('running - 200 mts');
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
      setHeatError(null);
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
      setHeatError(error.message || 'Failed to fetch heats');
    } finally {
      setLoadingHeats(false);
    }
  };

  // Convert timing string to seconds for comparison
  const parseTiming = (timing) => {
    if (!timing || timing === '' || timing === null || timing === undefined) {
      return Infinity;
    }
    
    const cleanTiming = timing.toString().trim();
    const parts = cleanTiming.split(':');
    
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseFloat(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0]) || 0;
      const seconds = parseFloat(parts[1]) || 0;
      return minutes * 60 + seconds;
    } else {
      const seconds = parseFloat(cleanTiming);
      return isNaN(seconds) ? Infinity : seconds;
    }
  };

  // Get all participants with timings from all heats
  const getAllParticipantsWithTimings = () => {
    const allParticipants = [];
    
    Object.entries(heats).forEach(([heatNumber, heatParticipants]) => {
      heatParticipants.forEach(participant => {
        const timing = participant.performance_1;
        const timingSeconds = parseTiming(timing);
        
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
    
    return allParticipants.sort((a, b) => a.timingSeconds - b.timingSeconds);
  };

  // Generate final heat with top 8 participants
  const generateFinalHeat = () => {
    const participantsWithTimings = getAllParticipantsWithTimings();
    
    if (participantsWithTimings.length === 0) {
      console.log('No participants with timings found');
      return;
    }
    
    const top8 = participantsWithTimings.slice(0, 8);
    setFinalHeatParticipants(top8);
    setShowFinalHeat(true);
  };

  // Print function for heat participants
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    let participantsToPrint = [];
    let printTitle = eventName;
    
    if (showFinalHeat) {
      participantsToPrint = finalHeatParticipants;
      printTitle = `${eventName} - Final Heat`;
    } else if (selectedHeat) {
      participantsToPrint = heats[selectedHeat] || [];
      printTitle = `${eventName} - Heat ${selectedHeat}`;
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
        ${showFinalHeat ? `
          <div class="final-heat-info">
            <strong>🏁 Final Heat Information:</strong><br>
            Participants: ${finalHeatParticipants.length}/8 | Top performers from all heats<br>
            Temples: ${[...new Set(finalHeatParticipants.map(p => p.temple_name))].join(', ')}
          </div>
        ` : selectedHeat ? `
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
              <th>TIMING</th>
            </tr>
          </thead>
          <tbody>
            ${participantsToPrint.map((participant, index) => {
              const participantName = participant.participant_name || participant.team_name;
              const timing = participant.performance_1 || participant.timing || '';
              const timingClass = showFinalHeat && finalHeatParticipants.length > 0 ? 'final-heat-timing' : 'timing-data';
              
              return `
                <tr>
                  <td>${index + 1}</td>
                  <td>${participantName}</td>
                  <td>${participant.temple_name}</td>
                  <td>${participant.aadhar_number || 'N/A'}</td>
                  <td class="${timingClass}">${timing || '-'}</td>
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

  // Fetch heats when component mounts
  useEffect(() => {
    if (isHeatEvent()) {
      fetchHeats();
    }
  }, [eventId, eventName]);

  // Don't render if not a heat event
  if (!isHeatEvent()) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-blue-800">🏃‍♂️ Heat Management</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchHeats}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            title="Refresh heats"
          >
            🔄 Refresh
          </button>
          {Object.keys(heats).length > 0 && (
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
              title="Print heat participants"
            >
              🖨️ Print
            </button>
          )}
        </div>
      </div>

      {loadingHeats ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading heats...</span>
        </div>
      ) : heatError ? (
        <div className="bg-red-50 border border-red-200 p-3 rounded text-red-700">
          <strong>Error:</strong> {heatError}
        </div>
      ) : Object.keys(heats).length > 0 ? (
        <div className="space-y-4">
          {/* Heat Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Select Heat:</span>
            {Object.keys(heats).map((heatNumber) => (
              <button
                key={heatNumber}
                onClick={() => {
                  setSelectedHeat(parseInt(heatNumber));
                  setShowFinalHeat(false);
                }}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedHeat === parseInt(heatNumber) && !showFinalHeat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                Heat {heatNumber} ({heats[heatNumber].length} participants)
              </button>
            ))}
            <button
              onClick={() => {
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
          </div>

          {/* Heat Information */}
          {selectedHeat && (
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              <strong>Heat {selectedHeat}:</strong> {heats[selectedHeat]?.length || 0} participants
              {heats[selectedHeat]?.length > 0 && (
                <span className="ml-2">
                  (Temples: {[...new Set(heats[selectedHeat].map(p => p.temple_name))].join(', ')})
                </span>
              )}
            </div>
          )}

          {showFinalHeat && (
            <div className="text-sm text-gray-600 bg-white p-3 rounded border">
              <strong>🏁 Final Heat:</strong> {finalHeatParticipants.length}/8 participants
              {finalHeatParticipants.length > 0 && (
                <span className="ml-2">
                  (Temples: {[...new Set(finalHeatParticipants.map(p => p.temple_name))].join(', ')})
                </span>
              )}
            </div>
          )}

          {/* Participants Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL.NO</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAME</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TEMPLE</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AADHAR NO</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TIMING</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(showFinalHeat ? finalHeatParticipants : 
                  selectedHeat ? heats[selectedHeat] || [] : []).map((participant, index) => (
                  <tr key={participant.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      {participant.participant_name || participant.team_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {participant.temple_name}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {participant.aadhar_number || 'N/A'}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div className={`font-bold ${
                          showFinalHeat && finalHeatParticipants.length > 0 ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {participant.performance_1 || participant.timing || '-'}
                        </div>
                        {participant.performance_2 && (
                          <div className="text-xs text-gray-500">
                            {participant.performance_2}
                          </div>
                        )}
                        {participant.performance_3 && (
                          <div className="text-xs text-gray-500">
                            {participant.performance_3}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded text-yellow-800">
          <p className="text-sm">
            ⚠️ No heats have been generated for this event yet. Please generate heats first.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminHeatViewer;
