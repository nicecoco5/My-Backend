import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis, RateLimiterMemory, IRateLimiterOptions } from 'rate-limiter-flexible';
import { getRedisClient, isRedisConnected } from '../services/redis.service';
import logger from '../utils/logger';

// Fallback memory limiters (used when Redis is down)
const memoryAuthLimiter = new RateLimiterMemory({
    points: 10,
    duration: 60 * 60, // 1 hour
});

const memoryApiLimiter = new RateLimiterMemory({
    points: 100,
    duration: 15 * 60, // 15 minutes
});

// Helper to get or create limitation based on Redis status
const consumeLimiter = async (
    req: Request,
    res: Response,
    next: NextFunction,
    points: number,
    duration: number, // in seconds
    keyPrefix: string,
    fallbackLimiter: RateLimiterMemory
) => {
    try {
        const ip = req.ip || '0.0.0.0'; // Fallback IP

        // Use Redis if connected
        if (isRedisConnected()) {
            const redisClient = getRedisClient();

            // Note: In a real/larger production app, you might want to instantiate these once 
            // instead of on every request, but rate-limiter-flexible handles this reasonably well.
            // For better performance, we should ideally reuse the RateLimiterRedis instance.
            // However, ensuring the redis client is the *current* active one complicates things slightly.
            // Let's optimize by creating singleton instances that use current client.

            // Actually, best practice is to handle the insuranceLimiter within RateLimiterRedis options
            // But since our getRedisClient can return null initially, we'll do manual check.
        }

        // Optimization: Create limiters lazily or use wrapper
        // For simplicity and robustness in this phase, we will implement the Singleton pattern properly below

        await getLimiter(keyPrefix, points, duration, fallbackLimiter).consume(ip);
        next();
    } catch (rejRes) {
        // Retry-After header
        if (rejRes instanceof Error) {
            // Internal error (e.g. Redis failed mid-operation), allow or block based on policy
            // Here we choose to log and ALLOW (fail-open) or use fallback manually
            // But getLimiter deals with fallback.
            logger.error(`Rate limiter error: ${rejRes.message}`);
            next(); // Fail-open to avoid blocking legitimate users on system error
        } else {
            // Rate Limited
            const secs = Math.round((rejRes as any).msBeforeNext / 1000) || 1;
            res.set('Retry-After', String(secs));
            res.status(429).json({
                error: 'Too Many Requests',
                message: keyPrefix === 'limit_auth'
                    ? 'Too many login attempts, please try again later'
                    : 'Too many requests, please try again later'
            });
        }
    }
};

// Singleton RateLimiters
let redisAuthLimiter: RateLimiterRedis | null = null;
let redisApiLimiter: RateLimiterRedis | null = null;

const getLimiter = (prefix: string, points: number, duration: number, insurance: RateLimiterMemory) => {
    if (isRedisConnected()) {
        const client = getRedisClient();
        if (client) {
            if (prefix === 'limit_auth') {
                if (!redisAuthLimiter) {
                    redisAuthLimiter = new RateLimiterRedis({
                        storeClient: client,
                        keyPrefix: prefix,
                        points,
                        duration,
                        insuranceLimiter: insurance // Automatic fallback
                    });
                }
                return redisAuthLimiter;
            } else {
                if (!redisApiLimiter) {
                    redisApiLimiter = new RateLimiterRedis({
                        storeClient: client,
                        keyPrefix: prefix,
                        points,
                        duration,
                        insuranceLimiter: insurance
                    });
                }
                return redisApiLimiter;
            }
        }
    }
    // Redis not ready, use memory
    return insurance;
};


/**
 * Auth Limiter: 10 req / 1 hour
 */
export const authLimiter = (req: Request, res: Response, next: NextFunction) => {
    // 10 points, 3600 seconds (1 hour)
    consumeLimiter(req, res, next, 10, 3600, 'limit_auth', memoryAuthLimiter);
};

/**
 * API Limiter: 100 req / 15 mins
 */
export const apiLimiter = (req: Request, res: Response, next: NextFunction) => {
    // 100 points, 900 seconds (15 mins)
    consumeLimiter(req, res, next, 100, 900, 'limit_api', memoryApiLimiter);
};
