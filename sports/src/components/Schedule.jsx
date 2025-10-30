import React, { useState, useEffect } from 'react';
import { eventAPI, viewerAPI } from '../utils/api.js';

const Schedule = ({ 
  apiSource = 'staff', // 'staff', 'admin', or 'viewer'
  className = ""
}) => {
  const [scheduleData, setScheduleData] = useState({ individual: [], team: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchScheduleData();
  }, [apiSource]);

  const fetchScheduleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Fetch data based on API source
      switch (apiSource) {
        case 'staff':
          // For staff, getAllEventsComplete already returns separated individual and team arrays
          const eventsData = await eventAPI.getAllEventsComplete();
          data = {
            individual: eventsData.individual || [],
            team: eventsData.team || []
          };
          break;
          
        case 'admin':
          const adminEventsData = await eventAPI.getAllEvents();
          data = {
            individual: adminEventsData.events.filter(event => event.event_type.type === 'INDIVIDUAL'),
            team: adminEventsData.events.filter(event => event.event_type.type === 'TEAM')
          };
          break;
          
        case 'viewer':
          const viewerEventsData = await viewerAPI.getEvents();
          data = {
            individual: viewerEventsData.events.filter(event => event.event_type.type === 'INDIVIDUAL'),
            team: viewerEventsData.events.filter(event => event.event_type.type === 'TEAM')
          };
          break;
          
        default:
          throw new Error('Invalid API source');
      }
      
      setScheduleData(data);
    } catch (err) {
      console.error('Error fetching schedule data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
        <span className="ml-2 text-[#2A2A2A]">Loading schedule...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {error}
        <button
          onClick={fetchScheduleData}
          className="mt-2 ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
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
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">📅 Complete Event Schedule</h1>
        <p className="text-[#5A5A5A] mt-1">All individual and team events organized by age category and gender</p>
      </div>

      {/* Individual Events Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#F8DFBE] border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-black">🏃 Individual Events ({scheduleData.individual.length})</h3>
          <p className="text-xs sm:text-sm text-black/80 mt-1">Individual competitions by age category and gender</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL.NO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Age Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduleData.individual.length > 0 ? (
                scheduleData.individual.map((event, index) => (
                  <tr key={event.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      10:00 AM
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.age_category?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.gender || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                    No individual events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Events Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#F8DFBE] border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-black">🤝 Team Events ({scheduleData.team.length})</h3>
          <p className="text-xs sm:text-sm text-black/80 mt-1">Team competitions by gender</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SL.NO</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scheduleData.team.length > 0 ? (
                scheduleData.team.map((event, index) => (
                  <tr key={event.id || index} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      10:00 AM
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.gender || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    No team events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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

export default Schedule;
