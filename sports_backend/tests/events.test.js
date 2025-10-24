import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import eventRoutes from '../src/routes/eventRoutes.js';
import { setupTestData, cleanupTestData, createAuthenticatedUser, createTempleAdminUser, generateTestToken } from './testUtils.js';
import { prisma } from './testDatabase.js';

dotenv.config();

// Create test app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/events', eventRoutes);

describe('Event Management API Tests', () => {
  let testData;
  let participantUser;
  let templeAdminUser;
  let participantToken;
  let templeAdminToken;

  beforeAll(async () => {
    testData = await setupTestData();
    
    // Create test users
    const participant = await createAuthenticatedUser({
      username: 'participant',
      temple_id: testData.temples.temple1.id
    });
    participantUser = participant;

    const templeAdmin = await createTempleAdminUser(
      testData.temples.temple1.id,
      { username: 'templeadmin' }
    );
    templeAdminUser = templeAdmin;

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
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/events/register-participant', () => {
    it('should register participant for event successfully', async () => {
      const registrationData = {
        user_id: participantUser.user.id,
        event_id: testData.events.individualEvent.id
      };

      const response = await request(app)
        .post('/api/events/register-participant')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(registrationData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should fail with invalid event ID', async () => {
      const registrationData = {
        user_id: participantUser.user.id,
        event_id: 99999
      };

      const response = await request(app)
        .post('/api/events/register-participant')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(registrationData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const registrationData = {
        user_id: participantUser.user.id,
        event_id: testData.events.individualEvent.id
      };

      const response = await request(app)
        .post('/api/events/register-participant')
        .send(registrationData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should fail with invalid user ID', async () => {
      const registrationData = {
        user_id: 'invalid',
        event_id: testData.events.individualEvent.id
      };

      const response = await request(app)
        .post('/api/events/register-participant')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(registrationData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/events/unregister-participant/:eventId', () => {
    let registrationId;

    beforeEach(async () => {
      // Create a registration to unregister
      const registration = await prisma.ind_event_registration.create({
        data: {
          year: new Date().getFullYear(),
          event_id: testData.events.individualEvent.id,
          user_id: participantUser.profile.id,
          status: 'PENDING'
        }
      });
      registrationId = registration.id;
    });

    it('should unregister participant successfully', async () => {
      const response = await request(app)
        .delete(`/api/events/unregister-participant/${testData.events.individualEvent.id}`)
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should fail with invalid event ID', async () => {
      const response = await request(app)
        .delete('/api/events/unregister-participant/99999')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/events/unregister-participant/${testData.events.individualEvent.id}`)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('POST /api/events/register-team', () => {
    let teamMembers;

    beforeEach(async () => {
      // Create team members
      const member1 = await createAuthenticatedUser({
        username: 'member1',
        temple_id: testData.temples.temple1.id
      });
      const member2 = await createAuthenticatedUser({
        username: 'member2',
        temple_id: testData.temples.temple1.id
      });
      const member3 = await createAuthenticatedUser({
        username: 'member3',
        temple_id: testData.temples.temple1.id
      });
      const member4 = await createAuthenticatedUser({
        username: 'member4',
        temple_id: testData.temples.temple1.id
      });

      teamMembers = [member1, member2, member3, member4];
    });

    it('should register team successfully', async () => {
      const teamData = {
        temple_id: testData.temples.temple1.id,
        event_id: testData.events.teamEvent.id,
        member_user_ids: teamMembers.map(member => member.profile.id)
      };

      const response = await request(app)
        .post('/api/events/register-team')
        .set('Authorization', `Bearer ${templeAdminToken}`)
        .send(teamData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'PENDING');
    });

    it('should fail without temple admin role', async () => {
      const teamData = {
        temple_id: testData.temples.temple1.id,
        event_id: testData.events.teamEvent.id,
        member_user_ids: teamMembers.map(member => member.profile.id)
      };

      const response = await request(app)
        .post('/api/events/register-team')
        .set('Authorization', `Bearer ${participantToken}`)
        .send(teamData)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should fail with invalid event ID', async () => {
      const teamData = {
        temple_id: testData.temples.temple1.id,
        event_id: 99999,
        member_user_ids: teamMembers.map(member => member.profile.id)
      };

      const response = await request(app)
        .post('/api/events/register-team')
        .set('Authorization', `Bearer ${templeAdminToken}`)
        .send(teamData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/events/participant-data', () => {
    it('should return participant data successfully', async () => {
      const response = await request(app)
        .get('/api/events/participant-data')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ageCategories');
      expect(response.body).toHaveProperty('genderOptions');
      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.ageCategories)).toBe(true);
      expect(Array.isArray(response.body.genderOptions)).toBe(true);
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should filter by age category', async () => {
      const response = await request(app)
        .get('/api/events/participant-data?ageCategory=18-25')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should filter by gender', async () => {
      const response = await request(app)
        .get('/api/events/participant-data?gender=MALE')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/events/participant-data')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('GET /api/events/team-events', () => {
    it('should return team events successfully', async () => {
      const response = await request(app)
        .get('/api/events/team-events')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/events/team-events')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('GET /api/events/all-events', () => {
    it('should return all events successfully', async () => {
      const response = await request(app)
        .get('/api/events/all-events')
        .set('Authorization', `Bearer ${participantToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('individual');
      expect(response.body).toHaveProperty('team');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.individual)).toBe(true);
      expect(Array.isArray(response.body.team)).toBe(true);
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/events/all-events')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });
});
