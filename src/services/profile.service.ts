/**
 * Profile Service
 * Business logic for user profile operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types
export interface UpdateProfileInput {
    nickname?: string;
    bio?: string;
}

/**
 * Get user profile by ID
 */
export const getProfileById = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            nickname: true,
            bio: true,
            profileImage: true,
            emailVerified: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    comments: true
                }
            }
        }
    });

    return user;
};

/**
 * Get user profile by nickname
 */
export const getProfileByNickname = async (nickname: string) => {
    const user = await prisma.user.findUnique({
        where: { nickname },
        select: {
            id: true,
            email: true,
            nickname: true,
            bio: true,
            profileImage: true,
            createdAt: true,
            _count: {
                select: {
                    posts: true,
                    comments: true
                }
            }
        }
    });

    return user;
};

/**
 * Update user profile
 */
export const updateProfile = async (userId: string, data: UpdateProfileInput) => {
    // Check if nickname is already taken by another user
    if (data.nickname) {
        const existingUser = await prisma.user.findUnique({
            where: { nickname: data.nickname }
        });

        if (existingUser && existingUser.id !== userId) {
            throw new Error('Nickname is already taken');
        }
    }

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
            ...(data.nickname !== undefined && { nickname: data.nickname }),
            ...(data.bio !== undefined && { bio: data.bio })
        },
        select: {
            id: true,
            email: true,
            nickname: true,
            bio: true,
            profileImage: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true
        }
    });

    return updatedUser;
};

/**
 * Update profile image
 */
export const updateProfileImage = async (userId: string, imageUrl: string) => {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileImage: imageUrl },
        select: {
            id: true,
            email: true,
            nickname: true,
            bio: true,
            profileImage: true,
            createdAt: true
        }
    });

    return updatedUser;
};

/**
 * Remove profile image
 */
export const removeProfileImage = async (userId: string) => {
    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileImage: null },
        select: {
            id: true,
            email: true,
            nickname: true,
            bio: true,
            profileImage: true,
            createdAt: true
        }
    });

    return updatedUser;
};
