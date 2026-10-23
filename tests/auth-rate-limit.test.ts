import express, { Request, Response } from 'express';
import request from 'supertest';
import { authLimiter, loginFailedAttemptsLimiter } from '../src/middlewares/rateLimiter';

describe('Auth & Failed Login Rate Limiters', () => {
  describe('Per-Email Failed Login Limiter (10 failed attempts / 15 min)', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      // Mock login endpoint protected by loginFailedAttemptsLimiter
      app.post('/api/v1/auth/login', loginFailedAttemptsLimiter, (req: Request, res: Response) => {
        const { password } = req.body;
        if (password === 'correctPassword123!') {
          return res.status(200).json({ success: true, message: 'Login successful' });
        }
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      });
    });

    it('blocks an email after 10 failed login attempts within 15 minutes', async () => {
      const targetEmail = 'brute-target@university.edu';

      // 10 failed attempts should be returned with 401
      for (let i = 0; i < 10; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: targetEmail, password: 'wrongPassword' });
        expect(res.status).toBe(401);
      }

      // The 11th failed attempt should trigger 429 Too Many Requests
      const throttledRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ email: targetEmail, password: 'wrongPassword' });

      expect(throttledRes.status).toBe(429);
      expect(throttledRes.body.message).toContain('Too many failed login attempts');

      // A different email address should NOT be throttled (per-email scoping)
      const otherEmailRes = await request(app)
        .post('/api/v1/auth/login')
        .set('x-test-rate-limit', 'true')
        .send({ email: 'different-user@university.edu', password: 'wrongPassword' });
      expect(otherEmailRes.status).toBe(401);
    });

    it('does not count successful logins toward the 10 failed login attempts limit', async () => {
      const legitEmail = 'valid-student@university.edu';

      // 12 successful logins should all succeed with 200 without getting throttled
      for (let i = 0; i < 12; i++) {
        const res = await request(app)
          .post('/api/v1/auth/login')
          .set('x-test-rate-limit', 'true')
          .send({ email: legitEmail, password: 'correctPassword123!' });
        expect(res.status).toBe(200);
      }
    });
  });

  describe('Per-IP Auth Limiter (300 requests / 15 min)', () => {
    let app: express.Express;

    beforeEach(() => {
      app = express();
      app.use(express.json());

      app.post('/api/v1/auth/test-auth-limit', authLimiter, (_req: Request, res: Response) => {
        return res.status(200).json({ success: true, message: 'Auth endpoint reached' });
      });
    });

    it('allows up to 300 requests and blocks the 301st request from the same IP', async () => {
      // Send 300 requests (fast in-memory loop)
      for (let i = 0; i < 300; i++) {
        const res = await request(app)
          .post('/api/v1/auth/test-auth-limit')
          .set('x-test-rate-limit', 'true');
        expect(res.status).toBe(200);
      }

      // The 301st request must be rate limited with 429
      const blockedRes = await request(app)
        .post('/api/v1/auth/test-auth-limit')
        .set('x-test-rate-limit', 'true');

      expect(blockedRes.status).toBe(429);
      expect(blockedRes.body.message).toContain('Too many authentication attempts from this IP');
    });
  });
});
