import React, { useState, useEffect } from 'react';
import { templeAPI, viewerAPI, userAPI } from '../utils/api.js';

const TempleManagement = ({ 
  apiSource = 'admin', // 'admin', 'viewer', or 'staff'
  showSummaryCards = true,
  showContactInfo = true,
  showParticipants = true,
  className = ""
}) => {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTempleData();
  }, [apiSource]);

  const fetchTempleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Fetch data based on API source
      switch (apiSource) {
        case 'admin':
          data = await templeAPI.getTempleManagement();
          if (!data.temples) {
            throw new Error('Invalid response format: temples data not found');
          }
          setTemples(data.temples);
          break;
          
        case 'viewer':
          data = await viewerAPI.getTempleManagement();
          if (!data.temples) {
            throw new Error('Invalid response format: temples data not found');
          }
          setTemples(data.temples);
          break;
          
        case 'staff':
          const templesData = await userAPI.getAllTemples();
          // userAPI.getAllTemples() returns data directly (not wrapped in temples property)
          // and already includes total_points, so we can use it directly
          setTemples(templesData);
          break;
          
        default:
          throw new Error('Invalid API source');
      }
    } catch (err) {
      console.error('Error fetching temple data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">Temple Management</h3>
          <p className="text-[#5A5A5A]">View and manage all temples and their statistics</p>
        </div>
        <button
          onClick={fetchTempleData}
          className="bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
          <span className="ml-3 text-[#2A2A2A]">Loading temple data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={fetchTempleData}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Temple Management Table */}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-2xl shadow-xl bg-white">
          <table className="min-w-full divide-y divide-[#F8DFBE]">
            <thead className="bg-[#D35D38]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">SL.NO</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Temple Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Total Points</th>
                {showParticipants && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Participants</th>
                )}
                {showContactInfo && (
                  <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Contact Info</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#F8DFBE]">
              {temples.length > 0 ? (
                temples.map((temple, idx) => (
                  <tr key={temple.id} className="hover:bg-[#F8DFBE] transition">
                    <td className="px-6 py-4 font-semibold text-[#2A2A2A]">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-[#2A2A2A]">{temple.name}</div>
                        {temple.address && (
                          <div className="text-sm text-gray-500">{temple.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#D35D38] font-bold text-lg">{temple.total_points}</td>
                    {showParticipants && (
                      <td className="px-6 py-4">
                        <div className="text-center">
                          <div className="font-bold text-lg text-[#2A2A2A]">{temple.total_participants}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </td>
                    )}
                    {showContactInfo && (
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {/* Temple Contact Info */}
                          {temple.contact_name && (
                            <div className="mb-2">
                              <div className="text-xs text-gray-500 font-medium">Temple Contact:</div>
                              <div className="text-[#2A2A2A] font-medium">{temple.contact_name}</div>
                              {temple.contact_phone && (
                                <div className="text-[#D35D38]">{temple.contact_phone}</div>
                              )}
                            </div>
                          )}
                          
                          {/* Temple Admin Contact Info */}
                          {temple.temple_admins && temple.temple_admins.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 font-medium">Temple Admin{temple.temple_admins.length > 1 ? 's' : ''}:</div>
                              {temple.temple_admins.map((admin, index) => (
                                <div key={index} className="mb-1 last:mb-0">
                                  <div className="text-[#2A2A2A] font-medium">{admin.name}</div>
                                  {admin.email && (
                                    <div className="text-[#D35D38] text-xs">{admin.email}</div>
                                  )}
                                  {admin.phone && (
                                    <div className="text-[#D35D38] text-xs">{admin.phone}</div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Show message if no contact info available */}
                          {!temple.contact_name && (!temple.temple_admins || temple.temple_admins.length === 0) && (
                            <div className="text-gray-400 text-xs">No contact info available</div>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => window.open(`/templedetailedreport/?temple_id=${temple.id}`, '_blank')}
                          className="inline-block px-3 py-1 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-xs"
                        >
                          View Points
                        </button>
                        <button 
                          onClick={() => window.open(`/participantslist/?temple_id=${temple.id}`, '_blank')}
                          className="inline-block px-3 py-1 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-xs"
                        >
                          View All Participants
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showContactInfo && showParticipants ? "6" : showContactInfo || showParticipants ? "5" : "4"} className="px-6 py-8 text-center text-gray-500">
                    No temples found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {showSummaryCards && !loading && !error && temples.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Temples</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{temples.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏛️</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Participants</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {temples.reduce((sum, temple) => sum + temple.total_participants, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Points</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {temples.reduce((sum, temple) => sum + temple.total_points, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🏆</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Accepted</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {temples.reduce((sum, temple) => sum + temple.accepted_participants, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">✅</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TempleManagement;
