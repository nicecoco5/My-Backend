/**
 * Redis Service
 * Manages Redis connection and provides caching utilities
 */

import Redis from 'ioredis';
import logger from '../utils/logger';

// Redis connection instance
let redis: Redis | null = null;

// Default cache TTL (5 minutes)
const DEFAULT_TTL = 300;

/**
 * Initialize Redis connection
 */
export const initRedis = (): Redis => {
    if (redis) return redis;

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableReadyCheck: true,
        // Retry strategy: wait 50ms, 100ms, 150ms... up to 3s
        retryStrategy: (times) => {
            const delay = Math.min(times * 50, 3000);
            return delay;
        }
    });

    redis.on('connect', () => {
        logger.info('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
        // Prevent flooding logs with connection refused if Redis is down
        if (err.message.includes('ECONNREFUSED')) {
            logger.warn('❌ Redis connection refused (Is Redis running?)');
        } else {
            logger.error(`❌ Redis connection error: ${err.message}`);
        }
    });

    redis.on('close', () => {
        logger.warn('🔌 Redis connection closed');
    });

    return redis;
};

/**
 * Get Redis client instance
 */
export const getRedisClient = (): Redis | null => {
    return redis;
};

/**
 * Check if Redis is connected
 */
export const isRedisConnected = (): boolean => {
    return redis?.status === 'ready';
};

/**
 * Get value from cache
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
    if (!redis || !isRedisConnected()) return null;

    try {
        const data = await redis.get(key);
        if (!data) return null;
        return JSON.parse(data) as T;
    } catch (error) {
        logger.error(`❌ Cache get error for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
};

/**
 * Set value in cache with TTL
 */
export const cacheSet = async <T>(key: string, value: T, ttl: number = DEFAULT_TTL): Promise<boolean> => {
    if (!redis || !isRedisConnected()) return false;

    try {
        await redis.setex(key, ttl, JSON.stringify(value));
        return true;
    } catch (error) {
        logger.error(`❌ Cache set error for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
};

/**
 * Delete value from cache
 */
export const cacheDel = async (key: string): Promise<boolean> => {
    if (!redis || !isRedisConnected()) return false;

    try {
        await redis.del(key);
        return true;
    } catch (error) {
        logger.error(`❌ Cache delete error for key ${key}: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
};

/**
 * Delete multiple keys by pattern
 */
export const cacheDelPattern = async (pattern: string): Promise<boolean> => {
    if (!redis || !isRedisConnected()) return false;

    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            logger.info(`🧹 Cleared ${keys.length} keys matching pattern: ${pattern}`);
        }
        return true;
    } catch (error) {
        logger.error(`❌ Cache delete pattern error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
    }
};

/**
 * Cache keys for different entities
 */
export const cacheKeys = {
    postsList: (page: number, limit: number, keyword?: string) =>
        `posts:list:${page}:${limit}${keyword ? `:${keyword}` : ''}`,
    postDetail: (postId: string) =>
        `posts:detail:${postId}`,
    postsPattern: () =>
        'posts:*'
};

/**
 * Close Redis connection
 */
export const closeRedis = async (): Promise<void> => {
    if (redis) {
        await redis.quit();
        redis = null;
    }
};
