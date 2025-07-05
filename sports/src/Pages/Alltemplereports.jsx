import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom';

const Alltemplereports = () => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTempleReports = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                if (!token) {
                    throw new Error('No authentication token found');
                }

                const response = await fetch('http://localhost:4000/api/users/temples', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch temple reports');
                }

                const temples = await response.json();
                
                // Transform temple data to include points from backend
                const templeReportsData = temples.map((temple) => ({
                    temple_id: temple.id,
                    temple_name: temple.name,
                    total_points: temple.total_points || 0
                }));
                
                setReport(templeReportsData);
            } catch (err) {
                console.error('Error fetching temple reports:', err);
                setError(err.message);
                setReport([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTempleReports();
    }, []);

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-2 drop-shadow">Temple Points Leaderboard</h1>
          <p className="text-lg text-gray-600">See the points and participants for each temple</p>
        </div>
        
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-blue-800">Loading temple reports...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        )}

        {/* Temple Reports Table */}
        {!loading && !error && (
          <div className="overflow-x-auto rounded-2xl shadow-xl bg-white">
            <table className="min-w-full divide-y divide-blue-200">
              <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">SL.NO</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Temple Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Total Points</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">View Points</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">View All Participants</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-blue-100">
                {report.length > 0 ? (
                  report.map((temple_info, idx) => (
                    <tr key={temple_info.temple_id} className="hover:bg-blue-50 transition">
                      <td className="px-6 py-4 font-semibold text-blue-900">{idx + 1}</td>
                      <td className="px-6 py-4 font-semibold text-purple-800">{temple_info.temple_name}</td>
                      <td className="px-6 py-4 text-blue-700 font-bold">{temple_info.total_points}</td>
                      <td className="px-6 py-4">
                        <Link to="/templedetailedreport"><a
                          href={`/temple_detailed_report/?temple_id=${temple_info.temple_id}`}
                          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-red-600 transition font-semibold text-sm"
                        >
                          View Points
                        </a> </Link>
                        
                      </td>
                      <td className="px-6 py-4">
                        <Link to="/participantslist"><a
                          href={`/temple_participants/?temple_id=${temple_info.temple_id}`}
                          className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg shadow hover:bg-red-600 transition font-semibold text-sm"
                        >
                          View All Participants
                        </a> </Link>
                        
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No temple reports available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default Alltemplereports