/**
 * Like Service
 * Business logic for like operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Toggle like on a post
 * If already liked, unlike. If not liked, like.
 */
export const toggleLike = async (postId: string, userId: string) => {
    // Check if post exists
    const post = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!post) {
        throw new Error('Post not found');
    }

    // Check if user already liked this post
    const existingLike = await prisma.like.findUnique({
        where: {
            postId_userId: {
                postId,
                userId
            }
        }
    });

    if (existingLike) {
        // Unlike
        await prisma.like.delete({
            where: { id: existingLike.id }
        });
        return { liked: false };
    } else {
        // Like
        await prisma.like.create({
            data: {
                postId,
                userId
            }
        });
        return { liked: true };
    }
};

/**
 * Get like status and count for a post
 */
export const getLikeStatus = async (postId: string, userId?: string) => {
    // Check if post exists
    const post = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!post) {
        throw new Error('Post not found');
    }

    const count = await prisma.like.count({
        where: { postId }
    });

    let liked = false;
    if (userId) {
        const existingLike = await prisma.like.findUnique({
            where: {
                postId_userId: {
                    postId,
                    userId
                }
            }
        });
        liked = !!existingLike;
    }

    return {
        count,
        liked
    };
};
