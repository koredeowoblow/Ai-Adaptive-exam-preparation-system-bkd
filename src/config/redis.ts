import { Redis } from 'ioredis';
import { env } from './env';
import { logger } from '../utils/logger';

const isMock = env.REDIS_HOST === 'mock' || env.REDIS_HOST === 'none';

export const redisClient: Redis = isMock
  ? (new (require('ioredis-mock'))() as unknown as Redis)
  : new Redis({
      host: env.REDIS_HOST,
      port: parseInt(env.REDIS_PORT, 10),
      password: env.REDIS_PASSWORD,
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => Math.min(times * 100, 3000),
    });

if (!isMock) {
  redisClient.on('connect', () => logger.info('Redis connected'));
  redisClient.on('error', (err) => logger.error('Redis connection error:', err));
} else {
  logger.info('Using in-memory Redis mock');
}
