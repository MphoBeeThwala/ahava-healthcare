import request from 'supertest';
import express from 'express';

describe('Health Check Endpoint', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        timezone: process.env.TIMEZONE || 'Africa/Johannesburg'
      });
    });
  });

  it('should return 200 status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
  });

  it('should return ok status', async () => {
    const response = await request(app).get('/health');
    expect(response.body.status).toBe('ok');
  });

  it('should return timestamp', async () => {
    const response = await request(app).get('/health');
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should return timezone', async () => {
    const response = await request(app).get('/health');
    expect(response.body.timezone).toBe('Africa/Johannesburg');
  });
});


