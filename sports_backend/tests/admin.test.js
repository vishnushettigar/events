import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import adminRoutes from '../src/routes/adminRoutes.js';
import { setupTestData, cleanupTestData, createAdminUser, createAuthenticatedUser, generateTestToken } from './testUtils.js';
import { prisma } from './testDatabase.js';

dotenv.config();

// Create test app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/admin', adminRoutes);

describe('Admin API Tests', () => {
  let testData;
  let adminUser;
  let regularUser;
  let adminToken;
  let regularToken;

  beforeAll(async () => {
    testData = await setupTestData();
    
    // Create admin user
    const admin = await createAdminUser({
      username: 'admin',
      temple_id: testData.temples.temple1.id
    });
    adminUser = admin;

    // Create regular user
    const regular = await createAuthenticatedUser({
      username: 'regularuser',
      temple_id: testData.temples.temple1.id
    });
    regularUser = regular;

    // Generate tokens
    adminToken = generateTestToken({
      id: admin.user.id,
      role: admin.profile.role_id,
      temple_id: admin.profile.temple_id
    });

    regularToken = generateTestToken({
      id: regular.user.id,
      role: regular.profile.role_id,
      temple_id: regular.profile.temple_id
    });
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('GET /api/admin/verify-access', () => {
    it('should verify admin access successfully', async () => {
      const response = await request(app)
        .get('/api/admin/verify-access')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Admin access verified');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.id).toBe(adminUser.user.id);
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/verify-access')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/admin/verify-access')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });
  });

  describe('GET /api/admin/dashboard-stats', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard-stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalEvents');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalTemples');
      expect(response.body).toHaveProperty('activeRegistrations');
      expect(typeof response.body.totalEvents).toBe('number');
      expect(typeof response.body.totalUsers).toBe('number');
      expect(typeof response.body.totalTemples).toBe('number');
      expect(typeof response.body.activeRegistrations).toBe('number');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard-stats')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/users', () => {
    it('should return users list with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.users)).toBe(true);
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('users');
      expect(Array.isArray(response.body.users)).toBe(true);
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('should return specific user details', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${adminUser.user.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', adminUser.user.id);
      expect(response.body).toHaveProperty('username');
      expect(response.body).toHaveProperty('profile');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${adminUser.user.id}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('PUT /api/admin/users/:id/update-role', () => {
    it('should update user role successfully', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.user.id}/update-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_id: 2 }) // TEMPLE_ADMIN role
        .expect(200);

      expect(response.body).toHaveProperty('message', 'User role updated successfully');
      expect(response.body).toHaveProperty('profile');
    });

    it('should fail with invalid role ID', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.user.id}/update-role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_id: 999 })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid role ID');
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .put('/api/admin/users/99999/update-role')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role_id: 2 })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'User not found');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${regularUser.user.id}/update-role`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ role_id: 2 })
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/roles', () => {
    it('should return all roles', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/roles')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/temples', () => {
    it('should return all temples', async () => {
      const response = await request(app)
        .get('/api/admin/temples')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('code');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/temples')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/events', () => {
    it('should return all events', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body.events.length).toBeGreaterThan(0);
      expect(response.body.events[0]).toHaveProperty('id');
      expect(response.body.events[0]).toHaveProperty('name');
      expect(response.body.events[0]).toHaveProperty('event_type');
      expect(response.body.events[0]).toHaveProperty('age_category');
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/events')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/participants', () => {
    it('should return all participants', async () => {
      const response = await request(app)
        .get('/api/admin/participants')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support filtering by event IDs', async () => {
      const response = await request(app)
        .get(`/api/admin/participants?event_ids=${testData.events.individualEvent.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/admin/participants?status=PENDING')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/participants')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  describe('GET /api/admin/teams', () => {
    it('should return teams with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('teams');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.teams)).toBe(true);
    });

    it('should support pagination parameters', async () => {
      const response = await request(app)
        .get('/api/admin/teams?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.pagination.current_page).toBe(1);
      expect(response.body.pagination.limit).toBe(5);
    });

    it('should fail without admin role', async () => {
      const response = await request(app)
        .get('/api/admin/teams')
        .set('Authorization', `Bearer ${regularToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('error', 'Unauthorized');
    });
  });
});
