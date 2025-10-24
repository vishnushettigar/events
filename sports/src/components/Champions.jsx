import React, { useState, useEffect } from 'react';
import { reportAPI, viewerAPI, userAPI } from '../utils/api.js';

const Champions = ({ 
  apiSource = 'staff', // 'staff', 'admin', or 'viewer'
  className = ""
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topTemples, setTopTemples] = useState([]);
  const [loadingTopTemples, setLoadingTopTemples] = useState(false);
  const [topTemplesError, setTopTemplesError] = useState(null);

  useEffect(() => {
    fetchChampions();
    fetchTopTemples();
  }, [apiSource]);

  const fetchChampions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Fetch data based on API source
      switch (apiSource) {
        case 'staff':
          data = await reportAPI.getChampions();
          break;
          
        case 'admin':
          data = await reportAPI.getChampions();
          break;
          
        case 'viewer':
          data = await viewerAPI.getChampions();
          break;
          
        default:
          throw new Error('Invalid API source');
      }
      
      setData(data);
    } catch (err) {
      console.error('Error fetching champions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopTemples = async () => {
    try {
      setLoadingTopTemples(true);
      setTopTemplesError(null);
      
      const temples = await userAPI.getAllTemples();
      
      // Calculate total points for each temple and get top 5
      const topTemplesData = temples
        .map(temple => ({
          temple_id: temple.id,
          temple_name: temple.name,
          total_points: temple.total_points || 0
        }))
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 5); // Top 5 temples
      
      setTopTemples(topTemplesData);
    } catch (err) {
      console.error('Error fetching top temples:', err);
      setTopTemplesError(err.message);
    } finally {
      setLoadingTopTemples(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
        <span className="ml-2 text-[#2A2A2A]">Loading champions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <strong>Error:</strong> {error}
        <button
          onClick={fetchChampions}
          className="mt-2 ml-4 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#5A5A5A]">No champions data available yet.</p>
      </div>
    );
  }

  // Flatten champions data for table display
  const allChampions = [];
  data.forEach((category, categoryIndex) => {
    if (category.champions && Array.isArray(category.champions)) {
      category.champions.forEach((champion, championIndex) => {
        allChampions.push({
          rank: championIndex + 1,
          category: `${category.age_category} - ${category.gender}`,
          age_category: category.age_category,
          gender: category.gender,
          name: champion.name,
          temple: champion.temple,
          aadhar_number: champion.aadhar_number,
          points: champion.points,
          events_count: champion.events ? champion.events.length : 0,
          events: champion.events || []
        });
      });
    }
  });

  // Define age category order for proper sorting
  const ageCategoryOrder = {
    '11-14': 1,
    '15-18': 2,
    '19-24': 3,
    '25-35': 4,
    '36-49': 5,
    '50-60': 6
  };

  // Sort by age category first, then by points within each category
  allChampions.sort((a, b) => {
    const ageOrderA = ageCategoryOrder[a.age_category] || 999;
    const ageOrderB = ageCategoryOrder[b.age_category] || 999;
    
    if (ageOrderA !== ageOrderB) {
      return ageOrderA - ageOrderB;
    }
    
    // Within same age category, sort by points (highest first)
    return b.points - a.points;
  });

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#2A2A2A]">🏆 Champions</h1>
        <p className="text-[#5A5A5A] mt-1">Top performers from all categories</p>
      </div>

      {/* Top 5 Temples Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#D35D38] border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-white">🏛️ Top 5 Temples</h3>
            <p className="text-xs sm:text-sm text-white/80 mt-1">Temples ranked by total points</p>
          </div>
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Top 5 Temples - Champions</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .place { font-size: 16px; margin-bottom: 10px; color: #666; }
                    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .rank-badge { padding: 4px 8px; border-radius: 50%; color: white; font-weight: bold; }
                    .rank-1 { background-color: #ffd700; }
                    .rank-2 { background-color: #c0c0c0; }
                    .rank-3 { background-color: #cd7f32; }
                    .rank-other { background-color: #6c757d; }
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
                    <div class="section-title">🏛️ Top 5 Temples</div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Temple Name</th>
                        <th>Total Points</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${topTemples.map((temple, index) => `
                        <tr>
                          <td>
                            ${index === 0 ? '🥇' : 
                              index === 1 ? '🥈' : 
                              index === 2 ? '🥉' : 
                              index + 1}
                          </td>
                          <td>${temple.temple_name}</td>
                          <td><strong>${temple.total_points}</strong></td>
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
            className="bg-white text-[#D35D38] px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            🖨️ Print
          </button>
        </div>
        
        {loadingTopTemples ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
            <span className="ml-3 text-[#2A2A2A]">Loading top temples...</span>
          </div>
        ) : topTemplesError ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 m-4 rounded">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {topTemplesError}</span>
          </div>
        ) : topTemples.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Temple Name
                  </th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                    Total Points
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topTemples.map((temple, index) => (
                  <tr key={temple.temple_id} className="hover:bg-gray-50">
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        {index === 0 ? (
                          <span className="text-2xl">🥇</span>
                        ) : index === 1 ? (
                          <span className="text-2xl">🥈</span>
                        ) : index === 2 ? (
                          <span className="text-2xl">🥉</span>
                        ) : (
                          <span className="text-sm sm:text-base font-medium text-[#2A2A2A]">
                            {index + 1}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <div className="text-xs sm:text-sm font-medium text-[#2A2A2A]">
                        {temple.temple_name}
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
        ) : (
          <div className="p-6 text-center text-[#5A5A5A]">
            No temple data available
          </div>
        )}
      </div>

      {/* Champions Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-4 bg-[#F8DFBE] border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#2A2A2A]">🏆 Champions Leaderboard</h3>
            <p className="text-xs sm:text-sm text-[#5A5A5A] mt-1">{allChampions.length} champions ranked by total points</p>
          </div>
          <button
            onClick={() => {
              const printWindow = window.open('', '_blank');
              const printContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Champions Leaderboard</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .main-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                    .place { font-size: 16px; margin-bottom: 10px; color: #666; }
                    .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #D35D38; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background-color: #f2f2f2; font-weight: bold; }
                    .rank-badge { padding: 4px 8px; border-radius: 50%; color: white; font-weight: bold; }
                    .rank-1 { background-color: #ffd700; }
                    .rank-2 { background-color: #c0c0c0; }
                    .rank-3 { background-color: #cd7f32; }
                    .rank-other { background-color: #6c757d; }
                    .result-badge { padding: 2px 6px; border-radius: 4px; font-size: 12px; }
                    .first { background-color: #fff3cd; color: #856404; }
                    .second { background-color: #f8f9fa; color: #6c757d; }
                    .third { background-color: #ffeaa7; color: #d63031; }
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
                    <div class="section-title">🏆 Champions Leaderboard</div>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th>SL.NO</th>
                        <th>Category</th>
                        <th>Name</th>
                        <th>Temple</th>
                        <th>Aadhar No</th>
                        <th>Points</th>
                        <th>Events Won</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${allChampions.map((champion, index) => `
                        <tr>
                          <td>
                            <span class="rank-badge ${
                              index === 0 ? 'rank-1' : 
                              index === 1 ? 'rank-2' : 
                              index === 2 ? 'rank-3' : 'rank-other'
                            }">
                              ${index + 1}
                            </span>
                          </td>
                          <td>${champion.category || 'N/A'}</td>
                          <td>${champion.name || 'N/A'}</td>
                          <td>${champion.temple || 'N/A'}</td>
                          <td>${champion.aadhar_number || 'N/A'}</td>
                          <td><strong>${champion.points || 0}</strong></td>
                          <td>${champion.events_count || 0}</td>
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
            🖨️ Print
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  SL.NO
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Category
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Champion
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Temple
                </th>
                <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Aadhar Number
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Total Points
                </th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-[#2A2A2A] uppercase tracking-wider">
                  Events Won
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allChampions.map((champion, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm sm:text-base font-medium text-[#2A2A2A]">
                        {index + 1}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                    {champion.category}
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-medium text-[#2A2A2A]">
                      {champion.name}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                    {champion.temple}
                  </td>
                  <td className="hidden md:table-cell px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                    {champion.aadhar_number}
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                    <span className="text-sm sm:text-lg font-bold text-[#D35D38]">
                      {champion.points}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-[#5A5A5A]">
                    {champion.events_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      {allChampions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-lg font-semibold text-[#D35D38]">{allChampions.length}</p>
              <p className="text-xs text-[#5A5A5A]">Total Champions</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#D35D38]">
                {allChampions.reduce((sum, champ) => sum + champ.points, 0)}
              </p>
              <p className="text-xs text-[#5A5A5A]">Total Points</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#D35D38]">
                {allChampions.reduce((sum, champ) => sum + champ.events_count, 0)}
              </p>
              <p className="text-xs text-[#5A5A5A]">Events Won</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[#D35D38]">
                {allChampions.length > 0 ? Math.round(allChampions.reduce((sum, champ) => sum + champ.points, 0) / allChampions.length) : 0}
              </p>
              <p className="text-xs text-[#5A5A5A]">Avg Points</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Champions;
