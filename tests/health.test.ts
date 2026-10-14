import request from 'supertest';
import app from '../src/app'; // Make sure app is exported from src/app.ts

describe('Health Check', () => {
  it('should return 200 OK from the health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Server is healthy');
  });
});
