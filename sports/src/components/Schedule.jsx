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
                              <span><strong>Participants:</strong> {event.participant_count || event.event_type?.participant_count || 0}</span>
                              <span><strong>Registered:</strong> {event.registrations_count || 0}</span>
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
                            <span><strong>Team Size:</strong> {event.participant_count || event.event_type?.participant_count || 0}</span>
                            <span><strong>Registered:</strong> {event.team_registrations_count || event.registrations_count || 0}</span>
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

export default Schedule;
