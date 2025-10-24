import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from '../src/routes/userRoutes.js';
import eventRoutes from '../src/routes/eventRoutes.js';
import adminRoutes from '../src/routes/adminRoutes.js';
import { setupTestData, cleanupTestData, createAuthenticatedUser, createTempleAdminUser, createAdminUser, generateTestToken } from './testUtils.js';
import { prisma } from './testDatabase.js';

dotenv.config();

// Create test app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

describe('Integration Tests - Complete User Journey', () => {
  let testData;
  let participantUser;
  let templeAdminUser;
  let adminUser;
  let participantToken;
  let templeAdminToken;
  let adminToken;

  beforeAll(async () => {
    testData = await setupTestData();
    
    // Create test users
    const participant = await createAuthenticatedUser({
      username: 'integrationparticipant',
      temple_id: testData.temples.temple1.id
    });
    participantUser = participant;

    const templeAdmin = await createTempleAdminUser(
      testData.temples.temple1.id,
      { username: 'integrationtempleadmin' }
    );
    templeAdminUser = templeAdmin;

    const admin = await createAdminUser({
      username: 'integrationadmin',
      temple_id: testData.temples.temple1.id
    });
    adminUser = admin;

    // Generate tokens
    participantToken = generateTestToken({
      id: participant.user.id,
      role: participant.profile.role_id,
      temple_id: participant.profile.temple_id
    });

    templeAdminToken = generateTestToken({
      id: templeAdmin.user.id,
      role: templeAdmin.profile.role_id,
      temple_id: templeAdmin.profile.temple_id
    });

    adminToken = generateTestToken({
      id: admin.user.id,
      role: admin.profile.role_id,
      temple_id: admin.profile.temple_id
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('Complete User Registration and Event Participation Flow', () => {
    it('should complete full user journey from registration to event participation', async () => {
      // Step 1: Register a new user
      const newUserData = {
        username: 'newintegrationuser',
        password: 'password123',
        email: 'newintegration@example.com',
        first_name: 'New',
        last_name: 'Integration',
        phone: '9876543210',
        aadhar_number: '999988887777',
        dob: '1995-05-15',
        gender: 'FEMALE',
        temple_name: 'TEMPLE1'
      };

      const registrationResponse = await request(app)
        .post('/api/users/register')
        .send(newUserData)
        .expect(201);

      expect(registrationResponse.body).toHaveProperty('user');
      expect(registrationResponse.body).toHaveProperty('token');
      const newUserToken = registrationResponse.body.token;

      // Step 2: Get user profile
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('first_name', 'New');
      expect(profileResponse.body).toHaveProperty('last_name', 'Integration');

      // Step 3: Get available events
      const eventsResponse = await request(app)
        .get('/api/users/available-events')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveProperty('user');
      expect(eventsResponse.body).toHaveProperty('events');
      expect(Array.isArray(eventsResponse.body.events)).toBe(true);

      // Step 4: Register for an event
      const eventRegistrationData = {
        user_id: registrationResponse.body.user.id,
        event_id: testData.events.individualEvent.id
      };

      const eventRegistrationResponse = await request(app)
        .post('/api/events/register-participant')
        .set('Authorization', `Bearer ${newUserToken}`)
        .send(eventRegistrationData)
        .expect(201);

      expect(eventRegistrationResponse.body).toHaveProperty('id');
      expect(eventRegistrationResponse.body).toHaveProperty('status', 'PENDING');

      // Step 5: Temple admin approves registration
      const approvalResponse = await request(app)
        .post('/api/events/update-registration-status')
        .set('Authorization', `Bearer ${templeAdminToken}`)
        .send({
          registration_id: eventRegistrationResponse.body.id,
          status: 'ACCEPTED'
        })
        .expect(200);

      expect(approvalResponse.body).toHaveProperty('status', 'ACCEPTED');

      // Step 6: Admin views all participants
      const participantsResponse = await request(app)
        .get('/api/admin/participants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(participantsResponse.body)).toBe(true);
      const newUserRegistration = participantsResponse.body.find(
        p => p.user.id === registrationResponse.body.user.id
      );
      expect(newUserRegistration).toBeDefined();
      expect(newUserRegistration.status).toBe('ACCEPTED');

      // Step 7: Admin updates participant result
      const resultUpdateResponse = await request(app)
        .put(`/api/events/update-individual-result/${eventRegistrationResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rank: 'FIRST' })
        .expect(200);

      expect(resultUpdateResponse.body).toHaveProperty('event_result');

      // Step 8: Verify final state
      const finalProfileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${newUserToken}`)
        .expect(200);

      expect(finalProfileResponse.body).toHaveProperty('first_name', 'New');
      expect(finalProfileResponse.body).toHaveProperty('last_name', 'Integration');
    });
  });

  describe('Team Event Registration Flow', () => {
    let teamMembers = [];

    beforeEach(async () => {
      // Create team members
      for (let i = 1; i <= 4; i++) {
        const member = await createAuthenticatedUser({
          username: `teammember${i}`,
          temple_id: testData.temples.temple1.id
        });
        teamMembers.push(member);
      }
    });

    it('should complete team event registration flow', async () => {
      // Step 1: Temple admin registers team
      const teamData = {
        temple_id: testData.temples.temple1.id,
        event_id: testData.events.teamEvent.id,
        member_user_ids: teamMembers.map(member => member.profile.id)
      };

      const teamRegistrationResponse = await request(app)
        .post('/api/events/register-team')
        .set('Authorization', `Bearer ${templeAdminToken}`)
        .send(teamData)
        .expect(201);

      expect(teamRegistrationResponse.body).toHaveProperty('id');
      expect(teamRegistrationResponse.body).toHaveProperty('status', 'PENDING');

      // Step 2: Admin views all teams
      const teamsResponse = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(teamsResponse.body).toHaveProperty('teams');
      expect(Array.isArray(teamsResponse.body.teams)).toBe(true);

      // Step 3: Admin updates team result
      const teamResultResponse = await request(app)
        .put(`/api/events/update-team-result/${teamRegistrationResponse.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ rank: 'SECOND' })
        .expect(200);

      expect(teamResultResponse.body).toHaveProperty('event_result');
    });
  });

  describe('Admin Dashboard and Reporting Flow', () => {
    it('should complete admin dashboard and reporting flow', async () => {
      // Step 1: Get dashboard statistics
      const statsResponse = await request(app)
        .get('/api/admin/dashboard-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('totalEvents');
      expect(statsResponse.body).toHaveProperty('totalUsers');
      expect(statsResponse.body).toHaveProperty('totalTemples');
      expect(statsResponse.body).toHaveProperty('activeRegistrations');

      // Step 2: Get temple management data
      const templeManagementResponse = await request(app)
        .get('/api/admin/temple-management')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(templeManagementResponse.body).toHaveProperty('temples');
      expect(Array.isArray(templeManagementResponse.body.temples)).toBe(true);

      // Step 3: Get all events
      const eventsResponse = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(eventsResponse.body).toHaveProperty('events');
      expect(Array.isArray(eventsResponse.body.events)).toBe(true);

      // Step 4: Get all users with pagination
      const usersResponse = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(usersResponse.body).toHaveProperty('users');
      expect(usersResponse.body).toHaveProperty('pagination');
      expect(Array.isArray(usersResponse.body.users)).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle authentication errors properly', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(noTokenResponse.body).toHaveProperty('error', 'No token provided');

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(invalidTokenResponse.body).toHaveProperty('error', 'Invalid token');
    });

    it('should handle authorization errors properly', async () => {
      // Test participant trying to access admin endpoint
      const unauthorizedResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(403);

      expect(unauthorizedResponse.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should handle validation errors properly', async () => {
      // Test invalid registration data
      const invalidRegistrationResponse = await request(app)
        .post('/api/users/register')
        .send({
          username: 'test',
          // Missing required fields
        })
        .expect(400);

      expect(invalidRegistrationResponse.body).toHaveProperty('errors');
    });
  });
});
