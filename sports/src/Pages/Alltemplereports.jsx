import React from 'react'
import { Link } from 'react-router-dom';



const Alltemplereports = () => {
    // Example data. Replace this with your actual data or fetch from API/props.
const report = [
  { temple_id: 15, temple_name: 'SIDDAKATTE', total_points: 125 },
  { temple_id: 1, temple_name: 'SALIKERI', total_points: 108 },
  { temple_id: 4, temple_name: 'MANJESHWARA', total_points: 84 },
  { temple_id: 13, temple_name: 'KALYANPURA', total_points: 74 },
  { temple_id: 14, temple_name: 'KARKALA', total_points: 69 },
  { temple_id: 8, temple_name: 'MULKI', total_points: 64 },
  { temple_id: 2, temple_name: 'BARKUR', total_points: 0 },
  { temple_id: 6, temple_name: 'SURATHKAL', total_points: 35 },
  { temple_id: 10, temple_name: 'YERMAL', total_points: 0 },
  { temple_id: 16, temple_name: 'MANGALORE', total_points: 0 },
  { temple_id: 5, temple_name: 'ULLALA', total_points: 0 },
  { temple_id: 7, temple_name: 'HALEYANGADI', total_points: 25 },
  { temple_id: 12, temple_name: 'KINNIMULKI', total_points: 0 },
  { temple_id: 11, temple_name: 'KAPU', total_points: 0 },
  { temple_id: 3, temple_name: 'HOSADURGA', total_points: 0 },
  { temple_id: 9, temple_name: 'PADUBIDRI', total_points: 0 },
];

  return (
    <section className="w-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-800 mb-2 drop-shadow">Temple Points Leaderboard</h1>
          <p className="text-lg text-gray-600">See the points and participants for each temple</p>
        </div>
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
              {report.map((temple_info, idx) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default Alltemplereports