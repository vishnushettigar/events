import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCurrentUserTemple } from '../utils/templeUtils'
import { userAPI, eventAPI } from '../utils/api'

const Participantslist = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [temples, setTemples] = useState([]);
  const [selectedTemple, setSelectedTemple] = useState('');
  const [templeName, setTempleName] = useState('');
  const [selectedAgeCategory, setSelectedAgeCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [loading, setLoading] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [ageCategories, setAgeCategories] = useState([]);
  const [genderOptions, setGenderOptions] = useState([]);
  const [filtersLoading, setFiltersLoading] = useState(true);

  // Format date from YYYY-MM-DD to DD/MM/YYYY
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
      return dateString;
    }
  };

  // Helper for age category display
  const displayAgeCategory = (cat) => {
    if (!cat) return '';
    if (cat === '61-90' || cat === '61-99' || cat === '61 and above') return '61+';
    return cat;
  };

  const isMatchAgeCategory = (participantCategory, selectedCategory) => {
    if (!selectedCategory) return true;
    if (participantCategory === selectedCategory) return true;

    // Check for 61+ variants (61+, 61-90, 61-99, 61 and above)
    const is61Plus = (cat) =>
      cat === '61+' ||
      cat === '61-90' ||
      cat === '61-99' ||
      cat === '61 and above' ||
      (typeof cat === 'string' && cat.trim().startsWith('61'));

    if (is61Plus(selectedCategory) && is61Plus(participantCategory)) {
      return true;
    }

    return false;
  };

  // Initial load: fetch all temples, user's default temple, filter options
  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        setLoading(true);

        // Fetch temples and filter options in parallel
        const [allTemplesData, filterOptionsData] = await Promise.all([
          userAPI.getAllTemples().catch(err => {
            console.error('Error fetching temples:', err);
            return [];
          }),
          eventAPI.getParticipantData({}).catch(err => {
            console.error('Error fetching filter options:', err);
            return { ageCategories: [], genderOptions: [] };
          })
        ]);

        if (!isMounted) return;

        const templesList = Array.isArray(allTemplesData) ? allTemplesData : [];
        setTemples(templesList);

        // Process age categories
        const formattedAgeCategories = (filterOptionsData.ageCategories || [])
          .filter(cat => !cat.name.toUpperCase().includes('ALL'))
          .map(cat => {
            const is61 = cat.name.includes('61') || cat.from_age === 61;
            return {
              id: cat.id,
              name: is61 ? '61+' : cat.name,
              value: is61 ? '61+' : (cat.name || `${cat.from_age}-${cat.to_age}`),
              from_age: cat.from_age,
              to_age: cat.to_age
            };
          });
        setAgeCategories(formattedAgeCategories);

        const filteredGenders = (filterOptionsData.genderOptions || []).filter(g => g.value !== 'ALL');
        setGenderOptions(filteredGenders);
        setFiltersLoading(false);

        // Determine initial temple
        const templeIdParam = searchParams.get('temple_id');
        let initialTempleId = '';

        if (templeIdParam) {
          initialTempleId = templeIdParam;
        } else {
          // If no param, try current user's temple
          try {
            const userTemple = await getCurrentUserTemple();
            if (userTemple?.id) {
              initialTempleId = String(userTemple.id);
            } else {
              initialTempleId = 'ALL';
            }
          } catch {
            initialTempleId = 'ALL';
          }
        }

        setSelectedTemple(initialTempleId);
      } catch (err) {
        console.error('Error initializing participants page:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initData();

    // Listen for global logout events
    const handleAuthLogout = () => {
      console.log('Participantslist: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => {
      isMounted = false;
      window.removeEventListener('authLogout', handleAuthLogout);
    };
  }, []);

  // Fetch participants whenever selectedTemple changes
  useEffect(() => {
    if (!selectedTemple) return;

    const fetchTempleUsers = async () => {
      try {
        setParticipantsLoading(true);

        // Set temple name for header
        if (selectedTemple === 'ALL') {
          setTempleName('All Temples / ಎಲ್ಲಾ ದೇವಸ್ಥಾನಗಳು');
        } else {
          const found = temples.find(t => String(t.id) === String(selectedTemple));
          if (found) {
            setTempleName(found.name);
          } else {
            try {
              const templeInfo = await userAPI.getTempleById(selectedTemple);
              setTempleName(templeInfo.name || 'Temple');
            } catch {
              setTempleName('Temple');
            }
          }
        }

        const data = await userAPI.getTempleUsers(selectedTemple);
        setParticipants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error fetching participants:', error);
        setParticipants([]);
      } finally {
        setParticipantsLoading(false);
      }
    };

    fetchTempleUsers();
  }, [selectedTemple, temples]);

  // Handle temple selection change
  const handleTempleChange = (newTempleId) => {
    setSelectedTemple(newTempleId);
    if (newTempleId) {
      setSearchParams({ temple_id: newTempleId });
    } else {
      setSearchParams({});
    }
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    const excludedRoles = ['ADMIN', 'STAFF', 'VIEWER'];

    return participants.filter(participant => {
      // Exclude administrative/staff/viewer users
      const userRole = (participant.role || '').toUpperCase();
      if (userRole && excludedRoles.includes(userRole)) {
        return false;
      }

      const matchAge = isMatchAgeCategory(participant.age_category, selectedAgeCategory);
      const matchGender = selectedGender === '' || participant.gender === selectedGender;

      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q ||
        (participant.name && participant.name.toLowerCase().includes(q)) ||
        (participant.bib_number && participant.bib_number.toLowerCase().includes(q)) ||
        (participant.phone_number && participant.phone_number.includes(q)) ||
        (participant.aadhar_number && participant.aadhar_number.includes(q));

      return matchAge && matchGender && matchSearch;
    });
  }, [participants, selectedAgeCategory, selectedGender, searchQuery]);

  // Print function
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const displayTemple = selectedTemple === 'ALL'
      ? 'All Temples (ಎಲ್ಲಾ ದೇವಸ್ಥಾನಗಳು)'
      : (templeName || 'Temple Participants');

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Participants List - ${displayTemple}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 10mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #1a1a1a;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            text-align: center;
            margin-bottom: 14px;
            border-bottom: 2px solid #D35D38;
            padding-bottom: 10px;
          }
          .title {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 3px;
            color: #2a2a2a;
          }
          .main-title {
            font-size: 20px;
            font-weight: 800;
            margin-bottom: 4px;
            color: #D35D38;
          }
          .temple-title {
            font-size: 16px;
            font-weight: 800;
            margin-top: 5px;
            color: #111;
          }
          .sub-title {
            font-size: 13px;
            color: #555;
            font-weight: 600;
            margin-top: 2px;
          }
          .meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            font-weight: 600;
            color: #444;
            margin-bottom: 10px;
            padding: 4px 6px;
            background: #fdf5f2;
            border-left: 4px solid #D35D38;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 6px 8px;
            text-align: left;
          }
          th {
            background-color: #D35D38 !important;
            color: white !important;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          tr:nth-child(even) {
            background-color: #fafafa;
          }
          .sl-cell {
            text-align: center;
            width: 45px;
            font-weight: 600;
          }
          .bib-cell {
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
            font-weight: 800;
            color: #92400e !important;
            background-color: #fef3c7 !important;
            text-align: center;
            width: 110px;
            font-size: 12.5px;
            letter-spacing: 0.5px;
          }
          .name-cell {
            font-weight: 700;
            color: #111;
          }
          .center-cell {
            text-align: center;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">ದ. ಕ. ಜಿಲ್ಲಾ ಪದ್ಮಶಾಲಿ ಮಹಾಸಭಾ (ರಿ.), ಮಂಗಳೂರು</div>
          <div class="main-title">34ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2026</div>
          <div class="temple-title">${displayTemple}</div>
          <div class="sub-title">Participants List with BIB Numbers (ಕ್ರೀಡಾಪಟುಗಳ ಪಟ್ಟಿ)</div>
        </div>

        <div class="meta-bar">
          <div>
            ${selectedGender ? `Gender: ${selectedGender} | ` : ''}
            ${selectedAgeCategory ? `Category: ${selectedAgeCategory} | ` : ''}
            Total Participants: <strong>${filteredParticipants.length}</strong>
          </div>
          <div>Printed on: ${new Date().toLocaleDateString('en-GB')}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="sl-cell">SL.No</th>
              <th style="width: 110px; text-align: center;">BIB No</th>
              <th>Participant Name</th>
              ${selectedTemple === 'ALL' ? '<th>Temple</th>' : ''}
              <th style="width: 75px; text-align: center;">Gender</th>
              <th style="width: 85px; text-align: center;">Category</th>
              <th style="width: 105px;">Phone</th>
            </tr>
          </thead>
          <tbody>
            ${filteredParticipants.length > 0 ? filteredParticipants.map((p, idx) => `
              <tr>
                <td class="sl-cell">${idx + 1}</td>
                <td class="bib-cell">${p.bib_number || '-'}</td>
                <td class="name-cell">${p.name}</td>
                ${selectedTemple === 'ALL' ? `<td>${p.temple_name || '-'}</td>` : ''}
                <td class="center-cell">${p.gender || '-'}</td>
                <td class="center-cell">${displayAgeCategory(p.age_category) || '-'}</td>
                <td>${p.phone_number || '-'}</td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="${selectedTemple === 'ALL' ? '7' : '6'}" style="text-align: center; padding: 24px; color: #6b7280;">
                  No participants found matching the selected criteria.
                </td>
              </tr>
            `}
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
  };

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
      <div className="flex justify-center items-center bg-[#F8F9FA] min-h-screen py-6 px-3 sm:px-6">
        <div className="w-full max-w-7xl mx-auto space-y-6">

          {/* Top Header Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-orange-100 text-[#D35D38] rounded-full mb-1">
                34ನೇ ಪದ್ಮಶಾಲಿ ಕ್ರೀಡೋತ್ಸವ - 2026
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2A2A2A]">
                Participants & BIB Directory
              </h1>
              <p className="text-sm sm:text-base font-semibold text-[#D35D38] mt-1">
                {templeName || 'Loading temple information...'}
              </p>
            </div>

            {/* Print Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrint}
                disabled={participantsLoading || filteredParticipants.length === 0}
                className="inline-flex items-center gap-2 bg-[#D35D38] hover:bg-[#B84A2E] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-xl shadow-md transition-all duration-200 transform hover:-translate-y-0.5"
                title="Print participants list with BIB numbers"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Print List ({filteredParticipants.length})</span>
              </button>
            </div>
          </div>

          {/* Summary Stats Cards */}
          {!participantsLoading && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-[#D35D38]">{filteredParticipants.length}</p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Total Filtered</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">
                  {filteredParticipants.filter(p => p.gender === 'MALE').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Male Participants</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-pink-600">
                  {filteredParticipants.filter(p => p.gender === 'FEMALE').length}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Female Participants</p>
              </div>
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
                  {new Set(filteredParticipants.map(p => displayAgeCategory(p.age_category))).size}
                </p>
                <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">Age Categories</p>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-[#2A2A2A] flex items-center gap-2">
                <svg className="w-5 h-5 text-[#D35D38]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter Participants by Temple & Details
              </h2>
              {(selectedTemple !== 'ALL' || selectedAgeCategory || selectedGender || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedAgeCategory('');
                    setSelectedGender('');
                    setSearchQuery('');
                  }}
                  className="text-xs text-[#D35D38] hover:text-[#B84A2E] font-semibold underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Temple Filter */}
              <div>
                <label htmlFor="templeFilter" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Temple (ದೇವಸ್ಥಾನ)
                </label>
                <select
                  id="templeFilter"
                  value={selectedTemple}
                  onChange={(e) => handleTempleChange(e.target.value)}
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent font-medium"
                >
                  <option value="ALL">All Temples / ಎಲ್ಲಾ ದೇವಸ್ಥಾನಗಳು</option>
                  {temples.map((temple) => (
                    <option key={temple.id} value={temple.id}>
                      {temple.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Age Category Filter */}
              <div>
                <label htmlFor="ageCategory" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Age Category
                </label>
                <select
                  id="ageCategory"
                  value={selectedAgeCategory}
                  onChange={(e) => setSelectedAgeCategory(e.target.value)}
                  disabled={filtersLoading}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent font-medium"
                >
                  <option value="">All Age Categories</option>
                  {ageCategories.map((category) => (
                    <option key={category.id} value={category.value}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender Filter */}
              <div>
                <label htmlFor="gender" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Gender
                </label>
                <select
                  id="gender"
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  disabled={filtersLoading}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent font-medium"
                >
                  <option value="">All Genders</option>
                  {genderOptions.map((gender) => (
                    <option key={gender.id} value={gender.value}>
                      {gender.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Box */}
              <div>
                <label htmlFor="searchQuery" className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                  Search Name / BIB
                </label>
                <div className="relative">
                  <input
                    id="searchQuery"
                    type="text"
                    placeholder="Search name, BIB, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent font-medium"
                  />
                  <svg className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Participants Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50/80 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-[#2A2A2A] text-base sm:text-lg flex items-center gap-2">
                <span>Participants List</span>
                <span className="text-xs bg-orange-100 text-[#D35D38] font-bold px-2 py-0.5 rounded-full">
                  {filteredParticipants.length} total
                </span>
              </h2>
              <span className="text-xs text-gray-500">
                Sorted by Temple & Name
              </span>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-[#D35D38]">
                  <tr>
                    <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-14">
                      SL.NO
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-28">
                      BIB NO
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                      PARTICIPANT NAME
                    </th>
                    {selectedTemple === 'ALL' && (
                      <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider">
                        TEMPLE
                      </th>
                    )}
                    <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-24">
                      CATEGORY
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wider w-24">
                      GENDER
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-32">
                      PHONE NO
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-left text-xs font-bold text-white uppercase tracking-wider w-28">
                      DOB
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {participantsLoading ? (
                    <tr>
                      <td colSpan={selectedTemple === 'ALL' ? 8 : 7} className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
                          <span className="ml-3 text-gray-600 font-medium">Loading participants...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan={selectedTemple === 'ALL' ? 8 : 7} className="px-6 py-12 text-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <p className="text-gray-700 text-base font-semibold">No participants found</p>
                          <p className="text-gray-400 text-xs mt-1">Try adjusting your temple, age, or gender filters</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((participant, idx) => (
                      <tr key={participant.id} className="hover:bg-orange-50/60 transition-colors duration-150">
                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 font-mono tracking-wider">
                            {participant.bib_number || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900" title={participant.name}>
                            {participant.name}
                          </div>
                          {participant.aadhar_number && (
                            <div className="text-xs text-gray-400 font-mono">
                              Aadhaar: {participant.aadhar_number}
                            </div>
                          )}
                        </td>
                        {selectedTemple === 'ALL' && (
                          <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-700">
                            {participant.temple_name || '-'}
                          </td>
                        )}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {displayAgeCategory(participant.age_category) || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            participant.gender === 'MALE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-pink-100 text-pink-800'
                          }`}>
                            {participant.gender || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                          {participant.phone_number || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                          {formatDate(participant.date_of_birth) || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 divide-y divide-gray-100">
              {participantsLoading ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38]"></div>
                  <span className="ml-3 text-gray-500 font-medium text-sm">Loading participants...</span>
                </div>
              ) : filteredParticipants.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-600 font-semibold text-base">No participants found</p>
                  <p className="text-gray-400 text-xs mt-1">Try adjusting your filters</p>
                </div>
              ) : (
                filteredParticipants.map((participant, idx) => (
                  <div key={participant.id} className="py-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 w-5">#{idx + 1}</span>
                        <h3 className="font-bold text-gray-900 text-sm">
                          {participant.name}
                        </h3>
                      </div>
                      <span className="inline-block px-2 py-0.5 text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 rounded font-mono">
                        {participant.bib_number || '-'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {selectedTemple === 'ALL' && participant.temple_name && (
                        <span className="font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                          {participant.temple_name}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded font-semibold ${
                        participant.gender === 'MALE' ? 'bg-blue-100 text-blue-800' : 'bg-pink-100 text-pink-800'
                      }`}>
                        {participant.gender}
                      </span>
                      <span className="bg-orange-50 text-orange-800 border border-orange-200 px-2 py-0.5 rounded font-semibold">
                        Category: {displayAgeCategory(participant.age_category)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500 pt-1">
                      {participant.phone_number && (
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          <span>{participant.phone_number}</span>
                        </div>
                      )}
                      {participant.date_of_birth && (
                        <span>DOB: {formatDate(participant.date_of_birth)}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default Participantslist;