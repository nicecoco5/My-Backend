/**
 * Notification Controller
 * Handles notification-related API requests
 */

import { Request, Response } from 'express';
import * as notificationService from '../services/notification.service';

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get my notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: List of notifications
 */
export const getMyNotifications = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;

        const result = await notificationService.getUserNotifications(userId, page, limit);

        res.json(result);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to retrieve notifications' });
    }
};

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
export const markAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id as string;

        await notificationService.markAsRead(notificationId, userId);

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;

        await notificationService.markAllAsRead(userId);

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all notifications read error:', error);
        res.status(500).json({ error: 'Failed to update notifications' });
    }
};

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */
export const deleteNotification = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.user!.id;
        const notificationId = req.params.id as string;

        await notificationService.deleteNotification(notificationId, userId);

        res.json({ message: 'Notification deleted' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
};
