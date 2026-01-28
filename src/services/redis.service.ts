/**
 * Redis Service
 * Manages Redis connection and provides caching utilities
 */

import Redis from 'ioredis';

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
        enableReadyCheck: true
    });

    redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
    });

    redis.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
    });

    redis.on('close', () => {
        console.log('🔌 Redis connection closed');
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
        console.error('❌ Cache get error:', error);
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
        console.error('❌ Cache set error:', error);
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
        console.error('❌ Cache delete error:', error);
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
        }
        return true;
    } catch (error) {
        console.error('❌ Cache delete pattern error:', error);
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
