/**
 * Like Controller
 * Handles HTTP requests for like operations
 */

import { Request, Response } from 'express';
import * as likeService from '../services/like.service';

/**
 * @swagger
 * /api/posts/{postId}/like:
 *   post:
 *     summary: 좋아요 토글
 *     description: 게시글에 좋아요를 누르거나 취소합니다
 *     tags: [Likes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 좋아요 토글 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 liked:
 *                   type: boolean
 *                   description: 현재 좋아요 상태
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Liked successfully
 *       401:
 *         description: 인증 필요
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const toggleLike = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'You must be logged in to like a post'
            });
            return;
        }

        const result = await likeService.toggleLike(postId, userId);

        res.status(200).json({
            ...result,
            message: result.liked ? 'Liked successfully' : 'Unliked successfully'
        });
    } catch (error) {
        console.error('❌ Toggle like error:', error);

        if (error instanceof Error && error.message === 'Post not found') {
            res.status(404).json({
                error: 'Not Found',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to toggle like',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

/**
 * @swagger
 * /api/posts/{postId}/likes:
 *   get:
 *     summary: 좋아요 정보 조회
 *     description: 게시글의 좋아요 수와 현재 사용자의 좋아요 상태를 조회합니다
 *     tags: [Likes]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: 게시글 ID
 *     responses:
 *       200:
 *         description: 좋아요 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: 총 좋아요 수
 *                   example: 42
 *                 liked:
 *                   type: boolean
 *                   description: 현재 사용자의 좋아요 여부
 *                   example: true
 *       404:
 *         description: 게시글을 찾을 수 없음
 *       500:
 *         description: 서버 에러
 */
export const getLikeStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const postId = req.params.postId as string;
        const userId = req.user?.id; // Optional - may be undefined for unauthenticated users

        const result = await likeService.getLikeStatus(postId, userId);

        res.status(200).json(result);
    } catch (error) {
        console.error('❌ Get like status error:', error);

        if (error instanceof Error && error.message === 'Post not found') {
            res.status(404).json({
                error: 'Not Found',
                message: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to get like status',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
