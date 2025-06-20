import React, { useState, useEffect } from 'react'
import { getCurrentUserTemple } from '../utils/templeUtils'

const Participantslist = () => {
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [templeName, setTempleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);

  useEffect(() => {
    const fetchTempleName = async () => {
      try {
        const templeInfo = await getCurrentUserTemple();
        setTempleName(templeInfo.name);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching temple name:', error);
        setTempleName('Temple Name Unavailable');
        setLoading(false);
      }
    };

    const fetchParticipants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:4000/api/users/templeusers', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch participants');
        }

        const data = await response.json();
        setParticipants(data);
        setParticipantsLoading(false);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setParticipantsLoading(false);
      }
    };

    fetchTempleName();
    fetchParticipants();
  }, []);

  const filteredParticipants = participants.filter(participant => {
    return (selectedAgeCategory === '' || participant.age_category === selectedAgeCategory) &&
           (selectedGender === '' || participant.gender === selectedGender);
  });

  return (
    <div className="h-full w-full bg-gradient-to-br from-blue-50 to-purple-100 ">
      <div className="h-full w-full px-2 sm:px-3 md:px-4 py-3 sm:py-4 md:py-6 pb-10">
        <div className="h-full w-full mx-auto pb-[50px]">
          <h4 className="text-center text-base sm:text-lg lg:text-xl font-bold mb-2 sm:mb-3 lg:mb-4 text-blue-800">33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ , 2025</h4>
          <div className="mb-3 sm:mb-4 lg:mb-6 pb-[30px] ">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-700 mx-auto"></div>
              </div>
            ) : (
              <h4 className="text-center text-sm sm:text-base lg:text-lg font-semibold mb-2 sm:mb-3 text-purple-700">{templeName}</h4>
            )}
            
            {/* Filters Section */}
            <div className="mb-2 sm:mb-3 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <select
                value={selectedAgeCategory}
                onChange={(e) => setSelectedAgeCategory(e.target.value)}
                className="w-full sm:w-auto p-1.5 sm:p-2 border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-xs sm:text-sm"
              >
                <option value="">All Age Categories</option>
                <option value="0-5">0-5</option>
                <option value="6-10">6-10</option>
                <option value="11-14">11-14</option>
                <option value="15-18">15-18</option>
                <option value="19-24">19-24</option>
                <option value="25-35">25-35</option>
                <option value="36-48">36-48</option>
                <option value="49-60">49-60</option>
                <option value="61-90">61-90</option>
              </select>
              <select
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full sm:w-auto p-1.5 sm:p-2 border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-xs sm:text-sm"
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            {/* Table Section */}
            <div className="rounded-lg shadow-lg bg-white overflow-hidden ">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-blue-200 ">
                  <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
                    <tr>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">SL.NO</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Category</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Aadhar No</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">DOB</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Gender</th>
                      <th scope="col" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-white uppercase tracking-wider whitespace-nowrap">Phone No</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-blue-100">
                    {participantsLoading ? (
                      <tr>
                        <td colSpan="7" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-700 mx-auto"></div>
                        </td>
                      </tr>
                    ) : filteredParticipants.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 text-center text-gray-500">
                          No participants found
                        </td>
                      </tr>
                    ) : (
                      filteredParticipants.map((participant, idx) => (
                        <tr key={participant.id} className="hover:bg-blue-50 transition">
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm font-semibold text-blue-900">{idx + 1}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.name}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.age_category}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.aadhar_number}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.date_of_birth}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.gender}</td>
                          <td className="px-1.5 sm:px-2 md:px-3 py-1 sm:py-1.5 md:py-2 whitespace-nowrap text-[10px] sm:text-[11px] md:text-sm text-gray-900">{participant.phone_number}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Participantslist