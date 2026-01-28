/**
 * Comment Controller
 * Handles HTTP requests for comment operations
 */

import { Request, Response } from 'express';
import * as commentService from '../services/comment.service';

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   post:
 *     summary: 댓글 작성
 *     description: 게시글에 새로운 댓글을 작성합니다
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
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
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *                 example: 좋은 글이네요!
 *     responses:
 *       201:
 *         description: 댓글 작성 성공
 *       400:
 *         description: 유효성 검증 실패
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const createComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const { content } = req.body;
        const authorId = req.user?.id;

        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to create a comment'
            });
            return;
        }

        if (!content || content.trim().length === 0) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Content is required'
            });
            return;
        }

        if (content.length > 1000) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Content must be 1000 characters or less'
            });
            return;
        }

        const comment = await commentService.createComment({
            content: content.trim(),
            postId,
            authorId
        });

        res.status(201).json({
            message: 'Comment created successfully',
            comment
        });
    } catch (error) {
        console.error('❌ Create comment error:', error);

        if (error instanceof Error && error.message === 'Post not found') {
            res.status(404).json({
                error: 'Not Found',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to create comment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts/{postId}/comments:
 *   get:
 *     summary: 댓글 목록
 *     description: 게시글의 댓글 목록을 조회합니다
 *     tags: [Comments]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
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
 *           default: 20
 *         description: 페이지당 댓글 수
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const getComments = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        const result = await commentService.getComments(postId, page, limit);

        res.status(200).json(result);
    } catch (error) {
        console.error('❌ Get comments error:', error);

        if (error instanceof Error && error.message === 'Post not found') {
            res.status(404).json({
                error: 'Not Found',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to get comments',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: 댓글 수정
 *     description: 자신이 작성한 댓글을 수정합니다
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 example: 수정된 댓글입니다.
 *     responses:
 *       200:
 *         description: 댓글 수정 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 댓글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const updateComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const { content } = req.body;
        const authorId = req.user?.id;

        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to update a comment'
            });
            return;
        }

        if (!content || content.trim().length === 0) {
            res.status(400).json({
                error: 'Validation Error',
                message: 'Content is required'
            });
            return;
        }

        const comment = await commentService.updateComment(id, authorId, { content: content.trim() });

        res.status(200).json({
            message: 'Comment updated successfully',
            comment
        });
    } catch (error) {
        console.error('❌ Update comment error:', error);

        if (error instanceof Error) {
            if (error.message === 'Comment not found') {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error.message === 'Not authorized to update this comment') {
                res.status(403).json({ error: 'Forbidden', message: error.message });
                return;
            }
        }

        res.status(500).json({
            error: 'Failed to update comment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: 댓글 삭제
 *     description: 자신이 작성한 댓글을 삭제합니다
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 댓글 ID
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 *       401:
 *         description: 인증 필요
 *       403:
 *         description: 권한 없음
 *       404:
 *         description: 댓글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = req.params.id as string;
        const authorId = req.user?.id;

        if (!authorId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to delete a comment'
            });
            return;
        }

        await commentService.deleteComment(id, authorId);

        res.status(200).json({
            message: 'Comment deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete comment error:', error);

        if (error instanceof Error) {
            if (error.message === 'Comment not found') {
                res.status(404).json({ error: 'Not Found', message: error.message });
                return;
            }
            if (error.message === 'Not authorized to delete this comment') {
                res.status(403).json({ error: 'Forbidden', message: error.message });
                return;
            }
        }

        res.status(500).json({
            error: 'Failed to delete comment',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
