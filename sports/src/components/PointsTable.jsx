import React, { useState, useEffect } from 'react';
import { userAPI } from '../utils/api';

const PointsTable = () => {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('points'); // 'points', 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'

  // Fetch temples data
  const fetchTemples = async () => {
    try {
      setLoading(true);
      setError(null);
      const templeData = await userAPI.getAllTemples();
      
      // Transform temple data to include only essential stats
      const transformedTemples = templeData.map((temple) => ({
        id: temple.id,
        name: temple.name,
        total_points: temple.total_points || 0
      }));
      
      setTemples(transformedTemples);
    } catch (err) {
      console.error('Error fetching temples:', err);
      setError(err.message);
      setTemples([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemples();
  }, []);

  // Sort temples based on selected criteria
  const sortedTemples = [...temples].sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default: // points
        aValue = a.total_points;
        bValue = b.total_points;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (criteria) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('desc');
    }
  };


  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
        <span className="ml-2 text-[#2A2A2A]">Loading points table...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">🏛️ Points Table</h1>
        <p className="text-[#5A5A5A] mt-1">All temples ranked by performance</p>
      </div>

      {/* Points Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#D35D38] border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-white">Temple Rankings</h3>
          <p className="text-xs sm:text-sm text-white/80 mt-1">{temples.length} temples competing</p>
        </div>
        
        {/* Mobile/Tablet View - Single Column */}
        <div className="overflow-x-auto lg:hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Rank
                </th>
                <th 
                  className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  Temple Name
                  {sortBy === 'name' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
                <th 
                  className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('points')}
                >
                  Total Points
                  {sortBy === 'points' && (
                    <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedTemples.map((temple, index) => (
                <tr key={temple.id} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-[#2A2A2A]">
                      {temple.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <span className="text-sm sm:text-lg font-bold text-[#D35D38]">
                      {temple.total_points}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desktop View - Two Columns */}
        <div className="hidden lg:block">
          <div className="grid grid-cols-2 gap-6">
            {/* Left Column - First 8 Temples */}
            <div>
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-[#2A2A2A] uppercase tracking-wider">Positions 1-8</h4>
              </div>
              <div className="bg-white">
                {sortedTemples.slice(0, 8).map((temple, index) => (
                  <div key={temple.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-600' :
                        'bg-gray-300 text-gray-700'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="text-sm font-medium text-[#2A2A2A]">
                        {temple.name}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#D35D38]">
                      {temple.total_points}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Next 8 Temples */}
            <div>
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-[#2A2A2A] uppercase tracking-wider">Positions 9-16</h4>
              </div>
              <div className="bg-white">
                {sortedTemples.slice(8, 16).map((temple, index) => (
                  <div key={temple.id} className="flex items-center justify-between px-4 py-3 border-b border-gray-200 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gray-300 text-gray-700">
                        {index + 9}
                      </div>
                      <div className="text-sm font-medium text-[#2A2A2A]">
                        {temple.name}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-[#D35D38]">
                      {temple.total_points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Statistics */}
      {/* {temples.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-[#D35D38] mb-4 text-center">📊 Statistics</h3>
          <div className="grid grid-cols-2 gap-6 text-center">
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {temples.length}
              </p>
              <p className="text-sm text-[#5A5A5A]">Total Temples</p>
            </div>
            <div className="bg-[#F8DFBE] rounded-lg p-4">
              <p className="text-2xl font-bold text-[#D35D38]">
                {temples.reduce((sum, temple) => sum + temple.total_points, 0)}
              </p>
              <p className="text-sm text-[#5A5A5A]">Total Points</p>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default PointsTable;
