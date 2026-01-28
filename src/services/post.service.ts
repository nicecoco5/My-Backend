/**
 * Post Service
 * Business logic for post operations
 */

import { PrismaClient } from '@prisma/client';
import { cacheGet, cacheSet, cacheDelPattern, cacheKeys } from './redis.service';

const prisma = new PrismaClient();

// Cache TTL (5 minutes for lists, 10 minutes for details)
const CACHE_TTL_LIST = 300;
const CACHE_TTL_DETAIL = 600;

// Types
export interface CreatePostInput {
    title: string;
    content: string;
    authorId: string;
}

export interface UpdatePostInput {
    title?: string;
    content?: string;
}

export interface GetPostsOptions {
    page?: number;
    limit?: number;
    authorId?: string;
    keyword?: string;  // Search in title and content
    sortBy?: 'createdAt' | 'likes';
    order?: 'asc' | 'desc';
}

/**
 * Create a new post
 */
export const createPost = async (data: CreatePostInput) => {
    const post = await prisma.post.create({
        data: {
            title: data.title,
            content: data.content,
            authorId: data.authorId
        },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    nickname: true
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            }
        }
    });

    // Invalidate posts list cache
    await cacheDelPattern(cacheKeys.postsPattern());

    return post;
};

/**
 * Get posts with pagination and search
 */
export const getPosts = async (options: GetPostsOptions = {}) => {
    const {
        page = 1,
        limit = 10,
        authorId,
        keyword,
        sortBy = 'createdAt',
        order = 'desc'
    } = options;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (authorId) {
        where.authorId = authorId;
    }

    // Keyword search in title OR content
    if (keyword && keyword.trim()) {
        where.OR = [
            { title: { contains: keyword.trim(), mode: 'insensitive' } },
            { content: { contains: keyword.trim(), mode: 'insensitive' } }
        ];
    }

    const [posts, total] = await Promise.all([
        prisma.post.findMany({
            where,
            skip,
            take: limit,
            orderBy: sortBy === 'likes'
                ? { likes: { _count: order } }
                : { createdAt: order },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        nickname: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        likes: true
                    }
                }
            }
        }),
        prisma.post.count({ where })
    ]);

    return {
        posts,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1
        },
        search: keyword ? { keyword: keyword.trim() } : undefined
    };
};

/**
 * Get a single post by ID
 */
export const getPostById = async (postId: string) => {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    nickname: true
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            }
        }
    });

    return post;
};

/**
 * Update a post
 */
export const updatePost = async (postId: string, authorId: string, data: UpdatePostInput) => {
    // First check if the post exists and belongs to the author
    const existingPost = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!existingPost) {
        throw new Error('Post not found');
    }

    if (existingPost.authorId !== authorId) {
        throw new Error('Not authorized to update this post');
    }

    const updatedPost = await prisma.post.update({
        where: { id: postId },
        data: {
            ...(data.title && { title: data.title }),
            ...(data.content && { content: data.content })
        },
        include: {
            author: {
                select: {
                    id: true,
                    email: true,
                    nickname: true
                }
            },
            _count: {
                select: {
                    comments: true,
                    likes: true
                }
            }
        }
    });

    return updatedPost;
};

/**
 * Delete a post
 */
export const deletePost = async (postId: string, authorId: string) => {
    // First check if the post exists and belongs to the author
    const existingPost = await prisma.post.findUnique({
        where: { id: postId }
    });

    if (!existingPost) {
        throw new Error('Post not found');
    }

    if (existingPost.authorId !== authorId) {
        throw new Error('Not authorized to delete this post');
    }

    await prisma.post.delete({
        where: { id: postId }
    });

    return true;
};
