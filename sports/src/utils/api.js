import config, { getApiUrl, getAuthHeaders, logDebug, logError } from './config.js';

// API utility functions
class ApiService {
  constructor() {
    this.baseURL = getApiUrl();
    this.timeout = config.API_TIMEOUT;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Don't include Authorization header for login and register endpoints
    const isAuthEndpoint = endpoint === '/users/login' || endpoint === '/users/register';
    const headers = isAuthEndpoint 
      ? { 'Content-Type': 'application/json' }
      : getAuthHeaders();
    
    const defaultOptions = {
      headers,
      timeout: this.timeout,
    };

    const requestOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    };

    logDebug(`API Request: ${requestOptions.method || 'GET'} ${url}`);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logDebug(`API Response: ${url}`, data);
      return data;
    } catch (error) {
      logError(`API Error: ${url}`, error);
      throw error;
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  // POST request
  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // PATCH request
  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

// Create singleton instance
const apiService = new ApiService();

// Specific API methods for the application
export const authAPI = {
  login: (credentials) => apiService.post('/users/login', credentials),
  register: (userData) => apiService.post('/users/register', userData),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: () => apiService.post('/auth/refresh'),
  verifyAdminAccess: () => apiService.get('/admin/verify-access'),
  getDashboardStats: () => apiService.get('/admin/dashboard-stats'),
  verifyViewerAccess: () => apiService.get('/viewer/verify-access'),
  getViewerDashboardStats: () => apiService.get('/viewer/dashboard-stats'),
};

export const userAPI = {
  getProfile: () => apiService.get('/users/profile'),
  updateProfile: (data) => apiService.put('/users/profile', data),
  getAllUsers: (params) => apiService.get('/admin/users', params),
  getUserById: (id) => apiService.get(`/admin/users/${id}`),
  updateUserRole: (id, roleId) => apiService.put(`/admin/users/${id}/update-role`, { role_id: roleId }),
  getUserDetails: (ids) => apiService.get('/admin/users/details', { ids }),
  getProfileDetails: (ids) => apiService.get('/admin/profiles/details', { ids }),
  getRoles: () => apiService.get('/admin/roles'),
  getTemples: () => apiService.get('/admin/temples'),
  getTempleUsers: () => apiService.get('/users/templeusers'),
  searchByAadhar: (aadharNumber) => apiService.get('/users/search-by-aadhar', { aadharNumber }),
  getTempleDetailedReport: (templeId) => apiService.get(`/users/temple-detailed-report/${templeId}`),
  getAllTemples: () => apiService.get('/users/temples'),
  getTempleById: (templeId) => apiService.get(`/users/temple/${templeId}`),
};

export const eventAPI = {
  getAllEvents: () => apiService.get('/admin/events'),
  getAllEventsComplete: () => apiService.get('/events/all-events'),
  getAvailableEvents: () => apiService.get('/users/available-events'),
  getEventPerformance: () => apiService.get('/reports/event-performance'),
  getParticipantData: (params) => apiService.get('/events/participant-data', params),
  registerParticipant: (data) => apiService.post('/events/register-participant', data),
  unregisterParticipant: (eventId) => apiService.delete(`/events/unregister-participant/${eventId}`),
  getTempleParticipants: (params) => apiService.get('/events/temple-participants', params),
  updateIndividualResult: (id, rank) => apiService.put(`/events/update-individual-result/${id}`, { rank }),
  updateTeamResult: (id, rank) => apiService.put(`/events/update-team-result/${id}`, { rank }),
  getTeamEvents: () => apiService.get('/events/team-events'),
  getTempleTeams: () => apiService.get('/events/temple-teams'),
  registerTeam: (data) => apiService.post('/events/register-team', data),
  updateTeam: (registrationId, data) => apiService.put(`/events/update-team/${registrationId}`, data),
  getEventParticipants: (eventId) => apiService.get(`/events/event-participants/${eventId}`),
};

export const participantAPI = {
  getAllParticipants: (params) => apiService.get('/admin/participants', params),
  updateParticipantStatus: (id, status) => apiService.put(`/admin/participants/${id}/update-status`, { status }),
  updateRegistrationStatus: (data) => apiService.post('/events/update-registration-status', data),
};

export const teamAPI = {
  getAllTeams: (params) => apiService.get('/admin/teams', params),
};

export const templeAPI = {
  getTempleManagement: () => apiService.get('/admin/temple-management'),
};

export const reportAPI = {
  getChampions: () => apiService.get('/users/champions'),
  getAllResults: () => apiService.get('/users/all-results'),
  getChampionshipReport: () => apiService.get('/reports/championship'),
};

// Viewer-specific API methods (read-only access)
export const viewerAPI = {
  getEvents: () => apiService.get('/viewer/events'),
  getParticipants: (params) => apiService.get('/viewer/participants', params),
  getParticipantData: (params) => apiService.get('/viewer/participant-data', params),
  getTeams: (params) => apiService.get('/viewer/teams', params),
  getTemples: () => apiService.get('/viewer/temples'),
  getTempleManagement: () => apiService.get('/viewer/temple-management'),
  getResults: () => apiService.get('/viewer/results'),
  getEventPerformance: () => apiService.get('/viewer/event-performance'),
  getChampions: () => apiService.get('/viewer/champions'),
  getUsers: () => apiService.get('/viewer/users'),
  getUserDetails: (ids) => apiService.get('/viewer/users/details', { ids }),
  getProfileDetails: (ids) => apiService.get('/viewer/profiles/details', { ids }),
  getSystemLogs: (limit = 100) => apiService.get('/viewer/system-logs', { limit }),
  createSystemBackup: () => apiService.post('/viewer/system-backup'),
  getRoles: () => apiService.get('/viewer/roles'),
};

export default apiService; 