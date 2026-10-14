import { redisClient } from '../config/redis';
import { logger } from './logger';

export { redisClient };

const inFlight = new Map<string, Promise<any>>();

export class CacheService {
  /**
   * Promise wrapper with a short timeout.
   */
  private async withTimeout<T>(promise: Promise<T>, ms: number = 500): Promise<T> {
    let timeoutId: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`Redis operation timed out after ${ms}ms`)), ms);
    });
    return Promise.race([
      promise.finally(() => clearTimeout(timeoutId)),
      timeoutPromise
    ]);
  }

  /**
   * Fetches data from Redis, or executes the fetchFn if it misses.
   * Uses a Single-Flight pattern to ensure only 1 request hits the DB if 500 miss concurrently.
   */
  async getOrSetSingleFlight<T>(key: string, ttlSeconds: number, fetchFn: () => Promise<T>): Promise<T> {
    try {
      // 500ms timeout so a hanging connection doesn't stall the request
      const cached = await this.withTimeout(redisClient.get(key), 500);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch (err) {
      logger.warn(`Redis get error for key ${key}:`, err);
      // Fallback to fetchFn without crashing
    }

    // Single-flight check
    if (inFlight.has(key)) {
      return inFlight.get(key) as Promise<T>;
    }

    const promise = (async () => {
      try {
        const data = await fetchFn();

        // Fire and forget cache set, with a short timeout so the event loop isn't cluttered
        this.withTimeout(redisClient.setex(key, ttlSeconds, JSON.stringify(data)), 500).catch(err => {
          logger.warn(`Redis set error for key ${key}:`, err);
        });

        return data;
      } finally {
        inFlight.delete(key);
      }
    })();

    inFlight.set(key, promise);
    return promise;
  }
  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.warn(`Redis delete error for key ${key}:`, err);
    }
  }

  /**
   * Deletes all keys matching a pattern using SCAN (never KEYS) to avoid blocking Redis.
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let cursor = '0';
      do {
        const result = await this.withTimeout(redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100), 1000);
        cursor = result[0];
        const keys = result[1];
        if (keys && keys.length > 0) {
          await this.withTimeout(redisClient.del(...keys), 1000);
        }
      } while (cursor !== '0');
    } catch (err) {
      logger.warn(`Redis deleteByPattern error for pattern ${pattern}:`, err);
    }
  }
}

export const cacheService = new CacheService();
