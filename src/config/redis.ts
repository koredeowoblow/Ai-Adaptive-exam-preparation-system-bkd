import { Redis } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

export const isMockRedis = env.REDIS_HOST === 'mock' || env.REDIS_HOST === 'none';

export const redisClient: Redis = isMockRedis
  ? (new (require('ioredis-mock'))() as unknown as Redis)
  : env.REDIS_URL
  ? new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    })
  : new Redis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
      password: env.REDIS_PASSWORD,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    });

if (!isMockRedis) {
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis connection error:', err));
} else {
  logger.info('Using in-memory Redis mock');
}
