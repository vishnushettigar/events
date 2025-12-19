import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom';
import { userAPI } from '../utils/api';
import authManager from '../utils/authManager';

const Templedetailedreports = () => {
  const [searchParams] = useSearchParams();
  const [individualEvents, setIndividualEvents] = useState([]);
  const [teamEvents, setTeamEvents] = useState([]);
  const [totalPoints, setTotalPoints] = useState({ individual: 0, team: 0, total: 0 });
  const [templeInfo, setTempleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to extract numeric value from age category for sorting
  const getAgeCategorySortValue = (ageCategory) => {
    if (!ageCategory || ageCategory === 'Unknown' || ageCategory === 'All') {
      return ageCategory === 'All' ? 999 : 0;
    }
    // Extract the first number from strings like "0-5", "6-10", "61+"
    const match = ageCategory.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  };

  // Function to group and aggregate individual events
  const groupIndividualEvents = (events) => {
    const grouped = {};
    
    events.forEach(event => {
      const key = `${event.event}|${event.age}|${event.gender}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          event: event.event,
          age: event.age,
          gender: event.gender,
          first: [],
          second: [],
          third: [],
          points: 0
        };
      }
      
      // Collect winners
      if (event.first) {
        grouped[key].first.push(event.first);
      }
      if (event.second) {
        grouped[key].second.push(event.second);
      }
      if (event.third) {
        grouped[key].third.push(event.third);
      }
      
      // Sum points
      grouped[key].points += event.points || 0;
    });
    
    // Convert to array, format winners as comma-separated strings, and sort by age category
    return Object.values(grouped)
      .map(item => ({
        ...item,
        first: item.first.join(', '),
        second: item.second.join(', '),
        third: item.third.join(', ')
      }))
      .sort((a, b) => {
        // First sort by age category (increasing order)
        const ageA = getAgeCategorySortValue(a.age);
        const ageB = getAgeCategorySortValue(b.age);
        if (ageA !== ageB) {
          return ageA - ageB;
        }
        // If same age category, sort by event name
        return a.event.localeCompare(b.event);
      });
  };

  // Function to group and aggregate team events
  const groupTeamEvents = (events) => {
    const grouped = {};
    
    events.forEach(event => {
      const key = `${event.event}|${event.gender}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          event: event.event,
          gender: event.gender,
          result: [],
          points: 0
        };
      }
      
      // Collect results
      if (event.result) {
        grouped[key].result.push(event.result);
      }
      
      // Sum points
      grouped[key].points += event.points || 0;
    });
    
    // Convert to array and format results as comma-separated strings
    return Object.values(grouped).map(item => ({
      ...item,
      result: item.result.join(', ')
    }));
  };

  useEffect(() => {
    const fetchTempleDetailedReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const templeId = searchParams.get('temple_id');
        if (!templeId) {
          throw new Error('Temple ID is required');
        }

        const data = await userAPI.getTempleDetailedReport(templeId);
        
        // Group and aggregate individual events
        const groupedIndividualEvents = groupIndividualEvents(data.individualEvents || []);
        setIndividualEvents(groupedIndividualEvents);
        
        // Group and aggregate team events
        const groupedTeamEvents = groupTeamEvents(data.teamEvents || []);
        setTeamEvents(groupedTeamEvents);
        
        // Recalculate total points based on grouped data
        const recalculatedTotalPoints = {
          individual: groupedIndividualEvents.reduce((sum, event) => sum + event.points, 0),
          team: groupedTeamEvents.reduce((sum, event) => sum + event.points, 0),
          total: 0
        };
        recalculatedTotalPoints.total = recalculatedTotalPoints.individual + recalculatedTotalPoints.team;
        setTotalPoints(recalculatedTotalPoints);
        
        setTempleInfo(data.temple);
      } catch (err) {
        console.error('Error fetching temple detailed report:', err);
        setError(err.message);
        setIndividualEvents([]);
        setTeamEvents([]);
        setTotalPoints({ individual: 0, team: 0, total: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchTempleDetailedReport();

    // Listen for global logout events
    const handleAuthLogout = () => {
      console.log('Templedetailedreports: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, [searchParams]);
  // Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
          <span className="ml-3 text-[#D35D38]">Loading temple detailed report...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  // Print function for temple detailed report
  const handlePrint = () => {
    if (!templeInfo) return;
    
    const printWindow = window.open('', '_blank');
    
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Temple Detailed Report - ${templeInfo.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 20px; font-weight: bold; margin-bottom: 6px; }
          .main-title { font-size: 24px; font-weight: bold; margin-bottom: 6px; }
          .place { font-size: 14px; margin-bottom: 6px; color: black; }
          .section-title { font-size: 18px; font-weight: bold; margin-top: 3px; margin-bottom: 15px; color: black; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #D35D38; color: white; font-weight: bold; }
          .points-cell { font-weight: bold; color: #D35D38; }
          .total-points-table { width: 60%; margin: 20px auto; }
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
          <div class="section-title">${templeInfo.name}</div>
          <div class="section-title">Detailed Report</div>
        </div>
        
        <!-- Individual Events -->
        <div class="section-title">Individual Events</div>
        <table>
          <thead>
            <tr>
              <th>SL.NO</th>
              <th>Event</th>
              <th>Age Category</th>
              <th>Gender</th>
              <th>First</th>
              <th>Second</th>
              <th>Third</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            ${individualEvents.length > 0 ? individualEvents.map((row, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${row.event}</td>
                <td>${row.age}</td>
                <td>${row.gender}</td>
                <td>${row.first || '-'}</td>
                <td>${row.second || '-'}</td>
                <td>${row.third || '-'}</td>
                <td class="points-cell">${row.points}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="8" style="text-align: center; color: #666;">No individual events with results found</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <!-- Team Events -->
        <div class="section-title">Team Events</div>
        <table>
          <thead>
            <tr>
              <th>SL.NO</th>
              <th>Event</th>
              <th>Gender</th>
              <th>Result</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            ${teamEvents.length > 0 ? teamEvents.map((row, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${row.event}</td>
                <td>${row.gender}</td>
                <td>${row.result || '-'}</td>
                <td class="points-cell">${row.points}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; color: #666;">No team events with results found</td>
              </tr>
            `}
          </tbody>
        </table>
        
        <!-- Total Points -->
        <div class="section-title">Total Points</div>
        <table class="total-points-table">
          <thead>
            <tr>
              <th>Individual Event Points</th>
              <th>Team Event Points</th>
              <th>Total Points</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="points-cell">${totalPoints.individual}</td>
              <td class="points-cell">${totalPoints.team}</td>
              <td class="points-cell" style="color: #B84A2E; font-size: 16px;">${totalPoints.total}</td>
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
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Print Button */}
        {templeInfo && (
          <div className="mb-4 flex justify-end no-print">
            <button
              onClick={handlePrint}
              className="bg-[#D35D38] hover:bg-[#B84A2E] text-white font-bold py-2 px-4 rounded shadow-md transition-colors duration-200 flex items-center gap-2"
              title="Print temple detailed report"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
          </div>
        )}

      {/* Temple Header */}
      {templeInfo && (
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-[#D35D38] mb-2">{templeInfo.name} - Detailed Report</h1>
          {/* <p className="text-lg text-gray-600">Temple Name: {templeInfo.code}</p> */}
        </div>
      )}

      {/* Individual Events */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#D35D38] mb-4">Individual Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-orange-200">
            <thead className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E]">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">SL.NO</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Event</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Age Category</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Gender</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">First</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Second</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Third</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-orange-100">
              {individualEvents.length > 0 ? (
                individualEvents.map((row, idx) => (
                <tr key={idx} className="hover:bg-orange-50 transition">
                  <td className="px-4 py-2 font-semibold text-[#D35D38]">{idx + 1}</td>
                  <td className="px-4 py-2">{row.event}</td>
                  <td className="px-4 py-2">{row.age}</td>
                  <td className="px-4 py-2">{row.gender}</td>
                  <td className="px-4 py-2">{row.first}</td>
                  <td className="px-4 py-2">{row.second}</td>
                  <td className="px-4 py-2">{row.third}</td>
                  <td className="px-4 py-2 font-bold text-[#D35D38]">{row.points}</td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No individual events with results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Events */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#D35D38] mb-4">Team Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-orange-200">
            <thead className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E]">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">SL.NO</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Event</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Gender</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Result</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-orange-100">
              {teamEvents.length > 0 ? (
                teamEvents.map((row, idx) => (
                <tr key={idx} className="hover:bg-orange-50 transition">
                  <td className="px-4 py-2 font-semibold text-[#D35D38]">{idx + 1}</td>
                  <td className="px-4 py-2">{row.event}</td>
                  <td className="px-4 py-2">{row.gender}</td>
                  <td className="px-4 py-2">{row.result}</td>
                  <td className="px-4 py-2 font-bold text-[#D35D38]">{row.points}</td>
                </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No team events with results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Points */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-[#D35D38] mb-4">Total Points</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white max-w-md mx-auto">
          <table className="min-w-full divide-y divide-orange-200">
            <thead className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E]">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Individual Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Team Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Total Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-orange-100">
              <tr>
                <td className="px-4 py-2 font-bold text-[#D35D38]">{totalPoints.individual}</td>
                <td className="px-4 py-2 font-bold text-[#D35D38]">{totalPoints.team}</td>
                <td className="px-4 py-2 font-bold text-[#B84A2E]">{totalPoints.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </>
  )
}

export default Templedetailedreports