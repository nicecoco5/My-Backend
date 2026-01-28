/**
 * Like Routes
 * Routes for like operations
 */

import { Router } from 'express';
import * as likeController from '../controllers/like.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Likes for a post - nested under /api/posts/:postId
router.post('/:postId/like', authMiddleware, likeController.toggleLike);
router.get('/:postId/likes', likeController.getLikeStatus);

export default router;
