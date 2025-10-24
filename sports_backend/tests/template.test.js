// Template for creating new API tests
const request = require('supertest');

// Your API base URL
const API_BASE_URL = 'http://localhost:4000';

describe('Your New Test Suite', () => {
  // Test basic endpoint
  it('should test a basic endpoint', async () => {
    const response = await request(API_BASE_URL)
      .get('/your-endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('expectedProperty');
  });

  // Test POST endpoint with data
  it('should test POST endpoint with data', async () => {
    const testData = {
      field1: 'value1',
      field2: 'value2'
    };

    const response = await request(API_BASE_URL)
      .post('/your-endpoint')
      .send(testData)
      .expect(201);

    expect(response.body).toHaveProperty('success', true);
  });

  // Test authentication required endpoint
  it('should require authentication', async () => {
    const response = await request(API_BASE_URL)
      .get('/protected-endpoint')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'No token provided');
  });

  // Test with valid token
  it('should work with valid token', async () => {
    // First get a token (you'll need to implement this)
    const token = 'your-jwt-token-here';

    const response = await request(API_BASE_URL)
      .get('/protected-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });

  // Test validation errors
  it('should return validation errors for invalid data', async () => {
    const invalidData = {
      // Missing required fields
    };

    const response = await request(API_BASE_URL)
      .post('/your-endpoint')
      .send(invalidData)
      .expect(400);

    expect(response.body).toHaveProperty('errors');
    expect(Array.isArray(response.body.errors)).toBe(true);
  });
});
