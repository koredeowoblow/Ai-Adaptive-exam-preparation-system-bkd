import rateLimit, { ipKeyGenerator, Store, Options, IncrementResponse } from 'express-rate-limit';
import { redisClient, isMockRedis } from '../config/redis';
import { logger } from '../utils/logger';
import { Request } from 'express';

export class RedisRateLimitStore implements Store {
  prefix: string;
  windowMs: number = 15 * 60 * 1000;

  constructor(prefix: string = 'rl') {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<IncrementResponse> {
    const fullKey = `${this.prefix}:${key}`;
    const ttlSeconds = Math.max(1, Math.ceil(this.windowMs / 1000));
    try {
      const hits = await redisClient.incr(fullKey);
      if (hits === 1) {
        await redisClient.expire(fullKey, ttlSeconds);
      }
      let ttl = await redisClient.ttl(fullKey);
      if (ttl < 0) {
        await redisClient.expire(fullKey, ttlSeconds);
        ttl = ttlSeconds;
      }
      return {
        totalHits: hits,
        resetTime: new Date(Date.now() + ttl * 1000),
      };
    } catch (err) {
      logger.warn(`[RedisRateLimitStore] Error on key ${fullKey}:`, err);
      return {
        totalHits: 1,
        resetTime: new Date(Date.now() + this.windowMs),
      };
    }
  }

  async decrement(key: string): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
    try {
      await redisClient.decr(fullKey);
    } catch (err) {
      logger.warn(`[RedisRateLimitStore] Decrement error on key ${fullKey}:`, err);
    }
  }

  async resetKey(key: string): Promise<void> {
    const fullKey = `${this.prefix}:${key}`;
    try {
      await redisClient.del(fullKey);
    } catch (err) {
      logger.warn(`[RedisRateLimitStore] Reset error on key ${fullKey}:`, err);
    }
  }
}

/**
 * Strict IP-based limiter for authentication endpoints (login, register, forgot-password, reset-password).
 * Restricts brute-force attempts from a single IP to 300 requests per 15 minutes.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  keyGenerator: (req: Request) => ipKeyGenerator(req.ip || '127.0.0.1'),
  store: !isMockRedis ? new RedisRateLimitStore('rl:auth') : undefined,
  skip: (req: Request) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
});

/**
 * Per-email limiter for failed login attempts.
 * Restricts to 10 failed login attempts per 15 minutes per email address.
 * Successful logins (status < 400) do not consume the quota.
 */
export const loginFailedAttemptsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many failed login attempts for this email, please try again after 15 minutes.' },
  keyGenerator: (req: Request) => {
    const email = (req.body?.email || '').trim().toLowerCase();
    return email ? `failed_login:${email}` : `failed_login:${ipKeyGenerator(req.ip || '127.0.0.1')}`;
  },
  store: !isMockRedis ? new RedisRateLimitStore('rl:failed-login') : undefined,
  skip: (req: Request) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
});

/**
 * Generous limiter for authenticated endpoints placed immediately after authentication.
 * Keys by user ID (falling back to IP), allowing ~2000 requests per 15 minutes per student.
 * Uses Redis store when Redis is available so limits are unified across all application instances.
 */
export const authenticatedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 2000,
  message: { success: false, message: 'Request limit exceeded for this account. Please wait a few moments before trying again.' },
  keyGenerator: (req: Request) => {
    if ((req as any).user?.id || (req as any).user?._id) {
      return `user:${(req as any).user.id || (req as any).user._id}`;
    }
    return ipKeyGenerator(req.ip || '127.0.0.1');
  },
  store: !isMockRedis ? new RedisRateLimitStore('rl:auth-user') : undefined,
  skip: (req: Request) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
});

/**
 * Per-user rate limiter for Socratic tutor requests (/api/v1/ai/tutor-question).
 * Allows up to 20 questions per 1 minute per student.
 */
export const socraticTutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Tutor is busy, try again in a moment. You have sent too many requests.',
  },
  keyGenerator: (req: Request) => {
    if ((req as any).user?.id || (req as any).user?._id) {
      return `tutor:${(req as any).user.id || (req as any).user._id}`;
    }
    return `tutor:${ipKeyGenerator(req.ip || '127.0.0.1')}`;
  },
  store: !isMockRedis ? new RedisRateLimitStore('rl:tutor') : undefined,
  skip: (req: Request) => process.env.NODE_ENV === 'test' && req.headers['x-test-rate-limit'] !== 'true',
});
