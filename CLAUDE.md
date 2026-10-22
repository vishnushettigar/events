# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sports Event Management System** - A full-stack application for managing sports events, participants, team registrations, and results. The system supports role-based access control with users having different permissions based on their role (ADMIN, TEMPLE_ADMIN, STAFF, PARTICIPANT, VIEWER).

## Architecture

### High-Level Structure

```
sports-events/
├── sports_backend/         # Express.js API server (Node.js)
│   ├── src/
│   │   ├── index.js       # Server entry point, middleware setup
│   │   ├── routes/        # API endpoint handlers
│   │   ├── services/      # Business logic layer
│   │   ├── middleware/    # Auth, rate limiting
│   │   ├── config/        # Swagger documentation setup
│   │   └── utils/         # Prisma client, helpers
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── seed.js        # Seed data script
│   └── Dockerfile
├── sports/                  # React + Vite frontend
│   ├── src/
│   │   ├── Pages/         # Page components (main routes)
│   │   ├── components/    # Reusable UI components
│   │   ├── admin/         # Admin-specific pages
│   │   ├── staff/         # Staff-specific pages
│   │   ├── viewer/        # Viewer-specific pages
│   │   ├── utils/         # API service, config helpers
│   │   ├── contexts/      # React context providers
│   │   └── hooks/         # Custom React hooks
│   └── Dockerfile
├── docker-compose.yml
└── nginx.conf             # Reverse proxy configuration
```

### Key Technologies

- **Backend**: Express.js (ES modules), Prisma ORM, SQLite/Turso database
- **Frontend**: React 19, Vite, Tailwind CSS, Material-UI, Ant Design
- **Container**: Docker & Docker Compose

### Database Models

Core entities in `sports_backend/prisma/schema.prisma`:
- **User** / **Profile** - Authentication and user data
- **Mst_temple** - Temple/organization entities
- **Mst_event** / **Mst_event_type** - Event definitions and event types (INDIVIDUAL or TEAM)
- **Ind_event_registration** - Individual participant registrations (yearly)
- **Team_event_registration** - Team registrations (yearly)
- **event_performance** - Performance metrics (heats, times, trials)
- **Mst_event_result** - Rankings and points for event results
- **Mst_age_category** - Age categories for events
- **Mst_role** - User roles with permissions

**Key constraint**: Registrations are yearly (`unique_user_event_year` unique constraint).

### API Routes Structure

All routes prefixed with `/api`:
- `/api/users` - User registration, login, profile management
- `/api/events` - Event registration, performance data, results
- `/api/event-management` - Event creation and configuration
- `/api/admin` - Admin operations
- `/api/reports` - Reporting and exports
- `/api/system` - System settings
- `/api/viewer` - Public viewing endpoints

API documentation available at `http://localhost:4000/api-docs` (Swagger UI).

### Authentication & Authorization

- **JWT-based**: Tokens in `Authorization: Bearer <token>` header
- **Roles**: ADMIN (5), TEMPLE_ADMIN (2), STAFF (3), PARTICIPANT (1), VIEWER (4)
- **Middleware**: `authenticate()` validates JWT, `requireRole(role)` checks permissions
- **Token Secret**: Stored in `JWT_SECRET` env var

## Development Commands

### Backend (sports_backend/)

```bash
# Install dependencies
npm install

# Database setup
npx prisma generate              # Generate Prisma client
npx prisma migrate dev          # Run migrations and seed
npx prisma db seed              # Run seed script only

# Development
npm run dev                      # Start with hot-reload (nodemon)
npm start                        # Production start

# Testing
npm test                         # Run Jest tests
npm run test:watch              # Watch mode
npm run test:coverage           # Coverage report
```

### Frontend (sports/)

```bash
# Install dependencies
npm install

# Development
npm run dev                      # Start Vite dev server (port 5173)
npm run build                    # Production build
npm run lint                     # Run ESLint

# Preview
npm run preview                  # Preview production build
```

