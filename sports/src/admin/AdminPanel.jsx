import React, { useState, useEffect } from 'react';
import CollapsibleList from '../components/CollapsibleList';
import TempleManagement from '../components/TempleManagement.jsx';
import Schedule from '../components/Schedule.jsx';
import Results from '../components/Results.jsx';
import Champions from '../components/Champions.jsx';
import { authAPI, userAPI, eventAPI, participantAPI, teamAPI, templeAPI, reportAPI, systemAPI } from '../utils/api.js';
import authManager from '../utils/authManager';
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
        const verifyData = await authAPI.verifyAdminAccess();
        setUser(verifyData.user);

        // Fetch dashboard statistics
        const statsData = await authAPI.getDashboardStats();
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
      console.log('AdminPanel: Received authLogout event - redirecting to login');
      window.location.href = '/login';
    };

    window.addEventListener('authLogout', handleAuthLogout);
    return () => window.removeEventListener('authLogout', handleAuthLogout);
  }, []);

  const handleLogout = () => {
    console.log('AdminPanel: Handling logout');
    authManager.logout(true); // Redirect to login for admin panel
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
        return <Schedule apiSource="admin" />;
      case 'users':
        return <UserManagement />;
      case 'participants':
        return <ParticipantsManagement />;
      case 'teams':
        return <TeamsManagement />;
      case 'temples':
        return <TempleManagement apiSource="admin" />;
      case 'results':
        return <Results apiSource="admin" />;
      case 'champions':
        return <Champions apiSource="admin" />;
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
          {/* <div className="p-4 border-b border-gray-200">
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
                  {user?.role === 4 ? 'Viewer' : 'Admin'}
                </p>
              </div>
            </div>
          </div> */}

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

// Event Management - now using reusable Schedule component

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

  //searching users in  User Management with aadhar number//
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.temple && { temple: filters.temple })
      };

      const data = await userAPI.getAllUsers(params);
      
      setUsers(data.users);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await userAPI.getRoles();
      setRoles(data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const fetchTemples = async () => {
    try {
      const data = await userAPI.getTemples();
      setTemples(data);
    } catch (error) {
      console.error('Error fetching temples:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleRoleUpdate = async (userId, newRoleId) => {
    setUpdatingRole(true);
    try {
      await userAPI.updateUserRole(userId, newRoleId);
      
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
   //user management//
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
            <label className="block text-sm font-medium text-[#5A5A5A] mb-2">Search by Aadhar</label>
            <div className="relative">
            <input
              type="text"
                placeholder="Enter Aadhar number..."
              value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchUsers();
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-400">🔍</span>
              </div>
            </div>
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
          <div className="flex items-end space-x-2">
            <button
              onClick={fetchUsers}
              className="flex-1 bg-[#D35D38] text-white px-4 py-2 rounded-lg hover:bg-[#B84A2E] transition-colors"
            >
              Search
            </button>
            <button
              onClick={() => {
                setFilters({ search: '', role: '', temple: '' });
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              title="Clear all filters"
            >
              Clear
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
            {users.length > 0 ? (
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
                          user.profile?.role_id === 5 ? 'bg-red-100 text-red-800' :
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
            ) : (
              <div className="p-8 text-center">
                <div className="text-gray-400 mb-4">
                  <span className="text-4xl">🔍</span>
                </div>
                <h3 className="text-lg font-medium text-[#2A2A2A] mb-2">
                  {filters.search ? 'No users found' : 'No users available'}
                </h3>
                <p className="text-[#5A5A5A] mb-4">
                  {filters.search 
                    ? `No users found matching "${filters.search}"`
                    : 'There are no users in the system yet.'
                  }
                </p>
                {filters.search && (
                  <button
                    onClick={() => {
                      setFilters({ search: '', role: '', temple: '' });
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="text-[#D35D38] hover:text-[#B84A2E] transition-colors font-medium"
                  >
                    Clear search and show all users
                  </button>
                )}
              </div>
            )}

            {/* Pagination */}
            {users.length > 0 && pagination.totalPages > 1 && (
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
                      {(() => {
                        const totalPages = pagination.totalPages;
                        const currentPage = pagination.page;
                        const pages = [];
                        
                        if (totalPages <= 7) {
                          // Show all pages if 7 or less
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          // Always show first page
                          pages.push(1);
                          
                          if (currentPage > 3) {
                            pages.push('...');
                          }
                          
                          // Show pages around current page
                          const start = Math.max(2, currentPage - 1);
                          const end = Math.min(totalPages - 1, currentPage + 1);
                          
                          for (let i = start; i <= end; i++) {
                            if (!pages.includes(i)) pages.push(i);
                          }
                          
                          if (currentPage < totalPages - 2) {
                            pages.push('...');
                          }
                          
                          // Always show last page
                          if (!pages.includes(totalPages)) pages.push(totalPages);
                        }
                        
                        return pages.map((pageNum, idx) => (
                          pageNum === '...' ? (
                            <span
                              key={`ellipsis-${idx}`}
                              className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500"
                            >
                              ...
                            </span>
                          ) : (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pageNum === currentPage
                                  ? 'z-10 bg-[#D35D38] border-[#D35D38] text-white'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          )
                        ));
                      })()}
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
        const data = await userAPI.getTemples();
        setTemples(data);
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
      
      if (eventIds.length === 0) return;

      // Build query parameters - only show APPROVED participants
      const params = new URLSearchParams();
      params.append('event_ids', eventIds.join(','));
      params.append('status', 'ACCEPTED'); // Only show approved participants
      if (selectedTemple !== 'ALL') {
        params.append('temple_id', selectedTemple);
      }

      const data = await participantAPI.getAllParticipants({
        event_ids: eventIds.join(','),
        status: 'ACCEPTED', // Only show approved participants
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
          Total Approved Participants: {allParticipants.length}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">
            <span className="font-semibold">Note:</span> Only approved participants are displayed in this view.
          </p>
        </div> */}
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

          {/* Status Filter - Removed for admin view */}

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
                      ageCategory={ageCategory}
                      gender={gender}
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
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTemple, setSelectedTemple] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchTeamsData();
  }, []);

  // Fetch user details for team members
  const fetchUserDetails = async (userIds) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return [];

      // First try to fetch as user IDs
      let data = await userAPI.getUserDetails(userIds.join(','));
      if (data.users && data.users.length > 0) {
        return data.users;
      }

      // If no users found, try as profile IDs
      data = await userAPI.getProfileDetails(userIds.join(','));
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
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }

      const data = await teamAPI.getAllTeams();
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

 // Teams management//
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
                      <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👨</span>
                          Male Events ({maleEvents.length})
                        </h3>
                      </div>
                      {maleEvents.map((event, eventIndex) => (
                        <div key={`male-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-[#F8DFBE]">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Male
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
                                  <tr key={temple.temple_id} className="hover:bg-orange-50 transition">
                                    <td className="px-6 py-4 font-semibold text-[#D35D38]">{templeIndex + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-[#2A2A2A]">{temple.temple_name}</div>
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
                                    <td className="px-6 py-4 text-[#D35D38] font-bold text-lg">
                                      {temple.totalPoints}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => handleViewTeams(temple)}
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
                      ))}
                    </div>
                  )}

                  {/* Female Events */}
                  {femaleEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👩</span>
                          Female Events ({femaleEvents.length})
                        </h3>
                      </div>
                      {femaleEvents.map((event, eventIndex) => (
                        <div key={`female-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-[#F8DFBE]">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Female
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
                                  <tr key={temple.temple_id} className="hover:bg-orange-50 transition">
                                    <td className="px-6 py-4 font-semibold text-[#D35D38]">{templeIndex + 1}</td>
                                    <td className="px-6 py-4">
                                      <div className="font-semibold text-[#2A2A2A]">{temple.temple_name}</div>
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
                                    <td className="px-6 py-4 text-[#D35D38] font-bold text-lg">
                                      {temple.totalPoints}
                                    </td>
                                    <td className="px-6 py-4">
                                      <div className="flex space-x-2">
                                        <button 
                                          onClick={() => handleViewTeams(temple)}
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
                      ))}
                    </div>
                  )}

                  {/* Mixed Gender Events */}
                  {mixedEvents.length > 0 && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-3 rounded-lg">
                        <h3 className="text-xl font-bold text-white flex items-center">
                          <span className="mr-2">👥</span>
                          Mixed Gender Events ({mixedEvents.length})
                        </h3>
                      </div>
                      {mixedEvents.map((event, eventIndex) => (
                        <div key={`all-${eventIndex}`} className="bg-white rounded-2xl shadow-xl overflow-hidden">
                          {/* Event Header */}
                          <div className="bg-gradient-to-r from-[#D35D38] to-[#B84A2E] px-6 py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xl font-bold text-white">{event.eventName}</h4>
                                <div className="flex items-center space-x-4 mt-1 text-[#F8DFBE]">
                                  <span className="text-sm">
                                    {event.ageCategory?.name || 'All Ages'} • Mixed Gender
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
                                  temple.teams.map(team => ({ team, temple }))
                                ).map((item, index) => (
                                  <TeamMembersRow 
                                    key={`${item.temple.temple_id}-${item.team.id}`}
                                    team={item.team}
                                    temple={item.temple}
                                    index={index}
                                    getTeamMemberDetails={getTeamMemberDetails}
                                  />
                                ))}
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
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-xl">🏃</span>
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
                <span className="text-orange-600 text-xl">✅</span>
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
                <span className="text-orange-600 text-xl">👥</span>
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
                <span className="text-orange-600 text-xl">🏆</span>
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
    <tr className="hover:bg-orange-50 transition">
      <td className="px-6 py-4 font-semibold text-[#D35D38]">{index + 1}</td>
      <td className="px-6 py-4">
        <div className="font-semibold text-[#2A2A2A]">{temple.temple_name}</div>
        <div className="text-sm text-gray-600">{temple.temple_code}</div>
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
      <td className="px-6 py-4 text-[#D35D38] font-bold text-lg">
        {team.event_result?.points || 0}
      </td>
      {/* <td className="px-6 py-4">
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              // TODO: Implement view team details functionality
            }}
            className="inline-block px-3 py-1 bg-[#D35D38] text-white rounded-lg shadow hover:bg-[#B84A2E] transition font-semibold text-xs"
          >
            View Details
          </button>
        </div>
      </td> */}
    </tr>
  );
};

// Temple management section - now using reusable component



// System settings section//
// Define the settings we want to display
const SETTING_KEYS = [
  'lane_count',
  'AGE_CALC_CUTOFF_DATE',
  'HOST_TEMPLE',
  'SEASON',
  'EVENT_DATE',
  'REG_LAST_DATE_TEAM',
  'REG_LAST_DATE_INDIVIDUAL',
  'LAST_DATE_STATUS_UPDATE'
];

const SystemSettings = () => {

  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Helper function to determine input type
  const getInputType = (key) => {
    if (key.includes('DATE') || key === 'EVENT_DATE') {
      return 'date';
    }
    if (key === 'lane_count') {
      return 'number';
    }
    return 'text';
  };

  // Helper function to format date for HTML date input (YYYY-MM-DD)
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    // If it's already in YYYY-MM-DD format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
      return dateValue.split('T')[0]; // Remove time part if present
    }
    // Try to parse and format
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetching(true);
        const settingsData = await systemAPI.getSettings();
        
        // Convert array to object keyed by name
        const settingsObj = {};
        settingsData.forEach(setting => {
          if (SETTING_KEYS.includes(setting.name)) {
            // Format date values for date inputs
            if (getInputType(setting.name) === 'date') {
              settingsObj[setting.name] = formatDateForInput(setting.value);
            } else {
              settingsObj[setting.name] = setting.value;
            }
          }
        });
        
        console.log('Fetched settings:', settingsObj);
        setSettings(settingsObj);
        setError(null);
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Failed to load settings. Please try again.');
      } finally {
        setFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setSaved(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Update each setting individually
      const updatePromises = Object.entries(settings).map(([key, value]) => {
        if (SETTING_KEYS.includes(key)) {
          return systemAPI.updateSetting(key, value);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get setting label
  const getSettingLabel = (key) => {
    const labels = {
      'lane_count': 'Lane Count',
      'AGE_CALC_CUTOFF_DATE': 'Age Calculation Cut-off Date',
      'HOST_TEMPLE': 'Host Temple',
      'SEASON': 'Season',
      'EVENT_DATE': 'Event Date',
      'REG_LAST_DATE_TEAM': 'Registration Last Date (Team)',
      'REG_LAST_DATE_INDIVIDUAL': 'Registration Last Date (Individual)',
      'LAST_DATE_STATUS_UPDATE': 'Last Date for Status Update (Temple Admins)'
    };
    return labels[key] || key;
  };

  // Helper function to get setting description
  const getSettingDescription = (key) => {
    const descriptions = {
      'lane_count': 'Number of lanes available',
      'AGE_CALC_CUTOFF_DATE': 'Date for calculating participant ages',
      'HOST_TEMPLE': 'Primary temple hosting the event',
      'SEASON': 'Current event season',
      'EVENT_DATE': 'Main event date',
      'REG_LAST_DATE_TEAM': 'Last date for team registrations',
      'REG_LAST_DATE_INDIVIDUAL': 'Last date for individual registrations',
      'LAST_DATE_STATUS_UPDATE': 'Last date to update registration status'
    };
    return descriptions[key] || '';
  };

  // Helper function to get icon
  const getIcon = (key) => {
    if (key === 'HOST_TEMPLE') return '🏛️';
    if (key.includes('DATE')) return '📅';
    if (key === 'SEASON') return '🏆';
    if (key === 'lane_count') return '🏃';
    return '⚙️';
  };

  // Helper function to get icon color
  const getIconColor = (key) => {
    if (key === 'HOST_TEMPLE') return 'bg-blue-100 text-blue-600';
    if (key.includes('DATE')) return 'bg-green-100 text-green-600';
    if (key === 'SEASON') return 'bg-purple-100 text-purple-600';
    if (key === 'lane_count') return 'bg-orange-100 text-orange-600';
    return 'bg-gray-100 text-gray-600';
  };

  if (fetching) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#5A5A5A]">Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-[#2A2A2A] mb-2">⚙️ System Settings</h3>
          <p className="text-[#5A5A5A]">Configure system-wide settings and event details</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            loading 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-[#D35D38] text-white hover:bg-[#B84A2E]'
          }`}
        >
          {loading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SETTING_KEYS.map((key) => (
          <div key={key} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className={`w-10 h-10 ${getIconColor(key)} rounded-lg flex items-center justify-center mr-3`}>
                <span className="text-xl">{getIcon(key)}</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-[#2A2A2A]">{getSettingLabel(key)}</h4>
                <p className="text-sm text-[#5A5A5A]">{getSettingDescription(key)}</p>
              </div>
            </div>
            <input
              type={getInputType(key)}
              value={getInputType(key) === 'date' ? formatDateForInput(settings[key]) : (settings[key] || '')}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D35D38] focus:border-transparent"
              placeholder={`Enter ${getSettingLabel(key).toLowerCase()}`}
              min={key === 'lane_count' ? '1' : undefined}
            />
          </div>
        ))}
      </div>

      {/* Settings Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-[#2A2A2A] mb-4">📋 Current Settings Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {SETTING_KEYS.map((key) => {
            const value = settings[key] || 'Not set';
            const displayValue = getInputType(key) === 'date' && value !== 'Not set' 
              ? new Date(value).toLocaleDateString() 
              : value;
            
            return (
              <div key={key} className="bg-white p-3 rounded border">
                <span className="font-medium text-[#5A5A5A]">{getSettingLabel(key)}:</span>
                <span className="ml-2 text-[#2A2A2A]">{displayValue}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel; 