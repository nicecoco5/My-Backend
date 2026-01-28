/**
 * Auth Service
 * Business logic for authentication
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../utils/prisma';

/**
 * Find user by email
 */
export const findUserByEmail = async (email: string) => {
    return await prisma.user.findUnique({ where: { email } });
};

/**
 * Find user by ID
 */
export const findUserById = async (id: string) => {
    return await prisma.user.findUnique({ where: { id } });
};


/**
 * Find user by nickname
 */
export const findUserByNickname = async (nickname: string) => {
    return await prisma.user.findUnique({ where: { nickname } });
};

/**
 * Create a new user with hashed password
 */
export const createUser = async (data: {
    email: string;
    password: string;
    nickname?: string;
}) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await prisma.user.create({
        data: {
            email: data.email,
            password: hashedPassword,
            nickname: data.nickname,
        },
    });
};

/**
 * Verify password against hashed password
 */
export const verifyPassword = async (
    plainPassword: string,
    hashedPassword: string
): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Generate JWT access token
 */
export const generateToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
    return jwt.sign(
        { userId },
        config.jwtRefreshSecret,
        { expiresIn: config.jwtRefreshExpiresIn }
    );
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } | null => {
    try {
        const decoded = jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
        return decoded;
    } catch {
        return null;
    }
};

/**
 * Store refresh token in database
 */
export const storeRefreshToken = async (userId: string, token: string): Promise<void> => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
};

/**
 * Rotate refresh token (delete old, create new)
 * Used during token refresh to prevent reuse attacks
 */
export const rotateRefreshToken = async (oldToken: string, userId: string): Promise<string> => {
    // Delete old token
    await deleteRefreshToken(oldToken);

    // Generate new token
    const newToken = generateRefreshToken(userId);

    // Store new token
    await storeRefreshToken(userId, newToken);

    return newToken;
};

/**
 * Revoke refresh token (delete from database)
 * Used during logout
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
    await deleteRefreshToken(token);
};

/**
 * Find refresh token in database
 */
export const findRefreshToken = async (token: string) => {
    return await prisma.refreshToken.findUnique({ where: { token } });
};

/**
 * Delete refresh token from database
 */
export const deleteRefreshToken = async (token: string): Promise<void> => {
    try {
        await prisma.refreshToken.delete({
            where: { token }
        });
    } catch (error) {
        // Token might not exist, which is fine
        console.log('Token not found or already deleted');
    }
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({ where: { userId } });
};

/**
 * Generate password reset token and store in database
 */
export const generatePasswordResetToken = async (userId: string): Promise<string> => {
    // Generate unique token (UUID)
    const token = require('crypto').randomBytes(32).toString('hex');

    // Calculate expiration date (10 minutes from now for security)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // Store in database
    await prisma.passwordResetToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    return token;
};

/**
 * Verify password reset token and check database validity
 */
export const verifyPasswordResetToken = async (token: string): Promise<{ userId: string } | null> => {
    try {
        // Check if token exists in database and is not expired
        const storedToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        if (!storedToken) {
            return null;
        }

        // Check if token is expired
        if (storedToken.expiresAt < new Date()) {
            // Delete expired token
            await prisma.passwordResetToken.delete({ where: { token } });
            return null;
        }

        return { userId: storedToken.userId };
    } catch {
        return null;
    }
};

/**
 * Reset password using reset token
 */
export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
        // Verify token
        const decoded = await verifyPasswordResetToken(token);
        if (!decoded) {
            return false;
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update user password
        await prisma.user.update({
            where: { id: decoded.userId },
            data: { password: hashedPassword },
        });

        // Delete used token
        await prisma.passwordResetToken.delete({ where: { token } });

        return true;
    } catch {
        return false;
    }
};

/**
 * Generate email verification code (6-digit) and store in database
 * Includes email-based rate limiting (3 per hour)
 */
export const generateEmailVerificationToken = async (
    userId: string,
    email: string
): Promise<string> => {
    // Check email-based rate limiting (3 per hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentCodes = await prisma.emailVerificationToken.count({
        where: {
            email,
            createdAt: { gte: oneHourAgo }
        }
    });

    if (recentCodes >= 3) {
        throw new Error('Too many verification emails sent. Please try again later.');
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 5 minutes expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

    await prisma.emailVerificationToken.create({
        data: {
            code,
            email,
            userId,
            expiresAt,
        },
    });

    return code;
};

/**
 * Verify email verification code
 * Uses transaction to atomically update user and delete code
 */
export const verifyEmailToken = async (
    email: string,
    code: string
): Promise<boolean> => {
    try {
        const storedToken = await prisma.emailVerificationToken.findFirst({
            where: {
                email,
                code
            },
        });

        if (!storedToken) {
            return false;
        }

        // Check expiration
        if (storedToken.expiresAt < new Date()) {
            await prisma.emailVerificationToken.delete({
                where: { id: storedToken.id }
            });
            return false;
        }

        // Transaction: Update user emailVerified + delete code
        await prisma.$transaction([
            prisma.user.update({
                where: { id: storedToken.userId },
                data: { emailVerified: true },
            }),
            prisma.emailVerificationToken.delete({
                where: { id: storedToken.id }
            })
        ]);

        return true;
    } catch {
        return false;
    }
};

/**
 * Delete unverified accounts older than 3 days
 * Should be run periodically (cron job or scheduled task)
 */
export const cleanupUnverifiedAccounts = async (): Promise<number> => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const result = await prisma.user.deleteMany({
        where: {
            emailVerified: false,
            createdAt: { lt: threeDaysAgo }
        }
    });

    console.log(`🧹 Cleaned up ${result.count} unverified accounts`);
    return result.count;
};
