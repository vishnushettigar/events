# Environment Configuration Setup

This document explains how to set up and use environment variables in the Sports Event Management System frontend using Vite.

## 📁 Files Created

- `.env` - Environment variables for development
- `.env.example` - Template file for other developers
- `src/utils/config.js` - Configuration utility
- `src/utils/api.js` - API service using environment variables

## 🚀 Quick Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env` as needed:**
   ```bash
   # API Configuration
   VITE_API_BASE_URL=http://localhost:4000
   VITE_API_VERSION=/api
   ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## 🔧 Environment Variables

### API Configuration
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_API_VERSION` - API version path

### Authentication
- `VITE_JWT_STORAGE_KEY` - Local storage key for JWT token
- `VITE_USER_STORAGE_KEY` - Local storage key for user data

### Application Configuration
- `VITE_APP_NAME` - Application name
- `VITE_APP_VERSION` - Application version

### Development Configuration
- `VITE_DEBUG_MODE` - Enable/disable debug logging
- `VITE_LOG_LEVEL` - Logging level (debug, info, warn, error)

### Feature Flags
- `VITE_ENABLE_ANALYTICS` - Enable analytics tracking
- `VITE_ENABLE_NOTIFICATIONS` - Enable notifications

### Pagination Defaults
- `VITE_DEFAULT_PAGE_SIZE` - Default items per page
- `VITE_MAX_PAGE_SIZE` - Maximum items per page

### Timeout Configuration
- `VITE_API_TIMEOUT` - API request timeout (milliseconds)
- `VITE_SESSION_TIMEOUT` - Session timeout (milliseconds)

### Error Handling
- `VITE_SHOW_ERROR_DETAILS` - Show detailed error messages
- `VITE_ERROR_REPORTING_ENABLED` - Enable error reporting

## 💻 Usage Examples

### Using the Config Utility

```javascript
import config, { getApiUrl, getAuthHeaders, logDebug } from './utils/config.js';

// Access configuration values
console.log(config.API_BASE_URL); // http://localhost:4000
console.log(config.APP_NAME); // Sports Event Management System

// Get full API URL
const apiUrl = getApiUrl('/users'); // http://localhost:4000/api/users

// Get authentication headers
const headers = getAuthHeaders();

// Debug logging
logDebug('User logged in', { userId: 123 });
```

### Using the API Service

```javascript
import { userAPI, eventAPI, authAPI } from './utils/api.js';

// Authentication
const loginResponse = await authAPI.login({ username, password });

// User management
const users = await userAPI.getAllUsers({ page: 1, limit: 10 });
const user = await userAPI.getUserById(123);

// Event management
const events = await eventAPI.getAllEvents();
const performance = await eventAPI.getEventPerformance();

// Update results
await eventAPI.updateIndividualResult(456, 'FIRST');
await eventAPI.updateTeamResult(789, 'SECOND');
```

### Direct API Calls

```javascript
import apiService from './utils/api.js';

// GET request
const data = await apiService.get('/users/profile');

// POST request
const response = await apiService.post('/auth/login', {
  username: 'user',
  password: 'pass'
});

// PUT request
await apiService.put('/users/profile', { name: 'New Name' });

// DELETE request
await apiService.delete('/users/123');
```

## 🔒 Security Notes

- **Never commit `.env` files** to version control
- **Use `.env.example`** as a template for other developers
- **Environment variables must start with `VITE_`** to be accessible in Vite
- **Sensitive data** should be handled server-side

## 🌍 Environment-Specific Configurations

### Development
```bash
VITE_API_BASE_URL=http://localhost:4000
VITE_DEBUG_MODE=true
VITE_SHOW_ERROR_DETAILS=true
```

### Production
```bash
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_DEBUG_MODE=false
VITE_SHOW_ERROR_DETAILS=false
VITE_ERROR_REPORTING_ENABLED=true
```

### Testing
```bash
VITE_API_BASE_URL=http://localhost:4001
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

## 🛠️ Troubleshooting

### Environment variables not loading?
1. Make sure they start with `VITE_`
2. Restart your development server (`npm run dev`)
3. Check for typos in variable names
4. Verify the `.env` file is in the project root

### API calls failing?
1. Verify `VITE_API_BASE_URL` is correct
2. Check if the backend server is running
3. Ensure CORS is properly configured

### Debug logging not working?
1. Set `VITE_DEBUG_MODE=true`
2. Check browser console for debug messages
3. Verify `VITE_LOG_LEVEL` is set to 'debug'

## 🔄 Vite vs Create React App

| Feature | Vite | Create React App |
|---------|------|------------------|
| Environment Prefix | `VITE_` | `REACT_APP_` |
| Access Method | `import.meta.env.VITE_*` | `process.env.REACT_APP_*` |
| Build Tool | Vite | Webpack |
| Development Server | `npm run dev` | `npm start` |

## 📚 Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Environment Variables Best Practices](https://12factor.net/config)
- [API Service Patterns](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) 