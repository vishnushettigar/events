import config, { getApiUrl, getAuthHeaders, logDebug, logError } from './config.js';
import { isTokenExpired, clearAuthData } from './tokenUtils.js';
import authManager from './authManager.js';

// API utility functions
class ApiService {
  constructor() {
    this.baseURL = getApiUrl();
    this.timeout = config.API_TIMEOUT;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    // Don't include Authorization header for login, register, and public endpoints
    const isAuthEndpoint = endpoint === '/users/login' || endpoint === '/users/register';
    const isPublicEndpoint = endpoint === '/system/registered-users-count';
    const headers = (isAuthEndpoint || isPublicEndpoint)
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
        
        // Handle 401 Unauthorized responses
        if (response.status === 401) {
          console.log('API Service: Received 401 Unauthorized response');
          
          // Don't trigger logout for login endpoint - just throw error
          if (isAuthEndpoint) {
            throw new Error('Invalid Aadhaar number or password. Please try again.');
          } else {
            authManager.handleUnauthorized();
            throw new Error('Unauthorized - Please login again');
          }
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      logDebug(`API Response: ${url}`, data);
      return data;
    } catch (error) {
      logError(`API Error: ${url}`, error);
      
      // Handle network errors and abort errors with user-friendly messages
      const errorName = error?.name || '';
      const errorMessage = error?.message || '';
      
      // Check for abort errors (timeout or manual abort)
      if (errorName === 'AbortError' || 
          errorMessage.toLowerCase().includes('aborted') ||
          errorMessage.toLowerCase().includes('signal is aborted')) {
        throw new Error('Network request timed out. Please check your internet connection and try again.');
      }
      
      // Check for network errors (failed to fetch, no internet, etc.)
      if (errorName === 'TypeError' && 
          (errorMessage.toLowerCase().includes('failed to fetch') ||
           errorMessage.toLowerCase().includes('networkerror') ||
           errorMessage.toLowerCase().includes('network error'))) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Check for other network-related errors
      if (errorMessage.toLowerCase().includes('network') ||
          errorMessage.toLowerCase().includes('connection') ||
          errorMessage.toLowerCase().includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      
      // Re-throw the original error if it's not a network error
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
  checkAadhaar: (aadhaar) => apiService.post('/users/check-aadhaar', { aadhaar }),
  checkEmail: (email) => apiService.post('/users/check-email', { email }),
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
  getTempleUsers: (templeId) => apiService.get('/users/templeusers', templeId ? { temple_id: templeId } : {}),
  searchByAadhar: (aadharNumber) => apiService.get('/users/search-by-aadhar', { aadharNumber }),
  getTempleDetailedReport: (templeId) => apiService.get(`/users/temple-detailed-report/${templeId}`),
  getAllTemples: () => apiService.get('/users/temples'),
  getTempleById: (templeId) => apiService.get(`/users/temple/${templeId}`),
  getTeamRegistrations: () => apiService.get('/users/participant-teams'),
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
  getTeamParticipants: (registrationId) => apiService.get(`/events/team-participants/${registrationId}`),
  getTeamRegistration: (registrationId) => apiService.get(`/events/team-registration/${registrationId}`),
  
  // Heat management
  generateHeats: (eventId) => apiService.post('/events/generate-heats', { event_id: eventId }),
  regenerateHeats: (eventId) => apiService.delete(`/events/regenerate-heats/${eventId}`),
  getHeats: (eventId) => apiService.get(`/events/heats/${eventId}`),
  saveTimings: (eventId, heatNumber, timings) => apiService.put('/events/update-timings', { event_id: eventId, heat_number: heatNumber, timings }),
  saveFinalTimings: (eventId, timings) => apiService.put('/events/update-final-timings', { event_id: eventId, timings }),
  
  // Trial management
  initTrials: (eventId) => apiService.post('/events/init-trials', { event_id: eventId }),
  getTrials: (eventId) => apiService.get(`/events/trials/${eventId}`),
  saveTrials: (eventId, trials) => apiService.put('/events/update-trials', { event_id: eventId, trials }),
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
  getTemples: () => apiService.get('/viewer/temple-list'),
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

export const systemAPI = {
  getSettings: () => apiService.get('/system/settings'),
  getSetting: (name) => apiService.get(`/system/settings/${name}`),
  updateSetting: (name, value) => apiService.put(`/system/settings/${name}`, { value }),
  getRegisteredUsersCount: () => apiService.get('/system/registered-users-count'),
};

export default apiService; 