### Docker

```bash
# Start all services
docker-compose up

# Stop services
docker-compose down

# Services:
# - Frontend: http://localhost:3000 (via Nginx)
# - Backend API: http://localhost:4000
# - API Docs: http://localhost:4000/api-docs
# - Nginx reverse proxy: http://localhost:80
```

## Environment Configuration

### Backend (.env in sports_backend/)

```
DATABASE_URL=libsql://...       # Turso DB URL
DATABASE_AUTH_TOKEN=...          # Turso auth token
JWT_SECRET=...                   # JWT signing key
PORT=4000                        # Server port
NODE_ENV=development
```

### Frontend (.env in sports/)

```
VITE_API_BASE_URL=http://localhost:4000
VITE_API_VERSION=/api
VITE_DEBUG_MODE=true
```

See `sports/ENV_SETUP.md` for full environment variable documentation.

## Common Development Tasks

### Adding a New API Endpoint

1. Create the service function in `sports_backend/src/services/` (business logic)
2. Create the route handler in `sports_backend/src/routes/` (use existing route files)
3. Add JWT auth with `authenticate` middleware if required
4. Add role check with `requireRole()` if permission-gated
5. Update Swagger docs in route file JSDoc

### Working with Database

- Schema is in `sports_backend/prisma/schema.prisma`
- Create migration: `npx prisma migrate dev --name migration_name`
- Access Prisma Client in services: `import { PrismaClient } from '@prisma/client'`
- Seed script: `sports_backend/prisma/seed.js`

### Handling Yearly Data

Registrations (`Ind_event_registration`, `Team_event_registration`, `event_performance`) include a `year` field. Queries must filter by year to avoid cross-year data pollution. Example:
```javascript
const registrations = await prisma.ind_event_registration.findMany({
  where: { event_id, year: 2025 }
});
```

### Testing Individual Routes

Use Jest for backend, no test framework setup for frontend yet.

```bash
npm test -- eventService       # Run specific test file
npm run test:watch            # Continuous testing
```

## Important Code Patterns

### Service Layer Pattern

Services contain business logic and database queries. Example: `sports_backend/src/services/eventService.js` (~73KB, largest service with event/performance logic).

### Pagination

Use `offset` and `limit` parameters in queries. Frontend's `src/utils/config.js` provides `VITE_DEFAULT_PAGE_SIZE`.

### Error Handling

- HTTP status codes: 400 (bad request), 401 (auth), 403 (forbidden), 404 (not found), 500 (server error)
- Return errors as JSON: `{ error: "message" }`

### Rate Limiting

Rate limiter middleware exists (`src/middleware/rateLimiter.js`) but is disabled in index.js for testing. Enable by uncommenting `app.use(generalLimiter)`.

## Frontend Key Files

- **Entry**: `src/main.jsx`
- **App routing**: `src/App.jsx` (uses React Router)
- **API service**: `src/utils/api.js` (axios wrapper with environment config)
- **Auth config**: `src/utils/config.js` (centralized config and headers)
- **Contexts**: `src/contexts/` (global state management)

## Recent Work Context

Recent commits focus on:
- Heat generation logic for team events
- Participant options for staff
- Print/delete functionality for team events
- Bug fixes for mixed event display

Current branch: `testevents` | Main branch: `master`

## Debugging Tips

- Backend logs are printed to console with middleware logging via `morgan`
- Frontend dev tools: React DevTools browser extension recommended
- API docs: Always available at `/api-docs` when backend is running
- Database queries can be inspected via Prisma Studio: `npx prisma studio`

## Important Notes

- Credentials in `docker-compose.yml` (database token, etc.) - for development only, never use in production
- Nginx configuration in `nginx.conf` - routes requests between frontend/backend
- No Vite/frontend tests configured yet
- Database provider uses Turso (LibSQL) in production, SQLite locally
