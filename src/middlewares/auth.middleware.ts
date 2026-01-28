/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user info to requests
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { findUserById } from '../services/auth.service';
import prisma from '../utils/prisma';
import { JwtPayload } from '../types/auth.types';

/**
 * JWT Authentication Middleware
 * Protects routes by requiring a valid JWT token
 * 
 * Usage:
 * router.get('/protected', authMiddleware, controller);
 */
export const authMiddleware = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        // 1. Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(401).json({
                error: 'Authentication Required',
                message: 'No token provided'
            });
            return;
        }

        // 2. Validate Bearer token format
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid token format. Use: Bearer <token>'
            });
            return;
        }

        const token = parts[1];

        // 3. Verify token
        let decoded: JwtPayload;
        try {
            decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
        } catch (error) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'Invalid or expired token'
            });
            return;
        }

        // 4. Fetch user from database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                email: true,
                nickname: true,
                createdAt: true,
                updatedAt: true,
                // password excluded for security
            }
        });

        if (!user) {
            res.status(401).json({
                error: 'Authentication Failed',
                message: 'User not found'
            });
            return;
        }

        // 5. Attach user to request object
        req.user = user;

        // 6. Continue to next middleware/controller
        next();

    } catch (error) {
        console.error('❌ Auth middleware error:', error);
        res.status(500).json({
            error: 'Authentication Error',
            message: 'Internal server error during authentication'
        });
    }
};
