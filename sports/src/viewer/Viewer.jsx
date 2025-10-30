import React, { useState, useEffect } from 'react';
import CollapsibleList from '../components/CollapsibleList';
import TempleManagement from '../components/TempleManagement.jsx';
import Schedule from '../components/Schedule.jsx';
import Results from '../components/Results.jsx';
import Champions from '../components/Champions.jsx';
import { authAPI, userAPI, eventAPI, participantAPI, teamAPI, templeAPI, reportAPI, viewerAPI } from '../utils/api.js';
import authManager from '../utils/authManager';
import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaTrophy, FaBuilding, FaBars, FaTimes, FaUser, FaRunning, FaAward, FaMars, FaVenus, FaCheckCircle, FaFileAlt } from 'react-icons/fa';

const Viewer = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [dashboardStats, setDashboardStats] = useState({
    totalEvents: 0,
    totalUsers: 0,
    totalTemples: 0,
    activeRegistrations: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyAccessAndLoadData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        // Verify viewer access with backend
        const verifyData = await authAPI.verifyViewerAccess();
        setUser(verifyData.user);

        // Fetch dashboard statistics
        const statsData = await authAPI.getViewerDashboardStats();
        setDashboardStats(statsData);

        setIsLoading(false);
      } catch (error) {
        console.error('Error verifying access or loading data:', error);
        window.location.href = '/login';
      }
    };

    verifyAccessAndLoadData();

    // Listen for global logout events
    const handleAuthLogout = () => {
      console.log('Viewer: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);

  const handleLogout = () => {
    console.log('Viewer: Handling logout');
    authManager.logout(true); // Redirect to login for viewer panel
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaTachometerAlt, color: 'text-blue-600' },
    { id: 'events', label: 'Events', icon: FaCalendarAlt, color: 'text-green-600' },
    { id: 'participants', label: 'Participants', icon: FaUser, color: 'text-indigo-600' },
    { id: 'teams', label: 'Teams', icon: FaRunning, color: 'text-teal-600' },
    { id: 'temples', label: 'Temples ', icon: FaBuilding, color: 'text-orange-600' },
    { id: 'results', label: 'Results', icon: FaTrophy, color: 'text-yellow-600' },
    { id: 'champions', label: 'Champions', icon: FaAward, color: 'text-pink-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={dashboardStats} isLoading={isLoading} />;
      case 'events':
        return <Schedule apiSource="viewer" />;
      case 'participants':
        return <ParticipantsManagement />;
      case 'teams':
        return <TeamsManagement />;
      case 'temples':
        return <TempleManagement apiSource="viewer" />;
      case 'results':
        return <Results apiSource="viewer" />;
      case 'champions':
        return <Champions apiSource="viewer" />;
      case 'reports':
        return <ReportsManagement />;
      // case 'settings':
      //   return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38] mx-auto mb-4"></div>
          <p className="text-[#5A5A5A]">Loading viewer panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#D35D38] rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#2A2A2A]">Viewer Panel</h1>
                <p className="text-xs text-[#5A5A5A]">Sports Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* User Info */}
          {/* <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#D35D38] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'V'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2A2A2A] truncate">
                  {user?.name || 'Viewer User'}
                </p>
                <p className="text-xs text-[#5A5A5A] truncate">
                  Viewer
                </p>
              </div>
            </div>
          </div> */}

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    activeTab === item.id
                      ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                      : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                  }`}
                >
                  <IconComponent className={`text-xl ${activeTab === item.id ? item.color : ''}`} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          {/* <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <FaBars className="text-xl" />
              </button>
              <h2 className="text-xl font-semibold text-[#2A2A2A]">
                {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-[#5A5A5A]">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

// Dashboard Component
const Dashboard = ({ stats, isLoading }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Total Events</p>
            <p className="text-2xl font-bold text-[#2A2A2A]">
              {isLoading ? '...' : stats.totalEvents}
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <FaCalendarAlt className="text-blue-600 text-xl" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Total Users</p>
            <p className="text-2xl font-bold text-[#2A2A2A]">
              {isLoading ? '...' : stats.totalUsers}
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <FaUsers className="text-green-600 text-xl" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Total Temples</p>
            <p className="text-2xl font-bold text-[#2A2A2A]">
              {isLoading ? '...' : stats.totalTemples}
            </p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <FaBuilding className="text-orange-600 text-xl" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#5A5A5A]">Active Registrations</p>
            <p className="text-2xl font-bold text-[#2A2A2A]">
              {isLoading ? '...' : stats.activeRegistrations}
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <FaTrophy className="text-purple-600 text-xl" />
          </div>
        </div>
      </div>
    </div>
    
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4">Recent Activity</h3>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <p className="text-sm text-[#5A5A5A]">New event "100m Sprint" created</p>
          <span className="text-xs text-gray-400 ml-auto">2 hours ago</span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <p className="text-sm text-[#5A5A5A]">5 new user registrations</p>
          <span className="text-xs text-gray-400 ml-auto">4 hours ago</span>
        </div>
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          <p className="text-sm text-[#5A5A5A]">Results updated for "Long Jump"</p>
          <span className="text-xs text-gray-400 ml-auto">6 hours ago</span>
        </div>
      </div>
    </div>
  </div>
);



// Event Management - now using reusable Schedule component

// Participants Management Component
const ParticipantsManagement = () => {
  const [selectedAge, setSelectedAge] = useState('0-5');
  const [selectedGender, setSelectedGender] = useState('MALE');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedTemple, setSelectedTemple] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ageGroups, setAgeGroups] = useState([]);
  const [genders, setGenders] = useState([]);
  const [temples, setTemples] = useState([]);
  const [events, setEvents] = useState([]);
  const [allParticipants, setAllParticipants] = useState([]);

  // Fetch all data when filters change
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch participant data
        const data = await eventAPI.getParticipantData({
          ageCategory: selectedAge,
          gender: selectedGender
        });
        
        // Filter out the 'All' option from age groups
        const filteredAgeGroups = data.ageCategories.filter(group => group.name !== 'All');
        setAgeGroups(filteredAgeGroups);
        setGenders(data.genderOptions);
        setEvents(data.events);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedAge, selectedGender]);

  // Fetch temples for filter
  useEffect(() => {
    const fetchTemples = async () => {
      try {
        console.log('Fetching temples...');
        const data = await viewerAPI.getTemples();
        console.log('Temple data received:', data); // Debug log
        setTemples(data || []);
      } catch (error) {
        console.error('Error fetching temples:', error);
        console.error('Error details:', error.response?.data);
        setTemples([]);
      }
    };

    fetchTemples();
  }, []);

  // Group events by age category and gender
  const groupedEvents = events.reduce((acc, event) => {
    const key = `${event.age_category}::${event.gender}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {});

  // Get all event IDs from the current view
  const getAllEventIds = () => {
    return Object.values(groupedEvents).flat().map(event => event.id);
  };

  // Fetch participants for all events in the current view
  const fetchParticipants = async () => {
    try {
      const eventIds = getAllEventIds();
      
      if (eventIds.length === 0) return;

      const data = await viewerAPI.getParticipants({
        event_ids: eventIds.join(','),
        ...(selectedTemple !== 'ALL' && { temple_id: selectedTemple })
      });
      setAllParticipants(data);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [events, selectedTemple]);

  // Get participants for a specific event
  const getParticipantsForEvent = (eventId) => {
    return allParticipants.filter(p => p.event_id === eventId);
  };

  // Handle participant updates (read-only for viewer)
  const handleParticipantsUpdate = () => {
    fetchParticipants();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        
        <div className="text-sm text-[#5A5A5A]">
          Total Participants: {allParticipants.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Age Category Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Age Category</label>
            <select 
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
              value={selectedAge}
              onChange={(e) => setSelectedAge(e.target.value)}
            >
              {ageGroups && ageGroups.length > 0 ? (
                ageGroups.map((group) => (
                  <option key={group.id} value={group.value}>
                    {group.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading age groups...</option>
              )}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Gender</label>
            <select 
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
            >
              {genders && genders.length > 0 ? (
                genders.map((gender) => (
                  <option key={gender.id} value={gender.value}>
                    {gender.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading genders...</option>
              )}
            </select>
          </div>

          {/* Status Filter */}
          {/* <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Status</label>
            <select 
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
            </select>
          </div> */}

          {/* Temple Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Temple</label>
            <select 
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
              value={selectedTemple}
              onChange={(e) => setSelectedTemple(e.target.value)}
            >
              <option value="ALL">All Temples</option>
              {console.log('Temples array in render:', temples)}
              {temples && temples.length > 0 ? (
                temples.map((temple) => (
                  <option key={temple.id} value={temple.id}>
                    {temple.name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading temples...</option>
              )}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={fetchParticipants}
              className="w-full bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

      {/* Events List */}
      <div className="space-y-6 sm:space-y-8">
        {Object.entries(groupedEvents).length > 0 ? (
          Object.entries(groupedEvents).map(([key, groupEvents]) => {
            const [ageCategory, gender] = key.split('::');
            return (
              <div key={key} className="space-y-4">
                <h3 className="text-xl font-semibold text-[#D35D38] border-b-2 border-[#D35D38] pb-2">
                  {ageCategory} - {gender}
                </h3>
                <div className="space-y-4 sm:pl-4">
                  {groupEvents.map((event) => (
                    <CollapsibleList 
                      key={event.id} 
                      title={event.name}
                      eventId={event.id}
                      participants={getParticipantsForEvent(event.id)}
                      onParticipantsUpdate={handleParticipantsUpdate}
                      isAdmin={false}
                      isViewer={true}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          selectedAge && !loading && (
            <p className="text-[#5A5A5A] text-center py-4">No events found for this age category</p>
          )
        )}
      </div>
    </div>
  );
};

// Teams Management Component
const TeamsManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  // Fetch user details for team members
  const fetchUserDetails = async (userIds) => {
    try {
      // First try to fetch as user IDs
      let data = await viewerAPI.getUserDetails(userIds.join(','));
      if (data.users && data.users.length > 0) {
        return data.users;
      }

      // If no users found, try as profile IDs
      data = await viewerAPI.getProfileDetails(userIds.join(','));
      if (data.profiles && data.profiles.length > 0) {
        // Convert profiles to user-like format for consistency
        return data.profiles.map(profile => ({
          id: profile.id,
          profile: {
            first_name: profile.first_name,
            last_name: profile.last_name,
            aadhar_number: profile.aadhar_number,
            gender: profile.gender,
            temple: profile.temple,
            role: profile.role
          }
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching user details:', error);
      return [];
    }
  };

  // Get user details for a team
  const getTeamMemberDetails = async (team) => {
    if (userDetails[team.id]) {
      return userDetails[team.id];
    }

    const memberIds = team.member_user_ids ? team.member_user_ids.split(',').map(id => parseInt(id)) : [];
    if (memberIds.length === 0) return [];

    const users = await fetchUserDetails(memberIds);
    setUserDetails(prev => ({ ...prev, [team.id]: users }));
    return users;
  };

  const fetchTeamsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await viewerAPI.getTeams();
      if (!data.teams) {
        throw new Error('Invalid response format: teams data not found');
      }
      
      setTeams(data.teams);
    } catch (err) {
      console.error('Error fetching teams data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Group teams by event
  const groupTeamsByEvent = () => {
    const grouped = {};
    teams.forEach(team => {
      // Create a unique key that includes gender to separate male/female events
      const eventKey = `${team.event?.event_type?.name || 'Unknown Event'}_${team.event?.gender || 'UNKNOWN'}_${team.event?.age_category?.id || 'unknown'}`;
      if (!grouped[eventKey]) {
        grouped[eventKey] = {
          eventName: team.event?.event_type?.name || 'Unknown Event',
          eventType: team.event?.event_type,
          ageCategory: team.event?.age_category,
          gender: team.event?.gender,
          temples: []
        };
      }
      
      // Check if temple already exists in this event
      const existingTemple = grouped[eventKey].temples.find(t => t.temple_id === team.temple_id);
      if (existingTemple) {
        existingTemple.teams.push(team);
        existingTemple.totalMembers += team.member_count || 0;
        existingTemple.totalPoints += team.event_result?.points || 0;
      } else {
        grouped[eventKey].temples.push({
          temple_id: team.temple_id,
          temple_name: team.temple?.name || 'Unknown Temple',
          temple_code: team.temple?.code || '',
          teams: [team],
          totalMembers: team.member_count || 0,
          totalPoints: team.event_result?.points || 0,
          acceptedTeams: team.status === 'ACCEPTED' ? 1 : 0,
          pendingTeams: team.status === 'PENDING' ? 1 : 0,
          declinedTeams: team.status === 'DECLINED' ? 1 : 0
        });
      }
    });
    
    // Update counts for temples with multiple teams
    Object.values(grouped).forEach(event => {
      event.temples.forEach(temple => {
        temple.acceptedTeams = temple.teams.filter(t => t.status === 'ACCEPTED').length;
        temple.pendingTeams = temple.teams.filter(t => t.status === 'PENDING').length;
        temple.declinedTeams = temple.teams.filter(t => t.status === 'DECLINED').length;
      });
    });
    
    // Sort events by gender order: MALE first, then FEMALE, then MIXED
    const sortedEvents = Object.values(grouped).sort((a, b) => {
      const genderOrder = { 'MALE': 1, 'FEMALE': 2, 'MIXED': 3 };
      const aOrder = genderOrder[a.gender] || 4;
      const bOrder = genderOrder[b.gender] || 4;
      
      if (aOrder !== bOrder) {
        return aOrder - bOrder;
      }
      
      // If same gender, sort by age category (younger first)
      const aAge = a.ageCategory?.from_age || 0;
      const bAge = b.ageCategory?.from_age || 0;
      if (aAge !== bAge) {
        return aAge - bAge;
      }
      
      // If same age, sort alphabetically by event name
      return a.eventName.localeCompare(b.eventName);
    });
    
    return sortedEvents;
  };

  const groupedEvents = groupTeamsByEvent();

  // Handle View Teams modal
  const handleViewTeams = async (temple) => {
    setSelectedTemple(temple);
    setShowTeamModal(true);
    
    // Fetch team member details for all teams in this temple
    const allTeamMembers = [];
    for (const team of temple.teams) {
      const members = await getTeamMemberDetails(team);
      allTeamMembers.push(...members.map(member => ({
        ...member,
        team_id: team.id,
        team_status: team.status,
        team_points: team.event_result?.points || 0
      })));
    }
    setTeamMembers(allTeamMembers);
  };

  const handleCloseTeamModal = () => {
    setShowTeamModal(false);
    setSelectedTemple(null);
    setTeamMembers([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#2A2A2A]">Teams Management</h3>
          <p className="text-[#5A5A5A]">View team registrations grouped by events and temples</p>
        </div>
        <button
          onClick={fetchTeamsData}
          className="bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
          <span className="ml-3 text-[#2A2A2A]">Loading teams data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={fetchTeamsData}
            className="mt-2 bg-[#D35D38] text-white px-3 py-1 rounded text-sm hover:bg-[#B84A2E]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Events and Temple Registrations */}
      {!loading && !error && (
        <div className="space-y-8">
          {groupedEvents.length > 0 ? (
            (() => {
              // Group events by gender category
              const maleEvents = groupedEvents.filter(event => event.gender === 'MALE');
              const femaleEvents = groupedEvents.filter(event => event.gender === 'FEMALE');
              const mixedEvents = groupedEvents.filter(event => event.gender === 'MIXED');
              
              return (
                <>
                  {/* Male Events */}
                  {maleEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-[#e0e0e0] px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-black flex items-center">
                          <FaMars className="mr-2" />
                          Male Events ({maleEvents.length})
                        </h3>
                      </div>
                      {maleEvents.map((event, eventIndex) => (
                        <ViewerEventTable key={`male-${eventIndex}`} event={event} onViewTeams={handleViewTeams} />
                      ))}
                    </div>
                  )}

                  {/* Female Events */}
                  {femaleEvents.length > 0 && (
                    <div className="space-y-6">
                      {/* <div className="bg-[#e0e0e0] px-6 py-3 rounded-lg"> */}
                      <div className="bg-gray-600 px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <FaVenus className="mr-2" />
                          Female Events ({femaleEvents.length})
                        </h3>
                      </div>
                      {femaleEvents.map((event, eventIndex) => (
                        <ViewerEventTable key={`female-${eventIndex}`} event={event} gender="female" onViewTeams={handleViewTeams} />
                      ))}
                    </div>
                  )}

                  {/* Mixed Gender Events */}
                  {mixedEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-[#e0e0e0] px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-black flex items-center">
                          <FaUsers className="mr-2" />
                          Mixed Gender Events ({mixedEvents.length})
                        </h3>
                      </div>
                      {mixedEvents.map((event, eventIndex) => (
                        <ViewerEventTableWithMembers key={`all-${eventIndex}`} event={event} getTeamMemberDetails={getTeamMemberDetails} />
                      ))}
                    </div>
                  )}
                </>
              );
            })()
          ) : (
            <div className="text-center py-8 text-gray-500">
              No team events found
            </div>
          )}
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && teams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Events</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{groupedEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaRunning className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Teams</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{teams.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaCheckCircle className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Members</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {teams.reduce((sum, team) => sum + (team.member_count || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaUsers className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Points</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {teams.reduce((sum, team) => sum + (team.event_result?.points || 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FaTrophy className="text-orange-600 text-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Team Members Modal */}
      {showTeamModal && selectedTemple && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-white/10 z-50">
          <div className="bg-white p-6 rounded shadow-lg min-w-[400px] max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-[#2A2A2A]">
                Team Members - {selectedTemple.temple_name}
              </h2>
              <button
                onClick={handleCloseTeamModal}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[#5A5A5A]">Temple Code:</span>
                  <span className="ml-2">{selectedTemple.temple_code}</span>
                </div>
                <div>
                  <span className="font-medium text-[#5A5A5A]">Total Teams:</span>
                  <span className="ml-2">{selectedTemple.teams.length}</span>
                </div>
                <div>
                  <span className="font-medium text-[#5A5A5A]">Total Members:</span>
                  <span className="ml-2">{selectedTemple.totalMembers}</span>
                </div>
                <div>
                  <span className="font-medium text-[#5A5A5A]">Total Points:</span>
                  <span className="ml-2">{selectedTemple.totalPoints}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-[#2A2A2A] mb-3">Team Members ({teamMembers.length})</h3>
              {teamMembers.length > 0 ? (
                <div className="space-y-3">
                  {teamMembers.map((member, index) => (
                    <div key={member.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#D35D38] text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-[#2A2A2A]">
                            {member.profile?.first_name} {member.profile?.last_name}
                          </p>
                          <p className="text-sm text-[#5A5A5A]">
                            Aadhar: {member.profile?.aadhar_number}
                            {member.profile?.phone && ` • Phone: ${member.profile.phone}`}
                            {member.profile?.email && ` • Email: ${member.profile.email}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-[#5A5A5A]">
                          {member.profile?.gender === 'M' ? 'Male' : 
                           member.profile?.gender === 'F' ? 'Female' : 
                           member.profile?.gender}
                        </div>
                        <div className="text-xs text-[#D35D38] font-semibold">
                          Team #{member.team_id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {member.team_status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-[#5A5A5A]">
                  <p>No team members found.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleCloseTeamModal}
                className="bg-[#D35D38] text-white px-6 py-2 rounded hover:bg-[#B84A2E] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Temple Management Component - now using reusable component



// Reports Management Component
const ReportsManagement = () => (
    <div className="space-y-6">
    <h3 className="text-2xl font-bold text-[#2A2A2A]">Reports Management</h3>
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center py-12">
        <FaFileAlt className="text-6xl mb-4 text-gray-400 mx-auto" />
        <h4 className="text-xl font-semibold text-[#2A2A2A] mb-2">Reports Management</h4>
        <p className="text-[#5A5A5A]">Generate and view system reports</p>
        </div>
      </div>
    </div>
  );



// Helper component for Male/Female event tables
const ViewerEventTable = ({ event, gender = "male", onViewTeams }) => {
  const hoverColor = "hover:bg-orange-50";
  const buttonColor = "bg-[#D35D38] hover:bg-[#B84A2E]";

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Event Header */}
      <div className="bg-[#e0e0e0] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xl font-bold text-black">{event.eventName}</h4>
            <div className="flex items-center space-x-4 mt-1 text-[#F8DFBE]">
              <span className="text-sm">
                {event.ageCategory?.name || 'All Ages'} • {gender === "female" ? "Female" : "Male"}
              </span>
              <span className="text-sm">
                {event.temples.length} Temple{event.temples.length !== 1 ? 's' : ''} Registered
              </span>
            </div>
          </div>
          <div className="text-right text-[#F8DFBE]">
            <div className="text-2xl font-bold">{event.temples.length}</div>
            <div className="text-sm">Temples</div>
          </div>
        </div>
      </div>

      {/* Temple Registrations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SL.NO</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temple Name</th>
              {/* <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temple Code</th> */}
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Teams</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Members</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status Breakdown</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Points</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {event.temples.map((temple, templeIndex) => (
              <tr key={temple.temple_id} className={`${hoverColor} transition`}>
                <td className="px-6 py-4 font-semibold text-[#D35D38]">{templeIndex + 1}</td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-[#2A2A2A]">{temple.temple_name}</div>
                </td>
                {/* <td className="px-6 py-4 text-gray-600">{temple.temple_code}</td> */}
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-lg text-[#2A2A2A]">{temple.teams.length}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="font-bold text-lg text-[#2A2A2A]">{temple.totalMembers}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {temple.acceptedTeams > 0 && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {temple.acceptedTeams} Accepted
                      </span>
                    )}
                    {temple.pendingTeams > 0 && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {temple.pendingTeams} Pending
                      </span>
                    )}
                    {temple.declinedTeams > 0 && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        {temple.declinedTeams} Declined
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-[#D35D38] font-bold text-lg">
                  {temple.totalPoints}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => onViewTeams(temple)}
                      className="inline-block px-3 py-1 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-xs"
                    >
                      View Teams
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper component for Mixed/All Gender events with team members
const ViewerEventTableWithMembers = ({ event, getTeamMemberDetails }) => (
  <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
    {/* Event Header */}
    <div className="bg-[#e0e0e0] px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xl font-bold text-black">{event.eventName}</h4>
          <div className="flex items-center space-x-4 mt-1 text-[#2A2A2A]">
            <span className="text-sm">
              {/* {event.ageCategory?.name || 'All Ages'} */}
                Mixed Gender
            </span>
            <span className="text-sm">
              {event.temples.length} Temple{event.temples.length !== 1 ? 's' : ''} Registered
            </span>
          </div>
        </div>
        <div className="text-right text-[#2A2A2A]">
          <div className="text-2xl font-bold">{event.temples.length}</div>
          <div className="text-sm">Temples</div>
        </div>
      </div>
    </div>

    {/* Team Members Table */}
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">SL.NO</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temple</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Team Members</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Aadhar Numbers</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Points</th>
            {/* <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th> */}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {event.temples.flatMap(temple => 
            temple.teams.map((team, teamIndex) => (
              <ViewerTeamMembersRow 
                key={`${temple.temple_id}-${team.id}`}
                team={team}
                temple={temple}
                index={teamIndex}
                getTeamMemberDetails={getTeamMemberDetails}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

// Helper component for team member rows
const ViewerTeamMembersRow = ({ team, temple, index, getTeamMemberDetails }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, [team.id]);

  const loadTeamMembers = async () => {
    setLoading(true);
    try {
      const memberDetails = await getTeamMemberDetails(team);
      setMembers(memberDetails);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <tr className="hover:bg-orange-50 transition">
      <td className="px-6 py-4 font-semibold text-[#D35D38]">{index + 1}</td>
      <td className="px-6 py-4">
        <div className="font-semibold text-[#2A2A2A]">{temple.temple_name}</div>
        {/* <div className="text-sm text-gray-600">{temple.temple_code}</div> */}
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : members.length > 0 ? (
          <div className="space-y-1">
            {members.map((member, idx) => (
              <div key={member.id} className="text-sm">
                <span className="font-medium text-[#2A2A2A]">
                  {member.profile?.first_name} {member.profile?.last_name}
                </span>
                <span className="text-gray-500 ml-2">({member.profile?.gender || 'N/A'})</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            <div>No member details found</div>
            <div className="text-xs text-gray-400">
              IDs: {team.member_user_ids || 'None'}
            </div>
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : members.length > 0 ? (
          <div className="space-y-1">
            {members.map((member, idx) => (
              <div key={member.id} className="text-xs text-gray-600">
                {member.profile?.aadhar_number || 'N/A'}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-500">N/A</div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          team.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
          team.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {team.status}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <div className="font-bold text-[#D35D38]">
          {team.event_result?.points || 0}
        </div>
      </td>
      {/* <td className="px-6 py-4">
        <button
          onClick={() => {
            // TODO: Implement view team details functionality
          }}
          className="px-3 py-1 bg-[#D35D38] text-white rounded-lg text-xs hover:bg-[#B84A2E]"
        >
          View Details
        </button>
      </td> */}
    </tr>
  );
};

export default Viewer; 