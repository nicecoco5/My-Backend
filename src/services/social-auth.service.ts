/**
 * Social Auth Service
 * Handles social login user management
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface SocialUserProfile {
    provider: 'google' | 'kakao';
    socialId: string;
    email: string;
    displayName?: string;
    profileImage?: string;
}

/**
 * Find existing user or create new one from social login
 */
export const findOrCreateSocialUser = async (profile: SocialUserProfile) => {
    // First, try to find by social provider and ID
    let user = await prisma.user.findFirst({
        where: {
            socialProvider: profile.provider,
            socialId: profile.socialId
        }
    });

    if (user) {
        return user;
    }

    // Check if user exists with same email
    user = await prisma.user.findUnique({
        where: { email: profile.email }
    });

    if (user) {
        // Link social account to existing user
        user = await prisma.user.update({
            where: { id: user.id },
            data: {
                socialProvider: profile.provider,
                socialId: profile.socialId,
                profileImage: user.profileImage || profile.profileImage,
                emailVerified: true  // Social login emails are verified
            }
        });
        return user;
    }

    // Create new user
    user = await prisma.user.create({
        data: {
            email: profile.email,
            nickname: profile.displayName?.replace(/\s+/g, '_').toLowerCase() || null,
            socialProvider: profile.provider,
            socialId: profile.socialId,
            profileImage: profile.profileImage,
            emailVerified: true,
            password: null  // No password for social login users
        }
    });

    return user;
};

/**
 * Generate JWT tokens for social login user
 */
export const generateSocialLoginTokens = (userId: string) => {
    const accessToken = jwt.sign(
        { id: userId },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
        { id: userId },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || 'refresh-secret',
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};
