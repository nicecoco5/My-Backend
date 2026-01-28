/**
 * Profile Routes
 * Routes for user profile operations
 */

import { Router } from 'express';
import * as profileController from '../controllers/profile.controller';
import { upload } from '../services/upload.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Get my profile (protected)
router.get('/', authMiddleware, profileController.getMyProfile);

// Update my profile (protected)
router.put('/', authMiddleware, profileController.updateProfile);

// Update profile image (protected)
router.put('/image', authMiddleware, upload.single('file'), profileController.updateProfileImage);

// Delete profile image (protected)
router.delete('/image', authMiddleware, profileController.deleteProfileImage);

// Get user profile by ID (public)
router.get('/:id', profileController.getProfile);

export default router;
