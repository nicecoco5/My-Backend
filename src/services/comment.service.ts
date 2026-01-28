/**
 * Comment Service
 * Business logic for comment operations
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Types
export interface CreateCommentInput {
    content: string;
    postId: string;
    authorId: string;
}

export interface UpdateCommentInput {
    content: string;
}

/**
 * Create a new comment
 */
export const createComment = async (data: CreateCommentInput) => {
    // Check if post exists
    const post = await prisma.post.findUnique({
        where: { id: data.postId }
    });

    if (!post) {
        throw new Error('Post not found');
    }

    const comment = await prisma.comment.create({
        data: {
            content: data.content,
            postId: data.postId,
            authorId: data.authorId
        },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    nickname: true
                }
            }
        }
    });

    return comment;
};

/**
 * Get comments for a post
 */
export const getComments = async (postId: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    // Check if post exists
    const post = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!post) {
        throw new Error('Post not found');
    }

    const [comments, total] = await Promise.all([
        prisma.comment.findMany({
            where: { postId },
            skip,
            take: limit,
            orderBy: { createdAt: 'asc' },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        nickname: true
                    }
                }
            }
        }),
        prisma.comment.count({ where: { postId } })
    ]);

    return {
        comments,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
};

/**
 * Update a comment
 */
export const updateComment = async (commentId: string, authorId: string, data: UpdateCommentInput) => {
    const existingComment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!existingComment) {
        throw new Error('Comment not found');
    }

    if (existingComment.authorId !== authorId) {
        throw new Error('Not authorized to update this comment');
    }

    const updatedComment = await prisma.comment.update({
        where: { id: commentId },
        data: { content: data.content },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    nickname: true
                }
            }
        }
    });

    return updatedComment;
};

/**
 * Delete a comment
 */
export const deleteComment = async (commentId: string, authorId: string) => {
    const existingComment = await prisma.comment.findUnique({
        where: { id: commentId }
    });

    if (!existingComment) {
        throw new Error('Comment not found');
    }

    if (existingComment.authorId !== authorId) {
        throw new Error('Not authorized to delete this comment');
    }

    await prisma.comment.delete({
        where: { id: commentId }
    });

    return true;
};
