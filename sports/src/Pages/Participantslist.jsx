import React, { useState, useEffect } from 'react'
import { getCurrentUserTemple } from '../utils/templeUtils'
import { userAPI, eventAPI } from '../utils/api'
import authManager from '../utils/authManager'

const Participantslist = () => {
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [templeName, setTempleName] = useState('');
  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [ageCategories, setAgeCategories] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Function to format date from YYYY-MM-DD to DD/MM/YYYY
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = String(date.getFullYear());
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString; // Return original string if formatting fails
    }
  };

  useEffect(() => {
    // Get temple_id from URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const templeIdParam = urlParams.get('temple_id');
    const templeId = templeIdParam ? parseInt(templeIdParam) : null;

    const fetchTempleName = async () => {
      try {
        if (templeId) {
          // Fetch temple by ID if temple_id is provided in URL
          const templeInfo = await userAPI.getTempleById(templeId);
          setTempleName(templeInfo.name || 'Temple Name Unavailable');
        } else {
          // Otherwise, use current user's temple
          const templeInfo = await getCurrentUserTemple();
          setTempleName(templeInfo.name);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching temple name:', error);
        setTempleName('Temple Name Unavailable');
        setLoading(false);
      }
    };

    const fetchParticipants = async () => {
      try {
        // Pass temple_id to getTempleUsers if provided
        const data = await userAPI.getTempleUsers(templeId);
        setParticipants(data);
        setParticipantsLoading(false);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setParticipantsLoading(false);
      }
    };

    const fetchFilterOptions = async () => {
      try {
        const data = await eventAPI.getParticipantData({});
        // Format age categories to match the format used in participants (from_age-to_age)
        // Filter out 'ALL' option from backend
        const formattedAgeCategories = data.ageCategories
          .filter(cat => !cat.name.toUpperCase().includes('ALL'))
          .map(cat => ({
            id: cat.id,
            name: cat.name,
            value: `${cat.from_age}-${cat.to_age}`,
            from_age: cat.from_age,
            to_age: cat.to_age
          }));
        setAgeCategories(formattedAgeCategories);
        // Filter out 'ALL' option from gender options for the filter dropdown
        const filteredGenders = data.genderOptions.filter(g => g.value !== 'ALL');
        setGenderOptions(filteredGenders);
        setFiltersLoading(false);
      } catch (error) {
        console.error('Error fetching filter options:', error);
        setFiltersLoading(false);
      }
    };

    // Set viewport meta tag to prevent zoom
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }

    fetchTempleName();
    fetchParticipants();
    fetchFilterOptions();

    // Listen for global logout events
    const handleAuthLogout = () => {
      console.log('Participantslist: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    
    return () => {
      window.removeEventListener('authLogout', handleAuthLogout);
      // Reset viewport meta tag on cleanup
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []); // Empty dependency array is fine - we read from URL on mount

  const filteredParticipants = participants.filter(participant => {
    return (selectedAgeCategory === '' || participant.age_category === selectedAgeCategory) &&
           (selectedGender === '' || participant.gender === selectedGender);
  });

  return (
    <div className="flex justify-center items-center bg-[#F0F0F0]">
      <div className="min-h-screen bg-[#F0F0F0] md:py-8 md:px-4" style={{ width: '80%', maxWidth: '100vw', overflowX: 'hidden', position: 'relative', transform: 'translateZ(0)', margin: '0 auto' }}>
      <div className="max-w-7xl mx-auto w-full" style={{ width: '100%', maxWidth: '100%' }}>
        {/* Header Section */}
        <div className="hidden md:block text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2A2A2A] mb-4">
            33ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2025
          </h1>
            {loading ? (
            <div className="flex justify-center items-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
              </div>
            ) : (
            <p className="text-xl text-[#5A5A5A] font-semibold">{templeName}</p>
            )}
        </div>

        {/* Summary Stats */}
        {!participantsLoading && filteredParticipants.length > 0 && (
          <div className="hidden md:block bg-white rounded-2xl shadow-xl p-6 mb-8">
            <h3 className="text-xl font-bold text-[#2A2A2A] mb-4 text-center">📊 Summary Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
            
        {/* Filters Section */}
        <div className=" md:bg-white p-4 mb-8 rounded-lg shadow-sm">
        <h2 className="hidden md:block text-2xl font-bold text-[#2A2A2A] mb-4">Filter Participants</h2>
          <div className="flex gap-4 w-full">
            <div className="flex-1">
             <label htmlFor="ageCategory" className="hidden md:block block text-sm font-semibold text-[#2A2A2A] mb-2">
                Age Category
              </label>
              <select
                id="ageCategory"
                value={selectedAgeCategory}
                onChange={(e) => setSelectedAgeCategory(e.target.value)}
                disabled={filtersLoading}
                className="w-full px-4 py-2 md:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Ages</option>
                {ageCategories.map((category) => (
                  <option key={category.id} value={category.value}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
            <label htmlFor="gender" className="hidden md:block block text-sm font-semibold text-[#2A2A2A] mb-2">
                Gender
              </label>
              <select
                id="gender"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
                disabled={filtersLoading}
                className="w-full px-4 py-2 md:py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Genders</option>
                {genderOptions.map((gender) => (
                  <option key={gender.id} value={gender.value}>
                    {gender.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      

        {/* Participants List */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden" style={{ width: '100%', maxWidth: '100%' }}>
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="font-bold text-black">Participants List</h2>
            <p className="text-black/80 text-sm mt-1">
              {filteredParticipants.length} participant{filteredParticipants.length !== 1 ? 's' : ''} 
            </p>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto" style={{ maxWidth: '100%', overflowX: 'auto', width: '100%', position: 'relative', transform: 'translateZ(0)' }}>
            <table className="w-full divide-y divide-gray-200" style={{ minWidth: '800px', width: '100%', tableLayout: 'fixed', transform: 'translateZ(0)' }}>
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '80px' }}>
                    SL.NO
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '200px' }}>
                    Name
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '100px' }}>
                    Category
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '150px' }}>
                    Aadhar No
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '120px' }}>
                    Date of Birth
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '100px' }}>
                    Gender
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-[#2A2A2A] uppercase tracking-wider" style={{ width: '120px' }}>
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
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '80px' }}>
                        <span className="inline-flex items-center justify-center w-8 h-8  text-black text-sm font-bold rounded-full">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '200px' }}>
                        <div className="text-sm font-semibold text-[#2A2A2A] truncate" title={participant.name}>{participant.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '100px' }}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {participant.age_category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '150px' }}>
                        <div className="text-sm text-[#5A5A5A] font-mono truncate" title={participant.aadhar_number}>{participant.aadhar_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '120px' }}>
                        <div className="text-sm text-[#5A5A5A]">{formatDate(participant.date_of_birth)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '100px' }}>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          participant.gender === 'MALE' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {participant.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ width: '120px' }}>
                        <div className="text-sm text-[#5A5A5A]">{participant.phone_number}</div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden p-4 space-y-2">
            {participantsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
                <span className="ml-3 text-[#5A5A5A]">Loading participants...</span>
              </div>
            ) : filteredParticipants.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#5A5A5A] text-lg">No participants found</p>
                <p className="text-[#5A5A5A] text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredParticipants.map((participant, idx) => (
                <div key={participant.id} className="bg-gray-50 rounded-lg p-2 border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  {/* 1st line - Name, age category, gender */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start justify-between mb-2 sm:mb-0">
                      
                      <h3 className="font-medium text-[#2A2A2A] " title={participant.name}>
                        {participant.name}
                      </h3>
                      <span className={`inline-flex items-start px-2.5 py-0.5 rounded-full whitespace-nowrap text-xs font-medium ${
                        participant.gender === 'MALE' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {participant.gender} &nbsp;| &nbsp;
                        <span>
                       {participant.age_category}
                      
                        </span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {participant.age_category}
                      </span> */}
                      {/* <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        participant.gender === 'MALE' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-pink-100 text-pink-800'
                      }`}>
                        {participant.gender}
                      </span> */}
                    </div>
                  </div>

                  {/* 2nd line - Aadhar number */}
                  <div className="mb-1 flex justify-between">
                    {/* <div className="text-sm text-[#5A5A5A] flex items-center">
                      <span className="text-lg font-bold mr-2 text-[#5A5A5A]">#</span>
                      <span className="ml-1 font-mono">{participant.aadhar_number}</span>
                    </div> */}
                    
                  </div>

                  {/* 3rd line - Date of birth and mobile number */}
                  <div className="flex justify-between items-center gap-2">
                  <div className="text-sm text-[#5A5A5A] flex items-center">
                      <span className="text-lg font-bold mr-2 text-[#5A5A5A]">#</span>
                      <span className="ml-1 font-mono">{participant.aadhar_number}</span>
                    </div>
                    <div className="text-sm text-[#5A5A5A] flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[#5A5A5A]" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      <span className="ml-1">{participant.phone_number}</span>
                    </div>
                    {/* <div className="text-sm text-[#5A5A5A] flex items-center">
                      <svg className="w-4 h-4 mr-2 text-[#5A5A5A]" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1">{formatDate(participant.date_of_birth)}</span>
                    </div> */}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    
  )
}

export default Participantslist