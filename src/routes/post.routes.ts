/**
 * Post Routes
 * Routes for post operations
 */

import { Router } from 'express';
import * as postController from '../controllers/post.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', postController.getPosts);
router.get('/:id', postController.getPostById);

// Protected routes (require authentication)
router.post('/', authMiddleware, postController.createPost);
router.put('/:id', authMiddleware, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

export default router;
