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
    <div className="min-h-screen bg-[#F0F0F0] py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-4">
            33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ , 2025
          </h1>
            {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
              </div>
            ) : (
            <p className="text-xl text-[#5A5A5A] font-semibold">{templeName}</p>
            )}
        </div>
            
            {/* Filters Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#2A2A2A] mb-4">Filter Participants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="ageCategory" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Age Category
              </label>
              <select
                id="ageCategory"
                value={selectedAgeCategory}
                onChange={(e) => setSelectedAgeCategory(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
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
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-semibold text-[#2A2A2A] mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
              >
                <option value="">All Genders</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>
          </div>
        </div>

        {/* Participants Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-[#D35D38] to-[#B84A2E]">
            <h2 className="text-2xl font-bold text-white">Participants List</h2>
            <p className="text-white/80 text-sm mt-1">
              {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} found
            </p>
            </div>

              <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    SL.NO
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Aadhar No
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Date of Birth
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Gender
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider">
                    Phone No
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {participantsLoading ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="flex justify-center items-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
                        <span className="ml-3 text-[#5A5A5A]">Loading participants...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredParticipants.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center">
                      <div className="text-center">
                        <p className="text-[#5A5A5A] text-lg">No participants found</p>
                        <p className="text-[#5A5A5A] text-sm mt-1">Try adjusting your filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredParticipants.map((participant, idx) => (
                    <tr key={participant.id} className="hover:bg-[#F8DFBE] transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-[#D35D38] text-white text-sm font-bold rounded-full">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-[#2A2A2A]">{participant.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {participant.age_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5A5A5A] font-mono">{participant.aadhar_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5A5A5A]">{participant.date_of_birth}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          participant.gender === 'MALE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {participant.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5A5A5A]">{participant.phone_number}</div>
                      </td>
                    </tr>
                  ))
                )}
                  </tbody>
                </table>
          </div>
        </div>

        {/* Summary Stats */}
        {!participantsLoading && filteredParticipants.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-6 mt-8">
            <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-center">📊 Summary Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">{filteredParticipants.length}</p>
                <p className="text-sm text-[#5A5A5A]">Total Participants</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {filteredParticipants.filter(p => p.gender === 'MALE').length}
                </p>
                <p className="text-sm text-[#5A5A5A]">Male Participants</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {filteredParticipants.filter(p => p.gender === 'FEMALE').length}
                </p>
                <p className="text-sm text-[#5A5A5A]">Female Participants</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-[#D35D38]">
                  {new Set(filteredParticipants.map(p => p.age_category)).size}
                </p>
                <p className="text-sm text-[#5A5A5A]">Age Categories</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Participantslist