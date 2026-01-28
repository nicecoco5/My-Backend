/**
 * Notification Routes
 */

import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

router.get('/', notificationController.getMyNotifications);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotification);

export default router;
