import React, { useState, useEffect } from 'react';
import { eventAPI, viewerAPI, reportAPI } from '../utils/api.js';

const Results = ({ 
  apiSource = 'staff', // 'staff', 'admin', or 'viewer'
  className = ""
}) => {
  const [data, setData] = useState({ individual: [], team: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allResultsActiveTab, setAllResultsActiveTab] = useState('individual');
  
  // Separate filter states for individual and team events
  const [individualSelectedAge, setIndividualSelectedAge] = useState('all');
  const [individualSelectedGender, setIndividualSelectedGender] = useState('all');
  const [teamSelectedGender, setTeamSelectedGender] = useState('all');
  
  // Age groups for filtering
  const [ageGroups, setAgeGroups] = useState([]);

  useEffect(() => {
    fetchResults();
    fetchAgeGroups();
  }, [apiSource]);

  const fetchResults = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Fetch data based on API source
      switch (apiSource) {
        case 'staff':
          data = await reportAPI.getAllResults();
          break;
          
        case 'admin':
          const adminData = await eventAPI.getEventPerformance();
          // Transform admin data to match expected structure
          data = transformEventPerformanceData(adminData);
          break;
          
        case 'viewer':
          const viewerData = await viewerAPI.getEventPerformance();
          // Transform viewer data to match expected structure
          data = transformEventPerformanceData(viewerData);
          break;
          
        default:
          throw new Error('Invalid API source');
      }
      
      setData(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgeGroups = async () => {
    try {
      const response = await eventAPI.getAllEventsComplete();
      const ageCategories = [...new Set(response.individual.concat(response.team).map(event => event.age_category?.name).filter(Boolean))];
      setAgeGroups(ageCategories.map(category => ({
        id: category,
        name: category,
        value: category
      })));
    } catch (err) {
      console.error('Error fetching age groups:', err);
    }
  };

  // Transform event performance data to match expected structure
  const transformEventPerformanceData = (events) => {
    const individualEvents = events.filter(event => event.event_type?.type === 'INDIVIDUAL');
    const teamEvents = events.filter(event => event.event_type?.type === 'TEAM');

    // Group individual events by age category and gender
    const individualByCategory = {};
    individualEvents.forEach(event => {
      const key = `${event.age_category?.name || 'Unknown'} - ${event.gender}`;
      if (!individualByCategory[key]) {
        individualByCategory[key] = {
          age_category: event.age_category?.name || 'Unknown',
          gender: event.gender,
          events: []
        };
      }

      // Create event with winners from registrations
      const eventWithWinners = {
        event_name: event.event_type?.name || 'Unknown Event',
        first: [],
        second: [],
        third: []
      };

      // Process registrations with results
      if (event.registrations) {
        event.registrations.forEach(reg => {
          if (reg.event_result) {
            const winner = {
              name: `${reg.user?.first_name || ''} ${reg.user?.last_name || ''}`.trim(),
              temple: reg.user?.temple?.name || 'Unknown',
              aadhar: reg.user?.aadhar_number || 'N/A',
              points: reg.event_result.points || 0
            };

            if (reg.event_result.rank === 'FIRST') {
              eventWithWinners.first.push(winner);
            } else if (reg.event_result.rank === 'SECOND') {
              eventWithWinners.second.push(winner);
            } else if (reg.event_result.rank === 'THIRD') {
              eventWithWinners.third.push(winner);
            }
          }
        });
      }

      individualByCategory[key].events.push(eventWithWinners);
    });

    // Group team events by age category and gender
    const teamByCategory = {};
    teamEvents.forEach(event => {
      const key = `${event.age_category?.name || 'Unknown'} - ${event.gender}`;
      if (!teamByCategory[key]) {
        teamByCategory[key] = {
          age_category: event.age_category?.name || 'Unknown',
          gender: event.gender,
          events: []
        };
      }

      // Create event with winners from team registrations
      const eventWithWinners = {
        event_name: event.event_type?.name || 'Unknown Event',
        first: [],
        second: [],
        third: []
      };

      // Process team registrations with results
      if (event.team_registrations) {
        event.team_registrations.forEach(reg => {
          if (reg.event_result) {
            const winner = {
              temple: reg.temple?.name || 'Unknown',
              points: reg.event_result.points || 0,
              participants: [] // Team events don't have individual participants in this structure
            };

            if (reg.event_result.rank === 'FIRST') {
              eventWithWinners.first.push(winner);
            } else if (reg.event_result.rank === 'SECOND') {
              eventWithWinners.second.push(winner);
            } else if (reg.event_result.rank === 'THIRD') {
              eventWithWinners.third.push(winner);
            }
          }
        });
      }

      teamByCategory[key].events.push(eventWithWinners);
    });

    return {
      individual: Object.values(individualByCategory),
      team: Object.values(teamByCategory)
    };
  };

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
        <button
          onClick={fetchResults}
          className="mt-2 ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
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

  // Helper function to get winner data for detailed display
  const getWinnerData = (winners, isIndividual = true) => {
    if (!winners || winners.length === 0) return null;
    
    if (isIndividual) {
      return winners[0]; // Return first winner for individual events
    } else {
      return winners[0]; // Return first winner for team events
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
        // Combine all winners into a single array with rank information
        const allWinners = [];
        
        // Add first place winners
        if (event.first && event.first.length > 0) {
          event.first.forEach(winner => {
            allWinners.push({ ...winner, rank: 'FIRST' });
          });
        }
        
        // Add second place winners
        if (event.second && event.second.length > 0) {
          event.second.forEach(winner => {
            allWinners.push({ ...winner, rank: 'SECOND' });
          });
        }
        
        // Add third place winners
        if (event.third && event.third.length > 0) {
          event.third.forEach(winner => {
            allWinners.push({ ...winner, rank: 'THIRD' });
          });
        }

        allIndividualResults.push({
          category: `${category.age_category} - ${category.gender}`,
          eventName: event.event_name,
          firstPlace: getWinnerText(event.first, true),
          secondPlace: getWinnerText(event.second, true),
          thirdPlace: getWinnerText(event.third, true),
          allWinners: allWinners,
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
        // Combine all winners into a single array with rank information
        const allWinners = [];
        
        // Add first place winners
        if (event.first && event.first.length > 0) {
          event.first.forEach(winner => {
            const winnerData = { ...winner, rank: 'FIRST' };
            
            // For mixed events, we need to separate male and female participants
            if (category.gender === 'MIXED' && winner.participants) {
              winnerData.maleParticipants = winner.participants.filter(p => p.gender === 'MALE');
              winnerData.femaleParticipants = winner.participants.filter(p => p.gender === 'FEMALE');
            }
            
            allWinners.push(winnerData);
          });
        }
        
        // Add second place winners
        if (event.second && event.second.length > 0) {
          event.second.forEach(winner => {
            const winnerData = { ...winner, rank: 'SECOND' };
            
            // For mixed events, we need to separate male and female participants
            if (category.gender === 'MIXED' && winner.participants) {
              winnerData.maleParticipants = winner.participants.filter(p => p.gender === 'MALE');
              winnerData.femaleParticipants = winner.participants.filter(p => p.gender === 'FEMALE');
            }
            
            allWinners.push(winnerData);
          });
        }
        
        // Add third place winners
        if (event.third && event.third.length > 0) {
          event.third.forEach(winner => {
            const winnerData = { ...winner, rank: 'THIRD' };
            
            // For mixed events, we need to separate male and female participants
            if (category.gender === 'MIXED' && winner.participants) {
              winnerData.maleParticipants = winner.participants.filter(p => p.gender === 'MALE');
              winnerData.femaleParticipants = winner.participants.filter(p => p.gender === 'FEMALE');
            }
            
            allWinners.push(winnerData);
          });
        }

        allTeamResults.push({
          category: `${category.age_category} - ${category.gender}`,
          eventName: event.event_name,
          firstPlace: getWinnerText(event.first, false),
          secondPlace: getWinnerText(event.second, false),
          thirdPlace: getWinnerText(event.third, false),
          allWinners: allWinners,
          ageCategory: category.age_category,
          gender: category.gender
        });
      });
    });
  }

  // Apply filters separately for individual and team events
  const individualResults = filterResults(allIndividualResults, individualSelectedAge, individualSelectedGender);
  const teamResults = filterResults(allTeamResults, 'all', teamSelectedGender); // Team events don't use age filter

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
                const isTeamType = type === 'Team';
                const isIndividualType = type === 'Individual';
                
                const generateWinnerRows = (result) => {
                  const sortedWinners = [...result.allWinners].sort((a, b) => {
                    if (a.rank === b.rank) {
                      return (b.points || 0) - (a.points || 0);
                    }
                    const rankOrder = { 'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'NA': 4 };
                    return (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
                  });
                  
                  return sortedWinners.map(winner => {
                    const rankDisplay = winner.rank === 'FIRST' ? '🥇 FIRST' :
                      winner.rank === 'SECOND' ? '🥈 SECOND' :
                      winner.rank === 'THIRD' ? '🥉 THIRD' : '-';
                    
                    const nameDisplay = isTeamType ? winner.temple : winner.name;
                    
                    let extraCols = '';
                    if (isTeamType && result.gender === 'MIXED') {
                      const maleNames = winner.maleParticipants && winner.maleParticipants.length > 0 
                        ? winner.maleParticipants.map(p => p.first_name + ' ' + p.last_name).join(', ')
                        : 'No male participants';
                      const femaleNames = winner.femaleParticipants && winner.femaleParticipants.length > 0
                        ? winner.femaleParticipants.map(p => p.first_name + ' ' + p.last_name).join(', ')
                        : 'No female participants';
                      extraCols = '<td>' + maleNames + '</td><td>' + femaleNames + '</td>';
                    } else if (isIndividualType) {
                      extraCols = '<td>' + (winner.temple || 'N/A') + '</td><td>' + (winner.aadhar || 'N/A') + '</td>';
                    }
                    
                    return '<tr><td class="rank-cell medal">' + rankDisplay + '</td><td>' + nameDisplay + '</td>' + extraCols + '<td>' + (winner.points || 0) + '</td></tr>';
                  }).join('');
                };
                
                const generateEventHtml = (result) => {
                  const headerCols = isTeamType && result.gender === 'MIXED' 
                    ? '<th>Male Participants</th><th>Female Participants</th>'
                    : isIndividualType ? '<th>Temple</th><th>Aadhar</th>' : '';
                  
                  // For team events, show only gender; for individual events, show full category
                  const displayCategory = isTeamType ? result.gender : result.category;
                  
                  return '<div class="event-container">' +
                    '<div class="event-details"><div class="event-name">' + displayCategory + ' - ' + result.eventName + '</div></div>' +
                    '<table class="winners-table"><thead><tr>' +
                    '<th>Rank</th><th>' + (isTeamType ? 'Temple Name' : 'Participant') + '</th>' + headerCols + '<th>Points</th>' +
                    '</tr></thead><tbody>' + generateWinnerRows(result) + '</tbody></table></div>';
                };
                
                const printWindow = window.open('', '_blank');
                const printContent = `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <title>${title} - All Results</title>
                    <style>
                      body { font-family: Arial, sans-serif; margin: 20px; }
                      .header { text-align: center; margin-bottom: 20px; }
                      .title { font-size: 20px; font-weight: normal; margin-bottom: 6px; }
                      .main-title { font-size: 24px; font-weight: bold; margin-bottom: 6px; }
                      .place { font-size: 14px; margin-bottom: 6px; color: black; }
                      .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: black; }
                      .event-container { margin-bottom: 30px; page-break-inside: avoid; }
                      .event-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 10px; }
                      .event-name { font-size: 18px; font-weight: bold; color: #2A2A2A; }
                      .winners-table { width: 100%; border-collapse: collapse; }
                      .winners-table th, .winners-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                      .winners-table th { background-color: #f2f2f2; font-weight: bold; }
                      .rank-cell { text-align: center; }
                      .medal { font-size: 16px; }
                      @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                        .event-container { page-break-inside: avoid; }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="header">
                      <div class="title">ದ. ಕ. ಜಿಲ್ಲಾ ಪದ್ಮಶಾಲಿ ಮಹಾಸಭಾ (ರಿ.), ಮಂಗಳೂರು </div>
                      <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                      <div class="place">ಸಹಯೋಗ - ಶ್ರೀ ವೀರಭದ್ರ ಮಹಮ್ಮಾಯೀ ದೇವಸ್ಥಾನ ಮಾನಂಪಾಡಿ - ಮುಲ್ಕಿ ; ನೇತೃತ್ವ- ಪದ್ಮಶಾಲಿ ಯುವ ವೇದಿಕೆ, ಮುಲ್ಕಿ  </div>
                      <div class="section-title">${title}</div>
                    </div>
                    ${results.map(generateEventHtml).join('')}
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
        
        <div className="space-y-8 p-6">
          {results.map((result, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h6 className="text-md font-semibold text-[#2A2A2A]">{result.eventName}</h6>
                  <div className="flex items-center space-x-4 text-sm text-[#5A5A5A]">
                    <span>{allResultsActiveTab === 'team' ? result.gender : result.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    const printContent = `
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>${result.eventName} - ${allResultsActiveTab === 'team' ? result.gender : result.category}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          .header { text-align: center; margin-bottom: 20px; }
                          .main-title { font-size: 24px; font-weight: bold; margin-bottom: 6px; }
                          .title { font-size: 20px; font-weight: normal; margin-bottom: 6px; }
                          .place { font-size: 14px; margin-bottom: 6px; color: black; }
                          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: black; }
                          .event-details { background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                          .event-name { font-size: 20px; font-weight: bold; color: #2A2A2A; margin-bottom: 5px; }
                          .event-category { font-size: 16px; color: #5A5A5A; }
                          .winners-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                          .winners-table th, .winners-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                          .winners-table th { background-color: #f2f2f2; font-weight: bold; }
                          .rank-cell { text-align: center; }
                          .medal { font-size: 18px; }
                          @media print {
                            body { margin: 0; }
                            .no-print { display: none; }
                          }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <div class="title">ದ. ಕ. ಜಿಲ್ಲಾ ಪದ್ಮಶಾಲಿ ಮಹಾಸಭಾ (ರಿ.), ಮಂಗಳೂರು </div>
                          <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                          <div class="place">ಸಹಯೋಗ - ಶ್ರೀ ವೀರಭದ್ರ ಮಹಮ್ಮಾಯೀ ದೇವಸ್ಥಾನ ಮಾನಂಪಾಡಿ - ಮುಲ್ಕಿ ; ನೇತೃತ್ವ- ಪದ್ಮಶಾಲಿ ಯುವ ವೇದಿಕೆ, ಮುಲ್ಕಿ  </div>                 
                        </div>
                        <div class="event-details">
                          <div class="event-name">${allResultsActiveTab === 'team' ? result.gender : result.category} - ${result.eventName}</div>
                        </div>
                        <table class="winners-table">
                          <thead>
                            <tr>
                              <th>Rank</th>
                              <th>${allResultsActiveTab === 'team' ? 'Temple Name' : 'Participant'}</th>
                              ${allResultsActiveTab === 'team' && result.gender === 'MIXED' ? 
                                '<th>Male Participants</th><th>Female Participants</th>' : 
                                allResultsActiveTab === 'individual' ? '<th>Temple</th><th>Aadhar</th>' : ''}
                              <th>Points</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${result.allWinners
                              .sort((a, b) => {
                                if (a.rank === b.rank) {
                                  return (b.points || 0) - (a.points || 0);
                                }
                                const rankOrder = { 'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'NA': 4 };
                                return (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
                              })
                              .map(winner => `
                              <tr>
                                <td class="rank-cell medal">${
                                  winner.rank === 'FIRST' ? '🥇 FIRST' :
                                  winner.rank === 'SECOND' ? '🥈 SECOND' :
                                  winner.rank === 'THIRD' ? '🥉 THIRD' : '-'
                                }</td>
                                <td>${allResultsActiveTab === 'team' ? winner.temple : winner.name}</td>
                                ${allResultsActiveTab === 'team' && result.gender === 'MIXED' ? `
                                  <td>${winner.maleParticipants && winner.maleParticipants.length > 0 ? 
                                    winner.maleParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', ') : 
                                    'No male participants'}</td>
                                  <td>${winner.femaleParticipants && winner.femaleParticipants.length > 0 ? 
                                    winner.femaleParticipants.map(p => `${p.first_name} ${p.last_name}`).join(', ') : 
                                    'No female participants'}</td>
                                ` : allResultsActiveTab === 'individual' ? `
                                  <td>${winner.temple || 'N/A'}</td>
                                  <td>${winner.aadhar || 'N/A'}</td>
                                ` : ''}
                                <td>${winner.points || 0}</td>
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
                  🖨️ Print Event
                </button>
              </div>

              {/* Results Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Rank</th>
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                        {allResultsActiveTab === 'team' ? 'Temple Name' : 'Participant'}
                      </th>
                      {allResultsActiveTab === 'team' && result.gender === 'MIXED' ? (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Male Participants</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Female Participants</th>
                        </>
                      ) : allResultsActiveTab === 'individual' && (
                        <>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Temple</th>
                          <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Aadhar</th>
                        </>
                      )}
                      <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Points</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {result.allWinners
                      .sort((a, b) => {
                        if (a.rank === b.rank) {
                          return (b.points || 0) - (a.points || 0);
                        }
                        const rankOrder = { 'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'NA': 4 };
                        return (rankOrder[a.rank] || 5) - (rankOrder[b.rank] || 5);
                      })
                      .map((winner, index) => (
                        <tr key={`winner-${index}`} className="hover:bg-orange-50 transition">
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                              winner.rank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                              winner.rank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                              winner.rank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {winner.rank === 'FIRST' ? '🥇' :
                               winner.rank === 'SECOND' ? '🥈' :
                               winner.rank === 'THIRD' ? '🥉' : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#2A2A2A]">
                              {allResultsActiveTab === 'team' 
                                ? winner.temple 
                                : winner.name
                              }
                            </div>
                          </td>
                          {allResultsActiveTab === 'team' && result.gender === 'MIXED' ? (
                            <>
                              <td className="px-4 py-3 text-[#5A5A5A]">
                                <div className="space-y-1">
                                  {winner.maleParticipants && winner.maleParticipants.length > 0 ? (
                                    winner.maleParticipants.map((participant, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium text-[#2A2A2A]">
                                          {participant.first_name} {participant.last_name}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500">No male participants</div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-[#5A5A5A]">
                                <div className="space-y-1">
                                  {winner.femaleParticipants && winner.femaleParticipants.length > 0 ? (
                                    winner.femaleParticipants.map((participant, idx) => (
                                      <div key={idx} className="text-sm">
                                        <span className="font-medium text-[#2A2A2A]">
                                          {participant.first_name} {participant.last_name}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-500">No female participants</div>
                                  )}
                                </div>
                              </td>
                            </>
                          ) : allResultsActiveTab === 'individual' && (
                            <>
                              <td className="px-4 py-3 text-[#5A5A5A]">
                                {winner.temple || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-[#5A5A5A]">
                                {winner.aadhar || 'N/A'}
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 font-bold text-[#D35D38]">
                            {winner.points || 0}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">All Results</h1>
        <p className="text-[#5A5A5A] mt-1">Complete list of winners from all events</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setAllResultsActiveTab('individual')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                allResultsActiveTab === 'individual'
                  ? 'border-[#D35D38] text-[#D35D38]'
                  : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-gray-300'
              }`}
            >
              🏃 Individual Events
            </button>
            <button
              onClick={() => setAllResultsActiveTab('team')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                allResultsActiveTab === 'team'
                  ? 'border-[#D35D38] text-[#D35D38]'
                  : 'border-transparent text-[#5A5A5A] hover:text-[#2A2A2A] hover:border-gray-300'
              }`}
            >
              🤝 Team Events
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Tab Content */}
          {allResultsActiveTab === 'individual' && (
            <div>
              {/* Individual Events Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Age Category Filter */}
                <div className="flex flex-col">
                  <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Age Category</label>
                  <select 
                    className="p-2 sm:p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white text-sm sm:text-base"
                    value={individualSelectedAge}
                    onChange={(e) => setIndividualSelectedAge(e.target.value)}
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
                    value={individualSelectedGender}
                    onChange={(e) => setIndividualSelectedGender(e.target.value)}
                  >
                    <option value="all">ALL</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                  </select>
                </div>
              </div>
              {renderResultsTable(individualResults, " Individual Events", "Individual")}
            </div>
          )}

          {allResultsActiveTab === 'team' && (
            <div>
              {/* Team Events Filters - Only Gender */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-3 sm:gap-4 mb-6 sm:mb-8">
                {/* Gender Filter for Teams */}
                <div className="flex flex-col">
                  <label className="mb-2 text-[#2A2A2A] font-medium text-sm sm:text-base">Filter by Gender</label>
                  <select 
                    className="p-2 sm:p-3 border border-[#F8DFBE] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white text-sm sm:text-base"
                    value={teamSelectedGender}
                    onChange={(e) => setTeamSelectedGender(e.target.value)}
                  >
                    <option value="all">ALL</option>
                    <option value="MALE">MALE</option>
                    <option value="FEMALE">FEMALE</option>
                    <option value="MIXED">MIXED</option>
                  </select>
                </div>
              </div>
              {renderResultsTable(teamResults, "Team Events", "Team")}
            </div>
          )}
        </div>
      </div>

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
                      .place { font-size: 16px; margin-bottom: 10px; color: #666; }
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
                     <div class="title">ದ. ಕ. ಜಿಲ್ಲಾ ಪದ್ಮಶಾಲಿ ಮಹಾಸಭಾ (ರಿ.), ಮಂಗಳೂರು </div>
                      <div class="main-title">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025</div>
                      <div class="subtitle">ಸಹಯೋಗ - ಶ್ರೀ ವೀರಭದ್ರ ಮಹಮ್ಮಾಯೀ ದೇವಸ್ಥಾನ ಮಾನಂಪಾಡಿ - ಮುಲ್ಕಿ ; ನೇತೃತ್ವ- ಪದ್ಮಶಾಲಿ ಯುವ ವೇದಿಕೆ, ಮುಲ್ಕಿ  </div>
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

export default Results;
