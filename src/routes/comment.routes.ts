/**
 * Comment Routes
 * Routes for comment operations
 */

import { Router } from 'express';
import * as commentController from '../controllers/comment.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Comments for a post - nested under /api/posts/:postId/comments
router.post('/:postId/comments', authMiddleware, commentController.createComment);
router.get('/:postId/comments', commentController.getComments);

export default router;
