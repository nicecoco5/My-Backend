/**
 * Notification Service
 * Handles notification creation, retrieval, and updates
 */

import { PrismaClient } from '@prisma/client';
import prisma from '../utils/prisma';

export interface CreateNotificationDto {
    recipientId: string;
    senderId?: string;
    type: 'COMMENT' | 'REPLY' | 'LIKE';
    postId?: string;
    content?: string;
}

/**
 * Create a new notification
 */
export const createNotification = async (data: CreateNotificationDto) => {
    // Don't notify if user performs action on their own content
    if (data.senderId === data.recipientId) {
        return null;
    }

    try {
        return await prisma.notification.create({
            data: {
                recipientId: data.recipientId,
                senderId: data.senderId,
                type: data.type,
                postId: data.postId,
                content: data.content
            }
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
        // Fail silently - notifications shouldn't block main actions
        return null;
    }
};

/**
 * Get user's notifications
 */
export const getUserNotifications = async (userId: string, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                sender: {
                    select: {
                        id: true,
                        nickname: true,
                        profileImage: true
                    }
                },
                post: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            }
        }),
        prisma.notification.count({ where: { recipientId: userId } })
    ]);

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
        where: { recipientId: userId, isRead: false }
    });

    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        },
        unreadCount
    };
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId: string, userId: string) => {
    return await prisma.notification.updateMany({
        where: {
            id: notificationId,
            recipientId: userId
        },
        data: {
            isRead: true
        }
    });
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (userId: string) => {
    return await prisma.notification.updateMany({
        where: {
            recipientId: userId,
            isRead: false
        },
        data: {
            isRead: true
        }
    });
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId: string, userId: string) => {
    return await prisma.notification.deleteMany({
        where: {
            id: notificationId,
            recipientId: userId
        }
    });
};
