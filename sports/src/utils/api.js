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
    const headers = getAuthHeaders();
    
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
  login: (credentials) => apiService.post('/auth/login', credentials),
  register: (userData) => apiService.post('/auth/register', userData),
  logout: () => apiService.post('/auth/logout'),
  refreshToken: () => apiService.post('/auth/refresh'),
};

export const userAPI = {
  getProfile: () => apiService.get('/users/profile'),
  updateProfile: (data) => apiService.put('/users/profile', data),
  getAllUsers: (params) => apiService.get('/admin/users', params),
  getUserById: (id) => apiService.get(`/admin/users/${id}`),
  updateUserRole: (id, roleId) => apiService.put(`/admin/users/${id}/update-role`, { role_id: roleId }),
  getUserDetails: (ids) => apiService.get('/admin/users/details', { ids }),
  getProfileDetails: (ids) => apiService.get('/admin/profiles/details', { ids }),
};

export const eventAPI = {
  getAllEvents: () => apiService.get('/admin/events'),
  getEventPerformance: () => apiService.get('/reports/event-performance'),
  updateIndividualResult: (id, rank) => apiService.put(`/events/update-individual-result/${id}`, { rank }),
  updateTeamResult: (id, rank) => apiService.put(`/events/update-team-result/${id}`, { rank }),
};

export const participantAPI = {
  getAllParticipants: (params) => apiService.get('/admin/participants', params),
  updateParticipantStatus: (id, status) => apiService.put(`/admin/participants/${id}/update-status`, { status }),
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

export default apiService; 