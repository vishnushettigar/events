# Sports Event Management System - Backend

A Node.js/Express backend for managing sports events, participants, and results.

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- SQLite (included with the project)
- Docker and Docker Compose (for containerized setup)

## Local Setup

### Option 1: Direct Setup

1. **Clone the repository**
   ```bash
   git clone git@github-vishnushettigar:vishnushettigar/events.git
   cd events/sports_backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Update the environment variables as needed:
     ```
     DATABASE_URL="file:./dev.db"
     JWT_SECRET="your-secret-key"
     PORT=4000
     ```

4. **Database Setup**
   ```bash
   # Generate Prisma client
   npx prisma generate

   # Create and apply database migrations
   npx prisma migrate dev
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

### Option 2: Docker Setup

1. **Clone the repository**
   ```bash
   git clone git@github-vishnushettigar:vishnushettigar/events.git
   cd events
   ```

2. **Start the services**
   ```bash
   docker-compose up
   ```

   This will start both the backend and frontend services:
   - Backend API: http://localhost:4000
   - Frontend: http://localhost:3000
   - API Documentation: http://localhost:4000/api-docs

3. **Stop the services**
   ```bash
   docker-compose down
   ```

## Project Structure

```
events/
├── sports_backend/     # Backend service
│   ├── prisma/        # Database schema and migrations
│   ├── src/           # Source code
│   └── Dockerfile     # Backend Docker configuration
├── sports/            # Frontend service
│   ├── src/          # Source code
│   └── Dockerfile    # Frontend Docker configuration
└── docker-compose.yml # Docker Compose configuration
```

## API Documentation

Once the server is running, you can access the API documentation at:
```
http://localhost:4000/api-docs
```

## Available Scripts

- `npm run dev`