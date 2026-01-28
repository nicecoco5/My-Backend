/**
 * Post Controller
 * Handles HTTP requests for post operations
 */

import { Request, Response } from 'express';
import * as postService from '../services/post.service';

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: 게시글 작성
 *     description: 새로운 게시글을 작성합니다
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *                 example: 첫 번째 게시글
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 10000
 *                 example: 안녕하세요! 첫 번째 게시글입니다.
 *     responses:
 *       201:
 *         description: 게시글 작성 성공
 *       400:
 *         description: 유효성 검증 실패
 *       401:
 *         description: 인증 필요
 *       500:
 *         description: 서버 에러
 */
export const createPost = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, content } = req.body;
        const authorId = req.user?.id;

        // Validate authentication
        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to create a post'
            });
            return;
        }

        // Validate input
        if (!title || !content) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Title and content are required'
            });
            return;
        }

        if (title.length > 100) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Title must be 100 characters or less'
            });
            return;
        }

        if (content.length > 10000) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Content must be 10000 characters or less'
            });
            return;
        }

        const post = await postService.createPost({ title, content, authorId });

        res.status(201).json({
            message: 'Post created successfully',
            post
        });
    } catch (error) {
        console.error('❌ Create post error:', error);
        res.status(500).json({
            error: 'Failed to create post',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: 게시글 목록 및 검색
 *     description: 게시글 목록을 페이지네이션으로 조회하거나 키워드로 검색합니다
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: 검색어 (제목/내용에서 검색)
 *         example: 안녕하세요
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 페이지 번호
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: 페이지당 게시글 수
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *         description: 특정 작성자의 게시글만 조회
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, likes]
 *           default: createdAt
 *         description: 정렬 기준 (createdAt=최신순, likes=인기순)
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: 정렬 순서
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                 search:
 *                   type: object
 *                   properties:
 *                     keyword:
 *                       type: string
 *       500:
 *         description: 서버 에러
 */
export const getPosts = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const keyword = req.query.q as string | undefined;
        const authorId = req.query.authorId as string | undefined;
        const sortBy = req.query.sortBy as 'createdAt' | 'likes' | undefined;
        const order = req.query.order as 'asc' | 'desc' | undefined;

        const result = await postService.getPosts({
            page,
            limit: Math.min(limit, 50), // Max 50 per page
            keyword,
            authorId,
            sortBy,
            order
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('❌ Get posts error:', error);
        res.status(500).json({
            error: 'Failed to get posts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: 게시글 상세
 *     description: 특정 게시글을 조회합니다
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 게시글 조회 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const getPostById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;

        const post = await postService.getPostById(id);

        if (!post) {
            res.status(404).json({
                error: 'Not Found',
                message: 'Post not found'
            });
            return;
        }

        res.status(200).json({ post });
    } catch (error) {
        console.error('❌ Get post error:', error);
        res.status(500).json({
            error: 'Failed to get post',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   put:
 *     summary: 게시글 수정
 *     description: 자신이 작성한 게시글을 수정합니다
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 수정된 제목
 *               content:
 *                 type: string
 *                 example: 수정된 내용입니다.
 *     responses:
 *       200:
 *         description: 수정 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음 (작성자만 수정 가능)
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const updatePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { title, content } = req.body;
        const authorId = req.user?.id;

        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to update a post'
            });
            return;
        }

        if (!title && !content) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'At least one field (title or content) is required'
            });
            return;
        }

        const post = await postService.updatePost(id, authorId, { title, content });

        res.status(200).json({
            message: 'Post updated successfully',
            post
        });
    } catch (error) {
        console.error('❌ Update post error:', error);

        if (error instanceof Error) {
            if (error.message === 'Post not found') {
                res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
                return;
            }
            if (error.message === 'Not authorized to update this post') {
                res.status(403).json({
                    error: 'Forbidden',
                    message: error.message
                });
                return;
            }
        }

        res.status(500).json({
            error: 'Failed to update post',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts/{id}:
 *   delete:
 *     summary: 게시글 삭제
 *     description: 자신이 작성한 게시글을 삭제합니다
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음 (작성자만 삭제 가능)
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const deletePost = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const authorId = req.user?.id;

        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to delete a post'
            });
            return;
        }

        await postService.deletePost(id, authorId);

        res.status(200).json({
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete post error:', error);

        if (error instanceof Error) {
            if (error.message === 'Post not found') {
                res.status(404).json({
                    error: 'Not Found',
                    message: error.message
                });
                return;
            }
            if (error.message === 'Not authorized to delete this post') {
                res.status(403).json({
                    error: 'Forbidden',
                    message: error.message
                });
                return;
            }
        }

        res.status(500).json({
            error: 'Failed to delete post',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
