import { createClient, RedisClientType } from 'redis';
import logger from '../utils/logger';

let redisClient: RedisClientType | null = null;

export const connectRedis = async (): Promise<RedisClientType | null> => {
  // Allow opt-in Redis via REDIS_ENABLED or attempt only for non-local URLs.
  const redisEnabled = String(process.env.REDIS_ENABLED).toLowerCase() === 'true';
  const redisUrl = process.env.REDIS_URL || '';
  if (!redisEnabled && (!redisUrl || redisUrl.includes('localhost'))) {
    logger.info('Redis disabled (REDIS_ENABLED not true and using default/local URL). Skipping connection.');
    return null;
  }

  try {
    const client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || undefined,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn('Redis: Max retries reached, disabling Redis');
            return false;
          }
          return Math.min(retries * 100, 3000);
        },
      },
    }) as RedisClientType;

    client.on('error', (err) => logger.warn('Redis Client Error (non-fatal):', err.message));
    client.on('connect', () => logger.info('Redis connected'));
    client.on('disconnect', () => logger.warn('Redis disconnected'));

    await client.connect();
    redisClient = client;
    return client;
  } catch (error) {
    logger.warn('Redis connection failed - running without cache:', (error as Error).message);
    return null;
  }
};

export const getRedisClient = (): RedisClientType | null => redisClient;

export const cacheSet = async (key: string, value: unknown, ttl = 3600): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.warn('Cache set error:', error);
  }
};

export const cacheGet = async <T>(key: string): Promise<T | null> => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.warn('Cache get error:', error);
    return null;
  }
};

export const cacheDel = async (key: string): Promise<void> => {
  if (!redisClient) return;
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.warn('Cache delete error:', error);
  }
};

export const cacheDelPattern = async (pattern: string): Promise<void> => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    logger.warn('Cache delete pattern error:', error);
  }
};
