// Debug tests to understand API behavior
const request = require('supertest');

const API_BASE_URL = 'http://localhost:4000';

describe('Debug Tests - Understanding API Behavior', () => {
  // Debug API docs endpoint
  it('should debug API docs endpoint', async () => {
    const response = await request(API_BASE_URL)
      .get('/api-docs')
      .expect(301); // Accept the redirect

    console.log('API Docs Response Status:', response.status);
    console.log('API Docs Response Headers:', response.headers);
    console.log('API Docs Response Text:', response.text.substring(0, 200) + '...');
  });

  // Debug user registration with detailed error info
  it('should debug user registration errors', async () => {
    const userData = {
      username: 'debuguser' + Date.now(),
      password: 'password123',
      email: 'debug' + Date.now() + '@example.com',
      first_name: 'Debug',
      last_name: 'User',
      phone: '1234567890',
      aadhar_number: '123456789012',
      dob: '1995-05-15',
      gender: 'MALE',
      temple_name: 'TEMPLE1'
    };

    const response = await request(API_BASE_URL)
      .post('/api/users/register')
      .send(userData);

    console.log('Registration Response Status:', response.status);
    console.log('Registration Response Body:', JSON.stringify(response.body, null, 2));

    // Don't fail the test, just log the response
    expect(response.status).toBeDefined();
  });

  // Test what happens with minimal data
  it('should test minimal registration data', async () => {
    const minimalData = {
      username: 'minimal' + Date.now(),
      password: 'password123',
      email: 'minimal' + Date.now() + '@example.com',
      first_name: 'Minimal',
      dob: '1995-05-15',
      gender: 'MALE',
      temple_name: 'TEMPLE1'
    };

    const response = await request(API_BASE_URL)
      .post('/api/users/register')
      .send(minimalData);

    console.log('Minimal Data Response Status:', response.status);
    console.log('Minimal Data Response Body:', JSON.stringify(response.body, null, 2));

    expect(response.status).toBeDefined();
  });

  // Test available endpoints
  it('should test available endpoints', async () => {
    const endpoints = [
      '/',
      '/api-docs',
      '/api/users/check-aadhaar',
      '/api/users/check-email'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await request(API_BASE_URL).get(endpoint);
        console.log(`${endpoint}: ${response.status}`);
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }

    expect(true).toBe(true); // Always pass this test
  });
});
