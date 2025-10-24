// Simple API test using CommonJS
const request = require('supertest');
const express = require('express');

// Create a simple test app
const app = express();
app.use(express.json());

// Add a simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working', status: 'success' });
});

app.post('/test', (req, res) => {
  res.json({ 
    message: 'POST test endpoint working', 
    receivedData: req.body,
    status: 'success' 
  });
});

describe('Simple API Tests (CommonJS)', () => {
  it('should respond to GET /test', async () => {
    const response = await request(app)
      .get('/test')
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Test endpoint working');
    expect(response.body).toHaveProperty('status', 'success');
  });

  it('should respond to POST /test', async () => {
    const testData = { name: 'Test User', email: 'test@example.com' };
    
    const response = await request(app)
      .post('/test')
      .send(testData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'POST test endpoint working');
    expect(response.body).toHaveProperty('receivedData', testData);
    expect(response.body).toHaveProperty('status', 'success');
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await request(app)
      .get('/unknown')
      .expect(404);
  });
});
