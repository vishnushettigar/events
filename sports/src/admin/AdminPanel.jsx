import React, { useState, useEffect } from 'react';
import CollapsibleList from '../components/CollapsibleList';
// Icons temporarily disabled due to import issues
// import { FaTachometerAlt, FaUsers, FaCalendarAlt, FaTrophy, FaBuilding, FaCog, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

const AdminPanel = () => {
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
        // Verify admin access with backend
        const verifyResponse = await fetch('http://localhost:4000/api/admin/verify-access', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!verifyResponse.ok) {
          console.error('Access denied: User does not have SUPER_USER role');
          window.location.href = '/login';
          return;
        }

        const verifyData = await verifyResponse.json();
        setUser(verifyData.user);

        // Fetch dashboard statistics
        const statsResponse = await fetch('http://localhost:4000/api/admin/dashboard-stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setDashboardStats(statsData);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error verifying access or loading data:', error);
        window.location.href = '/login';
      }
    };

    verifyAccessAndLoadData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', color: 'text-blue-600' },
    { id: 'events', label: 'Event', icon: '📅', color: 'text-green-600' },
    { id: 'users', label: 'User', icon: '👥', color: 'text-purple-600' },
    { id: 'participants', label: 'Participants', icon: '👤', color: 'text-indigo-600' },
    { id: 'teams', label: 'Teams', icon: '🏃', color: 'text-teal-600' },
    { id: 'temples', label: 'Temples ', icon: '🏛️', color: 'text-orange-600' },
    { id: 'results', label: 'Results', icon: '🏆', color: 'text-yellow-600' },
    { id: 'champions', label: 'Champions', icon: '👑', color: 'text-pink-600' },
    { id: 'settings', label: 'Settings', icon: '⚙️', color: 'text-gray-600' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={dashboardStats} isLoading={isLoading} />;
      case 'events':
        return <EventManagement />;
      case 'users':
        return <UserManagement />;
      case 'participants':
        return <ParticipantsManagement />;
      case 'teams':
        return <TeamsManagement />;
      case 'temples':
        return <TempleManagement />;
      case 'results':
        return <ResultsManagement />;
      case 'champions':
        return <ChampionsManagement />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <Dashboard />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38] mx-auto mb-4"></div>
          <p className="text-[#5A5A5A]">Loading admin panel...</p>
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
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-[#2A2A2A]">Admin Panel</h1>
                <p className="text-xs text-[#5A5A5A]">Sports Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-[#D35D38] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#2A2A2A] truncate">
                  {user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-[#5A5A5A] truncate">
                  {user?.role === 4 ? 'Super User' : 'Admin'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                  activeTab === item.id
                    ? 'bg-[#F8DFBE] text-[#D35D38] border-r-2 border-[#D35D38]'
                    : 'text-[#5A5A5A] hover:bg-gray-100 hover:text-[#2A2A2A]'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <span className="text-xl">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
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
                ☰
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

// Placeholder components for each section
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
            <span className="text-blue-600 text-xl">📅</span>
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
            <span className="text-green-600 text-xl">👥</span>
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
            <span className="text-orange-600 text-xl">🏛️</span>
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
            <span className="text-purple-600 text-xl">🏆</span>
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

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/events', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Separate individual and team events
  const individualEvents = events.filter(event => event.event_type.type === 'INDIVIDUAL');
  const teamEvents = events.filter(event => event.event_type.type === 'TEAM');

  // Group individual events by age category and gender
  const groupedIndividualEvents = individualEvents.reduce((acc, event) => {
    const ageKey = `${event.age_category.name} (${event.age_category.from_age}-${event.age_category.to_age} years)`;
    const genderKey = event.gender;
    
    if (!acc[ageKey]) {
      acc[ageKey] = {};
    }
    if (!acc[ageKey][genderKey]) {
      acc[ageKey][genderKey] = [];
    }
    
    acc[ageKey][genderKey].push(event);
    return acc;
  }, {});

  // Group team events by age category and gender
  const groupedTeamEvents = teamEvents.reduce((acc, event) => {
    const ageKey = `${event.age_category.name} (${event.age_category.from_age}-${event.age_category.to_age} years)`;
    const genderKey = event.gender;
    
    if (!acc[ageKey]) {
      acc[ageKey] = {};
    }
    if (!acc[ageKey][genderKey]) {
      acc[ageKey][genderKey] = [];
    }
    
    acc[ageKey][genderKey].push(event);
    return acc;
  }, {});

  const getGenderDisplayName = (gender) => {
    switch (gender) {
      case 'MALE': return 'Male';
      case 'FEMALE': return 'Female';
      case 'ALL': return 'Mixed';
      default: return gender;
    }
  };

  const renderEventSection = (groupedEvents, sectionTitle, sectionColor) => {
    if (Object.keys(groupedEvents).length === 0) return null;

    return (
      <div className="space-y-8">
        <h3 className={`text-2xl font-bold ${sectionColor} border-b-2 ${sectionColor.replace('text-', 'border-')} pb-2`}>
          {sectionTitle}
        </h3>
        
        {Object.entries(groupedEvents).map(([ageCategory, genderGroups]) => (
          <div key={ageCategory} className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="text-xl font-semibold text-[#D35D38] border-b-2 border-[#D35D38] pb-2 mb-6">
              {ageCategory}
            </h4>
            
            <div className="space-y-6">
              {Object.entries(genderGroups).map(([gender, genderEvents]) => (
                <div key={gender} className="space-y-4">
                  <h5 className="text-lg font-medium text-[#2A2A2A] flex items-center">
                    <span className="w-3 h-3 bg-[#D35D38] rounded-full mr-3"></span>
                    {getGenderDisplayName(gender)}
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {genderEvents.map((event) => (
                      <div key={event.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <h6 className="font-semibold text-[#2A2A2A] text-sm">
                            {event.name}
                          </h6>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            event.is_closed 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {event.is_closed ? 'Closed' : 'Open'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs text-[#5A5A5A]">
                          <div className="flex justify-between">
                            <span>Participants:</span>
                            <span className="font-medium">{event.registrations_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Max:</span>
                            <span className="font-medium">{event.event_type.participant_count}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#2A2A2A]">Event Management</h3>
        <button
          onClick={fetchEvents}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
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
          <button
            onClick={fetchEvents}
            className="mt-2 bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Individual Events Section */}
      {renderEventSection(groupedIndividualEvents, 'Individual Events', 'text-blue-600')}

      {/* Team Events Section */}
      {renderEventSection(groupedTeamEvents, 'Team Events', 'text-green-600')}

      {/* No Events Found */}
      {!loading && !error && Object.keys(groupedIndividualEvents).length === 0 && Object.keys(groupedTeamEvents).length === 0 && (
        <div className="text-center py-8">
          <p className="text-[#5A5A5A]">No events found</p>
        </div>
      )}
    </div>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    temple: ''
  });
  const [roles, setRoles] = useState([]);
  const [temples, setTemples] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  useEffect(() => {
    fetchRoles();
    fetchTemples();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, filters]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.temple && { temple: filters.temple })
      });

      const response = await fetch(`http://localhost:4000/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchTemples = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/api/admin/temples', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemples(data);
      }
    } catch (error) {
      console.error('Error fetching temples:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRoleUpdate = async (userId, newRoleId) => {
    setUpdatingRole(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}/update-role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role_id: newRoleId })
      });

      if (!response.ok) {
        throw new Error('Failed to update user role');
      }

      // Refresh users list
      fetchUsers();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setUpdatingRole(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? role.name : 'Unknown';
  };

  const getTempleName = (templeId) => {
    const temple = temples.find(t => t.id === templeId);
    return temple ? temple.name : 'Unknown';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#2A2A2A]">User Management</h3>
        <div className="text-sm text-[#5A5A5A]">
          Total Users: {pagination.total}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, email, or Aadhar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] mb-2">Role</label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#5A5A5A] mb-2">Temple</label>
            <select
              value={filters.temple}
              onChange={(e) => handleFilterChange('temple', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
            >
              <option value="">All Temples</option>
              {temples.map(temple => (
                <option key={temple.id} value={temple.id}>{temple.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchUsers}
              className="w-full bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#D35D38] mx-auto mb-4"></div>
            <p className="text-[#5A5A5A]">Loading users...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={fetchUsers}
              className="mt-2 bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">Temple</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#5A5A5A] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-[#2A2A2A]">
                            {user.profile?.first_name} {user.profile?.last_name}
                          </div>
                          <div className="text-sm text-[#5A5A5A]">{user.username}</div>
                          <div className="text-xs text-gray-400">Aadhar: {user.profile?.aadhar_number}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5A5A5A]">{user.email}</div>
                        <div className="text-sm text-[#5A5A5A]">{user.profile?.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-[#5A5A5A]">
                          {getTempleName(user.profile?.temple_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.profile?.role_id === 4 ? 'bg-purple-100 text-purple-800' :
                          user.profile?.role_id === 3 ? 'bg-blue-100 text-blue-800' :
                          user.profile?.role_id === 2 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getRoleName(user.profile?.role_id)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#5A5A5A]">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowRoleModal(true);
                          }}
                          className="text-[#D35D38] hover:text-[#B84A2E] transition-colors"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#5A5A5A]">
                      Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-[#D35D38] border-[#D35D38] text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Role Update Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[#2A2A2A] mb-4">Update User Role</h3>
            <p className="text-[#5A5A5A] mb-4">
              Update role for <strong>{selectedUser.profile?.first_name} {selectedUser.profile?.last_name}</strong>
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-[#5A5A5A] mb-2">New Role</label>
              <select
                id="newRole"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
              >
                {roles.map(role => (
                  <option key={role.id} value={role.id} selected={role.id === selectedUser.profile?.role_id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRoleModal(false);
                  setSelectedUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const newRoleId = parseInt(document.getElementById('newRole').value);
                  if (newRoleId !== selectedUser.profile?.role_id) {
                    handleRoleUpdate(selectedUser.id, newRoleId);
                  } else {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }
                }}
                disabled={updatingRole}
                className="px-4 py-2 text-sm font-medium text-white bg-[#D35D38] rounded-md hover:bg-[#B84A2E] transition-colors disabled:opacity-50"
              >
                {updatingRole ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



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
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        console.log('Fetching participant data with filters:', { selectedAge, selectedGender });

        // Fetch participant data
        const response = await fetch(
          `http://localhost:4000/api/events/participant-data?ageCategory=${selectedAge}&gender=${selectedGender}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        console.log('Participant data received:', data);
        
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
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:4000/api/admin/temples', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTemples(data);
        }
      } catch (error) {
        console.error('Error fetching temples:', error);
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const eventIds = getAllEventIds();
      console.log('Event IDs for participants fetch:', eventIds);
      
      if (eventIds.length === 0) return;

      // Build query parameters
      const params = new URLSearchParams();
      params.append('event_ids', eventIds.join(','));
      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus);
      }
      if (selectedTemple !== 'ALL') {
        params.append('temple_id', selectedTemple);
      }

      console.log('Fetching participants with params:', params.toString());

      const response = await fetch(
        `http://localhost:4000/api/admin/participants?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }

      const data = await response.json();
      console.log('Participants data received:', data);
      setAllParticipants(data);
    } catch (err) {
      console.error('Error fetching participants:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchParticipants();
  }, [events, selectedStatus, selectedTemple]);

  // Get participants for a specific event
  const getParticipantsForEvent = (eventId) => {
    return allParticipants.filter(p => p.event_id === eventId);
  };

  // Handle participant updates
  const handleParticipantsUpdate = () => {
    fetchParticipants();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#2A2A2A]">Participants Management</h3>
        <div className="text-sm text-[#5A5A5A]">
          Total Participants: {allParticipants.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <div className="flex flex-col">
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
          </div>

          {/* Temple Filter */}
          <div className="flex flex-col">
            <label className="mb-2 text-[#2A2A2A] font-medium">Temple</label>
            <select 
              className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent bg-white"
              value={selectedTemple}
              onChange={(e) => setSelectedTemple(e.target.value)}
            >
              <option value="ALL">All Temples</option>
              {temples.map((temple) => (
                <option key={temple.id} value={temple.id}>
                  {temple.name}
                </option>
              ))}
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
                      isAdmin={true}
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

const TeamsManagement = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userDetails, setUserDetails] = useState({});

  useEffect(() => {
    fetchTeamsData();
  }, []);

  // Fetch user details for team members
  const fetchUserDetails = async (userIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      // First try to fetch as user IDs
      let response = await fetch(`http://localhost:4000/api/admin/users/details?ids=${userIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.users && data.users.length > 0) {
          console.log('Found users by user IDs:', data.users.length);
          return data.users;
        }
      }

      // If no users found, try as profile IDs
      console.log('No users found, trying as profile IDs...');
      response = await fetch(`http://localhost:4000/api/admin/profiles/details?ids=${userIds.join(',')}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.profiles && data.profiles.length > 0) {
          console.log('Found profiles by profile IDs:', data.profiles.length);
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
      }

      console.log('No users or profiles found for IDs:', userIds);
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('http://localhost:4000/api/admin/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
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
      const eventKey = `${team.event?.event_type?.name || 'Unknown Event'}`;
      if (!grouped[eventKey]) {
        grouped[eventKey] = {
          eventName: eventKey,
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
    
    // Sort events by gender order: MALE first, then FEMALE, then ALL
    const sortedEvents = Object.values(grouped).sort((a, b) => {
      const genderOrder = { 'MALE': 1, 'FEMALE': 2, 'ALL': 3 };
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">Teams Management</h3>
          <p className="text-[#5A5A5A]">View team registrations grouped by events and temples</p>
        </div>
        <button
          onClick={fetchTeamsData}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
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
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
              const allEvents = groupedEvents.filter(event => event.gender === 'ALL');
              
              return (
                <>
                  {/* Male Events */}
                  {maleEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👨</span>
                          Male Events ({maleEvents.length})
                        </h3>
                      </div>
                      {maleEvents.map((event, eventIndex) => (
                        <div key={`male-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-blue-100">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Male
                                  </span>
                                  <span className="text-sm">
                                    {event.temples.length} Temple{event.temples.length !== 1 ? 's' : ''} Registered
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-blue-100">
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
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temple Code</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Teams</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Members</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status Breakdown</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Points</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {event.temples.map((temple, templeIndex) => (
                                  <tr key={temple.temple_id} className="hover:bg-blue-50 transition">
                                    <td className="px-6 py-4 font-semibold text-blue-900">{templeIndex + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-purple-800">{temple.temple_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{temple.temple_code}</td>
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
                                    <td className="px-6 py-4 text-blue-700 font-bold text-lg">
                                      {temple.totalPoints}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => {
                                            console.log('View teams for temple:', temple.temple_name, temple.teams);
                                          }}
                                          className="inline-block px-3 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold text-xs"
                                        >
                                          View Teams
                                        </button>
                                        <button 
                                          onClick={() => {
                                            console.log('View temple details:', temple);
                                          }}
                                          className="inline-block px-3 py-1 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition font-semibold text-xs"
                                        >
                                          Temple Details
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Female Events */}
                  {femaleEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-pink-600 to-pink-800 px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👩</span>
                          Female Events ({femaleEvents.length})
                        </h3>
                      </div>
                      {femaleEvents.map((event, eventIndex) => (
                        <div key={`female-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-pink-100">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Female
                                  </span>
                                  <span className="text-sm">
                                    {event.temples.length} Temple{event.temples.length !== 1 ? 's' : ''} Registered
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-pink-100">
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
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Temple Code</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Teams</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Members</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status Breakdown</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Points</th>
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {event.temples.map((temple, templeIndex) => (
                                  <tr key={temple.temple_id} className="hover:bg-pink-50 transition">
                                    <td className="px-6 py-4 font-semibold text-blue-900">{templeIndex + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-purple-800">{temple.temple_name}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{temple.temple_code}</td>
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
                                    <td className="px-6 py-4 text-blue-700 font-bold text-lg">
                                      {temple.totalPoints}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => {
                                            console.log('View teams for temple:', temple.temple_name, temple.teams);
                                          }}
                                          className="inline-block px-3 py-1 bg-pink-600 text-white rounded-lg shadow hover:bg-pink-700 transition font-semibold text-xs"
                                        >
                                          View Teams
                                        </button>
                                        <button 
                                          onClick={() => {
                                            console.log('View temple details:', temple);
                                          }}
                                          className="inline-block px-3 py-1 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition font-semibold text-xs"
                                        >
                                          Temple Details
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mixed/All Gender Events */}
                  {allEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-green-600 to-green-800 px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👥</span>
                          Mixed Gender Events ({allEvents.length})
                        </h3>
                      </div>
                      {allEvents.map((event, eventIndex) => (
                        <div key={`all-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-green-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-green-100">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Mixed Gender
                                  </span>
                                  <span className="text-sm">
                                    {event.temples.length} Temple{event.temples.length !== 1 ? 's' : ''} Registered
                                  </span>
                                </div>
                              </div>
                              <div className="text-right text-green-100">
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
                                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {event.temples.flatMap(temple => 
                                  temple.teams.map((team, teamIndex) => (
                                    <TeamMembersRow 
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
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-teal-600 text-xl">🏃</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Teams</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{teams.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">✅</span>
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
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">👥</span>
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
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">🏆</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TeamMembersRow = ({ team, temple, index, getTeamMemberDetails }) => {
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
    <tr className="hover:bg-green-50 transition">
      <td className="px-6 py-4 font-semibold text-blue-900">{index + 1}</td>
      <td className="px-6 py-4">
        <div className="font-semibold text-gray-800">{temple.temple_name}</div>
        <div className="text-sm text-gray-600">{temple.temple_code}</div>
      </td>
      <td className="px-6 py-4">
        {loading ? (
          <div className="text-sm text-gray-500">Loading...</div>
        ) : members.length > 0 ? (
          <div className="space-y-1">
            {members.map((member, idx) => (
              <div key={member.id} className="text-sm">
                <span className="font-medium text-gray-800">
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
              <div key={member.id} className="text-sm text-gray-600">
                {member.profile?.aadhar_number || 'N/A'}
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
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          team.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
          team.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {team.status || 'PENDING'}
        </span>
      </td>
      <td className="px-6 py-4 text-blue-700 font-bold text-lg">
        {team.event_result?.points || 0}
      </td>
      <td className="px-6 py-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              console.log('View team details:', team, members);
            }}
            className="inline-block px-3 py-1 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition font-semibold text-xs"
          >
            View Details
          </button>
          <button 
            onClick={() => {
              console.log('Edit team:', team);
            }}
            className="inline-block px-3 py-1 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition font-semibold text-xs"
          >
            Edit Team
          </button>
        </div>
      </td>
    </tr>
  );
};

const TempleManagement = () => {
  const [temples, setTemples] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTempleData();
  }, []);

  const fetchTempleData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const response = await fetch('http://localhost:4000/api/admin/temple-management', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.temples) {
        throw new Error('Invalid response format: temples data not found');
      }
      
      setTemples(data.temples);
    } catch (err) {
      console.error('Error fetching temple data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">Temple Management</h3>
          <p className="text-[#5A5A5A]">View and manage all temples and their statistics</p>
        </div>
        <button
          onClick={fetchTempleData}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
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
          <table className="min-w-full divide-y divide-blue-200">
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">SL.NO</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Temple Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Total Points</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Participants</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-blue-100">
              {temples.length > 0 ? (
                temples.map((temple, idx) => (
                  <tr key={temple.id} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 font-semibold text-blue-900">{idx + 1}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-semibold text-purple-800">{temple.name}</div>
                        {temple.address && (
                          <div className="text-sm text-gray-500">{temple.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-blue-700 font-bold text-lg">{temple.total_points}</td>
                    <td className="px-6 py-4">
                      <div className="text-center">
                        <div className="font-bold text-lg text-[#2A2A2A]">{temple.total_participants}</div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {/* Temple Contact Info */}
                        {temple.contact_name && (
                          <div className="mb-2">
                            <div className="text-xs text-gray-500 font-medium">Temple Contact:</div>
                            <div className="text-[#2A2A2A] font-medium">{temple.contact_name}</div>
                            {temple.contact_phone && (
                              <div className="text-blue-600">{temple.contact_phone}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Temple Admin Contact Info */}
                        {temple.temple_admin && (
                          <div>
                            <div className="text-xs text-gray-500 font-medium">Temple Admin:</div>
                            <div className="text-[#2A2A2A] font-medium">{temple.temple_admin.name}</div>
                            {temple.temple_admin.email && (
                              <div className="text-blue-600 text-xs">{temple.temple_admin.email}</div>
                            )}
                            {temple.temple_admin.phone && (
                              <div className="text-blue-600 text-xs">{temple.temple_admin.phone}</div>
                            )}
                          </div>
                        )}
                        
                        {/* Show message if no contact info available */}
                        {!temple.contact_name && !temple.temple_admin && (
                          <div className="text-gray-400 text-xs">No contact info available</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => window.open(`/templedetailedreport/?temple_id=${temple.id}`, '_blank')}
                          className="inline-block px-3 py-1 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition font-semibold text-xs"
                        >
                          View Points
                        </button>
                        <button 
                          onClick={() => window.open(`/participantslist/?temple_id=${temple.id}`, '_blank')}
                          className="inline-block px-3 py-1 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition font-semibold text-xs"
                        >
                          View All Participants
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No temples found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && temples.length > 0 && (
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

const ResultsManagement = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('individual');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/reports/event-performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch results');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err.message);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Group results by event type
  const individualEvents = results.filter(event => event.event_type?.type === 'INDIVIDUAL');
  const teamEvents = results.filter(event => event.event_type?.type === 'TEAM');

  // Group events by age category
  const groupEventsByAgeCategory = (events) => {
    const grouped = {};
    events.forEach(event => {
      const ageCategory = event.age_category?.name || 'Unknown';
      if (!grouped[ageCategory]) {
        grouped[ageCategory] = {
          name: ageCategory,
          fromAge: event.age_category?.from_age || 0,
          events: []
        };
      }
      grouped[ageCategory].events.push(event);
    });

    // Sort age categories by from_age
    return Object.values(grouped).sort((a, b) => a.fromAge - b.fromAge);
  };

  const individualEventsByAge = groupEventsByAgeCategory(individualEvents);
  const teamEventsByAge = groupEventsByAgeCategory(teamEvents);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">Results & Scoring</h3>
          <p className="text-[#5A5A5A]">View and manage results for individual and team events</p>
        </div>
        <button
          onClick={fetchResults}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
          <span className="ml-3 text-[#2A2A2A]">Loading results...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
          <button
            onClick={fetchResults}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Display */}
      {!loading && !error && (
        <div className="space-y-8">
          {/* Individual Events Results */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
              <h4 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">🏃</span>
                Individual Events Results ({individualEvents.length})
              </h4>
            </div>
            
            {individualEventsByAge.length > 0 ? (
              <div className="space-y-8 p-6">
                {individualEventsByAge.map((ageGroup) => (
                  <div key={ageGroup.name} className="space-y-4">
                    {/* Age Category Header */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 px-4 py-3">
                      <h5 className="text-lg font-semibold text-blue-800">{ageGroup.name}</h5>
                      <p className="text-sm text-blue-600">{ageGroup.events.length} event{ageGroup.events.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Events in this age category */}
                    {ageGroup.events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 ml-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h6 className="text-md font-semibold text-[#2A2A2A]">{event.event_type?.name}</h6>
                            <div className="flex items-center space-x-4 text-sm text-[#5A5A5A]">
                              <span>{event.gender}</span>
                              <span>•</span>
                              <span>{event.registrations?.length || 0} Participants</span>
                            </div>
                          </div>
                        </div>

                        {/* Results Table */}
                        {event.registrations && event.registrations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Rank</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Participant</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Temple</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Aadhar</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Points</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {event.registrations
                                  .filter(reg => reg.event_result)
                                  .sort((a, b) => {
                                    if (a.event_result?.rank === b.event_result?.rank) {
                                      return (b.event_result?.points || 0) - (a.event_result?.points || 0);
                                    }
                                    const rankOrder = { 'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'NA': 4 };
                                    return (rankOrder[a.event_result?.rank] || 5) - (rankOrder[b.event_result?.rank] || 5);
                                  })
                                  .map((registration, idx) => (
                                    <tr key={registration.id} className="hover:bg-blue-50 transition">
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                          registration.event_result?.rank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                                          registration.event_result?.rank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                                          registration.event_result?.rank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {registration.event_result?.rank === 'FIRST' ? '🥇' :
                                           registration.event_result?.rank === 'SECOND' ? '🥈' :
                                           registration.event_result?.rank === 'THIRD' ? '🥉' : '-'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-[#2A2A2A]">
                                          {registration.user?.first_name} {registration.user?.last_name}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-[#5A5A5A]">
                                        {registration.user?.temple?.name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-[#5A5A5A]">
                                        {registration.user?.aadhar_number || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 font-bold text-blue-600">
                                        {registration.event_result?.points || 0}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          registration.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                          registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {registration.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No results available for this event
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No individual events with results found
              </div>
            )}
          </div>

          {/* Team Events Results */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-purple-600 px-6 py-4">
              <h4 className="text-xl font-bold text-white flex items-center">
                <span className="mr-2">🏃‍♂️🏃‍♀️</span>
                Team Events Results ({teamEvents.length})
              </h4>
            </div>
            
            {teamEventsByAge.length > 0 ? (
              <div className="space-y-8 p-6">
                {teamEventsByAge.map((ageGroup) => (
                  <div key={ageGroup.name} className="space-y-4">
                    {/* Age Category Header */}
                    <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3">
                      <h5 className="text-lg font-semibold text-green-800">{ageGroup.name}</h5>
                      <p className="text-sm text-green-600">{ageGroup.events.length} event{ageGroup.events.length !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Events in this age category */}
                    {ageGroup.events.map((event) => (
                      <div key={event.id} className="border border-gray-200 rounded-lg p-4 ml-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h6 className="text-md font-semibold text-[#2A2A2A]">{event.event_type?.name}</h6>
                            <div className="flex items-center space-x-4 text-sm text-[#5A5A5A]">
                              <span>{event.gender}</span>
                              <span>•</span>
                              <span>{event.team_registrations?.length || 0} Teams</span>
                            </div>
                          </div>
                        </div>

                        {/* Results Table */}
                        {event.team_registrations && event.team_registrations.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Rank</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Team ID</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Temple</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Members</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Points</th>
                                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-100">
                                {event.team_registrations
                                  .filter(reg => reg.event_result)
                                  .sort((a, b) => {
                                    if (a.event_result?.rank === b.event_result?.rank) {
                                      return (b.event_result?.points || 0) - (a.event_result?.points || 0);
                                    }
                                    const rankOrder = { 'FIRST': 1, 'SECOND': 2, 'THIRD': 3, 'NA': 4 };
                                    return (rankOrder[a.event_result?.rank] || 5) - (rankOrder[b.event_result?.rank] || 5);
                                  })
                                  .map((registration, idx) => (
                                    <tr key={registration.id} className="hover:bg-green-50 transition">
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                          registration.event_result?.rank === 'FIRST' ? 'bg-yellow-100 text-yellow-800' :
                                          registration.event_result?.rank === 'SECOND' ? 'bg-gray-100 text-gray-800' :
                                          registration.event_result?.rank === 'THIRD' ? 'bg-orange-100 text-orange-800' :
                                          'bg-gray-100 text-gray-600'
                                        }`}>
                                          {registration.event_result?.rank === 'FIRST' ? '🥇' :
                                           registration.event_result?.rank === 'SECOND' ? '🥈' :
                                           registration.event_result?.rank === 'THIRD' ? '🥉' : '-'}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3">
                                        <div className="font-medium text-[#2A2A2A]">
                                          Team {registration.id}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-[#5A5A5A]">
                                        {registration.temple?.name || 'N/A'}
                                      </td>
                                      <td className="px-4 py-3 text-[#5A5A5A]">
                                        {registration.member_user_ids ? registration.member_user_ids.split(',').length : 0} members
                                      </td>
                                      <td className="px-4 py-3 font-bold text-green-600">
                                        {registration.event_result?.points || 0}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                          registration.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                          registration.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-red-100 text-red-800'
                                        }`}>
                                          {registration.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">
                            No results available for this event
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No team events with results found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!loading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Events</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{results.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏆</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Individual Events</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{individualEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">🏃</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Team Events</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{teamEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Results</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {results.reduce((sum, event) => 
                    sum + (event.registrations?.filter(r => r.event_result)?.length || 0) + 
                    (event.team_registrations?.filter(r => r.event_result)?.length || 0), 0
                  )}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ChampionsManagement = () => {
  const [champions, setChampions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChampions();
  }, []);

  const fetchChampions = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:4000/api/users/champions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch champions');
      }

      const data = await response.json();
      setChampions(data);
    } catch (err) {
      console.error('Error fetching champions:', err);
      setError(err.message);
      setChampions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D35D38]"></div>
        <span className="ml-3 text-[#2A2A2A]">Loading champions...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button
          onClick={fetchChampions}
          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!champions || champions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#5A5A5A]">No champions data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">🏆 Champions</h3>
          <p className="text-[#5A5A5A]">Top performers from all categories</p>
        </div>
        <button
          onClick={fetchChampions}
          className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Champions by Category */}
      <div className="space-y-8">
        {champions.map((category, categoryIndex) => (
          <div key={`${category.age_category}-${category.gender}`} className="bg-white rounded-lg shadow-sm overflow-hidden">
            {/* Category Header */}
            <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
              <h4 className="text-xl font-bold text-white">
                {category.age_category} - {category.gender}
              </h4>
              <p className="text-[#F8DFBE] text-sm mt-1">
                {category.total_participants} participants • {category.total_points_in_category} total points
              </p>
            </div>

            {/* Champions List */}
            <div className="p-6">
              {category.champions && category.champions.length > 0 ? (
                <div className="space-y-4">
                  {category.champions.map((champion, championIndex) => (
                    <div key={championIndex} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                      {/* Champion Info */}
                      <div className="flex items-center space-x-4">
                        {/* Rank Badge */}
                        <div className="w-12 h-12 bg-[#D35D38] rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">🏆</span>
                        </div>
                        
                        {/* Champion Details */}
                        <div>
                          <h5 className="text-lg font-semibold text-[#2A2A2A]">
                            {champion.name}
                          </h5>
                          <div className="flex items-center space-x-4 text-sm text-[#5A5A5A]">
                            <span>{champion.temple}</span>
                            <span>•</span>
                            <span>Aadhar: {champion.aadhar_number}</span>
                            <span>•</span>
                            <span>{champion.events ? champion.events.length : 0} events won</span>
                          </div>
                        </div>
                      </div>

                      {/* Points */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-[#D35D38]">
                          {champion.points}
                        </div>
                        <div className="text-sm text-[#5A5A5A]">points</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No champions found for this category
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      {champions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Categories</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">{champions.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">🏆</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Champions</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {champions.reduce((sum, category) => sum + (category.champions ? category.champions.length : 0), 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">👑</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Participants</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {champions.reduce((sum, category) => sum + category.total_participants, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-xl">👥</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#5A5A5A]">Total Points</p>
                <p className="text-2xl font-bold text-[#2A2A2A]">
                  {champions.reduce((sum, category) => sum + category.total_points_in_category, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">📊</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SystemSettings = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-[#2A2A2A]">System Settings</h3>
      <button className="bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors">
        Save Changes
      </button>
    </div>
    <p className="text-[#5A5A5A]">System settings functionality coming soon...</p>
  </div>
);

export default AdminPanel; 