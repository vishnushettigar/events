import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom';

const Templedetailedreports = () => {
  const [searchParams] = useSearchParams();
  const [individualEvents, setIndividualEvents] = useState([]);
  const [teamEvents, setTeamEvents] = useState([]);
  const [totalPoints, setTotalPoints] = useState({ individual: 0, team: 0, total: 0 });
  const [templeInfo, setTempleInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTempleDetailedReport = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const templeId = searchParams.get('temple_id');
        if (!templeId) {
          throw new Error('Temple ID is required');
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:4000/api/users/temple-detailed-report/${templeId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch temple detailed report');
        }

        const data = await response.json();
        
        setIndividualEvents(data.individualEvents || []);
        setTeamEvents(data.teamEvents || []);
        setTotalPoints(data.totalPoints || { individual: 0, team: 0, total: 0 });
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
  }, [searchParams]);
  // Loading State
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-4">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-blue-800">Loading temple detailed report...</span>
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

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Temple Header */}
      {templeInfo && (
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-blue-800 mb-2">{templeInfo.name} - Detailed Report</h1>
          <p className="text-lg text-gray-600">Temple Code: {templeInfo.code}</p>
        </div>
      )}

      {/* Individual Events */}
      <div className="mb-10">
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Individual Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
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
            <tbody className="bg-white divide-y divide-blue-100">
              {individualEvents.length > 0 ? (
                individualEvents.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-semibold text-blue-900">{idx + 1}</td>
                    <td className="px-4 py-2">{row.event}</td>
                    <td className="px-4 py-2">{row.age}</td>
                    <td className="px-4 py-2">{row.gender}</td>
                    <td className="px-4 py-2">{row.first}</td>
                    <td className="px-4 py-2">{row.second}</td>
                    <td className="px-4 py-2">{row.third}</td>
                    <td className="px-4 py-2 font-bold text-purple-700">{row.points}</td>
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
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Team Events</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">SL.NO</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Event</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Gender</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Result</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {teamEvents.length > 0 ? (
                teamEvents.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-2 font-semibold text-blue-900">{idx + 1}</td>
                    <td className="px-4 py-2">{row.event}</td>
                    <td className="px-4 py-2">{row.gender}</td>
                    <td className="px-4 py-2">{row.result}</td>
                    <td className="px-4 py-2 font-bold text-purple-700">{row.points}</td>
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
        <h2 className="text-3xl font-extrabold text-blue-800 mb-4">Total Points</h2>
        <div className="overflow-x-auto rounded-xl shadow bg-white max-w-md mx-auto">
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Individual Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Team Event Points</th>
                <th className="px-4 py-2 text-xs font-bold text-white uppercase">Total Points</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              <tr>
                <td className="px-4 py-2 font-bold text-blue-700">{totalPoints.individual}</td>
                <td className="px-4 py-2 font-bold text-purple-700">{totalPoints.team}</td>
                <td className="px-4 py-2 font-bold text-green-700">{totalPoints.total}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Templedetailedreports