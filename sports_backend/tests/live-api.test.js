// Test your live running API
const request = require('supertest');

// Test against your actual running API
const API_BASE_URL = 'http://localhost:4000';

describe('Live API Tests', () => {
  // Test basic server health
  it('should respond to root endpoint', async () => {
    const response = await request(API_BASE_URL)
      .get('/')
      .expect(200);

    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toContain('Sports Event Backend');
  });

  // Test API documentation endpoint
  it('should serve API documentation', async () => {
    const response = await request(API_BASE_URL)
      .get('/api-docs')
      .expect(200);

    // Should return HTML for Swagger UI
    expect(response.text).toContain('html');
  });

  // Test user registration endpoint
  it('should handle user registration validation', async () => {
    const invalidUserData = {
      // Missing required fields
      username: 'testuser'
    };

    const response = await request(API_BASE_URL)
      .post('/api/users/register')
      .send(invalidUserData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  // Test user registration with valid data
  it('should register a new user with valid data', async () => {
    const validUserData = {
      username: 'testuser' + Date.now(), // Unique username
      password: 'password123',
      email: 'test' + Date.now() + '@example.com',
      first_name: 'Test',
      last_name: 'User',
      phone: '1234567890',
      aadhar_number: '123456789012',
      dob: '1995-05-15',
      gender: 'MALE',
      temple_name: 'TEMPLE1'
    };

    const response = await request(API_BASE_URL)
      .post('/api/users/register')
      .send(validUserData)
      .expect(201);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.username).toBe(validUserData.username);
  });

  // Test user login
  it('should login with valid credentials', async () => {
    // First register a user
    const userData = {
      username: 'logintest' + Date.now(),
      password: 'password123',
      email: 'logintest' + Date.now() + '@example.com',
      first_name: 'Login',
      last_name: 'Test',
      phone: '1234567890',
      aadhar_number: '987654321098',
      dob: '1990-01-01',
      gender: 'FEMALE',
      temple_name: 'TEMPLE1'
    };

    // Register user
    await request(API_BASE_URL)
      .post('/api/users/register')
      .send(userData)
      .expect(201);

    // Now test login
    const loginData = {
      username: userData.username,
      password: userData.password
    };

    const response = await request(API_BASE_URL)
      .post('/api/users/login')
      .send(loginData)
      .expect(200);

    expect(response.body).toHaveProperty('user');
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.username).toBe(userData.username);
  });

  // Test Aadhaar validation
  it('should check Aadhaar number existence', async () => {
    const response = await request(API_BASE_URL)
      .post('/api/users/check-aadhaar')
      .send({ aadhaar: '999999999999' })
      .expect(200);

    expect(response.body).toHaveProperty('exists');
    expect(typeof response.body.exists).toBe('boolean');
  });

  // Test email validation
  it('should check email existence', async () => {
    const response = await request(API_BASE_URL)
      .post('/api/users/check-email')
      .send({ email: 'nonexistent@example.com' })
      .expect(200);

    expect(response.body).toHaveProperty('exists');
    expect(typeof response.body.exists).toBe('boolean');
  });

  // Test protected endpoint without token
  it('should require authentication for protected endpoints', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/users/profile')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'No token provided');
  });

  // Test with invalid token
  it('should reject invalid tokens', async () => {
    const response = await request(API_BASE_URL)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Invalid token');
  });
});
