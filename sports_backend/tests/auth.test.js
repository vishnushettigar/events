import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import userRoutes from '../src/routes/userRoutes.js';
import { setupTestData, cleanupTestData, createAuthenticatedUser, generateTestToken } from './testUtils.js';
import { prisma } from './testDatabase.js';

dotenv.config();

// Create test app
const app = express();
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/users', userRoutes);

describe('Authentication API Tests', () => {
  let testData;

  beforeAll(async () => {
    testData = await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  describe('POST /api/users/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com',
        first_name: 'New',
        last_name: 'User',
        phone: '9876543210',
        aadhar_number: '111122223333',
        dob: '1995-05-15',
        gender: 'FEMALE',
        temple_name: 'TEMPLE1'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('newuser');
    });

    it('should fail with invalid email format', async () => {
      const userData = {
        username: 'invaliduser',
        password: 'password123',
        email: 'invalid-email',
        first_name: 'Invalid',
        last_name: 'User',
        dob: '1995-05-15',
        gender: 'MALE',
        temple_name: 'TEMPLE1'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });

    it('should fail with duplicate username', async () => {
      // First registration
      await createAuthenticatedUser({ username: 'duplicateuser' });

      const userData = {
        username: 'duplicateuser',
        password: 'password123',
        email: 'duplicate@example.com',
        first_name: 'Duplicate',
        last_name: 'User',
        dob: '1995-05-15',
        gender: 'MALE',
        temple_name: 'TEMPLE1'
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(userData)
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users/login', () => {
    beforeEach(async () => {
      await createAuthenticatedUser({
        username: 'logintest',
        password: 'password123'
      });
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        username: 'logintest',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('logintest');
    });

    it('should fail with invalid credentials', async () => {
      const loginData = {
        username: 'logintest',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should fail with missing username', async () => {
      const loginData = {
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/users/login')
        .send(loginData)
        .expect(400);

      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/users/check-aadhaar', () => {
    beforeEach(async () => {
      await createAuthenticatedUser({
        aadhar_number: '123456789012'
      });
    });

    it('should return true for existing Aadhaar number', async () => {
      const response = await request(app)
        .post('/api/users/check-aadhaar')
        .send({ aadhaar: '123456789012' })
        .expect(200);

      expect(response.body.exists).toBe(true);
    });

    it('should return false for non-existing Aadhaar number', async () => {
      const response = await request(app)
        .post('/api/users/check-aadhaar')
        .send({ aadhaar: '999999999999' })
        .expect(200);

      expect(response.body.exists).toBe(false);
    });

    it('should fail with missing Aadhaar number', async () => {
      const response = await request(app)
        .post('/api/users/check-aadhaar')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Aadhaar number is required');
    });
  });

  describe('POST /api/users/check-email', () => {
    beforeEach(async () => {
      await createAuthenticatedUser({
        email: 'testemail@example.com'
      });
    });

    it('should return true for existing email', async () => {
      const response = await request(app)
        .post('/api/users/check-email')
        .send({ email: 'testemail@example.com' })
        .expect(200);

      expect(response.body.exists).toBe(true);
    });

    it('should return false for non-existing email', async () => {
      const response = await request(app)
        .post('/api/users/check-email')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      expect(response.body.exists).toBe(false);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/users/check-email')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Email is required');
    });
  });

  describe('GET /api/users/profile', () => {
    it('should return user profile with valid token', async () => {
      const { user, profile } = await createAuthenticatedUser();
      const token = generateTestToken({
        id: user.id,
        role: profile.role_id,
        temple_id: profile.temple_id
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('first_name', 'Test');
      expect(response.body).toHaveProperty('last_name', 'User');
      expect(response.body).toHaveProperty('temple');
      expect(response.body).toHaveProperty('role');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'No token provided');
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
