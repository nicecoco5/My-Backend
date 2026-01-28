/**
 * Upload Routes
 * Routes for file upload operations
 */

import { Router } from 'express';
import * as uploadController from '../controllers/upload.controller';
import { upload } from '../services/upload.service';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Upload a file (requires authentication)
router.post('/', authMiddleware, upload.single('file'), uploadController.uploadFile);

// Get all uploaded files
router.get('/', authMiddleware, uploadController.getUploadedFiles);

// Delete a file
router.delete('/:filename', authMiddleware, uploadController.deleteFile);

export default router;
